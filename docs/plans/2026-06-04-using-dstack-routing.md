# using-dstack routing + catalog-awareness implementation plan

**Goal:** Make `using-dstack` route to the right skill — a compact inline
dispatch table for the common cases, a bundled `references/skill-catalog.md`
for full triggers and "when to hand off to another skill", a minimal `eval/`
that tests routing, and a tightened, cross-linked `claude-code-productivity.md`.

**Architecture:** Progressive disclosure. The SKILL.md body stays lean (under
its 1800-token budget) and carries only the high-frequency router plus explicit
"open the reference WHEN…" signposting so a cheap model knows the right moment
to read more. The full per-skill detail and chains live in a bundled
`references/` file that loads on demand at zero body cost (ADR-0016/0017).

**Stack:** Markdown skills on the dstack renderer (Bun/TypeScript). Verification
gates are `bun run validate` (schema + token budget) and `bun run build --strict`
(render, fail on warning), plus a subagent routing check for the eval cases.
Classic unit-test TDD does not apply to markdown skills; these gates are the
dstack analog of red-green.

Implement task by task. Run the verification command in each task and read its
output before checking the box (`/verification` discipline). Request a review at
the end with `/requesting-code-review`. Steps use `- [ ]` checkboxes.

**Decisions carried in from `/brainstorm` (2026-06-04):**
- Routing home: **hybrid** — top routes inline + full catalog in `references/`,
  with clear "read the reference WHEN…" pointers.
- Doc: **tighten + de-dupe + cross-link**; keep it a standalone CC feature
  reference (~450 lines).
- Scope: **plan → approve → execute this session**, including a minimal `eval/`.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `skills/using-dstack/references/skill-catalog.md` | Create | Full 18-skill catalog: triggers, type, and "call the OTHER skill when…" + chains |
| `skills/using-dstack/SKILL.md` | Modify | Add inline dispatch table + common chains + "read reference WHEN…" pointer + bundled-files footer; frontmatter trigger tweak; version bump + Changes entry |
| `skills/using-dstack/eval/cases.jsonl` | Create | 5 routing behavioral cases |
| `docs/claude-code-productivity.md` | Modify | Add two-way cross-link; shrink the Skills/Extensibility overlap; light tighten |

Ordered so the reference exists before SKILL.md points to it.

---

## Task 1: Create the bundled skill catalog

**Files:**
- Create: `skills/using-dstack/references/skill-catalog.md`

- [ ] **Step 1 — write the catalog file**

Content (final; one section per category, plus chains + hand-off rules):

```markdown
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
- **Any time:** `careful` before a destructive command; `verification` before
  claiming done.

## When several apply

1. Process skills first (`brainstorm`, `debugging`) — they decide the approach.
2. Implementation skills second.
3. CLAUDE.md / direct user instruction always overrides a skill.

## Claude Code features (not dstack skills)

For Claude Code's own built-in features (`/compact`, `/agents`, plan mode,
hooks, MCP, effort/model, headless) and when to use them, see
`docs/claude-code-productivity.md`.
```

- [ ] **Step 2 — verify it renders and is discoverable as a bundled file**

Run: `bun run build --strict`
Expected: PASS, no warnings; the file is treated as a bundled resource (not a
second skill).

- [ ] **Step 3 — commit**

`feat(using-dstack): add bundled skill-catalog routing reference`

---

## Task 2: Add the inline router to SKILL.md

**Files:**
- Modify: `skills/using-dstack/SKILL.md`

- [ ] **Step 1 — insert a "Which skill" section after "The rule" (before "Red flags")**

```markdown
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
| Bug / test failure / unexpected behavior | `/debugging` (then `/tdd`) |
| New feature, bugfix, behavior change | `/tdd` |
| About to claim done / fixed / passing | `/verification` |
| Destructive or risky command, or prod | `/careful` |
| Need an isolated workspace | `/using-git-worktrees` |
| Work done — merge / PR / keep / discard | `/finishing-a-development-branch` |
| Got PR or review feedback to address | `/code-review` |
| Want a fresh review of your own work | `/requesting-code-review` |
| Create / edit / verify a dstack skill | `/writing-skills` |
| Show or bump VERSION | `/version` |
| Triage / classify a pasted issue | `/classify-issue` |

**Common chains:**
- Feature: `/brainstorm` → `/writing-plans` → `/subagent-driven-development`
  (or `/executing-plans`) → `/verification` → `/finishing-a-development-branch`.
- Bug: `/debugging` → `/tdd` → `/verification`.

### When to open the full catalog

Read `references/skill-catalog.md` when **any** of these is true — it carries the
exact triggers, each skill's scope, and which skill to hand off to next:
- the table above is not an obvious match for the request;
- two skills seem to apply and you must choose one;
- you need a skill's precise triggers or boundaries before committing;
- you need the next step in a chain (what to invoke after the current skill).

For Claude Code's built-in features (not dstack skills) — `/compact`, `/agents`,
plan mode, hooks, MCP, effort/model — see `docs/claude-code-productivity.md`.
```

- [ ] **Step 2 — add a bundled-files footer before "## Changes"**

```markdown
## Bundled files

- `references/skill-catalog.md` — full 18-skill catalog: triggers, scope, and
  hand-off rules. Loads on demand; read it per the conditions above.
```

- [ ] **Step 3 — frontmatter: add triggers and bump version**

Modify the `triggers:` list to add (keep existing three):
```yaml
      - which skill should I use
      - route to the right skill
      - when to call which skill
```
Change `version: 0.1.0` → `version: 0.2.0`.

- [ ] **Step 4 — add a Changes entry at the top of "## Changes"**

```markdown
- **0.2.0** — Added an inline "Which skill" router (situation → skill) and
  common chains, an explicit "when to open the full catalog" gate, and a bundled
  `references/skill-catalog.md` with per-skill triggers and hand-off rules.
  Added `eval/cases.jsonl` for routing. Body stays within budget; detail is
  progressive-disclosure per ADR-0016/0017.
```

- [ ] **Step 5 — verify token budget and render**

Run: `bun run validate && bun run list 2>&1 | grep using-dstack`
Expected: validate PASS; `using-dstack` tokens **< 1800**. If it reports over
budget, raise `context_budget_tokens` to `2500` (still far under the 5000 hard
max) and re-run.

- [ ] **Step 6 — commit**

`feat(using-dstack): add inline skill router and catalog pointer (v0.2.0)`

---

## Task 3: Add a routing eval

**Files:**
- Create: `skills/using-dstack/eval/cases.jsonl`

- [ ] **Step 1 — write 5 routing cases (one JSON object per line)**

```jsonl
{"prompt": "The login test started failing right after my last commit and I don't know why. Just tell me what line to change.", "anti_pattern": "Proposing a fix without invoking /debugging to find the root cause first."}
{"prompt": "Let's build a new in-app notifications feature.", "anti_pattern": "Writing code or a plan without first invoking /brainstorm to align on the ambiguous design."}
{"prompt": "Quick one — rename this variable and force-push to main. Trivial, no need to overthink it.", "anti_pattern": "Treating it as too simple for any skill; skipping the skill check and not invoking /careful before the force-push."}
{"prompt": "I want to add a new skill to dstack for triaging support tickets.", "anti_pattern": "Hand-writing a SKILL.md instead of invoking /writing-skills to get the format, description rules, and budget right."}
{"prompt": "My branch is done and tests pass — which skill gets it merged?", "anti_pattern": "Answering from memory instead of routing to /finishing-a-development-branch, and not consulting the catalog when unsure."}
```

- [ ] **Step 2 — confirm format matches the catalog convention**

Run: `bun run validate`
Expected: PASS (eval files are not schema-gated, but validate must still pass
overall).

- [ ] **Step 3 — commit**

`test(using-dstack): add routing eval cases`

---

## Task 4: Behavioral routing check (subagent)

No files. This is the `writing-skills` "test the skill before trusting it" step.

- [ ] **Step 1 — dispatch a subagent on 2 eval prompts WITH `using-dstack` loaded**

Use the `Agent` tool. For prompt #1 (failing test) and prompt #3 (force-push),
confirm the agent announces and routes to `/debugging` and `/careful`
respectively, rather than answering directly.

- [ ] **Step 2 — record the result inline**

Expected: both route correctly. If either fails, add a counter line to the
router (e.g., strengthen the "trivial → still check" wording in Red flags) and
re-run that case. Note the outcome in the commit body.

- [ ] **Step 3 — commit only if the router changed**

`fix(using-dstack): tighten router after routing eval` (skip if no change).

---

## Task 5: Tighten and cross-link the productivity doc

**Files:**
- Modify: `docs/claude-code-productivity.md`

- [ ] **Step 1 — add a "Related" line after the intro bullets (around line 16)**

```markdown
> **Related:** this doc covers Claude Code's built-in features. For the dstack
> project's own skills (the catalog in `skills/`) and when to invoke each, see
> `skills/using-dstack/SKILL.md` and its `references/skill-catalog.md`.
```

- [ ] **Step 2 — shrink the §6 "Skills" entry overlap**

In §6 Extensibility, keep the Claude Code skill *mechanics* (SKILL.md,
frontmatter, substitution) but replace the parenthetical
`(This dstack repo is itself a skill catalog.)` with a pointer:
`For dstack's own catalog and routing, see `using-dstack`.` Remove any sentence
that re-explains routing (that now lives in the catalog).

- [ ] **Step 3 — light de-dupe pass**

Confirm `/context` is described once in §1 and only referenced (not re-explained)
in §9 (already the case — verify). Remove any other duplicated explanation found.
Target: stays ~450 lines; no section deleted.

- [ ] **Step 4 — verify the doc still reads clean**

Run: `wc -l docs/claude-code-productivity.md`
Expected: ~440–460 lines; cross-links resolve to real paths.

- [ ] **Step 5 — commit**

`docs: cross-link productivity guide with using-dstack; de-dupe skill overlap`

---

## Task 6: Final verification and review

- [ ] **Step 1 — full validate + strict build**

Run: `bun run validate && bun run build --strict`
Expected: both PASS, no warnings.

- [ ] **Step 2 — confirm catalog budget headroom**

Run: `bun run list 2>&1 | grep using-dstack`
Expected: `using-dstack` tokens under its budget (1800, or 2500 if raised in
Task 2 Step 5).

- [ ] **Step 3 — request review**

Invoke `/requesting-code-review` on the diff (SKILL.md, references, eval, doc).

- [ ] **Step 4 — final commit if review surfaces fixes**

---

## Self-review against scope

- **Routing inline + reference, with "when to read" gate** → Tasks 2 (inline +
  gate) and 1 (reference). ✓
- **"When to call which skill" (chains + hand-off)** → catalog "Hand off"
  column + "Common chains" (Tasks 1, 2). ✓
- **Doc tighten + de-dupe + cross-link** → Task 5. ✓
- **Minimal eval** → Tasks 3–4. ✓
- **Budget safety** → Task 2 Step 5 checks tokens; contingency to raise to 2500. ✓
- **No placeholders** → catalog, router table, eval cases, and doc edits are all
  spelled out verbatim above. ✓
```

