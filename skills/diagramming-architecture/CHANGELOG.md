# diagramming-architecture — changelog

- **0.4.7** — 2026-09-04: branch review 2026-09-04: the checker's justification states the one measured count, not a rate.

- **0.4.6** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 76 words; quoted trigger phrases kept.

- **0.4.5** — 2026-09-04: the legibility-check reason is stated in the present tense with its measured count (7 findings vs 2) instead of as an anecdote about the first run.
- **0.4.4** — 2026-09-04: the "Instead of this skill" table is declared open (ADR-0031 sweep; the changelog marker had been silencing the detector).
- **0.4.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.4.1** — ADR-0030 list openness: the red-flag table is open.
- **0.4.0** — Indonesian trigger phrases dropped from the description and the
  trigger list under the English-only rule. `/using-dstack` 0.7.0 settled the
  reasoning: models match on intent and translate, so the phrases spent tokens
  without buying reach. Every dropped phrase kept its reach through a precise
  English trigger — *draw a diagram*, *architecture diagram*, *ER diagram as
  an editable file*, *architecture flowchart* — and *editable diagram* already covered the last of them. Nothing
  in the body was Indonesian, so nothing was translated; the Indonesian prompts
  in `eval/cases.jsonl` stay untouched, because they are the evidence that an
  English skill still matches an Indonesian request.
- **0.3.0** — Two notations routed away rather than absorbed. `.bpmn` cannot be
  read by the draw.io CLI (`Error: Export failed`), so the Mermaid→draw.io spine
  does not reach it; and Mermaid has no use case diagram type. Both would have
  been attempted and silently failed against this skill's conversion stage.
  Added the hand-off rows to `/modelling-business-processes` and
  `/modelling-system-behaviour`, and the measured `.bpmn` refusal as a red flag.
- **0.2.0** — Legibility mandate made honest after the first real trial. Eight
  defect classes became four with numeric thresholds, run by a bundled checker
  over the `.drawio` **source** rather than the rendered SVG — the source exists
  in every probe verdict and is the tool's persisted contract, while the SVG's
  label encoding already broke one parser. Two classes were deleted rather than
  implemented (edge crossings is a layout-search result, not a measurement; short
  terminals are cosmetic) and contrast retired to a one-time palette audit. The
  gate lost its unconditional escape: "recorded as not run" no longer passes.
  `type` semantic → hybrid, which the validator required once `scripts/` existed.
- **0.1.0** — Initial. Built from `docs/specs/2026-07-29-diagramming-architecture.md`.
  Three things were established by measurement rather than assumption before the
  body was written: the drawing program is absent on both deploy targets, so
  absence is a first-class verdict rather than an error; **draw.io converts
  sequence, state and ER diagrams to editable output** — an earlier draft wrongly
  carried the Excalidraw converter's flowchart-only limit across to it; and
  byte-identical regeneration is impossible in both ecosystems, so idempotence is
  scoped to identity after normalising per-run random fields. The legibility
  stage exists because a prior-art survey found rendered-output linting treated
  as a required preflight elsewhere, and nothing in the first draft of this spec
  checked whether the picture could be read at all.
