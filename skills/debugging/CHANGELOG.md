# debugging — changelog

- **0.3.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.3.0** — Phase 4 step 2 now retracts the boundary instrumentation
  and bars comments announcing the fix, keeping only the *why* line a
  non-obvious cause earns. The owner reported generated code arriving
  padded with narration, which reads as machine-written and costs
  credibility at senior level.
- **0.2.1** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.0** — Added the "Triage by failure shape" table mapping
  symptom → first probe → tooling, plus worked examples for
  multi-layer boundary instrumentation and flake reproduction. Phase
  3 step 1 now requires 3 to 5 ranked falsifiable hypotheses. Phase
  4 prefaces memory/perf regressions with measurement-based
  baselining (heap snapshots, hyperfine). Added v2 schema fields:
  `type: semantic`, `side_effects: readonly`, `agency: deliberative`.
  Driven by a v3 Track C benchmark loss on specificity (3/3 cases).
- **0.1.0** — Initial port from v1 skill catalog.
