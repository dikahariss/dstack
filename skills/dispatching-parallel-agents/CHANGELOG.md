# dispatching-parallel-agents — changelog

- **0.3.2** — 2026-09-04: branch review 2026-09-04: the core principle and the "use when" floor agree with the 0.3.0 ceiling and description.

- **0.3.1** — 2026-09-04: `eval/cases.jsonl` added — 2 behavioural cases, each a prompt plus the anti-pattern it must not produce.

- **0.3.0** — 2026-09-04: delegation floor and ceiling stated (ADR-0031 rule 6): dispatch only for independent problems that each need more than a handful of tool calls, one agent per domain as the ceiling and one agent for two file-disjoint domains when it can take both; the description says the same. The post-return steps are stated once, in **Verification**.

- **0.2.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.2** — ADR-0030 catalog review (list openness, cut restated general knowledge, economy, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: the common-mistakes table is open.
- **0.2.0** — Named the judgment (deciding failures are truly independent)
  and added an integrate-time verify command. Hardening (v3 plan):
  converted the graphviz when-to-use block and the ❌/✅ mistakes to tables;
  added Cross-references; normalised headings to dstack voice.
- **0.1.0** — Initial. Dispatch examples use the Claude Code `Agent` tool.
