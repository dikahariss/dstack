# classify-issue — changelog

- **0.2.4** — 2026-09-04: the closing "triple-check" line states the consequence instead (ADR-0031 rule 7): an out-of-enum kind or an over-long area is rejected downstream, not repaired.

- **0.2.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.2** — ADR-0030 catalog review (list openness, economy); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: the kind enum is closed by design (consumers parse it, so a seventh value breaks them); the misclassification traps are open.
- **0.2.0** — calibration: schema-meta (ADR-0025; determinism is the
  output schema, not a procedure). Named the judgment (kind/severity/area
  are your call; the schema fixes the shape). Added a misclassification
  traps table.
- **0.1.0** — Initial schema-semantic triage skill.
