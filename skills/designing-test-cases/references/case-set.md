# The case set — template

One file per set: `docs/tests/YYYY-MM-DD-<slug>.md`, beside the spec it derives
from. A section that ran and found nothing is written `None — <why>`; a column
with no meaning here is written `n/a — <why>`, never left blank.

## Depth

| Depth | Runs | Writes |
|---|---|---|
| **Light** | Stages 1, 3, 4, 6, 7 | §0, §1, §2, §4, §5, §7 |
| **Full** | all seven | all sections |

Stage 4 runs at every depth. A row with no oracle is the case that cannot fail.

## Stage numbers and section numbers do not match

**Never write a bare `§n` when you mean a stage.**

| Stage | Writes |
|---|---|
| 1 Ground | §2 |
| 2 Partition | §3 |
| 3 Derive | §4 (rows) |
| 4 Level and oracle | §4 (columns) |
| 5 Rank | §4b |
| 6 Cover | §5 |
| 7 Hand off and close | §1, §6, §7 |

## ID scheme

| Prefix | For | Cites |
|---|---|---|
| `TC-n` | one test case | exactly one `AC-n`/`FR-n`/`NFR-n`, **or** one `R-n` |
| `R-n` | a derived risk no criterion names | the behaviour it breaks around |
| `G-n` | a gap | the criterion, rule, or class it leaves uncovered |

Every `R-n` is raised back to the spec as a proposed criterion — that is what
stops the set from quietly becoming the requirements document.

IDs never move. A case removed keeps its ID with `WITHDRAWN` and a reason; a
case muted for flakiness is `QUARANTINED` and **stops counting** toward coverage.

---

```markdown
# Test cases — <the behaviour, in plain language>

Depth: LIGHT | FULL
Derivation: SPEC-DERIVED | CONFIRMATORY (no spec; implementation read — blind spots are its own)
Derives from: <path or "chat excerpt, no versioned document"> (status: DRAFT | AGREED)
Status: DRAFT | CHANGES REQUESTED | AGREED | SUPERSEDED BY <path>
Date: YYYY-MM-DD · Author: <name> · Agreed by: <human name, role> on <date>

## 0. Gate table

One row per gate that **ran** — delete rows for stages the depth skipped rather
than marking them PASS. A **PASS with an empty Evidence cell is not a PASS**.

| Stage | Gate | PASS / BLOCKED / n/a | Evidence | Escalated to |
|---|---|---|---|---|
| 1 | criteria listed by ID; derivation mode stated | | | |
| 2 | variables and classes named, or "no variability" | | | |
| 3 | happy + ≥1 other per criterion; skipped classes have a gap | | | |
| 4 | falsification target, level, action, data, one verdict each | | | |
| 5 | ordered; rationale stated; release effect on every case | | | |
| 6 | traceability both ways; gaps with owners; duplicates resolved | | | |
| 7 | this table complete; first buildable case named | | | |
| — | bias checks run (wrong implementation, hostile client) | | which case caught each, or the case added | |

## 1. Summary

Five lines someone outside the team can act on, then the numbers.
- What is being proved: …
- What we are choosing not to prove, and the risk that accepts: …
- Criteria with ≥1 case: <n> of <m>. Gaps: <n>.
- Cases: <n> — happy <n>, edge <n>, invalid <n>, chaos <n>. Non-happy: <n>%.
- Release effect: <n> BLOCKER, <n> ADVISORY.
- Estimated run cost: automated <n> min; human <n> person-hours.
- Start here: `TC-n` — the top-ranked case whose prerequisites already exist.

## 2. Grounding — what already exists

| Criterion | Existing tests | Assessment |
|---|---|---|
| AC-1 | `path/to/existing.test.ts` | covers the happy path only |

Note any existing test that asserts the implementation rather than the contract:
it will pass a rewrite that breaks the promise.

## 3. Variables and classes

| Criterion | Variable | Valid classes | Invalid classes (by reason) | Boundary source | Shape | Techniques |
|---|---|---|---|---|---|---|
| AC-1 | | | | clause / config key / validator | | (may be several) |

Decision tables, state × event matrices, and authority matrices go here in full,
with `—` cells visible so every collapse is auditable.

## 4. Cases

### 4a. Design

| ID | Proves | Class | Technique | Falsifies | Level | Action | Preconditions (must exist / must NOT exist) | Data | Verdict — channel + value |
|---|---|---|---|---|---|---|---|---|---|
| TC-1 | AC-1 / R-1 | happy / edge / invalid / chaos | | the component this case tries to break | unit / integration / e2e / human | what is invoked | | literal / factory / fixture path | `HTTP 422, body.code = ROW_LIMIT` |

**Human rows** additionally carry Given / When / Then, in the form
`/running-uat` consumes — no conjunctions in Given or Then — plus the rubric a
second judge would apply the same way.

### 4b. Planning

| ID | Risk | Release effect | Tier | Depends on | Setup | Status / Test |
|---|---|---|---|---|---|---|
| TC-1 | H / M / L | BLOCKER / ADVISORY | per-commit / per-release / on-change-to-<area> | TC-n or a named capability, blank = buildable now | none / reuses harness / new harness | TODO · `path::test name` · WITHDRAWN · QUARANTINED · BLOCKED-PENDING |

`Risk` is run **order**. `Release effect` is **consequence**, decided before
anyone knows which cases will fail. `Depends on` is build order, which is not
the call graph.

## 5. Coverage

| Criterion | What it says | Cases | Classes covered | Obligation |
|---|---|---|---|---|
| AC-1 | <verbatim> | TC-1, TC-4 | happy, edge, invalid | the regulation or contract it serves, if any |

**Derived risks raised back to the spec**

| ID | Risk | Where it came from | Proposed criterion |
|---|---|---|---|

**Gaps**

| ID | Kind | Subject | What is missing | Risk accepted, in consequence terms | Accepted by | Revisit when |
|---|---|---|---|---|---|---|
| G-1 | uncovered-criterion / unstated-rule / skipped-class / out-of-scope | AC-2 | | "renewals filed on the last valid day may be rejected" — not "the upper boundary is uncovered" | | |

**Shape check**

| Class | Count | Share |
|---|---|---|

Non-happy share is **diagnostic, not a target**. A lifecycle with six legitimate
transitions produces six happy cases and that is correct.

**What this set does not license claiming**

No statement or branch coverage. Pairwise is not combination coverage. A
collapsed decision rule is an untested assumption unless its probe ran. Absence
scans pass against a system that writes nothing. All cases passing is not
evidence of absence of defects.

## 6. Run record

The plan becomes evidence only here.

| Run | Build / commit | Date | Environment | Passed | Failed (IDs) | Blockers failed | Run by |
|---|---|---|---|---|---|---|---|

## 7. Review and change log

| Date | Reviewer, role | Objection | Resolution | Status |
|---|---|---|---|---|

| Date | Change | Affected IDs | Reason | Approved by |
|---|---|---|---|---|
```

---

## Duplicates

Before publishing, scan for rows sharing **level + action + data + verdict**.
Two such rows are one case: keep the first, and mark the second either
`Duplicate of TC-n` (not implemented) or delete it and add "also proves `AC-x`"
to the survivor's coverage row. The one-case-one-criterion rule makes duplicates
across criteria the normal case, not an exception — catching them here is
cheaper than discovering it after both tests are written.

## Amend, or supersede

**Amend** — a criterion changed, a rule was clarified, a case was wrong. Edit in
place, add a change-log row, keep the IDs. **When a criterion is amended, every
`TC-n` citing it reopens** and its Status returns to `TODO`; list those IDs in
the change-log row so the implementer knows what became stale.

**Supersede** — the spec itself was superseded. New set, and the old status
becomes `SUPERSEDED BY <path>`.

The three loop-backs from implementation, each of which needs a change-log row:

| What was found | Disposition |
|---|---|
| The case is impossible at any level | `WITHDRAWN` with the reason; if its criterion drops to zero cases, a `G-n` row is required |
| The oracle is wrong | Amend the row; it does not become a new case |
| It is already green — an existing test covers it | `Duplicate of` that test's row; this is **not** a TDD violation and no code gets reverted |

## Risk ranking

Impact × likelihood, both judged.

| | Ask |
|---|---|
| **Impact** | if this fails in production, who is harmed and how expensively? Irreversible harm — data loss, personal-data exposure, a legal breach, a citizen blocked from a service — ranks above money; money above throughput. |
| **Likelihood** | new code, changed code, boundaries, concurrency paths, and anything with a defect history rank above stable code on a well-trodden path. |

Rank `H` when either is high and neither is trivially low. Inside a risk band,
break ties by `Setup` — cheap first — so the order is executable as well as
correct.

## Rules that keep a set honest

1. **One case, one verdict.** The verdict may need several postconditions from
   one scenario; what is singular is the decision rule.
2. **One case, one citation** — a criterion or an `R-n`.
3. **A case that cannot fail is not a case.** Name the wrong implementation it
   would catch. No answer → delete it. (An absence scan is the known exception;
   record its weakness in the gap list.)
4. **A gap is written, not omitted**, with a named accepter and the consequence
   in words a stakeholder would recognise.
5. **IDs never move.**
6. **The set is a list, not code.** Implementation takes one row at a time.
