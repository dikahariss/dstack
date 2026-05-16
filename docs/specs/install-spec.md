# Install specification

This document defines how rendered output reaches disk. It describes
the `Installer` port, the atomic-write protocol, idempotency rules,
and the path policy that guards file system writes.

This spec is one of four. The others are:

- [skill-spec.md](skill-spec.md) — the input format the renderer reads.
- [host-spec.md](host-spec.md) — what defines a target host.
- [render-spec.md](render-spec.md) — the pipeline that produces output.

## Terms used in this document

| Term | Definition |
|---|---|
| Installer | A component that takes `RenderResult` objects and writes them to disk. Implements the `Installer` port. |
| Installer port | A TypeScript interface defined at `src/domain/host/ports.ts`. |
| File system installer | The concrete installer for v0: `src/adapters/fs/FsInstaller.ts`. Writes to local disk. |
| Output root | The directory under which the installer writes rendered output. Comes from `Host.outputRoot`. See [host-spec.md](host-spec.md). |
| Atomic write | A write that either fully succeeds or has no visible effect. Prevents partial-write corruption. |
| Idempotent | Running the operation twice has the same effect as running it once. |
| Path policy | The rules for which file system paths the installer is allowed to write to. |
| Orphan | A file under the output root that no longer corresponds to any skill. Created by a previous install that included a skill which has since been removed. |

## What the installer does

The installer takes a list of `RenderResult` objects (from the renderer)
and writes them under a given output root. It returns an `InstallReport`.

```typescript
interface Installer {
  install(
    outputRoot: string,
    results: readonly RenderResult[]
  ): Promise<InstallReport>;
}

interface InstallReport {
  outputRoot: string;     // The absolute resolved path that was written to.
  written: number;        // Files that were created or updated.
  skipped: number;        // Files that already had the correct content.
  removed: number;        // Orphan directories that were deleted.
}
```

The installer does not render. It does not parse YAML. It does not
know what a `Skill` is. It only writes bytes to paths.

## Inputs

The installer receives two values:

1. `outputRoot`: a directory path. May be relative or absolute. Will
   be resolved to an absolute path before any work begins.
2. `results`: an immutable list of `RenderResult` objects, each with
   `path`, `content`, `tokenCount`, and `warnings` fields.

The `path` field on each `RenderResult` is relative to `outputRoot`. The
installer joins them to compute the full target path. For example, if
`outputRoot` is `/home/user/.claude/skills` and the result's `path` is
`ship/SKILL.md`, the full target is
`/home/user/.claude/skills/ship/SKILL.md`.

## Outputs

The installer returns an `InstallReport`. The three counts describe what
happened during this run:

| Count | Definition |
|---|---|
| `written` | Files that were created or whose content was changed. |
| `skipped` | Files that already existed with the exact same content. No write performed. |
| `removed` | Directories under `outputRoot` that did not correspond to any skill in the input. These were deleted. |

## Algorithm

The installer performs these steps in order.

### Step 1. Resolve and validate the output root

The installer converts `outputRoot` to an absolute path and calls
`assertAllowed(outputRoot)`. See "Path policy" below.

If the path is not under one of the allowed roots, the installer raises
`PathPolicyError` and exits. No writes happen.

### Step 2. Create the output root directory

The installer calls `mkdirSync(outputRoot, { recursive: true })`. This
creates the directory if it does not exist. It does nothing if the
directory already exists.

### Step 3. Write each rendered file

For each `RenderResult` in the input list:

1. Compute the full target path:
   `<outputRoot>/<result.path>`.
2. Call `assertAllowed(fullPath)`. Reject if the path escapes the
   allowed roots (defense in depth against malformed `path` values).
3. Create the parent directory if needed.
4. Track the top-level directory name (the part right after
   `outputRoot`). This is used in Step 4 to compute orphans.
5. If a file already exists at `fullPath` with byte-identical content,
   increment `skipped` and continue.
6. Otherwise, perform an atomic write (see "Atomic write protocol"
   below) and increment `written`.

### Step 4. Remove orphans

After writing every result, the installer lists every direct child
directory under `outputRoot`. For each directory whose name is not in
the set tracked in Step 3:

1. Delete the directory recursively.
2. Increment `removed`.

This step deletes directories that existed from a previous install but
are no longer referenced by any skill.

Files starting with `.` (such as `.git` or `.DS_Store`) are skipped
and never deleted, even if orphaned. This avoids breaking unrelated
tools.

### Step 5. Return the report

Return the `InstallReport` with the three counts and the resolved
output root path.

## Atomic write protocol

A naive write (`writeFileSync(path, content)`) can leave a file in a
partially-written state if the process crashes during the write. A
reader could see half a file. The installer avoids this with a two-step
protocol.

For each file to be written:

1. Write the content to a temporary file. The temporary name is
   `<finalPath>.tmp.<processId>`. Using the process id avoids
   collisions if two installs run at the same time (though
   concurrent installs are not supported behavior).
2. Rename the temporary file to the final path. The rename is atomic
   on POSIX file systems within the same file system.

After the rename, a reader either sees the old content or the new
content, never a partial mix.

### Limitation

If the process dies between writing some files and the rename of
others, the result on disk is a mix of new and old files. The next
successful `dstack build` run will reconcile this by writing every
file again.

We accept this behavior because:

- Builds run quickly. The window of inconsistency is short.
- A full staging directory plus swap-on-success would be more complex
  to implement. We defer this work until a real partial-write problem
  appears.

## Idempotency

The installer is idempotent. Running it twice with the same input has
the same effect as running it once. The second run reports
`written: 0, skipped: N` for all unchanged files.

This property is checked by reading the existing file content and
comparing byte-for-byte. The check is fast: file reads under
`outputRoot` are limited to small Markdown files.

## Orphan removal

A directory under `outputRoot` is an "orphan" if no `RenderResult` in
the current input has a `path` starting with that directory's name.

Why orphans happen:

- A skill that existed yesterday has been deleted.
- A skill was renamed.
- The user pointed the install at a directory that has other content.

The installer removes orphan directories so that the output stays in
sync with the current skill catalog.

Files starting with `.` are excluded from orphan checks. This protects
tool-specific metadata (`.git`, `.DS_Store`, `.claude/scheduled_tasks.lock`,
etc.) from accidental deletion.

## Path policy

The installer checks every path against an allowlist before writing.
This is the security boundary that prevents an adapter bug from writing
outside the intended directories.

The policy is implemented in `src/adapters/fs/paths.ts`. The function
`assertAllowed(path)` returns the resolved path if the path is under an
allowed root, or throws `PathPolicyError` if not.

### Allowed roots

| Root | Use case |
|---|---|
| `<current working directory>/.claude/skills/` | Local install (per-project) |
| `<home directory>/.claude/skills/dstack/` | Global install (per-user) |
| `<home directory>/.dstack/skills/` | dstack's own directory (reserved for future use) |

A path is allowed if it is one of the roots, or if it is a descendant
of one of the roots.

### Why prefix matching is not enough

A naive prefix check (`path.startsWith(allowedRoot)`) can match unwanted
paths. For example, if the allowed root is `/home/user/.claude/skills`,
the path `/home/user/.claude/skillsbackup` starts with the allowed root
but is not a descendant.

The correct check uses the path separator: the path must either equal
the root, or start with `<root><separator>`. The implementation in
`assertAllowed` performs exactly this check.

### What happens on a policy violation

`assertAllowed` throws `PathPolicyError`. The error includes the
attempted path and the list of allowed roots. The install aborts
without writing or deleting anything.

## Errors raised by the installer

| Error class | When raised |
|---|---|
| `PathPolicyError(attempted, allowed)` | The `outputRoot` or a computed file path is outside the allowed roots. |
| `Error (generic)` | A file system operation failed (disk full, permissions, etc.). The installer does not wrap these in typed errors today. |

The plan for v1 is to wrap file system errors in typed installer
errors. See `docs/plans/v1/ROADMAP.md` (no current milestone; a candidate for
v1.x).

## Concurrent install behavior

The installer does not support concurrent runs. Running two
`dstack build` commands in parallel against the same `outputRoot` is
undefined behavior. The temporary file naming uses the process id,
which avoids one specific race (two processes writing to the same
temp name), but other races exist (Step 4 orphan detection sees
files from the other process).

If concurrent installs become a real need, the right approach is a
file system lock. This is not in v1 scope.

## How the renderer and installer interact

The renderer produces all `RenderResult` objects in memory first. Only
when every skill renders successfully does the installer start writing.
This is the "all or nothing per build" guarantee.

A failure during rendering leaves the previous output on disk
untouched. A failure during installation may leave a partial write
(see "Atomic write protocol" limitation above).

## Future installers

The `Installer` port is in place to support alternatives. Examples that
might be added later:

- **ManifestInstaller**: writes a single JSON manifest listing all
  skills, instead of one file per skill. Useful for hosts that read
  manifests instead of file trees.
- **HttpInstaller**: pushes rendered output to a remote endpoint.
  Useful for shared team installs.

Each new installer would implement the `Installer` port and pass the
shared contract suite at `test/contract/Installer.contract.ts`
(planned milestone M9).

## Cross-references

- [skill-spec.md](skill-spec.md) — the input format whose render
  produces what the installer writes.
- [host-spec.md](host-spec.md) — defines `outputRoot` for each host.
- [render-spec.md](render-spec.md) — produces the `RenderResult`
  objects the installer consumes.
- [ADR-0001](../adr/0001-hexagonal-layered.md) — the layered design
  that makes `Installer` a port.
- `src/adapters/fs/README.md` — adapter-level documentation, including
  the path policy.
- `docs/plans/v1/ROADMAP.md` M9 — the planned contract suite for `Installer`.
