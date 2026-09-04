# modelling-business-processes — changelog

- **0.2.5** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 75 words; quoted trigger phrases kept.

- **0.2.4** — 2026-09-04: the Stage 0 input table is declared closed by design (ADR-0031 sweep).
- **0.2.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: the BPMN vocabulary is closed by design (a process engine rejects anything else); the five patterns are open.
- **0.2.0** — Dropped the Indonesian trigger phrases from the description and
  the trigger list, and put the example ask into English, under the English-only
  rule (`using-dstack` 0.7.0): models translate intent rather than matching
  lexically, so the phrases cost tokens without adding reach. `approval flow`
  and `process diagram` were added to carry the reach the removed phrases had.
  The Indonesian eval prompts are deliberately untouched — they are the proof
  that an English skill still matches an Indonesian request.
- **0.1.0** — Initial. Four things were measured before the body was written,
  and each changed the design. `drawio -x` **cannot read `.bpmn`** (`Error:
  Export failed`), so the Mermaid→draw.io spine of `/diagramming-architecture`
  does not reach this notation and a separate skill was the only honest option.
  `bpmn-to-image` **refuses a file with no DI**, making layout a mandatory stage
  rather than a nicety. `bpmn-auto-layout` **drops the pool and every lane** —
  confirmed mechanically by `bpmnlint` reporting `no-bpmndi` on the participant
  and both lanes of a two-lane model — which is why a bundled lane-aware
  layouter exists at all; it lays out a real 22-node, 6-lane approval process
  with zero `no-bpmndi` and zero `no-overlapping-elements` findings. And
  `bpmnlint:recommended` **already covers DI completeness and element overlap**,
  so a planned second checker was deleted rather than written.
