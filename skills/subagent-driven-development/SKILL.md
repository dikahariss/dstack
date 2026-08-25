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
    version: 0.6.0
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

**Continuous execution:** Do not pause to check in with the user between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are: BLOCKED status you cannot resolve, ambiguity that genuinely prevents progress, or all tasks complete. "Should I continue?" prompts and progress summaries waste their time — they asked you to execute the plan, so execute it.

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
4. **Final pass.** Dispatch one code reviewer for the entire
   implementation.
5. **Wrap up.** Use `/finishing-development-branch`.

## Model selection

Use the least powerful model that can handle each role to conserve cost and increase speed. The categories and signals below are heuristics, not exhaustive — judge the task in front of you.

**Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model. Most implementation tasks are mechanical when the plan is well-specified.

**Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model.

**Architecture, design, and review tasks**: use the most capable available model.

**Task complexity signals:**
- Touches 1-2 files with a complete spec → cheap model
- Touches multiple files with integration concerns → standard model
- Requires design judgment or broad codebase understanding → most capable model

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

## Example workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create a todo per task]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Get git SHAs, dispatch code quality reviewer]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

[Mark Task 1 complete]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items")
  - Extra: Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

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
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Move to next task while either review has open issues

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

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

## Changes

- **0.6.0** — Generated code arrived padded with comments that narrate it, which
  reads as machine-written and costs credibility at senior level. The comment
  rule now sits in `references/implementer-prompt.md`, which the implementer
  reads before writing code, and in `references/code-quality-reviewer-prompt.md`.
- **0.5.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.5.1** — ADR-0030 list openness: the red-flag list is open.
- **0.5.0** — Added status write-back to the plan's `## Status` block
  (`/writing-plans` 0.7.0), owned by the orchestrator so parallel subagents
  cannot clobber the file. Without it, same-session execution finished tasks
  the next session had no record of — the same gap `/executing-plans` 0.3.0
  closes for separate sessions.
- **0.4.0** — Reciprocated `/test-driven-development` 0.6.0: the implementer
  prompt now delegates the risk-tier decision (inside → failing test first;
  outside → frozen case list with expected outcomes, then tests) instead of
  restating the old unconditional iron law, which contradicted `Tier: none`
  tasks arriving from `/writing-plans`.

- **0.3.0** — Fixed an unsupported claim: the body advertised "subagents follow
  TDD naturally" while `references/implementer-prompt.md` only said "following
  TDD *if task says to*". The prompt now instructs `/test-driven-development`
  (skippable only for no-behavior-change tasks) and `/verifying-before-done`,
  so the claim holds. Added the nearest-neighbour boundary table — chiefly
  **`/dispatching-parallel-agents`** (concurrent, already-independent problems)
  vs this skill (sequential tasks from one plan). Replaced the five-heading
  "Advantages" pitch with one get/pay trade-off table (dstack voice).
- **0.2.0** — Named the judgment (which context each subagent needs;
  reading a BLOCKED status as plan-wrong vs model-too-weak). Hardening
  (v3 plan): converted both graphviz blocks to a decision table and a
  numbered process; replaced TodoWrite with host-accurate phrasing;
  normalised headings to dstack voice.
- **0.1.0** — Initial. Sub-skill references use the `/skill` form; prompt
  templates live in `references/` rather than inline, so the body stays the
  dispatch surface.
