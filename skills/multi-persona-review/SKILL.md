---
name: multi-persona-review
description: >
  Use when one artifact — a design, schema, plan, document, or diff — or one
  digital-product review packet needs reviewing from several expert points of
  view at once, and the goal is to SURFACE MORE DISTINCT ISSUES than a single
  reviewer finds and then close on a decision someone owns. Also use when
  reviewers are agreeing too readily and the proposal needs someone assigned to
  attack it, when a product needs review coverage selected by product class and
  lifecycle gate, or when a review has to end in an execution hand-off rather
  than a findings list. Not for improving factual accuracy through personas, and
  never a substitute for user research — see "What this does not do". Triggers:
  "review from several points of view", "PoV senior data architect", "panel
  review", "multi perspective review", "reviewer panel", "devil's advocate",
  "red team this", "digital product review", "review dashboard", "review public
  service", "Disney Creativity Strategy", "dreamer realist critic", "six
  thinking hats", "decide as a panel".
allowed-tools: Agent Read Grep Glob Skill
metadata:
  dstack:
    version: 0.5.0
    type: semantic
    side_effects: readonly
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - multi persona review
      - panel review
      - cross review
      - point of view review
      - pov senior
      - devils advocate
      - red team review
      - digital product review
      - product quality review
      - review dashboard
      - review public service
      - persona matrix
      - review gate
      - disney creativity strategy
      - dreamer realist critic
      - six thinking hats
---
# /multi-persona-review

Several expert points of view on one thing, run **blind and in parallel**, then
reconciled, verified against sources, and closed by an owned decision.

```
UNION FOR FINDINGS. VERIFY THE DECISIVE CLAIMS. ONE OWNER MAKES THE CALL.
```

A defect only one reviewer spotted is the most valuable output here.
Majority-voting findings deletes exactly that.

## Pick the mode first

| Situation | Mode or skill |
|---|---|
| One existing artifact, differentiated expert concerns | **general artifact** mode |
| One product packet — one class, one lifecycle gate | **digital product** mode |
| No artifact yet; the idea itself needs generating | `/brainstorm`, then return |
| A code diff needs fresh eyes | `/requesting-code-review` |
| Judge a **running** app against acceptance criteria | `/running-uat`, then bring its packet here |
| Accepted findings need business ordering | `/prioritizing-work` |

Never fabricate a review to cover a missing artifact. Skip the skill entirely for
a small single-concern artifact: four subagents on a 50-line config is waste.

## What this does not do

Say this in output, because the evidence is one-sided.

**Role personas do not improve factual accuracy** — 162 personas over 2,410
questions, replicated on six models with nine significant *negative* differences.

**This does not produce user research.** A seat may analyse research notes, UAT
records, analytics, support tickets or accessibility results. It may not speak
as six users and have that counted as evidence. No seat count creates one.

What holds up is **coverage, through differentiation only** — agents sharing one
role description scored 53.8%, exactly a single agent's score, against 60.0% for
differentiated ones, peaking at 62.5% on three to four roles and declining at
five. Beyond that needs model heterogeneity this skill cannot supply: one base
model, a nine-judge panel measuring ≈2.18 effective votes. So:

- Claim coverage, never accuracy. Accuracy comes from step 5.
- Never present unanimity as confirmation — one model, correlated errors.
- Disney and Six Hats are **facilitation structures, not measured
  interventions.** Never cite the frameworks as evidence.

Each figure's scope and licensed wording: `references/evidence-base.md`.

## The evidence gate — before any panel

Collect, tagging each `observed | sourced | inferred | missing`: purpose ·
critical tasks · class and lifecycle gate (product mode) · the artifact or packet
· available user, operational and expert evidence · the decision owner.

**This gate withholds the verdict, not the review.** Missing human evidence stops
a user-outcome *claim*; it does not stop the panel. Seat the panel anyway, ship
the expert findings the artifact supports, and tag each with what it does not
establish. Withhold only the verdict and the score — emit `no verdict` with an
evidence plan naming the method per gap. A gate table alone is not an output.
Stop outright **only** when there is no artifact and no packet at all; then the
plan is the deliverable.

Classes, gates, coverage matrix, method selection, `PR-nnn`, S0-S3, scorecard:
`references/product-review-framework.md`.

## The mandatory panel — Dreamer, Realist, Critic

Disney Creativity Strategy, three seats, **always all three**. Dropping one is
always the same mistake: without the Dreamer you approve an under-ambitious plan,
without the Realist one nobody can build, without the Critic whatever was put in
front of you.

| Seat | Owns the question | Must not do |
|---|---|---|
| **Dreamer** | What could this be if it worked perfectly? What was never attempted, and which assumed constraint is not real? | Cost it, schedule it, hedge it |
| **Realist** | How does this get done — who works, what stops to make room, what sequence, what first step, what failure path? | Judge whether the goal is worth wanting |
| **Critic** | What breaks it? The strongest honest case for *not* proceeding, the load-bearing assumption, the cheapest falsifying test. | Attack the author, or restyle |

Disney runs these sequentially in one head. **Do not.** Dispatch them blind and
in parallel: agents that see each other's answers converge on the modal answer,
measured up to 85.5%. Sequencing is only right when the artifact does not exist
yet — that is `/brainstorm`.

Add up to **two specialists** whose concerns barely overlap the trio. Hard cap
**5 seats** — measured accuracy peaks at three to four differentiated roles and
declines at five. The verification pass is not a seat, and neither is the Blue
hat: that one is yours.

**Coverage is not seats.** A product may need 6-10 perspectives while the panel
stays at five. A seat carries **at most two**, only where their checklists
genuinely overlap, both intact and separately labelled, every finding tagged with
its originating perspective. More than two uncovered means **split the packet**,
never overload a seat: three merged checklists rebuild the same-description
condition that beat nothing.

Human participants and named reviewers are **evidence providers**, not seats —
the cap is on same-model subagents. Dispatch with the host's mechanism (Claude
Code's `Agent`); if none exists, say so and claim no independent review.

Specs for every stance, perspective and test context:
`references/perspective-library.md`.

## Specify each point of view

A job title buys nothing. Every seat needs a **criteria checklist** (the causal
ingredient — without it reviews converge), a **failure catalogue**, an
**out-of-scope** list naming who owns each excluded concern, and a **mandatory
objection**. Filled cards: `references/perspective-library.md`.

**Dissent must be an assigned role, not an instruction.** Across 480 team
decisions, an objection field, strong role framing and "please disagree" were all
indistinguishable from baseline; an assigned devil's advocate reached 99.2%.
**The Critic seat is the mechanism**; "think critically" is not.

## The procedure — three iterations, hard cap

Three, never four — each extra round costs a full fan-out and buys less than the
last; measured, more turns show no upward trend and often degrade. The third is
conditional, so most reviews stop at two.

| Iteration | Seats and hats | Produces |
|---|---|---|
| **1 — Diverge** | Dreamer in Green, Realist in White, Critic in Black, plus ≤2 specialists. Blind, parallel. | union findings, verified claims, and the Critic's ranked kill-case frozen as a risk register |
| **2 — Converge** | Dreamer and Realist patch the register in Green + Yellow; Critic re-checks the proposed v2 in Black; all seats close in Red. | a proposed v2 with a mitigation per item, then the decision, work assignment and dissent register |
| **3 — Go / No-Go** | Blue and Red only. No new seats or analysis. | Go or No-Go. **Conditional — see its trigger** |

**Three iterations is not three debates.** The one-rebuttal cap governs argument
about the *same* artifact; a boundary is crossed only when **the artifact has
changed**. Iteration 2's Critic reads the proposed v2 and the register it was
meant to close, never iteration 1's disagreement. No revision, no new iteration —
re-running the argument is the pattern measured producing the correct answer and
then voting it away, an oracle gap up to 32.3 points at worst.

### The hats

De Bono's discipline is **parallel thinking**: every seat wears the same hat at
the same time instead of defending a fixed position. **White** facts ·
**Green** the smallest unblocking change, a proposal not an argument ·
**Yellow** value that survives · **Black** what breaks, and in It2 the risk left
*after* mitigation · **Red** one line of gut, no justification demanded ·
**Blue** not a seat — **you hold it**: packet, cadence, verdicts, assignment.

Who wears what is in the table above. Exact field wording:
`references/reviewer-prompt.md`.

### Iteration 1 — diverge

1. **Seat the panel.** The trio plus at most two specialists whose concerns
   *barely overlap* it, mapped from the coverage table.
2. **Dispatch one subagent per seat, blind and in parallel.** No sibling output,
   no shared context, no session narrative. Go wide — this iteration is allowed
   to be noisy.
3. **Require grounded findings.** Every finding carries a location (file:line, or
   a quoted section) + severity + the evidence, tagged `[CLAIM]` when it rests on
   a fact someone must check and `[INFERRED]` when it goes beyond the supplied
   evidence. **`[INFERRED]` may never be rewritten as `[OBSERVED]`.** Drop
   ungrounded findings — the cheapest defence against confabulation.
4. **Reconcile by union.** Merge all findings; dedupe by (location, root cause).
   **Never drop a finding for lack of a second endorsement.**
5. **Verify the decisive claims.** A claim is decisive when the decision changes
   if it turns out false. Check those and ignore the rest — the list is otherwise
   unbounded. Verify claims made *by the artifact* (numbers, citations,
   assumptions) and claims asserted *by a reviewer*, against the source, never
   against a second opinion.

   **Verified** is usable as-is. **Refuted** escalates to blocking and withdraws
   every finding built on it. **Unverifiable** may not carry blocking severity
   and may not be the sole basis for the decision — it becomes a named
   assumption with an owner. This is the only step that touches whether a claim
   is true: the panel bought coverage, this buys accuracy.
6. **Freeze the risk register** — the Critic's ranked kill-case plus every
   blocking and major finding. It is iteration 2's input *and* its exit test.

### Iteration 2 — converge

7. **Dreamer and Realist patch the register** — one dispatch, both blind, wearing
   Green then Yellow: a mitigation per item and the value that survives it. The
   Dreamer looks for a way through, the Realist for whether it can be built.
8. **Produce a proposed v2 — do not edit the source.** This skill is read-only.
   The v2 goes **inside the review record** as **concrete replacement text**: the
   rewritten section, the changed rows, the new wording. A proposal that only
   argues for a change is not a v2 and does not open iteration 2. Applying it is
   a separate, user-authorised task.
9. **The Critic re-checks the proposed v2** wearing Black — residual risk after
   each mitigation, every register item marked closed / still open / made worse.
   An item nobody addressed stays open; silence does not close a risk. Then every
   seat returns one Red line. Same-hat-at-once is the mechanism throughout; a
   conversation between seats is not, and Blue never appears in a prompt.
10. **Decide, then commit.** Every surviving contradiction gets a discrete verdict
    from Blue — accept A / accept B / defer with a stated trigger / block. Not a
    vote: count does not settle truth when the seats share one base model. In
    product mode the verdict is `pass | conditional | block | no verdict`, and
    **an open S3 blocks regardless of any score.** Then close the loop: Blue
    assigns the work (what, who by name, by when, who verifies — a decision with
    no assignment table is still an opinion, and `/writing-plans` carries it
    onward rather than re-deriving it); every seat commits to the **action**, not
    to agreeing the objection was wrong; and dissent is preserved verbatim with
    the observation that would reopen it. **Erasing dissent to make the record
    read unanimous rebuilds the exact failure the Critic exists to prevent.**
11. **Report the diagnostics** with the findings and the decision. The record is
    returned in the response; this skill writes nowhere.

### Iteration 3 — Go / No-Go, conditional

Runs **only** when iteration 2 surfaced a **new blocking finding of a class
iteration 1 never considered** — a legal or regulatory bar, cost materially past
what was approved, an unobtainable dependency, a safety exposure. Not for an old
objection restated louder, a preference, or a seat wanting another turn. If
iteration 2 closed cleanly, the review is over.

Blue and Red only: no new seats, no new analysis. What remains is a judgment
under uncertainty that will not resolve by looking harder. Every seat gives one
Red line and Blue emits **Go** or **No-Go**.

**No-Go is a legitimate output**, and there is no iteration 4. If Blue cannot
settle it, escalate to the human with both positions, the Red lines, and a named
recommendation — never another round.

## The diagnostics that tell you it worked

Unique-finding rate **per perspective** (below ~10-20% means decorative, or
smothered by a merged seat) · claims checked / refuted / unverifiable, since a
decision resting on unverifiable claims is a bet and must say so · blocking
objections raised, where **zero is a red flag, not a clean bill of health**.
Tables: `references/reviewer-prompt.md`.

## Judgment

The rails fix the mechanics. Yours are the calls they cannot: **which
perspectives** this packet warrants and **which two may share a seat**; **which
contradictions are real** versus two seats wording one thing differently;
**which claims are decisive** enough to verify, since checking everything is as
useless as checking nothing; and **whether iteration 2's blocking finding is a
genuinely new class** — the single call iteration 3 turns on.

## Bundled files

All under `references/`.

- `perspective-library.md` — three stances, 18 perspectives by evidence layer,
  test contexts, card contract.
- `product-review-framework.md` — classes, gates, coverage matrix, seat mapping,
  method selection, `PR-nnn`, S0-S3, scorecard, stop conditions.
- `evidence-base.md` — every claim traced to its source and the wording it
  licenses. Read before repeating a number.
- `reviewer-prompt.md` — every dispatch prompt, arbiter hygiene rules, and the
  decision record.

## Changes

- **0.5.0** — Added a **digital-product mode** and split the vocabulary the old
  name conflated: a **perspective** is coverage, an **AI seat** is execution, a
  **test context** is a condition, not a person. Product mode selects coverage by
  **class and lifecycle gate**; an **evidence gate** withholds a user-outcome
  verdict when no user evidence exists — without halting the review, which an
  earlier draft did. 6-10 perspectives map onto the unchanged five-seat cap under
  a **two-per-seat limit**. Severities became **S0-S3**, **S3 blocking regardless
  of score**. `Write`/`Edit` dropped to match the declared
  `side_effects: readonly`, so iteration 2 returns a proposed v2 as text.
  Measured claims moved to **`evidence-base.md`**, whose audit corrected three
  and withdrew one untraceable.
- **0.4.0** — Made the trio mandatory, capped iterations at three, required an
  owned decision. Disney dispatched **blind and parallel** rather than in its
  original sequence, which would recreate the conformity failure this skill
  exists to avoid. **The Critic became the assigned devil's advocate** — 0.3.0
  named it the strong mechanism and shipped only the weaker dissent instruction.
  A **verification step** buys the accuracy personas do not. Budget 4000 → 5000.
- **0.3.0** — `reviewer-prompt.md` named where an escalated finding goes.
- **0.2.0** — Dropped Indonesian triggers under the English-only rule.
- **0.1.0** — Initial. Coverage not accuracy, differentiation not multiplicity,
  union not vote, blind parallel dispatch.
