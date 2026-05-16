# Changelog

All notable changes to dstack are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/)
and the version scheme follows [Semantic Versioning](https://semver.org/)
(classic three-part: `MAJOR.MINOR.PATCH`).

## [Unreleased]

Phase 2 work toward v1. Not yet tagged.

### Added

- **Five new skills land under `skills/`** (ROADMAP M1):
  - `/tdd` — red-green-refactor discipline, adapted from
    `superpowers/test-driven-development`. ~1.7 k tokens.
  - `/investigate` — root-cause-first debugging in four phases,
    adapted from `superpowers/systematic-debugging`. ~2.1 k tokens.
  - `/brainstorm` — decision-tree interview pairs with
    `AskUserQuestion`, adapted from
    `mattpocock-skills/productivity/grill-me`. ~0.7 k tokens.
  - `/review` — receive code-review feedback with technical rigor,
    adapted from `superpowers/receiving-code-review`. ~1.7 k tokens.
  - `/verification` — evidence-before-claim gate, adapted from
    `superpowers/verification-before-completion`. ~1.3 k tokens.

  Every skill carries the advisory note required by ROADMAP M1 —
  dstack today has no hook engine, so the discipline is enforced by
  the user reading the rendered prompt, not by tool interception.
  Total render footprint across the six skills (including the
  pre-existing `careful`) is well under the 16 k ceiling per skill
  and ~8.3 k tokens combined.
- **`Glob` and `Grep` added to `CLAUDE_CODE_TOOLS` registry.** They
  are first-class Claude Code tools; the registry omission was
  caught when the new `/investigate` and `/review` skills declared
  them. No skill broke from the addition.
- **`includes:` directive now resolves.** `FileSkillRepository` reads
  each path listed under `includes:` (relative to `skills/`) and
  exposes the concatenated text on `Skill.includesContent`. The
  Claude Code renderer prepends that text above `prompt.md`, so
  shared snippets under `skills/_shared/` no longer fall on the
  floor. A missing path raises `IncludeNotFoundError` and aborts
  the build; a path repeated inside one skill's `includes:` list
  emits an `include-cycle-broken` warning and is included only
  once. Nesting (an include file that has its own `includes:`) is
  not supported. (ROADMAP M3.)
- **`dstack validate` command.** Walks the `skills/` directory, runs
  every skill through the same per-skill pipeline as `dstack build`,
  and prints one greppable line per skill: `<id>: OK (N/M tokens)`
  or `<id>: ERR <message>`. Exit code is 0 when every skill is
  valid, 1 when any skill fails. Errors that carry a source
  location (YAML syntax, field validation) include `at <file>:<line>`
  so editors can jump to the offending line. A new
  `ValidateCatalog` use case under `src/application/` owns the
  collect-errors-instead-of-throwing logic so it can be reused. The
  CLI now lists `validate` in `--help` and `package.json` exposes
  `bun run validate`. (ROADMAP M4.)

### Changed

- `Skill` aggregate carries two new required fields,
  `includesContent: string` and `includeWarnings: readonly Warning[]`,
  populated by `FileSkillRepository` during load.
- `docs/specs/render-spec.md` reflects the new resolution location
  (repository, not renderer) and softens the prior caching claim
  to match the implementation.
- **Import paths use aliases for non-sibling references.** `@domain/*`,
  `@app/*`, `@adapters/*`, `@obs/*` map to the four source roots in
  `tsconfig.json`. Sibling imports (`./X`) stay relative. Test files
  that used to read `'../../../../src/...'` now read `'@adapters/...'`.
  ADR-0011 records the convention. Bun resolves the aliases at
  runtime; no bundler is required.
- **Skill frontmatter aligns with the official Agent Skills schema.**
  The input YAML key `id:` is renamed to `name:` to match what
  `anthropics-skills` ships, so an official example pastes into a
  dstack folder with no rename. Two optional fields are now accepted
  and forwarded into the rendered output frontmatter: `license:`
  (e.g. `Apache-2.0`) and `compatibility:` (e.g. `Requires Bun 1.3+`).
  Internal TypeScript `SkillSpec.id` is unchanged. ADR-0012 records
  the decision. Existing `skill.yaml` files must rename `id:` →
  `name:`; the `careful` skill and the nine test fixtures have been
  migrated.

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
- **`CLAUDE.md`** — agent instructions at the repo root. Read-order
  pointers, forbidden patterns (concrete list, not prose), code
  conventions, and pacing rules. Structured with tables and short
  bullets so cheaper models (Haiku/Sonnet) can parse and follow it
  without inference. About 2 300 tokens.

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
