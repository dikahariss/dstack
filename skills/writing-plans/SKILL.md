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
    version: 0.8.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
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

## Self-review

After writing the plan, check it against the spec with fresh eyes:

1. **Visible slice** — read Task 1. Does finishing it give the user something
   to open and click? If not, and the plan is not declared backend-only,
   reorder. This is the one check that rejects a plan rather than patching it.
2. **Coverage** — point each spec requirement to a task. List gaps; add tasks.
   Every `MUST` or `P0_GATE` item from an incoming priority order lands in a
   task, and any departure from that order is named in one line with its reason.
3. **Tiers named** — every task carries a tier, so nothing silently inherits
   the expensive cycle or silently escapes a needed one.
4. **Stubs retired** — every stub introduced by the visible slice has a named
   later task that replaces it, and its shape matches the spec's contract.
5. **Placeholders** — scan for the red flags above. Fix inline.
6. **Consistency** — types, signatures, and names defined in early tasks
   match the ones used in later tasks.
7. **Status block present** — it sits under the header, lists every task as
   `todo`, and names the branch. A plan without one cannot be resumed.

Fix issues inline; no need to re-review.

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

- **0.8.0** — Reciprocated `/prioritizing-work` 0.1.0: an incoming priority
  order is **carried**, never re-derived, and self-review item 2 now checks that
  every `MUST`/`P0_GATE` item landed in a task with departures named. The
  visible-slice rule still outranks any incoming order, so this skill can reject
  a sequence that would make Task 1 invisible. Budget re-targeted 4000 → 4500
  (ADR-0016 default → still under the 5000 ceiling) to hold 0.7.0's Status block
  alongside this; the alternative was deleting the plan-header template.
- **0.7.0** — Added the **Status block**: a task-state table under the plan
  header, with a branch, a `Next:` pointer, evidence on `done` rows, and an
  append-only Deviations list. Transcript mining across ~60 real plan documents
  found thousands of `- [ ]` steps and effectively zero ticked — including a
  plan whose work demonstrably shipped in 12 commits while its 72 boxes stayed
  unticked. Status was being delegated to session-local todos, so it died at
  `/clear`; the same evidence showed both the model and the user independently
  hand-inventing the missing artifact (an ad-hoc `## STATUS EKSEKUSI` section
  buried at line 714 of one plan, and a hand-maintained `STATUS.md` dashboard in
  another repo). The block sits under the header rather than at the end so
  reading it is cheap, and step checkboxes were demoted to in-task scratch
  rather than mandated harder — a rule at 0% compliance over 60 documents does
  not get fixed by repeating it. The handoff section now states that the block
  replaces the written hand-off prompt.
- **0.6.0** — English-only sweep. Dropped the two Indonesian trigger phrases
  (priority ordering, frontend-first) and put the 0.5.0 entry's quoted
  Indonesian complaint into English reported speech. Reasoning is
  `using-dstack` 0.7.0's: models translate intent, so the phrases cost tokens
  without adding reach. `task ordering` already covered the first;
  `frontend first` was added for the second, which no English trigger reached.
  Nothing in this skill is Indonesian data to match against, so nothing was
  preserved.
- **0.5.0** — Added the **visible-slice-first ordering rule** and made the test
  steps tier-aware. Transcript mining found 12+ pushback turns about the
  visible product arriving late or wrong, the archetype being a report of 78
  green server tests answered by the owner saying he still could not see any
  result; the owner's rule is that product/app/SaaS/web-app work puts the frontend
  first, with genuinely backend-only work exempt. Task 1 must now put something
  on screen, the plan header declares the visible slice or why there is none,
  and the self-review leads with the check that rejects a mis-ordered plan.
  Tasks now carry a risk tier, so `/test-driven-development` no longer implies
  the full red-green cycle on every task — the case list still precedes the
  implementation either way.
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
