# The spec document — template

One file per spec: `docs/specs/YYYY-MM-DD-<slug>.md`, beside the discovery
document it implements. Section order is fixed. Every section opens with plain
language before anything technical, including §8 and §9 — what was decided and
what will not be built are the two places where being wrong costs a stakeholder
most.

A section that ran and found nothing is written `None — <why>`, never deleted.
A **column** with no meaning for this system is written `n/a — <why>`, never
left blank.

**Where a table and a diagram carry the same fact, the table is normative** and
the diagram is illustrative. Build from the table.

## Depth

| Depth | Runs | Writes |
|---|---|---|
| **Light** | Stages 1, 2, 6, 7 | §0, §1, §2, §3, §8, §9, §10, §11 |
| **Full** | all seven | all sections |

## Stage numbers and section numbers do not match

Seven stages produce twelve sections. **Never write a bare `§n` when you mean a
stage** — say "the Stage n gate".

| Stage | Writes |
|---|---|
| 1 Ground | §2 |
| 2 Shape | §3 (+ the coverage table) |
| 3 Model | §4, §5 |
| 4 Contract | §6 |
| 5 Behave | §7 |
| 6 Verify | §8 |
| 7 Close | §1, §9, §10, §11 |

§1 Summary is written last, by Stage 7, once the rest exists.

## ID scheme

| Prefix | For | Cites |
|---|---|---|
| `CMP-n` | a component: service, module, worker, job, external system | ≥1 requirement ID |
| `ENT-n` | a domain entity | ≥1 requirement ID |
| `OP-n` | an operation across a boundary | the `CMP-n` that owns it |
| `EVT-n` | an event | its producer `CMP-n` |
| `AC-n` | an acceptance criterion | exactly one `FR`/`NFR` |
| `D-n` | a design decision | ≥1 requirement or `C-n` |
| `E-n` | an evidence item — spec-local | a `path:line`, URL, or command |
| `SOUT-n` | out of scope, decided **here** | — |

`FR-n`, `NFR-n`, `BR-n`, `SR-n`, `C-n`, and the discovery document's own `E-n`
and `OUT-n` belong to that document. **`E-n` and `SOUT-n` in a spec are
spec-local**; when you cite the discovery document's, qualify it —
`discovery E-3`, `discovery OUT-2`. The `SOUT` prefix exists so the two
out-of-scope lists can never be confused.

Spec IDs are stable and never renumbered. A dropped component keeps its ID in
§10 with a reason.

---

```markdown
# Spec — <what is being built, in plain language>

Depth: LIGHT | FULL
Kind: FORWARD | RETROSPECTIVE (documenting what already shipped)
Status: DRAFT | CHANGES REQUESTED | AGREED | SUPERSEDED BY <path>
Implements: docs/discovery/YYYY-MM-DD-<slug>.md (status: DRAFT | AGREED)
Date: YYYY-MM-DD · Author: <name>
Agreed by — business owner: <name, role> on <date>
Agreed by — technical owner: <name, role> on <date>

> If the discovery document is still DRAFT, its requirement IDs are not stable.
> Say so here and expect renumbering.

## 0. Gate table

One row per gate that ran. A **PASS with an empty Evidence cell is not a PASS**.
A gate whose subject does not exist in this system reads `n/a — <why>`.
A BLOCKED gate does not stop the document: keep writing, and stamp every
dependent row `BLOCKED-PENDING`.

| Stage | Gate | PASS / BLOCKED / n/a | Evidence | Escalated to |
|---|---|---|---|---|
| 1 | every touched subsystem cited, or an explicit "searched, found nothing" | | | |
| 2 | every component traces to a requirement; every requirement and `C-n` claimed or out; every non-NEW component cites its `E-n`; structural decision row exists | | | |
| 3 | every entity has grain, key + stability, owner, temporality, lifecycle with exits; every changed entity has a transition row | | | |
| 4 | every operation names errors, authorisation, idempotency, and consistency where it writes across owners; every event names consumers and compatibility | | | |
| 5 | every non-success terminal outcome has a path with a handler; every boundary-crossing step names its `OP-n`/`EVT-n` | | | |
| 6 | every FR and NFR has an AC; every AC names an observable consequence and its assertion level | | | |
| 7 | this table complete; open decisions have owners; every decision has a reversibility | | | |

## 1. Summary

Five lines a non-technical reader can act on.
- What we are building: …
- The pieces it is made of: …
- What changes for the people who use it: …
- What we decided not to do: …
- The decision still open that matters most: …
- Size: <n> components, <n> entities, <n> operations, <n> criteria.

## 2. Grounding — how it works today

Plain paragraph, then the evidence.

| # | What | Where (`path:line` / command) | What it showed |
|---|---|---|---|
| E-1 | | | |

State explicitly what you searched for and did not find. **Where evidence
contradicts the discovery document**, add a row saying so and escalate — that
contradiction is the most valuable output of this stage.

## 3. Shape — components and boundaries

Plain paragraph: the pieces, in words a stakeholder would use.

| ID | Component | Level | Inside | Status | One responsibility | Owns | Depends on | If dependency unavailable | Blocked by | Evidence | Serves |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CMP-1 | | context / container / component | CMP-n or — | NEW / CHANGED / UNCHANGED / DELETED / EXTERNAL | | | | fail closed / queue and retry / serve stale / degrade to … | CMP-n, or — if buildable now | E-n (required unless NEW) | FR-n, NFR-n |

`Blocked by` is **build order**, not the call graph: a component that calls
another at runtime is usually buildable first against a double. Name the first
buildable slice and the independent branches in a line under the table.

One diagram per altitude (`flowchart`), captioned with its level. Never mix two.

**Requirement coverage** — carry the requirement's own sentence, so a reviewer
can check this table without opening the other document.

| Requirement | What it says | Covered by | Or out because |
|---|---|---|---|
| FR-1 | <the sentence, verbatim> | CMP-1, CMP-3 | |
| C-2 | <the constraint> | CMP-4 | |
| FR-7 | <the sentence> | — | SOUT-2 |

Every `FR`, `NFR`, and `C-n` from discovery appears in exactly one row.

**Structural decision** — mandatory, one row.

| Chosen decomposition | Alternative rejected | Boundary crossings, primary process | Why this one |
|---|---|---|---|

A new boundary is correct when the two sides differ in rate of change, failure
or scaling profile, owner, or trust/data-residency line. Name which applies.

## 4. Model — entities, states, schema

Plain paragraph: the things the system keeps track of, in domain words.

| ID | Entity | Grain (one row = …) | Natural key | Surrogate | Stable across reload? | On source-key change or reuse | Owned by | Temporality | Relationships (cardinality) | Volume / growth | Serves |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ENT-1 | | | | | yes / no | | CMP-n | current-state / append-only history / effective-dated | | | FR-n |

An entity whose grain needs "and" to state is two entities.

ER diagram (`erDiagram`), then a lifecycle (`stateDiagram-v2`) per entity that
has one — every state needs an exit.

**Schema**

| Field | Type | Absence semantics | Constraint | Event-time or record-time | Timezone | Why it exists |
|---|---|---|---|---|---|---|
| | | not-null / unknown / not-applicable / not-yet-collected | | | | |

Unknown, not-applicable, and not-yet-collected must be distinguishable in the
stored data, not merged into one null.

**Access patterns**

| Question asked | By whom | Frequency | Freshness needed | Index that follows |
|---|---|---|---|---|

Include reporting and analytical consumers — discovery's DOWNSTREAM actors. An
index with no named access pattern is a guess.

**Source of record** — for any attribute supplied by more than one system.

| Attribute | Sources | Precedence | What happens to the loser |
|---|---|---|---|

**Cross-boundary references** — where no foreign key can exist.

| From | To | On delete / merge / supersede of the target | Enforced by |
|---|---|---|---|

## 5. Transition — how today's data reaches this model

Plain paragraph. Required for every `CHANGED` or `DELETED` entity or component;
`None — greenfield` when genuinely new.

| Entity | Existing rows come from | Rows that do not fit | Backfill: one-shot or dual-write | Must both shapes be readable? | Work in flight | Point of no return |
|---|---|---|---|---|---|---|

Then the cutover order (expand → migrate → contract), and the rollback path up
to the point of no return.

## 6. Contracts

Plain paragraph: what each piece promises the others.

| ID | Operation | Owner | Takes | Returns | Writes (ENT-n) | Consistency | Errors | Idempotent | Version / compatibility | Authorised for |
|---|---|---|---|---|---|---|---|---|---|---|
| OP-1 | | CMP-n | | | | atomic in one store / eventual via EVT-n, window … / compensated by OP-m | | yes / no | | |

| ID | Event | Producer | Payload | Consumers | Ordering | On duplicate | Version / compatibility |
|---|---|---|---|---|---|---|---|
| EVT-1 | | CMP-n | | | | | |

**Payload shapes** — same grain as the schema, for anything crossing a boundary.

| Operation / event | Field | Type | Absence semantics | Constraint |
|---|---|---|---|---|

**Error envelope** — decided once, used by every operation.

| Field | Meaning |
|---|---|

## 7. Process and interface

Plain paragraph: what happens, start to finish, in the language of the work
itself. This is the section a stakeholder reviews.

Process diagram (`flowchart` with lanes, or `sequenceDiagram`).

**Terminal outcomes** — every ending that is not success.

| Outcome | Reached when | Who handles it | How the person gets back in |
|---|---|---|---|
| Rejected | | | |
| Timed out / expired | | | |
| Abandoned | | | |
| Failed | | | |

**Steps**

| Step | Crosses a boundary via | Fields and validation | Empty | Loading | Partial | Denied | Failed |
|---|---|---|---|---|---|---|---|
| | OP-n / EVT-n / — | | | | | | |

Every `OP-n` and `EVT-n` appears in at least one step, or in §10.

## 8. Acceptance criteria

| ID | Proves | What that requirement says | Given | When | Then (observable) | Checked at | Measured by |
|---|---|---|---|---|---|---|---|
| AC-1 | FR-1 | <the sentence> | | | | unit / integration / e2e / human | load, volume, environment — for numeric targets |

"Then" must name something visible from outside the system. An AC that only a
person can judge is allowed — mark it `human` so nobody mistakes it for a test.

## 9. Decisions

Plain paragraph: what we chose, and what it costs us.

| ID | Decision | Serves | Alternative rejected | Why | Reversibility | Decided by | Decided on | ADR? |
|---|---|---|---|---|---|---|---|---|
| D-1 | | FR-n / C-n | | | reversible / costly / permanent once live | | | no / `docs/adr/NNNN-…` |

Reversibility is recorded on **every** decision, independently of the ADR test —
it is how a reviewer knows where to spend attention. ADR only when all three
hold: hard to reverse · surprising without context · a genuine trade-off.

**Non-functional consequences** — every `NFR` with a hard target.

| NFR | Structural consequence it caused | Or: none, because |
|---|---|---|

**Open decisions**

| # | Question | Options | Owner | Blocks | Needed by |
|---|---|---|---|---|---|

## 10. Out of scope

Plain paragraph: what we are not building, in words the reader would recognise —
including the work someone will still do by hand.

| ID | Item | Why out | What in this design makes it cheap or expensive later | Revisit when |
|---|---|---|---|---|
| SOUT-1 | | | | |

## 11. Cost, verification, and review

**Cost and operational load**

| Build effort band | Ongoing operational load | What cutover does to live work | Fallback when unavailable |
|---|---|---|---|

**Building and verifying in isolation**

| Seam | Test double | Seed data | Environment / config | Feature flag |
|---|---|---|---|---|

**Reviewer log**

| Date | Reviewer, role | Objection | Resolution | Status |
|---|---|---|---|---|

## 12. Change log

| Date | Change | Affected IDs | Reason | Approved by | Downstream plan tasks invalidated |
|---|---|---|---|---|---|
```

---

## Amend, or supersede

**Amend** — the design changed while the problem did not. Edit in place, add a
change-log row, keep the IDs.

On an `AGREED` spec the amend rule is mechanical:

| The amendment touches | Needs |
|---|---|
| §7 process or §10 out-of-scope | business owner sign-off again |
| an `AGREED` `D-n`, an `OP-n`/`EVT-n` shape, or a schema row | technical owner sign-off again |
| anything else | a change-log row only |

While an amendment is pending, the implementer **holds on the affected component
and proceeds elsewhere** — never builds to a decision under revision. The
change-log row lists which plan tasks the amendment invalidated.

An amendment changing a published `OP-n` or `EVT-n` shape must state its
compatibility class and the migration for every listed consumer.

**Supersede** — the requirements changed underneath. New discovery, new spec;
set the old status to `SUPERSEDED BY <path>`.

**When implementation diverges** from an `AGREED` spec, exactly one of two things
is true: the code is wrong, or the spec is out of date and gets amended. Deciding
neither is how a spec becomes fiction — and the next reader trusts it anyway,
which is worse than having no spec.

## Keeping the plain-language layer honest

Two tests, both required.

1. **Remove every noun that exists only in this codebase.** If nothing survives,
   it was the technical section with shorter sentences.
2. **Remove every term a person doing the work would not use in a meeting.**
   This is the test the first one misses: "the service publishes an idempotent
   event with eventual consistency" contains no project nouns and is not plain
   language. Industry vocabulary counts as jargon.

Any technical term that genuinely must appear gets defined in the sentence that
introduces it.
