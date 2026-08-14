# Ablation — `writing-specs`, as representative of the document shape

Task 12 of `docs/plans/2026-08-14-unhobbling-skill-catalog.md`, following
[the procedure](../procedures/skill-ablation.md). **Run 2026-08-14.**

## Why this skill stands for five

The [narrow-bridge test](2026-08-narrow-bridge-test.md) failed seven
`deterministic-dominant` skills. Two of them (`modelling-system-behaviour`,
`modelling-business-processes`) have zero recorded invocations and cannot be
ablated at all. The remaining five share one shape: **they produce a document
or a picture that a human reviews before anything acts on it**, so a wrong step
order costs a redraw, not data.

`writing-specs` was picked as the representative — 11 real invocations, the
most-used of the five, and the archetype of the shape.

**Coverage this document does NOT claim.** Only `writing-specs` was run.
`discovering-requirements`, `prioritizing-work`, `wireframing-interfaces` and
`diagramming-architecture` share the shape but have no ablation of their own,
so **their bands do not move on this evidence**. Recording the gap rather than
generalising over it is the point; the procedure allows batching same-shape
skills only when results from more than one agree.

## Method

Three requirement sets were written, each with a **planted trap** — a
requirement that is easy to satisfy in prose and easy to get structurally
wrong. The oracle is whether the produced design addresses it at the level
that matters (schema, constraint, contract), not whether the prose reads well.
Judging document quality by eye would have been the author grading his own
prediction.

| Task | Domain | Planted trap | Structurally wrong answer |
|---|---|---|---|
| T1 | Vessel inspection records | R5: 7-year retention, no edit or delete after submission | a mutable table with UPDATE/DELETE |
| T2 | Cargo manifest reconciliation | R6: 3-decimal quantities, totals must reconcile exactly | `FLOAT`/`DOUBLE` anywhere in the pipeline |
| T3 | Berth booking | R5 non-overlap + R6 UTC with DST ports | app-level check-then-write; fixed UTC offset |

Six Sonnet 5 runs, blind to each other and to the ablation.

## Results

### Defect catching

| Task | Railed caught, free missed | Free reached, railed never did |
|---|---|---|
| T1 | — nothing | enforced immutability at the **database privilege layer** (no UPDATE/DELETE grant) rather than only by omitting the operation, arguing a legal record needs a fail-closed guarantee an app bug cannot bypass |
| T2 | Stage 2's gate returned **BLOCKED**, not PASS: R2 and R5 presuppose an identity provider and a customs declaration source with zero located evidence, and the block cascaded to four named components | — nothing |
| T3 | — nothing | stored an **IANA timezone id per port** rather than pushing DST resolution to the client, noting a fixed offset breaks for half the year; and flagged that sequential ids on a schedule shared between *competing* lines leak relative booking volume |

Both versions caught all three planted traps. Every design used fixed-point
decimal, an exclusion constraint, and structural immutability.

### Cost

| | Railed | Free | Ratio |
|---|---|---|---|
| Subagent tokens | 479,392 | 228,603 | **2.1×** |
| Tool calls | 64 | 13 | **4.9×** |

## Decision

The left column is non-empty in **1 of 3** tasks. The rule restores a rail only
at 2 of 3, so **no rail is restored** — but this is not the empty column that
`verifying-before-done` produced, and the difference decides the band.

What the rails bought in T2 is real: a gate that returns BLOCKED on an
unevidenced external dependency, and the traceability and coverage tables that
come with it. What they cost is 2.1× the tokens and 4.9× the tool calls on
every run, including the two where they added nothing.

That is the middle row of the decision table — *some load-bearing, most not*.

**`writing-specs`: `deterministic-dominant` → `workflow`.**

The gates stay; the band stops telling a cheap model it has almost no room.

## The pattern across two ablations

Twelve runs now, two skills, six planted defects: **the free version caught
every one**. In both ablations the free version also reached something the
railed one did not — the database privilege layer here, the causal isolation in
`verifying-before-done`.

Two ablations are a pattern, not a law, and the confound named in the first one
still stands: the harness system prompt carries its own discipline, so neither
instruction text can be fully credited. What is measurable and not confounded
is the cost, and it is not small.

The honest next step is not to generalise this to the four unrun skills. It is
to run them.

## Honesty guard

- Was the free version written thin? No — it caught every trap and on two of
  three tasks produced the sharper answer.
- Is the right column empty everywhere? No, and the left column is not empty
  either, which is why this skill lands at `workflow` and not
  `judgment-dominant`.
- Written by the agent that predicted rails were unearned. The T2 result is the
  one that argues against that prediction and it was kept, weighted, and
  allowed to change the outcome.
