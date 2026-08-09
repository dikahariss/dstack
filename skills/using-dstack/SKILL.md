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
    version: 0.16.0
    type: semantic
    side_effects: readonly
    agency: reactive
    calibration: schema-meta
    context_budget_tokens: 4000
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
2. Read it as a *situation*, then scan the router below. Match → invoke.
3. No exact match but the task resembles a row → invoke it anyway. Over-invoking
   is cheap; skipping a skill is not.
4. Still nothing → read `references/skill-catalog.md`. If that is also empty,
   proceed without a skill **and say so in one line**.
5. Announce: "Using <skill> to <purpose>."
6. If the skill has a checklist, create a todo per item. Follow the skill.

About to plan a creative change and not yet aligned? `/brainstorm` first.

## Which skill — quick router

Match on **intent, not wording**. The user may write in any language; translate
their request into the situations below before matching, and reply in the
language they used. One row can fire more than once in a task.

| Situation | Skill |
|---|---|
| Problem, goals, or requirements not written down yet | `/discovering-requirements` |
| Several candidate items and nobody has agreed what comes first | `/prioritizing-work` |
| Requirements agreed; the design/blueprint is not written | `/writing-specs` |
| Criteria exist; the situations to test are not enumerated | `/designing-test-cases` |
| A diagram must leave the document — editable or shareable | `/diagramming-architecture` |
| A business process needs a real `.bpmn` — roles, lanes, gateways | `/modelling-business-processes` |
| Use case or sequence diagram — actors, goals, message order | `/modelling-system-behaviour` |
| Spec says what a screen does; nobody can see it yet | `/wireframing-interfaces` |
| Ambiguous/creative plan or design, not aligned | `/brainstorm` |
| Have a spec; need a step-by-step plan | `/writing-plans` |
| Execute a written plan (separate session) | `/executing-plans` |
| Execute plan tasks now via subagents + review | `/subagent-driven-development` |
| 2+ independent problems, work in parallel | `/dispatching-parallel-agents` |
| Bug / test failure / unexpected behavior | `/debugging` (then `/test-driven-development`) |
| New feature, bugfix, behavior change | `/test-driven-development` — it decides how much discipline the change earned; the full cycle is **not** the default |
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
| Audit a short-form video file; build a video dataset/corpus | `/auditing-short-video` |
| Show or bump VERSION | `/managing-version` |
| Triage / classify a pasted issue | `/classify-issue` |
| Learn from past sessions — turn them into durable rules | `/learning-from-sessions` |

**"Do all of it" is a prioritization request.** An instruction to finish
everything, work through the whole list, or complete all of it leaves the order
implicit — it does not remove it. Run `/prioritizing-work` on the list before
executing, unless it holds fewer than five items. Users ask for the whole scope
far more often than they ask which item comes first, so this is the trigger that
actually fires.

**Building a product, app, SaaS, or web app? The visible slice ships first.**
Unless the work is genuinely backend-only (a service, a job, a data pipeline,
an API with no screen), the first executable task must produce a screen the
user can open and click — stubbed data is fine. `/writing-plans` enforces the
ordering; a plan whose first task produces nothing visible gets rejected there.

**Common chains:**
- Feature: `/discovering-requirements` (problem not yet written; `/brainstorm`
  alongside it if the idea itself is in doubt) → `/prioritizing-work` (several
  candidates; also fires standalone on a multi-item instruction with no prior
  discovery) → `/writing-specs` (design not yet
  written) → `/designing-test-cases` → `/writing-plans` (visible slice first;
  carries the priority order, does not re-derive it) →
  `/subagent-driven-development` (or
  `/executing-plans`) → `/running-uat` (anything with a screen) →
  `/verifying-before-done` →
  `/finishing-development-branch`.
- Bug: `/debugging` → `/test-driven-development` (a bug fix is always inside a
  risk tier — the reproducing test is mandatory) → `/verifying-before-done`.
- Shipping a UI change: tests green → `/running-uat` (browser, per point of view)
  → fix → `/finishing-development-branch`. A green suite is never the evidence
  a screen works.
- Literature review: `/literature-search` → `/literature-trends` → `/literature-fulltext`.
- Modelling a system: `/discovering-requirements` (its actor table feeds both) →
  `/modelling-system-behaviour` (who wants what, in what order) →
  `/modelling-business-processes` (who does what, as a `.bpmn`) → `/writing-specs`.

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
  discipline. Rigid means the *gate* is not negotiable — for TDD that gate is
  naming the risk tier and deriving cases from the spec, not running the full
  cycle on every change.
- **Flexible** (patterns): adapt the principle to context.

The skill itself tells you which.

## Bundled files

- `references/skill-catalog.md` — full skill catalog: triggers, scope, and
  hand-off rules. Loads on demand; read it per the conditions above.

## Changes

- **0.16.0** — Registered `/prioritizing-work`: router row, feature chain, and
  catalog entry. The router row alone would not have fired — the phrase users
  actually type is "do all of it", never "which comes first" — so the
  do-everything paragraph keys on the **omission** of an order rather than on
  the word "prioritize", and states the under-five-items exception.
- **0.15.0** — English-only sweep of `references/skill-catalog.md`; 0.14.0's
  quoted complaint became English reported speech. Enforces 0.7.0 below.
  Preserved as data: the document types `pdf-to-rag` matches (Permenhub,
  Inpres, Juknis, UU) and the names Neliti and perpusnas e-resources.
  `context_budget_tokens` re-targeted 3000 → 4000: the router grew a
  frontend-first rule and longer chains, and 3000 no longer described it.
- **0.14.0** — Stopped routing every behavior change into the full red-green
  cycle, and put the visible slice first. Transcript mining across three CLI
  installs measured `/test-driven-development` as the catalog's most expensive
  skill (median 90 min to the next human turn, p90 460 min) while the owner
  still had to test manually afterwards; separately, 12+ pushback turns are
  about the visible product arriving late or wrong — the archetype being a
  report of 78 green server tests answered by the owner saying he still could
  not see any result. The TDD row now says the skill decides the tier and the cycle is not the
  default; the bug chain says a fix is always inside a tier; the feature chain
  routes through `/running-uat` before `/verifying-before-done`; and a
  frontend-first rule sits above the chains, scoped to product/app/SaaS work
  and exempting genuinely backend-only work. "Rigid" now names the gate that is
  non-negotiable rather than implying the whole cycle always runs.
- **0.13.0** — Registered `modelling-business-processes` (a business process as
  a real `.bpmn`) and `modelling-system-behaviour` (use case and sequence models
  in UML), plus a modelling chain. Both sit beside `diagramming-architecture`
  rather than inside it: the draw.io CLI cannot read `.bpmn` at all, and Mermaid
  has no use case diagram, so neither notation is reachable from that skill.
- **0.12.0** — Registered `auditing-short-video` (audit a short-form video file;
  build a per-video dataset and a multi-video corpus).
- **0.11.0** — Registered `diagramming-architecture` and `wireframing-interfaces`:
  design artifacts that leave the spec document as editable files.
- **0.8.0–0.10.0** — Registered the specification chain at the head of the
  feature chain: `discovering-requirements` → `writing-specs` →
  `designing-test-cases` → `writing-plans`.
- **0.7.0** — Reverted a bilingual trigger table added the same day: it rested
  on an unverified claim that cheap models match lexically rather than
  translating, and cost 500 tokens for a capability every model already has.
  Skills stay English; one line says match on intent, reply in the user's
  language. Kept the mechanical rule — near-match invokes, no match falls
  through to the catalog then to an explicit "no skill applied" line.
- **0.6.0** — Registered `learning-from-sessions` (mine the `~/.claude/projects`
  transcript store into durable rule/skill/memory changes) in the router and
  catalog.
- **0.5.0** — Registered `running-uat` (acceptance-testing a running app)
  and `multi-persona-review` (one artifact, several expert points of view)
  in the router, catalog, and chains.
- **0.4.0** — Repointed router, catalog, and chains at the five renamed skills
  (ADR-0027); budget 2000→2500 for the longer names.
- **0.3.1–0.3.4** — Registered `pdf-to-rag` and the literature pipeline across
  router, catalog, and chains; dropped a brittle skill count.
- **0.3.0** — calibration: schema-meta (ADR-0025). The judgment: deciding
  whether a borderline skill applies.
- **0.2.0** — Inline router + chains + bundled `references/skill-catalog.md`
  + `eval/cases.jsonl` (ADR-0016/0017).
- **0.1.0** — Initial. Reduced to dstack's single host (Claude Code).
