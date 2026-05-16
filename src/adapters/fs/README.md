# `src/adapters/fs/` — File system adapters

This folder holds adapters that read from and write to the file system.

## Terms

| Term | Definition |
|---|---|
| File system | The local disk. Reading files. Writing files. |
| Atomic write | A write that either fully succeeds or has no visible effect. Prevents partial-write corruption. |
| Symbolic link | A file that points to another file. |
| Allowlist | A list of paths or roots where writes are permitted. Anything outside is rejected. |
| Path policy | The rule for which paths are writable. |

## Files in this folder

| File | Purpose |
|---|---|
| `FileSkillRepository.ts` | Reads each `skills/<skill-id>/{skill.yaml, prompt.md}` and returns `Skill` objects. |
| `FsInstaller.ts` | Takes a list of `RenderResult` objects and writes them to disk under a given output root. |
| `paths.ts` | Defines the writable-path allowlist. Provides `assertAllowed(path)` to check paths. |

## What these adapters know

These adapters know:

- The on-disk layout for skills: each skill is one directory with
  `skill.yaml` and `prompt.md` inside.
- How to parse YAML files (using the `yaml` npm package).
- How to write files atomically by writing to a temporary file and then
  renaming it to the final path.

## What these adapters do NOT know

These adapters do not know:

- What a "skill" means as a domain concept. That is the `Skill` class
  in `src/domain/skill/Skill.ts`.
- Which AI host the output is for. That is the `claude-code` adapter's
  concern.

## Path policy (security boundary)

The function `assertAllowed` in `paths.ts` is the security boundary
between the application code and the file system. Any output path
passed to `FsInstaller` must be inside one of these roots:

| Root | Use |
|---|---|
| `<current working directory>/.claude/skills/` | Local install for the current project |
| `<home directory>/.claude/skills/dstack/` | Global install for Claude Code |
| `<home directory>/.dstack/skills/` | dstack's own home directory |

Attempting to write outside these roots throws a `PathPolicyError`.

This boundary exists because the domain layer has no path knowledge. A
bug in any adapter that tried to write to `/etc/passwd` or
`~/.ssh/config` would be caught here, not in production.

The check uses prefix-with-separator matching. A path like
`/home/user/.claude/skills` does not match a path that starts with
`/home/user/.claude/skillsbackup`, because the trailing separator is
required.

## Atomic writes

`FsInstaller` writes each output file in two steps:

1. Write the content to a temporary file named `<final>.tmp.<pid>`.
2. Rename the temporary file to the final path.

The rename operation is atomic on POSIX file systems within the same
file system. This prevents readers from seeing a partially-written
file.

If a write fails partway through a batch, the result is a mix of new
and old files on disk. The next successful build will fix this. We
accept this behavior because:

- Builds are run frequently. The window of inconsistency is small.
- A full staging directory plus rename-on-success would be more
  complex. Adding that complexity is reserved for the day when a real
  partial-write problem appears.

## Cross-references

- [docs/specs/install-spec.md](../../../docs/specs/install-spec.md) —
  the full install contract this folder implements.
- [docs/specs/skill-spec.md](../../../docs/specs/skill-spec.md) — the
  on-disk skill format this folder reads.
- [ADR-0001](../../../docs/adr/0001-hexagonal-layered.md) — the
  layered architecture rules.
