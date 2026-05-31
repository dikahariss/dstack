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
    version: 0.1.0
    type: semantic
    side_effects: readonly
    agency: reactive
    context_budget_tokens: 1800
    triggers:
      - which skill applies
      - find a skill
      - how do I use dstack skills
---
# /using-dstack

Invoke relevant or requested skills **before** any response or action.
Even a real-but-small chance a skill applies means you invoke it to
check. If an invoked skill turns out wrong for the situation, you do not
have to use it — but you do have to look.

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

- **Rigid** (`/tdd`, `/debugging`): follow exactly; don't adapt away the
  discipline.
- **Flexible** (patterns): adapt the principle to context.

The skill itself tells you which.

## Changes

- **0.1.0** — Ported from superpowers `using-superpowers` and renamed to
  `using-dstack`. Reduced to dstack's single host (Claude Code): removed
  the Copilot/Codex/Gemini platform-adaptation section and the
  `references/` tool mappings; examples point to dstack skills.
