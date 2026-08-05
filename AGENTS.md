# dstack — Codex agent instructions

dstack is a Bun/TypeScript skill catalog whose renderer targets Claude Code.
The source directories under `skills/` follow the Agent Skills format and can
also be loaded directly by Codex. The repository uses hexagonal architecture,
ADRs, and strict YAGNI boundaries.

Codex loads this file automatically from the repository root. Treat it as the
Codex entry point for the shared project rules in `CLAUDE.md`, not as a second
independent rulebook.

## Required reading

Before changing anything:

1. Read `CLAUDE.md` from top to bottom. Despite its filename, its architecture,
   testing, pacing, documentation voice, ADR, and YAGNI rules apply to every
   agent working in this repository.
2. Read `CONTEXT.md` for the domain vocabulary.
3. Follow the additional file-routing table in `CLAUDE.md` for architecture,
   code, specifications, roadmap, deferred work, and ADR changes.

Within repository guidance, direct user instructions take priority; higher-level
Codex platform rules still apply. For Codex-specific behavior, the differences
below override host-specific wording in `CLAUDE.md`; all other project rules
remain unchanged.

## Codex-specific differences

- Invoke Codex skills with `$skill-name`, for example `$using-dstack` or
  `$debugging`. Slash-prefixed examples such as `/debugging` refer to Claude
  Code.
- Install dstack skills for Codex by linking the source skill directories into
  `${CODEX_HOME:-$HOME/.codex}/skills`, following `README.md`.
- Do not use `dstack build` or `dstack build --global` as a Codex deployment
  command. Those commands render and install Claude Code output under
  `.claude/skills`.
- Do not add a Codex renderer only to change an install path. Codex consumes the
  source Agent Skills format directly. A new renderer requires a concrete
  representation mismatch, the ADR-0029 trigger, and contract tests.
- When a skill body names a Claude-only tool, path, or command, do not pretend
  Codex provides it. Use a verified Codex equivalent when one exists; otherwise
  state the limitation.
- If the user asks Codex to create a commit, follow the commit subject/body
  style in `CLAUDE.md`, but do not add a Claude co-author footer. Use only the
  identity the user requests.

## Core commands

```bash
bun install
bun run build
bun run build --strict
bun run render <skill-id>
bun run new <skill-id>
bun run list
bun run validate
bun run doctor
bun run typecheck
bun test
```

The CLI wiring point is `src/adapters/cli/main.ts`. Preserve the dependency
direction and placement rules defined in `CLAUDE.md`.

## Verification gate

After any repository change, run at least:

```bash
bun run typecheck
bun test
```

For skill or catalog changes, also run:

```bash
bun run validate
```

For documentation-only changes, additionally inspect the rendered Markdown,
verify referenced paths and commands, and search for stale contradictory text.
Do not claim completion without fresh verification output.
