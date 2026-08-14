# Invocation census — 2026-08-14

Stage 1 of the [skill ablation procedure](../procedures/skill-ablation.md), run
across the whole catalog rather than one skill at a time. This is the input to
Tasks 10–12 of `docs/plans/2026-08-14-unhobbling-skill-catalog.md`.

## Method

Counted real `Skill` tool invocations in the transcript store:

```bash
grep -rhoP '"name":"Skill","input":\{"skill":"<id>"' ~/.claude/projects --include='*.jsonl' | wc -l
```

**A naive `grep -rl <skill-id>` is wrong here** and was the first thing tried:
it returned 1189 of 1600 transcripts for `verifying-before-done`, because the
skill catalog is injected into the system prompt of every session. Mentions are
not invocations. The corrected figure is 7.

Store: 64 project directories, 1600 transcript files.

## Result

| Skill | Calls | Sessions | Band |
|---|---|---|---|
| multi-persona-review | 30 | 29 | workflow |
| writing-plans | 27 | 25 | workflow |
| using-dstack | 18 | 17 | schema-meta |
| running-uat | 17 | 16 | **deterministic-dominant** |
| literature-search | 14 | 12 | workflow |
| designing-test-cases | 13 | 13 | **deterministic-dominant** |
| test-driven-development | 12 | 12 | workflow |
| writing-specs | 11 | 11 | **deterministic-dominant** |
| writing-skills | 11 | 11 | workflow |
| executing-plans | 11 | 11 | workflow |
| discovering-requirements | 8 | 8 | **deterministic-dominant** |
| verifying-before-done | 7 | 7 | **deterministic-dominant** |
| debugging | 7 | 7 | workflow |
| using-git-worktrees | 6 | 6 | **deterministic-dominant** |
| requesting-code-review | 6 | 6 | workflow |
| guarding-destructive-commands | 6 | 6 | **deterministic-dominant** |
| brainstorm | 6 | 5 | judgment-dominant |
| wireframing-interfaces | 4 | 4 | **deterministic-dominant** |
| subagent-driven-development | 4 | 4 | workflow |
| prioritizing-work | 4 | 4 | **deterministic-dominant** |
| finishing-development-branch | 3 | 3 | **deterministic-dominant** |
| diagramming-architecture | 3 | 3 | **deterministic-dominant** |
| responding-to-review | 2 | 2 | workflow |
| literature-trends | 2 | 2 | workflow |
| literature-fulltext | 2 | 2 | workflow |
| learning-from-sessions | 1 | 1 | workflow |
| auditing-short-video | 1 | 1 | workflow |
| **pdf-to-rag** | **0** | 0 | workflow |
| **modelling-system-behaviour** | **0** | 0 | **deterministic-dominant** |
| **modelling-business-processes** | **0** | 0 | **deterministic-dominant** |
| **managing-version** | **0** | 0 | workflow |
| **dispatching-parallel-agents** | **0** | 0 | workflow |
| **classify-issue** | **0** | 0 | schema-meta |

## Findings

### 1. Six skills have never been invoked

`pdf-to-rag`, `modelling-system-behaviour`, `modelling-business-processes`,
`managing-version`, `dispatching-parallel-agents`, `classify-issue`.

`pdf-to-rag` is the notable one: its own `## Changes` records field tests on a
279-page benchmark and two multi-lens audits, so the work was clearly done —
just not through the `Skill` tool. Its zero is a **measurement limit**, not
evidence of disuse, and the same may hold for others. This census counts one
specific invocation path.

### 2. Two `deterministic-dominant` skills cannot be ablated at all

`modelling-system-behaviour` and `modelling-business-processes` carry the
catalog's heaviest rails and have zero recorded invocations. Per the ablation
procedure §1, three real tasks do not exist, so the run stops here — and that
is the result. Their rails were set by written rationale under ADR-0025's
asymmetry and have never been tested against anything.

This does not mean the rails are wrong. BPMN and UML both have externally fixed
notations, which is a genuine narrow-bridge argument. It means the band was
never earned by evidence, and under ADR-0030 §5 it cannot now be defended by
argument alone either.

### 3. Eleven of the thirteen `deterministic-dominant` skills are ablatable

All except the two above clear the three-task bar.
`finishing-development-branch` and `diagramming-architecture` sit exactly on it
at 3, so a single unusable transcript drops them below.

### 4. Invocation count does not track band

The most-invoked skill in the catalog (`multi-persona-review`, 30) is
`workflow`. The single `judgment-dominant` skill (`brainstorm`) sits at 6. The
catalog's rails were not placed where the traffic is.

## What this census is not

It is not a usage measure of the *underlying work* — only of the `Skill`
invocation path, as finding 1 shows. It says nothing about whether any skill's
rails help, which is stages 2–4 of the procedure and needs paired runs.
