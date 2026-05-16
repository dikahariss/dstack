# What shipped

This document is an inventory of everything that exists in dstack
today. Use it to see what is real and what is still in the roadmap (see
[ROADMAP.md](ROADMAP.md)).

When a roadmap item lands, move its row into this document.

## Metrics

| Metric | Value |
|---|---|
| Current version | 0.1.0 (see [`VERSION`](../../../VERSION) and [`CHANGELOG.md`](../../../CHANGELOG.md)) |
| Total tracked files | About 80 (excluding `node_modules/`, `.claude/skills/`) |
| Total lines | About 7,400 (TypeScript + Markdown + YAML) |
| Tests | 47 pass, 0 fail, about 380 ms total |
| Skills rendered end-to-end | 1 (`careful`) |
| Architecture Decision Records | 10 |

## v0 baseline (initial commit `a730e96`)

The first commit established the layered architecture, one skill
(`careful`), and 10 ADRs. 14 tests passing (8 unit + 6 contract).
Approximate token counter only. No CLI warnings surfaced. No VERSION
file. Token budget enforced via approximation.

## Shipped in v0.1.0 (Phase 1)

The first tagged version landed these milestones from ROADMAP plus two
non-ROADMAP additions (A1, A3). See
[`../../../CHANGELOG.md`](../../../CHANGELOG.md) for the user-facing
summary.

| Item | Where it landed |
|---|---|
| **A1 — `CONTEXT.md`** | [`CONTEXT.md`](../../../CONTEXT.md) at repo root: domain language glossary for AI agents |
| **A3 — `dstack new <skill-id>`** | `src/adapters/cli/scaffold.ts` + main.ts wiring; scaffolds skills from a template |
| **M5 — Renderer warnings printed in CLI** | `src/adapters/cli/warning-formatter.ts`; `dstack build` prints a `warnings:` section grouped by skill |
| **M6 — VERSION + CHANGELOG.md** | [`VERSION`](../../../VERSION) (0.1.0) and [`CHANGELOG.md`](../../../CHANGELOG.md) at repo root |
| **M15 — Errors carry file and line** | `SourceLocation` field on `SkillSpecError`; YAML `LineCounter` used in `FileSkillRepository` |

## Shipped after v0.1.0 (Phase 2, unreleased)

| Item | Where it landed |
|---|---|
| **M3 — `includes:` directive resolved** | `FileSkillRepository.resolveIncludes()` reads each path relative to the skills root and exposes the concatenated text on `Skill.includesContent`. `IncludeNotFoundError` aborts the build; a path repeated in one chain emits an `include-cycle-broken` warning. `ClaudeCodeRenderer` prepends the resolved text before `prompt.md` and forwards the warnings to `RenderResult`. |

**M2 was explored and rejected.** The original plan was to wire
Anthropic's `messages.countTokens` as an opt-in tokenizer. After
implementation and review, the trade-off (API key management, network
dependency, extra runtime dep) was judged not worth the ±1% accuracy
gain over the offline approximation. The approximate counter remains
the only counter. The exploration is recorded in commit history; the
ADR that documented the opt-in design was removed. Precise counting,
if it ever becomes necessary, will arrive as an on-demand subcommand
(see [DEFERRED.md](DEFERRED.md)).

## Documentation that exists

| File | Purpose |
|---|---|
| `README.md` | Project introduction and quickstart |
| `CLAUDE.md` | Agent instructions: read-order, rules, forbidden patterns. Optimised so cheap models (Haiku/Sonnet) can parse it without inference. |
| `CONTEXT.md` | Domain language glossary (for AI agents) — A1 |
| `CHANGELOG.md` | Release notes per version — M6 |
| `VERSION` | Current version string — M6 |
| `docs/ARCHITECTURE.md` | Layered architecture overview with diagrams |
| `docs/skill-taxonomy.md` | Reference for choosing computation type when designing a skill |
| `docs/adr/README.md` | Architecture Decision Record format and index |
| `docs/adr/0001-hexagonal-layered.md` | Why we separate domain, application, adapters |
| `docs/adr/0002-single-host-v0.md` | Why we ship only Claude Code at v0 |
| `docs/adr/0003-skill-as-data.md` | Why skills are YAML + Markdown, not templates |
| `docs/adr/0004-no-template-engine-v0.md` | Why the render pipeline has 5 steps, not 14 |
| `docs/adr/0005-bun-runtime.md` | Why we use Bun + TypeScript, not bash |
| `docs/adr/0006-telemetry-opt-in.md` | Why telemetry is off by default |
| `docs/adr/0007-browse-separate-process.md` | Why browse is a separate package |
| `docs/adr/0008-sandbox-detection-at-adapter.md` | Why Chromium sandbox detection lives in the adapter |
| `docs/adr/0009-spec-driven-skills.md` | Why each skill declares a contract |
| `docs/adr/0010-context-budget.md` | Why every skill has a hard token budget |
| `docs/specs/skill-spec.md` | The schema and validation rules for `skill.yaml` |
| `docs/specs/render-spec.md` | The contract for the render pipeline |
| `docs/specs/install-spec.md` | The contract for the installer |
| `docs/specs/host-spec.md` | What defines an AI host |

## Source code (TypeScript)

### Domain layer (no input/output operations)

| File | Purpose |
|---|---|
| `src/domain/errors.ts` | Typed error classes (`SkillSpecError` with `SourceLocation`, `TokenBudgetExceededError`, and more) |
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
| `src/adapters/claude-code/tools.ts` | The list of tool names Claude Code's harness recognizes |
| `src/adapters/claude-code/tokens.ts` | `approximateTokenCount()` — offline counter (chars ÷ 4, +5% margin) |
| `src/adapters/fs/FileSkillRepository.ts` | Reads `skills/<skill-id>/{skill.yaml, prompt.md}`; uses YAML `LineCounter` for error locations — M15 |
| `src/adapters/fs/FsInstaller.ts` | Atomic write, skip-unchanged, remove-orphan behavior |
| `src/adapters/fs/paths.ts` | Path policy (allowed roots, traversal protection) |
| `src/adapters/cli/main.ts` | CLI entrypoint. Dispatches `build`, `render`, `new`. Prints warnings. |
| `src/adapters/cli/scaffold.ts` | `scaffoldSkill()` for the `dstack new` command — A3 |
| `src/adapters/cli/warning-formatter.ts` | `formatWarnings()` and `countWarnings()` for CLI output — M5 |

### Observability layer

| File | Purpose |
|---|---|
| `src/observability/Telemetry.ts` | The `Telemetry` port plus the typed event union |
| `src/observability/NoopTelemetry.ts` | Default adapter. Discards every event. |
| `src/observability/FileTelemetry.ts` | Opt-in adapter. Writes JSON lines to a file. Rotates at 10 megabytes. |

## Skills that exist

| Skill | Source | Notes |
|---|---|---|
| `careful` | First skill written for dstack | Hook-based interception is not supported yet — `/careful` is advisory text only (see [DEFERRED.md](DEFERRED.md) D2). Telemetry blocks are omitted per ADR-0006. The current limitations are documented in the prompt body. |

## Tests that exist

| File | Tier | Test count |
|---|---|---|
| `test/unit/domain/SkillId.test.ts` | Unit | 8 |
| `test/unit/adapters/cli/scaffold.test.ts` | Unit | 8 |
| `test/unit/adapters/cli/warning-formatter.test.ts` | Unit | 8 |
| `test/unit/adapters/claude-code/tokens.test.ts` | Unit | 5 |
| `test/unit/adapters/claude-code/renderer-includes.test.ts` | Unit | 3 |
| `test/unit/adapters/fs/error-messages.test.ts` | Unit | 5 |
| `test/unit/adapters/fs/includes.test.ts` | Unit | 4 |
| `test/contract/SkillRepository.contract.ts` | Contract (shared suite) | (defines suite) |
| `test/contract/FileSkillRepository.contract.test.ts` | Contract (applied to one adapter) | 6 |
| **Totals** |  | **47 pass, 0 fail — about 380 ms across 8 files** |

### Test fixtures

| Path | Purpose |
|---|---|
| `test/fixtures/skills/good/alpha/` | A valid skill with the `Read` tool, 1000-token budget |
| `test/fixtures/skills/good/beta/` | A valid skill with `Bash` and `Edit` tools, 2000-token budget |
| `test/fixtures/skills/missing-prompt/orphan/` | Has `skill.yaml` but no `prompt.md`. Used to verify error handling. |
| `test/fixtures/skills/bad-yaml/syntax-error/` | Unclosed quoted string. Verifies `LineCounter` reports a line number on YAML parse failure — M15 |
| `test/fixtures/skills/bad-yaml/wrong-type/` | `tools` field is a scalar, not an array. Verifies field-level line number reporting — M15 |
| `test/fixtures/skills/bad-yaml/missing-tools/` | `tools` field is absent. Verifies file path is reported when line is unknown — M15 |
| `test/fixtures/skills/with-includes/uses-shared/` + `_shared/intro.md` | Skill that pulls in shared content via `includes:`. Verifies include text is concatenated above `prompt.md` — M3 |
| `test/fixtures/skills/missing-include/uses-missing/` | Skill whose include path does not exist. Verifies `IncludeNotFoundError` — M3 |
| `test/fixtures/skills/duplicate-includes/uses-dupe/` + `_shared/preamble.md` | Skill whose `includes:` lists the same file twice. Verifies the second reference triggers an `include-cycle-broken` warning and is not re-included — M3 |

## Tooling files

| File | Purpose |
|---|---|
| `package.json` | Scripts: `build`, `render`, `install:local`, `typecheck`, `test`. One runtime dep: `yaml`. |
| `tsconfig.json` | Strict TypeScript settings, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` |
| `.gitignore` | Excludes `node_modules`, `.claude/skills`, `.dstack`, log files |

## Behaviors verified

- `bun install` resolves dependencies cleanly.
- `bun run typecheck` finishes with no errors under strict mode.
- `bun run build` renders 1 skill and writes `.claude/skills/<skill-id>/SKILL.md`. Prints a `warnings:` section when any skill has warnings.
- `bun run render <skill-id>` writes one skill to standard output.
- `dstack new <skill-id>` scaffolds a new skill directory; refuses to overwrite an existing one.
- `bun test` passes 40 tests in about 100 ms.
- Re-running `build` reports "skipped 1" for unchanged skills (the build is idempotent).
- `SkillSpecError` messages include `at <file>[:<line>]` for YAML and field validation failures.
- The path policy in `assertAllowed` rejects writes outside the allowed roots. (Verified by the type signature and code review; no dedicated test yet — see ROADMAP milestone M10.)
- Token counting is offline (`approximateTokenCount`), ±10% of Anthropic's exact tokenizer.

## Known gaps (handed off to ROADMAP)

These items are explicitly NOT in v0.1.0. Each has a milestone in
[ROADMAP.md](ROADMAP.md):

| Gap | Roadmap milestone |
|---|---|
| Only 1 skill exists (`careful`); v1 needs at least 5 useful skills | M1 |
| No `dstack validate` command | M4 |
| No `dstack list` command | M7 |
| Only `SkillRepository` has a shared contract suite | M8 (HostRenderer), M9 (Installer) |
| No integration test | M10 |
| No continuous integration (CI) pipeline | M11 |
| No `CONTRIBUTING.md` | M12 |
| `packages/browse/` exists only as a README | Deferred (see DEFERRED.md) |
