---
name: multi-persona-review
description: >
  Use when one artifact — a design, schema, plan, document, or diff — needs
  reviewing from several expert points of view at once, and the goal is to SURFACE
  MORE DISTINCT ISSUES than a single reviewer finds. Dispatches one blind subagent
  per point of view, each with its own criteria checklist and a mandatory
  objection, then reconciles by union and arbitrates only genuine contradictions.
  Not for improving factual accuracy — see "What this does not do". Triggers:
  "review from several points of view", "PoV senior data architect", "panel
  review", "cross review", "review as a senior data engineer", "multi
  perspective review", "review from several angles", "reviewer panel".
allowed-tools: Agent Read Write Edit Grep Glob Skill
metadata:
  dstack:
    version: 0.2.0
    type: semantic
    side_effects: readonly
    agency: deliberative
    context_budget_tokens: 4000
    triggers:
      - multi persona review
      - panel review
      - cross review
      - point of view review
      - pov senior
---
# /multi-persona-review

One artifact, several expert points of view, run **blind and in parallel**, then
reconciled. The output is a wider net of findings — not a more accurate verdict.

```
UNION FOR FINDINGS. VOTE ONLY ON SEVERITY AND THE FINAL CALL.
```

A defect that only one reviewer spotted is the most valuable thing this exercise
produces. Majority-voting findings deletes exactly that.

## What this does not do

Be honest about this in the output, because the evidence is one-sided: **role
personas do not improve factual accuracy.** A 162-persona × 2,410-question study
found no gain over a no-persona control, and a 6-model replication on GPQA Diamond
and MMLU-Pro found no reliable improvement — low-knowledge personas actively hurt.

What *does* hold up is **attention coverage**, and the measurement is precise. In
ChatEval's ablation: one reviewer 53.8%, three reviewers with the **same** role
description 53.8% — zero gain from multiplicity alone — and three with **different**
role descriptions 60.0%. The entire effect came from differentiation.

The panel effect in the wider literature comes from *model heterogeneity*, which
this skill cannot supply — every persona shares one base model. Effective
independence in a 9-judge panel measured ≈2.18 of 9. So:

- Claim coverage, never accuracy.
- If the goal is a **more accurate** verdict, this is the wrong tool: use one
  strong reviewer with a detailed rubric, or a genuinely different model.
- Never present unanimity as confirmation. Shared base model → correlated errors.

## When to use

| Situation | Use |
|---|---|
| One artifact, several expert concerns, want maximum issue coverage | `/multi-persona-review` (this skill) |
| A code diff needs a fresh-eyes reviewer | `/requesting-code-review` |
| Review feedback has arrived and needs handling | `/responding-to-review` |
| Several *independent problems* to work in parallel | `/dispatching-parallel-agents` |
| Judge a running app from a stakeholder's view | `/running-uat` |
| Sharpen your own half-formed plan by interview | `/brainstorm` |

Skip it for a small, single-concern artifact — three subagents to review a
50-line config is waste.

## Specify each point of view

A job title alone buys nothing. Every point of view needs four fields, and the
title is a label on top of them:

| Field | Why |
|---|---|
| **Criteria checklist** — the specific things this view checks | This is the causal ingredient; without it, reviews converge |
| **Failure catalogue** — "what I have seen go wrong here" | Steers attention to real, not generic, risk |
| **Out of scope** — what this view must NOT comment on, and who owns it | Prevents duplicated work and coverage gaps |
| **Mandatory objection** — "the one thing I would block this for" | Soft framing does not produce dissent (below) |

**Dissent must be structural.** Measured on 480 team decisions: baseline
disagreement 48.3%; "strong role framing" 61.7%; explicit dissent instructions
55.0% — all statistically indistinguishable. Explicit **devil's-advocate
assignment: 99.2%**. So either assign one dedicated devil's advocate, or make the
objection a required output field for every persona. "Think critically" achieves
nothing.

Ready-made point-of-view specs, including the data architect / data engineer /
data analyst trio: `references/persona-library.md`.

## The procedure

1. **Pick 3 points of view. Hard cap 5.** Effective independence saturates at
   2–3; judges 6–9 in one study added +0.22 effective votes for linear cost.
   Choose views whose *concerns barely overlap* — division of labour beats
   redundant judging.
2. **Keep one holistic reviewer** alongside the specialists. Fine-grained
   decomposition fragments completeness reasoning and hides global omissions.
3. **Dispatch one subagent per view, blind and in parallel.** No sibling output,
   no shared context. Sequential personas in one context anchor on each other:
   modal-answer conformity has been measured up to 85.5%.
4. **Require grounded findings.** Every finding carries a location (file:line, or
   a quoted section) + severity + the evidence. Drop ungrounded findings — that is
   the cheapest defence against confabulation.
5. **Reconcile by union.** Merge all findings; dedupe by (location, root cause).
   **Never drop a finding for lack of a second endorsement.**
6. **Arbitrate only genuine contradictions** — reviewer A says do X, B says do
   not-X. One arbiter pass, at most **one** rebuttal round. Do not run a
   debate-to-consensus: teams have been measured producing the correct answer and
   then voting it away, with an oracle gap up to 32.3 points.
7. **Escalate what the arbiter cannot settle**, with both positions stated. Do not
   silently pick a side.
8. **Report the diagnostic** (next section) alongside the findings.

## The diagnostic that tells you it worked

Report **unique-finding rate per point of view** — findings only that view raised,
over its total.

- Below ~10–20% unique → that view is decorative. Delete it or rewrite its
  criteria checklist. This is the practical stand-in for effective sample size,
  and the only way to know whether the personas are real.
- High overlap across the board → the specs are too similar; differentiate the
  criteria, not the job titles.

## Arbiter hygiene

- **Discount agreement.** Shared base model; unanimity is near-zero evidence.
- **Ignore length** as a quality signal. Verbosity bias is large and measured.
- **Randomise report order** before arbitration, or read in both orders — position
  bias is severe (swap-consistency as low as 23.8% for one model).
- **Warn on self-review.** If the same model family authored the artifact, say so:
  self-preference inflates own-output win rates by 10–25%.
- Reason first, then emit a **discrete** verdict per contradiction.

## Judgment

The rails fix the mechanics. Yours are the two calls they cannot make: **which
points of view this artifact actually warrants** — the wrong three produce three
confident, useless reports — and **which contradictions are real disagreements
versus two reviewers describing the same thing differently.**

## Bundled files

- `references/persona-library.md` — filled specs (criteria, failure catalogue,
  out-of-scope) for data architect, data engineer, data analyst, UI/UX, security,
  novice vs. experienced user, and thesis supervisor; plus the template for a new
  one.
- `references/reviewer-prompt.md` — the dispatch prompt for one blind reviewer,
  and the arbiter prompt.

## Changes

- **0.2.0** — Removed the Indonesian trigger phrases under the English-only rule
  (using-dstack 0.7.0: models translate intent, so the phrases cost tokens
  without adding reach). Two became their English forms — "review from several
  points of view" and "review as a senior data engineer" — and the third was
  dropped as already covered by "point of view review". Nothing was preserved as
  data — this skill matches no Indonesian literal.
- **0.1.0** — Initial. The point-of-view set is taken from this user's own
  recurring requests (senior data architect, data engineer, data analyst, UI/UX,
  novice vs. experienced user). Design constrained by the evidence rather than the
  premise: personas are sold as coverage, not accuracy, after the persona-accuracy
  literature (Zheng et al. EMNLP 2024; Wharton GAIL 2025) came back negative;
  differentiation-not-multiplicity follows ChatEval's role ablation; union-not-vote
  follows from findings-aggregation differing from score-aggregation; blind
  parallel dispatch, the one-round arbiter cap, and the unique-finding diagnostic
  follow the conformity, debate-collapse, and effective-independence results.
