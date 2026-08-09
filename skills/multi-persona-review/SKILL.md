---
name: multi-persona-review
description: >
  Use when one artifact — a design, schema, plan, proposal, document, or diff —
  needs reviewing from several expert points of view at once, and the goal is to
  SURFACE MORE DISTINCT ISSUES than a single reviewer finds and then close on a
  decision someone owns. Also use when reviewers are agreeing too readily and the
  proposal needs someone assigned to attack it, or when a review has to end in an
  execution hand-off rather than a findings list. Not for improving factual
  accuracy through personas — see "What this does not do". Triggers: "review from several
  points of view", "PoV senior data architect", "panel review", "cross review",
  "multi perspective review", "reviewer panel", "devil's advocate", "red team
  this", "challenge this proposal", "Disney Creativity Strategy", "dreamer realist
  critic", "six thinking hats", "de Bono", "decide as a panel".
allowed-tools: Agent Read Write Edit Grep Glob Skill
metadata:
  dstack:
    version: 0.4.0
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
      - disney creativity strategy
      - dreamer realist critic
      - six thinking hats
---
# /multi-persona-review

One artifact, several expert points of view, run **blind and in parallel**, then
reconciled, verified against sources, and closed by a decision someone owns.

```
UNION FOR FINDINGS. VERIFY THE DECISIVE CLAIMS. ONE OWNER MAKES THE CALL.
```

A defect that only one reviewer spotted is the most valuable thing this exercise
produces. Majority-voting findings deletes exactly that.

## What this does not do

Be honest about this in the output, because the evidence is one-sided: **role
personas do not improve factual accuracy.** A 162-persona × 2,410-question study
found no gain over a no-persona control, and a 6-model replication on GPQA Diamond
and MMLU-Pro found no reliable improvement — low-knowledge personas actively hurt.

What *does* hold up is **attention coverage**, and only through differentiation.
ChatEval's ablation: one reviewer 53.8%; three reviewers with the **same** role
description 53.8% — multiplicity alone bought nothing; three with **different**
descriptions 60.0%. The wider panel effect comes from *model heterogeneity*, which
this skill cannot supply: every seat shares one base model, and effective
independence in a 9-judge panel measured ≈2.18 of 9. So:

- Claim coverage from the panel, never accuracy. Accuracy comes from step 5,
  which checks claims against sources rather than against another persona.
- Never present unanimity as confirmation. Shared base model → correlated errors.
- Disney Creativity Strategy and Six Thinking Hats are **facilitation structures,
  not measured interventions**. What carries weight is that their seats have
  sharply different criteria and that the Critic is an assigned devil's advocate.
  Do not cite the frameworks themselves as evidence.

## When to use

| Situation | Use |
|---|---|
| One artifact, several expert concerns, want maximum issue coverage | `/multi-persona-review` (this skill) |
| No artifact yet — the idea itself needs generating | `/brainstorm`, then come back |
| A code diff needs a fresh-eyes reviewer | `/requesting-code-review` |
| Judge a running app from a stakeholder's view | `/running-uat` |

Skip it for a small, single-concern artifact: four subagents on a 50-line config
is waste.

## The mandatory panel — Dreamer, Realist, Critic

Disney Creativity Strategy, three seats, **always all three**. Dropping one is
always the same mistake: without the Dreamer you approve an under-ambitious plan,
without the Realist one nobody can build, without the Critic whatever was put in
front of you.

| Seat | Owns the question | Must not do |
|---|---|---|
| **The Dreamer** | What could this be? What problem would it solve if it worked perfectly, what was never attempted, which assumed constraint is not real? | Cost it, schedule it, or hedge it |
| **The Realist** | How does this actually get done — who does the work, what stops to make room, what sequence, what is the first concrete step, what is the failure path? | Judge whether the goal is worth wanting |
| **The Critic** | What breaks it? The strongest honest case for *not* proceeding, the load-bearing assumption, and the cheapest test that would falsify it. | Attack the author, or restyle |

Disney runs these sequentially in one head. **Do not.** Dispatch them blind and in
parallel: sequential personas in one context anchor on each other, with modal-answer
conformity measured up to 85.5%. Sequencing is only required when the artifact does
not exist yet — that is `/brainstorm`, not this skill.

Add up to **two specialists** whose concerns barely overlap the trio — a schema
wants the data architect, a screen wants UI/UX, a business case wants the analyst.
Hard cap **5 reviewing seats**. The verification pass in step 5 is not a seat, and
neither is the Blue hat: that one is yours.

Filled specs for every seat: `references/persona-library.md`.

## Specify each point of view

A job title alone buys nothing. Every seat needs four fields and the title is
only a label on top of them: a **criteria checklist** (the causal ingredient —
without it reviews converge), a **failure catalogue** of what this view has seen
go wrong (steers attention to real rather than generic risk), an **out-of-scope**
list naming who owns each excluded concern (prevents both duplicated work and
coverage gaps), and a **mandatory objection** — "the one thing I would block this
for".

**Dissent must be an assigned role, not an instruction.** Measured on 480 team
decisions: baseline disagreement 48.3%; "strong role framing" 61.7%; explicit
dissent instructions 55.0% — all statistically indistinguishable. Explicit
**devil's-advocate assignment: 99.2%**. The required objection field is the 55%
mechanism; **the Critic seat is the 99.2% one.** That is why the Critic is
mandatory and not a mood you ask the others to adopt. "Think critically" and "do
not just agree with me" achieve nothing.

## The procedure — three iterations, hard cap

Three, never four — every extra round costs a full fan-out and buys less than the
one before it. Each iteration has a different job and the third is conditional,
so most reviews stop at two.

| Iteration | Seats and hats | Produces |
|---|---|---|
| **1 — Diverge** (quantity) | Dreamer in Green, Realist in White, Critic in Black, plus ≤2 specialists. Blind, parallel. | v1 with its weak points named: union findings, verified claims, and the Critic's ranked kill-case frozen as a risk register |
| **2 — Converge** (quality) | Dreamer and Realist patch the register in Green + Yellow; Critic re-checks v2 in Black; all seats close in Red. | v2 with a mitigation per register item, then the decision, the work assignment, and the dissent register |
| **3 — Go / No-Go** | Blue and Red only. No new seats, no new analysis. | A Go or a No-Go. **Conditional — see its trigger** |

**Three iterations is not three debates**, and the one-rebuttal cap is not
relaxed — it governs argument about the *same* artifact. An iteration boundary is
crossed only when **the artifact itself has changed**: iteration 2's Critic reads
v2 and the register it was meant to close, never the transcript of iteration 1's
disagreement. No revision, no new iteration — re-running the argument is the
pattern measured producing the correct answer and then voting it away, oracle gap
up to 32.3 points.

### The hats

De Bono's discipline is **parallel thinking**: everyone wears the same hat at the
same time instead of defending fixed positions. That is what converts a panel of
opponents into a team.

**White** — facts only, never opinion. **Green** — the smallest change that would
unblock it: a proposal, not an argument. **Yellow** — what genuinely works and
what it is worth. **Black** — what breaks; in It2, the risk left *after* the
mitigation. **Red** — one line of gut, no justification required and none may be
demanded. **Blue** — not a seat; **you hold it**: packet, cadence, verdicts,
assignment.

Who wears what is in the iteration table above. Exact field wording:
`references/reviewer-prompt.md`.

### Iteration 1 — diverge

1. **Seat the panel.** Dreamer, Realist, Critic, plus at most two specialists
   whose concerns *barely overlap* the trio. Effective independence saturates at
   2–3; judges 6–9 in one study added +0.22 effective votes for linear cost.
2. **Dispatch one subagent per seat, blind and in parallel.** No sibling output,
   no shared context, no session narrative. Go wide — this is the iteration
   allowed to be noisy.
3. **Require grounded findings.** Every finding carries a location (file:line, or
   a quoted section) + severity + the evidence, and is tagged `[CLAIM]` when it
   rests on a fact someone must check. Drop ungrounded findings — that is the
   cheapest defence against confabulation.
4. **Reconcile by union.** Merge all findings; dedupe by (location, root cause).
   **Never drop a finding for lack of a second endorsement.**
5. **Verify the decisive claims.** A claim is decisive when the decision changes
   if it turns out false. Check those and ignore the rest — the list is otherwise
   unbounded. Verify claims made *by the artifact* (numbers, citations,
   assumptions) and claims asserted *by a reviewer*, against the source, never
   against a second opinion.

   | Status | Rule |
   |---|---|
   | **Verified** — source named and it says so | usable as-is |
   | **Refuted** — source contradicts it | escalates to blocking; any finding built on it is withdrawn |
   | **Unverifiable** — no reachable source | may not carry a blocking severity and may not be the sole basis for the decision; it becomes a named assumption with an owner |

   The only step that touches whether a claim is true: the panel bought coverage,
   this buys accuracy.
6. **Freeze the risk register** — the Critic's ranked kill-case plus every
   blocking and major finding. It is iteration 2's input *and* its exit test.

### Iteration 2 — converge

7. **Dreamer and Realist patch the register** — one dispatch, both blind, wearing
   Green then Yellow: a mitigation per item and the value that survives it. The
   Dreamer looks for a way through, the Realist for whether it can be built.
8. **Revise the artifact into v2** from the accepted mitigations. No revision, no
   iteration: iteration 2 reviews v2, never v1 with better arguments attached.
9. **The Critic re-checks v2** wearing Black — residual risk after each mitigation,
   every register item marked closed / still open / made worse. An item nobody
   addressed stays open; silence does not close a risk. Then every seat returns
   one Red line. Same-hat-at-once is the mechanism throughout; a conversation
   between seats is not, and Blue never appears in a prompt.
10. **Decide, then commit.** Every surviving contradiction gets a discrete verdict
    from the Blue hat — accept A / accept B / defer with a stated trigger / block.
    Not a vote: count does not settle truth when the seats share one base model.
    Then close the loop:
    - Blue assigns the work: what, who by name, by when, who verifies. A decision
      with no assignment table has not reached execution. When it feeds an
      implementation plan, hand it to `/writing-plans` — that skill carries the
      decision and does not re-derive it.
    - Every seat commits to executing the decision. This is **disagree and
      commit** — commitment to the action, not agreement that the objection was
      wrong.
    - Dissent is preserved verbatim in a dissent register, each entry carrying the
      observation that would reopen the decision.
    - **Erasing dissent to make the record read unanimous recreates the exact
      failure the Critic seat exists to prevent.** A clean record is not the goal;
      a reopenable one is.
11. **Report the diagnostics** below alongside the findings and the decision.

### Iteration 3 — Go / No-Go, conditional

Runs **only** when iteration 2 surfaced a **new blocking finding of a class
iteration 1 never considered** — a legal or regulatory bar, cost materially past
what was approved (a doubling, say, whether or not a threshold was set in
advance), a dependency that cannot be obtained, a safety exposure. It does not run
for an old objection restated louder, for a preference, or because a seat wants
another turn. If iteration 2 closed cleanly, the review is over.

Blue and Red only: no new seats, no new analysis. The analysis is finished; what
remains is a judgment under uncertainty that will not resolve by looking harder.
Every seat gives one Red line — honest read, no justification, none demanded —
and Blue emits **Go** or **No-Go**.

**No-Go is a legitimate output**, and there is no iteration 4. If Blue cannot
settle it, escalate to the human with both positions, the Red lines, and a named
recommendation — never another round.

## The diagnostics that tell you it worked

| Diagnostic | How to read it |
|---|---|
| **Unique-finding rate per seat** — findings only that seat raised, over its total | The practical stand-in for effective sample size. Below ~10–20% → that seat is decorative: rewrite its criteria checklist, or delete it if it is a specialist. High overlap across the board → differentiate the criteria, not the job titles. |
| **Claims checked / refuted / unverifiable** | A decision resting mostly on unverifiable claims is a bet, not a decision. Say so in the output. |
| **Blocking objections raised** | **Zero is a red flag, not a clean bill of health.** Ready agreement is the expected failure mode of a single-model panel; a panel that blocks nothing has usually not reviewed anything. Re-read the Critic's kill-case before accepting the result. |

## Judgment

The rails fix the mechanics. Yours are the calls they cannot make: **which two
specialists** this artifact warrants beyond the trio; **which contradictions are
real** versus two seats describing one thing differently; **which claims are
decisive** enough to spend verification on, since checking everything is as
useless as checking nothing; and **whether iteration 2's blocking finding is a
genuinely new class** or an old objection at higher volume — that single call is
what iteration 3 turns on.

## Bundled files

- `references/persona-library.md` — filled specs for the mandatory trio and every
  specialist swap-in, plus the template for a new one.
- `references/reviewer-prompt.md` — every dispatch prompt: blind reviewer, Critic,
  verification pass, the It2 five-field form, Blue-hat arbitration (which carries
  the arbiter hygiene rules — discount agreement, ignore length, randomise order,
  warn on self-review), and the decision record.

## Changes

- **0.4.0** — The panel gained a mandatory shape, a hard three-iteration cap, and
  an owned decision at the end. **Disney's Dreamer / Realist / Critic is
  mandatory**, dispatched blind and parallel rather than in Disney's sequence,
  which would recreate the conformity failure this skill exists to avoid. **The
  Critic is the assigned devil's advocate** — 0.3.0 cited that at 99.2% against
  55.0% for a dissent instruction, called them equal alternatives, then shipped
  only the weaker one. A **verification step** checks decisive claims against
  sources, which is where accuracy comes from given personas do not supply it.
  **Six Thinking Hats across the three iterations** replaces the open-ended
  reconcile; the one-rebuttal rule is restated as what it always was, a cap on
  arguing about an *unchanged* artifact, so it does not contradict the iteration
  cap. **Disagree-and-commit with a dissent register** closes it. Diagnostics
  gained claims-refuted/unverifiable and zero-blocking-as-red-flag; the banner's
  "vote on the final call" became "one owner makes the call". Budget 4000 → 5000.
- **0.3.0** — `references/reviewer-prompt.md`'s "do not assign business
  priority" now names where the finding goes instead, so a dispatched reviewer
  escalates rather than drops it.
- **0.2.0** — Dropped the Indonesian trigger phrases under the English-only rule
  (using-dstack 0.7.0: models translate intent, so they cost tokens without adding
  reach). Two became English forms, the third was already covered. Nothing
  preserved as data — this skill matches no Indonesian literal.
- **0.1.0** — Initial. Point-of-view set taken from this user's recurring requests
  (data architect, data engineer, data analyst, UI/UX, novice vs. experienced).
  Design constrained by the evidence rather than the premise: coverage not accuracy
  (Zheng et al. EMNLP 2024 and Wharton GAIL 2025 both negative), differentiation
  not multiplicity (ChatEval's role ablation), union not vote, blind parallel
  dispatch, a one-round arbiter cap, and the unique-finding diagnostic.
