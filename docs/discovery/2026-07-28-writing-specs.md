# Discovery — design decisions are made during implementation, not before it

Depth: LIGHT (reversible, ≤1 day, no new entity, no personal data, no actor
outside the delivery team — so Stages 1, 2, 6, 7 only: §0, §1, §2, §3, §7–§10)
Status: DRAFT
Date: 2026-07-28 · Requested by: repo owner
Agreed by: —

## 0. Gate table

| Stage | Gate | PASS / BLOCKED | Evidence |
|---|---|---|---|
| 1 | problem names no solution + demand evidence | **PASS** | §2 names no artifact or format. Demand is observed, not asserted (E-3, E-4) |
| 2 | baseline + target + method + owner + guardrail | **PASS** | §3 — baseline measured from the session miner |
| 6 | out-of-scope non-empty with IDs; MUST ratio | **PASS (ratio mis-recorded — see change log 2026-07-29)** | §7 — four ID-bearing Out rows. Recorded as 3 MUST of 7; **actual 4 of 7**, which is over half and should have read BLOCKED. The skill shipped anyway |
| 7 | gate table complete | **PASS** | this table; four rows for four stages |

## 1. Summary

- **The problem:** how a system will be built gets decided while it is being
  built, so the decisions are never reviewed and nobody outside the code can see
  them.
- **Who it hurts:** the repo owner, who re-litigates settled design mid-build;
  and any non-technical reader, who cannot check a decision until software exists.
- **What success looks like:** design decisions are written, reviewable, and
  traceable to a requirement *before* the first task is planned.
- **What we do about it:** one skill that turns an agreed requirement set into a
  design document, tracing both ways.
- **Riskiest assumption (A-1):** that plan-document churn is caused by absent
  design rather than by ordinary incremental authoring. Cheapest check: re-run
  the session miner after the skill is in use and compare edits-per-plan-doc.

## 2. Problem statement

**Today (verified):** `skills/writing-plans/SKILL.md:4` opens with "Turn a spec
or requirements into a step-by-step implementation plan" — the spec is an input
it never produces. `skills/discovering-requirements/SKILL.md:129` gates its own
output on naming "no solution, technology, or UI". So the catalog produces
*what must be true* and consumes *how it will be built*, and nothing writes the
second one down.

**What should happen instead:** the decisions between those two — module and
service boundaries, the domain model and schema, contracts, process flow,
interface behaviour — exist as a reviewable artifact before planning starts.

**Who is affected, and the cost:** design still happens, but inside
implementation. It is therefore un-reviewed, un-traceable, and invisible until
the code exists. Rework lands on the plan document, which becomes a de-facto
spec that moves under the plan built from it.

**Root need.** "We need an SDD skill" → why? → "requirements don't say what to
build" → why does that matter? → "the design gets made anyway, undocumented" →
**decisions with no home are decisions nobody can review or revisit.**

**Demand evidence:** observed. 60 edits to one plan document in a single session
and 18 to another (E-3); four session corrections where a design fork had no
home (E-4).

## 3. Goal and success metric

| Goal | Baseline | Target | Measured by | Owner | Review |
|---|---|---|---|---|---|
| PRIMARY — design churn stops landing on the plan document | 60 and 18 edits to a single plan doc in one session | no plan document exceeds 10 edits in one session; design changes land in the spec's change log instead | `learning-from-sessions` miner, `rework` section, filtered to `docs/plans` | repo owner | after 30 days of use |
| GUARDRAIL — the skill must not become ceremony | n/a | the Light path is chosen for at least half of invocations on ≤1-day changes | self-reported depth line in each spec | repo owner | same |

**Why this metric:** plan-doc churn is the observable fingerprint of design
being decided late. **Cheapest way it moves without the problem being solved:**
the churn migrates to the spec document instead. Guard: a spec is *amended
through a change log*, so edits there are recorded, not silent.

## 7. Scope

**In — first cut**

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Turn an agreed requirement set into one design document covering architecture, domain model and schema, contracts, process flow, and interface behaviour | MUST |
| FR-2 | Every design decision cites the requirement ID it serves, and every requirement ID is covered by a decision or an explicit out-of-scope row | MUST |
| FR-3 | Emit acceptance criteria per requirement ID, in Given/When/Then | MUST |
| FR-4 | Read the existing code and cite it as evidence before any decision is written | SHOULD |
| FR-5 | Each section leads with plain language, then technical detail, so one document serves both audiences | SHOULD |
| FR-6 | Diagrams are embedded Mermaid, not an external tool or a binary | SHOULD |
| NFR-1 | Body stays under the skill token budget; heavy template and diagram reference load on demand | MUST — pass condition: `bun run validate` reports no warning |

**Out — and why**

| ID | Item | Why out | Revisit when |
|---|---|---|---|
| OUT-1 | Pixel-level **visual** design — brand, colour, typography, spacing | A different craft with a different reviewer; the spec fixes *behaviour and states*, not appearance | a design system is actually adopted |
| OUT-1b | Low-fidelity wireframes of the screens the spec's step table describes | **Amended 2026-07-29** — moved to `wireframing-interfaces`, which owns the picture between the state table and the built screen | superseded: that skill now owns it |
| OUT-2 | The implementation plan itself | `writing-plans` owns it; duplicating it would produce two sources of truth | never |
| OUT-3 | Test case design beyond acceptance criteria | `designing-test-cases` will own it; this skill emits the AC that feed it | that skill is built |
| OUT-4 | Code generation from the spec | Out of the renderer's scope entirely (ADR-0028) | never |

## 8. Assumptions and open questions

| # | Assumption | Impact if wrong | Confidence | Owner | Blocks |
|---|---|---|---|---|---|
| A-1 | Plan-doc churn is caused by absent design, not ordinary incremental authoring | Medium — the metric would be measuring the wrong thing | MEDIUM | repo owner | the goal's validity, not the build |
| A-2 | Mermaid is enough for architecture, ER, sequence, and state diagrams without an external renderer | Low — a diagram type could be missing; prose fallback exists | HIGH | — | FR-6 |
| A-3 | `docs/specs/` is the right home despite dstack using it for port contracts | Low — dated filenames avoid collision | HIGH | — | — |

## 9. Evidence log

| What | Where | When | What it showed |
|---|---|---|---|
| E-1 | `skills/writing-plans/SKILL.md:4,35` | 2026-07-28 | The plan skill consumes a spec it never produces |
| E-2 | `skills/discovering-requirements/SKILL.md:129` | 2026-07-28 | Discovery is gated on *not* naming a solution — the hole is deliberate on both sides |
| E-3 | `learning-from-sessions` miner, 60-day window, `rework` | 2026-07-28 | 60 and 18 edits to single plan documents in one session each |
| E-4 | Same miner, `corrections` | 2026-07-28 | Four corrections where an implementation fork ("pilihannya kembali lagi ke kita implementasi yg mana") had no artifact to live in |
| E-5 | `docs/specs/` | 2026-07-28 | Holds four port contracts; dated spec filenames will not collide |
| E-6 | Affected actors | — | **affected actors observed: none** — one user, who is the requester |

## 10. Change log

| Date | Change | Affected IDs | Reason | Approved by |
|---|---|---|---|---|
| 2026-07-28 | Initial draft | all | — | — |
| 2026-07-28 | `writing-specs` 0.1.0 shipped without the depth mechanism the guardrail measures; 0.2.0 added the Light/Full path and the header `Depth:` line | GUARDRAIL | A five-point-of-view review and a subagent trial independently found the requirement had been dropped. The guardrail is measurable again | — |
| 2026-07-29 | Split OUT-1: visual design stays out; low-fidelity wireframes move to a new sibling skill. **The original revisit trigger ("a Figma-driven workflow is actually adopted") never fired** — the request named draw.io and Excalidraw instead, so the row is amended rather than treated as satisfied | OUT-1, OUT-1b | Honest record: the condition we wrote is not the condition that arrived | — |
| 2026-07-29 | Stage-6 gate ratio corrected: recorded 3 MUST of 7, **actual 4 of 7** — over half, so the gate should have read BLOCKED. The skill shipped on a gate that was mis-recorded, not on a gate that passed | gate | Found when the same error appeared in four documents for four | — |
