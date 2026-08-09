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
    version: 0.9.0
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

Name the tier in each task — there is no default; self-review item 3 rejects
a plan that leaves one unnamed.

## Plan header

Every plan starts with:

```markdown
# <Feature> implementation plan

**Goal:** <one sentence>
**Architecture:** <2–3 sentences on approach>
**Stack:** <key technologies>
**Visible slice:** <what Task 1 puts on screen> — or `backend-only: <why>`

Implement task by task. Per task: `/test-driven-development` decides the risk
tier and the test path, then `/verifying-before-done` before marking it done.
Before the plan is declared complete, user-visible work also needs
`/running-uat` — a green suite is not evidence a screen works. Request review
at checkpoints with `/requesting-code-review`.
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

Every step carries the actual content. These are plan failures — never
write them:

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling / validation / edge cases"
- "Write tests for the above" without the test code
- "Similar to Task N" — repeat the code; tasks get read out of order
- References to types or functions not defined in any task

## Self-review — three positions, in order

"Fresh eyes" is not a position, it is a mood, and it reliably finds nothing.
Take three positions in sequence, finishing each before starting the next.

This is Disney's original sequential form, right here for the same reason it is
wrong in `/multi-persona-review`: one author, one plan, no reviewer independence
to protect. The sequence exists to get you out of the position you drafted in.

| Position | What it checks |
|---|---|
| **Dreamer** | Read Task 1: does finishing it give the user something to open and click, or does the plan declare backend-only and say why? Then — what did the plan quietly drop from the spec's ambition to make itself easier to write? |
| **Realist** | Spec coverage with every `MUST`/`P0_GATE` landed and departures named; a tier on every task; every stub retired by a named later task in the spec's contract shape; consistent types and names across tasks; a Status block with every task `todo` and a branch; a fallback on every unchecked assumption. |
| **Critic** | Placeholders — "TBD", "add appropriate error handling", "similar to Task N", a type no task defines. Which task stalls first, and on what. Which assumption is load-bearing and unchecked. What this plan commits to that cannot be undone. |

**The Critic must return something.** A pass that finds nothing has not been run:
name the weakest task and say why it is still acceptable. "Looks good" is not an
output, it is the failure mode this position exists to catch.

Only the Dreamer's first check rejects a plan outright — a mis-ordered Task 1 is
reordered, not patched. Everything else is fixed inline, and no re-review is
needed.

Full question sets: `references/plan-review-pass.md`.

## Handoff

Save the plan, then hand it to implementation. Execute one task at a
time: `/test-driven-development` per task, `/verifying-before-done` before "done", and
`/requesting-code-review` at natural checkpoints. For a large plan,
dispatch a fresh subagent per task and review between tasks.

Handing the work to a **fresh session** needs no written summary and no
generated prompt. The Status block is the handoff. One line carries it:

```
/executing-plans docs/plans/YYYY-MM-DD-<feature>.md
```

If that line is not enough for a session with no history to know what to do
next, the Status block is under-filled — fix the block, not the prompt.

## Changes

- **0.9.0** — Reciprocated `/multi-persona-review` 0.4.0, whose catalog entry
  already claimed this skill "carries the assignment table" while nothing here
  said so — the unenforced-precondition defect 0.3.0 and 0.4.0 fixed for other
  upstreams. **Carrying a decision in** names what arrives; **Assumptions and
  risks** is where the carried risks and unconfirmable claims land, because the
  plan previously had nowhere to record what it was betting on — only a
  retrospective Deviations list, so a stalled task always read as a surprise.
  That block takes three of the Six Thinking Hats and says why the other three
  stay out rather than including them for symmetry. **Self-review became Disney's
  three positions in sequence**, absorbing all seven prior checks unchanged and
  adding the load-bearing-assumption and first-task-to-stall questions; the Critic
  must return a finding, because "fresh eyes" was a mood and moods measure at
  baseline. Sequential is right here and parallel is right in
  `/multi-persona-review`: one author has no reviewer independence to protect.
  Question sets moved to `references/plan-review-pass.md`. Budget 4500 → 5000.
- **0.8.0** — Reciprocated `/prioritizing-work` 0.1.0: an incoming priority order
  is **carried**, never re-derived, and self-review checks that every
  `MUST`/`P0_GATE` landed with departures named. The visible-slice rule still
  outranks any incoming order. Budget 4000 → 4500 to hold 0.7.0's Status block.
- **0.7.0** — Added the **Status block**: a task-state table under the header
  with a branch, a `Next:` pointer, evidence on `done` rows, and append-only
  Deviations. Transcript mining across ~60 plan documents found thousands of
  `- [ ]` steps and effectively zero ticked — one plan shipped 12 commits with
  all 72 boxes unticked — while both model and user independently hand-invented
  the missing artifact elsewhere. Step checkboxes were demoted to in-task scratch
  rather than mandated harder: a rule at 0% compliance over 60 documents is not
  fixed by repeating it. The block replaces the written hand-off prompt.
- **0.6.0** — English-only sweep: dropped the two Indonesian trigger phrases
  under `using-dstack` 0.7.0's rule that models translate intent. `task ordering`
  already covered one; `frontend first` was added for the other. Nothing here is
  Indonesian data to match, so nothing was preserved.
- **0.5.0** — Added the **visible-slice-first ordering rule** and made test steps
  tier-aware. Transcript mining found 12+ pushback turns about the visible product
  arriving late, the archetype being 78 green server tests answered with "I still
  cannot see any result". Task 1 must now put something on screen, the header
  declares the visible slice or why there is none, and the self-review leads with
  the check that rejects a mis-ordered plan. Tasks carry a risk tier, so
  `/test-driven-development` no longer implies the full cycle on every task.
- **0.4.0** — Reciprocated the `writing-specs` boundary: agreed requirements
  with an undecided design route there, because deciding boundaries and schema
  inside a plan hides them from review.
- **0.3.0** — Reciprocated the `discovering-requirements` boundary: no
  written problem, goal, or constraints means run that skill first. A
  review found the precondition was claimed upstream and enforced nowhere.
- **0.2.0** — Named the judgment surface (the file split + task ordering is
  the design call; the templates fix only a task's format). Workflow band
  (ADR-0025; flag omitted as the default).
- **0.1.0** — Initial. Bun/TypeScript task examples, plans saved under
  `docs/plans/`, hand-off to `/test-driven-development`,
  `/verifying-before-done`, and `/requesting-code-review`.
