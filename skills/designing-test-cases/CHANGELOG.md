# designing-test-cases — changelog

- **0.5.3** — 2026-09-04: the shouted opening banner is one plain sentence; the reasons that follow it are unchanged (ADR-0031 register sweep).
- **0.5.2** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.5.1** — ADR-0030 catalog review (list openness, economy); panel-verified, see the 2026-08-14 review workflow.
- **0.5.0** — Stage 5 states that `impact × likelihood` orders the *run*, not
  the requirements. Several ranking formulas now exist in the catalog, and
  reading run order as business priority is the confusion this one would cause.
- **0.4.0** — English-only pass (`using-dstack` 0.7.0). `how many test cases`
  added — not "test coverage", the metric this skill refuses to produce.
  `eval/` keeps its Indonesian prompts as the routing proof.
- **0.3.0** — Promoted from "the step before TDD" to "the step that carries the
  value". `/test-driven-development` 0.6.0 runs the full cycle only inside six
  risk tiers; elsewhere tests come after the code, making this list the only
  thing between them and the implementation bias they would inherit. The
  freeze-before-implementation rule became unconditional.
- **0.2.0** — Rebuilt after a five-point-of-view review (six blocking findings)
  and a 60-case subagent trial that exposed three self-contradictions among this
  skill's own rules. Fixed by adding `R-n` derived risks, making the class share
  diagnostic, and defining the verdict as one decision rule rather than one
  assertion. Added: the falsification-target rule; the authority, distributional
  and universal-negative shapes; the ban on collapsing subject/role/tenant/owner
  in a decision table; release effect separate from risk order; prerequisites;
  the action column; gap kinds; human-granted `AGREED`; and Stage 4 in the Light
  path.
- **0.1.0** — Initial. Built from
  `docs/discovery/2026-07-28-designing-test-cases.md` and its Light spec: TDD had
  a per-behaviour completeness walk and `running-uat` an entry gate demanding an
  enumerated set, and nothing produced one — 73 verification demands across 446
  human turns, 16% overall and 33% in this repo. Derivation follows the ISTQB
  black-box canon; the four classes are carried from `/test-driven-development`.
  Zero precedent across ~126 skills in the four reference catalogs.
