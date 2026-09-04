# multi-persona-review — changelog

- **0.6.0** — 2026-09-04: delegation floor and ceiling (ADR-0031 rule 6): the cost of a full review is stated (ten to thirteen dispatches), below one screen of artifact the review runs in the main loop, and the roster is the only delegation the skill authorises; an iteration's seats launch in one message; the verification pass runs in the arbiter's own loop with §3 as a template for the rare check that needs a missing context; iteration-2 seats continue through the host's message-to-agent mechanism; the coverage-not-accuracy caveat is stated once in the record. Reviewer rules 7 and 8 now ask for every anchored finding with confidence, filtering left to the arbiter.

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
