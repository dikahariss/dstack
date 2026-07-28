# The discovery document — template

One file per discovery: `docs/discovery/YYYY-MM-DD-<slug>.md`. Section order is
fixed; a non-technical reader must be able to stop after §1 and still know what
is being solved, whether it is worth solving, and why.

Fill every section that its depth and conditional modules require. A section
that ran and found nothing is written `None identified — <why>`, never deleted:
an empty "Out of scope" and a missing one mean different things to the next
reader.

**Light depth** runs Stages 1, 2, 6, 7 — which is sections **§0, §1, §2, §3, §7,
§8, §9, §10**. It omits §2b, §3b, §4, §5, and §6: no viability stage, no actor
mapping, no constraint sourcing, and no `BR`/`SR` levels. If any of those turn
out to be needed, the depth call was wrong — switch to Full and say so.

**Stage numbers and section numbers do not match**, because two stages write
into one section and Stage 2.5 writes §3b. Stage 4 → §5, Stage 5 → §6, Stage 6 →
§7. Never write a bare "§n" when you mean a stage; say "the Stage n gate".

---

```markdown
# Discovery — <title in plain language>

Depth: LIGHT | FULL (+ modules: regulated / personal-data / end-users)
Status: DRAFT | AGREED | DO NOT BUILD | NOT NOW | SUPERSEDED BY <path>
Date: YYYY-MM-DD · Requested by: <name or role>
Agreed by: <human name> on <date>   ← only a human sets this; blank while DRAFT

## 0. Gate table

One row per gate that **ran** — delete the rows for stages the chosen depth
skipped rather than marking them PASS. Mandatory even when every row is PASS.
A gate that returned BLOCKED does not end the document: keep writing, and stamp
each dependent requirement `BLOCKED-PENDING` in its Priority cell.

| Stage | Gate | PASS / BLOCKED | Evidence or what is missing |
|---|---|---|---|
| 1 | problem names no solution + one observation cited | | |
| 2 | baseline + target + method + owner + guardrail | | |
| 2.5 | viability — worth its cost | | |
| 3 | every actor has a change or an effect borne + evidence status | | |
| 4 | regimes scoped; every constraint sourced and status-stamped | | |
| 5 | traceability up **and** down; no unresolved conflict | | |
| 6 | out-of-scope non-empty with IDs; MUST ≤ half of FR+NFR | | |
| 7 | this table complete | | |

## 1. Summary

Five lines, no jargon, no technology names.
- The problem: …
- Who it hurts: …
- What success looks like: …
- What we do about it, or why we do not: …
- Riskiest assumption, and the cheapest thing that would settle it: …

## 2. Problem statement

What is happening today — verified, and say how — what should happen instead,
who is affected, and what it costs them. No solution here.

**Root need:** the last answer from asking "why" until it stopped being a design.
**Demand evidence:** the observation this rests on. If it is only an assertion,
write `DEMAND UNVALIDATED` here and in §1.

## 2b. Terms

Every term appearing in a requirement whose meaning could be contested. If the
repo has a `CONTEXT.md`, this section defers to it and records only what is new.

| Term | Meaning in this document | Source | Not to be confused with |
|---|---|---|---|

## 3. Goal and success metric

| Goal | Baseline | Target | Measured by | Owner | Review date |
|---|---|---|---|---|---|
| <one primary goal> | <value, or a qualitative baseline with method + sample, or UNINSTRUMENTED + the requirement ID that builds the instrument> | | | | |

Mark secondary goals `SECONDARY`. At least one **GUARDRAIL** row is required —
a metric that must not get worse, with a threshold.

**Why this metric:** why moving it means the problem is solved, and the cheapest
way it could move without the problem being solved.
**Leading indicator:** something readable within days, alongside the lagging one.

## 3b. Viability

Rough cost to move the goal · expected value · kill criteria · verdict.
A verdict of `DO NOT BUILD` or `NOT NOW` ends the document here.

## 4. Actors and behaviour change

| Actor | Class | Today | Must do differently | What makes that possible | If they don't | Evidence |
|---|---|---|---|---|---|---|
| … | ACTS ON / IS ACTED UPON / INTERMEDIARY / DOWNSTREAM | … | … | authority, incentive, bandwidth, device, connectivity | … | OBSERVED / REPORTED / INFERRED |

Seed this from the real-world transaction, not the roles table. If nobody
affected was consulted, add the standing row: **affected actors observed: none**.

**Entity typology and cardinality**

| Entity | Kinds it can be | Cardinality | Natural person? | Lifecycle | Source |
|---|---|---|---|---|---|

*Conditional module — end users outside the delivery team:*

| Journey step | Channel | Who holds the artifact | Where it waits |
|---|---|---|---|

| Actor | Device | Connectivity | Shared account | Interruption | Language / reading level | Time pressure |
|---|---|---|---|---|---|---|

Name which step actually fails.

## 5. Constraints and compliance

> Sourced by an agent; this is not a legal determination and requires review by
> <role> before the design is built on it.

Regime scoping table, then per constraint: `C-n | Constraint | Source | Version /
as amended | In force at | Jurisdiction | Retrieved on | Status | Verified by |
Design impact`. Columns, statuses, the privacy gate, and precedence:
`constraint-sourcing.md`.

## 6. Requirements

**Business — BR** · `ID | Requirement | Traces to (a goal)`
**Stakeholder — SR** · `ID | Actor | Requirement (implementation-free) | Traces to | Source actor | CONFIRMED by / INFERRED`
**Functional — FR** · `ID | Requirement | Traces to | Contribution to the goal | Priority`
**Non-functional — NFR** · `ID | Category | Requirement (with a pass condition) | Traces to (BR-n or C-n) | Priority`

Categories to walk once: performance · availability · security · privacy ·
compliance · accessibility · observability · operability · portability/locale.

### 6b. Conflict register

| # | Requirements in conflict | Whose needs collide | Resolution | Decided by |
|---|---|---|---|---|

A conflict is neither an assumption nor an open question. It gets resolved and
attributed, or the set does not pass the Stage 5 gate.

## 7. Scope

**In — first cut:** the shortest prefix of FRs whose stated contributions
plausibly reach the target.

**Out — and why**

| ID | Item | Why out | Revisit when |
|---|---|---|---|

Dropped requirements keep their ID and move here. `WON'T` is expressed as a row
in this table, not as a priority value.

## 8. Assumptions and open questions

| # | Assumption or question | Impact if wrong | Confidence | Owner | Blocks | Needed by |
|---|---|---|---|---|---|---|

Sorted by impact × (1 − confidence), riskiest first. The top row is the one
quoted in §1.

## 9. Evidence log

| What | Where | When | What it showed |
|---|---|---|---|

`Where` accepts a `path:line`, a URL, a command — **and** a person plus method
("three clerks at one counter, one morning"). Human evidence has the same
standing as machine evidence here; that is the point of the column.

## 10. Change log

| Date | Change | Affected IDs | Reason | Approved by |
|---|---|---|---|---|
```

---

## Priority — MoSCoW, and mean it

Applies to `FR` and `NFR`. `MUST` means the first cut is not shippable without
it. A requirement whose only parent is a `C-n` is `MUST` by default — and is
**excluded from the ratio**, because a compliance-bound feature can legitimately
be almost all MUST and the gate would otherwise be unsatisfiable exactly where
cutting scope is least available. Of the requirements that remain, more than
half at `MUST` means the scope has not been cut. That is the Stage 6 gate, not a
suggestion.

## MoSCoW versus the modal verb

They govern different things and both are required. The **modal verb** ("the
system accepts…", `shall`) states the obligation *once shipped*. The **MoSCoW
column** states inclusion *in the first cut*. A `COULD` requirement is still
written with `shall` — there is no contradiction.

## Keeping IDs stable

IDs are cited by specs, plans, and test cases. Never renumber, and never restart
numbering: IDs are unique across the whole discovery series, so a superseding
document continues the sequence rather than reusing `FR-4` for something new. A
dropped requirement keeps its ID in §7 Out. A split becomes `FR-4a` / `FR-4b`,
and `FR-4` is retired with a pointer.

## Amend, or supersede

**Amend** — a constraint changed, a requirement was refined, an assumption
resolved. Edit in place, add a §10 row, keep the IDs. This is the normal path,
including on an `AGREED` document; a baseline nobody may correct is a baseline
that goes stale in chat instead.

**Supersede** — the *problem or the goal* itself changed. Write a new document
and set the old one's status to `SUPERSEDED BY <path>`. The trail is what makes
a late "why did we decide that?" answerable.
