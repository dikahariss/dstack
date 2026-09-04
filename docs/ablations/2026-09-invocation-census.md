# Invocation census — 2026-09-04

Task 0 of `docs/plans/2026-09-04-model-aligned-skill-catalog.md`. The
successor to the 2026-08-14 census; the numbers differ because the store
forgets.

## The store is a rolling window

`~/.claude/projects` held 2,752 transcript files on 2026-09-04, dated
**2026-08-04 → 2026-09-04**. `cleanupPeriodDays` was unset (default 30).
A skill's ablation eligibility under `docs/procedures/skill-ablation.md` §1
is therefore a property of the month, not the skill: `verifying-before-done`
counted 7 on 2026-08-14 and 1 today with no change in how it is used.

Two actions taken on 2026-09-04 so the window stops withdrawing the right
to measure: `cleanupPeriodDays` set to 90 in `~/.claude/settings.json`, and
the raw `Skill` invocation lines archived to
`~/.claude/dstack-census/2026-09.txt` (outside the repo — it is the owner's
prompt text). Re-run the archive monthly.

## Method

```bash
grep -rhoP '"name":"Skill","input":\{"skill":"[^"]+"' ~/.claude/projects --include='*.jsonl' \
  | sed -E 's/.*"skill":"([^"]+)"/\1/' | sort | uniq -c | sort -rn
```

Counts one path only — the `Skill` tool call — so a skill's underlying work
done without the tool is invisible here (the August census's finding 1
still holds). Subagent transcripts are included; the August census excluded
two subagent transcripts by hand for `verifying-before-done`.

## Result — dstack skills, this window

| Skill | Calls | Aug-14 | Band |
|---|---|---|---|
| using-dstack | 24 | 18 | schema-meta |
| writing-plans | 23 | 27 | workflow |
| multi-persona-review | 23 | 30 | workflow |
| running-uat | 15 | 17 | deterministic-dominant |
| executing-plans | 12 | 11 | workflow |
| prioritizing-work | 11 | 4 | deterministic-dominant |
| researching-facts | 10 | — (new 08-26) | workflow |
| discovering-requirements | 9 | 8 | deterministic-dominant |
| debugging | 7 | 7 | workflow |
| writing-specs | 6 | 11 | workflow |
| test-driven-development | 6 | 12 | workflow |
| writing-skills | 5 | 11 | workflow |
| finishing-development-branch | 5 | 3 | deterministic-dominant |
| requesting-code-review | 4 | 6 | workflow |
| guarding-destructive-commands | 4 | 6 | deterministic-dominant |
| diagramming-architecture | 4 | 3 | deterministic-dominant |
| using-git-worktrees | 3 | 6 | deterministic-dominant |
| pdf-to-rag | 3 | 0 | workflow |
| designing-test-cases | 3 | 13 | deterministic-dominant |
| subagent-driven-development | 2 | 4 | workflow |
| responding-to-review | 2 | 2 | workflow |
| auditing-video (as `auditing-short-video`) | 2 | 1 | workflow |
| wireframing-interfaces | 1 | 4 | deterministic-dominant |
| verifying-before-done | 1 | 7 | judgment-dominant |
| modelling-system-behaviour | 1 | 0 | deterministic-dominant |
| literature-trends | 1 | 2 | workflow |
| literature-search | 1 | 14 | workflow |
| literature-fulltext | 1 | 2 | workflow |
| brainstorm | 1 | 6 | judgment-dominant |
| **classify-issue** | **0** | 0 | schema-meta |
| **dispatching-parallel-agents** | **0** | 0 | workflow |
| **managing-version** | **0** | 0 | — |
| **modelling-business-processes** | **0** | 0 | deterministic-dominant |
| **learning-from-sessions** | **0** | 1 | workflow |
| **generating-images** | **0** | — (new 08-29) | workflow |
| **reverse-engineering-video** | **0** | — (new 08-30) | workflow |

Non-dstack skills seen in the same window, for scale: `artifact-design` 17,
`claude-in-chrome` 14, `claude-api` 3, `run` 2, `pptx` 1, `init` 1,
`deep-audit` 1, `dataviz` 1.

**Other hosts.** `~/.codex/history.jsonl` holds 4 `using-dstack`
invocations; `~/.gemini/` keeps no comparable invocation log (Antigravity
profiles only). Both hosts read `skills/` by live symlink.

## Model mix — transcript files naming each model

| Model | Files |
|---|---|
| `claude-opus-5` | 2,347 |
| `claude-sonnet-5` | 111 |
| `claude-haiku` (subagents) | 34 |
| `claude-fable-5-1` | 27 |
| `claude-opus-4` | 1 |

This is the owner's stated usage — Opus 5 daily, Sonnet 5 light, Fable 5.1
occasional — measured.

## The Sonnet 5 spot-check list (ADR-0031 §4)

Skills invoked inside the 111 Sonnet 5 session files:

| Skill | Calls |
|---|---|
| using-dstack, test-driven-development, running-uat, requesting-code-review, executing-plans | 3 each |
| writing-plans, subagent-driven-development, prioritizing-work, multi-persona-review | 2 each |
| writing-specs, verifying-before-done, using-git-worktrees, discovering-requirements, debugging | 1 each |

Light work on Sonnet 5 is, in practice, the plan-execution chain
(`executing-plans`, `test-driven-development`, `requesting-code-review`,
`running-uat`). An ablation of any of those re-runs one of its three tasks
on Sonnet 5.

## Eligibility for Task 12 today (three-task bar)

Clear it: `running-uat` 15, `executing-plans` 12, `prioritizing-work` 11,
`discovering-requirements` 9, `debugging` 7, `writing-specs` 6,
`test-driven-development` 6, `requesting-code-review` 4,
`diagramming-architecture` 4, `designing-test-cases` 3 (exactly at the bar),
`using-git-worktrees` 3.

Frozen this window: `subagent-driven-development` 2,
`wireframing-interfaces` 1, `verifying-before-done` 1 (its 2026-08 record
preserves T1–T3 and the free version, so it can be re-run from the record),
and every 0-invocation skill.

## The keep / merge question — recorded, not decided

**Skills at 0 invocations this window (7):** `classify-issue`,
`dispatching-parallel-agents`, `managing-version`,
`modelling-business-processes`, `learning-from-sessions`,
`generating-images`, `reverse-engineering-video`. Two of these were created
in the last week of the window and one (`generating-images`) was field-tested
outside the `Skill` path, so the zero is a measurement limit for them.

**Method-only skills (no `scripts/`, no `references/`) — 11:** `brainstorm`,
`classify-issue`, `debugging`, `dispatching-parallel-agents`,
`executing-plans`, `finishing-development-branch`,
`guarding-destructive-commands`, `requesting-code-review`,
`using-git-worktrees`, `verifying-before-done`, `writing-skills`.

**Merge candidates named by the 2026-09-04 panel review:**
`executing-plans` + `subagent-driven-development` (two ways to execute one
plan, adjacent router rows); `requesting-code-review` +
`responding-to-review`; `dispatching-parallel-agents` folded into
`subagent-driven-development`; `verifying-before-done` collapsed to its
judgment paragraph and its post-subagent rule.

**Decision owner:** Haris. **Trigger:** a skill at 0 invocations across two
consecutive 30-day windows is a merge or retire candidate. Not executed by
the 2026-09-04 plan.

## Router recall check — Task 3 (A3), 2026-09-04

Ten `eval/cases.jsonl` prompts, each run as a fresh Opus 5 agent reading a
frozen copy of the rendered `using-dstack` body and naming the first skill it
would invoke — once against 0.23.1 (boosters present) and once against 0.24.0
(boosters and the rationalization table removed).

| case | request (short) | before (0.23.1) | after (0.24.0) |
|---|---|---|---|
| 1 | failing login test, "just tell me the line" | `/debugging` | `/debugging` |
| 2 | "build a new notifications feature" | `/discovering-requirements` | `/discovering-requirements` |
| 3 | rename + force-push to main, "trivial" | `/guarding-destructive-commands` | `/guarding-destructive-commands` |
| 4 | scanned regulation PDF → RAG | `/pdf-to-rag` | `/pdf-to-rag` |
| 5 | branch done, tests pass, merge? | `/finishing-development-branch` | `/finishing-development-branch` |
| 6 | (id) review a schema from several viewpoints | `/multi-persona-review` | `/multi-persona-review` |
| 7 | running app + acceptance criteria | `/running-uat` | `/running-uat` |
| 8 | yesterday's plan, continue | `/executing-plans` | `/executing-plans` |
| 9 | what does `git rebase --onto` do (negative) | no skill | no skill |
| 10 | rename in three files, run tests (negative) | `/verifying-before-done` | `/verifying-before-done` |

10 of 10 identical. Case 3 is the one the edit could have hurt — the
"before" probe cited the removed rationalization table as its reason; the
"after" probe routed the same way from the router row alone. Case 10 is a
soft over-trigger in both versions: the "About to claim done / fixed /
passing" row pulls `verifying-before-done` up front for a mechanical rename;
it is not caused by the boosters and is left for the ≥14-day census
comparison. Both case-2 probes independently reported that the router's
"Priority when several apply" example ("Let's build X" → `/brainstorm`)
contradicted its own table and chain; fixed in 0.24.0.

Re-run the census on or after 2026-09-18 and compare calls per active
session day for skills with ≥15 baseline calls (`using-dstack` 24,
`writing-plans` 23, `multi-persona-review` 23, `running-uat` 15).
