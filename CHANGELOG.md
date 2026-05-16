# Changelog

All notable changes to dstack are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/)
and the version scheme follows [Semantic Versioning](https://semver.org/)
(classic three-part: `MAJOR.MINOR.PATCH`).

## [0.1.0] — 2026-05-16

First tagged version. The architecture is in place, one skill
(`careful`) renders end-to-end, the test suite is green, and Phase 1
of the v1 roadmap (M5, M6, M15, plus A1 and A3) is done. This is the
foundation v1 builds on.

### Added

- **`CONTEXT.md` at the repo root** — a domain language glossary that
  AI agents can load once per session to ground vocabulary without
  re-deriving it from code.
- **`VERSION` and `CHANGELOG.md`** — release notes discipline starts
  here so future readers can see what changed. (ROADMAP M6.)
- **`dstack new <skill-id>`** — CLI command that scaffolds a new skill
  directory with `skill.yaml` plus `prompt.md` from a template.
  Validates the skill id, refuses to overwrite existing directories.
- **Renderer warnings now print in the CLI** — `dstack build` prints
  a `warnings:` section grouped by skill at the end of its output.
  The summary line includes the warning count when any exist. Exit
  code stays 0; a strict mode that fails on warnings comes later.
  (ROADMAP M5.)
- **Errors carry source file and line** — `SkillSpecError` now
  reports `at <file>[:<line>]` for YAML syntax failures and for
  field validation errors when the offending field is locatable in
  the parsed document. (ROADMAP M15.)
- **`careful` skill** — destructive command guardrails. Currently
  advisory only; hook-based enforcement is deferred (see
  `docs/plans/v1/DEFERRED.md` D2).
- **`.env.example` template** — documents the optional
  `DSTACK_TELEMETRY` env variable. Bun auto-loads `.env`, which is
  gitignored.

### Changed

- **`plan/` moved to `docs/plans/`** — keeps planning documents
  under the central `docs/` umbrella alongside ARCHITECTURE, ADRs,
  and specs.

### Explored and rejected

- **Real Anthropic tokenizer (ROADMAP M2).** An opt-in counter that
  called `messages.countTokens` was built end-to-end, tested against
  the live API, and removed. The trade-off (API key management,
  per-build network call, extra runtime dependency) did not justify
  the ±1% accuracy gain over the offline approximate counter, given
  that the budget warning threshold (90%) already sits well outside
  the approximation's ±10% error band. The deferred entry
  `docs/plans/v1/DEFERRED.md` D11 records a possible future
  on-demand subcommand if precise counting ever becomes necessary.

### Architecture (foundation work)

- Layered architecture: `domain/` → `application/` → `adapters/` with
  ports defined in domain and adapters in `src/adapters/`. See
  [ADR-0001](docs/adr/0001-hexagonal-layered.md).
- Wiring point at `src/adapters/cli/main.ts` — the only place
  concrete adapters are constructed.
- 10 Architecture Decision Records covering: layered architecture,
  single-host scope, skill-as-data philosophy, no template engine,
  Bun + TypeScript runtime choice, opt-in telemetry, browse package
  separation, sandbox detection placement, spec-driven skills, and
  per-skill token budgets.
- 40 passing tests across 6 files. Total runtime about 100 ms.
- Telemetry: `NoopTelemetry` by default; opt in to local JSONL with
  `DSTACK_TELEMETRY=local`.

### For contributors

- Strict TypeScript settings: `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` enabled in `tsconfig.json`.
- One runtime dependency: `yaml`. Everything else is in
  `devDependencies`.
- Token counting is inlined: `approximateTokenCount` in
  `src/adapters/claude-code/tokens.ts` is called directly by the
  renderer. No port, no factory.
