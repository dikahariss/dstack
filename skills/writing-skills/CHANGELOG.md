# writing-skills — changelog

- **0.8.0** — 2026-09-04: ADR-0031 — two-target premise (Opus 5 daily, Sonnet 5 light, Fable 5.1 guard; Codex/Gemini read the same files); shape rules 5–7 (deliverable length, dispatch floor/ceiling/one message, verification stated once); discipline skills written positively, a counter-excuse only after a measured failure; descriptions say what + when under 80/120 words and keep Indonesian triggers; history recorded in `CHANGELOG.md`; the bundled testing file de-shouted and its 2025 narrative dropped.
- **0.7.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.7.0** — Added the currency-sign-before-a-digit anti-pattern.
  `/researching-facts` 0.1.0 wrote its metered-API costs with a currency sign;
  invoked with an argument string they reached the model as words from that
  argument, so the section written to bound spend was the one that got corrupted.
- **0.6.1** — ADR-0030 catalog review (list openness, enumeration-as-product declared, self-contained refs); panel-verified, see the 2026-08-14 review workflow.
- **0.6.0** — `context_budget_tokens` 3000 → 4500. Not headroom for bloat: this
  skill now carries permanent ADR-0030 doctrine every skill author must read,
  and 3000 was mis-tiered against its peers — `/writing-plans`, `/writing-specs`,
  `/discovering-requirements` and `/prioritizing-work` all sit at 5000. The
  0.5.0 section could not fit under 90% of 3000 at any reasonable terseness.
  Owner-approved 2026-08-14 after the alternative (cutting ~297 tokens of
  existing content) was judged to damage the skill to satisfy a threshold.
- **0.5.0** — Carried the ADR-0030 shape rules. Anthropic's Sonnet 5 guide
  says the model "does not silently generalize an instruction from one item
  to another", so with Sonnet 5 as daily driver a closed list caps the
  model's own knowledge; only 2 of 33 skills declared any list open on
  2026-08-14. Band governance corrected too: ADR-0030 charges an ablation
  run in **either** direction, ADR-0025 charged evidence only for freedom.
- **0.4.0** — Two rules from mined session history, both recurring
  corrections: a skill must be project-agnostic (no rule lifted from the
  repo it was written in), and a new skill ships registered in the
  `/using-dstack` router, catalog, and chains, with that skill's version
  bumped in the same edit. Added as checklist rows and anti-patterns.
- **0.3.0** — Encoded the skill-naming convention (ADR-0027): name the
  activity, gerund preferred, no bare abbreviation/adjective/generic noun,
  encode direction for paired skills, and keep the old id as a trigger when
  renaming. Added a checklist row.
- **0.2.1** — Repointed the calibration exemplar to `responding-to-review` (the reference
  hybrid: deterministic spine + named judgment).
- **0.2.0** — Encoded the hybrid-by-default doctrine (ADR-0025): spine +
  named judgment + the four calibration bands and when to set the flag.
  Fixed the `TodoWrite` heading to host-accurate phrasing.
- **0.1.0** — Initial. Authoring path is `bun run new`,
  `docs/specs/skill-spec.md`, `metadata.dstack`, token budgets, `eval/`;
  tables and prose rather than diagram tooling. Keeps the TDD-for-skills
  method and the rationalization-table technique.
