# wireframing-interfaces — changelog

- **0.3.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.3.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.3.1** — ADR-0030 list openness: the red-flag table is open.
- **0.3.0** — Indonesian trigger phrases dropped from the description and the
  trigger list under the English-only rule. `/using-dstack` 0.7.0 settled the
  reasoning: models match on intent and translate, so the phrases spent tokens
  without buying reach. Every dropped phrase kept its reach through a precise
  English trigger — *screen sketch*, *screen layout*, *screen design*, *what
  does the screen look like*. Nothing in the body was Indonesian, so nothing was
  translated; the Indonesian prompts in `eval/cases.jsonl` stay untouched,
  because they are the evidence that an English skill still matches an
  Indonesian request.
- **0.2.0** — Legibility mandate made honest after the first real trial. Eight
  defect classes became four with numeric thresholds, run by a bundled checker
  over the `.drawio` **source** rather than the rendered SVG — the source exists
  in every probe verdict and is the tool's persisted contract, while the SVG's
  label encoding already broke one parser. Two classes were deleted rather than
  implemented (edge crossings is a layout-search result, not a measurement; short
  terminals are cosmetic) and contrast retired to a one-time palette audit. The
  gate lost its unconditional escape: "recorded as not run" no longer passes.
  `type` semantic → hybrid, which the validator required once `scripts/` existed.
- **0.1.0** — Initial. Built from `docs/specs/2026-07-29-wireframing-interfaces.md`.
  The interactive test is syntactic because a review found the declared input —
  the spec's step table — has no actor column, so the original "has a human
  actor" rule was not derivable from it. The fidelity cap is a product decision
  with a recorded cost, not a limitation. The drawing program is probed rather
  than assumed: it is absent on both machines this is deployed to, so `no-render`
  is a normal verdict. The legibility stage exists because a prior-art survey
  found rendered-output linting treated as a required preflight elsewhere, and a
  wireframe whose labels spill out of their controls is exactly the unreadable
  artifact this skill exists to avoid.
