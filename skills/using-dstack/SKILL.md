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
    version: 0.7.0
    type: semantic
    side_effects: readonly
    agency: reactive
    calibration: schema-meta
    context_budget_tokens: 3000
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
2. **Scan the router below for matching words in the message.** Match → invoke.
3. No match, but the task resembles a row → invoke it anyway. Over-invoking is
   cheap; skipping a skill is not.
4. Still nothing → read `references/skill-catalog.md`. If that is also empty,
   proceed without a skill **and say so in one line**.
5. Announce: "Using <skill> to <purpose>."
6. If the skill has a checklist, create a todo per item. Follow the skill.

About to plan a creative change and not yet aligned? `/brainstorm` first.

## Which skill — quick router

**Match on the words, not on your interpretation.** The user writes Indonesian and
English interchangeably; both are listed. One row can fire more than once in a
task — invoke each in turn.

| If the message contains… | Invoke |
|---|---|
| "brainstorm", "grill me", "stress test", idea not yet agreed | `/brainstorm` |
| "buat rencana", "bikin plan", "write a plan", a spec to break down | `/writing-plans` |
| "jalankan plan", "execute plan" — in a separate session | `/executing-plans` |
| "kerjakan plan", "pakai subagent", plan tasks to run now | `/subagent-driven-development` |
| "paralel", "fan out", 2+ unrelated problems | `/dispatching-parallel-agents` |
| "error", "bug", "gagal", "kenapa", "tidak jalan", a failing test | `/debugging` → then `/test-driven-development` |
| "buat fitur", "perbaiki", "tambahkan", any behavior change | `/test-driven-development` |
| "selesai", "sudah pass", "done", "fixed" — about to claim it | `/verifying-before-done` |
| "lakukan UAT", "uji terima", "test via browser", "pastikan PASS" | `/running-uat` |
| "point of view", "PoV", "sebagai senior…", "cross review", "panel" | `/multi-persona-review` |
| "rm -rf", "drop table", "force push", "reset --hard", "prod" | `/guarding-destructive-commands` |
| "worktree", "workspace terpisah", "isolated" | `/using-git-worktrees` |
| "merge", "MR", "PR", "wrap up", "selesaikan branch" | `/finishing-development-branch` |
| "review bilang", "komentar PR", "address these comments" | `/responding-to-review` |
| "minta direview", "request review", "review before merge" | `/requesting-code-review` |
| "buat skill", "perbaiki skill", "create a skill" | `/writing-skills` |
| "konversi PDF", "pdf to rag", "scan", "OCR", a regulation PDF | `/pdf-to-rag` |
| "cari literatur", "SLR", "boolean query", "export RIS" | `/literature-search` |
| "analisis tren", "bibliometric", "kelompokan topik" | `/literature-trends` |
| "unduh artikel", "download OA PDF", "unpaywall" | `/literature-fulltext` |
| "versi berapa", "bump version", "release X.Y.Z" | `/managing-version` |
| "triage", "klasifikasi issue", a pasted issue body | `/classify-issue` |
| "retro", "pelajaran dari sesi", "evaluasi penggunaan", "lessons learned" | `/learning-from-sessions` |

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

- **0.7.0** — Rewrote the router for weaker models: rows now match on
  literal trigger words in Indonesian and English instead of English
  situation descriptions, since the user writes both and a cheap model
  matches lexically rather than inferring. Made the rule mechanical — scan,
  match, invoke; near-match still invokes; no match falls through to the
  catalog and then to an explicit "proceeding without a skill" line, so
  silence is never the default. Budget 2500→3000: bilingual triggers for 23
  skills cost more than the situation descriptions they replaced.
- **0.6.0** — Registered `learning-from-sessions` (mine the `~/.claude/projects`
  transcript store into durable rule/skill/memory changes) in the router and
  catalog.
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
