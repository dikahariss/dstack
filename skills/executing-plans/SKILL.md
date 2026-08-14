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
    version: 0.3.2
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

- Executing in the **current** session — use `/subagent-driven-development`
  (one subagent per task).
- No written plan yet — use `/writing-plans` first.

Your judgment enters at one place: the critical plan review in Step 2,
where you push back on or override the plan before executing. After that
you follow the steps exactly; completion is gated by `/verifying-before-done`
(mandatory) and wrapped up by `/finishing-development-branch`.

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

**When the plan turns out to be wrong**, append a line to `Deviations from plan`
saying what changed and why, and carry on. Do not silently rewrite the task text
to match what you built — that hides the change from review. If the deviation is
big enough to invalidate later tasks, stop and raise it.

### Step 4: Complete development

After all tasks complete and verified:
- Announce: "Using finishing-development-branch to complete this work."
- **REQUIRED SUB-SKILL:** Use `/finishing-development-branch`
- Follow that skill to verify tests, present options, execute choice

## When to stop and ask for help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

That list is **not exhaustive** — anything that would make you guess at the
plan's intent is a stop.

**Ask for clarification rather than guessing.**

A blocker is written down, not just spoken: set the task's row to `blocked`
with the reason before you stop. Otherwise the next session reads `in progress`
and retries the thing that already failed.

## When to revisit earlier steps

**Return to Review (Step 2) when:**
- The user updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Reference skills when the plan says to
- Never start implementation on main/master branch without explicit user consent

## Cross-references

**Required workflow skills:**
- `/using-git-worktrees` - Ensures isolated workspace (creates one or verifies existing)
- `/writing-plans` - Creates the plan this skill executes
- `/verifying-before-done` - Mandatory completion gate after each task and at the end
- `/finishing-development-branch` - Complete development after all tasks

## Changes

- **0.3.2** — ADR-0030 catalog review (economy, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.3.1** — ADR-0030 list openness: the stop-and-ask list is open — anything that would make you guess at the plan belongs there.
- **0.3.0** — Made this the **resume** skill it always claimed to be. It was
  described as the separate-session executor but had no way to find where the
  work stopped: Step 1 read the plan and created a session-local todo per task,
  which dies at `/clear`. New Step 1 resumes from the `## Status` block
  (`/writing-plans` 0.7.0), verifies its commit evidence against `git log`, and
  forbids re-deriving from the codebase what the block already states. Task
  completion now writes the status back **in the same commit as the code**,
  deviations are appended rather than silently folded into the task text, and a
  blocker is recorded in the row before stopping. Driven by mining 180 sessions:
  the median session spent 25 tool calls before its first edit (p90 47, max 91),
  62% of session-start shell work was `cat`/`ls`/`grep` re-orientation, and the
  user was manually asking for hand-off prompts because nothing durable carried
  the state.
- **0.2.0** — Named the judgment (the Step 2 plan review) and made
  `/verifying-before-done` an explicit, mandatory completion gate. Hardening
  (v3 plan): added When to use / When NOT to use; replaced TodoWrite with
  host-accurate phrasing; added the `/verifying-before-done` cross-reference;
  normalised headings to dstack voice.
- **0.1.0** — Initial. The subagent note points at the Claude Code `Agent`
  tool and `/subagent-driven-development` for same-session execution.
