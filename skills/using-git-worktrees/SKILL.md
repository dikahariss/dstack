---
name: using-git-worktrees
description: |
  Use when starting feature work that needs isolation from the current
  workspace, or before executing an implementation plan. Ensures an
  isolated workspace exists — detect existing isolation first, prefer the
  platform's native worktree tools (e.g. EnterWorktree), fall back to
  `git worktree` only when no native tool exists. Triggers: "git
  worktree", "isolated workspace", "set up a worktree".
allowed-tools: Read Bash
metadata:
  dstack:
    version: 0.3.1
    type: semantic
    side_effects: local
    agency: deliberative
    calibration: deterministic-dominant
    context_budget_tokens: 3500
    triggers:
      - git worktree
      - isolated workspace
      - using-git-worktrees
      - worktree setup
---
# /using-git-worktrees

## Overview

Ensure work happens in an isolated workspace. Prefer your platform's native worktree tools. Fall back to manual git worktrees only when no native tool is available.

**Core principle:** Detect existing isolation first. Then use native tools. Then fall back to git. Never fight the harness.

The one judgment call: when the harness has no native worktree tool,
choosing to fall back to `git worktree` is yours. Detection, the
ignore-check, and project setup all follow the protocol below.

**Announce at start:** "Using using-git-worktrees to set up an isolated workspace."

## When NOT to use

- You are already in an isolated workspace (Step 0 detects this) — work in place.
- The user has declined a worktree, or declared a work-in-place preference.
- The task is a quick read-only inspection that mutates nothing.

## Step 0: Detect existing isolation

**Before creating anything, check if you are already in an isolated workspace.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules. Before concluding "already in a worktree," verify you are not in a submodule:

```bash
# If this returns a path, you're in a submodule, not a worktree — treat as normal repo
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**If `GIT_DIR != GIT_COMMON` (and not a submodule):** You are already in a linked worktree. Skip to Step 3 (Project Setup). Do NOT create another worktree.

Report with branch state:
- On a branch: "Already in isolated workspace at `<path>` on branch `<name>`."
- Detached HEAD: "Already in isolated workspace at `<path>` (detached HEAD, externally managed). Branch creation needed at finish time."

**If `GIT_DIR == GIT_COMMON` (or in a submodule):** You are in a normal repo checkout.

Has the user already indicated their worktree preference in your instructions? If not, ask for consent before creating a worktree:

> "Would you like me to set up an isolated worktree? It protects your current branch from changes."

Honor any existing declared preference without asking. If the user declines consent, work in place and skip to Step 3.

## Step 1: Create the isolated workspace

**You have two mechanisms. Try them in this order.**

### 1a. Native worktree tools (preferred)

The user has asked for an isolated workspace (Step 0 consent). Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag. If you do, use it and skip to Step 3.

Native tools handle directory placement, branch creation, and cleanup automatically. Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage.

Only proceed to Step 1b if you have no native worktree tool available.

### 1b. Git worktree fallback

**Only use this if Step 1a does not apply** — you have no native worktree tool available. Create a worktree manually using git.

#### Directory selection

Follow this priority order. Explicit user preference always beats observed filesystem state.

1. **Check your instructions for a declared worktree directory preference.** If the user has already specified one, use it without asking.

2. **Check for an existing project-local worktree directory:**
   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (hidden)
   ls -d worktrees 2>/dev/null      # Alternative
   ```
   If found, use it. If both exist, `.worktrees` wins.

3. **Check for a sibling worktree directory** the user already keeps outside the
   repo, named in an instruction file or visible next to the project root:
   ```bash
   ls -d ../*worktrees* 2>/dev/null
   ```
   If found, use it.

4. **If there is no other guidance available**, default to `.worktrees/` at the project root.

#### Safety verification (project-local directories only)

**MUST verify directory is ignored before creating worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:** Add to .gitignore, commit the change, then proceed.

**Why critical:** Prevents accidentally committing worktree contents to repository.

A directory outside the repository needs no verification — git cannot track it.

#### Create the worktree

```bash
project=$(basename "$(git rev-parse --show-toplevel)")

# Determine path based on chosen location
# For project-local: path="$LOCATION/$BRANCH_NAME"
# For an external directory: path="$LOCATION/$project/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**Sandbox fallback:** If `git worktree add` fails with a permission error (sandbox denial), tell the user the sandbox blocked worktree creation and you're working in the current directory instead. Then run setup and baseline tests in place.

## Step 3: Project setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## Step 4: Verify the clean baseline

Run tests to ensure workspace starts clean:

```bash
# Use project-appropriate command
npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### Report

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick reference

| Situation | Action |
|-----------|--------|
| Already in linked worktree | Skip creation (Step 0) |
| In a submodule | Treat as normal repo (Step 0 guard) |
| Native worktree tool available | Use it (Step 1a) |
| No native tool | Git worktree fallback (Step 1b) |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check instruction file, then default `.worktrees/` |
| Sibling `*worktrees*` dir exists | Use it (no ignore check needed) |
| Directory not ignored | Add to .gitignore + commit |
| Permission error on create | Sandbox fallback, work in place |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common mistakes

These are the recurring ones, **not exhaustive** — a new harness or a new
platform will invent its own, and the fix pattern below generalizes.

### Fighting the harness

- **Problem:** Using `git worktree add` when the platform already provides isolation
- **Fix:** Step 0 detects existing isolation. Step 1a defers to native tools.

### Skipping detection

- **Problem:** Creating a nested worktree inside an existing one
- **Fix:** Always run Step 0 before creating anything

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > external directory > instruction file > default

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

## Red flags

**Never:**
- Create a worktree when Step 0 detects existing isolation
- Use `git worktree add` when you have a native worktree tool (e.g., `EnterWorktree`). This is the #1 mistake — if you have it, use it.
- Skip Step 1a by jumping straight to Step 1b's git commands
- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking

**Always:**
- Run Step 0 detection first
- Prefer native tools over git fallback
- Follow directory priority: existing > external directory > instruction file > default
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Cross-references

- `/finishing-development-branch` — the wrap-up counterpart that tears
  down the worktree this skill creates.
- `/executing-plans` — set up isolation here before executing a plan.
- `/verifying-before-done` — run the clean-baseline gate (Step 4) through it.

## Changes

- **0.3.1** — ADR-0030 list openness: the common-mistakes list is open.
- **0.3.0** — Replaced an inherited hard-coded global worktree path with generic
  external-directory detection (`../*worktrees*`). That path does not exist on
  this machine and never did; it was import residue presented as live
  back-compat, and a detection step that can never fire is still a tool call a
  model spends.

- **0.2.0** — calibration: deterministic-dominant (ADR-0025; deterministic
  by design — detection + exact bash). Named the bounded judgment (the
  native-vs-`git worktree` fallback choice). Hardening (v3 plan): added
  "When NOT to use" + Cross-references; normalised headings to dstack
  voice; consolidated the external-directory detection note.
- **0.1.0** — Initial. The native-tool guidance matches Claude Code's
  `EnterWorktree`/`ExitWorktree`; detection prefers an isolation the
  workspace already has over creating a new one.
