# Test cases — a diagram that can leave the document

Depth: FULL
Derivation: SPEC-DERIVED (implementation does not exist yet — nothing to read)
Derives from: docs/specs/2026-07-29-diagramming-architecture.md (status: DRAFT)
Status: DRAFT
Date: 2026-07-29 · Author: agent

## 0. Gate table

| Stage | Gate | PASS / BLOCKED / n/a | Evidence | Escalated to |
|---|---|---|---|---|
| 1 | criteria listed by ID; derivation mode stated | **PASS** | §2 — 10 criteria; SPEC-DERIVED, and the code does not exist yet so there is nothing to be biased by | — |
| 2 | variables and classes named, or "no variability" | **PASS** | §3 — 6 variables; the degradation rule is a decision table | — |
| 3 | happy + ≥1 other per criterion; skipped classes have a gap | **PASS** | §4 — every criterion has ≥2 classes; skips in §5 | — |
| 4 | falsification target, level, action, data, one verdict each | **PASS** | §4a — 25 rows, all columns filled (TC-12/TC-13 WITHDRAWN with FR-7) | — |
| 5 | ordered; rationale once; release effect on every case | **PASS** | §4b | — |
| 6 | traceability both ways; gaps with owners; duplicates resolved | **PASS** | §5 — 10 of 10 criteria; 4 gaps; 1 duplicate collapsed | — |
| 7 | table complete; first buildable case named | **PASS** | this table; start at TC-1 | — |
| — | bias checks (wrong implementation, hostile client) | **PASS** | §5 — three wrong implementations named, each caught | — |

## 1. Summary

- **What is being proved:** that the step tells the truth about what it produced,
  and that the written source stays the one that counts.
- **What we are choosing not to prove:** anything about how the drawing program
  itself renders — that is someone else's software (G-2).
- Criteria with ≥1 case: **9 of 9** (AC-9 withdrawn with FR-7). Gaps: 4.
- Cases: 25 — happy 6, edge 5, invalid 8, chaos 6. Non-happy: **76%**.
- Release effect: 12 BLOCKER, 13 ADVISORY.
- Estimated run cost: automated ~6 min; human ~1 person-hour.
- Start here: **TC-1** — nothing else can be trusted until the probe cannot lie.

## 2. Grounding — what already exists

| Criterion | Existing tests | Assessment |
|---|---|---|
| AC-1 … AC-10 | none | Greenfield; the skill does not exist. `bun run validate` already covers AC-10's mechanism for every other skill, so that one row has prior art |

## 3. Variables and classes

| Criterion | Variable | Valid classes | Invalid classes (by reason) | Boundary source | Shape | Techniques |
|---|---|---|---|---|---|---|
| AC-1, AC-4, AC-6 | drawing program | present and usable | absent; present but no display; present but errors on invoke | `command -v`, `DISPLAY` | conditions | **decision table** |
| AC-7 | diagram kind | flowchart (convertible) | sequence, state, ER (not convertible) | E-8, converter's own limit | conditions | decision table |
| AC-3 | source content | unchanged since last run | changed; hash absent | the manifest's hash field | conditions + property | EP + **idempotence property** |
| AC-8 | altitudes in one request | exactly one | two or more; none named | C4 levels | range | EP |
| AC-2, AC-5 | manifest completeness | every artifact has source + hash | an artifact with no provenance row | — | universal claim | **sink enumeration** |
| AC-9 | edited artifact | matches source | diverged; unreadable | — | conditions | decision table |

### 3a. Degradation decision table

Conditions: **A** = program on `PATH` · **B** = a display is usable ·
**C** = the diagram kind converts.

| # | A | B | C | Editable file | Viewable file | Case |
|---|---|---|---|---|---|---|
| R1 | yes | yes | yes | produced | produced | TC-6 |
| R2 | yes | yes | no | `n/a`, kind named | produced | TC-8 |
| R3 | yes | no | — | produced | `n/a`, no display | TC-4 |
| R4 | no | — | — | produced | `n/a`, absent | TC-2 |

Eight combinations collapse to four. `R3` and `R4` fold because without a render
path `C` cannot change either outcome. **Don't-care probes:** TC-5 varies `C`
under `R4`, TC-3 varies `B` under `R4` — one per collapse, because a collapse is
an assumption until something tests it.

## 4. Cases

### 4a. Design

Ordered by risk. `Falsifies` names what the case is trying to break; where that
is a collaborator, it is real at the assigned level.

| ID | Proves | Class | Technique | Falsifies | Level | Action | Preconditions (must exist / must NOT exist) | Data | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| TC-1 | AC-4 | invalid | decision table R4 | the probe | integration | run the skill with `PATH` cleared of the program | no program on PATH | one flowchart | every render row reads `n/a` **and** names absence as the reason; no file is claimed that is not on disk |
| TC-2 | AC-4 | invalid | decision table R4 | the probe | integration | as TC-1 | as TC-1 | one flowchart | the `.mmd` and `.drawio` files exist on disk |
| TC-3 | AC-4 | edge | don't-care probe | the probe's collapse | integration | run with program absent **and** `DISPLAY` unset | neither | one flowchart | identical verdict to TC-1 — the collapse holds |
| TC-4 | AC-4 | chaos | decision table R3 | the display dependency | integration | run with the program present, `DISPLAY` cleared | program present / no display | one flowchart | render rows `n/a` naming *no display*, not *absent* — the two reasons stay distinguishable |
| TC-5 | AC-7 | edge | don't-care probe | the collapse | integration | run with program absent, kind = sequence | no program | one sequence diagram | verdict identical to TC-1; the kind limitation is not reported as a machine limitation |
| TC-6 | AC-1 | happy | decision table R1 | the conversion | integration | run with everything present | program + display | one flowchart | a `.drawio` file exists and opens in the drawing tool |
| TC-7 | AC-6 | happy | property | the embedded source | integration | render, then convert the SVG back to XML | program + display | one flowchart | the round-trip yields XML containing the same node count as the source |
| TC-8 | AC-7 | invalid | decision table R2 | the false-editability claim | integration | run with kind = sequence, program present | program + display | one sequence diagram | the editable row reads `n/a` naming the kind, **and** the report's wording does not call the output editable |
| TC-9 | AC-3 | happy | idempotence property | non-determinism | e2e | run twice on an unchanged source, normalising the generated `diagram id` | first run's output present | one flowchart | the normalised files are identical, and the manifest's source hash is unchanged. **Measured 2026-07-29: raw bytes differ — draw.io mints a random diagram id per run** |
| TC-10 | AC-3 | edge | idempotence property | the hash | e2e | change one edge label, re-run | first run present | flowchart, 1 label changed | the artifact changes **and** the manifest's hash changes |
| TC-11 | AC-3 | invalid | EP invalid-absent | the manifest | unit | read a manifest whose hash field is missing | manifest without hash | — | the run refuses and names the missing field; it does not regenerate blindly |
| TC-14 | AC-2 | happy | sink enumeration | the manifest | unit | read the manifest after a full run | a produced set | 3 diagrams | every artifact row names its source file and hash — zero rows without provenance |
| TC-15 | AC-2 | invalid | sink enumeration | the manifest | unit | produce a set where one artifact has no source row | contrived set | — | the gate refuses and names the orphan artifact |
| TC-16 | AC-5 | happy | sink enumeration | the report | human | read the chat report of a partial run | program absent | 2 diagrams | produced and skipped appear side by side; the reader can tell what is missing without opening the directory |
| TC-17 | AC-5 | invalid | error guessing | the report's honesty | human | read the report of a source-only run | program absent | 1 diagram | the report contains no sentence asserting a rendered or viewable output exists |
| TC-18 | AC-8 | invalid | EP invalid | the altitude rule | human | request one picture spanning context and component | — | a mixed request | it is split into one diagram per altitude, each labelled — or refused with the reason stated |
| TC-19 | AC-8 | edge | EP boundary | the altitude rule | human | request a diagram with no altitude named | — | bare request | the skill names one and says why, rather than drawing at an unstated altitude |
| TC-20 | AC-10 | happy | property | the budget | e2e | run `bun run validate` | the skill source | — | 0 errors and no `token-near-budget` warning |
| TC-21 | AC-1 | chaos | fault injection | the program | integration | make the program exit non-zero mid-render | program present, forced failure | one flowchart | the error is surfaced verbatim, the row reads failed-not-skipped, and no zero-byte artifact is left behind |
| TC-22 | AC-1 | chaos | fault injection | the filesystem | integration | make the output directory unwritable | program present | one flowchart | a specific permission error; nothing partially written |
| TC-23 | AC-6 (← R-1) | chaos | fault injection | the embedded source | integration | render, truncate the SVG's embedded source, read back | program + display | one flowchart | the read-back reports the artifact as unreadable rather than silently reporting "no difference" |
| TC-25 | AC-11 | invalid | error guessing | the legibility check | e2e | render a diagram whose label is far longer than its box, then run the check | program + display | one flowchart, 1 long label | the overflow is reported and names the element; the report does not describe the diagram as clean |
| TC-26 | AC-12 | edge | sink enumeration | the report's honesty | human | read the report of a source-only run | no program | one flowchart | it states the legibility check **did not run**, and nowhere implies the diagram is legible |
| TC-27 | AC-11 | chaos | fault injection | the check itself | e2e | make the legibility check exit non-zero | program + display | one flowchart | the failure is surfaced as *check failed*, never as *no defects found* |
| TC-24 | AC-3 (← R-2) | chaos | concurrency | the write path | integration | two runs on the same set at once | program present | same flowchart | the final set is one coherent generation, not an interleaving of two |

### 4b. Planning

| ID | Risk | Release effect | Tier | Depends on | Setup | Status |
|---|---|---|---|---|---|---|
| TC-1, TC-2 | H | BLOCKER | per-commit | — | none | TODO |
| TC-3, TC-4, TC-5 | H | BLOCKER | per-commit | TC-1 | none | TODO |
| TC-6, TC-7, TC-8 | H | BLOCKER | per-release | TC-1 | needs the program | TODO |
| TC-9, TC-10, TC-11 | H | BLOCKER | per-commit | TC-6 | none | TODO |
| ~~TC-12, TC-13~~ | — | — | — | — | — | **WITHDRAWN** — criterion cut |
| TC-14 … TC-19 | M | ADVISORY | per-commit | TC-6 | none | TODO |
| TC-20 | M | BLOCKER | per-commit | — | none | TODO |
| TC-21 … TC-24 | M | ADVISORY | per-release | TC-6 | new harness | TODO |
| TC-25, TC-27 | H | ADVISORY | per-release | TC-6 | needs the check | TODO |
| TC-26 | M | ADVISORY | per-commit | — | none | TODO |

**Ranking rationale, stated once:** a false claim about what was produced is
irreversible in the reader's mind and is the only failure that cannot be noticed
from the output itself — so probe honesty ranks above conversion, conversion
above idempotence, idempotence above reporting polish.

## 5. Coverage

| Criterion | What it says | Cases | Classes covered |
|---|---|---|---|
| AC-1 | editable file opens in the tool | TC-6, TC-21, TC-22 | happy, chaos |
| AC-2 | every artifact names source + hash | TC-14, TC-15 | happy, invalid |
| AC-3 | unchanged source → byte-identical output | TC-9, TC-10, TC-11, TC-24 | happy, edge, invalid, chaos |
| AC-4 | no program → `n/a` rows, source still produced | TC-1, TC-2, TC-3, TC-4 | invalid, edge, chaos |
| AC-5 | produced and skipped side by side | TC-16, TC-17 | happy, invalid |
| AC-6 | viewable form round-trips | TC-7, TC-23 | happy, chaos |
| AC-7 | non-convertible kind reported honestly | TC-8, TC-5 | invalid, edge |
| AC-8 | one altitude per diagram | TC-18, TC-19 | invalid, edge |
| ~~AC-9~~ | withdrawn — FR-7 cut to SOUT-6 on 2026-07-29; TC-12 and TC-13 keep their IDs as `WITHDRAWN` | — | — |
| AC-10 | budget | TC-20 | happy |
| AC-11 | legibility defects are reported, never swallowed | TC-25, TC-27 | invalid, chaos |
| AC-12 | a check that did not run is said so | TC-26 | edge |

**Derived risks raised back to the spec**

| ID | Risk | Where it came from | Proposed criterion |
|---|---|---|---|
| R-1 | An artifact whose embedded source is damaged could read back as "no difference", which is indistinguishable from success | asking what breaks around AC-6 | *A read-back that cannot parse the embedded source reports unreadable, never no-difference.* |
| R-2 | Two concurrent runs on one set could interleave | asking what breaks around AC-3 | *A generation is atomic per set.* |

**Gaps**

| ID | Kind | Subject | What is missing | Risk accepted | Accepted by | Revisit when |
|---|---|---|---|---|---|---|
| G-1 | unstated-rule | AC-9 | Open decision 1 — whether write-back is ever allowed — is unresolved, so TC-12 asserts the strict reading | If write-back is later allowed, TC-12 becomes wrong rather than merely incomplete | repo owner | before the first round-trip |
| G-2 | out-of-scope | AC-6 | Nothing tests the drawing program's own rendering fidelity | A visually wrong but structurally valid render ships unnoticed | repo owner | never — it is someone else's software |
| G-3 | skipped-class | AC-8, TC-19 | No chaos class for the altitude rule | An altitude error under an unusual input goes undetected; the rule is judgement-level anyway | repo owner | if one is found |
| G-4 | unstated-rule | AC-1 | The spec does not say what happens when the program is present but a *different major version* | A future version could change flags silently | repo owner | before deploying to a second machine |

**Shape check**

| Class | Count | Share |
|---|---|---|
| happy | 6 | 24% |
| edge | 5 | 20% |
| invalid | 8 | 32% |
| chaos | 6 | 24% |

Non-happy share **76%** — diagnostic, not a target. It is high here because the
skill's entire risk lives in the degraded paths.

**Duplicate collapsed:** an early TC for "program absent, no display" duplicated
TC-1 on level+action+data+verdict; folded into TC-3 as the explicit probe.

**Bias check — three wrong implementations, and what catches each:**
(a) a probe that assumes the program is present because `PATH` lookup errored →
TC-1; (b) a run that writes the manifest before the render actually succeeded →
TC-21; (c) a read-back that returns "no difference" on any parse failure →
TC-23. The set is not merely confirmatory. **Weakest spot:** an implementation
that produces nothing at all still passes TC-1 and TC-2 only if it also writes
the source — TC-2 is the row that stops it, which is why it is a BLOCKER.

## 6. Run record

| Run | Build / commit | Date | Environment | Passed | Failed | Blockers failed | Run by |
|---|---|---|---|---|---|---|---|

## 7. Review and change log

| Date | Reviewer, role | Objection | Resolution | Status |
|---|---|---|---|---|

| Date | Change | Affected IDs | Reason |
|---|---|---|---|
| 2026-07-29 | Initial draft | all | — |
