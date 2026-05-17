# UAT scenarios — /brainstorm

Skill: `/brainstorm` — interview-style exploration of a plan or idea.

## Scenario 1 — Permission model exploration

**Setup**: paste:

> "I want to build dashboard sharing for teams but haven't thought
> through the permission model. Brainstorm with me."

**Pass criteria**:

- [ ] Agent asks ONE question at a time (not a list of 10).
- [ ] Agent offers a recommended answer with each question.
- [ ] Agent walks the decision tree branch by branch.
- [ ] Agent does not dump a 10-option survey in the first response.

## Scenario 2 — Architectural stress-test

**Setup**: paste:

> "Should I rewrite our monolith in microservices? Stress-test this
> idea with me."

**Pass criteria**:

- [ ] Agent probes the underlying pain that motivated the question.
- [ ] Agent does NOT give a yes/no answer in the first response.
- [ ] Agent surfaces hidden assumptions (e.g., "what specifically
      hurts about the monolith?").
- [ ] Agent challenges the framing if appropriate.

## Scenario 3 — Vague problem

**Setup**: paste a deliberately vague brief:

> "Users say the app feels slow. What should I do?"

**Pass criteria**:

- [ ] Agent does NOT propose a generic perf checklist immediately.
- [ ] Agent asks which user, which screen, what "slow" means.
- [ ] Agent recommends a specific next question to narrow scope.

## Sign-off

User signature: ______________________  Date: ___________

All scenarios passed: ☐ yes ☐ no
