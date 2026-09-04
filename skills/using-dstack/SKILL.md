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
    version: 0.24.0
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

Invoke the skill whose row matches the situation before you respond,
including before a clarifying question. A borderline match is your call:
open the skill when the situation resembles a row; skip it when the task is
plainly outside the catalog. A loaded skill costs one to five thousand tokens
for the rest of the session, so invoke on a match, not on doubt. If an
invoked skill turns out wrong for the situation, you do not have to use it.

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

Before the first response: the router below has been scanned, the matching
skill invoked, and the choice stated in one line ("Using <skill> to
<purpose>"). No row and no catalog match → proceed without a skill and say so
in one line. A skill with a checklist gets one todo per item. A question is a
task; the check comes before clarifying.

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
| A picture must be created, not found or drawn — a scene, cover, placeholder photo | `/generating-images` |
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
| Audit a video file — is it any good? build a video dataset/corpus | `/auditing-video` |
| Take a video apart into shots and rebuild it as generation prompts | `/reverse-engineering-video` |
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
- Rebuilding a video: `/reverse-engineering-video` (survey, then structure) →
  `/dispatching-parallel-agents` (one agent per sequence once the frame budget
  exceeds one context) → `/generating-images` (the stills the prompts describe).
  Judging one instead is `/auditing-video`; a file can go through both.
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

Not exhaustive — open the catalog whenever the table is not an obvious match.

For Claude Code's built-in features (not dstack skills) — `/compact`, `/agents`,
plan mode, hooks, MCP, effort/model — use `/help` or see code.claude.com/docs.

## Priority when several apply

1. **Process skills first** — `/brainstorm`, `/debugging` decide *how* to
   approach the task.
2. **Implementation skills second** — they guide execution.

"Let's build X" → `/discovering-requirements` (with `/brainstorm` alongside it
if the idea itself is in doubt), then implement. "Fix this bug" →
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
