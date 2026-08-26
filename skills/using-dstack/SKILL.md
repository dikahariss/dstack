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
    version: 0.21.0
    type: semantic
    side_effects: readonly
    agency: reactive
    calibration: schema-meta
    context_budget_tokens: 4500
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

## Which skill — quick router

Match on **intent, not wording**. The user may write in any language; translate
their request into the situations below before matching, and reply in the
language they used. One row can fire more than once in a task.

The table is **not exhaustive** — the catalog grows. A situation with no row
is a routing gap, never a licence to skip the check.

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
| One artifact or product-review packet needs independent user, operational, and expert coverage → a decision | `/multi-persona-review` |
| Reviewers agreeing too readily; need someone to attack it | `/multi-persona-review` |
| Destructive or risky command, or prod | `/guarding-destructive-commands` |
| Need an isolated workspace | `/using-git-worktrees` |
| Work done — merge / PR / keep / discard | `/finishing-development-branch` |
| Got PR or review feedback to address | `/responding-to-review` |
| Want a fresh review of your own work | `/requesting-code-review` |
| Create / edit / verify a dstack skill | `/writing-skills` |
| Answer needs facts from the open web — prices, versions, dates, current state | `/researching-facts` |
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

**The code carries no narration.** Comment density is inherited from the file
you are editing, not introduced: if the surrounding code has none, the diff has
none. A comment earns its place only where it records a *why* the code cannot
show — a constraint, a workaround with a reference, an invariant held
elsewhere. Never one inside a function body to narrate the next line, banner the
steps, restate the signature, or address the reviewer (`// Added as requested`,
`// NEW`) — the recurring shapes, not exhaustive. Rename before commenting; a
block that needs a comment to be followed wants to be a named function. Leave no
commented-out code and no unowned TODO.

**Common chains** (samples, not exhaustive):
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
- Product quality: running product evidence → `/running-uat` →
  `/multi-persona-review` packet review (class + lifecycle gate, human evidence
  kept separate from AI seats) → `/writing-plans`.
- Shipping a UI change: tests green → `/running-uat` (browser, per point of view)
  → fix → `/finishing-development-branch`. A green suite is never the evidence
  a screen works.
- Literature review: `/literature-search` → `/literature-trends` → `/literature-fulltext`.
- Answering from the web: `/researching-facts` (two engines in parallel, then the
  primary source) → `/verifying-before-done`. Academic corpus: `/literature-search`.
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

The recurring ones, not exhaustive — any thought that defers the skill check
counts.

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

- `references/skill-catalog.md` — read per the conditions above.

## Changes

- **0.21.0** — Registered `/researching-facts`: the catalog had no general
  web-research skill, so a question about the world's current state got one
  built-in search call and whatever that engine happened to rank.
- **0.20.0** — Added the comment-discipline rule as a third cross-cutting
  paragraph: the owner reported generated code arriving padded with narration,
  which reads as machine-written and costs credibility at senior level. It sits
  in the always-on router because no implementation skill fires in every session.
- **0.19.1–0.19.2** — ADR-0030 catalog review (list openness, economy),
  panel-verified. The router table is open by construction: the catalog grows,
  and a situation with no row is a routing gap, never a licence to skip the
  check.
- **0.19.0** — Registered `multi-persona-review` 0.5.0's product-review
  expansion. The router row now says what the skill actually covers — one
  artifact **or one product-review packet**, across user, operational and expert
  coverage — and a product-quality chain routes running-product evidence through
  `/running-uat` before the packet review. The catalog entry carries the new
  boundary: coverage is selected by product class and lifecycle gate, human
  evidence is never substituted by an AI seat, and the five-seat cap now has a
  two-perspectives-per-seat limit under it.
- **0.18.0** — Repointed the catalog at `writing-plans` 0.9.0. The chain column
  now runs both ways between it and `multi-persona-review`: a decision record is
  carried into a plan, and an expensive plan goes back out for independent
  reviewers. The row also names what the plan carries, since the previous entry
  claimed the hand-off from the review side while the plan side was silent.
- **0.17.0** — Repointed the router and catalog at `multi-persona-review` 0.4.0,
  which now seats a mandatory Dreamer / Realist / Critic trio and ends in an
  owned decision rather than a findings list. Added a second router row keyed on
  the symptom users actually report — reviewers agreeing too readily — since
  nobody types "multi persona review" when what they notice is that nothing is
  being challenged. Budget 4000→4500 — the router was already at 88% and every
  registration adds to it.
- **0.16.0** — Registered `/prioritizing-work`: router row, feature chain, and
  catalog entry. The router row alone would not have fired — the phrase users
  actually type is "do all of it", never "which comes first" — so the
  do-everything paragraph keys on the **omission** of an order rather than on
  the word "prioritize", and states the under-five-items exception.
- **0.15.0** — English-only sweep of `references/skill-catalog.md`, enforcing
  0.7.0 below; the document types `pdf-to-rag` matches (Permenhub, Inpres,
  Juknis, UU) and the names Neliti and perpusnas e-resources are preserved as
  data. Budget 3000 → 4000: the router had grown a frontend-first rule and
  longer chains.
- **0.14.0** — Stopped routing every behavior change into the full red-green
  cycle, and put the visible slice first. Transcript mining across three CLI
  installs measured `/test-driven-development` as the catalog's most expensive
  skill (median 90 min to the next human turn, p90 460 min) while the owner
  still had to test manually afterwards; separately, 12+ pushback turns are
  about the visible product arriving late or wrong — the archetype being a
  report of 78 green server tests answered by the owner saying he still could
  not see any result. "Rigid" now names the gate that is non-negotiable rather
  than implying the whole cycle always runs.
- **0.11.0–0.13.0** — Registered `diagramming-architecture`,
  `wireframing-interfaces`, `auditing-short-video`,
  `modelling-business-processes` and `modelling-system-behaviour`, plus a
  modelling chain. The two modelling skills sit beside
  `diagramming-architecture` rather than inside it: the draw.io CLI cannot read
  `.bpmn` at all and Mermaid has no use case diagram.
- **0.8.0–0.10.0** — Registered the specification chain at the head of the
  feature chain: `discovering-requirements` → `writing-specs` →
  `designing-test-cases` → `writing-plans`.
- **0.7.0** — Reverted a bilingual trigger table added the same day: it rested
  on an unverified claim that cheap models match lexically rather than
  translating, and cost 500 tokens for a capability every model already has.
  Skills stay English; one line says match on intent, reply in the user's
  language.
- **0.1.0–0.6.0** — Initial, reduced to dstack's single host (Claude Code);
  inline router and chains plus the bundled `references/skill-catalog.md` and
  `eval/cases.jsonl` (ADR-0016/0017); `calibration: schema-meta` (ADR-0025);
  registered `pdf-to-rag`, the literature pipeline, `running-uat`,
  `multi-persona-review` and `learning-from-sessions`; repointed at the five
  renamed skills (ADR-0027).
