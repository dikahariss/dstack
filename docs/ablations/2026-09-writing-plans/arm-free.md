# /writing-plans

Write an implementation plan that a skilled engineer with no context for this
codebase can execute task by task, and that a later session can resume from.
Save it to `docs/plans/YYYY-MM-DD-<feature>.md` unless the user or the repo
names another place.

## Inputs

A spec or agreed requirements for a multi-step change. No written problem →
`/discovering-requirements`. Design undecided (boundaries, schema, contracts) →
`/writing-specs`. Several candidates and no agreed order → `/prioritizing-work`,
whose order is carried, not re-derived. A recorded decision is carried the same
way: each of its work rows becomes a task, and each risk it left open lands in
Assumptions and risks. A single-file, single-step change needs no plan.

## Guardrails

- A product with a screen: Task 1 leaves the user something to open and click;
  stubbed data is fine, and a later named task retires the stub in the
  contract's shape. Otherwise the header says `backend-only: <why>`.
- The header carries Goal, Architecture, Stack, `Implements:` (the spec path and
  status, or `none: <why>`), and Visible slice.
- Each task names the files it creates or modifies, its risk tier from
  `/test-driven-development` (`money`, `authz`, `data-loss`, `core`, `bug-fix`,
  `contract`, or `none` — closed by design, that skill's tier list), the `AC-n`
  and `TC-n` it covers, how its result is verified, and ends in a commit.
- A `## Status` block sits under the header from the start: `Updated`, `Branch`,
  `Next`, one row per task. States are `todo`, `in progress`, `done`, `blocked`,
  `dropped`. Only `done` carries evidence: a commit SHA plus what was observed.
  Deviations are appended, never folded into task text.
- An `## Assumptions and risks` table follows it: what is assumed, whether it
  was checked, what breaks if false, and the fallback.
- Nothing defers content out of the plan: no TBD, no "add appropriate error
  handling", no reference to a type or function that no task defines.
- Length is the task count times what each task needs. No restated spec, no
  closing summary.

## A finished plan

Before saving, the plan satisfies all of these: Task 1 puts something on
screen, or the header says backend-only and why (a mis-ordered Task 1 is
reordered, not patched); every `AC-n` of the `Implements:` document and every carried MUST/P0_GATE
appears in a task's `Covers:` line or a named departure, and a case set from
`/designing-test-cases`, when one exists, is cited by `TC-n` instead of rewritten; every task names a tier;
every stub is retired by a named later task in the contract's shape; names
and types agree across tasks; the Status block exists with every task `todo`
and a branch; every unchecked assumption has a fallback; no placeholders.
Then name the task most likely to stall first and what it stalls on, and put
that line in Assumptions and risks. The Dreamer / Realist / Critic walk in
`references/plan-review-pass.md` is one way to check these; use it when the
plan is expensive to get wrong.

## Handoff

Save the plan, then hand it to implementation: a plan too large to hold in
one context goes to `/subagent-driven-development`; a small one is executed
directly.

After a long planning conversation, prefer a fresh session even for a small
plan: whatever the executor then lacks is missing from the spec or the plan, and
it is cheaper found now than after the code.

Handing the work to a **fresh session** needs no written summary and no
generated prompt. The Status block is the handoff. One line carries it:

```
/executing-plans docs/plans/YYYY-MM-DD-<feature>.md
```

If that line is not enough for a session with no history to know what to do
next, the Status block is under-filled — fix the block, not the prompt.
