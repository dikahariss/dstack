---
name: requesting-code-review
description: |
  Dispatch a code-review subagent with crafted context to catch issues
  before they cascade. The reviewer sees the diff and what the work was
  meant to do, never your session history. Use after finishing a task or
  feature, before merging to main, or when stuck and a fresh read would
  help — e.g. "request review", "get this reviewed", "review before merge".
allowed-tools: Bash Read Grep Glob Agent
metadata:
  dstack:
    version: 0.2.0
    type: semantic
    side_effects: readonly
    agency: deliberative
    context_budget_tokens: 2000
    triggers:
      - request code review
      - get this reviewed
      - review before merge
---
# /requesting-code-review

Dispatch a reviewer subagent to catch issues before they compound. Give
it precisely crafted context — the diff and what the work was meant to
do — never your session's history. This keeps the reviewer on the work
product and preserves your own context for continued work.

Core principle: review early, review often.

Your judgment is what context to craft: the description and requirements
you hand the reviewer set the review's ceiling — a vague brief yields a
vague review. The procedure fixes *how* to dispatch; deciding *what* the
reviewer needs to see is your call.

This is the *requesting* side. Handling the feedback you get back is
`/responding-to-review`.

## When to request

Mandatory:

- After each task in a multi-task plan
- After a major feature
- Before merge to main

Optional but valuable: when stuck (fresh perspective), before a refactor
(baseline read), after fixing a subtle bug.

## How to request

1. **Get the SHAs:**

```bash
BASE_SHA=$(git rev-parse HEAD~1)   # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

2. **Dispatch the reviewer** via the Agent tool, filling the template in
   `code-reviewer.md`. Placeholders:
   - `{DESCRIPTION}` — what you built, briefly
   - `{PLAN_OR_REQUIREMENTS}` — what it should do
   - `{BASE_SHA}` / `{HEAD_SHA}` — the commit range

3. **Act on the feedback:**
   - Fix Critical immediately
   - Fix Important before proceeding
   - Note Minor for later
   - Push back, with reasoning, if the reviewer is wrong

## Example

```
[Finished Task 2: add verification function]

BASE_SHA=$(git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch reviewer via Agent]
  DESCRIPTION: Added verifyIndex() and repairIndex(), 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/2026-05-31-deploy.md
  BASE_SHA / HEAD_SHA: the range above

[Reviewer returns]
  Important: missing progress indicator
  Minor: magic number (100) for the report interval
  Assessment: ready to proceed after the Important fix

[Fix the indicator → continue to Task 3]
```

## Red flags

Never skip review because "it's simple", ignore a Critical issue,
proceed with an unfixed Important issue, or argue with valid technical
feedback.

If the reviewer is wrong: push back with technical reasoning, show the
code or tests that prove it works, or ask for clarification.

See the dispatch template in `code-reviewer.md`.

## Changes

- **0.2.0** — Named the judgment surface (crafting the reviewer's context
  sets the review's ceiling); workflow band (ADR-0025; flag omitted as the
  default).
- **0.1.0** — Ported from superpowers `requesting-code-review`. Adapted
  to dstack: dispatch via the Agent tool, example plan path under
  `docs/plans/`, cross-references `/responding-to-review` for handling the
  returned feedback.
