# subagent-driven-development — changelog

- **0.6.2** — 2026-09-04: the implementer prompt names the proof (run the command, read the output) without invoking `/verifying-before-done` (pointer shape, licensed by the 2026-09 Opus 5 ablation); a review loop is capped at two rounds per task before the reports go to the user (ADR-0031 rule 6). The implementer self-review and the final whole-implementation pass stay until the Task 12 ablation reports.

- **0.6.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.6.0** — Generated code arrived padded with comments that narrate it, which
  reads as machine-written and costs credibility at senior level. The comment
  rule now sits in `references/implementer-prompt.md`, which the implementer
  reads before writing code, and in `references/code-quality-reviewer-prompt.md`.
- **0.5.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.5.1** — ADR-0030 list openness: the red-flag list is open.
- **0.5.0** — Added status write-back to the plan's `## Status` block
  (`/writing-plans` 0.7.0), owned by the orchestrator so parallel subagents
  cannot clobber the file. Without it, same-session execution finished tasks
  the next session had no record of — the same gap `/executing-plans` 0.3.0
  closes for separate sessions.
- **0.4.0** — Reciprocated `/test-driven-development` 0.6.0: the implementer
  prompt now delegates the risk-tier decision (inside → failing test first;
  outside → frozen case list with expected outcomes, then tests) instead of
  restating the old unconditional iron law, which contradicted `Tier: none`
  tasks arriving from `/writing-plans`.

- **0.3.0** — Fixed an unsupported claim: the body advertised "subagents follow
  TDD naturally" while `references/implementer-prompt.md` only said "following
  TDD *if task says to*". The prompt now instructs `/test-driven-development`
  (skippable only for no-behavior-change tasks) and `/verifying-before-done`,
  so the claim holds. Added the nearest-neighbour boundary table — chiefly
  **`/dispatching-parallel-agents`** (concurrent, already-independent problems)
  vs this skill (sequential tasks from one plan). Replaced the five-heading
  "Advantages" pitch with one get/pay trade-off table (dstack voice).
- **0.2.0** — Named the judgment (which context each subagent needs;
  reading a BLOCKED status as plan-wrong vs model-too-weak). Hardening
  (v3 plan): converted both graphviz blocks to a decision table and a
  numbered process; replaced TodoWrite with host-accurate phrasing;
  normalised headings to dstack voice.
- **0.1.0** — Initial. Sub-skill references use the `/skill` form; prompt
  templates live in `references/` rather than inline, so the body stays the
  dispatch surface.
