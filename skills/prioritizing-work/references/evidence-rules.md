# Evidence rules

The single source for what may back a number. Read on every round, both
lanes. Where any other file appears to admit something this file
inadmits, **this file wins**.

A closed enum over a fabricated input is still a fabricated output. Every
rule here exists because the scoring machinery downstream is rigorous
enough to make a guess look measured.

## Admissible and inadmissible, per input

| Input | Admissible | Inadmissible |
|---|---|---|
| **Reach** | A named query, dashboard, funnel report, billing or CRM export, or a server log **with a stated date range**. A population count stated by the **operator of the system** — the person who runs it and knows the register — recorded with their name and role | "We think most users…", a stakeholder's guess at demand, a market-size figure, a competitor's published number, a number with no named source |
| **Impact** | A completed A/B test, a measured shipped analogue **in this product**, a fake-door or painted-door result, or ≥5 research sessions with the affected segment **on this specific problem** | Sales anecdotes, one loud customer, a competitor shipping it, a "would you like X?" survey, the model's own reasoning |
| **Effort** | A written estimate from someone who would do the work, or a completed spike or design doc carrying a sizing | A PM's guess, an analogy to another team's project, **an LLM's estimate** |
| **Kano answers** | Responses from real people in the segment | Invented respondents (see the proxy protocol below) |

**The operator exception is narrow.** "We have 412 registered agents,"
from the person who administers the register, is E2. "About 400 of them
would use this," from the same person, is E4 — the first is a count they
hold, the second is a prediction they do not.

## The corrupted Confidence variant — recognise and refuse it

Widely-circulated write-ups map RICE Confidence 100% to "quantitative
data" and 80% to "qualitative data". That replaces a three-factor
**coverage count** with a one-factor **evidence-type test**, and a model
trained on that content will reproduce it silently.

The rule is the count: of {Reach, Impact, Effort}, how many are evidenced
at E2 or better. 3 → `1.0`; 2 → `0.8`; ≤1 → `0.5`.

## Invalid combinations — reject before the score prints

| Combination | Why |
|---|---|
| Estimated Reach with no named source **and** Confidence `1.0` | Launders a fabricated number as evidence |
| An Impact justification containing a population count | Reach has been double-counted inside Impact. Re-score the row |
| Reach already reduced by an adoption probability **and** Confidence lowered for the same doubt | Discount once. Adoption probability lives in Reach; evidence quality lives in Confidence |
| A `done` tier claim with an empty provenance cell | R3 — the row is E4 whatever it claims |

## The `UNSCORABLE` protocol

`UNSCORABLE` is a legal, complete answer. It is not a failure to do the
work; it is the work.

1. Name the **missing field**, not the item: `UNSCORABLE — Reach: no
   query, dashboard, or operator count exists for agents reaching the
   filter bar`.
2. Name the **cheapest thing that would fix it**, with a person-day cost:
   `0.5 pd: count distinct agents hitting /dashboard/search over 14 days`.
3. Leave it out of the ranking. Do **not** score it low. A low score is a
   claim; `UNSCORABLE` is the absence of one.
4. When effort alone is missing, the fallback is one S/M/L pass converted
   through the round's declared constant (default `S=2, M=8, L=21`
   person-days), and every row so converted is labelled `S/M/L`. The
   constant is echoed in the round header. This is a declared
   approximation, not evidence — it never raises a row above E3.

**Never substitute "medium".** A default midpoint is a fabricated number
wearing a hedge, and it is indistinguishable from a measured one three
weeks later.

## Provisional mode

When R6 blocks the round (`UNSCORABLE` > 30%, or E4 > 50%) but a decision
genuinely cannot wait, a `PROVISIONAL` ordering is permitted under all
five conditions:

1. Every row carries the literal tag `PROVISIONAL`.
2. It is built from **Stage 2 only** — prerequisite edges, dated
   obligations, and falsifier cost. No RICE score, no Kano coefficient,
   no value/effort ratio appears anywhere.
3. It names the **one measurement** that would replace it, with a cost.
4. The header states `PROVISIONAL — not a scored result` on its own line.
5. It expires: name a date or an event after which it must be re-run.

A provisional order presented as a scored result is the failure this mode
exists to prevent. The point is to be useful without pretending.

## The proxy protocol — no user data, which is the normal case

When there are no respondents and no production data, Kano may still run,
but its output is **hypotheses**, never measurement.

1. Score as **named personas**, each with a written one-line profile, one
   per real segment. "The user" is invalid.
2. Cite an artifact per answer — a ticket id, a quoted utterance, a
   session recording, a churn reason, a competitor teardown — or mark the
   answer `ASSUMPTION`.
3. Use ≥3 blind scorers, then reconcile and **print the disagreement
   rate**. Above 30% the whole set downgrades to E4.
4. Run one **adversarial pass** whose only jobs are to argue that each
   `A` (attractive) call is really `I` (indifferent), and to name the `M`
   (must-be) attributes nobody proposed because everyone assumes them.
   **Stopping rule:** an `A` stands unless the adversary names a real
   artifact against it. Without that rule the pass raises variance
   instead of lowering it.
5. Every `A` call names the one customer utterance that would falsify it.
   **That list is the interview script** — it is the most valuable thing
   a proxy round produces.
6. Label the artifact `HYPOTHESES`.

**Stated cost, so nobody pretends otherwise.** Proxy Kano systematically
under-detects Must-be — the one category that gates everything else —
inflates Attractive toward whatever the team already wanted to build, and
almost never assigns Indifferent, which is Kano's most valuable output.
Treat a proxy round that finds no Indifferent attributes as evidence the
panel was not adversarial, not as evidence the backlog is strong.
