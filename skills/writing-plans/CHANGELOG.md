# writing-plans — changelog

- **0.10.0** — 2026-09-04: deliverable length calibrated (ADR-0031 rule 5): Opus 5 writes longer files than the task needs; one sentence scoped to the written document, never to progress text.
- **0.9.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.9.2** — ADR-0030 catalog review (consistency); panel-verified 2026-08-14.
- **0.9.1** — ADR-0030 list openness: no-placeholders list open.
- **0.9.0** — Reciprocated `/multi-persona-review` 0.4.0, whose catalog entry
  already claimed this skill "carries the assignment table" while nothing here
  said so — the unenforced-precondition defect 0.3.0 and 0.4.0 fixed for other
  upstreams. **Carrying a decision in** names what arrives; **Assumptions and
  risks** is where the carried risks and unconfirmable claims land, because the
  plan previously had nowhere to record what it was betting on — only a
  retrospective Deviations list, so a stalled task always read as a surprise.
  That block takes three of the Six Thinking Hats and says why the other three
  stay out rather than including them for symmetry. **Self-review became Disney's
  three positions in sequence**, absorbing all seven prior checks unchanged and
  adding the load-bearing-assumption and first-task-to-stall questions; the Critic
  must return a finding, because "fresh eyes" was a mood and moods measure at
  baseline. Sequential is right here and parallel is right in
  `/multi-persona-review`: one author has no reviewer independence to protect.
  Question sets moved to `references/plan-review-pass.md`. Budget 4500 → 5000.
- **0.8.0** — Reciprocated `/prioritizing-work` 0.1.0: an incoming priority order
  is **carried**, never re-derived, and self-review checks that every
  `MUST`/`P0_GATE` landed with departures named. The visible-slice rule still
  outranks any incoming order. Budget 4000 → 4500 to hold 0.7.0's Status block.
- **0.7.0** — Added the **Status block**: a task-state table under the header
  with a branch, a `Next:` pointer, evidence on `done` rows, and append-only
  Deviations. Transcript mining across ~60 plan documents found effectively zero
  `- [ ]` steps ticked, while both model and user hand-invented the missing
  artifact elsewhere. Step checkboxes were demoted to in-task scratch rather than
  mandated harder: a rule at 0% compliance is not fixed by repeating it. The
  block replaces the written hand-off prompt.
- **0.6.0** — English-only sweep: dropped the two Indonesian trigger phrases
  under `using-dstack` 0.7.0's rule that models translate intent. `task ordering`
  already covered one; `frontend first` was added for the other. Nothing here is
  Indonesian data to match, so nothing was preserved.
- **0.5.0** — Added the **visible-slice-first ordering rule** and made test steps
  tier-aware. Transcript mining found repeated pushback about the visible product
  arriving late, the archetype being green server tests answered with "I still
  cannot see any result". Task 1 must now put something on screen, the header
  declares the visible slice or why there is none, and the self-review leads with
  the check that rejects a mis-ordered plan. Tasks carry a risk tier, so
  `/test-driven-development` no longer implies the full cycle on every task.
- **0.4.0** — Reciprocated the `writing-specs` boundary: agreed requirements
  with an undecided design route there, because deciding boundaries and schema
  inside a plan hides them from review.
- **0.3.0** — Reciprocated the `discovering-requirements` boundary: no
  written problem, goal, or constraints means run that skill first. A
  review found the precondition was claimed upstream and enforced nowhere.
- **0.2.0** — Named the judgment surface (the file split + task ordering is
  the design call; the templates fix only a task's format). Workflow band
  (ADR-0025; flag omitted as the default).
- **0.1.0** — Initial. Bun/TypeScript task examples, plans saved under
  `docs/plans/`, hand-off to `/test-driven-development`,
  `/verifying-before-done`, and `/requesting-code-review`.
