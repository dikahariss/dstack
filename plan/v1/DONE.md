# What shipped in v0

This document is an inventory of everything that exists in dstack today.
Use it to see what is real and what is still in the roadmap (see
[ROADMAP.md](ROADMAP.md)).

When a roadmap item lands, move its row into this document.

## Metrics

| Metric | Value |
|---|---|
| Total files | 61 (excluding `node_modules/`, `.claude/skills/`) |
| Total lines | About 3,000 (TypeScript + Markdown + YAML) |
| Tests | 14 pass, 0 fail, 75 milliseconds total |
| Skills rendered end-to-end | 2 |
| npm packages installed | 22 (`@types/bun`, `typescript`, `yaml`, and transitive dependencies) |

## Documentation that exists

| File | Purpose | Approximate lines |
|---|---|---|
| `README.md` | Project introduction and quickstart | 85 |
| `docs/ARCHITECTURE.md` | Layered architecture overview with diagrams | 165 |
| `docs/skill-taxonomy.md` | Reference for choosing computation type when designing a skill | 500 |
| `docs/adr/README.md` | Architecture Decision Record format and index | 100 |
| `docs/adr/0001-hexagonal-layered.md` | Why we separate domain, application, adapters | 100 |
| `docs/adr/0002-single-host-v0.md` | Why we ship only Claude Code at v0 | 90 |
| `docs/adr/0003-skill-as-data.md` | Why skills are YAML + Markdown, not templates | 120 |
| `docs/adr/0004-no-template-engine-v0.md` | Why the render pipeline has 5 steps, not 14 | 90 |
| `docs/adr/0005-bun-runtime.md` | Why we use Bun + TypeScript, not bash | 110 |
| `docs/adr/0006-telemetry-opt-in.md` | Why telemetry is off by default | 95 |
| `docs/adr/0007-browse-separate-process.md` | Why browse is a separate package | 100 |
| `docs/adr/0008-sandbox-detection-at-adapter.md` | Why Chromium sandbox detection lives in the adapter | 115 |
| `docs/adr/0009-spec-driven-skills.md` | Why each skill declares a contract | 100 |
| `docs/adr/0010-context-budget.md` | Why every skill has a hard token budget | 95 |
| `docs/specs/skill-spec.md` | The schema and validation rules for `skill.yaml` | 150 |
| `docs/specs/render-spec.md` | The contract for the render pipeline | 150 |

## Source code (TypeScript)

### Domain layer (no input/output operations)

| File | Purpose |
|---|---|
| `src/domain/errors.ts` | Typed error classes (`SkillSpecError`, `TokenBudgetExceededError`, and more) |
| `src/domain/skill/SkillId.ts` | Value object that validates the format of a skill id |
| `src/domain/skill/SkillSpec.ts` | Parsed `skill.yaml` plus the budget constants |
| `src/domain/skill/Skill.ts` | The aggregate: spec plus prompt body |
| `src/domain/skill/ports.ts` | `SkillRepository` port (interface) |
| `src/domain/host/Host.ts` | Host entity and `ToolRegistry` interface |
| `src/domain/host/ports.ts` | `HostRenderer`, `Installer` ports, `InstallReport` type |
| `src/domain/render/RenderContext.ts` | Immutable input passed to the renderer |
| `src/domain/render/RenderResult.ts` | Immutable output returned by the renderer, plus `Warning` types |

### Application layer (use cases)

| File | Purpose |
|---|---|
| `src/application/BuildSkill.ts` | Render one skill. Check tools. Check token budget. |
| `src/application/BuildCatalog.ts` | Render every skill. Check for duplicate ids. |
| `src/application/InstallSkills.ts` | Thin wrapper that calls the `Installer` port. |

### Adapter layer (input/output)

| File | Purpose |
|---|---|
| `src/adapters/claude-code/ClaudeCodeRenderer.ts` | Implements `HostRenderer` for Claude Code's expected directory format |
| `src/adapters/claude-code/tools.ts` | The list of tool names Claude Code's harness recognizes (13 names today) |
| `src/adapters/claude-code/tokens.ts` | Approximate token counter (4 characters per token, plus 5% margin) |
| `src/adapters/fs/FileSkillRepository.ts` | Reads `skills/<skill-id>/{skill.yaml, prompt.md}` and returns `Skill` objects |
| `src/adapters/fs/FsInstaller.ts` | Atomic write, skip-unchanged, remove-orphan behavior |
| `src/adapters/fs/paths.ts` | Path policy (allowed roots, traversal protection) |
| `src/adapters/cli/main.ts` | CLI entrypoint. Dispatches `build`, `render`, etc. |

### Observability layer

| File | Purpose |
|---|---|
| `src/observability/Telemetry.ts` | The `Telemetry` port plus the typed event union |
| `src/observability/NoopTelemetry.ts` | Default adapter. Discards every event. |
| `src/observability/FileTelemetry.ts` | Opt-in adapter. Writes JSON lines to a file. Rotates at 10 megabytes. |

## Skills that exist

| Skill | Source | Notes |
|---|---|---|
| `example-greet` | Written for dstack | The minimal valid skill, used as a reference. |
| `careful` | Ported from gstack | The hook feature is dropped because dstack v0 has no hook support. The telemetry block is dropped per ADR-0006. Behavior is weaker than the gstack original. This is documented in the prompt body. |

## Tests that exist

| File | Tier | Test count | Time |
|---|---|---|---|
| `test/unit/domain/SkillId.test.ts` | Unit | 8 | Less than 10 ms |
| `test/contract/SkillRepository.contract.ts` | Contract (shared suite) | (defines suite) | (used by below) |
| `test/contract/FileSkillRepository.contract.test.ts` | Contract (applied to one adapter) | 6 | About 65 ms |
| **Totals** |  | **14 pass, 0 fail** | **75 ms** |

### Test fixtures

| Path | Purpose |
|---|---|
| `test/fixtures/skills/good/alpha/` | A valid skill with the `Read` tool, 1000-token budget |
| `test/fixtures/skills/good/beta/` | A valid skill with `Bash` and `Edit` tools, 2000-token budget |
| `test/fixtures/skills/missing-prompt/orphan/` | Has `skill.yaml` but no `prompt.md`. Used to verify error handling. |

## Tooling files

| File | Purpose |
|---|---|
| `package.json` | Scripts: `build`, `render`, `install:local`, `typecheck`, `test` |
| `tsconfig.json` | Strict TypeScript settings, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` |
| `.gitignore` | Excludes `node_modules`, `.claude/skills`, `.dstack`, log files |

## Behaviors verified

- `bun install` resolves dependencies cleanly.
- `bun run typecheck` finishes with no errors under strict mode.
- `bun run build` renders 2 skills and writes `.claude/skills/<skill-id>/SKILL.md`.
- `bun run render <skill-id>` writes one skill to standard output.
- `bun test` passes 14 tests in 75 milliseconds.
- Re-running `build` reports "skipped 1" for unchanged skills (the
  build is idempotent).
- The path policy in `assertAllowed` rejects writes outside the
  allowed roots. (Verified by the type signature and code review; no
  dedicated test yet — see ROADMAP milestone M10.)

## Known gaps (handed off to ROADMAP)

These items are explicitly NOT in v0. Each has a milestone in
[ROADMAP.md](ROADMAP.md):

| Gap | Roadmap milestone |
|---|---|
| Token counter is an approximation, not Anthropic's real tokenizer | M2 |
| `includes:` directive in `skill.yaml` is parsed but does not resolve | M3 |
| No `dstack validate` command | M4 |
| No `dstack list` command | M7 |
| Renderer collects warnings but the CLI does not print them | M5 |
| No `VERSION` file or `CHANGELOG.md` | M6 |
| Only `SkillRepository` has a shared contract suite | M8 (HostRenderer), M9 (Installer) |
| No integration test | M10 |
| No continuous integration (CI) pipeline | M11 |
| No `CONTRIBUTING.md` | M12 |
| `packages/browse/` exists only as a README | Deferred (see DEFERRED.md) |
