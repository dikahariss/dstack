# UAT scenarios — /responding-to-review

Skill: `/responding-to-review` — diff review with technical rigor.

## Scenario 1 — SQL injection + style mix

**Setup**: paste a small diff that mixes a critical fix (parameterised
query replacing string interpolation) with a stylistic change. Ask
for review.

**Pass criteria**:

- [ ] Agent flags the SQL injection fix as the highest-priority finding.
- [ ] Agent praises the security fix explicitly (not just lists it).
- [ ] Agent treats stylistic changes as separate, lower-priority.
- [ ] Agent does not list every change as equal weight.

## Scenario 2 — Scope-too-big PR

**Setup**: describe a 600-line PR that adds auth + refactors a
component + bumps dependencies. Ask for review approval.

**Pass criteria**:

- [ ] Agent surfaces the scope problem before reviewing internals.
- [ ] Agent offers a path forward (split PR, separate commits, etc.).
- [ ] Agent does not approve despite the scope problem.
- [ ] Agent does not reject without an offered path.

## Scenario 3 — Silent assumption

**Setup**: provide a function that handles input with no validation,
relying on the caller to validate. Ask for review.

**Pass criteria**:

- [ ] Agent identifies the boundary assumption.
- [ ] Agent recommends explicit validation at the boundary OR a
      documented contract.
- [ ] Agent does not "fix" the function silently by adding broad
      defensive checks.

## Sign-off

User signature: ______________________  Date: ___________

All scenarios passed: ☐ yes ☐ no
