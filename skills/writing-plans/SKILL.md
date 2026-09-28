---
name: writing-plans
description: |
  Use when the user hands you a spec or agreed requirements for a
  multi-step change and no plan exists yet — the user says "write a
  plan", "plan this", or asks for an implementation plan. Also use
  when a plan's Status block must be brought back to true.
allowed-tools: Read Grep Glob Write
metadata:
  dstack:
    version: 0.12.1
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - write a plan
      - writing-plans
      - plan this
      - implementation plan
      - task ordering
      - frontend first
      - plan status
---
# /writing-plans

Write an implementation plan an engineer with zero context for this
codebase could execute task by task. Document the files to touch, the
code to write, how to test it, and the order. Bite-sized tasks. DRY,
YAGNI, frequent commits. Test discipline is per-task and set by risk
tier, not applied uniformly — see **Bite-sized tasks** below.

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
produces tasks nobody can check. Requirements agreed but the design
undecided — boundaries, schema, contracts? That is `/writing-specs`;
deciding it inside the plan hides it from review. Several independent
things could be built and nothing says which first? That order comes from
`/prioritizing-work` and is **carried** here, not re-derived.

## Carrying a decision in

When the plan follows a recorded decision — `/multi-persona-review`'s decision
record, a steering review, an approved proposal — that decision is an input, not
an invitation to re-litigate:

- Every row of its **work-assignment table** becomes a task, or maps onto one.
  Do not re-derive from the spec what somebody already decided.
- Every risk it left **still open or unmitigated**, and every claim its
  verification pass could not confirm, lands in **Assumptions and risks** below.
  A risk raised in review and dropped on the way into the plan is the exact
  failure that review existed to prevent.
- A departure from the decision is named in one line with its reason, the same
  way a departure from an incoming priority order is. The visible-slice rule
  outranks both: a sequence that would leave Task 1 invisible gets reordered,
  and the reorder is named.

## Where the plan goes

Save to `docs/plans/YYYY-MM-DD-<feature>.md`. A user preference for plan
location overrides this.

A plan's length is its task count times the code each task needs. It carries
no introduction beyond the header block, no restated spec, and no closing
summary; the Status block is the only summary.

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

## Order — the visible slice first

Building a product, application, SaaS, or web app? **Task 1 must produce a
screen the user can open and click.** Stubbed or hardcoded data is fine — the
point is that something is visible before anything is invisible. Backend, real
data, and persistence follow behind it.

Exempt only when the work is genuinely backend-only and has no screen at all: a
service, a background job, a data pipeline, a migration, a CLI, an API another
team consumes. Say which case applies in the plan header.

**The gate: read Task 1 back. If finishing it would leave the user with nothing
they can look at, the order is wrong — reorder before writing another line.**
"The UI comes after the data layer is solid" is the failure this rule exists to
prevent: it ends in a report of green tests answered with *"I still can't see
the result."*

This constrains the *order*, not the *content* — every task still ships whole,
and a stub in Task 1 must be replaced by a named later task, never left to
rot. Stub at the contract boundary the spec fixed: a stub returns the
contract's shape, never an invented one.

## Bite-sized tasks

Each step is one action (2–5 minutes), ending in a commit. The test steps
depend on the risk tier `/test-driven-development` assigns the task:

- **Inside a tier** (money, authz/tenancy, data loss, computational core, bug
  fix, consumed contract) — write the failing test, run it and confirm it
  fails, write the minimal code to pass, run it and confirm it passes, commit.
- **Outside one** — list the cases the task must handle, implement, then write
  the tests from that list, run them, commit. The list is written **before**
  the implementation even though the tests are not; cases read back off
  finished code are markedly weaker.

Name the tier in each task — there is no default; a plan that leaves one
unnamed is not finished (see **A finished plan**).

## Plan header

Every plan starts with:

```markdown
# <Feature> implementation plan

**Goal:** <one sentence>
**Architecture:** <2–3 sentences on approach>
**Stack:** <key technologies>
**Implements:** <spec or requirements path, and its status> — or `none: <why>`
**Visible slice:** <what Task 1 puts on screen> — or `backend-only: <why>`

Implement task by task. `/test-driven-development` decides each task's risk
tier and test path. A task is done when its Status row carries a commit SHA
and the observed evidence (`/verifying-before-done` is the method). User-visible
work also needs `/running-uat` before the plan is declared complete — a green
suite is not evidence a screen works. Request review at checkpoints with
`/requesting-code-review`.
Steps use `- [ ]` checkboxes.
```

## Status block — write it, then keep it true

Directly under the header, before Task 1, every plan carries a Status block.
It is the **first thing a later session reads and the only authoritative record
of where the work stands**. `/executing-plans` resumes from it.

```markdown
## Status

**Updated:** YYYY-MM-DD · **Branch:** `feat/x` · **Next:** Task 4

| Task | State | Evidence |
|---|---|---|
| 1 Map shell screen | done | `a1b2c3d` — /martin renders, 3 layers visible |
| 2 Tile endpoint | done | `e4f5g6h` — 12 tests green, 200 in 40 ms |
| 3 Contour import | blocked | GDAL missing on this host — see Deviations |
| 4–9 | todo | — |

**Deviations from plan:**
- Task 3: synthetic bathymetry in PostGIS instead of a BATNAS download —
  works offline. Agreed with the user 2026-07-23. Task 3's steps still
  describe the download; that is the target once real data lands.
```

Rules that keep it honest:

- **States** are `todo`, `in progress`, `done`, `blocked`, `dropped`. Nothing else.
- **Only `done` carries evidence**, and evidence is a commit SHA plus what was
  observed — a number, a status code, a screen. "Implemented" is not evidence.
- **Consecutive `todo` tasks collapse into one range row.** The block stays
  short enough that reading it is cheap; expand a row when its task starts.
- **Deviations are appended, never rewritten.** When reality diverges from the
  plan, add a line saying what changed and why. Do not silently edit the task
  text to match the code — a plan quietly rewritten to agree with what was built
  is a plan nobody can review.
- **The block is written when the plan is written**, with every task `todo`.
  A plan whose Status block is added later is a plan that already lost its history.

Step-level `- [ ]` boxes stay, but they are in-task scratch for whoever is
executing right now. **The task table is the record.** Where the two disagree,
the table wins.

## Assumptions and risks — what the plan is betting on

Directly under the Status block. Status records what happened; this records what
the plan assumed *before* it started, so a stalled task hits something already
written down instead of a surprise.

```markdown
## Assumptions and risks

| # | The plan assumes | Checked? | If false | Fallback |
|---|---|---|---|---|
| A1 | GDAL is on the target host | no | Task 3 cannot import contours | synthetic bathymetry in PostGIS; Task 3 rewritten |
| A2 | the tile contract is frozen | yes — spec §4, agreed 2026-07-20 | — | — |
| A3 | 40 ms p95 on one node | no — from panel review, item R3 | Task 7 needs an unplanned cache | ship uncached, measure, revisit at Task 9 |
```

**An unchecked assumption needs a fallback** — a named risk with a blank response
is a worry, not a plan. Carried risks keep their origin, so nobody re-argues a
settled decision. Checked assumptions stay in the table with their evidence; that
is what stops the next session re-verifying them.

Three hats earn a place in a written plan: **White** — what is assumed and
whether anyone checked; **Black** — what breaks if it is false; **Green** — the
fallback. Yellow was settled upstream by the spec, Red belongs to the review that
decided to build this, and Blue is already the Status block's branch and `Next:`
pointer. Six hats in a plan document would be ceremony.

## Task structure

````markdown
### Task N: <component>

**Tier:** `money | authz | data-loss | core | bug-fix | contract` — or `none`
(`authz` covers authentication, sessions, and tenancy too)
**Covers:** the requirement IDs this task satisfies — `AC-n` from a spec,
`FR-n`/`NFR-n` from a requirements set, `TC-n`, a carried MUST/P0_GATE — or
`none: <why>`
**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `test/exact/path/to/file.test.ts`

Steps below are the **inside-a-tier** shape. For `Tier: none`, swap Steps 1–2
for a written case list and move the tests after Step 3.

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

Every step carries the actual content. These are plan failures — never write
them. **Not exhaustive**: anything deferring content out of a step belongs here.

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling / validation / edge cases"
- "Write tests for the above" without the test code
- "Similar to Task N" — repeat the code; tasks get read out of order
- References to types or functions not defined in any task

## A finished plan

Before saving, the plan satisfies all of these: Task 1 puts something on
screen, or the header says backend-only and why (a mis-ordered Task 1 is
reordered, not patched); every task has a `Covers:` line; every requirement ID of the `Implements:`
document (`AC-n` from a spec, `FR-n`/`NFR-n` from a requirements set) and every
carried MUST/P0_GATE appears in one or in a named departure; a case set from
`/designing-test-cases`, when one exists, is cited by `TC-n`, not rewritten; every task names a tier;
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
