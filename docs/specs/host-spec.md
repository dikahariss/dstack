# Host specification

This document defines what a "host" is in dstack, and what each host
adapter must provide. A host is the AI agent that consumes rendered
skills. Today the only host is Claude Code.

This spec is one of four. The others are:

- [skill-spec.md](skill-spec.md) — the input format the renderer reads.
- [render-spec.md](render-spec.md) — the pipeline that produces output.
- [install-spec.md](install-spec.md) — how output is written to disk.

## Terms used in this document

| Term | Definition |
|---|---|
| Host | An AI agent that runs skills. Examples: Claude Code, Codex, Kiro. |
| Host adapter | The TypeScript code that produces output for one specific host. Located under `src/adapters/<host-name>/`. |
| Tool | A capability the host provides to the LLM. Examples: `Bash`, `Edit`, `Read`. |
| Tool registry | The list of tool names the host recognizes. Skills are validated against this list. |
| Frontmatter | A YAML block at the top of a Markdown file, between `---` fences. |
| Output root | The directory under which the host expects rendered skills to live. Example: `~/.claude/skills/` for Claude Code. |
| Renderer | A component that implements the `HostRenderer` port for one specific host. See [render-spec.md](render-spec.md). |

## What every host adapter must provide

A host adapter is a directory under `src/adapters/<host-name>/`
containing at least these files:

| File | Purpose |
|---|---|
| `<HostName>Renderer.ts` | Implements the `HostRenderer` port. Produces a `RenderResult` for one skill. See [render-spec.md](render-spec.md). |
| `tools.ts` | Exports the tool registry: the list of tool names this host recognizes. |
| `tokens.ts` (optional) | Token counting for this host's models. If absent, the adapter falls back to a default counter. |
| `README.md` | Explains what the adapter knows and what it does not know. |

Each new host also requires registration in `src/adapters/cli/main.ts`
so that the CLI can select it.

## Host data on the `Host` entity

The domain represents a host as a `Host` entity. The entity is defined
at `src/domain/host/Host.ts`:

```typescript
interface Host {
  name: HostName;            // e.g., 'claude-code'
  outputRoot: string;        // e.g., '/home/user/.claude/skills'
  tools: ToolRegistry;       // The list of allowed tool names.
}

interface ToolRegistry {
  knownTools: readonly string[];
}
```

The renderer and installer receive a `Host` object. They do not look up
host-specific facts elsewhere.

## Tool registry contract

Each host adapter exports a constant `<HOST_NAME>_TOOLS` of type
`readonly string[]`. The list is the authoritative set of tool names
this host's harness recognizes.

When a skill declares a `tools` field in its `skill.yaml`, the renderer
checks every entry against this list. An entry that is not in the list
causes `UnknownToolError`. See [skill-spec.md](skill-spec.md) and
[render-spec.md](render-spec.md).

### Why an explicit list (not a regex)

The list is explicit, not pattern-based. The reasons:

1. Typos in tool names are a real failure mode. An explicit list
   catches `Bsh` (typo for `Bash`) immediately.
2. The set of tools is small and changes rarely.
3. An explicit list is a useful reference for skill authors.

## Frontmatter contract

The host adapter's renderer produces frontmatter that the host can
read. The shape of the frontmatter is host-specific.

For Claude Code, the frontmatter is:

```yaml
---
name: <skill-id>
version: <skill-version>
description: |
  <description, with each line indented by two spaces>
allowed-tools: [<list of tool names>]
---
```

Future hosts may use:

- Different field names (`tools` instead of `allowed-tools`).
- Different value formats (JSON array instead of YAML list).
- Different required fields (a `model:` field, for example).

Each host's renderer is responsible for emitting its own frontmatter.

## Output root contract

Each host expects rendered skills to live under a specific directory.
The output root is set when the `Host` entity is created.

For Claude Code, the standard locations are:

| Mode | Output root |
|---|---|
| Local (per-project) | `<cwd>/.claude/skills/` |
| Global (per-user) | `~/.claude/skills/dstack/` |

The CLI chooses between local and global based on the `--global` flag.
See `src/adapters/cli/README.md`.

The renderer emits paths relative to the output root. The installer
joins them and writes the files. See
[install-spec.md](install-spec.md).

## The Claude Code host today

dstack ships one host adapter: Claude Code.

| Property | Value |
|---|---|
| Name | `claude-code` |
| Adapter folder | `src/adapters/claude-code/` |
| Renderer | `ClaudeCodeRenderer` |
| Tool registry | `CLAUDE_CODE_TOOLS` in `tools.ts` |
| Frontmatter fields | `name`, `version`, `description`, `allowed-tools` |
| Output filename per skill | `<skill-id>/SKILL.md` |
| Output root (local) | `<cwd>/.claude/skills/` |
| Output root (global) | `~/.claude/skills/dstack/` |

### Claude Code tool registry

The current list, defined in
`src/adapters/claude-code/tools.ts`:

```typescript
export const CLAUDE_CODE_TOOLS = [
  'Agent',
  'AskUserQuestion',
  'Bash',
  'Edit',
  'NotebookEdit',
  'Read',
  'TaskCreate',
  'TaskGet',
  'TaskList',
  'TaskUpdate',
  'WebFetch',
  'WebSearch',
  'Write',
];
```

When Anthropic adds new tools to Claude Code's harness, update this
list. When tools are renamed, update this list.

## How to add a new host

To support a new AI host (for example, Codex):

### Step 1. Create the adapter folder

```
src/adapters/<host-name>/
├── README.md
├── <HostName>Renderer.ts
└── tools.ts
```

### Step 2. Implement `tools.ts`

Export an array of tool names the host recognizes. The names match
whatever the host's harness uses.

```typescript
export const CODEX_TOOLS = [
  'shell',
  'apply_patch',
  // ... more Codex tool names
];
```

### Step 3. Implement the renderer

Implement the `HostRenderer` port. Follow the algorithm in
[render-spec.md](render-spec.md), with two adjustments:

- Build the frontmatter in the host's expected shape.
- If the host's tool names differ from a "canonical" set, rewrite
  them. (For Codex, `AskUserQuestion` might map to a different tool.)

### Step 4. Wire the adapter

Update `src/adapters/cli/main.ts` to:

- Import the new renderer and tool registry.
- Add a CLI flag or registry entry to select the new host.

### Step 5. Write contract tests

Add a file `test/contract/<HostName>Renderer.contract.test.ts` that
runs the shared `HostRenderer` contract suite (planned milestone M8).
The new adapter and the Claude Code adapter must pass the same suite.

### Step 6. Document the adapter

The adapter's `README.md` lists what the adapter knows and what it
does not know. Reference this document for the format.

## Why we have not added other hosts yet

See [ADR-0002](../adr/0002-single-host-v0.md). The short version: one
user, one host. Adding a host requires a real user who wants it.

The port (`HostRenderer`) is in place. The cost of adding the second
host is one adapter folder and a contract test.

## Host-specific concerns that live in adapters

The following are adapter-local. The domain layer never sees them.

| Concern | Where it lives |
|---|---|
| Tool names | `<host>/tools.ts` |
| Frontmatter shape | `<host>/<HostName>Renderer.ts` |
| Filesystem layout (filename per skill) | `<host>/<HostName>Renderer.ts` |
| Tokenizer choice | `<host>/tokens.ts` |
| Output root path | `Host.outputRoot` (set by the CLI) |
| Platform-specific quirks (sandbox detection, etc.) | The relevant adapter. Example: see [ADR-0008](../adr/0008-sandbox-detection-at-adapter.md). |

## Cross-references

- [skill-spec.md](skill-spec.md) — `skill.yaml` declares the tools the
  host must recognize.
- [render-spec.md](render-spec.md) — how the renderer uses the
  frontmatter contract.
- [install-spec.md](install-spec.md) — how `outputRoot` is used by the
  installer.
- [ADR-0001](../adr/0001-hexagonal-layered.md) — why the host is a
  port-bound entity.
- [ADR-0002](../adr/0002-single-host-v0.md) — why only Claude Code
  ships at v0.
- [ADR-0008](../adr/0008-sandbox-detection-at-adapter.md) — example of
  a platform quirk that lives in the adapter.
- [skill-taxonomy.md](../skill-taxonomy.md) — design framework that may
  influence future host capabilities.
