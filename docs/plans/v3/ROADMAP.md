# dstack v3 — Roadmap

The list of work needed to take dstack from v2 (strict agentskills.io-
compatible renderer, 4-type taxonomy, bundled resources, eight skills)
to v3 (deeper validation, richer authoring DX, eval harness on-demand,
catalog organisation).

The evidence behind v3's design choices is in [RESEARCH.md](RESEARCH.md).
The items deliberately left out are in [DEFERRED.md](DEFERRED.md).

Each milestone has:

- **Why**: the user problem this solves.
- **Acceptance**: the concrete conditions that mark the milestone as done.
- **Effort**: estimated AI-pair time.
- **Depends on**: other milestones or ADRs that must finish first.
- **Open questions**: decisions still to make.

## The v3 thesis

v1 landed the architecture. v2 aligned the catalog with the
agentskills.io open standard. **v3 raises the structural quality of
dstack skills and the rigour of how that quality is measured — so the
claim "dstack skills are better than the reference catalogs" stops
being an assertion and becomes a hypothesis that can be falsified.**

The user is on Claude Code Max 20x, not the API. Token economy is not
a constraint; an LLM-judge eval via `claude -p` subprocess is on the
table, and comparative head-to-head against superpowers / mattpocock /
anthropics / gstack skills is in scope.

Quality has **four** pressure points:

1. **Content fidelity** — skill body must be coherent, structured,
   and grounded in its declared triggers and description.
2. **Authoring rigour** — the author (currently a single user) must be
   able to write a new skill that meets the bar, and tell when it
   slips.
3. **Rendered-artifact stability** — the bytes Claude Code reads from
   `.claude/skills/<id>/SKILL.md` must be reproducible and exactly
   what the spec describes.
4. **Comparative measurement** — dstack must be able to run a
   skill side-by-side against an equivalent skill in another catalog
   and produce a defensible per-dimension verdict, plus a UAT
   protocol where the user manually validates real-world outcomes.

Pressure point #4 is what turns v3 from "we believe dstack is better"
into "here is the evidence." It is also where v3 is most likely to
discover that a reference catalog beats dstack on some dimension —
and that is fine, because the measurement loop tells us what to
improve.

## Honest framing of the "better than references" claim

v3 ROADMAP does not claim every dstack skill is already better than
its reference counterpart. It claims:

- the **structural validators (M41–M44)** enforce a higher bar than
  any reference catalog enforces today;
- the **comparative benchmark (M48 `--vs` + M59 `dstack benchmark`)**
  makes the head-to-head verifiable;
- the **UAT scenarios (M60)** capture the user's real-world judgement;
- when a dstack skill loses the comparison, the **eval-driven
  authoring loop** (M47 meta-skill + M48 eval + M59 benchmark)
  rewrites it until it wins or until the benchmark is wrong.

The bar to "ship v3" is not "every skill wins every comparison." It
is "every skill has been measured, the wins and losses are
documented, and the user has signed off via UAT."

## Two tracks in v3

| Track | Focus | Milestones |
|---|---|---|
| **A — Content & Authoring Quality** | Validator depth, wizard, meta-skill, eval harness, workflow skills | M40–M49 |
| **B — Output, Render & Catalog Quality** | Snapshot tests, renderer refactor, CLI polish, catalog buckets, mini-spec | M50–M58 |
| **C — Measurement & Validation** | Comparative benchmark, UAT scenarios, quality-measurement methodology | M59, M60, M48 (extended) |

The three tracks share dependencies but can be implemented in parallel
once the foundation lands.

## Tier classification

Same MoSCoW prioritization as [v1's ROADMAP](../v1/ROADMAP.md) and
[v2's ROADMAP](../v2/ROADMAP.md).

| Tier | Meaning |
|---|---|
| **Must** | dstack cannot be considered v3 without this. |
| **Should** | High value, but v3 can ship without it. |
| **Could** | Nice to have. Postpone if Must or Should take longer. |

---

# Must (blocking for v3)

## M40 — v1-legacy schema migration

- **Why.** Five skills (`brainstorm`, `careful`, `debugging`, `tdd`,
  `verification`) predate the v2 4-type taxonomy. They lack explicit
  `metadata.dstack.type`, `side_effects`, and `agency` fields. Today
  the validator infers their type from structure; that works but means
  the catalog is split into "audited" (v2-native) and "inferred"
  (v1-legacy). Track A's deeper validators (M41–M44) need every skill
  to declare the type so per-type rules apply uniformly.
- **Acceptance**:
  - Each of the five skills declares `metadata.dstack.type` explicitly
    (`hybrid | semantic | deterministic | schema-semantic`).
  - Each declares `metadata.dstack.side_effects` and
    `metadata.dstack.agency` explicitly (no implicit defaults).
  - Each skill version bumps to 0.2.0 with a body `## Changes` entry
    explaining the schema delta (depends on M45 format, written
    in parallel).
  - `bun run validate` passes with zero `missing-type` warnings.
- **Effort**: 1 to 2 hours (mostly classification + version bump).
- **Depends on**: none — can start immediately.
- **Open questions**:
  - `careful` is procedural-advisory; pick `semantic` with
    `agency: deliberative`? Or `semantic` with `agency: reactive`?
    **Decision: `agency: deliberative`** — the skill explicitly asks
    the agent to pause and reason before destructive ops.
  - `brainstorm` should adopt the `grill-me` discipline (mattpocock-
    skills): one question at a time + recommendation per question.
    **Decision: yes** — bake it into the migration so the polished
    skill ships under v3.

## M41 — Trigger-body coherence validator

- **Why.** The `metadata.dstack.triggers` array tells the user when
  a skill should fire. Today nothing checks whether those trigger
  phrases are reflected in the skill body. A trigger like "investigate
  a test failure" is useless if the body talks only about feature
  development. Drift between triggers and body is silent quality rot.
- **Acceptance**:
  - New domain function `triggerCoherence` returns a warning kind
    `trigger-not-grounded` when a trigger phrase has Jaccard similarity
    < 0.5 (on content tokens, stopwords removed) against both the
    `description` field and the body's "When to use" / "When NOT to
    use" sections.
  - Wired into `ValidateCatalog`. Non-fatal warning by default;
    `--strict` makes it fatal (per M53).
  - All eight existing skills (after M40) pass with zero warnings.
  - Table-driven unit tests cover: exact match, paraphrase, missing
    phrase, partial overlap.
- **Effort**: 2 to 3 hours.
- **Depends on**: ADR-0018 (trigger-body coherence as a domain rule).
- **Open questions**:
  - Should triggers be allowed to opt out (`triggers_loose: true`)?
    **Decision: no.** The escape hatch is to fix the trigger or the
    body — silencing the check defeats its purpose.

## M50 — Snapshot contract tests for rendered output

- **Why.** `bun run build` writes `.claude/skills/<id>/SKILL.md`
  files but no test asserts the exact byte content of the rendered
  output. A regression in the renderer (cosmetic frontmatter shift,
  schema-table format change, includes resolution bug) lands silently
  until a user notices. Snapshot tests pin the contract.
- **Acceptance**:
  - New test file `test/contract/RenderSnapshot.contract.test.ts`.
  - One snapshot per skill type (`hybrid`, `semantic`, `deterministic`,
    `schema-semantic`) plus one with `includes` plus one with
    `triggers`. Snapshots live in `test/fixtures/snapshots/`.
  - `UPDATE_SNAPSHOTS=1 bun test` regenerates snapshots; default `bun
    test` compares. Mismatch prints a unified diff capped at 30 lines.
  - CI runs the test without the env flag.
- **Effort**: 2 to 3 hours.
- **Depends on**: none — independent of validator work.
- **Open questions**:
  - Should snapshots include the resolved `includes:` output, or only
    the un-included form? **Decision: include resolution.** That is
    what Claude Code actually reads.

## M51 — Renderer template consolidation

- **Why.** `src/adapters/claude-code/ClaudeCodeRenderer.ts` is now
  ~230 lines with `buildFrontmatter`, `renderDescription`,
  `renderSchemaTable`, `quoteScalar` and other helpers as top-level
  functions in one file. Logic is correct but the responsibilities
  are mixed. As Track A adds per-skill rules and Track B adds
  snapshot pins, the renderer becomes harder to evolve.
- **Acceptance**:
  - Pure helpers extracted: `src/adapters/claude-code/frontmatter.ts`
    (export `buildFrontmatter(spec, host)`) and
    `src/adapters/claude-code/schema-table.ts` (export
    `renderSchemaTable(schema)`).
  - `ClaudeCodeRenderer.render` is ≤ 30 lines, pure orchestration.
  - No new port introduced (YAGNI — single implementor).
  - M50 snapshots are byte-identical before and after the refactor.
- **Effort**: 2 hours.
- **Depends on**: M50 (snapshots pin the behavior under refactor).
- **Open questions**: none.

## M54 — Application-layer unit tests

- **Why.** Use cases (`BuildCatalog`, `BuildSkill`, `InstallSkills`,
  `ValidateCatalog`, `ListCatalog`) are covered only via integration
  paths through CLI. When a use-case failure mode appears in
  production it is hard to isolate. Unit tests with in-memory fakes
  let each use case be exercised against its full failure surface.
- **Acceptance**:
  - In-memory fake `SkillRepository` and fake `HostRenderer` in
    `test/contract/fakes/` (or reused from existing contract suites).
  - One unit test file per use case under `test/unit/application/`.
  - Coverage of at least: happy path, token-budget-exceeded,
    missing-include, orphan-install, warning aggregation,
    render-failure propagation.
  - `bun test --coverage` reports ≥ 85% line coverage on
    `src/application/*`.
- **Effort**: 3 to 4 hours.
- **Depends on**: none.
- **Open questions**: none.

---

# Should (high value, not blocking)

## M42 — Description accuracy (drift) validator

- **Why.** Sibling of M41. The `description` frontmatter is what
  Claude Code reads to decide whether to load the skill. If the
  description promises "audits database schemas" but the body talks
  about HTTP APIs, the agent will load the skill in the wrong
  context. A heuristic drift check catches the worst cases.
- **Acceptance**:
  - New domain function `descriptionAccuracy` returns warning kind
    `description-body-drift` when the top-3 verbs (by frequency,
    stopwords excluded) in the description do not appear in the body,
    or vice versa.
  - Heuristic POS detection: imperative verbs from a small built-in
    list (`audit`, `review`, `debug`, `test`, `refactor`, …) + words
    ending in `-ing` / `-e` / `-es`. No NLP library.
  - Wired into `ValidateCatalog`. Warning by default, fatal under
    `--strict`.
- **Effort**: 2 hours.
- **Depends on**: ADR-0018 (same record as M41).
- **Open questions**:
  - English-only assumption acceptable? **Decision: yes.** All current
    skills are in English. If a non-English skill ever lands, the
    check can be skipped per skill via a `metadata.dstack.lang` hint
    (out of scope for v3).

## M43 — Workflow structure check

- **Why.** dstack skills converge on a body structure: "When to use",
  "What this does" / "How to apply", "Anti-patterns". v2's polish
  established the convention informally. Making it a validator rule
  prevents new skills from drifting into prose-blob style that is
  harder for Claude Code to parse.
- **Acceptance**:
  - New domain function `workflowStructure` emits warning kind
    `workflow-structure-incomplete` when a skill body is missing one
    of the required H2 sections.
  - Required sections (by type):
    - All types: a "When to use" H2 section (or equivalent phrasing).
    - `hybrid`, `semantic`, `schema-semantic`: also need
      "How to apply" / "What this does" and an "Anti-patterns" /
      "When NOT to use" section.
    - `deterministic` skills with body < 200 tokens are exempt from
      "How to apply" (they point at a script).
  - Section-matching uses fuzzy match on H2 text (case-insensitive,
    handles "When to use this skill", "When to apply", etc.).
  - Wired into `ValidateCatalog`. Warning by default, fatal under
    `--strict`.
- **Effort**: 2 to 3 hours.
- **Depends on**: ADR-0019 (required body structure per skill type).
- **Open questions**:
  - Override allowed for an author who deliberately uses non-standard
    headings? **Decision: no.** If the override is common enough to
    matter, the rule is wrong.

## M44 — Cross-reference validator

- **Why.** Skills cross-reference each other (`[[code-review]]`,
  relative paths like `references/checklist.md`, ADR links like
  `docs/adr/0011-import-path-aliases.md`). Refactors break these
  references silently. A simple presence-check (does the target
  exist?) prevents 90% of cross-reference rot.
- **Acceptance**:
  - New domain function `crossReferences` walks the body for
    `[[id]]` references and Markdown links with relative paths.
  - For each `[[id]]`, check that `skills/<id>/SKILL.md` exists.
  - For each relative Markdown link, check that the target file
    exists (within the skill folder OR within the repo root, both
    allowed).
  - External URLs (http/https) are **not** checked (would require
    network IO; see DEFERRED D22).
  - Emit warning kind `crossref-broken` per broken reference. Fatal
    under `--strict`.
- **Effort**: 1 to 2 hours.
- **Depends on**: none.
- **Open questions**:
  - Should `[[id]]` accept `[[id#section]]`? **Decision: not in v3.**
    Section anchors complicate the resolver; presence-check at file
    level is enough.

## M49 — Foundational workflow skills (4 new skills)

- **Why.** v3's reference-repo audit surfaced four workflow skills
  that are universally applicable to any development workflow yet
  absent from dstack's catalog. Three come from
  superpowers/skills/: `writing-plans`, `executing-plans`,
  `finishing-a-development-branch`. One is the receiver-side
  counterpart to dstack's existing `code-review`:
  `receiving-code-review`. Together they fill the plan → execute →
  finish → respond-to-review workflow loop that today's eight skills
  do not cover. v1 M17 was gated on "10+ skills"; M49 plus M47
  (`/write-a-skill`) takes dstack from 8 to 13, unlocking the
  bucket organisation in M55 with concrete catalog density.
- **Status (2026-06-02).** Partially delivered ahead of validator
  readiness, under [ADR-0024](../../adr/0024-catalog-breadth-over-yagni.md)
  (catalog breadth over strict YAGNI for proven skills). `writing-plans`
  (commit `0dbb54e`), `executing-plans`, and
  `finishing-a-development-branch` (commit `ec982ad`) are imported as
  adapted-but-not-yet-hardened skills. `receiving-code-review` was
  **not** created as a separate skill: it was evaluated head-to-head
  against the existing `code-review`, found to be a subset, and folded in
  (the unique GitHub inline-thread-reply nugget was grafted; `code-review`
  bumped to 0.3.0). Three further proven superpowers skills were imported
  beyond this milestone's original scope —
  `dispatching-parallel-agents`, `subagent-driven-development`,
  `using-git-worktrees`. The full re-authoring to the dstack bar (voice,
  required body structure, trigger de-confliction, cross-reference
  wiring, and the D26 shared subagent-dispatch reference) is tracked in
  [skill-hardening-plan.md](skill-hardening-plan.md). The
  `eval/cases.jsonl` decision below ("yes for all four") is deferred
  until M48 lands.
- **Acceptance**:
  - `skills/writing-plans/SKILL.md` — type `semantic`,
    `agency: deliberative`, `side_effects: readonly`. Body covers:
    scope check, file structure, task granularity, plan header +
    task steps, self-review. Cross-references `[[brainstorm]]`
    (for upstream exploration) and `[[tdd]]` (for downstream
    test-first execution).
  - `skills/executing-plans/SKILL.md` — type `semantic`,
    `agency: deliberative`, `side_effects: local`. Body covers:
    load plan, execute task-by-task with verification checkpoint,
    finishing handoff. Cross-references `[[verification]]` and
    `[[writing-plans]]`.
  - `skills/finishing-a-development-branch/SKILL.md` — type
    `hybrid`, `agency: deliberative`, `side_effects: local`. Body
    covers: verify tests, detect environment (git worktree, branch
    state), present 4 options (merge, PR, discard, keep open),
    execute choice, cleanup. Bundled `scripts/check-branch-state.sh`
    runs `git status --porcelain` + `git log --oneline @{u}..` and
    prints a structured report. Cross-references `[[verification]]`
    and `[[code-review]]`.
  - `skills/receiving-code-review/SKILL.md` — type `semantic`,
    `agency: deliberative`, `side_effects: readonly`. Body covers
    the READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND pattern,
    anti-performative guards (no "you're absolutely right!"),
    pushback protocol when the reviewer is wrong. Cross-references
    `[[code-review]]` (giver side) and `[[verification]]`.
  - All four skills pass M41–M44 validators (trigger-grounded,
    description-coherent, structured body, valid cross-references).
  - Each declares 2–4 trigger phrases and a `## Changes` body
    section per M45.
  - Bucket assignment (after M55): `writing-plans` and
    `executing-plans` → `workflow`; `finishing-a-development-branch`
    → `workflow`; `receiving-code-review` → `review`.
- **Effort**: 4 to 6 hours.
- **Depends on**: M40 (legacy migration cleared), M41–M44
  (validators ready to grade the new skills), M45 (changelog
  format).
- **Open questions**:
  - Should `executing-plans` ship with a fixture `eval/cases.jsonl`
    for M48? **Decision: yes for all four**, even a small case set
    so M48 can measure them once it lands.
  - `finishing-a-development-branch` overlaps with the existing
    `verification` skill. Distinguish how? **Decision: `verification`
    is post-change quality gate; `finishing-a-development-branch`
    is the wrap-up decision tree (merge / PR / discard / keep open).
    Cross-reference, do not merge.**

## M52 — `--check` and `--json` CLI flags

- **Why.** Today `dstack build` always writes to disk. CI pipelines
  want a dry-run that exits non-zero on validation failure. Editor
  integrations want structured output to surface diagnostics. Adding
  both flags uniformly across `build`, `validate`, `doctor` makes
  dstack scriptable.
- **Acceptance**:
  - `dstack build --check` validates and renders in-memory; writes
    nothing. Exit code mirrors strict semantics from M53.
  - `dstack build --json`, `dstack validate --json`, `dstack doctor
    --json`, `dstack list --json` emit a single JSON object on stdout.
    Human-readable narrative goes to stderr (silent when piped).
  - JSON schema for each subcommand documented in
    `docs/cli-json-output.md`.
  - Unit tests per formatter under `test/unit/adapters/cli/`.
- **Effort**: 3 to 4 hours.
- **Depends on**: ADR-0021 (CLI output contracts).
- **Open questions**:
  - When both `--check` and `--json` are passed, JSON output reports
    what would have been written. Documented in
    `docs/cli-json-output.md`.

## M53 — `--strict` consistency + narrative `doctor`

- **Why.** v1 M14 shipped `--strict` for `build` only. v3 wants the
  flag to mean the same thing everywhere (warnings → exit 1).
  Separately, `doctor` today prints a row-per-skill grid that is
  greppable but not informative — a new author cannot tell from the
  output what to fix.
- **Acceptance**:
  - `--strict` available on `build`, `validate`, `doctor`. All treat
    any warning kind (including M41–M44 additions) as exit-1.
  - Default `doctor` output groups skills by status:
    "Sources OK (n)" / "Sources with warnings (n)" /
    "Sources with errors (n)" / "Orphans (n)". Each entry gets a
    one-line rationale.
  - `doctor --raw` preserves the v1/v2 row-per-line format for grep
    pipelines.
  - `doctor` optionally reads `~/.dstack/telemetry/events.jsonl`
    (when present) to surface the last build status; read is
    silent-skip on missing file.
- **Effort**: 2 to 3 hours.
- **Depends on**: M52 (shares ADR-0021), M41–M44 (warnings to gate on).
- **Open questions**:
  - Should the narrative include suggested next actions? **Decision:
    yes for known failure kinds.** For unknown warnings, just the
    warning kind + file location.

## M55 — Catalog buckets + `dstack list --by-bucket`

- **Why.** v1 M17 was gated on "10+ skills". After M47 (meta-skill
  `/write-a-skill`) and the v1-legacy migration we are at nine plus
  one — the threshold fires. Without bucket organisation `dstack
  list` becomes hard to scan. Mattpocock's catalog organises by
  `productivity/engineering/misc/deprecated`; anthropics-skills
  organises by `creative/technical/enterprise/document`. dstack
  picks domain-led buckets aligned with its current skill themes.
- **Acceptance**:
  - New optional field `metadata.dstack.bucket` (free string).
    Validator accepts the initial set
    `engineering | productivity | review | workflow | misc`.
  - `FileSkillRepository` supports both layouts:
    - Flat: `skills/<id>/SKILL.md` (still valid, `bucket` field
      optional).
    - Nested: `skills/<bucket>/<id>/SKILL.md` (one level of bucket
      directory under `skills/`).
  - `dstack list --by-bucket` groups output by bucket. Default
    `dstack list` adds a `bucket` column.
  - Optional `skills/<bucket>/README.md` (human-written) surfaced by
    `dstack list --by-bucket --verbose`.
  - Backward compatibility: any catalog that does not adopt buckets
    keeps working unchanged.
- **Effort**: 3 to 4 hours.
- **Depends on**: ADR-0022 (catalog bucket organization).
- **Open questions**:
  - Should the bucket list be enforced as enum, or free-string?
    **Decision: enum (initial five values), extensible via a future
    PR.** Free strings invite typos.

## M56 — Documentation cleanup

- **Why.** README still references the v1 layout (`skill.yaml`,
  `prompt.md`). CONTEXT.md says "five skills". CHANGELOG is behind.
  After v2 shipped these are noise that confuses new readers.
- **Acceptance**:
  - README rewritten for v2-only layout: quick-start uses `SKILL.md`,
    v1 instructions removed (with a link to `bun run migrate-v2`
    for any holdouts).
  - CONTEXT.md skill-count and example-skill list updated to the
    state after Track A lands (at least 8 skills).
  - CHANGELOG.md entry for v3.0.0 listing Track A + Track B
    milestones.
  - New `package.json` script `check:adr-links` (read-only grep) that
    fails if any `docs/adr/*.md` references a non-existent ADR
    number. Wired into CI.
- **Effort**: 1 to 2 hours.
- **Depends on**: most other Track A/B milestones (so the docs
  describe the v3 state accurately).
- **Open questions**: none.

---

# Could (postpone if Must or Should run long)

## M45 — Per-skill `## Changes` body + aggregated release notes

- **Why.** Skills evolve. The `version` field bumps but there is no
  per-skill changelog visible to the user. Superpowers, mattpocock,
  and anthropics-skills all ship a release-notes artifact. dstack v3
  adds a lightweight per-skill convention plus an aggregated output.
- **Acceptance**:
  - Skill body MAY include a top-level `## Changes` H2 section with
    one bullet per version bump.
  - Validator emits warning kind `version-bumped-no-changelog` when
    `version` is bumped without a `## Changes` entry (heuristic:
    look at git diff vs the previous build). Non-fatal.
  - New pure domain function `releaseNotes` aggregates each skill's
    `## Changes` into a single `docs/SKILL-RELEASE-NOTES.md` during
    `dstack build`. Aggregator is pure; writer is `FsInstaller`.
- **Effort**: 2 to 3 hours.
- **Depends on**: none.
- **Open questions**:
  - Should the aggregator dedupe identical entries across skills?
    **Decision: no.** Each skill's section is independent; dedup
    would hide real activity.

## M46 — Interactive `dstack new` wizard

- **Why.** Today `bun run new <id>` writes a skeleton template. The
  author then has to know the schema to fill it in. With M40–M44
  raising the validator bar, the gap between skeleton and a passing
  skill grows. A wizard asks the right questions in the right order.
- **Acceptance**:
  - `dstack new` (no args) launches a readline-driven wizard with
    six prompts: id (validated for kebab-case + uniqueness), type
    (enum), description (validated inline against M42 drift heuristic
    on the supplied body if any), triggers (one per line, empty +
    duplicate rejected), side_effects (enum), agency (enum).
  - Wizard writes to stdout-confirmed file.
  - Non-interactive mode preserved: `dstack new <id> --type <type>`
    works as before.
  - Wizard logic (questions, validators) is pure; only the readline
    glue is in the adapter. Pure logic ≥ 90% covered.
- **Effort**: 3 to 4 hours.
- **Depends on**: M40 (so the wizard asks the right fields), M42
  (for inline drift validation).
- **Open questions**:
  - Should the wizard offer to scaffold `scripts/` and `references/`?
    **Decision: yes when type implies them** (hybrid → scripts,
    schema-semantic → output_schema file).

## M47 — Meta-skill `/write-a-skill`

- **Why.** Anthropics's `skill-creator` and superpowers'
  `writing-skills` are both meta-skills: a skill that guides
  creating skills. superpowers' version adds a TDD discipline (write
  baseline tests first, then the skill, then refactor). With v3's
  validator vocabulary mature (M41–M44 warning kinds), a meta-skill
  can reference them verbatim so the author and the validator share
  language. This raises the ceiling on author quality without
  requiring out-of-band docs.
- **Acceptance**:
  - New skill `skills/write-a-skill/` of type `hybrid`, with
    `agency: deliberative`, `side_effects: local`.
  - Body walks the author through choosing type, drafting
    description, listing triggers, writing the body sections,
    running `dstack validate <id>`, iterating until clean.
  - Bundled `scripts/check.sh` runs `bun run validate <id>` and
    prints warnings in the same format the wizard expects.
  - Bundled `references/quality-checklist.md` enumerates the
    M41–M44 warning kinds with examples.
  - Body adopts the TDD-for-documentation pattern from superpowers'
    `writing-skills`: baseline test cases first (in `eval/cases.jsonl`
    per M48), then the skill body, then refactor against the failing
    cases until clean.
  - **Self-test**: the meta-skill must pass `bun run validate
    write-a-skill` in CI. The meta-skill cannot ship if it fails
    its own rules.
- **Effort**: 3 to 5 hours.
- **Depends on**: M40 (catalog clean), M41–M44 (warnings to cite),
  M55 (place under `engineering` or `workflow` bucket).
- **Open questions**:
  - Should it offer to spawn `dstack eval` (M48) after a draft?
    **Decision: yes when M48 is available.** Soft-skip if `claude`
    not on PATH.

## M48 — `dstack eval` on-demand LLM-judge subcommand (absolute + pairwise)

- **Why.** The biggest unknown in v3 is whether a skill actually
  improves Claude Code's output. A subjective read by the author is
  not measurement. The user is on Claude Code Max 20x, so spawning
  `claude -p` as a subprocess for evaluation is feasible. v1 D3 /
  v2 D17 (LLM-judge harness) is partially unlocked by the user's
  quality concern. Track C of v3 ("Measurement & Validation")
  starts here.
- **Acceptance**:
  - **Absolute mode** — `dstack eval <skill-id> [--baseline]
    [--cases <path>]`. For each case: spawn `claude -p "$prompt"`,
    capture response, then spawn a second `claude -p` as judge with
    a rubric (groundedness, follows-procedure,
    anti-pattern-avoidance, specificity, 1–5 Likert each).
  - **Pairwise mode** — `dstack eval <skill-id>
    --vs <other-skill-path>`. Same fixture cases run with each
    skill loaded; judge sees both responses anonymised
    (`response_a` / `response_b` randomly assigned) and picks the
    winner per rubric dimension plus an overall winner. Output
    includes the random a/b ↔ skill mapping for de-anonymisation.
  - Fixture cases per skill at `skills/<id>/eval/cases.jsonl`. Each
    line: `{prompt: string, expected_pattern?: string,
    anti_pattern?: string, notes?: string}`.
  - **Repeated runs** — `--repeat <n>` (default 3) runs each case
    n times and reports mean ± stddev to dampen judge variance.
  - Write JSONL output to `~/.dstack/evals/<id>/<timestamp>.jsonl`
    (absolute mode) or `~/.dstack/evals/<id>-vs-<other>/<timestamp>.jsonl`
    (pairwise mode).
  - **NOT** part of `dstack build`. Skip silently if `claude` is not
    on PATH. Telemetry events `eval.completed` and `eval.compared`
    emitted.
  - New port `Judge` in `src/domain/eval/` with a fake test double;
    the real adapter `src/adapters/claude-code/ClaudeCli.ts` wraps
    the subprocess. `Judge` supports both modes (scalar score and
    pairwise verdict).
  - Unit tests for the use case `RunEval` using the fake `Judge`,
    covering: absolute happy path, pairwise happy path, anonymised
    a/b assignment, repeat aggregation, missing-`claude` skip.
  - Integration test gated on `claude` being on PATH (skipped in CI
    by default; runs locally).
- **Effort**: 1.5 to 2.5 days (was 1 to 2 days; pairwise mode +
  repeat aggregation adds half a day).
- **Depends on**: ADR-0020 (LLM-judge eval as on-demand subprocess),
  ADR-0023 (quality measurement methodology), M40 (skills have
  explicit type to evaluate).
- **Open questions**:
  - Where do the rubric weights live? **Decision: hard-coded in the
    domain with a default for v3.** Per-skill rubrics deferred to a
    future iteration if the default rubric proves too coarse.
  - Does pairwise mode tell the judge which skill is dstack's?
    **Decision: no.** A/B is randomised and anonymised; the judge
    sees only the two responses + the prompt. The mapping is
    written to JSONL after the verdict for de-anonymisation.
  - Does this conflict with v1 ADR-0006 (telemetry opt-in, local-only)?
    **No.** Eval output is local-only. No upload, no remote endpoint.

## M59 — `dstack benchmark` (multi-candidate comparative)

- **Why.** M48's `--vs` mode is pairwise. The v3 thesis is
  "dstack vs the four reference catalogs as a whole." A single
  pairwise call against one alternative is not enough; the user
  wants to know "for the domain `debugging`, where does dstack stand
  against superpowers/systematic-debugging, mattpocock/diagnose, and
  gstack/investigate at the same time?" `dstack benchmark` runs the
  multi-candidate variant and aggregates a leaderboard. Track C
  measurement work concludes here.
- **Acceptance**:
  - New subcommand `dstack benchmark --topic <topic-name>
    --baseline <skill-path> --candidates <comma-list-of-paths>
    [--cases <path>] [--repeat <n>]`.
  - Fixture cases lives at `skills/<baseline-id>/eval/cases.jsonl`
    (the same file M48 uses). The judge protocol is the same as
    M48's pairwise, run iteratively against each candidate.
  - **Anonymisation across the whole batch** — for each case, every
    candidate (including baseline) gets a random letter (A, B, C,
    …). The judge sees N anonymous responses and ranks them per
    rubric dimension plus overall.
  - **Aggregated output** at
    `~/.dstack/benchmarks/<topic>/<timestamp>/`:
    - `verdicts.jsonl` — one row per case × dimension × rank.
    - `leaderboard.md` — human-readable summary: per-skill mean
      rank, win count per dimension, sample wins/losses with
      links to the response files.
    - `responses/<case-id>/<skill-letter>.txt` — raw responses for
      manual inspection.
  - Domain function `aggregateLeaderboard` is pure (takes
    `Verdict[]`, returns `Leaderboard`). Tested with table-driven
    cases (tie-breaking, missing dimensions, repeat aggregation).
  - **NOT** part of `dstack build`. Skip silently if `claude` not
    on PATH.
  - Telemetry event `benchmark.completed` with topic + skill count
    + total cases.
- **Effort**: 1 to 2 days.
- **Depends on**: M48 (foundation), ADR-0023 (methodology).
- **Open questions**:
  - How does dstack identify "the same topic" across catalogs?
    **Decision: user-curated.** The user passes
    `--candidates <list>` explicitly. v3 does not auto-discover
    equivalent skills.
  - Tie-breaking when judge ranks two responses equal?
    **Decision: report both as tied;** do not force a winner.
  - How many cases is enough? **Decision: ≥10 cases per topic for
    a defensible verdict.** Fewer than 10 → output prints a
    "low-confidence" banner.

## M60 — UAT scenarios per skill (manual acceptance)

- **Why.** LLM-judge eval (M48) and benchmark (M59) are automated
  proxies. The ultimate quality test is whether the user, doing
  real work, finds the skill useful when Claude Code activates it.
  UAT formalises that test: per-skill scenarios that the user runs
  manually in a real Claude Code session, with a checklist for
  pass/fail. No skill ships v3-final without UAT sign-off.
- **Acceptance**:
  - Each skill gains `skills/<id>/uat/scenarios.md` with:
    - 3 to 5 scenarios per skill (e.g., for `debugging`: "flaky
      Jest test", "memory leak in long-running script",
      "intermittent CI failure").
    - For each scenario: prompt template, expected behaviour (1 to
      3 bullets), pass criteria, fail criteria.
  - New CLI `dstack uat <skill-id>` prints the scenarios + checklist
    in stdout (or `--json` per ADR-0021) for the user to walk
    through interactively. Does not run anything.
  - User records pass/fail per scenario in
    `skills/<id>/uat/runs/<date>.md` (human-edited Markdown, simple
    format).
  - `dstack list --uat-status` shows per-skill UAT status: "n
    scenarios, last run YYYY-MM-DD, all-pass / m failures".
  - UAT is **mandatory before** declaring a skill v3-ready. Skills
    that have not been UAT'd against v3 carry a body warning
    section "UAT pending" until cleared.
  - Validator warning kind `uat-stale` if the latest UAT run is
    older than the skill's last source modification.
  - **Final report artifact** at `docs/v3-benchmark-report.md` —
    auto-generated by `dstack uat --report` after all UAT runs pass.
    Contents: per-skill benchmark leaderboard (from M59), per-skill
    UAT status, list of "wins / losses / not-yet-measured", overall
    v3 thesis verdict (signed off by the user with a footer). This
    is the document that answers "is dstack v3 actually better than
    the references?" with evidence.
- **Effort**: 2 to 3 hours (CLI + format + per-skill scenarios are
  authored as part of M40/M49 skill migrations, not here).
- **Depends on**: M40 (legacy migration), M49 (new workflow skills
  authored), M52 (`--json` for `dstack uat`).
- **Open questions**:
  - Should UAT scenarios live in the body of `SKILL.md` or
    separately? **Decision: separately** in
    `skills/<id>/uat/scenarios.md`. The body is what Claude Code
    sees; UAT is for the human author. Bundled but distinct.
  - Should UAT be required for every release, or only v-major?
    **Decision: v-major** (a v3.0.0 release requires UAT; a
    v3.0.1 patch can skip if no body changes).

## M57 — Repo-level `RELEASE-NOTES.md` + `dstack list --released`

- **Why.** v3 introduces the `## Changes` per-skill convention
  (M45) and the aggregated `docs/SKILL-RELEASE-NOTES.md`. Separately
  the dstack tool itself ships version bumps. A repo-level
  `RELEASE-NOTES.md` (root) tracks dstack releases the way most
  open-source tools do.
- **Acceptance**:
  - New `RELEASE-NOTES.md` at repo root: one section per dstack
    release, chronological, listing milestone-level changes and any
    skill version bumps that shipped in the release.
  - New `dstack list --released` flag: per-skill column with
    "changed since last build" badge (compare source version vs
    rendered `.claude/skills/<id>/SKILL.md` frontmatter).
- **Effort**: 1 to 2 hours.
- **Depends on**: M45 (per-skill changelog convention).
- **Open questions**: none.

## M58 — Formal mini-spec `docs/spec/dstack-skill-spec.md`

- **Why.** dstack extends agentskills.io with `metadata.dstack.*`
  fields. The conventions are documented across ADRs (0012–0017) but
  no single normative document enumerates them. A new contributor
  has to read ADRs to understand the extensions. anthropics-skills
  publishes a formal spec; dstack should too.
- **Acceptance**:
  - New `docs/spec/dstack-skill-spec.md` enumerates every
    `metadata.dstack.*` field: `type`, `version`,
    `context_budget_tokens`, `side_effects`, `agency`, `triggers`,
    `output_schema`, `bucket`. Each entry includes: type, default,
    allowed values, example, source ADR.
  - Grammar table (one of ABNF or a structured table; pick one and
    keep it consistent).
  - Spec versioned (`v3.0`); future bumps tracked in same doc.
  - Validator error messages cite spec sections where applicable
    (e.g., "see dstack-skill-spec.md §metadata.dstack.type").
- **Effort**: 2 to 3 hours.
- **Depends on**: M40–M44 (so the spec describes the v3 reality, not
  a moving target).
- **Open questions**:
  - Should the spec be machine-readable (JSON Schema)? **Decision: no
    for v3.** Prose first; machine-readable schema can come in a
    later iteration if a need arises (e.g., M30-style spec test for
    dstack extensions).

---

# Effort summary

| Tier | Items | Estimated effort |
|---|---|---|
| Must | M40, M41, M50, M51, M54 | ~10 to 14 hours |
| Should | M42, M43, M44, M49, M52, M53, M55, M56 | ~18 to 25 hours (M49 adds 4 to 6) |
| Could (incl. Track C measurement essentials) | M45, M46, M47, M48, M59, M60, M57, M58 | ~22 to 35 hours (M48 + M59 + M60 dominate) |

**Note on tier vs Track C.** The MoSCoW tier above is structural;
v3's thesis treats Track C (M48, M59, M60) as **essential for ship**
even though the tier label is "Could". They are kept in Could because
each is technically skippable if `claude -p` is unavailable, but the
cut order below prioritises them.

# Suggested order

The dependencies suggest this order:

```
M40 (legacy migration)
  │
  ├─→ M41 (trigger coherence)  ── ADR-0018
  │     │
  │     v
  │   M42 (description drift)
  │     │
  │     v
  │   M43 (workflow structure) ── ADR-0019
  │     │
  │     v
  │   M44 (cross-references)
  │     │
  │     v
  │   M49 (4 new workflow skills)
  │
  ├─→ M45 (release notes — parallel)
  │
  └─→ M46 (wizard) ── M47 (/write-a-skill)
        │
        v
      M48 (eval, absolute + pairwise) ── ADR-0020 ── ADR-0023
        │
        v
      M59 (multi-candidate benchmark)
        │
        v
      M60 (UAT scenarios) ── ship gate

M50 (snapshots — pin behavior)
  │
  ├─→ M51 (renderer refactor)
  │
  └─→ M54 (app unit tests — parallel)

M52 (--check + --json) ── ADR-0021
  │
  v
M53 (--strict + narrative doctor)

M55 (buckets) ── ADR-0022
  │
  v
M56 (docs cleanup)
  │
  v
M57 (release notes) ── M58 (formal spec)
```

A reasonable v3 launch order: **M40 + M50 + M51 + M54** (foundation),
then **M41–M44** (validator depth) in parallel with **M52 + M53 +
M56** (CLI + docs polish), then **M45 + M46 + M47 + M49 + M55**
(authoring DX + new workflow skills + organisation), then
**M48 + M59 + M60** (Track C measurement — this is the v3 thesis
proof), and finally **M57 + M58** (release notes + spec) as the
long-tail.

**Track C is the ship gate.** v3 does not declare done until every
v3 skill has been measured via M48, benchmarked via M59 against at
least one reference equivalent, and UAT'd via M60 by the user.
Wins and losses are documented; losses become inputs to the
eval-driven authoring loop (M47 → M48 → re-edit → re-eval) until
either the skill wins or the benchmark is shown to be wrong.

If time runs short, drop **M58** first (formal spec can land in a
point release), then **M57** (release notes catch-up). Do **not**
drop M48/M59/M60 — without them the v3 thesis is unverifiable.

# What's next (after v3 ships)

Once v3 ships, the catalog has deeper validators, an eval harness,
a comparative benchmark, a UAT protocol, better authoring DX, and a
formal mini-spec. Most importantly, the **measurement loop** is in
place: every skill has a documented win/loss record against
reference catalogs, and every v3 release has a UAT sign-off. The
natural follow-up directions are tracked in
[DEFERRED.md](DEFERRED.md). The most likely v4 themes:

- **Automated eval-driven authoring loop** (v2 D20) — Claude-A /
  Claude-B orchestration built on top of M47 + M48 + M59, if the
  user finds the manual rewrite-after-loss loop too slow.
- **Multi-host renderer adapters** (v1 D1 / v2 D12) — if a specific
  host adds a non-spec frontmatter field that the user's workflow
  needs.
- **Hook engine** (v1 D2 / v2 D13) — if a second skill needs runtime
  interception.
- **Statistical confidence layer for benchmarks** — if M59's
  single-judge variance produces unstable verdicts, introduce
  multi-judge ensembles or human-in-the-loop calibration.
- **Schema-driven runtime validation** (v2 D21) — if a
  schema-semantic skill drifts in production and the build-time
  schema check is not enough.
