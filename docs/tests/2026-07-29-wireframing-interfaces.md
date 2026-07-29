# Test cases — a screen you can argue with before anyone builds it

Depth: FULL
Derivation: SPEC-DERIVED (implementation does not exist yet — nothing to read)
Derives from: docs/specs/2026-07-29-wireframing-interfaces.md (status: DRAFT)
Status: DRAFT
Date: 2026-07-29 · Author: agent

## 0. Gate table

| Stage | Gate | PASS / BLOCKED / n/a | Evidence | Escalated to |
|---|---|---|---|---|
| 1 | criteria listed by ID; derivation mode stated | **PASS** | §2 — 10 criteria; SPEC-DERIVED, code does not exist | — |
| 2 | variables and classes named, or "no variability" | **PASS** | §3 — 6 variables; two decision tables | — |
| 3 | happy + ≥1 other per criterion; skipped classes have a gap | **PASS** | §4; skips in §5 | — |
| 4 | falsification target, level, action, data, one verdict each | **PASS** | §4a — 28 rows | — |
| 5 | ordered; rationale once; release effect on every case | **PASS** | §4b | — |
| 6 | traceability both ways; gaps with owners; duplicates resolved | **PASS** | §5 — 10 of 10; 4 gaps | — |
| 7 | table complete; first buildable case named | **PASS** | this table; start at TC-1 | — |
| — | bias checks (wrong implementation, hostile client) | **PASS** | §5 — three named, each caught | — |

## 1. Summary

- **What is being proved:** that every state the design document names gets
  drawn, that nothing is quietly left out, and that the picture stays rough.
- **What we are choosing not to prove:** that the screen is *good* — no case
  here can judge that, and pretending otherwise would be the worst outcome (G-1).
- Criteria with ≥1 case: **10 of 10**. Gaps: 4.
- Cases: 28 — happy 8, edge 6, invalid 8, chaos 6. Non-happy: **71%**.
- Release effect: 13 BLOCKER, 15 ADVISORY.
- Estimated run cost: automated ~4 min; human ~2 person-hours — the fidelity and
  "is this the right order" checks are irreducibly human.
- Start here: **TC-1** — a silently missing state is the failure everything else
  is built to prevent.

## 2. Grounding — what already exists

| Criterion | Existing tests | Assessment |
|---|---|---|
| AC-1 … AC-10 | none | Greenfield. AC-10's mechanism has prior art in every other skill's `bun run validate` |

## 3. Variables and classes

| Criterion | Variable | Valid classes | Invalid classes (by reason) | Boundary source | Shape | Techniques |
|---|---|---|---|---|---|---|
| AC-1, AC-9 | step actor | a human interacts | a job / API / batch step; actor unstated | the spec's step table | conditions | **decision table** |
| AC-2, AC-3 | states named by the spec | any subset of the five | a state named but undrawable; a sixth state invented | `spec-doc.md:241` | conditions | decision table |
| AC-4 | toolchain | program + display | program absent; display absent | `command -v`, `DISPLAY` | conditions | decision table |
| AC-5 | trace | ≥1 step **and** ≥1 requirement | a screen citing neither; citing a step that does not exist | the spec's IDs | conditions | EP |
| AC-6 | styling present in the artifact | neutral shapes only | any brand colour; any typeface choice; any spacing scale | the fidelity cap | universal negative | **sink enumeration + absence scan** |
| AC-7 | navigation | every route drawn incl. rejection | rejection route absent; a route with no return | the spec's terminal outcomes | conditions | decision table |

### 3a. Which steps get a screen

Conditions: **A** = the step has a human actor · **B** = the spec names ≥1 state.

| # | A | B | Outcome | Case |
|---|---|---|---|---|
| R1 | yes | yes | draw, one panel per named state | TC-4 |
| R2 | yes | no | draw the default panel, record a gap for the missing states | TC-6 |
| R3 | no | — | do not draw; record the reason | TC-7 |

Four combinations collapse to three; `R3` folds because with no human actor `B`
cannot change the outcome. **Don't-care probe:** TC-8 varies `B` under `R3`.

### 3b. Fidelity — the universal negative

"No brand colour, no typeface choice, no spacing scale" quantifies over the
whole artifact, not over an input. Sinks to scan: shape fill and stroke
attributes, text style attributes, any embedded stylesheet, the embedded source
XML, and the exported image. One absence-scan case per sink, plus a human
completeness case, because nothing automated can prove the sink list is whole.

## 4. Cases

### 4a. Design

| ID | Proves | Class | Technique | Falsifies | Level | Action | Preconditions (must exist / must NOT exist) | Data | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| TC-1 | AC-3 | invalid | decision table R2 | the silent omission | integration | run against a step whose spec names no Loading state | a spec step table | 1 step, 4 states named | the loading panel is absent **and** appears in the skipped list with a reason — absence and omission stay distinguishable |
| TC-2 | AC-2 | happy | decision table R1 | the state coverage | integration | run against a step naming Empty, Denied, Failed | a spec step table | 1 step, 3 states | exactly three panels exist for that screen |
| TC-3 | AC-2 | edge | boundary | the state coverage | integration | run against a step naming all five states | — | 1 step, 5 states | five panels; none merged, none dropped |
| TC-4 | AC-1 | happy | decision table R1 | the derivation | integration | run against three interactive steps | a spec step table | 3 steps | three screens exist, each opening in the drawing tool |
| TC-5 | AC-1 | invalid | EP invalid-absent | the input gate | unit | run with no step table present | spec without a step table | — | it refuses and routes to `/writing-specs`; it does not invent screens |
| TC-6 | AC-2 | edge | decision table R2 | the default | integration | run against a step naming zero states | — | 1 step, 0 states | one default panel plus a gap row saying no states were specified |
| TC-7 | AC-9 | invalid | decision table R3 | the actor rule | integration | run against a nightly job step | — | 1 job step | no screen is drawn, and the manifest records why |
| TC-8 | AC-9 | edge | don't-care probe | the collapse | integration | run against a job step that *does* name states | — | 1 job step, 3 states | still no screen — the collapse holds, states do not override the actor rule |
| TC-9 | AC-6 | happy | absence scan | the fidelity cap | integration | scan the artifact's shape fill and stroke attributes | a produced set | 3 screens | no colour value outside the neutral set appears |
| TC-10 | AC-6 | edge | absence scan | the fidelity cap | integration | scan text style attributes | a produced set | 3 screens | no typeface family is specified anywhere |
| TC-11 | AC-6 | edge | absence scan | the fidelity cap | integration | scan for an embedded stylesheet or spacing tokens | a produced set | 3 screens | none present |
| TC-12 | AC-6 | invalid | error guessing | the cap under pressure | integration | run against a spec whose field labels contain colour words | — | fields named "Tombol Hijau" | the label is drawn as text; no fill colour is derived from it |
| TC-13 | AC-6 | edge | human completeness | the sink list | human | review the sink list against the produced artifact | a produced set | — | every place styling could hide is either scanned or named in the gap list |
| TC-14 | AC-6 | happy | absence scan | the marker | unit | look for the fidelity marker | a produced set | 3 screens | every screen carries a visible "not visual design" marker |
| TC-15 | AC-5 | happy | EP valid | the trace | unit | read the manifest | a produced set | 3 screens | every screen names ≥1 step ID and ≥1 requirement ID |
| TC-16 | AC-5 | invalid | EP invalid | the trace | unit | produce a screen citing a step ID absent from the spec | contrived input | — | the gate refuses and names the dangling ID |
| TC-17 | AC-7 | happy | decision table | the navigation | human | read the navigation of a flow with a rejection route | a produced set | submit → verify → reject → resubmit | the rejection route is drawn **and** shows how the person returns |
| TC-18 | AC-7 | invalid | decision table | the navigation | human | run against a flow whose spec has a rejection with no return | — | 1 dead-end route | the dead end is drawn as a dead end and flagged, not silently closed into a loop |
| TC-19 | AC-4 | invalid | decision table | the probe | integration | run with the program absent | no program on PATH | 2 screens | the editable file still exists; render rows read `n/a` with a reason; nothing claims a missing file |
| TC-20 | AC-8 | happy | sink enumeration | the report | human | read the chat report of a partial run | program absent | 3 steps, 1 a job | drawn and skipped appear side by side |
| TC-21 | AC-10 | happy | property | the budget | e2e | run `bun run validate` | the skill source | — | 0 errors, no `token-near-budget` warning |
| TC-22 | AC-1 (← R-1) | chaos | fault injection | the shape library | integration | run with the mockup shape set unavailable | program present, shapes missing | 1 screen | plain rectangles are drawn **and** a note records the substitution — never a silent swap |
| TC-27 | AC-11 | invalid | error guessing | the legibility check | e2e | render a panel whose field label is far longer than its control, then run the check | program + display | 1 screen, 1 long label | the overflow is reported naming the screen and the control; the panel is not presented as clean |
| TC-28 | AC-11 | chaos | fault injection | the check itself | e2e | make the legibility check exit non-zero | program + display | 2 screens | the failure is surfaced as *check failed*, never as *no defects found* |
| TC-23 | AC-3 | chaos | fault injection | the drawing program | integration | kill the program mid-render | program present, forced exit | 3 screens | the error is surfaced verbatim, the run reports failed-not-skipped, and no zero-byte panel is left on disk |
| TC-24 | AC-1 | chaos | fault injection | the input's stability | integration | edit the spec's step table while the run is in progress | a spec being edited | 3 steps → 4 | the manifest records which revision of the step table it read; it never mixes two |
| TC-25 | AC-4 | chaos | fault injection | the filesystem | integration | make the output directory unwritable | program present | 2 screens | a specific permission error; nothing partially written, no half-updated manifest |
| TC-26 | AC-2 | chaos | concurrency | the write path | integration | two runs against the same screen set at once | program present | same 3 steps | the final set is one coherent generation, not an interleaving |

### 4b. Planning

| ID | Risk | Release effect | Tier | Depends on | Setup | Status |
|---|---|---|---|---|---|---|
| TC-1, TC-2, TC-3 | H | BLOCKER | per-commit | — | none | TODO |
| TC-4, TC-5 | H | BLOCKER | per-commit | — | none | TODO |
| TC-6, TC-7, TC-8 | M | ADVISORY | per-commit | TC-4 | none | TODO |
| TC-9 … TC-12, TC-14 | H | BLOCKER | per-commit | TC-4 | none | TODO |
| TC-13 | M | ADVISORY | per-release | TC-9 | human reviewer | TODO |
| TC-15, TC-16 | M | ADVISORY | per-commit | TC-4 | none | TODO |
| TC-17, TC-18 | M | ADVISORY | per-release | TC-4 | human reviewer | TODO |
| TC-19, TC-20 | H | BLOCKER | per-commit | — | none | TODO |
| TC-21 | M | BLOCKER | per-commit | — | none | TODO |
| TC-22 | M | ADVISORY | per-release | TC-4 | new harness | TODO |
| TC-23, TC-25 | M | ADVISORY | per-release | TC-4 | new harness | TODO |
| TC-27, TC-28 | H | ADVISORY | per-release | TC-4 | needs the check | TODO |
| TC-24, TC-26 | M | ADVISORY | per-release | TC-4 | new harness | TODO |

**Ranking rationale, stated once:** a state that is missing without being
recorded is invisible and therefore never fixed — it outranks everything. The
fidelity cap ranks next because breaking it silently changes what reviewers talk
about, which defeats the skill without any visible failure.

## 5. Coverage

| Criterion | What it says | Cases | Classes covered |
|---|---|---|---|
| AC-1 | step table → one screen per interactive step | TC-4, TC-5, TC-22, TC-24 | happy, invalid, chaos |
| AC-2 | a panel per named state | TC-2, TC-3, TC-6, TC-26 | happy, edge, chaos |
| AC-3 | an unnamed state is skipped **and recorded** | TC-1, TC-23 | invalid, chaos |
| AC-4 | no program → editable still produced, `n/a` rows | TC-19, TC-25 | invalid, chaos |
| AC-5 | every screen traces to step + requirement | TC-15, TC-16 | happy, invalid |
| AC-6 | fidelity cap + visible marker | TC-9 … TC-14 | happy, edge, invalid |
| AC-7 | navigation incl. the rejection route | TC-17, TC-18 | happy, invalid |
| AC-8 | drawn and skipped side by side | TC-20 | happy |
| AC-9 | no human actor → no screen, reason recorded | TC-7, TC-8 | invalid, edge |
| AC-10 | budget | TC-21 | happy |
| AC-11 | legibility defects reported, never swallowed | TC-27, TC-28 | invalid, chaos |

**Derived risks raised back to the spec**

| ID | Risk | Where it came from | Proposed criterion |
|---|---|---|---|
| R-1 | The mockup shape set could be unavailable on a machine that otherwise renders, producing plain boxes that look like a deliberate choice | asking what breaks around AC-1 | *A shape substitution is recorded on the artifact, never silent.* |

**Gaps**

| ID | Kind | Subject | What is missing | Risk accepted | Accepted by | Revisit when |
|---|---|---|---|---|---|---|
| G-1 | out-of-scope | all | Nothing here judges whether the screen is *good* | A well-formed picture of a bad flow passes every case; only the human review in `TC-17`/`TC-18` catches it, and only if someone looks | repo owner | never — no automated case can hold this |
| G-2 | unstated-rule | AC-6 | Open decision 2 — whether the fidelity cap survives a real stakeholder — is unresolved; the cases assert the strict reading | If the cap is relaxed, TC-9 … TC-12 become wrong rather than incomplete | repo owner | first stakeholder review |
| G-3 | unstated-rule | AC-9 | Open decision 1 — whether a non-human step should get a data-flow panel instead of nothing | TC-7 and TC-8 assert "nothing"; if that flips, both invert | repo owner | before build |
| G-4 | skipped-class | AC-5, AC-7 | No chaos class for trace or navigation | A malformed spec could produce a plausible but wrong trace; the input is our own artifact, so the likelihood is low | repo owner | if a malformed spec is ever seen |

**Shape check**

| Class | Count | Share |
|---|---|---|
| happy | 8 | 29% |
| edge | 6 | 21% |
| invalid | 8 | 29% |
| chaos | 6 | 21% |

Non-happy **77%** — diagnostic. High because the value of this skill is
concentrated in what it refuses to do quietly.

**Bias check — three wrong implementations:** (a) draws only the populated state
and reports success → TC-1, TC-3; (b) derives colour from a field label because
it "looked like a design hint" → TC-12; (c) draws a screen for every step
including jobs, inflating the set → TC-7. **Weakest spot:** an implementation
that draws nothing at all passes every absence scan (TC-9 … TC-11) — TC-2 and
TC-4 are the rows that stop it, which is why both are BLOCKER.

## 6. Run record

| Run | Build / commit | Date | Environment | Passed | Failed | Blockers failed | Run by |
|---|---|---|---|---|---|---|---|

## 7. Review and change log

| Date | Reviewer, role | Objection | Resolution | Status |
|---|---|---|---|---|

| Date | Change | Affected IDs | Reason |
|---|---|---|---|
| 2026-07-29 | Initial draft | all | — |
