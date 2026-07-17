# dstack skill catalog — full routing reference

Read this when: the inline table in `SKILL.md` is not an obvious match; two
skills seem to apply and you must choose; you need a skill's exact triggers or
scope; or you need to know which skill to hand off to next.

Invoke a skill with the `Skill` tool (`/<name>`). Process skills decide *how* to
approach a task and come first; implementation skills execute.

## Process / meta

| Skill | Use when | Hand off |
|---|---|---|
| `brainstorm` | An ambiguous plan/design/idea needs alignment before building. "brainstorm", "grill me", "stress test", "interview me". | → `writing-plans` once aligned. |
| `writing-plans` | A spec/requirements needs a step-by-step plan before any code. "write a plan", "plan this". | ← after `brainstorm`; → `executing-plans` / `subagent-driven-development`. |
| `writing-skills` | Creating, editing, or verifying a dstack skill. "write a skill", "improve this skill". | → `brainstorm` if the skill's shape is unclear. |
| `using-dstack` | Start of any task: find and route to the right skill. | → the matched skill. |

## Implementation discipline (rigid — do not adapt away)

| Skill | Use when | Hand off |
|---|---|---|
| `debugging` | A test failure, prod bug, unexpected behavior, perf regression, or build break whose cause is not obvious. "debug", "find the root cause", "stop guessing". | → `tdd` once the cause is known (write the failing test, then fix). |
| `tdd` | Implementing a new feature, fixing a bug, or refactoring with behavior change. "do TDD", "test-first", "red-green-refactor". | ← after `debugging`; → `verification` before "done". |
| `verification` | About to declare work complete, fixed, or passing — before commit/PR/"done", or after a subagent reports success. | Gate before `finishing-a-development-branch`. |
| `careful` | About to run a destructive/risky command (rm -rf, DROP TABLE, force-push, reset --hard, kubectl delete) or touch prod/shared infra. "be careful", "prod mode". | Use inline at the risky step; no successor. |

## Execution / orchestration

| Skill | Use when | Hand off |
|---|---|---|
| `executing-plans` | You have a written plan to execute in a separate session with review checkpoints. "execute plan", "run the plan". | → `verification`, `finishing-a-development-branch`. |
| `subagent-driven-development` | Executing a plan's independent tasks in THIS session: fresh subagent per task + two-stage review (spec, then quality). "subagent-driven development". | Pairs with `requesting-code-review` between tasks. |
| `dispatching-parallel-agents` | 2+ INDEPENDENT problems (different root causes / subsystems), no shared state. "parallel agents", "fan out". | Each agent may use `debugging`/`tdd`. |
| `using-git-worktrees` | Feature work needs isolation from the current workspace, or before executing a plan. "git worktree", "isolated workspace". | → execution skill inside the worktree. |
| `finishing-a-development-branch` | Implementation done, tests pass; decide merge / PR / keep / discard. "finish the branch", "wrap up", "merge or PR". | ← after `verification`. |

## Review

| Skill | Use when | Hand off |
|---|---|---|
| `code-review` | Handling code-review FEEDBACK: PR comments, inline threads. "respond to this review", "address these comments". Verify before implementing; push back when the reviewer is wrong. | — |
| `requesting-code-review` | DISPATCH a fresh-eyes review subagent after finishing work, before merge, or when stuck. "request review", "get this reviewed". | The reviewer's findings → `code-review`. |

## Domain

| Skill | Use when | Hand off |
|---|---|---|
| `data-catalog` | Inventory/profile many source apps or DBs into a data dictionary (kamus data) + IN/OUT scope, or conform a medallion schema across sources (3NF silver, dimensional gold). "data catalog", "kamus data", "silver schema", "inventory and classify tables", "medallion architecture". Not for one small DB — read it directly. | → `dispatching-parallel-agents` for the fan-out; `verification` per returned catalog. |
| `pdf-to-rag-markdown` | Converting PDF(s) into retrieval-ready (RAG) Markdown — scanned/OCR'd, image/flowchart (bagan alur), table-heavy, or Indonesian gov/legal docs (Permenhub, Inpres, Juknis, UU). "pdf to rag", "konversi PDF", "siapkan untuk RAG", OCR garble, scrambled tables. | → `verification` before claiming RAG-ready. |
| `literature-search` | Harvest bibliographic records from an academic database's web search (ScienceDirect primary; Emerald/Springer via adapters) for an SLR / bibliometric study — boolean concept-block query, year/type/subject/OA filters, export to RIS, PRISMA logging. "SLR search", "cari literatur", "export RIS", "boolean query", "harvest citations". Not for an official query API — call the API. | → `literature-trends` (analyze) / `literature-fulltext` (OA PDFs). |
| `literature-trends` | Turn an exported RIS/BibTeX corpus into research-topic TRENDS + categories — dedup, categorize, per-year/per-topic bibliometrics, ranking, diagrams. "analisis tren", "bibliometric", "kelompokan topik", "research trends", "peta tren". Draws charts via `/dataviz`. | ← after `literature-search`; → `literature-fulltext`. |
| `literature-fulltext` | Download OPEN-ACCESS full-text PDFs for a corpus via Unpaywall — OA-only (no paywall bypass), rate-limited, license manifest. "download OA PDF", "unduh artikel", "unpaywall", "open access download". | ← after `literature-search`/`literature-trends`. |

## Utility

| Skill | Use when | Hand off |
|---|---|---|
| `version` | Read or bump the VERSION file. "show version", "bump version", "release X.Y.Z". | — |
| `classify-issue` | Classify a pasted bug/feature/chore into a triage record. "triage this", "classify this issue". | — |

## Common chains

- **New feature / creative change:** `brainstorm` → `writing-plans` →
  (`using-git-worktrees`) → `subagent-driven-development` *or* `executing-plans`
  → `verification` → `requesting-code-review` → `finishing-a-development-branch`.
- **Bug:** `debugging` (root cause) → `tdd` (failing test → minimal fix) →
  `verification`.
- **Authoring a skill:** `writing-skills` (+ `brainstorm` if the shape is fuzzy).
- **Literature review:** `literature-search` (harvest → RIS) → `literature-trends`
  (dedup + topic trends + diagrams) → `literature-fulltext` (open-access PDFs).
- **Any time:** `careful` before a destructive command; `verification` before
  claiming done.

## When several apply

1. Process skills first (`brainstorm`, `debugging`) — they decide the approach.
2. Implementation skills second.
3. CLAUDE.md / direct user instruction always overrides a skill.

## Claude Code features (not dstack skills)

For Claude Code's own built-in features (`/compact`, `/agents`, plan mode,
hooks, MCP, effort/model, headless), use `/help` and `/release-notes`, or see
Claude Code's documentation at code.claude.com/docs.
