---
name: subagent-driven-development
description: |
  Use when executing an implementation plan with independent tasks in
  the current session. Dispatch a fresh subagent per task, then run a
  two-stage review after each — spec compliance first, then code quality
  — looping until both pass. Triggers: "subagent-driven development",
  "execute plan with subagents", "dispatch a subagent per task".
allowed-tools: Agent Read Bash
metadata:
  dstack:
    version: 0.7.1
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - subagent-driven development
      - execute plan with subagents
      - dispatch subagent per task
---
# /subagent-driven-development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

**Continuous execution:** Do not ask the user whether to continue between tasks; report each task's outcome and its Status row as it lands. Stop only for a BLOCKED status you cannot resolve, an ambiguity that genuinely prevents progress, or the last task.

Your judgment is which context each subagent needs (you construct it; they
never inherit your history) and whether a BLOCKED status means the plan is
wrong versus the model is too weak. The rails fix the loop; those two calls
are yours.

## When to use

Walk this decision table:

| Have a written plan? | Tasks mostly independent? | Stay in this session? | Use |
|---|---|---|---|
| No | — | — | `/writing-plans` first (or `/brainstorm` if the shape is unclear) |
| Yes | No (tightly coupled) | — | Manual execution — coupled tasks fight over the same files |
| Yes | Yes | Yes | `/subagent-driven-development` (this skill) |
| Yes | Yes | No (separate session) | `/executing-plans` |

**Right time:** one plan, whose tasks build **one** feature in order, and you
want them done now without babysitting each step. Tasks run **one at a time** —
the parallelism here is context isolation, not concurrency.

**Not this skill — nearest neighbours** (the closest confusions, not exhaustive):

| Situation | Use instead | Why |
|---|---|---|
| 2+ *already-independent* problems (different root causes/subsystems), no shared files | `/dispatching-parallel-agents` | Those run **concurrently**; this skill runs tasks **sequentially** (parallel implementers collide — see Red flags) |
| A plan you want executed with human checkpoints, in a fresh session | `/executing-plans` | Same-session vs handoff is the only real difference |
| No plan yet, just a goal | `/writing-plans` | This skill executes a plan; it does not design one |
| One small change | Do it yourself | Three subagent round-trips per task is not worth it |

## The process

1. **Set up.** Read the plan once. Extract all tasks with full text and
   context. Create one todo per task.
2. **Per task, in order:**
   1. Dispatch the implementer subagent (`references/implementer-prompt.md`).
   2. If it asks questions, answer them and provide context, then let it
      proceed (re-dispatch if needed).
   3. The implementer implements, tests, commits, and self-reviews.
   4. Dispatch the spec reviewer (`references/spec-reviewer-prompt.md`).
      If it finds gaps, the implementer fixes them and you re-review —
      loop until spec-compliant.
   5. Only once spec is ✅, dispatch the code-quality reviewer
      (`references/code-quality-reviewer-prompt.md`). If it does not
      approve, the implementer fixes the issues and you re-review — loop
      until approved.
   6. Mark the task's todo complete.
3. **Next task.** Repeat step 2 until no tasks remain.

Two review rounds on one task without approval — spec or quality — means
stop and hand the user both reports; do not loop a third time.
4. **Final pass.** Dispatch one code reviewer for the entire
   implementation.
5. **Wrap up.** Use `/finishing-development-branch`.

## Model selection

Mechanical tasks (one or two files, complete spec): the host's cheaper tier.
Integration and judgment tasks, and every review: the session's default model.
Nothing below the cheaper tier for code that ships.

## Handling implementer status

Implementer subagents report one of four statuses — closed by design: the Report Format in `references/implementer-prompt.md` fixes this vocabulary. Handle each appropriately:

**DONE:** Proceed to spec compliance review.

**DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

**NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

**BLOCKED:** The implementer cannot complete the task. Assess the blocker — these four are the recurring diagnoses, not exhaustive:
1. If it's a context problem, provide more context and re-dispatch with the same model
2. If the task requires more reasoning, re-dispatch with a more capable model
3. If the task is too large, break it into smaller pieces
4. If the plan itself is wrong, escalate to the user

**Never** ignore an escalation or force the same model to retry without changes. If the implementer said it's stuck, something needs to change.

## Writing status back to the plan

The plan's `## Status` block (`/writing-plans`) is the record that outlives this
session; your todo list is not. **You** own it — subagents must not write to the
plan file, or concurrent tasks will clobber each other.

After each task passes both reviews, update its row: state `done`, the commit
SHA and observed evidence, `Updated:` bumped, `Next:` moved on. A `BLOCKED` you
escalate goes in as `blocked` with the reason before you stop. Deviations from
the plan are appended to `Deviations from plan`, never folded silently into the
task text.

## Prompt templates

- `references/implementer-prompt.md` - Dispatch implementer subagent
- `references/spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `references/code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent
- `references/example-workflow.md` - A worked run, two tasks end to end

## Example workflow

A worked run: `references/example-workflow.md`.

## What you trade

| You get | You pay |
|---|---|
| Fresh context per task — no pollution across tasks, and your own context stays free for coordination | ≥3 subagent invocations per task (implementer + 2 reviewers), more on review loops |
| Two gates per task: spec compliance catches over/under-building, code quality catches how it was built | Up-front prep — you extract every task's full text before task 1 starts |
| Questions surface before work starts, not after a wrong implementation lands | Sequential execution — tasks do not overlap |

Worth it when a wrong implementation is expensive to unwind. Not worth it for
a one-file change.

## Red flags

The recurring ones, **not exhaustive** — anything that lets unreviewed work
reach the plan belongs here.

**Never:**
- Start implementation on main/master branch without explicit user consent
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Two rounds without approval go to the user
- Don't skip the re-review

**If a subagent fails its task:** a fix you can make in a couple of edits,
make yourself; dispatch a fix subagent only when the fix is itself a task.

## Cross-references

**Required workflow skills:**
- `/using-git-worktrees` - Ensures isolated workspace (creates one or verifies existing)
- `/writing-plans` - Creates the plan this skill executes
- `/requesting-code-review` - Code review template for reviewer subagents
- `/finishing-development-branch` - Complete development after all tasks

**Subagents should use:**
- `/test-driven-development` - Subagents follow it per task; it decides the
  task's risk tier and test path

**Alternative workflow:**
- `/executing-plans` - Use for parallel session instead of same-session execution
