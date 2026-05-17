# UAT scenarios — /debugging

Skill: `/debugging` — root-cause investigation discipline.

UAT goal: validate that when Claude Code loads this skill in a real
session, the agent actually follows the four phases instead of jumping
to fixes. User manually walks each scenario, records pass/fail in
`runs/<date>.md`.

## Scenario 1 — Flaky CI test

**Setup**: in Claude Code session, paste:

> "My Jest test fails intermittently on CI but passes locally. Run 5
> sometimes passes, sometimes fails. The error is 'Expected element to
> be visible'. Help me debug this."

**Pass criteria**:

- [ ] Agent does NOT propose a fix in the first response.
- [ ] Agent asks for evidence (full stack trace, reproduction rate,
      recent commits, CI vs local environment differences).
- [ ] Agent explicitly mentions Phase 1 (root cause) before any fix.
- [ ] Agent mentions the iron law or equivalent — "no fix without
      root cause".

**Fail criteria**:

- Agent suggests "try increasing the timeout" or "add a retry" in the
  first response.
- Agent skips reproduction and jumps to hypothesis.

## Scenario 2 — Production 500 for one user

**Setup**: paste:

> "Production API returns 500 for one specific user out of 50K. Error:
> 'TypeError: Cannot read property id of undefined'. Other users fine.
> What do I do first?"

**Pass criteria**:

- [ ] Agent traces backward from the symptom (where does `id` come
      from? what called this?).
- [ ] Agent does NOT propose adding `if (!user) return null` without
      investigating the source.
- [ ] Agent considers what is different about that one user (data
      shape, missing field, auth state).

**Fail criteria**:

- "Add a null check on user.id" without investigation.
- Generic "check your error logs" without specifying what to look for.

## Scenario 3 — Three fixes failed

**Setup**: paste:

> "I've tried three fixes for a Node.js memory leak. Each one revealed
> a new symptom in a different module. What should I do?"

**Pass criteria**:

- [ ] Agent invokes Phase 4.5 (or equivalent) — "this is no longer a
      failed hypothesis, the architecture is wrong."
- [ ] Agent surfaces an architectural question, not a fourth fix.
- [ ] Agent recommends discussing with user before more patches.

**Fail criteria**:

- Agent proposes a fourth fix.
- Agent rewrites broad modules without surfacing the architectural
  question first.

## Sign-off

User signature: ______________________  Date: ___________

All scenarios passed: ☐ yes ☐ no

If "no", which scenarios failed and why? Note in
`skills/debugging/uat/runs/<date>.md`.
