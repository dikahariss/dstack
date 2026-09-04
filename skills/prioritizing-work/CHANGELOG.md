# prioritizing-work — changelog

- **0.2.0** — 2026-09-04: deliverable length calibrated (ADR-0031 rule 5): Opus 5 writes longer files than the task needs; one sentence scoped to the written document, never to progress text.
- **0.1.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.1.2** — ADR-0030 sweep + panel review (2026-08-14): red-flag table open;
  self-contained refs; economy.
- **0.1.0** — Initial. The catalog assigned MoSCoW labels in
  `/discovering-requirements` Stage 6 with no criteria for deciding which
  label a requirement earns, and ranked nothing across items: no
  mechanism compared feature A to feature B. Observed costs were a
  priority table withdrawn for circular reasoning, a roadmap whose item
  order silently changed scope, and a programme whose load-bearing
  assumption was falsified only after the dependent work was built —
  which is why Stage 2 runs before any scoring. Calibration is
  `deterministic-dominant` (ADR-0025): the rails are the value, and R7
  makes a skipped reference read detectable. Effort is person-days, not
  Intercom's person-months, which collapse almost every item to `0.5` at
  this scale; the departure is stated so a model does not "correct" it
  back. A `scripts/` scorer was deferred — the arithmetic is four
  multiplications, and cheap models fail on fabricated inputs, which no
  script detects. Revisit if a round produces an arithmetic error rather
  than an evidence error.
