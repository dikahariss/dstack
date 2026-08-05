# `src/adapters/claude-code/` — Claude Code adapter

This folder holds the adapter that lets dstack produce output for
Claude Code as a target AI host.

## Terms

| Term | Definition |
|---|---|
| Claude Code | The CLI tool by Anthropic that runs AI agents. https://docs.anthropic.com/en/docs/claude-code |
| Host | A render/install pipeline target. Claude Code is the only host adapter today; compatible runtimes may consume source directly. |
| Adapter | Concrete code that implements a port defined in the domain layer. |
| Frontmatter | A YAML block at the top of a Markdown file, between `---` fences. |
| Tool registry | The list of tool names the host recognizes. Examples: `Bash`, `Edit`, `Read`. |

## Files in this folder

| File | Purpose |
|---|---|
| `ClaudeCodeRenderer.ts` | Implements `HostRenderer` for Claude Code's expected directory format. |
| `tools.ts` | The list of tool names Claude Code's harness recognizes. |
| `tokens.ts` | `approximateTokenCount()` — offline counter (`chars / 4`, +5% margin, rounded up). Called directly by the renderer. |

## What this adapter knows

This adapter knows:

- Claude Code expects one file per skill at `<skill-id>/SKILL.md`.
- Claude Code reads YAML frontmatter between `---` fences.
- The frontmatter fields Claude Code reads are: `name`, `description`,
  `allowed-tools`.
- Claude Code's tool registry includes: `Bash`, `Edit`, `Read`, `Write`,
  `AskUserQuestion`, and others listed in `tools.ts`.

## What this adapter does NOT know

This adapter does not know:

- Where on the file system `.claude/skills/` lives. That is the `Host`
  entity's `outputRoot` property.
- Whether to symbolic-link or copy files. That is the `Installer`
  adapter's choice.
- How compatible runtimes such as Codex discover portable source skills.
  That direct-consumption path does not enter this adapter.

## How to add a second renderer

Do not add a renderer merely to support a different install directory.
Compatible runtimes such as Codex consume the source catalog directly.
If a real workflow proves that another host requires a representation
transform:

1. Create `src/adapters/<host>/<Host>Renderer.ts` that implements the
   `HostRenderer` port.
2. Create `src/adapters/<host>/tools.ts` with that host's tool names.
3. Wire the new adapter in `src/adapters/cli/main.ts`. Use a flag
   such as `--host <host>` to select between adapters.
4. Write contract tests in `test/contract/HostRenderer.contract.ts`.
   Both the Claude Code renderer and the new renderer must pass the
   same test suite.

See [ADR-0029](../../../docs/adr/0029-portable-source-consumption.md)
for the adapter trigger and the direct-consumption boundary.

## Cross-references

- [docs/specs/host-spec.md](../../../docs/specs/host-spec.md) — the
  full contract every host adapter must satisfy.
- [docs/specs/render-spec.md](../../../docs/specs/render-spec.md) — the
  pipeline algorithm this renderer implements.
- [docs/skill-taxonomy.md](../../../docs/skill-taxonomy.md) — design
  framework. Schema-constrained Semantic skills (Type 4 in the
  taxonomy) require host-specific tool-use features. This adapter is
  where that capability would be wired for Claude Code.
- [ADR-0008](../../../docs/adr/0008-sandbox-detection-at-adapter.md) —
  example of an adapter-local concern (not directly used here, but
  in `packages/browse/`).
