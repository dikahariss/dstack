# Worked example — one request, end to end

> "Add a bulk-upload page so operators stop uploading one by one."

## Stage 1 — framed

Operators re-key 40–60 records daily, each single upload costing ~90 s of
waiting (`OBSERVED`, two mornings at one counter). The why-chain: *bulk upload* →
why? → *re-keying is slow* → why does that matter? → *the day's registrations do
not clear* → **the problem is registration throughput.** Bulk upload was one
design for it; a pre-validated file drop and an API from the source system are
others, and neither is ruled out by the problem statement.

## Stage 2 — goal

| Goal | Baseline | Target | Measured by | Owner | Review |
|---|---|---|---|---|---|
| PRIMARY — a day's registrations clear within the day | 75 min median per 50 records | under 10 min | audit log, first-to-last timestamp per operator per batch | registration service owner | 30 days |
| GUARDRAIL — data quality does not pay for speed | 4% rejected submissions | must not exceed 4% | same log | as above | weekly |

**Why this metric:** the problem is elapsed time per batch, and this measures
exactly that. **The cheapest way it could move without the problem being
solved:** operators split one batch into five small ones, so per-batch time
falls while the day's total does not. Guard: the target is per 50 records, not
per batch.

## Stage 2.5 — viability

Cost: one endpoint, one parser, one screen — days, not weeks. Value: 65 minutes
per operator per day. Kill criterion: if the source data does not arrive in a
machine-readable form at all, the bottleneck is upstream and this is the wrong
fix. **Verdict: PROCEED.**

## Stage 3 — actors

| Actor | Class | Today | Must do differently | Evidence |
|---|---|---|---|---|
| Counter operator | ACTS ON | re-keys from a paper manifest | submits the batch in one action | `OBSERVED` |
| Applicant | IS ACTED UPON | waits | nothing — *effect borne:* registered same day | `INFERRED` |
| Supervisor | DOWNSTREAM | chases the backlog | reads a rejection report instead of chasing | `REPORTED` |

Observation is what produced the manifest detail below. Reasoning about CSV
never would have.

## Stage 5 — the requirements

`BR-1` The registration backlog clears within the working day. (← Goal)
`SR-2` An operator can submit a whole batch in one action. (← `BR-1`)

| | Requirement |
|---|---|
| ✗ | `FR-4` The system should handle large uploads quickly and be user-friendly. |
| | Three failures at once: not singular (two requirements), not verifiable ("quickly", "user-friendly"), traces to nothing. |
| ✓ | `FR-4` The system accepts a CSV of up to 500 records in one submission. (← `SR-2`, MUST) |
| ✓ | `FR-5` On a row that fails validation, the system rejects that row, accepts the rest, and returns the failed row numbers with a reason for each. (← `SR-2`, MUST) |
| ✓ | `FR-6` An operator can correct rejected rows from a printed manifest carrying handwritten corrections, without re-uploading the accepted rows. (← `SR-2`, MUST) |
| ✓ | `NFR-2` A 500-row submission completes within 30 s at p95. (← `BR-1`, SHOULD) |

Where each came from:

- `FR-4` — the request, made singular and given a bound.
- `FR-5` — asking what happens when the input is **partly** wrong. Most real
  requirements live in the partial-failure case, and almost none of them are in
  the original request.
- `FR-6` — watching the work. The source batch is a marked-up paper manifest
  with handwritten corrections, so a re-upload-everything flow would have been
  built and then abandoned. This is the requirement that justifies Stage 3's
  evidence discipline on its own.
- `NFR-2` — a pass condition on the thing the goal actually measures.

## Stage 6 — trace check

`BR-1` → `SR-2` → `FR-4`, `FR-5`, `FR-6`; `NFR-2` → `BR-1`. Downward: `BR-1` has
a child, `SR-2` has three, nothing dangles. Priority: 3 MUST of 4 — over the
half rule, so either `FR-6` moves to SHOULD with a stated consequence, or the
first cut is honestly one requirement smaller.

## What the example is meant to teach

1. The named solution is never the problem.
2. A metric without a gaming check is a metric that will be gamed.
3. The requirement nobody asked for is usually the one that matters
   (`FR-5`, `FR-6`).
4. An `FR` that only rewords its `SR` fails **Necessary** — that is level
   collapse, and it is the most common failure in a four-level document.
