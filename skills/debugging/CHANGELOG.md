# debugging — changelog

- **0.4.0** — 2026-09-04: verification stated once (ADR-0031 rule 7, licensed by the 2026-09 Opus 5 ablation): the shouted law and its two restatements become one sentence; the four numbered phases become a phase table of exit criteria plus our specifics, with the perf baseline block kept verbatim; the Quick reference, which duplicated that table, is gone; the "do not skip when" list, a third restatement of the rule, is gone. Red flags and the excuse table stay until the Task 12 ablation reports.

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
