# Ablation — `verifying-before-done`

Task 10 of `docs/plans/2026-08-14-unhobbling-skill-catalog.md`, following
[the procedure](../procedures/skill-ablation.md).

**Status: prepared, not run.** Stages 1 and 2 are complete below. Stage 3
needs six real sessions (three tasks × two versions) and its tables are empty
on purpose. Filling them from analysis rather than runs would destroy the only
thing this document is for.

## Why this skill first

It is the one genuine model-dependent conflict in the catalog. Anthropic's
Opus 5 prompting guide says, of instructions of exactly this shape:

> If your prompt contains explicit verification instructions … **remove them**:
> instructions like these cause over-verification on Claude Opus 5, and
> removing them reduces wasted tokens with no loss in quality.

The Sonnet 5 guide says no such thing. Sonnet 5 is the daily driver. So the
question is live, and it cannot be settled by reading either document.

## Stage 1 — model and tasks

**Model under test:** Sonnet 5, at the effort used day to day. Not `max`: a
rail that only earns its place at maximum effort is not earning it in practice.

Real invocations found: **7** (≥3 bar cleared). Two were subagent transcripts
and are excluded per the procedure. Three of the remaining five were chosen for
genuinely different claim shapes — a test-suite claim, a plan-completeness
claim, and a "you can open it" claim. A single shape would only prove the
skill works on that shape.

| # | Session | Project | The task, as the user put it | Claim shape |
|---|---|---|---|---|
| T1 | `19ad64f1` | dstack | "sudah lakukan build dan testing untuk 3 skill yg baru kita buat ini" | Test suite green |
| T2 | `df54b54d` | maritimhub | "lakukan cek apakah semua yg ada di plan …" | Plan complete |
| T3 | `32e54100` | WORKSPACE-MH | "buat sample di local … supaya saya bisa buka halamannya" | It runs and is reachable |

Transcripts live under `~/.claude/projects`. Locate one with:

```bash
grep -rl '"skill":"verifying-before-done"' ~/.claude/projects --include='*.jsonl'
```

## Stage 2 — the two versions

**Railed:** `skills/verifying-before-done/SKILL.md` at `5b23b94` — the iron
law, the six-item trigger list, the five-step gate, the claim→evidence table,
the default gate, the red flags, the defused excuses, and the response
templates.

**Free:** the text below and nothing else. Note it is *not* empty — deleting
the skill would test discovery and routing, which is a different question.

```markdown
Goal
Never state that work is complete, fixed, passing, or working unless evidence
produced in this same turn supports it.

Guardrails
- Evidence from an earlier turn is stale: the code, the environment, or the
  dependencies may have changed since.
- A subagent reporting success is not evidence. Check the artifact yourself.
- Partial evidence is not evidence for a whole claim.

Exit criteria
A completion claim names the command that was run, its exit code, and what the
output actually showed — counts, status, or the observed state. A claim that
cannot name those three is not made; report the real status instead.
```

## Stage 3 — results

Both columns get filled for every task. **A run whose second column is empty
in all three rows is a signal the free version was written too thin, not that
the rails won** — rewrite it and run again before believing that result.

### T1 — test suite green (`19ad64f1`)

| Railed caught, free missed | Free reached, railed never did |
|---|---|
| _(not run)_ | _(not run)_ |

Tokens / tool calls — railed: _(not run)_ · free: _(not run)_

### T2 — plan complete (`df54b54d`)

| Railed caught, free missed | Free reached, railed never did |
|---|---|
| _(not run)_ | _(not run)_ |

Tokens / tool calls — railed: _(not run)_ · free: _(not run)_

### T3 — it runs and is reachable (`32e54100`)

| Railed caught, free missed | Free reached, railed never did |
|---|---|
| _(not run)_ | _(not run)_ |

Tokens / tool calls — railed: _(not run)_ · free: _(not run)_

## Stage 4 — decision

Restore a rail only when it appears in the left column of **at least 2 of 3**
tasks. One appearance is noise.

| Outcome | Band | Action |
|---|---|---|
| Most rails load-bearing | keep `deterministic-dominant` | record that the band is Sonnet-5-specific, since Opus 5's guide points the other way |
| Some load-bearing, most not | `workflow` | keep the gate function, drop the phrase list and the iron-law framing |
| Rails changed little | `judgment-dominant` | the free text above becomes the skill |

A fourth outcome is possible and worth naming in advance: **the harness already
does this**. This session's own system prompt carries an evidence-before-claim
rule, so part of the skill duplicates the platform. If both versions pass every
task because the harness catches it anyway, the skill's remaining job is the
post-subagent check, and it should be narrowed to that and shrunk.

## Honesty guard

This file was written by the agent that predicted the result — that ADR-0025's
ratchet left rails unearned across the catalog. Two tells to check in the
finished record:

- Was the free version written thin, so the railed version wins by default?
- Is the right column empty everywhere, and was that investigated?

If either is true, the record is not evidence.
