# Discovery — test cases are derived from the code, not from the specification

Depth: LIGHT (reversible, ≤1 day, no new entity, no personal data, no actor
outside the delivery team — Stages 1, 2, 6, 7: §0, §1, §2, §3, §7–§10)
Status: DRAFT
Date: 2026-07-28 · Requested by: repo owner
Agreed by: —

## 0. Gate table

| Stage | Gate | PASS / BLOCKED | Evidence |
|---|---|---|---|
| 1 | problem names no solution + demand evidence | **PASS** | §2 names no artifact or format; demand is observed (E-1, E-4) |
| 2 | baseline + target + method + owner + guardrail | **PASS** | §3 — baseline measured from the session miner |
| 6 | out-of-scope non-empty with IDs; MUST ratio | **PASS** | §7 — five ID-bearing Out rows; 4 MUST of 8 |
| 7 | gate table complete | **PASS** | this table |

## 1. Summary

- **The problem:** which cases get tested is decided by whoever writes the code,
  at the moment they write it, so the set inherits their blind spots.
- **Who it hurts:** the repo owner, who has to keep asking whether every point
  was covered; and anyone accepting the work, who has no list to accept against.
- **What success looks like:** a numbered case set derived from the
  specification, traceable both ways, before the production code exists.
- **What we do about it:** one skill that turns acceptance criteria into a case
  set using named derivation techniques, then hands it to TDD one case at a time.
- **Riskiest assumption (A-1):** that a written case set actually reduces
  coverage questions rather than moving them. Cheapest check: re-run the session
  miner's verify-demand count after 30 days of use.

## 2. Problem statement

**Today (verified):** `skills/test-driven-development/SKILL.md:153-156` states the
defect in its own words — *"A test written after looking at your own
implementation inherits its blind spots — you test the branches you remember
writing."* It supplies four classes to walk (happy / edge / invalid / chaos) but
applies them **per behaviour, at the moment of writing that behaviour**. Nothing
produces a case *set* from a specification beforehand.

Downstream, `skills/running-uat/SKILL.md:73` refuses to start without
*"Acceptance criteria enumerated, Given/When/Then"*. `writing-specs` now emits
`AC-n` — but at one criterion per requirement. One criterion is not a test set:
a single AC covers many partitions, boundaries, invalid inputs, and failure
injections, and nothing turns one into the other.

**What should happen instead:** the case set is derived from the specification
by named techniques, numbered, traceable to the criteria it proves, and ordered
by risk — before the production code that would bias it exists.

**Who is affected, and the cost:** the author, whose set is biased toward
remembered branches; the accepter, who has no enumerated list to accept
against; and the next maintainer, who cannot tell whether a gap is deliberate.

**Root need.** "We need hundreds of test cases" → why? → "so coverage is not
guesswork" → why is it guesswork? → "cases are invented while writing the code
they test" → **a set derived from the implementation can only confirm it.**

**Demand evidence:** observed. 73 of 446 human turns in a 60-day window were
demands for verification — 16% overall, 33% within this repo — including
repeated coverage questions of the form "sudah semuanya terimplementasi kan ya
utamanya 3 point ini" and "tadi itu ada 7 point klw tidak salah" (E-4).

## 3. Goal and success metric

| Goal | Baseline | Target | Measured by | Owner | Review |
|---|---|---|---|---|---|
| PRIMARY — coverage stops being a question the owner has to ask | 73 verify demands in 446 human turns (16%); 33% within this repo | under 10% overall | `learning-from-sessions` miner, `verify_demands` over `human_turns` | repo owner | 30 days after use |
| GUARDRAIL — case count must not become the goal | n/a | at least 60% of cases are non-happy-path, and every case cites a criterion | count by class in the case set | repo owner | per set |

**Why this metric:** the owner asking "did you cover all N points" is the
observable symptom of there being no enumerated list to point at. **Cheapest way
it moves without the problem being solved:** produce 400 trivial happy-path
cases so the set looks thorough. That is exactly what the guardrail measures,
and it is why the guardrail exists rather than a case-count target.

## 7. Scope

**In — first cut**

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Derive a case set from acceptance criteria and requirements using named techniques — equivalence partitioning, boundary values, decision tables, state transitions, combinatorial pairs, error guessing | MUST |
| FR-2 | Every case cites exactly one criterion or requirement ID; every criterion has at least one case; the gap list is explicit | MUST |
| FR-3 | Every case carries its level (unit / integration / e2e / manual), preconditions, data, and one observable expected result | MUST |
| FR-4 | Order the set by risk — impact × likelihood — so a truncated run still covers what matters | SHOULD |
| FR-5 | Hand the set to `/test-driven-development` one case at a time, never as a mass of simultaneous red tests | MUST |
| FR-6 | Emit the enumerated criteria `/running-uat` demands at its entry gate | SHOULD |
| FR-7 | State what is deliberately not covered, and why | SHOULD |
| NFR-1 | Body under the token budget; technique reference loads on demand | MUST — pass condition: `bun run validate` reports no warning |

**Out — and why**

| ID | Item | Why out | Revisit when |
|---|---|---|---|
| OUT-1 | Writing the test code | `/test-driven-development` owns it; writing hundreds of tests at once breaks its one-red-test-at-a-time discipline | never |
| OUT-2 | Running tests and reporting results | `/verifying-before-done` and `/running-uat` own execution | never |
| OUT-3 | White-box coverage measurement (statement, branch, MC-DC) | A tool reports it; a skill cannot, and a spec-derived set is black-box by construction | a coverage tool is actually wired into CI |
| OUT-4 | Performance and load test scripting | Different craft, different tools; the NFR's pass condition names the target and that is this skill's edge | a load-testing need is named |
| OUT-5 | Exploratory testing sessions | Experience-based and unscripted by definition; it complements a designed set rather than being produced by one | a charter-based practice is adopted |

## 8. Assumptions and open questions

| # | Assumption | Impact if wrong | Confidence | Owner | Blocks |
|---|---|---|---|---|---|
| A-1 | A written case set reduces coverage questions rather than relocating them | Medium — the metric would be measuring the wrong thing | MEDIUM | repo owner | the goal's validity, not the build |
| A-2 | Deriving cases before code does not conflict with TDD's iron law, provided the artifact is a case *list* and not test code | High — a conflict would make the two skills contradict each other | HIGH | — | FR-5 |
| A-3 | Six techniques is the right number to name — enough to cover the space, few enough to be used | Low — additive either way | MEDIUM | — | FR-1 |

## 9. Evidence log

| What | Where | When | What it showed |
|---|---|---|---|
| E-1 | `skills/test-driven-development/SKILL.md:153-156` | 2026-07-28 | The bias is already named in-repo; the four classes are applied per behaviour, not to a set |
| E-2 | `skills/running-uat/SKILL.md:73` | 2026-07-28 | Entry gate demands enumerated Given/When/Then criteria |
| E-3 | `skills/writing-specs/SKILL.md` §6 | 2026-07-28 | Emits `AC-n` at one criterion per requirement — the input, not the case set |
| E-4 | `learning-from-sessions` miner, 60-day window | 2026-07-28 | 73 verify demands / 446 human turns; coverage questions quoted verbatim in the corrections list |
| E-5 | 4 reference repos, ~126 skills, grepped for the technique vocabulary | 2026-07-28 | **Zero precedent.** Only `gstack/qa` matched, and it is browser QA execution, not case design |
| E-6 | Affected actors | — | **affected actors observed: none** — one user, who is the requester |

## 10. Change log

| Date | Change | Affected IDs | Reason | Approved by |
|---|---|---|---|---|
| 2026-07-28 | Initial draft | all | — | — |
