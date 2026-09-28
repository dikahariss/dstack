---
name: executing-plans
description: |
  Use when you have a written implementation plan to execute in a
  separate session with review checkpoints, or when resuming a
  half-done plan from its Status block. Triggers: "execute plan", "run
  the plan", "implement this plan", "resume the plan", "continue where
  we left off".
allowed-tools: Read Edit Write Bash
metadata:
  dstack:
    version: 0.6.1
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 2200
    triggers:
      - execute plan
      - executing-plans
      - implement the plan
      - run the plan
      - resume the plan
      - continue where we left off
      - pick up the work
---
# /executing-plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "Using executing-plans to implement this plan."

## When to use

- You have a written plan and are executing it in a **separate** session
  with review checkpoints.

## When NOT to use

- Executing in the **current** session with a plan too large to hold in one
  context — `/subagent-driven-development`. A small plan in the current
  session is not a reason to leave: run the steps here — unless it follows a
  long planning conversation, where `/writing-plans` hands off to a fresh session.
- No written plan yet — use `/writing-plans` first.

Your judgment enters at the plan review in Step 2, and again wherever the
plan turns out to be wrong (Step 3's deviations, **When to stop**). Otherwise
you follow the plan. A task is done when its Status row holds the commit SHA
and what you observed (`/verifying-before-done` is the method); the branch
is wrapped up by `/finishing-development-branch`.

## The process

### Step 1: Resume from the Status block

The plan's `## Status` block sits under the header and is the authoritative
record of where the work stands. Read it **before** anything else:

1. Read the plan file. The Status block names the branch, the task states, and
   `Next:`.
2. Check out the branch it names. Run `git log --oneline -5` and confirm the
   SHAs on `done` rows are actually there.
3. **Trust the block. Do not re-derive its contents from the codebase.** If it
   says Tasks 1–3 are done with commit evidence, they are done — reading those
   files to satisfy yourself is the cost this block exists to remove. Read only
   what the *next* task names.
4. If the block is missing, stale, or contradicted by `git log`, say so and
   reconcile it with the user before executing. Then write it back true.

No Status block at all — an older plan? Reconstruct one from `git log` and the
plan's tasks, show it to the user, and save it before starting.

### Step 2: Review the plan critically

1. Review the remaining tasks — identify any questions or concerns
2. If concerns: raise them with the user before starting
3. If no concerns: proceed from `Next:`

### Step 3: Execute tasks

For each task, starting at `Next:`:

1. Set its row to `in progress`
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. **Write the status back in the same commit as the code**: set the row to
   `done`, put the commit SHA and the observed evidence in its Evidence cell,
   bump `Updated:`, and move `Next:` to the following task.

The write-back is not bookkeeping — it is the only thing that survives this
session. A task finished but not written back is a task the next session
re-derives from scratch.

**The code carries no narration.** Comment density is inherited from the file
you are editing, not introduced: if the surrounding code has none, the diff has
none. A comment earns its place only where it records a *why* the code cannot
show — a constraint, a workaround with a reference, an invariant held
elsewhere. Never one inside a function body to narrate the next line, banner
the steps, restate the signature, or address the reviewer (`// Added as
requested`, `// NEW`). Rename before commenting; a block that needs a comment
to be followed wants to be a named function. Leave no commented-out code and no
unowned TODO.

**When the plan turns out to be wrong**, append a line to `Deviations from plan`
saying what changed and why, and carry on. Do not silently rewrite the task text
to match what you built — that hides the change from review. If the deviation is
big enough to invalidate later tasks, stop and raise it.

A deviation that changes anything the `Implements:` spec fixed — a decision, a
contract or event shape, a schema row, a process step, an acceptance criterion;
not exhaustive — follows the amend rule in `/writing-specs`. On an `AGREED`
spec the change waits for the owner sign-off that rule names: set the task
`blocked` with the proposed amendment and carry on elsewhere. On a `DRAFT` spec
the change-log row lands in the same commit as the code. If the spec is right,
the code is what gets fixed. Leaving both as they are is how a spec becomes
fiction.

### Step 4: Complete development

After the last task is written back, `/finishing-development-branch` verifies
the branch and presents the merge options.

## When to stop

Stop, and set the task's row to `blocked` with the reason, when the plan's
intent would have to be guessed, when a deviation invalidates later tasks,
or when a dependency the plan assumed does not exist on this host. A failing
test or a build error is fixed in the code, never by editing the test or its
fixture to pass — unless the fix would change what a later task expects, which
is a deviation. A step that cannot pass its own gate as written is a plan
defect and a stop. Not exhaustive: anything that makes you guess at the plan
is a stop. Write the block before you speak: an
`in progress` row left behind is retried by the next session. A plan the user
has changed is reviewed again from Step 2.

## Remember
- Reference skills when the plan says to
- Never start implementation on main/master branch without explicit user consent

## Cross-references

**Required workflow skills:**
- `/using-git-worktrees` - Ensures isolated workspace (creates one or verifies existing)
- `/writing-plans` - Creates the plan this skill executes
- `/verifying-before-done` - The method behind the Status row's Evidence cell
- `/finishing-development-branch` - Complete development after all tasks
