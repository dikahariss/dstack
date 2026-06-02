---
name: executing-plans
description: |
  Use when you have a written implementation plan to execute in a
  separate session with review checkpoints. Load the plan, review it
  critically, execute every task in order, stop on blockers, and finish
  the branch. Triggers: "execute plan", "run the plan", "implement this
  plan".
allowed-tools: Read Edit Write Bash
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 1500
    triggers:
      - execute plan
      - executing-plans
      - implement the plan
      - run the plan
---
# /executing-plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "Using executing-plans to implement this plan."

**Note:** This works much better with subagents. Claude Code provides
the `Agent` tool — when subagents are available, prefer
`/subagent-driven-development` for same-session execution. Use this
skill when executing a plan in a separate session with review
checkpoints.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with the user before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "Using finishing-a-development-branch to complete this work."
- **REQUIRED SUB-SKILL:** Use `/finishing-a-development-branch`
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- The user updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- `/using-git-worktrees` - Ensures isolated workspace (creates one or verifies existing)
- `/writing-plans` - Creates the plan this skill executes
- `/finishing-a-development-branch` - Complete development after all tasks

## Changes

- **0.1.0** — Imported from superpowers `executing-plans`. Adapted to
  dstack: added frontmatter/`metadata.dstack`; `superpowers:` sub-skill
  references rewritten as `/skill`; "your human partner" → "the user";
  the subagent note points at the Claude Code `Agent` tool and
  `/subagent-driven-development`.
