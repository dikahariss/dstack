# executing-plans — changelog

- **0.5.2** — 2026-09-04: branch review 2026-09-04: the judgment line names the deviation and stop calls too; the `blocked` instruction is stated once; a small same-session plan runs all four steps.

- **0.5.1** — 2026-09-04: `eval/cases.jsonl` added — 3 behavioural cases, each a prompt plus the anti-pattern it must not produce.

- **0.5.0** — 2026-09-04: verification stated once (ADR-0031 rule 7, licensed by `docs/ablations/2026-09-executing-plans-opus5.md`): the Status row's SHA plus observed evidence is the done-state and `/verifying-before-done` is named once as the method; the STOP list, "ask rather than guess" and "don't force through blockers" become one **When to stop** paragraph. That paragraph says a failing test is fixed in the code and never by editing the test or its fixture — the E2 pointer run in the ablation extended a fixture to get green, which is the rule the shorter form was missing. Small same-session plans run here; `/subagent-driven-development` is for plans too large for one context.

- **0.4.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.0** — Put the comment-discipline rule in Step 3, the step where this
  skill writes production code itself rather than delegating it. The owner
  reported generated code arriving padded with comments that narrate it, which
  reads as machine-written and costs credibility at senior level.
- **0.3.1–0.3.2** — ADR-0030 catalog review (economy, consistency), and the
  stop-and-ask list declared open — anything that would make you guess at the
  plan belongs there.
- **0.3.0** — Made this the **resume** skill it always claimed to be. It had no
  way to find where the work stopped: Step 1 built a session-local todo per
  task, which dies at `/clear`. It now resumes from the `## Status` block
  (`/writing-plans` 0.7.0), verifies its commit evidence against `git log`, and
  forbids re-deriving from the codebase what the block already states; task
  completion writes the status back **in the same commit as the code**. Driven
  by mining 180 sessions: the median spent 25 tool calls before its first edit
  (p90 47), 62% of session-start shell work was `cat`/`ls`/`grep`
  re-orientation, and the user was manually asking for hand-off prompts because
  nothing durable carried the state.
- **0.1.0–0.2.0** — Initial, pointing at `/subagent-driven-development` for
  same-session execution; then named the judgment (the Step 2 plan review) and
  made `/verifying-before-done` an explicit, mandatory completion gate.
