# requesting-code-review — changelog

- **0.4.1** — 2026-09-04: `eval/cases.jsonl` added — 3 behavioural cases, each a prompt plus the anti-pattern it must not produce.

- **0.4.0** — 2026-09-04: a **When to request** block states the floor and the ceiling (ADR-0031 rule 6): before merge and at named checkpoints, never as a second check on work just verified, one reviewer per request launched alongside any other independent agents. The mandatory cadence list stays beside it until the Task 12 cadence ablation reports. The reviewer template names the Agent tool, keeps plan alignment, narration comments and real-behavior tests as the review and lists the rest as starting points, asks for every finding with confidence and severity (the implementer ranks them), and keeps one rule in place of the DO/DON'T lists.

- **0.3.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.3.0** — The reviewer now flags narration the diff introduced and may
  never ask for explanatory comments — asking for them is what manufactures
  them. The owner reported generated code padded with narrating comments,
  which reads as machine-written and costs credibility at senior level.
- **0.2.3** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.2.2** — ADR-0030 per-list audit: the when-to-request lists (mandatory
  and optional) declared open; the 0.2.1 marker covered only the red-flag
  list.
- **0.2.1** — ADR-0030 list openness: the red-flag list is open — any reason to avoid a review belongs there.
- **0.2.0** — Named the judgment surface (crafting the reviewer's context
  sets the review's ceiling); workflow band (ADR-0025; flag omitted as the
  default).
- **0.1.0** — Initial. Dispatch via the Agent tool, example plan path under
  `docs/plans/`, cross-references `/responding-to-review` for the reply.
