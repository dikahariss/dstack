# brainstorm — changelog

- **0.5.4** — 2026-09-04: the closing summary is bounded qualitatively ("short enough to confirm at a glance — one line per decision") instead of a 15-line cap; the band note no longer cites a dstack ADR number.
- **0.5.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.5.2** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.5.1** — ADR-0030 list openness: the stop-early list is open — reading the room is the judgment this skill is built around.
- **0.5.0** — Resolved the dangling "worth building at all" pointer, which
  named no destination: comparative worth is `/prioritizing-work`, per-item
  go/no-go is `/discovering-requirements` §2.5. Budget 2500 → 3000; the body sat
  at exactly 90% of the old figure, so any edit would have failed `--strict`.
- **0.4.0** — Reciprocated the `discovering-requirements` boundary: an
  unwritten problem routes there. Siblings, not a sequence.
- **0.3.0** — calibration: judgment-dominant (ADR-0025). Evidence: the v3
  benchmark — this skill loses when over-structured
  (docs/v3-benchmark-report.md). Owner-approved 2026-06-04.
- **0.2.0** — Reframed the core rule from "ONE QUESTION AT A TIME"
  to "RECOMMENDATION FIRST → ONE QUESTION SECOND" because earlier
  benchmark losses showed Claude defaulting to open enumeration when
  faced with ambiguous prompts.
  Added a stress-test worked example with the correct
  recommendation-first response and its anti-pattern. Added v2
  schema fields (`type: semantic`, `side_effects: readonly`,
  `agency: deliberative`). Driven by v3 Track C benchmark.
- **0.1.0** — Initial port from v1 skill catalog.
