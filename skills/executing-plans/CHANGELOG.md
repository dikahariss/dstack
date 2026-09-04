# executing-plans — changelog

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
