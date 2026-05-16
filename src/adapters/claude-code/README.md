# `src/adapters/claude-code/` — Claude Code adapter

This folder holds the adapter that lets dstack produce output for
Claude Code as a target AI host.

## Terms

| Term | Definition |
|---|---|
| Claude Code | The CLI tool by Anthropic that runs AI agents. https://docs.anthropic.com/en/docs/claude-code |
| Host | An AI agent that consumes skills. dstack targets Claude Code as its only host (today). |
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
- Anything about Codex, Kiro, OpenCode, or any other AI host.

## How to add a second renderer

To add support for a second host (for example, Codex):

1. Create `src/adapters/codex/CodexRenderer.ts` that implements the
   `HostRenderer` port.
2. Create `src/adapters/codex/tools.ts` with Codex's tool names. Codex
   tool names differ from Claude Code tool names.
3. Wire the new adapter in `src/adapters/cli/main.ts`. Use a flag
   like `--host codex` to select between adapters.
4. Write contract tests in `test/contract/HostRenderer.contract.ts`.
   Both the Claude Code renderer and the Codex renderer must pass the
   same test suite.

See [ADR-0002](../../../docs/adr/0002-single-host-v0.md) for why this
work is deferred until a real user wants Codex support.

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
