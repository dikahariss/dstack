---
name: writing-plans
description: |
  Turn a spec or requirements into a step-by-step implementation plan
  before any code is written. Each task names exact files, carries the
  real code and the test, and a command with expected output. Use when
  the user hands you a spec, says "write a plan", "plan this", or asks
  for an implementation plan for a multi-step change.
allowed-tools: Read Grep Glob Write
metadata:
  dstack:
    version: 0.3.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 2500
    triggers:
      - write a plan
      - writing-plans
      - plan this
      - implementation plan
---
# /writing-plans

Write an implementation plan an engineer with zero context for this
codebase could execute task by task. Document the files to touch, the
code to write, how to test it, and the order. Bite-sized tasks. DRY,
YAGNI, TDD, frequent commits.

Assume the reader is a skilled developer who knows almost nothing about
this toolset or problem domain, and is not strong on test design.

## When to use

- You have a spec or requirements for a multi-step task and have not
  touched code yet.
- The user says "write a plan", "plan this", or hands you a design doc.

Do not use for a single-file, single-step change — just do it. The "is
this idea worth building" question is `/brainstorm`, not this. No written
problem, goal, or constraints to plan against? Run
`/discovering-requirements` first — planning against an unstated problem
produces tasks nobody can check.

## Where the plan goes

Save to `docs/plans/YYYY-MM-DD-<feature>.md`. A user preference for plan
location overrides this.

## Scope check

If the spec spans multiple independent subsystems, split it: one plan
per subsystem, each producing working, testable software on its own. A
plan that tries to do everything is a plan no one can execute.

## File structure first

Before writing tasks, map the files to create or modify and the one
responsibility of each. Files that change together live together; split
by responsibility, not by layer. In an existing codebase, follow the
established patterns rather than restructuring on the side.

Deciding the file split and the task ordering is your design call — the
templates below fix the *format* of a task, not *which* tasks or in *what*
order. That sequencing is the judgment this skill exists to apply.

## Bite-sized tasks

Each step is one action (2–5 minutes): write the failing test, run it
and confirm it fails, write the minimal code to pass, run it and confirm
it passes, commit.

## Plan header

Every plan starts with:

```markdown
# <Feature> implementation plan

**Goal:** <one sentence>
**Architecture:** <2–3 sentences on approach>
**Stack:** <key technologies>

Implement task by task. Per task: `/test-driven-development` for the red-green-refactor
cycle, then `/verifying-before-done` before marking it done. Request review at
checkpoints with `/requesting-code-review`. Steps use `- [ ]` checkboxes.
```

## Task structure

````markdown
### Task N: <component>

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `test/exact/path/to/file.test.ts`

- [ ] **Step 1 — write the failing test**

```ts
test('specific behavior', () => {
  expect(fn(input)).toEqual(expected)
})
```

- [ ] **Step 2 — run it, expect failure**

Run: `bun test test/path/file.test.ts`
Expected: FAIL — `fn is not defined`

- [ ] **Step 3 — minimal implementation**

```ts
export function fn(input: In): Out {
  return expected
}
```

- [ ] **Step 4 — run it, expect pass**

Run: `bun test test/path/file.test.ts` → PASS

- [ ] **Step 5 — commit**
````

## No placeholders

Every step carries the actual content. These are plan failures — never
write them:

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling / validation / edge cases"
- "Write tests for the above" without the test code
- "Similar to Task N" — repeat the code; tasks get read out of order
- References to types or functions not defined in any task

## Self-review

After writing the plan, check it against the spec with fresh eyes:

1. **Coverage** — point each spec requirement to a task. List gaps; add tasks.
2. **Placeholders** — scan for the red flags above. Fix inline.
3. **Consistency** — types, signatures, and names defined in early tasks
   match the ones used in later tasks.

Fix issues inline; no need to re-review.

## Handoff

Save the plan, then hand it to implementation. Execute one task at a
time: `/test-driven-development` per task, `/verifying-before-done` before "done", and
`/requesting-code-review` at natural checkpoints. For a large plan,
dispatch a fresh subagent per task and review between tasks.

## Changes

- **0.3.0** — Reciprocated the `discovering-requirements` boundary: no
  written problem, goal, or constraints means run that skill first. A
  review found the precondition was claimed upstream and enforced nowhere.
- **0.2.0** — Named the judgment surface (the file split + task ordering is
  the design call; the templates fix only a task's format). Workflow band
  (ADR-0025; flag omitted as the default).
- **0.1.0** — Ported from superpowers `writing-plans`. Adapted to
  dstack: Bun/TypeScript task examples, plans saved under `docs/plans/`,
  handoff points to dstack skills (`/test-driven-development`, `/verifying-before-done`,
  `/requesting-code-review`) instead of superpowers-only sub-skills.
