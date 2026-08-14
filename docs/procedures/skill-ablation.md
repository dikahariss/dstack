# Skill ablation procedure

Required by [ADR-0030](../adr/0030-sonnet5-calibrated-skill-shape.md) §5–6.
A skill may not change calibration band on argument alone — in either
direction. This is how the evidence gets made.

## Why this exists

ADR-0025 charged a written rationale for rails and empirical evidence for
freedom. That asymmetry is a one-way ratchet: by 2026-08-14 the catalog held 13
`deterministic-dominant` skills against 1 `judgment-dominant`, and no procedure
had ever removed a rail. ADR-0030 charges both directions the same evidence.
This document is what makes that price payable rather than prohibitive.

## Model under test

State the model and effort in the record. **An ablation run on one model does
not license a change to a skill used on another**, and that holds in both
directions.

The daily driver is **Sonnet 5**. Run at the effort actually used day to day,
not at `max` — a rail that only earns its place at `max` is not earning it in
practice. Anthropic's guidance for the two models diverges on exactly the point
this procedure measures: Opus 5 verifies and self-corrects without being told
and over-verifies when instructed, while Sonnet 5 follows instructions literally
and does not generalize past them. A rail that is dead weight on one can be
load-bearing on the other.

## The procedure

### 1. Pick three real tasks

Three past invocations of the skill, taken from the transcript store under
`~/.claude/projects` — not invented scenarios. Invented tasks flatter whichever
version the author already prefers, because the author writes them knowing what
each version does well.

If three real invocations do not exist, the skill has not been used enough to
have earned rails. Say so in the record and stop; that finding is itself the
result.

### 2. Build the free version

Replace the skill body with its **goal, its guardrails, and its exit
criteria** — nothing else.

Do **not** delete the skill entirely. Deleting tests skill discovery and
routing, which is a different question with a different answer. The comparison
here is *railed instructions* versus *stated intent*, holding discovery fixed.

### 3. Run both, record both columns

Per task, fill a two-column table. **Both columns get filled.**

| Task | Railed run got that free missed | Free run reached that railed never did |
|---|---|---|

A run with an empty second column usually means the free version was
under-specified — its goal or exit criteria were too thin — not that the rails
won. Rewrite the free version and run it again before believing that result.

For skills that spend tool calls or subagents, record **tool-call count and
wall-clock** alongside quality. A rail that improves nothing and costs three
extra subagent dispatches is a finding.

### 4. Decide

Restore a rail only when it appears in column one for **at least 2 of 3 tasks**.
One appearance is noise.

Then set the band from what survived:

| What the runs showed | Band |
|---|---|
| Most rails load-bearing; failure is unrecoverable without them | `deterministic-dominant` |
| Some load-bearing, most not | `workflow` |
| Rails changed little; the free version matched or beat it | `judgment-dominant` |

A schema or router skill stays `schema-meta` regardless — its determinism is
the output shape, not a procedure.

### 5. Record it

Write the run to `docs/ablations/YYYY-MM-<skill>.md` and add one line to the
skill's `## Changes` naming the band, the model, and the file. A band change
with no record did not happen.

## What this procedure does not do

It does not measure whether the skill's *goal* is right, whether it triggers
when it should, or whether its description gets it found. Those are separate
questions — `/writing-skills` covers the last two.

It also does not settle a skill whose two runs disagree for reasons outside
the skill. When the difference traces to the model, the harness, or the task
rather than to the rails, say so and run a fourth task.

## Honesty guard

The failure mode this procedure exists to prevent is running the ablation
having already decided the answer. Two specific tells:

- The free version was written thin, so the railed version wins by default.
- Column two is empty in every row, and that was not investigated.

If either is true of a record, the record is not evidence.
