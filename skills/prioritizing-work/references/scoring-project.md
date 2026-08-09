# PROJECT lane — MoSCoW, then value ÷ effort

Read when Stage 0 returned `LANE: PROJECT`. MoSCoW **classifies**;
value ÷ effort **orders inside one letter**. MoSCoW deliberately produces
no order within a letter — that is what the ratio is for, and a ranking
that crosses letters has misused both.

Quote the verbatim band row beside every number you print (R7).

## Before the gate

- **Decompose oversized items.** An item above 20 person-days hides a
  mixture of letters inside one label.
- **Split acceptance criteria.** "Restore **must** happen within 24h" is
  a `Must`; "restore **should** happen within 4h" is a `Should`. One
  requirement, two letters, and merging them inflates the Must pool.
- **Write out the primary user journeys** in the round header, before any
  labelling. T4 can only cite a journey named there. Inventing a journey
  during labelling is invalid — that is how everything becomes essential.

## The `Must` gate

**Start every item at `Won't this time`.** Promote only through the gate.
A `Must` needs **one trigger fired** AND **both filters passed** AND
**valid dependencies**, each with recorded evidence.

| Check | Passes when | Evidence the row must carry |
|---|---|---|
| **T1** committed | The item is a named commitment in the deliverable document that Stage 0 rung L2 identified | The **deliverable id or acceptance-matrix row id**, which must also appear in the round header. If no L2 document exists, **T1 is unavailable** — it cannot be cleared with prose |
| **T2** legal | Shipping without it breaches a written external obligation enforceable by a named regulator, auditor or counterparty, **and the enforcement window opens on or before the timeframe end** | The regulation or contract **+ article/clause + date**. Invalid: "compliance best practice", "our security policy", "the audit is next year" |
| **T3** safety | Absence causes physical harm, unrecoverable data loss, irreversible financial loss to a user, or one tenant's data exposed to another | The **mechanism**, not the worry. Valid: "without tenant-scoped queries, account A can read account B's invoices". Invalid: slow, ugly, confusing, no audit trail |
| **T4** viability | A journey **named in the header before labelling began** has **no path to completion at all** without it | The journey name **+ the exact step where the user is stuck**. "Is worse", "more clicks", "loses the value proposition" all fail |
| **F1** stop-the-ship | Told the night before deployment that this is broken, a named individual with authority halts the release rather than ship | The role name **and the recorded statement, decision, or document where that person set the condition**. An unasked person cannot halt a release. "The team feels", "stakeholders", "users would be furious" are not answers |
| **F2** workaround | You **cannot** write one sentence describing a workaround a real person could execute on deploy day with resources already available | `None`, or the workaround sentence — which forces Should or Could |
| **D** dependency | It depends on nothing that is not itself a `Must` | The blocking item ids. Depending on a non-`Must` **invalidates** the Must: promote the dependency or demote this item. Never leave the pair inconsistent |

### The two bypasses, stated literally

Both are intuitive, both are wrong, and neither is blocked by the table
alone.

1. **Pain-pleading** — *"a workaround exists BUT it is painful, so
   `Must`."* Painful means `Should`. The cost and ugliness of a
   workaround decide Should vs Could; they never restore a `Must`.
2. **Scope restatement** — *"the requirement is the **automated** export;
   a manual Save-As is not the requirement, therefore no workaround
   exists."* A workaround is evaluated against **the user's outcome**,
   never against the item's stated implementation. If the person ends the
   day with the file they needed, a workaround exists.

## Should vs Could

Fix the thresholds **before** requirements are listed. Record the
**number**, then the comparison, then the letter. A letter with no number
behind it is a defect, not a score. `period` is a round-header constant
(default: one month).

| Letter | Rule (defaults when the user supplies none) |
|---|---|
| `Should` | Above any threshold: the workaround affects **≥25%** of the named user population, **or** costs **≥8 person-hours per period**, **or** **≥1% of period revenue** |
| `Could` | Below all three. This is the contingency pool and the **first thing dropped** when the date is at risk |
| `Won't this time` | Agreed out of **this** timeframe. The string reads `Won't this time — revisit at end of <named timeframe>`. Never a bare `Won't`, never `rejected`, never `never`. Kept on the list so it cannot be informally reintroduced, and **excluded from all arithmetic** |

## Effort share — the full rule

```
M = Σ effort(Must)   S = Σ effort(Should)   C = Σ effort(Could)
P = M + S + C                        ← Won't is NOT in P
Must%   = 100 × M / P     Should% = 100 × S / P     Could% = 100 × C / P
```

One decimal, half up, **then** compare. The 60/20/20 shape is DSDM's, and
the reason is contingency: `Could` is the buffer that absorbs an
estimation miss without moving the date. A round with no `Could` pool has
no way to absorb anything and will move the date instead.

**AT-RISK exemptions (60.1–70.0%)** — all four required, any unknown
counts as `No`:

1. Historical estimate variance within ±20% on comparable work by this team.
2. This team has shipped this stack, domain and toolchain before.
3. Team intact and delivering for ≥3 completed timeboxes.
4. Zero third-party dependencies, approvals, or shared-resource
   contention inside the timeframe.

**The forbidden cure, with its arithmetic.** Dropping `Could` items to
fix a `Must` breach shrinks `P` and therefore **raises** `Must%`:

```
add a 13 person-day Must:   M = 110, P = 182  →  60.4%   (breach)
"drop a 13 pd Could":       M = 110, P = 169  →  65.1%   (WORSE)
```

The only three legal cures: **demote or decompose Must effort · add
capacity · move the date.** A new mid-flight `Must` is paid for with at
least equal demoted `Must` effort, after which the arithmetic is re-run
and the `Could%` verdict re-reported.

**Structural check.** Each letter holds ≥5 items, and no single item
exceeds 25.0% of its own letter's effort. Below either, report
`DEGRADED`: the percentages are decoration until the dominant item is
decomposed.

## Value ladder

Orders **within one letter** only. Direct anchors — project work has no
countable reach, and forcing a reach term here is a fabrication vector.

| Value | Anchor |
|---|---|
| `10` | The deliverable fails without it |
| `8` | A stated acceptance criterion of the commissioner moves, **with a named target number** attached |
| `7` | A deliverable named in the commissioner's document, with **no target number** attached |
| `6` | A named **primary** metric moves by a stated amount |
| `3` | A named **secondary** metric moves by a stated amount |
| `1` | Internal convenience; no named metric moves |

`2, 4, 5, 9` are legal only as interpolations between two adjacent
anchors, and the row names which two.

**Deadlines never enter the value score.** A dated obligation is
sequenced by date at Stage 6; folding the date into value inflates the
number and hides the reason it is early. Rung `7` exists because the most
common project item — "the commissioner asked for it, it is in the
acceptance matrix, no number attached" — would otherwise have to choose
between `10` and `1`.

## Effort ladder

Absolute person-days for the **whole delivery**: discovery, design,
build, test, docs, rollout, and first-month support capped at **10% of
build effort** unless a measured figure exists. Not coding time. **Not
calendar time** — two people for five days is 10, not 5. Ranges take the
**upper** bound. Bands are absolute, so a score never changes when other
items enter or leave the round.

| Score | `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` | `9` | `10` |
|---|---|---|---|---|---|---|---|---|---|---|
| person-days | ≤1 | 2–3 | 4–5 | 6–8 | 9–13 | 14–20 | 21–30 | 31–45 | 46–70 | >70 |

Bounds are inclusive as written: exactly 13 pd is `5`, exactly 14 pd is
`6`. Anchors for sizing: `1` a config or copy change with no design and
no migration · `3` one screen or one endpoint on existing patterns · `8`
a feature across 2–3 layers with a migration · `20` a subsystem: new
model, screens, tests, rollout · `≥45` a programme — decompose before
scoring. No estimate from someone who would do the work → `UNSCORABLE`.

## Quadrant and order

**The threshold is absolute and identical on both axes: `HIGH = ≥6`.**
Never the median of the set — a median makes every score depend on what
else is in the round, which is why two runs on different subsets
disagree.

| | Effort LOW (`≤5`) | Effort HIGH (`≥6`) |
|---|---|---|
| **Value HIGH (`≥6`)** | **Quick win** — `DO_NOW`, schedule this cycle | **Big bet** — `PLAN_ONE_AT_A_TIME`: written case, named owner, decomposed into shippable slices, at most one in flight |
| **Value LOW (`≤5`)** | **Fill-in** — `BACKFILL_OR_DROP`: only with genuine slack; drop next round if unstarted | **Money pit** — `KILL_OR_RESCOPE`: do not schedule; kill it or re-scope until a band moves, then re-score |

**The order is the ratio `R = value ÷ effort`, two decimals, descending.
The quadrant is only a label.** Report both: two items in different
quadrants can share an `R`, and the quadrant alone would recommend
opposite actions for equal priority.

`R` is computed from **band scores, not person-days**, so it is coarse by
construction: 5 pd and 6 pd sit one band apart and move `R` by 25%, while
46 pd and 70 pd share band `9` and move it not at all. The **15% tie band
(R12) applies here too** — `3.33` does not beat `3.00`. Ties break on
lower effort, then item id.

## Worked round

Timeframe `Increment`, ends 2026-10-31 · effort person-days · capacity 40
pd · period = 1 month · journeys: *submit a filing*, *retrieve a filing
receipt* · Should threshold: ≥25% of 120 named filers.

| Item | Gate result | Letter | Value | Effort | `R` |
|---|---|---|---|---|---|
| A Filing submission API | T1 `DLV-04` · F1 `Head of Filing Unit, minuted 2026-08-02` · F2 `None` · D clear | `Must` | 10 (band: deliverable fails without it) | 18 pd → `6` (band 14–20 pd) | 1.67 |
| B XLSX export replacing CSV | T1 `DLV-11` · F2 **fails**: "open the CSV in Excel and Save As .xlsx" | `Should` | 7 (band: named in the document, no target number) | 5 pd → `3` (band 4–5 pd) | 2.33 |
| C Receipt lookup screen | T4 fires: journey *retrieve a filing receipt* has no completion path · F2 `None` · D blocked_by A | `Must` | 10 | 9 pd → `5` (band 9–13 pd) | 2.00 |
| D Bulk re-submit | no trigger fires | `Could` | 3 (band: secondary metric) | 12 pd → `5` | 0.60 |
| E Dark mode | no trigger fires | `Could` | 1 (band: no named metric) | 4 pd → `3` | 0.33 |

```
M = 18 + 9 = 27    S = 5    C = 12 + 4 = 16    P = 48
Must%   = 100 × 27 / 48 = 56.3   → PASS  (≤ 60.0)
Could%  = 100 × 16 / 48 = 33.3   → DELIBERATELY LARGE — stated as a choice
```

Structural check: each letter holds fewer than 5 items → **`DEGRADED`**.
The percentages are reported with that label attached, not as a verdict.

Order inside `Must`: C (2.00) then A (1.67) by ratio — **but override 2
reverses it**, because C is `blocked_by` A. Final: A, C, B, D, E.

`## Order departs from score` — *C outranks A on ratio (2.00 vs 1.67) but
is sequenced after it: C is blocked_by A.*
