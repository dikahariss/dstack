---
name: designing-test-cases
description: >
  Use when acceptance criteria or requirements exist and the concrete situations
  worth testing have not been enumerated — before writing the first test, before
  a UAT run that needs a frozen scenario list, or when someone asks how many
  cases a feature needs and the honest answer is nobody knows. Also use when a
  test set was written alongside the code and needs an unbiased second pass.
  Produces a list, never test code, and never a coverage percentage. Triggers:
  "test case", "test scenario", "test plan", "how many test cases", "boundary value",
  "equivalence partition", "decision table", "traceability matrix".
allowed-tools: Read Grep Glob Write Edit Skill
metadata:
  dstack:
    version: 0.4.0
    type: semantic
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - designing test cases
      - test case
      - test scenario
      - test plan
      - how many test cases
      - boundary value
      - equivalence partition
      - decision table
      - traceability matrix
---
# /designing-test-cases

Turn each thing the system promises into the list of situations that would prove
or disprove it — before the code that would bias the list exists.

```
DERIVE FROM THE SPECIFICATION, NEVER FROM THE IMPLEMENTATION.
A CASE THAT CANNOT FAIL IS NOT A CASE.
```

Both rules break by the same shortcut. A set written while looking at the code
tests the branches the author remembered writing, and pads the count with cases
that pass against every implementation — including wrong ones.

**The output is a list, not test code.** Handing implementation a directory of
simultaneously-failing tests destroys `/test-driven-development`'s discipline,
which is one failing test, watched failing, then the minimal code. The list
feeds that loop one row at a time.

**This list is the step that carries the value — run it even when the full
red-green cycle will not run.** `/test-driven-development` reserves that cycle
for six risk tiers; every change outside them implements first and tests after.
What makes those tests-after worth having is that they are derived from *this*
list rather than read back off the finished code — tests generated after the
code caught 14% of faults vs 25% for independent derivation
([arXiv 2607.05139](https://arxiv.org/pdf/2607.05139)). So the list must be
frozen **before** implementation starts, whichever path follows.

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| No acceptance criteria or requirements to derive from | `/writing-specs` first, or `/discovering-requirements` before it |
| A known bug needing one reproducing test | `/debugging` → `/test-driven-development` |
| Writing and running the tests | `/test-driven-development` |
| Driving the running app through a browser | `/running-uat`, using this skill's `human` rows |
| A line or branch **coverage percentage** for existing code | the repo's coverage tool — a skill cannot measure it |

## Stage 0 — Inputs

| Input | Source | If missing |
|---|---|---|
| Acceptance criteria or requirements with IDs | `docs/specs/…`, `docs/discovery/…` | **stop** — see the confirmatory rule below |
| The contract per behaviour: inputs, outputs, rules, errors | the spec | each unstated rule becomes an `unstated-rule` gap, never a guess |
| Existing tests | the repo's test tree | note it; the set may duplicate what exists |
| State machines and lifecycles | the spec's model section | a lifecycle with no states written down gets a gap row |
| Risk information: what is expensive if it breaks | the spec, the goal, the constraints | rank by impact alone and say so |

**Confirmatory mode.** No spec exists *and* the user has declined to write one:
say so in the header, read the implementation, and mark the set `CONFIRMATORY` —
its blind spots are the implementation's. Its cases cite `R-n` risks, not
criteria. Any other reason to skip the spec is not a reason; stop and route to
`/writing-specs`.

## Pick the depth

**Light** — one behaviour, one or two variables, no state machine, no rule
combination: run Stages 1, 3, 4, 6, 7 (skip Partition and Rank) and keep the set
inline. **Full** — everything else. Say which; the header carries a `Depth:`
line. Stage 4 runs at every depth: a row with no oracle is exactly the case that
cannot fail.

## The reading rule

Read the **specification** to derive cases. Read **existing tests** to avoid
duplicating them and to match the repo's conventions. Do **not** read the
implementation first — it is the thing under test, and a set derived from it can
only confirm it.

## The stages — each gate can refuse

Every gate writes one row: *stage · PASS or BLOCKED · evidence*. **A PASS with
an empty evidence cell is not a PASS.** A gate whose subject does not exist
reads `n/a — <why>`; delete rows for stages the depth skipped rather than
marking them PASS. BLOCKED names what is missing and escalates to a named human;
where there is nobody, the set publishes as `DRAFT` with the row visible and
dependent cases stamped `BLOCKED-PENDING` in their Status cell.

### 1. Ground — what must be proved, and what already is

List the criteria in scope by ID. Inventory existing tests against them: which
criteria have cases, which do not, and which existing tests assert the
implementation rather than the contract.

**Gate:** every criterion listed by ID; derivation mode stated in the header.

### 2. Partition — name the variables and their classes

Per criterion, name each input variable and split its range into classes the
spec gives the **same reason** to accept or reject — never "the same code path",
which you cannot see. Partition the invalid side by reason too.

Then classify the **shape**. Shapes compose: a condition containing a range
carries its own boundary analysis.

| Shape | Technique |
|---|---|
| A range, size, count, or date window | equivalence partitioning + boundary values |
| Conditions combining into outcomes | decision table |
| A lifecycle with states | state transition, full state × event matrix |
| **Who may act on whose object** | **authority matrix** — never collapse the subject, role, tenant, or owner |
| Three or more independent parameters | pairwise |
| **A threshold on a distribution** (latency, throughput) | **workload + sample + percentile** |
| **A universal negative** (data must never appear anywhere) | **sink enumeration + absence scan** |
| Free-form input, or an unwritten rule | error guessing, from the failure catalogue |

Definitions, worked derivations, the non-functional forms, and the stopping
rules: `references/techniques.md`.

**Gate:** every criterion has named variables with classes, or an explicit "no
variability — single path" line.

### 3. Derive — apply the technique, then walk the four classes

Apply the technique the shape selected. Then walk all four classes — `happy`,
`edge`, `invalid`, `chaos` (this table is normative; `/test-driven-development`
defers to it). Chaos is the most skipped and the most expensive in production;
its construction method is in the reference, not left as a list of words.

**A case may cite a derived risk `R-n` instead of a criterion** when it comes
from asking what breaks *around* the behaviour, or from a conflict *between* two
criteria. Those are the most valuable cases in most sets and no criterion names
them. Every `R-n` is also raised back to the spec as a proposed criterion.

**Where to stop:** pairwise, not full combinatorial. Go further only with a
stated reason.

**Gate:** every criterion has a happy case and at least one other; any class
deliberately skipped has a gap row naming the risk that accepts.

### 4. Level, oracle, and what the case is trying to falsify

Per case: **name the thing the case is trying to falsify.** If that thing is a
collaborator — a database, a queue, a clock, another service — then it is
**real** at the assigned level. Chaos and concurrency cases are integration or
above unless you state why a fake can still fail. Mocking the collaborator whose
behaviour the oracle depends on tests the `catch` block, not the recovery.

Then the level (unit / integration / e2e / human), the **action** — what is
invoked; a state-transition case *is* its action — preconditions including state
that must **not** exist, the data, and the **oracle**.

One case, one **verdict**. The verdict may need several postconditions observed
from one scenario — "499 accepted *and* row 250 named" is one verdict. What must
be singular is the decision rule, not the assertion count. State the oracle's
channel and value: `HTTP 422, body.code = ROW_LIMIT_EXCEEDED`, not "is rejected".

Sometimes the honest answer is not a case at all: a property better enforced by
making the wrong state unrepresentable — a type, a constraint, a lint — belongs
in the spec as a design change. Say so rather than writing a weaker runtime scan.

**Gate:** every case names its falsification target, level, action, data, and
one verdict; no chaos or concurrency case is assigned `unit` without a reason.

### 5. Rank — risk order, and release effect

Order by impact × likelihood, highest first, so a truncated run still covers what
matters. State the rationale once.

Separately, and **before anyone knows which cases will fail**, mark each case
`BLOCKER` or `ADVISORY`. Risk is run *order*; release effect is *consequence*.
Without it, three red cases at the gate get adjudicated by whoever is loudest.

**Gate:** ordered, rationale stated, every case carries a release effect.

### 6. Cover — traceability, gaps, and honest claims

Every case cites **exactly one** criterion or one `R-n`. Then check downward:
every criterion has ≥1 case or a gap row. Gaps come in four kinds — uncovered
criterion, unstated rule, skipped class, out-of-scope — each with the risk it
accepts and **who accepted it**.

Then dedupe: two rows with the same level, action, data, and verdict are one
case. And report the class shares. **The non-happy-path share is diagnostic, not
a target** — a lifecycle with six legitimate transitions produces six happy
cases and that is correct, not a failure.

Report "criteria with ≥1 case", never "coverage": this set licenses no claim
about statements, branches, or combinations, and a collapsed decision rule is an
untested assumption.

**Gate:** traceability both ways; gap list explicit with owners; duplicates
resolved; class shares reported.

### 7. Hand off and close

To implementation: **one row at a time** — the top-ranked automated-level case
**whose prerequisites are satisfied**. Risk order is not build order; a case
needing a component that does not exist cannot be the first failing test.

To acceptance: the `human` rows, in Given/When/Then, are what `/running-uat`
needs at its entry gate.

`DRAFT` → `AGREED` needs a named human; the agent never grants it. When a
criterion is amended, every case citing it reopens — amend through the change
log, supersede only when the spec itself was superseded.

**Gate:** the gate table is complete; the first buildable case is named.

## Output

One file: `docs/tests/YYYY-MM-DD-<slug>.md` in the target system's repo — a user
or repo preference overrides it, and when the caller asks for the content
inline, produce it inline and say no file was written. Columns, the `TC-n`/`R-n`
scheme, gap kinds, and the run record are in `references/case-set.md`.

Report in chat as: counts by class and level, criteria with ≥1 case (`n of m`,
the rest listed as gaps), blocker count, the top three by risk, the first
buildable case, and any BLOCKED gate. Not the whole set.

## Judgment

Two calls are yours. **Which technique fits the shape** — a decision table for
what is really a range produces twelve cases that test one thing. And **where to
stop**: the combinatorial space is unbounded, so the value here is a defensible
boundary around it, not exhaustiveness. Name the boundary and what it accepts.

## Cases, badly and well

> `AC-3`: *the system accepts a CSV of up to 500 records; a row that fails
> validation is rejected while the rest are accepted.*

| | Case |
|---|---|
| ✗ | `TC-9` Upload a valid CSV and check it works. — no action, no data, no verdict; passes against a wrong implementation. |
| ✓ | `TC-9` POST /imports, 500 valid rows → `HTTP 200`, accepted = 500, failures = []. *(boundary, max)* |
| ✓ | `TC-10` POST /imports, 501 rows → `HTTP 422, code = ROW_LIMIT`, persisted = 0. *(boundary, max+1)* |
| ✓ | `TC-11` POST /imports, 500 rows, row 250 missing a required column → accepted = 499, failures names row 250 and the column. *(invalid, partial)* |
| ✓ | `TC-12` (← `R-2`) connection drops after 300 rows persist; resubmit the same file → accepted total = 500, not 800. *(chaos, idempotency — falsifies the store, so integration)* |

`TC-12` matches no criterion anyone wrote, which is why it cites `R-2` and why
`R-2` goes back to the spec as a proposed one.

## Red flags

| Thought | Reality |
|---|---|
| "I'll write the cases as I implement" | Then they test what you built, not what was promised. |
| "More cases is better coverage" | 400 happy-path cases are worse than 40 that discriminate. |
| "This case covers three criteria at once" | It fails all three ambiguously. One case, one verdict. |
| "Chaos cases are premature" | They are the ones that page you. Inject the failure on purpose. |
| "I'll mock the database for the retry case" | Then you tested the catch block, not the recovery. |
| "Every combination should be tested" | Pairwise catches most interaction defects. State where you stopped. |
| "Deny is one row in the decision table" | Never for roles, tenants, or owners. That collapse is how cross-tenant access ships. |
| "All cases passed, so it is safe to release" | The set licenses no such claim. Read the gap list and the blocker count. |

## Hand-off

Input from `/writing-specs` (`AC-n`) or `/discovering-requirements`. Output feeds
`/test-driven-development` — one row at a time inside a risk tier, as the
after-the-fact derivation source outside one — and `/running-uat` at its entry
gate. Send a large set through `/multi-persona-review` — the cases one reviewer
never thinks of are the point.

## Bundled files

- `references/techniques.md` — each technique, when it fits, a worked
  derivation, the non-functional and authority forms, and when to stop.
- `references/case-set.md` — the output template: columns, ID scheme, gap kinds,
  release effect, run record, and the amend rule.

## Changes

- **0.4.0** — English-only pass (`using-dstack` 0.7.0). `how many test cases`
  added — not "test coverage", which names the metric this skill refuses to
  produce. `eval/` keeps its Indonesian prompts as the routing proof.
- **0.3.0** — Promoted from "the step before TDD" to "the step that carries the
  value". `/test-driven-development` 0.6.0 now runs the full cycle only inside
  six risk tiers; everywhere else the tests come after the code. That makes this
  list the only thing standing between those tests and the implementation bias
  they would otherwise inherit, so the freeze-before-implementation rule is now
  stated as unconditional and the hand-off names both consumption modes.
- **0.2.0** — Rebuilt after a five-point-of-view review (QA lead, implementer,
  release manager, non-functional tester, holistic) returning six blocking
  findings, plus a subagent trial that derived 60 cases from a real criteria set
  and found nine more. Three of this skill's own rules were contradicting each
  other: one-case-one-criterion forbade its own showcase case, the non-happy
  share penalised correctly-derived lifecycle cases, and "cannot fail" forbade
  the absence scans a universal negative needs. Fixed by adding `R-n` derived
  risks, making the share diagnostic, and defining the verdict as one decision
  rule rather than one assertion. Added: the falsification-target rule (a
  collaborator the oracle depends on is real at that level); authority,
  distributional, and universal-negative shapes, since non-functional criteria
  had no derivation path at all; a ban on collapsing subject/role/tenant/owner
  in a decision table, which otherwise folds an entire deny space into one row;
  release effect separate from risk order; prerequisites, because risk order is
  not build order; the action column, without which no row said what to invoke;
  gap kinds; human-granted `AGREED`; and the Light path now runs Stage 4, which
  it previously skipped while still requiring its output.
- **0.1.0** — Initial. Built from
  `docs/discovery/2026-07-28-designing-test-cases.md` and its Light spec: TDD had
  a per-behaviour completeness walk and `running-uat` an entry gate demanding an
  enumerated set, and nothing produced one — 73 verification demands across 446
  human turns, 16% overall and 33% in this repo. Derivation follows the ISTQB
  black-box canon; the four classes are carried from `/test-driven-development`.
  Zero precedent across ~126 skills in the four reference catalogs.
