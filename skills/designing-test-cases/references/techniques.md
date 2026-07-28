# Derivation techniques

Pick by shape, not by habit. Shapes **compose**: a condition containing a range
carries its own boundary analysis, and a guarded state transition needs both.

| Shape | Technique | Rough size |
|---|---|---|
| Range, size, count, date window | equivalence partitioning + boundary values | 1 per class, plus 2–3 per boundary, deduped |
| Conditions combining into outcomes | decision table | 1 per surviving rule + 1 probe per collapse |
| A lifecycle with states | state transition | the full state × event matrix |
| Who may act on whose object | authority matrix | see below — never collapsed |
| 3+ independent parameters | pairwise | the largest pair product, roughly |
| A threshold on a distribution | workload + sample + percentile | 1 per workload shape |
| A universal negative | sink enumeration + absence scan | 1 per sink, plus a completeness check |
| Free-form input, or an unwritten rule | error guessing | from the catalogue, bounded by risk |

---

## Equivalence partitioning

Split each variable into classes the **specification gives the same reason** to
accept or reject. Not "the same code path" — you cannot see the code, and if you
could you would be deriving from the wrong artifact.

One case per class. Partition the invalid side by *reason*: "too large" and
"wrong type" are different classes even though both are rejected.

> Rule: *quantity must be 1–99.*
> Valid `1–99` → `50`. Invalid-low `≤0` → `0`. Invalid-high `≥100` → `150`.
> Invalid-type → `"abc"`. Invalid-absent → missing.

Five cases, five different reasons to fail. A set with `50, 51, 52` has one class
three times.

## Boundary value analysis

Defects cluster at partition edges.

- **2-value**: the boundary and its nearest outside neighbour. For `1–99`:
  `0, 1` and `99, 100`.
- **3-value**: also the inside neighbour. Use where an off-by-one is expensive
  or the boundary logic is hand-written rather than a library range check.

**Deduplicate against the partition cases.** `0` is both the invalid-low
representative and the lower outside neighbour — write it once.

Boundaries are not only numeric: empty and single-element collections, the first
and last day of a period, the first and last row of a page, zero-length and
maximum-length strings, single-byte to multi-byte.

**Name where the boundary comes from.** "500 records" is 500 of what, measured
over what window, per which actor — and is it fixed by a regulation, a contract,
a config key, or a field validator? A boundary set aimed at the wrong number is
perfectly formed and useless.

## Decision table

List the conditions, enumerate the combinations, write the action per
combination, then **collapse**: where a condition cannot change the outcome, mark
it `—` and merge.

> *A discount applies if the customer is a member AND the order exceeds 1M,
> unless the item is already discounted.*

| # | Member | Order > 1M | Already discounted | Discount |
|---|---|---|---|---|
| R1 | yes | yes | no | **yes** |
| R2 | yes | yes | yes | no |
| R3 | yes | no | — | no |
| R4 | no | — | — | no |

Four cases, not eight. The `—` cells make the collapse auditable.

**Every collapse is an assumption, so probe it.** Add one *don't-care probe* per
collapsed rule: a single case varying one dashed condition. If the
implementation branches on `already discounted` before checking membership, the
probe is the only case that finds it. One row per collapse is the cheapest
insurance in the document.

`Order > 1M` contains a boundary. Derive it: is exactly 1,000,000 a hit? Carry
the boundary inside the rule's case rather than adding a second case for the same
rule.

**Stop when** every surviving rule has one case and every collapse has one probe.

## State transition

**Draw the full state × event matrix** — every state against every event. Prose
enumeration drops cells silently; a matrix makes the omission visible.

Each cell is either the resulting state or a specific refusal. Cells you
deliberately leave untested become gap rows.

1. One case per **valid** transition — the baseline.
2. Every **invalid** cell a real caller could reach. The privilege-shaped ones
   matter most: approving something that was returned rather than resubmitted,
   re-approving an approved record, acting on a draft.
3. Each **terminal** state: reachable, and every outbound event leaves it
   unchanged.

**Stop at 0-switch** — one case per single transition — unless a defect history
says sequences matter. 1-switch grows fast and rarely repays it.

## Authority matrix

A permission rule *is* a decision table, and collapsing it is how cross-tenant
access ships. **Never collapse a condition that is the subject, the role, the
tenant, or the object's owner.** The entire deny space satisfies "cannot change
the outcome" and folding it produces one case for a whole matrix.

Per action, derive:

- one **permit** case;
- one **deny** case per non-permitted role — no collapsing;
- one case where the object belongs to **another owner** and the caller's role
  *would* permit it on their own object;
- one case where the target **does not exist**, whose response must be
  byte-identical to the unauthorised one — otherwise the denial discloses
  existence;
- **fail-closed**: the attribute the decision depends on is missing or stale.
  A session claim captured at login and used after the user was reassigned is
  the classic one.

Session lifetime, idle versus absolute timeout, and post-logout token replay are
boundary values — derive them there, not here.

## Pairwise

Most interaction defects involve **two** parameters. Cover every pair at least
once rather than every combination.

> 4 payment methods × 3 delivery types × 3 tiers × 2 channels = 72 combinations.
> Every pair is covered by roughly 12 cases.

The floor is the product of the two largest parameter sizes — for 3×3×2 that is
exactly 9, and 9 is optimal, not "usually fewer". Build greedily from the
highest-risk combination, adding the row that covers the most uncovered pairs.

**Exclude infeasible combinations explicitly** (cash payment × international
delivery) before generating, or mechanical generation emits them as real cases.
Record which pairs each row covers, so the coverage claim is checkable.

## Threshold on a distribution

A latency or throughput target is not an input partition — you do not supply the
number, you measure it. Boundary values at 29.9 s and 30.1 s are meaningless.

Per performance criterion, state all six or the case is not a case:

| | |
|---|---|
| **Workload** | request mix, concurrency, arrival pattern |
| **Data volume** | rows in the store, size of the payload |
| **Environment** | which machine, warm or cold, what else is running |
| **Sample** | how many runs, discarding how many warm-ups |
| **Statistic** | p95 of what, measured from which point to which point |
| **Error ceiling** | the failure rate above which the timing is meaningless |

The oracle is **distributional**: `p95 of 20 runs ≤ 30 s, error rate 0`. That is
one verdict computed over a sample, not one observation.

Derive at least: the nominal workload, the worst-path workload (everything
invalid), a concurrent workload, and one with a slow dependency.

## Universal negative

"Personal data must never appear in logs" quantifies over **sinks and
executions**, not over inputs. There is no input class for it.

1. **Enumerate the sinks** — application log, access log, slow-query log, APM
   trace, crash dump, error response, export file, notification, cache, backup,
   and the uploaded artifact itself.
2. One absence-scan case per sink, on the path most likely to leak: the failure
   path, the crash path, the debug-level path.
3. One case for the **wrong-column** input — the protected value pasted where it
   is not expected, which defeats field-name-keyed redaction.
4. A **completeness** case: the sink list itself is reviewed against the request
   path. This one is `human`; nothing else can prove the list is complete.

**Absence scans are weak by construction** — a system that writes no logs at all
passes every one. Say so in the gap list. And consider whether the honest answer
is a design change: a type that makes the protected value unloggable is a
stronger control than any number of scans, and belongs in the spec.

## Chaos — construction, not a word list

Pick the fault, the injection point, and the **degraded contract** — what the
system must still guarantee while the fault holds. "An error is returned" is not
a contract.

| Fault class | Injection point | Degraded contract to assert |
|---|---|---|
| Dependency down | the client or the network | fail closed, specific error, no partial write |
| Dependency slow | injected latency | the timeout fires before the caller's, and says so |
| Storage partial write | kill after N rows | the persisted count is one of the two legal values, never a third |
| Duplicate delivery | replay the same message | the effect happens once |
| Out-of-order delivery | reorder two messages | the final state is the same, or the older one is rejected |
| Clock | skew, leap day, DST | no expiry computed backwards |
| Concurrency | two callers, same instant | exactly one wins, and the loser is told |
| Cancellation | abort mid-flight | no half-applied state |

A chaos case must be **deterministically injectable** — name the hook. A
non-deterministic chaos case gets muted within a month, and a muted case still
counts in the coverage table unless you mark it quarantined.

## Error guessing — the failure catalogue

| Category | Try |
|---|---|
| Absence | null, empty string, empty collection, missing field, whitespace only |
| Size | zero, one, maximum, maximum + 1, far beyond maximum |
| Type | wrong type, string for number, array for object |
| Encoding | unicode, emoji, RTL, combining characters, invalid UTF-8 |
| Structure | malformed, truncated, duplicate keys, extra fields, deep nesting |
| Injection | quotes, angle brackets, path separators, template delimiters, spreadsheet formulas |
| Multi-fault | two fields invalid at once — all errors or first-error-wins, and is it deterministic? |
| Ordering | unsorted, reversed, duplicates, out-of-order delivery |
| Timing | expired, not yet valid, timezone edge, leap day, clock skew |
| Concurrency | two callers, cancel mid-flight, retry after partial success |
| Authority | wrong role, revoked session, another tenant's identifier |

**Injection needs a sink, not just an input.** The oracle is "the payload is
inert where it lands" — the SQL, the rendered HTML, the shell, the file path,
the log line, the spreadsheet cell. Without naming the sink you get
"input was rejected" cases and miss stored, second-order injection entirely.

## Choosing the oracle

The expected result must come from somewhere other than the code under test.
Ranked strongest first:

1. The specification states it explicitly.
2. A property that holds regardless of implementation — the sum is unchanged,
   the operation is idempotent, the inverse round-trips.
3. A distribution over a sample, for a threshold criterion.
4. A prior known-good version, for a refactor with no behaviour change.
5. Human judgement — legitimate, but mark it `human` **and give it a rubric**:
   what a pass looks like, in words a second judge would apply the same way.

Where exactness is impossible, state the **tolerance**: floating-point epsilon,
timestamp window, order-insensitive comparison, "within N%".

"No error was thrown" is not an oracle. Neither is "the result matches what the
function returns".

## Where to stop, overall

Stop when the next case would exercise a path an existing case already
exercises. Then write the gap list: what you chose not to cover and which risk
that accepts. A bounded set with a stated boundary is defensible; an unbounded
one that stopped when the author got tired is not.

## Two bias checks before publishing

1. **Could this whole set pass against an implementation you know is wrong?**
   Construct one — ignores the boundary, returns a cached answer, drops the
   failing row silently. Record which case caught it, or add the one that would.
2. **Could it pass against a system whose client the caller controls?** The
   mistaken user sends a malformed field; the adversary swaps an identifier in
   the URL, re-enables a disabled control, replays a token after logout, and
   races two requests to spend the same balance twice.
