# verifying-before-done — changelog

- **0.7.0** — 2026-09-04: the default gate is stack-neutral (compile → whole suite → lint → the change-specific check; runner commands live in `/test-driven-development`), replacing the Bun-only list and the no-op `validate --strict`; the 2026-08-14 CI-vs-local reason stays as one clause; one claim-table row shows a .NET stack. Band unchanged pending the Opus 5 gate (Task 4 of the 2026-09-04 plan).
- **0.6.2** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.6.1** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.6.0** — Band `deterministic-dominant` → **`judgment-dominant`**, and the
  body cut roughly in half. Evidence:
  `docs/ablations/2026-08-verifying-before-done.md` — six real Sonnet 5 runs,
  three tasks × railed/free, each with a real planted defect as the oracle.
  **All six caught it; the "railed caught, free missed" column was empty in 3
  of 3 tasks**, and on one task the free version went further. Per ADR-0030 §6
  no rail was restored. Dropped: the iron-law block, the six-item trigger list,
  the red-flag list, the defused-excuses section and the response templates —
  none of it was doing work the goal plus exit criteria did not already do.
  Kept and promoted: **the post-subagent check**, the one gap the harness
  system prompt genuinely leaves open. Confound recorded in the ablation: that
  harness already carries an evidence-before-claim rule, so neither instruction
  text can be credited — which argues for less text, not more. Re-run at the
  next major model release.
- **0.5.1** — ADR-0030 list openness: both the trigger list and the red-flag list are open — they name common shapes, not the set.
- **0.5.0** — Reciprocated `/test-driven-development` 0.6.0's product-evidence
  rule: a claim table row and a gate step for user-visible work — a green
  suite alone no longer satisfies "done" for anything with a screen.
- **0.4.0** — Renamed `verification` → `verifying-before-done`. The bare
  noun did not say *when* to reach for it; the gerund encodes the trigger
  moment. The "verify"/"prove it" triggers are kept.
- **0.3.0** — calibration: deterministic-dominant (ADR-0025; discipline
  gate, the rails are the value). Judgment stays bounded: identify the
  command that proves THIS claim — no "research the latest, your call."
- **0.2.0** — Added the default verification gate (numbered bash
  with explicit exit-code checks) and the honest-claim shape table
  contrasting vague vs evidence-grounded claims. Added v2 schema
  fields (`type: semantic`, `side_effects: local`, `agency:
  deliberative`). Driven by a v3 Track C benchmark case-1 loss on
  specificity + groundedness.
- **0.1.0** — Initial port from v1 skill catalog.
