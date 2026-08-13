# dstack skill catalog — full routing reference

Read this when: the inline table in `SKILL.md` is not an obvious match; two
skills seem to apply and you must choose; you need a skill's exact triggers or
scope; or you need to know which skill to hand off to next.

Invoke a skill with the `Skill` tool (`/<name>`). Process skills decide *how* to
approach a task and come first; implementation skills execute.

## Process / meta

| Skill | Use when | Hand off |
|---|---|---|
| `discovering-requirements` | The problem behind a request is not written down: a request that names a solution but not the problem, a schema about to be modelled, unclear actors, or a regulated domain. Produces a numbered, traceable discovery document. "requirements analysis", "business/functional requirements", "problem statement", "requirements gathering", "before design". | → `brainstorm` if the idea itself is still in doubt; → `multi-persona-review` on the finished document; → `writing-specs` once agreed. |
| `prioritizing-work` | Several candidate items compete for one capacity and no agreed order exists — including an instruction to do all of it, which leaves the order implicit rather than removing it. Also a plan whose phases no longer match what was built, or an escalated defect whose business priority nobody set. Assigns a lane from evidence: **project** (a date or a deliverable list set outside the team) runs MoSCoW then value ÷ effort; **product** (independent adopters, or a named adoption metric) runs Kano then RICE. Refuses below five items and refuses to score what has no named source. "prioritize", "what first", "scope cut", "MVP scope", "must have", "quick win", "MoSCoW", "RICE", "Kano", "do everything". | ← after `discovering-requirements` when the question spans documents; ← `running-uat` / `multi-persona-review` when a defect's business priority is unset; → `writing-plans`, which carries the order and does not re-derive it. |
| `brainstorm` | An ambiguous plan/design/idea needs alignment before building. "brainstorm", "grill me", "stress test", "interview me". | sibling of `discovering-requirements` — that skill owns the problem and its evidence, this one owns doubt about the idea; comparative "worth building relative to what else" is `prioritizing-work`; → `writing-plans` once aligned. |
| `writing-specs` | Requirements are agreed and the design is not written down: service and module boundaries, domain model and schema, contracts, process flow, interface behaviour, and acceptance criteria — in one document both a stakeholder and an engineer can check. "technical design", "system blueprint", "HLD/LLD", "SDD", "ERD", "API contract". | ← after `discovering-requirements`; → `multi-persona-review` on the draft; → `writing-plans`; its `AC-n` rows feed `running-uat`. |
| `designing-test-cases` | Acceptance criteria or requirements exist and the concrete situations worth testing are not enumerated — before the first test, before a UAT run needing a frozen scenario list, or to give a code-derived test set an unbiased second pass. Derives by named technique (equivalence partitioning, boundary values, decision table, state transition, pairwise, error guessing); produces a list, never test code. "test scenario", "test case", "how many test cases", "boundary value". | ← after `writing-specs`; → `test-driven-development` one case at a time; its human-level rows satisfy `running-uat`'s entry gate. |
| `diagramming-architecture` | A diagram must leave the document it lives in — opened, edited, or handed to someone who does not write Mermaid; a picture for a review or a slide. Produces source plus editable and viewable files, and states per output what the machine could not produce. "draw a diagram", "architecture diagram", "excalidraw", "drawio", "editable diagram". | ← after `writing-specs`; the artifact is referenced from the spec, never replacing its fence. |
| `modelling-business-processes` | A business process, procedure or workflow must exist as a real BPMN 2.0 file — one a modeller opens and an engine can run — not as a picture inside a document. Owns the pool/lane discipline, the element vocabulary, and the lint gate; `.bpmn` is mandatory, renders are optional. Requests for an "activity diagram" or a process flowchart land here. "bpmn", "business process diagram", "approval flow", "swimlane", "camunda", "workflow diagram". | ← after `discovering-requirements` (its actor table becomes the lanes) and `writing-specs`; → `multi-persona-review`. Not `diagramming-architecture` — the draw.io CLI cannot read `.bpmn`. |
| `modelling-system-behaviour` | The behaviour a system owes its users must be modelled in UML: a use case diagram (who wants what, where the boundary falls) or a sequence diagram (message order, who waits for whom). One skill because both share one actor set and the cross-check between them is the point. "use case diagram", "sequence diagram", "plantuml", "system actors", "interaction scenario". | ← after `discovering-requirements`; → `writing-specs` §interaction and `designing-test-cases`, where each alternate flow is already a case. A sequence of purely internal calls belongs to `diagramming-architecture`. |
| `wireframing-interfaces` | A spec says what a screen must do and nobody can see it yet. Draws one low-fidelity panel per state the spec names, records every state it did not draw, and never decides colour, typeface, or spacing. "wireframe", "mockup", "draw the screen", "screen layout", "low fidelity". | ← after `writing-specs` §7; → `multi-persona-review`, though a simulated panel is not the operator whose objection it exists to invite. |
| `writing-plans` | A spec/requirements needs a step-by-step plan before any code. Orders the work **visible slice first** — for product/app/SaaS/web-app work Task 1 must put a clickable screen on the user's display (stubs allowed); genuinely backend-only work is exempt and says so. Each task carries a risk tier. An incoming decision record is **carried**: assignment rows become tasks, still-open risks become an Assumptions and risks block. Self-review runs Disney's three positions in sequence, and the Critic must return a finding. "write a plan", "plan this", "frontend first". | ← after `designing-test-cases`; ← `prioritizing-work` / `multi-persona-review`, both carried and never re-derived; → `executing-plans` / `subagent-driven-development`; → `multi-persona-review` when a plan is expensive enough to want independent reviewers rather than one author's three positions. |
| `writing-skills` | Creating, editing, or verifying a dstack skill. "write a skill", "improve this skill". | → `brainstorm` if the skill's shape is unclear. |
| `using-dstack` | Start of any task: find and route to the right skill. | → the matched skill. |

## Implementation discipline (rigid — do not adapt away)

| Skill | Use when | Hand off |
|---|---|---|
| `debugging` | A test failure, prod bug, unexpected behavior, perf regression, or build break whose cause is not obvious. "debug", "find the root cause", "stop guessing". | → `test-driven-development` once the cause is known (write the failing test, then fix). |
| `test-driven-development` | Implementing a new feature, fixing a bug, or refactoring with behavior change. **Decides how much discipline the change earned before applying any.** The full red-green cycle is mandatory only inside six risk tiers (money, authz/tenancy, data loss, computational core, bug fixes, consumed contracts); outside them it freezes the case list, implements, then tests from that list. Also owns the rule that a green suite is not evidence the product works. "do TDD", "test-first", "red-green-refactor", "does this need TDD". | ← after `debugging` (a bug fix is always inside a tier); → `running-uat` for user-visible work; → `verifying-before-done` before "done". |
| `verifying-before-done` | About to declare work complete, fixed, or passing — before commit/PR/"done", or after a subagent reports success. | Gate before `finishing-development-branch`. |
| `guarding-destructive-commands` | About to run a destructive/risky command (rm -rf, DROP TABLE, force-push, reset --hard, kubectl delete) or touch prod/shared infra. "be careful", "prod mode". | Use inline at the risky step; no successor. |

## Execution / orchestration

| Skill | Use when | Hand off |
|---|---|---|
| `executing-plans` | You have a written plan to execute in a separate session with review checkpoints. "execute plan", "run the plan". | → `verifying-before-done`, `finishing-development-branch`. |
| `subagent-driven-development` | Executing a plan's independent tasks in THIS session: fresh subagent per task + two-stage review (spec, then quality). "subagent-driven development". | Pairs with `requesting-code-review` between tasks. |
| `dispatching-parallel-agents` | 2+ INDEPENDENT problems (different root causes / subsystems), no shared state. "parallel agents", "fan out". | Each agent may use `debugging`/`test-driven-development`. |
| `using-git-worktrees` | Feature work needs isolation from the current workspace, or before executing a plan. "git worktree", "isolated workspace". | → execution skill inside the worktree. |
| `finishing-development-branch` | Implementation done, tests pass; decide merge / PR / keep / discard. "finish the branch", "wrap up", "merge or PR". | ← after `verifying-before-done`. |

## Review

| Skill | Use when | Hand off |
|---|---|---|
| `responding-to-review` | Handling code-review FEEDBACK: PR comments, inline threads. "respond to this review", "address these comments". Verify before implementing; push back when the reviewer is wrong. | — |
| `requesting-code-review` | DISPATCH a fresh-eyes review subagent after finishing work, before merge, or when stuck. "request review", "get this reviewed". | The reviewer's findings → `responding-to-review`. |

## Domain

| Skill | Use when | Hand off |
|---|---|---|
| `pdf-to-rag` | Converting PDF(s) into retrieval-ready (RAG) Markdown — scanned/OCR'd, image/flowchart, table-heavy, or Indonesian gov/legal docs (Permenhub, Inpres, Juknis, UU). "pdf to rag", "convert PDF", "prepare for RAG", OCR garble, scrambled tables. | → `verifying-before-done` before claiming RAG-ready. |
| `running-uat` | Acceptance-testing a RUNNING application against acceptance criteria from a stakeholder's point of view: entry gate (unit/e2e green, AC frozen), browser-driven execution, evidence rules that stop a false PASS, 3-attempt cap. "run UAT", "acceptance test", "make sure every acceptance criterion passes". NOT unit/e2e tests, and NOT a skill's own `uat/scenarios.md`. | ← after tests green; → `multi-persona-review` for independent per-view reports; → `finishing-development-branch`. |
| `multi-persona-review` | ONE artifact **or ONE digital-product review packet** reviewed from several points of view to surface more DISTINCT issues, then closed on a decision someone owns. Two modes. **General artifact**: mandatory Dreamer / Realist / Critic trio (Disney Creativity Strategy) dispatched blind and in parallel, at most two specialists on top, over **three capped iterations** wearing Six Thinking Hats — diverge, converge, conditional Go/No-Go. **Digital product**: one product class (transactional, internal operations, public information, dashboard, report, infographic) at one lifecycle gate (problem, concept, prototype usability, expert, pre-release, post-launch), coverage selected from 18 reusable perspectives across user / operational / expert **evidence layers**, findings as `PR-nnn` records with S0-S3 where **S3 blocks release regardless of score**. Findings reconciled by union, decisive claims verified against sources, ending in verdicts, a work-assignment table, and disagree-and-commit with a dissent register. "panel review", "cross review", "PoV senior data architect", "devil's advocate", "red team this", "digital product review", "review dashboard", "six thinking hats". **Boundaries:** raises coverage, NOT factual accuracy — accuracy comes from the verification pass, not more seats. **Never substitutes for user research**: an AI seat may analyse research, UAT, analytics or support evidence, never speak as a user; missing user evidence yields an evidence plan and `no verdict`, not a score. AI panel capped at 5 seats with **at most 2 perspectives per seat**; named human reviewers are evidence providers and are not capped. **Read-only** — returns a proposed v2 as text, never edits the reviewed source. | Uses `dispatching-parallel-agents` mechanics; ← `brainstorm` when no artifact exists yet; ← `running-uat` supplies running-system acceptance evidence for the packet; pairs with `requesting-code-review`; → `writing-plans` carries the assignment table; → `prioritizing-work` orders accepted findings. |
| `auditing-short-video` | A short-form video FILE (Reel/TikTok/Shorts, mp4/webm/mov) needs a structured audit plus a dataset the user keeps — per-video fact row, per-second/per-shot/OCR tables that concatenate across videos; or several audits merged into a corpus; or video measurements prepared for a warehouse / ML feature store. "analyze this video", "audit video", "why isn't this video performing", "hook analysis", "video dataset". Local files only — NOT a platform URL, and NOT judging a running app. | → `verifying-before-done` before claiming the audit is complete; → `multi-persona-review` if the video needs several expert points of view. |
| `literature-search` | Harvest bibliographic records from an academic database's web search for an SLR / bibliometric study — boolean concept-block query, year/type/subject/OA filters, export to RIS, PRISMA logging. Tested adapters: ScienceDirect, Taylor & Francis (Atypon), Springer (export-poor), ProQuest guest (scrape-not-export), Neliti (no operators); Emerald via the vendor template. "SLR search", "literature search", "export RIS", "boolean query", "harvest citations", "tandfonline", "ProQuest dissertations", "Neliti", "perpusnas e-resources". Not for an official query API — call the API. | → `literature-trends` (analyze) / `literature-fulltext` (OA PDFs). |
| `literature-trends` | Turn an exported RIS corpus (convert BibTeX to RIS first) into research-topic TRENDS + categories — dedup, categorize, per-year/per-topic bibliometrics, ranking, diagrams. Database-agnostic; year trends come from the per-year POPULATION counts, not the capped corpus. "trend analysis", "bibliometric", "topic categorization", "research trends". Draws charts via `/dataviz`. | ← after `literature-search`; → `literature-fulltext`. |
| `literature-fulltext` | Download OPEN-ACCESS full-text PDFs for a corpus — Unpaywall by DOI, plus the no-DOI paths (ProQuest dissertations via the browser, Neliti self-hosted PDFs). OA-only (no paywall bypass), rate-limited, license manifest. "download OA PDF", "download articles", "unpaywall", "open access download", "ProQuest full text". | ← after `literature-search`/`literature-trends`. |

## Utility

| Skill | Use when | Hand off |
|---|---|---|
| `managing-version` | Read or bump the VERSION file. "show version", "bump version", "release X.Y.Z". | — |
| `classify-issue` | Classify a pasted bug/feature/chore into a triage record. "triage this", "classify this issue". | — |
| `learning-from-sessions` | Turning PAST session transcripts (`~/.claude/projects`) into durable improvements — mine transcripts for recurring corrections, repeated tool errors, refused actions and rework, then route each recurring pattern to ONE home: a repo rule, a skill edit, or a memory entry. "weekly retro", "lessons learned", "evaluate how Claude is being used", "lessons from the last session". Exit condition is a diff, never a report. | → `writing-skills` when a lesson needs a new skill; run before adding one, since history says whether the gap is real. |

## Common chains

- **New feature / creative change:** `discovering-requirements` (problem, goal,
  and constraints not yet written; `brainstorm` alongside it when the idea
  itself is in doubt) → `writing-specs` →
  `designing-test-cases` → `writing-plans` (visible slice first) →
  (`using-git-worktrees`) → `subagent-driven-development` *or* `executing-plans`
  → `running-uat` (anything with a screen) → `verifying-before-done` →
  `requesting-code-review` → `finishing-development-branch`.
- **Bug:** `debugging` (root cause) → `test-driven-development` (a bug fix is
  always inside a risk tier: failing test → minimal fix) →
  `verifying-before-done`.
- **Authoring a skill:** `writing-skills` (+ `brainstorm` if the shape is fuzzy).
- **Literature review:** `literature-search` (harvest → RIS) → `literature-trends`
  (dedup + topic trends + diagrams) → `literature-fulltext` (open-access PDFs).
- **Modelling a system:** `discovering-requirements` (its actor table feeds both
  models) → `modelling-system-behaviour` (use cases, then a sequence per
  scenario where the ordering is in doubt) → `modelling-business-processes`
  (each operational flow as a `.bpmn`) → `writing-specs`, which references the
  models rather than restating them.
- **Any time:** `guarding-destructive-commands` before a destructive command; `verifying-before-done` before
  claiming done.

## When several apply

1. Process skills first (`brainstorm`, `debugging`) — they decide the approach.
2. Implementation skills second.
3. CLAUDE.md / direct user instruction always overrides a skill.

## Claude Code features (not dstack skills)

For Claude Code's own built-in features (`/compact`, `/agents`, plan mode,
hooks, MCP, effort/model, headless), use `/help` and `/release-notes`, or see
Claude Code's documentation at code.claude.com/docs.
