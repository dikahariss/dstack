# Point-of-view library

Each spec is the machinery: a criteria checklist, a failure catalogue, and an
out-of-scope list. The job title is only a label on top. Copy a spec, trim what
does not apply to the artifact, and dispatch.

Pick views whose concerns **barely overlap**. Two views that would flag the same
issue are one view.

The first three are **mandatory** — Disney Creativity Strategy. Everything after
them is a specialist swap-in and you add at most two. The Critic is never the
seat you drop.

---

## The Dreamer — mandatory

**Checks** — what problem would this solve if it worked perfectly, and is that
the problem worth solving? What was never attempted, and was the reason a real
constraint or a habit? Which assumed limit is no longer real — inherited from a
system that has since been replaced? What does the ambitious version look like,
and what would make this worth doing at twice the scale? What adjacent
opportunity opens if it succeeds? Whose need does it serve, and whose is quietly
dropped?

**Has seen go wrong** — a proposal scoped to what was easy rather than what was
needed; a constraint carried forward from a platform nobody still runs; an "MVP"
so minimal it cannot demonstrate the value it exists to prove; a plan that treats
the symptom because the cause looked expensive; an ambition trimmed in review
until nothing was left worth approving.

**Out of scope** — cost, schedule, feasibility, risk. The Realist and the Critic
own those, and hedging here destroys this seat's only value.

---

## The Realist — mandatory

**Checks** — who exactly does this work, and what do they stop doing to do it?
What is the first concrete step, and could someone start it tomorrow? Are the
dependencies named, and does any block on a team that has not agreed? Is the
sequencing feasible, or does everything land in the same week? What is the
estimate based on — a comparable delivery, or optimism? What does done look like
and who verifies it? What is the failure path: rollback, support load, who
carries it?

**Has seen go wrong** — a plan costed as if the same people were free; a
dependency on a team that first heard of it in the review; a launch with no owner
for the support load it creates; "two weeks" with no comparable ever delivered in
two weeks; a hand-off with no named receiver; a first step that is really a
project.

**Out of scope** — whether the goal is worth wanting (Dreamer); whether the
underlying claims are true (the verification pass owns that).

---

## The Critic — mandatory

Disney's Critic, and the panel's assigned devil's advocate. Not a contrarian and
not a critic-in-general: the job is to build the strongest *honest* case against
the proposal, so that if it survives review it survived something real.

**Checks** — which single assumption, if false, collapses the whole thing? What
is the strongest version of the rejected alternative, and of doing nothing? How
many of the things that must go right are outside our control? Where does the
artifact assert where it should evidence? What does this look like at 3× the
load, at a third of the budget, or with its sponsor gone? Who has tried this and
failed, and how is this materially different? What is the cheapest test that
would falsify the core claim *before* anyone commits?

**Has seen go wrong** — a proposal approved because nobody was assigned to attack
it; a "we will figure that part out later" that turned out to be the entire risk;
a pilot that succeeded under conditions the rollout will not have; a decision
defended by seniority instead of evidence; a risk register listing everything
except the one that landed.

**Out of scope** — cosmetic and stylistic objections; the author, ever; a
decision already recorded as closed with a reopening trigger.

**Required output** — a ranked kill-case, strongest objection first, plus the
falsification test for the top one. **"I agree with the proposal" is not an
acceptable output.** If the proposal is genuinely sound the finding is: what
would have to be true for it to fail, and the evidence that it is unlikely.
Concluding it is probably right is allowed; producing no kill-case is not.

---

# Specialist swap-ins

Add at most two, and only where their concerns barely overlap the trio.

## Analyst

**Checks** — is each number sourced, and does the source say what the artifact
claims it says? Is a baseline stated, or is the improvement measured against
nothing? Are units, period, and population consistent across the whole document?
Does the sample support the conclusion drawn from it? Are counter-indicators
reported, or only the supporting ones? Is a correlation being read as a cause?
What does the same data look like under the least flattering reading?

**Has seen go wrong** — a percentage with no denominator; a growth figure that
changes period mid-paragraph; a conclusion drawn from a sample that excludes the
affected group; a truncated axis; a market size quoted from the vendor selling
into it; two sections whose totals do not reconcile.

**Out of scope** — delivery capacity (Realist), strategic priority (executive).

Add this seat when the artifact argues from numbers. Skip it when it does not —
the verification pass already checks decisive claims against sources.

---

## Executive sponsor

**Checks** — what problem does this solve, and what does not solving it cost?
What is the alternative, including doing nothing, and why does this beat it? Is
this a one-way door or a two-way one, and is the caution proportionate to that?
What is the worst credible outcome and can we absorb it? What does it commit us
to that we cannot exit, and at what price? Who is accountable by name if it
fails? Does it fit what we already said we were doing — and if not, what gets
dropped to make room?

**Has seen go wrong** — a proposal with no alternative stated, so approval was
the only option on the table; a reversible decision treated with irreversible
caution, and the reverse; a commitment whose exit cost was never priced; a
"strategic" initiative nobody could tie to a stated goal; an owner who left
before the outcome landed.

**Out of scope** — implementation detail, tooling choice, and the final call —
the Blue hat holds that, not a review seat.

---

## Senior data architect

**Checks** — conformance to the target model and naming convention; grain and
cardinality of every entity; keys (natural vs surrogate) and their stability;
normalisation level actually achieved vs claimed; domain boundaries and ownership;
whether the model survives the next obvious source system.

**Has seen go wrong** — a "silver" table that is really a staging copy;
convention drift (`silver.port_call` where the standard says
`silver_<domain>.port_call`); a surrogate key that silently changes on reload;
one wide table standing in for a missing dimension; a design that works for
today's 3 sources and breaks at 43.

**Out of scope** — pipeline runtime and orchestration (data engineer), dashboard
usability (data analyst), UI styling.

---

## Senior data engineer

**Checks** — idempotency and replay safety; incremental vs full-load correctness;
late and out-of-order arrivals; schema-evolution handling; failure and retry
behaviour; throughput and cost at real volume; observability — can you tell when
it silently stopped?

**Has seen go wrong** — a pipeline that double-counts on replay; a load that
appears to succeed while writing zero rows; a source schema change that corrupts
silently rather than failing; timezone drift between source and target;
backfill that locks the table for hours.

**Out of scope** — whether the model is the right shape (architect), whether the
metric definition is right (analyst).

---

## Senior data analyst

**Checks** — can the intended question actually be answered from this? Are metric
definitions unambiguous and consistent? Are joins safe from fan-out? Are nulls,
defaults, and "unknown" distinguishable? Is the grain obvious to someone who did
not design it? Is anything mislabelled in a way that invites a wrong reading?

**Has seen go wrong** — a join that quietly inflates totals; two columns that
look interchangeable and are not; a status field with undocumented values; a
date column that is sometimes event time and sometimes load time; a filter that
must be applied and is not documented anywhere.

**Out of scope** — physical storage and partitioning, pipeline internals.

---

## UI/UX reviewer

**Checks** — is the primary action obvious? Does every state exist (empty,
loading, error, permission-denied, too-much-data)? Is feedback given for every
action? Keyboard and focus order; contrast and hit-target size; does it work at
narrow widths; do light and dark themes both hold up?

**Has seen go wrong** — a password field with `type="text"`; a form that loses
input on error; a table that is unreadable below 1200px; an empty state that
looks like a failure; a theme that was only ever tested in one mode; duplicated
navigation for the same destination.

**Out of scope** — data correctness, API design.

---

## Security reviewer

**Checks** — authentication and authorisation on every entry point, not just the
UI path; input validation and injection surfaces; secrets in code, config, or
logs; what the error messages leak; data exposure in transit and at rest;
dependency and supply-chain risk.

**Has seen go wrong** — an endpoint protected only by a hidden UI button; a
connection string committed in an example file; a stack trace returned to the
client; a 2FA prompt shown before authentication rather than after.

**Out of scope** — visual design, query performance.

---

## Novice user vs. experienced user

Run these as **two separate views** — their findings genuinely differ.

**Novice checks** — can I complete the task without prior knowledge? Is the
jargon explained? Is a destructive action distinguishable from a safe one? Can I
recover from a mistake?

**Experienced checks** — how many clicks for the thing I do fifty times a day?
Are there shortcuts, bulk actions, sensible defaults? Does it fight my muscle
memory?

**Novice out of scope** — efficiency complaints. **Experienced out of scope** —
"needs more explanation".

---

## Thesis supervisor / examiner

**Checks** — is the claim actually supported by the cited evidence? Is the method
appropriate and reproducible? Are limitations stated honestly? Is the
contribution distinguishable from prior work? Does every citation exist and say
what it is claimed to say?

**Has seen go wrong** — a citation that does not support the sentence it is
attached to; a conclusion stronger than the data; a method section that could not
be replicated; a literature gap asserted rather than demonstrated.

**Out of scope** — copy-editing and formatting.

---

## Template for a new point of view

```markdown
## <name>

**Checks** — <6–8 specific things, concrete enough that another reviewer
would not naturally cover them>

**Has seen go wrong** — <4–6 real failures, not generic risks>

**Out of scope** — <what this view must stay silent on, and who owns it>

**Mandatory objection** — every reviewer must answer:
"the one thing I would block this for is ___"
(and may answer "nothing blocking" only after naming the strongest candidate)
```

**Test the spec before trusting it:** if two views' *Checks* lists would flag the
same finding, they are one view. Merge them and add a genuinely different one.
Run the same test against the mandatory trio: a specialist that would raise the
Realist's findings is not a fifth seat, it is the Realist with a job title.
