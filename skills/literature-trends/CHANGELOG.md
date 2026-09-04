# literature-trends — changelog

- **0.3.1** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 60 words; quoted trigger phrases kept.

- **0.3.0** — 2026-09-04: deliverable length calibrated (ADR-0031 rule 5): Opus 5 writes longer files than the task needs; one sentence scoped to the written document, never to progress text.
- **0.2.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: common-mistakes table open.
- **0.2.0** — Dropped the three Indonesian trigger phrases (the literal
  translations of "trend analysis", "group the topics", and "trend map") from the
  description and the trigger list under the English-only rule (`/using-dstack`
  0.7.0): models translate intent rather than matching lexically, so the phrases
  cost tokens without adding reach. "research trend analysis" and "topic
  categorization" already covered the first two; the third is now covered by the
  English "trend map", which is what this skill produces. Nothing else here was Indonesian.
- **0.1.0** — Initial. Database-agnostic corpus→trends: parse/dedup + categorize +
  population-vs-sample discipline + growth metrics + the standard diagram set
  (delegates palette to `/dataviz`). Stage 2 of the literature pipeline.
