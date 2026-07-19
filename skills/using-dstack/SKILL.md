---
name: using-dstack
description: |
  Use at the start of any task. Establishes the rule that relevant
  dstack skills must be invoked before acting — before exploring,
  before clarifying questions, before any response. If there is a real
  chance a skill applies, invoke it to check.
allowed-tools: Skill Read Grep Glob
metadata:
  dstack:
    version: 0.5.0
    type: semantic
    side_effects: readonly
    agency: reactive
    calibration: schema-meta
    context_budget_tokens: 2500
    triggers:
      - which skill applies
      - find a skill
      - how do I use dstack skills
      - which skill should I use
      - route to the right skill
      - when to call which skill
---
# /using-dstack

Invoke relevant or requested skills **before** any response or action.
Even a real-but-small chance a skill applies means you invoke it to
check. If an invoked skill turns out wrong for the situation, you do not
have to use it — but you do have to look.

Deciding whether a borderline skill applies is your judgment — bias toward
invoking, but the call is yours.

## Instruction priority

1. **User instructions** (CLAUDE.md, direct requests) — highest.
2. **Skills** — override default behavior where they conflict.
3. **Default behavior** — lowest.

If CLAUDE.md says "don't use TDD" and a skill says "always use TDD",
follow CLAUDE.md. The user is in control.

## How to access skills

Use the `Skill` tool — its content loads and you follow it directly.
Never `Read` a skill file to "use" it; invoke it. dstack targets Claude
Code, so there is one host and one way in.

## The rule

```
Invoke relevant skills BEFORE responding — including before clarifying
questions.
```

1. A message arrives (a question is a task too).
2. Might any skill apply? If yes — even a small chance — invoke it.
3. Announce: "Using <skill> to <purpose>."
4. If the skill has a checklist, create a todo per item.
5. Follow the skill.

About to plan a creative change and not yet aligned? `/brainstorm` first.

## Which skill — quick router

Match the situation, then invoke that skill. When unsure, read
`references/skill-catalog.md` (see "When to open the full catalog" below).

| Situation | Skill |
|---|---|
| Ambiguous/creative plan or design, not aligned | `/brainstorm` |
| Have a spec; need a step-by-step plan | `/writing-plans` |
| Execute a written plan (separate session) | `/executing-plans` |
| Execute plan tasks now via subagents + review | `/subagent-driven-development` |
| 2+ independent problems, work in parallel | `/dispatching-parallel-agents` |
| Bug / test failure / unexpected behavior | `/debugging` (then `/test-driven-development`) |
| New feature, bugfix, behavior change | `/test-driven-development` |
| About to claim done / fixed / passing | `/verifying-before-done` |
| Acceptance-test a RUNNING app via browser (UAT) | `/running-uat` |
| One artifact, several expert points of view | `/multi-persona-review` |
| Destructive or risky command, or prod | `/guarding-destructive-commands` |
| Need an isolated workspace | `/using-git-worktrees` |
| Work done — merge / PR / keep / discard | `/finishing-development-branch` |
| Got PR or review feedback to address | `/responding-to-review` |
| Want a fresh review of your own work | `/requesting-code-review` |
| Create / edit / verify a dstack skill | `/writing-skills` |
| Convert PDF(s) to retrieval-ready Markdown (scanned/regulation) | `/pdf-to-rag` |
| Harvest citations → RIS from an academic database (SLR/bibliometric) | `/literature-search` |
| A RIS/BibTeX corpus → research-topic trends + diagrams | `/literature-trends` |
| Download open-access PDFs for a citation corpus | `/literature-fulltext` |
| Show or bump VERSION | `/managing-version` |
| Triage / classify a pasted issue | `/classify-issue` |

**Common chains:**
- Feature: `/brainstorm` → `/writing-plans` → `/subagent-driven-development`
  (or `/executing-plans`) → `/verifying-before-done` → `/finishing-development-branch`.
- Bug: `/debugging` → `/test-driven-development` → `/verifying-before-done`.
- Shipping a UI change: tests green → `/running-uat` (browser, per point of view)
  → fix → `/finishing-development-branch`.
- Literature review: `/literature-search` → `/literature-trends` → `/literature-fulltext`.

### When to open the full catalog

Read `references/skill-catalog.md` when **any** of these is true — it carries the
exact triggers, each skill's scope, and which skill to hand off to next:
- the table above is not an obvious match for the request;
- two skills seem to apply and you must choose one;
- you need a skill's precise triggers or boundaries before committing;
- you need the next step in a chain (what to invoke after the current skill).

For Claude Code's built-in features (not dstack skills) — `/compact`, `/agents`,
plan mode, hooks, MCP, effort/model — use `/help` or see code.claude.com/docs.

## Red flags — you are rationalizing

| Thought | Reality |
|---|---|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | The skill check comes before clarifying. |
| "Let me explore the codebase first" | Skills tell you how to explore. Check first. |
| "I'll just do this one thing first" | Check before doing anything. |
| "I remember this skill" | Skills evolve. Invoke the current version. |
| "The skill is overkill" | Simple things become complex. Use it. |

## Priority when several apply

1. **Process skills first** — `/brainstorm`, `/debugging` decide *how* to
   approach the task.
2. **Implementation skills second** — they guide execution.

"Let's build X" → `/brainstorm`, then implement. "Fix this bug" →
`/debugging`, then the domain skill.

## Skill types

- **Rigid** (`/test-driven-development`, `/debugging`): follow exactly; don't adapt away the
  discipline.
- **Flexible** (patterns): adapt the principle to context.

The skill itself tells you which.

## Bundled files

- `references/skill-catalog.md` — full skill catalog: triggers, scope, and
  hand-off rules. Loads on demand; read it per the conditions above.

## Changes

- **0.5.0** — Registered `running-uat` (acceptance-testing a running app)
  and `multi-persona-review` (one artifact, several expert points of view)
  in the router, catalog, and chains.
- **0.4.0** — Repointed the router, catalog, and chains at the five renamed
  skills (`test-driven-development`, `responding-to-review`, `guarding-
  destructive-commands`, `verifying-before-done`, `managing-version`).
  Raised the body budget 2000→2500: the descriptive names cost tokens the
  old abbreviations did not.
- **0.3.4** — Refreshed the catalog's three literature rows: the tested-adapter
  list (T&F, Springer, ProQuest, Neliti) and fulltext's no-DOI paths.
- **0.3.3** — Registered the literature-review pipeline (`literature-search` →
  `literature-trends` → `literature-fulltext`) in the router, catalog, and chains.
- **0.3.2** — Added `pdf-to-rag` to the inline router (already in the
  catalog); removed an unused domain skill from the router + catalog.
- **0.3.1** — Registered `pdf-to-rag` in the catalog; dropped the brittle
  "18-skill" count.
- **0.3.0** — calibration: schema-meta (ADR-0025; meta/router). The judgment:
  deciding whether a borderline skill applies.
- **0.2.0** — Inline "Which skill" router + common chains + bundled
  `references/skill-catalog.md` + `eval/cases.jsonl` (ADR-0016/0017).
- **0.1.0** — Ported from superpowers `using-superpowers`; reduced to dstack's
  single host (Claude Code).
