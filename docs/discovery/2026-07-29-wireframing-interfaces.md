# Discovery — a screen's shape is decided during implementation, unreviewed

Depth: LIGHT (reversible, ≤1 day, no new entity, no personal data, no actor
outside the delivery team — Stages 1, 2, 6, 7: §0, §1, §2, §3, §7–§10)
Status: DRAFT
Date: 2026-07-29 · Requested by: repo owner
Agreed by: —

## 0. Gate table

| Stage | Gate | PASS / BLOCKED | Evidence |
|---|---|---|---|
| 1 | problem names no solution + cites an observation | **PASS** | §2 names no tool; the exclusion is recorded in-repo (E-1, E-2) |
| 2 | baseline + target + method + owner + guardrail | **PASS** | §3 — baseline countable from the spec's step table |
| 6 | out-of-scope non-empty with IDs; MUST ratio | **OVERRIDDEN** | §7 — six Out rows. **MUST ratio recomputed: 6 of 8, over half.** FR-6 was genuinely cut to OUT-6 (it also collided with the sibling's out-of-scope row). **Escalated to the repo owner and OVERRIDDEN 2026-07-29: both tiers stay in the first cut, nothing further is cut.** The ratio is still over half and is recorded as such — accepted, not relabelled |
| 7 | gate table complete | **PASS** | this table |

## 1. Summary

- **The problem:** what a screen looks like and how it is laid out gets decided
  while it is being built, by whoever is building it, and nobody sees it first.
- **Who it hurts:** the person who does the work daily and would have said "that
  is not the order we do it in" — and finds out at acceptance instead.
- **What success looks like:** every screen in an agreed design can be looked at
  and argued with before anyone writes it.
- **What we do about it:** one skill that turns the spec's table of steps,
  fields, and states into a low-fidelity picture of the screen.
- **Riskiest assumption (A-1):** that a low-fidelity picture invites correction
  rather than being mistaken for a finished design. Cheapest check: show the
  first one to a non-technical reader and ask what they think is already decided.

## 2. Problem statement

**Today (verified):** the spec already fixes interface *behaviour*.
`skills/writing-specs/SKILL.md:195` — *"interface behaviour, which is **states
and rules, not pixels**"* — and `references/spec-doc.md:241` gives the table:
per step, the fields and their validation, and what is shown when empty,
loading, partial, permission-denied, and failed. Appearance is deliberately
excluded: `docs/discovery/2026-07-28-writing-specs.md:89` records
*"Pixel-level mockups and visual design"* as out of scope.

Between that table and a built screen there is nothing anyone can look at. A
table of states does not show whether the sequence matches how the work is
actually done, whether two fields belong together, or whether the rejection
route has anywhere to go. So the arrangement is invented at implementation
time — and an arrangement invented at implementation time is never reviewed.

**What should happen instead:** the arrangement exists as a picture, at a
fidelity low enough that nobody mistakes it for finished design, early enough
that changing it costs a redraw rather than a rebuild.

**Who is affected, and the cost:** the operator or clerk who does the task
daily; the implementer, who currently makes an interaction-design decision
without either the mandate or the review for it.

**Root need.** "We need wireframes" → why? → "nobody can see the screen before
it is built" → why does that matter? → "the table does not show whether the
flow makes sense to the person doing the work" → **the shape of a screen is a
decision, and it is currently the only decision in the pipeline with no
artifact and no review.**

**Demand evidence:** partially observed. The exclusion and its consequence are
recorded in-repo (E-1, E-2). The specific demand is the repo owner's request —
recorded as an assertion, not a measurement.

**A recorded condition that does not fit.** `writing-specs`' out-of-scope row
sets the revisit trigger as *"when a Figma-driven workflow is actually
adopted"* (E-2). That has not happened; the request names draw.io and
Excalidraw instead. The trigger as written has **not** fired, so that document
is amended rather than quietly bypassed — see its change log.

## 3. Goal and success metric

| Goal | Baseline | Target | Measured by | Owner | Review |
|---|---|---|---|---|---|
| PRIMARY — a screen can be reviewed before it is built | 0 screens in `docs/specs/` have a picture | every step in a spec's interface table that a person interacts with has one | count artifacts under `docs/design/` against rows in the spec's step table | repo owner | 30 days |
| GUARDRAIL — it must stay low fidelity | n/a | no artifact carries a brand colour, a typeface choice, or a spacing system; shapes come only from the neutral mockup set | inspect the artifact's styles | repo owner | per artifact |

**Why this metric:** the problem is that the arrangement is invisible until it
is built; a reviewable picture per interactive step is exactly that visibility.
**Cheapest way it moves without the problem being solved:** produce a beautiful
high-fidelity mockup that reviewers read as final, so they stop asking about the
flow and start asking about the shade of blue. That is precisely what the
guardrail measures, and why fidelity is capped rather than maximised.

## 7. Scope

**In — first cut.** Both tiers ship: `MUST` = must have, `SHOULD` = nice to have.
Owner decision 2026-07-29 — no further cut.

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Turn a spec's step table — fields, validation, and the empty / loading / partial / denied / failed states — into a low-fidelity picture per screen | MUST |
| FR-2 | Draw **every state the spec names**, not only the populated one; a missing state is a gap row, never a silent omission | MUST |
| FR-3 | Emit an editable file a reviewer can open and rearrange, plus a viewable form when the toolchain allows | MUST |
| FR-4 | Cite, per screen, the step and requirement IDs it realises; a screen that traces nowhere is out of scope | MUST |
| FR-5 | Cap fidelity: neutral shapes, no colour system, no typeface choice, no spacing scale, and a visible "not visual design" marker on the artifact | SHOULD |
| FR-7 | Detect the local toolchain and state, per output, whether it was produced or skipped and why | MUST |
| FR-8 | When a viewable form was produced, check it for legibility defects — a field label overflowing its control, text/fill contrast, colliding labels — and report every finding; when none was produced, say the check did not run | SHOULD — conditional on FR-3's viewable half. A wireframe whose labels spill out of their fields is precisely the unreadable artifact this skill exists to avoid |
| NFR-1 | Body under the token budget; the shape catalogue and template load on demand | MUST — pass: `bun run validate` reports no warning |

**Out — and why**

| ID | Item | Why out | Revisit when |
|---|---|---|---|
| OUT-1 | Visual design: brand, colour, typography, spacing, iconography | A different craft with a different reviewer; capping fidelity is the point, not a limitation | a design system is actually adopted |
| OUT-2 | Interactive or clickable prototypes | Needs a prototyping tool and a different feedback loop; the artifact here is for argument, not for usability testing | a usability-testing practice exists |
| OUT-3 | Front-end code or component markup | `writing-plans` and implementation own it; a wireframe that emits code stops being low fidelity | never |
| OUT-4 | Accessibility conformance testing | `designing-test-cases` derives those cases and `running-uat` executes them; a picture cannot prove conformance — though it can and should show focus order and labels | never |
| OUT-5 | Architecture, data, and process diagrams | Its sibling `diagramming-architecture` owns them | never |
| OUT-6 | **Screen-to-screen navigation, including the rejection route** (was FR-6, cut 2026-07-29) | It collided with OUT-5: a screen-flow *is* a process diagram, so two rows in this document claimed and disclaimed it at once. The sibling owns flows; this skill owns single screens | the sibling ships and the boundary is exercised |

## 8. Assumptions and open questions

| # | Assumption | Impact if wrong | Confidence | Owner | Blocks |
|---|---|---|---|---|---|
| A-1 | Low fidelity invites correction rather than reading as finished | High — a picture mistaken for a decision suppresses exactly the objection it exists to invite | MEDIUM | repo owner | the goal, FR-5 |
| A-2 | The spec's step table is a sufficient input — no separate interview is needed | Medium — if it is not, this skill needs an elicitation stage and stops being cheap | MEDIUM | repo owner | FR-1 |
| A-3 | A neutral mockup shape set exists offline in the chosen tool | Low — verified today (E-4); a fallback of plain rectangles still works | HIGH | — | FR-3, FR-5 |
| A-4 | A non-empty **Fields and validation** cell is a sound proxy for "a person interacts here". The step table has no actor column, so the original rule was not derivable from the declared input | Medium — a false positive draws a screen for a job; a false negative silently skips a real screen | MEDIUM | repo owner | FR-1 |

## 9. Evidence log

| What | Where | When | What it showed |
|---|---|---|---|
| E-1 | `skills/writing-specs/SKILL.md:195` and `references/spec-doc.md:241` | 2026-07-29 | The spec fixes states and rules "not pixels", and already carries the per-step table of fields, validation, and five states — the input this skill needs |
| E-2 | `docs/discovery/2026-07-28-writing-specs.md:89` | 2026-07-29 | "Pixel-level mockups and visual design" out of scope, revisit "when a Figma-driven workflow is actually adopted" — the trigger as written has not fired |
| E-3 | `drawio --version` and `--help` | 2026-07-29 | v31.0.2 locally; `-e` embeds the editable source into the SVG |
| E-4 | rendered `mxgraph.mockup.containers.browserWindow`, `.forms.searchBox`, `.forms.button` | 2026-07-29 | **The neutral mockup shape library renders offline**, and the embedded source survives — verified, not assumed |
| E-5 | `ssh djpl-dev-etl`, `ssh microvac-lab` | 2026-07-29 | `drawio` absent on both, `DISPLAY` empty — the deploy targets produce source only |
| E-6 | `writing-specs` multi-persona review, UX researcher point of view | 2026-07-28 | Named the actor classes a roles table cannot see — the same populations whose screens this must cover |
| E-7 | Affected actors | — | **affected actors observed: none** — one user, who is the requester |

## 10. Change log

| Date | Change | Affected IDs | Reason | Approved by |
|---|---|---|---|---|
| 2026-07-29 | Initial draft | all | — | — |
| 2026-07-29 | Stage-6 gate corrected PASS → **BLOCKED**: MUST ratio was hand-written as 4 of 8, actual 6 of 7. FR-6 cut to OUT-6 — it claimed screen-to-screen navigation while OUT-5 disclaimed process diagrams, so one document both owned and disowned the same thing | gate, FR-6→OUT-6 | Same review; the collision was found by the business-analyst point of view | — |
| 2026-07-29 | Stage-6 gate **BLOCKED → OVERRIDDEN** by the repo owner: both tiers stay in the first cut. The 6-of-8 ratio stands as recorded | gate, §7 header | Owner answered the escalation directly | repo owner |
