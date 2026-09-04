# multi-persona-review — changelog

- **0.5.4** — 2026-09-04: the mode table is declared open (ADR-0031 sweep).
- **0.5.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.5.2** — ADR-0030 panel review 2026-08-14: perspective library open; trio is the floor, not the roster.
- **0.5.0** — Added a **digital-product mode** and split the vocabulary the old
  name conflated: a **perspective** is coverage, an **AI seat** is execution, a
  **test context** is a condition, not a person. Product mode selects coverage by
  **class and lifecycle gate**; an **evidence gate** withholds a user-outcome
  verdict when no user evidence exists, without halting the review. 6-10
  perspectives map onto the unchanged five-seat cap under a **two-per-seat
  limit**. Severities became **S0-S3**, S3 blocking regardless of score.
  `Write`/`Edit` dropped to match `side_effects: readonly`. Measured claims
  moved to **`evidence-base.md`**.
- **0.4.0** — Made the trio mandatory, capped iterations at three, required an
  owned decision, and dispatched Disney **blind and parallel** rather than in
  sequence. **The Critic became the assigned devil's advocate**; 0.3.0 had named
  that mechanism but shipped only the weaker dissent instruction. A
  **verification step** buys the accuracy personas do not. Budget 4000 → 5000.
- **0.3.0** — `reviewer-prompt.md` named where an escalated finding goes.
- **0.2.0** — Dropped Indonesian triggers under the English-only rule.
- **0.1.0** — Initial. Coverage not accuracy, differentiation not multiplicity,
  union not vote, blind parallel dispatch.
