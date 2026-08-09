---
name: prioritizing-work
description: |
  Use when several candidate items compete for one team's capacity and
  nothing has decided the order — including an instruction to do all of
  it or finish the whole list, which is an ordering request with the
  order left implicit. Also when a plan's phases no longer match what was
  built, when a review or UAT defect needs a business priority nobody has
  set, or when someone asks what to build first, what the MVP is, or what
  to cut. Triggers: "prioritize", "what first", "order the backlog",
  "roadmap order", "scope cut", "MVP scope", "must have", "quick win",
  "MoSCoW", "RICE", "Kano", "value vs effort", "do everything".
allowed-tools: Read Grep Glob Write AskUserQuestion
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - prioritize
      - prioritizing-work
      - what should we build first
      - order the backlog
      - moscow
      - rice score
      - kano
      - value vs effort
      - quick win
      - scope cut
      - do everything
---
# /prioritizing-work

```
CLASSIFY BEFORE YOU RANK. FALSIFY BEFORE YOU BUILD.
NO SCORE WITHOUT A NAMED SOURCE. UNSCORABLE IS A LEGAL ANSWER.
```

Two frameworks **classify** (Kano, MoSCoW), two **order within a class**
(RICE, value-vs-effort). A high score never promotes an item past an
unmet gate. That, not judgment, decides which framework wins.

## When to use — and when not

Use when **≥5 candidate items** compete for one capacity and no agreed
order exists; when the instruction is to do all of it (the order is still
a decision, just an unstated one); when a plan's phases no longer match
what was built; when a review or UAT escalates a priority nobody owns.

Not for: fewer than 5 items; a bug, an incident, or a legal obligation
(those route out at Stage 1); doubt about a single idea (`/brainstorm`);
or test-run order (`/designing-test-cases`, which orders by failure risk,
not business value).

## Stage 0 — Lane, then constants

Evaluate top to bottom. **Stop at the first row whose evidence cell can
be filled with a quoted artifact.** Record every rung evaluated with its
evidence or the literal `no evidence`.

| # | Test | Evidence that must be quoted | Lane |
|---|---|---|---|
| L1 | The delivery date is fixed by someone outside the delivery team, and missing it is a breach, a legal failure, or a failed submission | The clause, statute + article, contract section, or submission deadline — verbatim, **with its calendar date**. "Q4", "October", "soon" are `no evidence` | PROJECT |
| L2 | Someone **outside the delivery team** wrote the list of deliverables | The document name and its author: statement of work, terms of reference, tender, regulation article list, acceptance matrix, ticket-id prefix | PROJECT |
| L3 | Two or more **independent organisations** each decide on their own to adopt it | Tenant/organisation separation in the data model, **or** plan tiers or a pricing page, **or** two named unrelated adopters. Users who are mandated to use it are not adopters | PRODUCT |
| L4 | A named adoption, activation, retention or revenue metric is what the team is moving over time | The metric name **and** its current value, **or** the metric name **and** a dated commitment to instrument it. A metric name with neither is `no evidence` | PRODUCT |
| L5 | None of L1–L4 could be evidenced | `LANE: PROJECT (defaulted)` | PROJECT |

**Never infer a lane from tone, repository name, or phrasing.** The
PROJECT rungs come first because the error is asymmetric: a wrong PROJECT
call costs a coarser ranking, a wrong PRODUCT call manufactures a Reach
number and multiplies it by two more guesses.

**Split round.** The lane is a property of the round. Any item firing a
rung from the other lane moves to a mini-lane and is scored there; record
`split: <n> items to <lane> (<rung>)`. Never sort two lanes into one list
(R11). **User override** outranks the ladder: record
`LANE: <X> (user-specified)`, run the ladder anyway, print any rung that
disagrees.

Then declare the round constants **as literals**. `TBD` is `BLOCKED`.

- **Both:** effort unit (person-days), the role list summed into every
  estimate, `period` (default 1 month), the S/M/L fallback constant
  (default `S=2, M=8, L=21` pd).
- **PROJECT:** timeframe scope + fixed end date, capacity, the primary
  user journeys written out in full, the Should/Could threshold.
- **PRODUCT:** the **one** goal metric, reach window, reach unit.

## Stage 1 — Admit or route out

One value per item, before any scoring.

| Value | Condition | Destination |
|---|---|---|
| `IN` | Discretionary, independently shippable, value lands inside the timeframe | Stays |
| `OUT-LEGAL` | Obligation enforceable inside the timeframe | PROJECT lane as a `Must` |
| `OUT-SAFETY` | Security incident, active data loss, SLA breach in progress | Out of the round — do it now |
| `OUT-PREREQ` | Hard prerequisite for committed work | Sequenced with its dependent, scored as one item |
| `OUT-HORIZON` | Value lands after the timeframe ends | Separate capacity lane |
| `OUT-METRIC` | PRODUCT only: does not route to the declared metric | Next round, or drop |
| `UNSCORABLE` | A required input is absent and cannot be sourced | The `UNSCORABLE` list, naming the missing field |

Scoring an obligation produces a low number, a human overrides it, and
the round stops being auditable. Route it out instead. **Gate:** every
`OUT-*` row names its destination.

## Stage 2 — Prerequisites, then the riskiest assumption

Record `blocked_by` (item ids) or `clear` per item, plus every pair where
doing B first shrinks or deletes A — sequence those explicitly or score
them as one item.

Then rank assumptions with the impact × (1 − confidence) table in
`/discovering-requirements` `references/discovery-doc.md`, which owns
those anchors. Each carries a **cheapest falsifier** naming a cost in
person-days and an observable outcome.

**R1 — falsifier position.** The #1 assumption's falsifier occupies
sequence position `≤ max(1, ceil(0.2 × N))`, N = admitted items.
Otherwise the round is `REJECTED` and re-sequenced. This is what stops a
plan whose load-bearing assumption is falsified only after the dependent
work is built.

## Stage 3 — Evidence tier

`references/evidence-rules.md` is the **single** source for what backs a
number, per input. Read it every run, both lanes.

| Tier | What backs the number | What may be printed |
|---|---|---|
| E1 | Production data from this system: a named query, dashboard, funnel, billing export, or dated log | Everything |
| E2 | Direct but not production: ≥5 sessions on this problem, a fake-door result, an estimate from whoever would do the work, or a population count stated by the system's operator with their name and role | Scores and ranking, every number labelled `E2` |
| E3 | Proxy: named personas with written profiles, each answer citing a real artifact | Categories, bands and **order** only. RICE scores and Kano coefficients forbidden |
| E4 | Memory, opinion, competitor presence, or the model's own reasoning | Nothing is a score. Output a hypothesis list |

- **R2** — a row's tier is the **lowest** tier of any input it uses.
- **R3** — every number carries a provenance cell. No provenance → E4,
  whatever the row claims.
- **R4** — a required input absent → `UNSCORABLE`. **Never "medium".**
- **R5** — RICE requires Reach at E2+. Below that the row is
  `UNSCORABLE` regardless of what Confidence would score.
- **R6** — `UNSCORABLE` > 30% of the round, or E4 > 50% → the round is
  `BLOCKED`: emit the evidence that would raise the tier, no ranking.

**Provisional mode.** When R6 blocks but a decision cannot wait, emit a
`PROVISIONAL` ordering built from Stage 2 alone — no scores. The protocol
is in `references/evidence-rules.md`.

## Stage 4 — Classify, then rank inside the class

| Lane | Classify with | Order within a class with | Read |
|---|---|---|---|
| PROJECT | MoSCoW | value ÷ effort, both 1–10 bands | `references/scoring-project.md` |
| PRODUCT | Kano band | RICE | `references/scoring-product.md` |

Non-negotiables, restated here in case the reference is skipped:

- **R7** — every printed number quotes the verbatim band row it matched,
  e.g. `E=7 (band 21–30 pd)`. A model that did not open the reference
  cannot produce the string.
- **R8** — enums are closed. RICE Impact is exactly one of
  `3 · 2 · 1 · 0.5 · 0.25`; `1.5`, `2.5`, `4`, `0` are invalid.
  Confidence is exactly `1.0 · 0.8 · 0.5`; `0.9`, `0.65`, `0.3` are
  invalid. MoSCoW is four exact strings, never `M/S`, never bare `Won't`.
- **R9** — intermediate arithmetic is printed, never only its result.
- **R10** — **effort is estimated in a separate pass, before value is
  known**, and the pass order is stamped in the header. Effort is the
  only continuous input, so it is where a decided answer gets
  back-fitted. Ranges take the upper bound.
- **R11** — never sort across differing round constants.
- **R12 — tie band.** Scores within **15%** are one tier, broken by a
  stated non-numeric reason, never by the decimal. One Confidence rung
  moves a RICE score 20–37.5%; reporting 686 as beating 683 is this
  framework's best-documented failure. The band applies to the PROJECT
  ratio too, whose inputs are band-quantised and therefore coarser.

## Stage 5 — MoSCoW effort share (PROJECT lane)

Print the arithmetic, never only the verdict:

```
M = Σ effort(Must)   S = Σ effort(Should)   C = Σ effort(Could)
P = M + S + C                        ← Won't is NOT in P
Must% = 100 × M / P    (one decimal, half up, then compare)
```

| `Must%` | Verdict |
|---|---|
| ≤ 60.0 | **PASS** |
| 60.1–70.0 | **AT-RISK** — permitted only with all four exemptions `Yes`, else report FAIL |
| > 70.0 | **FAIL** — rebalance; no exemption exists above 70 |

`Could%` of 15–25 is **OK**; below 15 the contingency is gone; above 25
say it is a choice.

**The forbidden cure:** dropping `Could` items to fix a Must breach
shrinks `P` and therefore **raises** `Must%`. The arithmetic proving it,
the four AT-RISK exemptions, the structural check and the three legal
cures are in `references/scoring-project.md`. No estimates → the share is
`UNSCORABLE`; **do not substitute item counts**, which is how this method
silently inverts.

## Stage 6 — Sequence

Applied after scoring, in order. Score orders *within* a band only.

1. **Riskiest assumption** — R1 position, whatever it scored.
2. **Prerequisite** — nothing is scheduled before its `blocked_by` set,
   even a quick win behind an expensive blocker.
3. **Dated obligation** — by date first, then by score within the date.
   Deadlines never enter a value score; folding one in inflates the
   number and hides the reason.
4. **Visible slice** — `/writing-plans` owns this rule and it outranks
   any order from here.
5. **R12** tie band.

**Gate:** an `## Order departs from score` section lists **every**
departure with its reason, or states `none`. A round that presents the
sorted table as the decision has misused the framework even when every
number is right.

## Self-check — run before showing output

| # | Alarm | Remedy |
|---|---|---|
| S1 | `Must%` > 60.0 | Decompose Musts; split acceptance criteria into a Must threshold + a Should target. **Not** dropping Coulds |
| S2 | >60% of items are `Must` by count while Stage 5 passes on effort | Inflation hiding behind a few large items — decompose |
| S3 | ≥60% of items scored Impact ∈ {2,3} (N≥8) | The scale stopped discriminating; fix 3–5 shipped reference features and re-score pairwise |
| S4 | Every item at Confidence `1.0` | The evidence rule was not applied; re-count against `evidence-rules.md` |
| S5 | >60% of Kano attributes returned `O` (N≥8) | The two halves were mirror-scored; re-answer each absent half from its own sentence |
| S6 | Every item in one value/effort quadrant (N≥8) | Bands were applied relatively; re-derive from the absolute ladders |
| S7 | A score printed without its band row quoted | R7 — reject the round, read the reference, re-score |
| S8 | R6 breached | Round is `BLOCKED` or `PROVISIONAL`; do not deliver a ranking |
| S9 | R1 breached | `REJECTED` — re-sequence |
| S10 | The `OUT-*` list is empty on a round of >8 items | Stage 1 was skipped |
| S11 | Recommended order equals score order with no departures listed | Dependencies were never checked |
| S12 | Two lanes in one sorted list | R11 — split the output |
| S13 | A re-run gives a different lane, enum value, or top tier | Reconcile against the recorded deciding-rung string; irreproducible is a defect, not a nuance |

## Refusals — each names its destination

| Situation | Do this instead |
|---|---|
| Fewer than 5 items | State the order and the reason in three lines |
| Reach cannot be counted from a named source | **Do not run RICE.** Take the PROJECT lane, or make instrumentation or a fake-door the first item |
| No survey respondents | Kano prints categories and bands only, labelled HYPOTHESES, plus the falsifying utterance per attractive call |
| No effort estimate from whoever would do the work | `UNSCORABLE`; next action is an S/M/L pass through the declared constant |
| The date is not fixed and scope is | MoSCoW's contingency has nothing to protect. Rank by value ÷ effort and say the buffer does not exist |
| Both lanes seem to apply | Impossible by construction; re-read L1 and take PROJECT |

## Red flags — you are rationalizing

| Thought | Answer |
|---|---|
| "Everything here is genuinely a Must" | That is undecomposed scope, not a priority |
| "There is a workaround but it's painful" | Pain decides Should vs Could, never Must |
| "The requirement *is* the automated version, so no workaround exists" | A workaround is judged against the user's outcome, never the item's stated implementation |
| "No data, so I'll assume medium" | `UNSCORABLE`. "Medium" is a fabricated number wearing a hedge |
| "Confidence feels high" | Confidence is a count of evidenced factors, not a feeling |
| "Drop a Could to get under 60%" | That raises `Must%`. Recompute and look |
| "The user said do everything" | Everything still has an order. Deliver the order, then do everything in it |
| "It scored highest, so it goes first" | Not past an unmet gate, and not past its blocker |

## Output

One file, `docs/priority/YYYY-MM-DD-<slug>.md` **in the target system's
repo**, not whichever repo the session started in; a user preference
overrides. Row shapes are in `references/priority-doc.md`.

Report in chat: the lane and its deciding rung, the #1 assumption and its
falsifier, the top tier, every `UNSCORABLE`, and every alarm that fired.
Not the whole table.

## Judgment

The spine is table lookup and arithmetic. Judgment enters twice: **which
prerequisite is cheapest to falsify**, and **whether an item is
admissible to this round at all**. A reproducible score is still not a
true score — only one two runs agree on.

## Bundled files

- `references/evidence-rules.md` — admissible and inadmissible sources
  per input; the `UNSCORABLE` protocol. **Read every run, both lanes.**
- `references/scoring-project.md` — the MoSCoW gate, Should/Could
  thresholds, the value and effort ladders, one worked round.
- `references/scoring-product.md` — RICE inputs and anchors, the Kano
  instrument and lookup, fulfilment state, one worked round.
- `references/priority-doc.md` — the output artifact template.

## Hand-off

**In:** `/discovering-requirements` when the question spans documents
rather than one requirement set; `/running-uat` and
`/multi-persona-review` when a defect's business priority is unset.
**Out:** `/writing-plans` **carries** this order and does not re-derive
it. **Sibling:** `/brainstorm` owns doubt about a single idea; this skill
owns doubt about which of several.

## Changes

- **0.1.0** — Initial. The catalog assigned MoSCoW labels in
  `/discovering-requirements` Stage 6 with no criteria for deciding which
  label a requirement earns, and ranked nothing across items: no
  mechanism compared feature A to feature B. Observed costs were a
  priority table withdrawn for circular reasoning, a roadmap whose item
  order silently changed scope, and a programme whose load-bearing
  assumption was falsified only after the dependent work was built —
  which is why Stage 2 runs before any scoring. Calibration is
  `deterministic-dominant` (ADR-0025): the rails are the value, and R7
  makes a skipped reference read detectable. Effort is person-days, not
  Intercom's person-months, which collapse almost every item to `0.5` at
  this scale; the departure is stated so a model does not "correct" it
  back. A `scripts/` scorer was deferred — the arithmetic is four
  multiplications, and cheap models fail on fabricated inputs, which no
  script detects. Revisit if a round produces an arithmetic error rather
  than an evidence error.
