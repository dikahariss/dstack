# Changelog

All notable changes to dstack are recorded in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/)
and the version scheme follows [Semantic Versioning](https://semver.org/)
(classic three-part: `MAJOR.MINOR.PATCH`).

## [Unreleased]

Phase 2 work toward v1. Not yet tagged.

### Changed

- **Seven skills renamed; every id is now ≤3 words**
  ([ADR-0027](docs/adr/0027-skill-naming-convention.md)). A skill id names
  the activity it performs, in at most three hyphen-separated words —
  no bare abbreviation, adjective, or generic noun. `tdd` →
  `test-driven-development`, `code-review` → `responding-to-review`,
  `careful` → `guarding-destructive-commands`, `verification` →
  `verifying-before-done`, `version` → `managing-version`,
  `pdf-to-rag-markdown` → `pdf-to-rag`, `finishing-a-development-branch`
  → `finishing-development-branch`. The old ids are kept as trigger
  keywords, so "do TDD" / "be careful" / "pdf to rag" still route.
  Already-clear names were deliberately left alone. Entries above that
  predate the rename keep the ids that were true when written.
- **`/test-driven-development` now demands unbiased coverage.** A new
  "Cover more than the happy path" section names four test classes —
  happy, edge/boundary, invalid/error, and **chaos / failure injection**
  (dependency down, timeout, retry exhausted, duplicate or concurrent
  delivery) — plus the bias rule: derive cases from the contract, not
  from the implementation you just wrote, then ask whether the set would
  still pass against a knowingly wrong implementation. The verification
  checklist enforces it.
- **Skills no longer assume one language.** `/test-driven-development`
  carries a stack-agnostic run-command table (Bun, npm, Angular, .NET,
  Python, Go, Rust, PHP) and states that its examples' language is
  incidental. Prompted by an audit of the owner's repos: 277 `.csproj`,
  167 `package.json`, 106 Python manifests, plus Go, Rust, Angular and
  PHP — while the skill named only TypeScript tooling.
- **The install procedure in `README.md` is now additive** (`rsync`, no
  `rm -rf`/`--delete`). The previous loop wiped each skill folder before
  copying, which destroys files a skill wrote into its own folder in a
  config dir — observed on a real `pdf-to-rag/work/` directory.
  Renamed or deleted skills now leave an orphan folder you remove
  deliberately after inspecting it.

### Fixed

- **`literature-fulltext` dropped open-access records** — `oa_fetch.py`
  read only `best_oa_location.url_for_pdf`, so a gold-OA DOI whose best
  location exposes no direct PDF was logged as closed. Measured on
  `10.7554/eLife.00005`: reported closed, while `oa_locations[1]` served
  a 22-page PDF. It now falls back to the first OA location carrying a
  PDF, and keeps the best location's license when that copy declares
  none (a blank license reads as "unknown → don't redistribute").
- **`subagent-driven-development` promised TDD it did not instruct** —
  the body claimed subagents "follow TDD naturally" while the bundled
  implementer prompt said "following TDD *if task says to*". The prompt
  now invokes `/test-driven-development` and `/verifying-before-done`.

### Added

- **Five new skills land under `skills/`** (ROADMAP M1):
  - `/tdd` — red-green-refactor discipline, adapted from
    `superpowers/test-driven-development`. ~1.7 k tokens.
  - `/debugging` — root-cause-first debugging in four phases,
    adapted from `superpowers/systematic-debugging`. ~2.1 k tokens.
  - `/brainstorm` — decision-tree interview pairs with
    `AskUserQuestion`, adapted from
    `mattpocock-skills/productivity/grill-me`. ~0.7 k tokens.
  - `/code-review` — receive code-review feedback with technical
    rigor, adapted from `superpowers/receiving-code-review`. ~1.7 k
    tokens.
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
  caught when the new `/debugging` and `/code-review` skills
  declared them. No skill broke from the addition.
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
- **`dstack list` command.** Prints a table with columns `ID`,
  `VERSION`, `TOKENS (approx)`, `TOOLS`, `DESCRIPTION` — one row per
  skill. `--json` emits the same data as a JSON array for programs.
  Skills that fail to load surface as an error row rather than
  aborting the listing. A new `ListCatalog` use case mirrors
  `ValidateCatalog`'s per-skill loop and returns `SkillRow[]`; a
  `list-formatter` adapter handles text + JSON output. (ROADMAP M7.)
- **`dstack doctor` command.** Diagnoses source-vs-install
  consistency: per-skill validation (reuses `ValidateCatalog`),
  version drift between `skill.yaml` and the installed `SKILL.md`
  frontmatter, and orphan directories under the install root that
  no longer correspond to a source skill. Exit 0 when consistent,
  1 when any issue is detected. (ROADMAP M20.)
- **`dstack build --strict`.** New flag that flips the build's exit
  code to 1 whenever any renderer warning was emitted (token near
  budget, include cycle broken, overlapping triggers). Default
  remains 0 so existing usage stays unchanged. Intended for CI.
  (ROADMAP M14.)
- **Contract suite for `HostRenderer`.** `test/contract/
  HostRenderer.contract.ts` defines the shared invariants
  (deterministic render, token count proportional to body length,
  frontmatter is parseable YAML, include warnings forwarded,
  near-budget warning fires). Applied to `ClaudeCodeRenderer`. A
  future Codex/Kiro adapter plugs into the same suite without
  rewrite. (ROADMAP M8.)
- **Contract suite for `Installer`.** `test/contract/
  Installer.contract.ts` covers fresh write, idempotent skip on
  identical content, rewrite on content change, orphan removal,
  and path-policy rejection. Applied to `FsInstaller`. Tests run
  under `~/.dstack/skills/__contract-test-*` (an allowed root) and
  clean up after themselves. (ROADMAP M9.)
- **End-to-end integration test.** `test/integration/
  build-and-install.test.ts` wires real adapters and runs the
  same pipeline as `dstack build`: write fixture skills, render,
  install, assert files on disk. A second case generates 100
  minimal skills and asserts the full pipeline finishes in under
  1 second (the claim in the README). (ROADMAP M10.)
- **Agent Skills schema compatibility test.** `test/contract/
  AgentSkillsSchema.contract.test.ts` renders every real skill in
  `skills/` and asserts the frontmatter conforms to the official
  Anthropic Agent Skills schema (kebab-case `name`, non-empty
  `description`, optional `license`/`compatibility`/`allowed-tools`
  with correct types). Surfaces drift if either side changes.
  (ROADMAP M19.)
- **CI pipeline.** `.github/workflows/ci.yml` runs `bun install
  --frozen-lockfile`, `bun run typecheck`, `bun test`, and `bun run
  validate` on every pull request and push to `main`. Five-minute
  timeout per job. Required for merge. (ROADMAP M11.)
- **`CONTRIBUTING.md`.** Step-by-step walk from "I have an idea" to
  "my skill renders, validates, and a test verifies it." Covers
  scaffolding, schema basics, prompt conventions, validation,
  rendering, testing, commits, version bumps, and when to write a
  new ADR. Cross-references the specs rather than duplicating them.
  (ROADMAP M12.)
- **`DSTACK_LOG=debug` env-gated console telemetry.** New
  `ConsoleTelemetry` adapter writes one line per telemetry event
  to stderr in the format `[<ISO ts>] <kind> <JSON details>`.
  Off by default; opt-in by setting `DSTACK_LOG=debug`. Takes
  precedence over `DSTACK_TELEMETRY=local`. Surfaces what each use
  case is doing without changing domain or application code.
  (ROADMAP M13.)

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
