# Deferred from v3 — YAGNI register

This file extends [v1's DEFERRED.md](../v1/DEFERRED.md) and
[v2's DEFERRED.md](../v2/DEFERRED.md). All prior items (D1–D21) remain
deferred under their original triggers unless explicitly updated
below.

This document lists new items that were considered for v3 and
deferred, plus status updates for prior items that v3 partially
unlocks. Each entry includes the reason and the condition that would
unlock it.

## Terms used in this document

| Term | Definition |
|---|---|
| YAGNI | "You Aren't Gonna Need It." A discipline of not building features until they are actually needed. |
| Trigger | A concrete condition that, if it becomes true, makes us reconsider. |
| Partially unlocked | A prior DEFERRED item that v3 implements in scoped form; the broader item remains deferred. |

---

# Status updates for prior DEFERRED items

## D17 — LLM-judge evaluation harness (partially unlocked by M48)

- **Status change**: v3's M48 (`dstack eval` on-demand subcommand)
  implements the scoped form of v1 D3 / v2 D17. The trigger
  ("ported skill quietly degrades", or "second contributor lands a
  skill PR") fired in a different shape: the user explicitly named
  output quality as the v3 theme, which is the same underlying
  concern.
- **What v3 ships**: per-skill eval cases (`skills/<id>/eval/
  cases.jsonl`), `claude -p` subprocess for response + judge,
  rubric-based scoring, JSONL output to `~/.dstack/evals/<id>/`,
  on-demand only (not part of `build`).
- **What stays deferred**: a SkillsBench-style automated CI eval
  gate, baseline-curation pipeline, cross-model evaluation (the
  M48 design uses one model for both response and judge), and any
  upload of eval results to a remote endpoint (ADR-0006 forbids
  remote telemetry).
- **Trigger to revisit the broader item**: a second contributor
  lands a skill PR AND wants a shared baseline against which to
  measure; OR the M48 single-model setup demonstrably misses a
  regression class that a multi-model eval would catch.

## D20 — Eval-driven skill authoring (partially unlocked by M47 + M48)

- **Status change**: v3's M47 (`/write-a-skill` meta-skill) plus M48
  (`dstack eval`) together provide the building blocks for the
  "Claude-A creates, Claude-B tests" loop that v2 D20 described.
  The meta-skill guides the author; the eval subcommand provides
  the measurement. v3 does not automate the loop.
- **What v3 ships**: M47 walks the author through the schema and
  invokes `dstack validate`; M48 measures the resulting skill against
  fixture cases when invoked manually.
- **What stays deferred**: orchestration that runs the loop
  end-to-end without human intervention — Claude-A drafts, Claude-B
  scores, Claude-A revises until the score crosses a threshold.
  This requires a feedback channel from B back to A that v3 does
  not build.
- **Trigger to revisit**: the user runs the manual loop three or
  more times and finds it tedious; OR M48's rubric produces
  high-variance scores that a multi-iteration loop would smooth.

---

# New items deferred in v3

## D22 — External URL link-rot validator

- **Why deferred.** v3's M44 (cross-reference validator) checks
  internal references (`[[id]]` and relative Markdown links). It
  does not check external URLs (http/https). Closing that loop
  requires network IO, which means a new port (`HttpClient` or
  `LinkChecker`), an adapter, contract tests, opt-in flag (offline
  builds must not break), and a cache to avoid hammering origins.
  None of dstack's eight skills depend on external URL freshness
  today.
- **What is in place.** M44 (`crossref-broken` warning for internal
  references). External URLs are treated as opaque strings.
- **Trigger to revisit.** A skill ships that materially depends on
  an external URL staying live AND the URL breaks at least once,
  silently degrading the skill.
- **Estimated effort when triggered.** 3 to 4 hours. New port + adapter,
  contract test suite, opt-in flag, cache file under `~/.dstack/`.

## D23 — Catalog quality dashboard / health badge

- **Why deferred.** v3 produces a lot of quality signal — M41–M44
  warnings, M48 eval scores, M50 snapshot drift, telemetry events.
  Aggregating these into a per-skill health badge or a catalog
  dashboard is attractive but premature. The eval rubric in M48 is
  v1; weighting eval scores against validator warnings before the
  rubric has stabilised would lock in a wrong formula.
- **What is in place.** Each signal is observable independently:
  `dstack validate --json`, `dstack eval`, `dstack doctor`. A user
  can compose these into a dashboard externally.
- **Trigger to revisit.** M48's rubric is in production for at
  least three months without revision AND the user composes the
  same ad-hoc dashboard twice.
- **Estimated effort when triggered.** 4 to 6 hours. New subcommand
  `dstack health [--catalog]`, aggregator in domain layer, JSON +
  human formatter.

## D24 — `dstack reorganize` (flat → bucket layout migration tool)

- **Why deferred.** M55 introduces optional `metadata.dstack.bucket`
  field and dual layout (flat or `skills/<bucket>/<id>/`). Adopting
  the nested layout is backward-compatible; nothing forces the
  migration. A tool that bulk-moves skills into bucket folders is
  one bash loop away if needed. Building it as a dstack subcommand
  adds surface area we may not exercise.
- **What is in place.** M55's optional `bucket` field works in flat
  layout. Nested layout works for new skills. Mixing is allowed.
- **Trigger to revisit.** The catalog grows past 15 skills AND the
  user wants to reorganise into nested layout AND `mv` plus a
  validator re-run proves slower than a dedicated subcommand.
- **Estimated effort when triggered.** 2 to 3 hours. New subcommand
  reading source layout, writing target layout, updating
  cross-references, dry-run by default.

## D25 — Diff-based two-tier test selection

- **Why deferred.** gstack runs a subset of tests gated by `git
  diff`: changes to "global touch-files" trigger the full suite,
  others trigger a focused subset. dstack's test suite runs in
  under one second locally; the optimisation has no payoff today.
- **What is in place.** `bun test` runs the full suite (~18 tests
  across unit / contract / integration). Fast enough to leave
  always-on.
- **Trigger to revisit.** Test suite grows past 100 tests AND wall
  time exceeds 30 seconds AND `bun test` becomes a friction point.
- **Estimated effort when triggered.** 2 to 3 hours. New `test/
  diff-select.ts` script that reads `git diff --name-only`, maps
  changed files to relevant test files, and invokes `bun test
  <paths>`.

## D26 — Subagent dispatch pattern within skills

- **Why deferred.** superpowers' pattern spawns a fresh subagent
  inside a skill (e.g., a code-review skill spawns a "spec
  reviewer" subagent first, then a "code quality" subagent). This
  is a host-level orchestration capability, not a catalog-renderer
  concern. dstack does not render orchestration; skills emit
  prompt text and the host decides what subagents to spawn.
  Building catalog support for subagent dispatch would conflict
  with ADR-0003 (skills are YAML + Markdown only).
- **What is in place.** Skills can describe subagent usage in the
  prompt body. Claude Code's Agent tool is already available to
  the agent at runtime; the skill body can instruct the agent to
  use it. No catalog support needed.
- **Trigger to revisit.** Two or more shipped skills need
  identical subagent-dispatch boilerplate AND that boilerplate is
  more verbose than the skills' actual content. The fix at that
  point is likely a shared `references/subagent-dispatch.md` (or
  a `_shared/` include), not a catalog primitive.
- **Estimated effort when triggered.** 1 to 2 hours for the shared
  reference; 4 to 6 hours plus a new ADR if catalog-level
  primitive is needed.
- **Status (2026-06-02).** Trigger fired. Two shipped skills now carry
  subagent-dispatch content — `dispatching-parallel-agents` and
  `subagent-driven-development` (plus the latter's three
  `references/*-prompt.md` templates) — imported under
  [ADR-0024](../../adr/0024-catalog-breadth-over-yagni.md). Per this
  entry's own guidance the fix is the **shared-reference** path
  (`references/subagent-dispatch.md`), not a catalog primitive; it is
  scheduled in [skill-hardening-plan.md](skill-hardening-plan.md). The
  renderer-primitive rejection still stands: dstack renders no
  orchestration. Importing prose skills that *describe* subagent use was
  always permitted by the "What is in place" note above — that part was
  never deferred.

## D27 — Multi-judge ensemble for benchmark reliability

- **Why deferred.** v3's M48 (pairwise) and M59 (multi-candidate
  benchmark) use a single `claude -p` invocation as judge. The same
  model is used for both response generation and verdict. A more
  rigorous design uses an ensemble of judges (e.g., Claude Opus
  judges responses generated by Claude Sonnet, plus an independent
  judge model) to reduce single-model bias. v3 ships with single-
  judge as the baseline; ensemble is deferred until baseline
  variance is observed to be problematic.
- **What is in place.** M48's `--repeat <n>` flag runs each case n
  times to dampen single-shot variance. The aggregate mean ±
  stddev surfaces obvious instability. ADR-0023 documents the
  single-judge limitation explicitly.
- **Trigger to revisit.** The user runs M59 against ≥ 3 reference
  catalogs and the verdicts swing meaningfully between runs (e.g.,
  same skill wins and loses in different runs of the same case
  set). The instability is what motivates ensembles.
- **Estimated effort when triggered.** 1 to 2 days. New port
  `JudgeEnsemble` (or extend `Judge` with `--judges <list>`),
  rubric aggregation across judges, ensemble-disagreement metric
  in output.

## D28 — Human-in-the-loop benchmark calibration

- **Why deferred.** Even with M60 (UAT scenarios), the user's
  manual pass/fail is binary. A more rigorous loop would have the
  user occasionally grade a benchmark response against the LLM-
  judge's grade — calibrating the judge over time. This is what
  Anthropic's `skill-creator` benchmark viewer enables. v3 does
  not ship calibration tooling; UAT is one-shot pass/fail.
- **What is in place.** UAT runs land in
  `skills/<id>/uat/runs/<date>.md`. Benchmark verdicts land in
  `~/.dstack/benchmarks/<topic>/<timestamp>/leaderboard.md`. The
  user can manually compare these documents.
- **Trigger to revisit.** The user notices the LLM-judge
  systematically disagrees with their UAT verdict in three or
  more skills.
- **Estimated effort when triggered.** 3 to 5 days. A new
  `dstack calibrate` subcommand, a small SQLite store for
  judge-vs-human pairs, a re-weighting protocol for the rubric.

---

## D29 — Machine-enforced hybrid-by-default (hard gate)

- **Why deferred.** ADR-0025 enforces the doctrine lightly: docs +
  `/writing-skills` + the optional `calibration` flag + a band-aware
  `missing-spine` *warning*. A validate ERROR gate and a CI check that
  `calibration: judgment-dominant` carries an evidence line were
  deliberately NOT added (YAGNI).
- **What is in place.** The `missing-spine` warning fires for
  `workflow`/`deterministic-dominant` skills (non-`deterministic` type)
  whose body has no ordered list, table, or checklist;
  `judgment-dominant`, `schema-meta`, and `type: deterministic` are
  exempt. It is a warning, not an error — the build still succeeds.
- **Trigger to revisit.** ≥3 skills ship spine-less while the warning is
  ignored, OR a skill is set to `judgment-dominant` without an evidence
  line and ships, OR a second host needs the bands machine-enforced.
- **Estimated effort when triggered.** 1 to 2 days. Write an ADR
  superseding the light-enforcement clause of ADR-0025, promote
  `missing-spine` to an error, and add the evidence-line CI check.

---

# How to read this list

Same as v1 and v2: each entry is a **promise to revisit when the
trigger fires**, not a "never." Most items here will stay deferred
forever, and that is the correct outcome.

When implementing a milestone, scan this list for any partially-
unlocked items in the same area; the trigger condition may have
shifted enough that scope expansion is warranted.

# Items rejected (not deferred)

Items added to v1's rejected list and v2's rejected list still
apply. v3's audit of the four reference repositories surfaced
additional ideas worth listing as rejected (not just deferred), so
future iterations do not re-litigate them:

| Item | Source repo | Why rejected |
|---|---|---|
| Bootstrap-hook auto-trigger skills | superpowers | Conflicts with ADR-0001 (no IO at domain) and the agentskills.io invocation model. dstack uses explicit slash-command invocation. |
| Cross-harness CI (Codex / Cursor / Claude Code) | superpowers | v1 D1 / v2 D12 apply. The `HostRenderer` port is in place; a real adapter ships only when a specific host demands a non-spec field. |
| Persistent browser daemon (`browse` HTTP server) | gstack | Conflicts with ADR-0005 (Bun + TS, no compiled binary distribution) and ADR-0007 (browse stays in its own process when it eventually ships, with minimal surface). |
| ML-based prompt-injection classifier (22 MB ONNX) | gstack | dstack has no remote attack surface, no tool-call adapter, no daemon. Defending against prompt injection at the catalog layer solves a problem the catalog does not have. |
| Canary token injection + output buffer scan | gstack | Same reason as the ML classifier. |
| Compiled-binary distribution (`bun build --compile`) | gstack | ADR-0005 stands. dstack ships as `bun run`. |
| `/plugin marketplace` registration | anthropics-skills | v1 D6 (plugin/extension system) applies. dstack is single-user; distribution surface is not the catalog's concern. |
| Caveman compression mode (75% response compression) | mattpocock | Host-conversation concern. dstack does not host conversational skills. |
| MCP builder skill in dstack catalog | anthropics-skills | Orthogonal to a catalog renderer's mission. Users can hand-author MCP skills via the standard authoring flow. |
| Zoom-out architectural-perspective skill | mattpocock | Existing dstack skills (`debugging`, `code-review`) already cover the territory. Could be reconsidered as a future skill if the user requests it. |
| Per-skill CONTEXT.md glossary | mattpocock | Single-user catalog. The root-level CONTEXT.md plus M58's mini-spec cover the shared-terminology role. Per-skill glossaries are overkill. |
| Auto-trigger on session start via bootstrap hook | superpowers | Same reason as the first entry. Explicit invocation is the contract. |
