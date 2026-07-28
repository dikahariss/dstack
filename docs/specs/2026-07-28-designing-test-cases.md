# Spec — a case set derived from the specification, before the code exists

Depth: LIGHT
Kind: FORWARD
Status: DRAFT
Implements: docs/discovery/2026-07-28-designing-test-cases.md (status: DRAFT)
Date: 2026-07-28 · Author: agent
Agreed by — business owner: —
Agreed by — technical owner: —

> The discovery document is DRAFT. Its requirement IDs are not stable.

## 0. Gate table

| Stage | Gate | PASS / BLOCKED / n/a | Evidence | Escalated to |
|---|---|---|---|---|
| 1 | every touched subsystem cited, or an explicit "searched, found nothing" | **PASS** | §2 — 6 citations, 2 not-found lines | — |
| 2 | every component traces to a requirement; every requirement and `C-n` claimed or out; non-NEW components cite their `E-n`; structural decision row exists | **PASS** | §3 — 6 components, coverage table holds 8 rows for 8 requirement IDs; discovery emitted no `C-n` | — |
| 3 | model | **n/a — Light depth; no new entity** | Depth rule | — |
| 4 | contracts | **n/a — Light depth; no new contract** | Depth rule | — |
| 5 | process and interface | **n/a — Light depth** | Depth rule | — |
| 6 | every FR and NFR has an AC; every AC names an observable consequence and its assertion level | **PASS** | §8 — 9 criteria over 8 requirements | — |
| 7 | gate table complete; open decisions have owners; every decision has a reversibility | **PASS** | this table, §9 | — |

## 1. Summary

- **What we are building:** a step that turns each thing the system promises into
  the concrete list of situations that would prove or disprove it.
- **The pieces it is made of:** instructions for the writer, a reference of the
  ways to pick situations, a form for the list, and the list itself.
- **What changes for the people who use it:** you can see, before any code
  exists, exactly which situations will be checked and which deliberately will
  not — so "did you cover everything" becomes a question you read, not ask.
- **What we decided not to do:** write the checks themselves, or run them.
- **The decision still open that matters most:** whether the list may be handed
  to a person as well as to the build process.
- Size: 6 components, 0 entities, 0 operations, 9 criteria.

## 2. Grounding — how it works today

The catalog already says what must be true and what will be built, and it already
has a strict discipline for writing one check at a time. What it lacks is the
step in between: turning one promise into the full list of situations worth
checking, before the code that would bias the list exists.

| # | What | Where (`path:line`) | What it showed |
|---|---|---|---|
| E-1 | The bias is already named in-repo | `skills/test-driven-development/SKILL.md:153-156` | "A test written after looking at your own implementation inherits its blind spots" — and its four classes are applied per behaviour |
| E-2 | Downstream gate needs an enumerated set | `skills/running-uat/SKILL.md:73` | "Acceptance criteria enumerated, Given/When/Then. No criteria → no UAT" |
| E-3 | Upstream produces one criterion per requirement | `skills/writing-specs/SKILL.md` Stage 6 | `AC-n` cites exactly one requirement — the input to this skill, not its output |
| E-4 | The iron law this must not break | `skills/test-driven-development/SKILL.md:31` | "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST" — one at a time, watched failing |
| E-5 | Sibling skills' shape, for consistency | `skills/writing-specs/SKILL.md`, `skills/discovering-requirements/SKILL.md` | Seven stages, gate table with evidence, `n/a` allowed, Light/Full depth, ID scheme, human-granted AGREED |
| E-6 | Budget mechanics | `src/domain/skill/SkillSpec.ts:58-59`, `src/adapters/claude-code/ClaudeCodeRenderer.ts:60-63` | 5,000 hard ceiling; warning above 90% of the declared budget; bundled files uncounted |
| E-7 | **Searched** 4 reference repos (~126 skills) for the technique vocabulary | — | **Found nothing.** Only `gstack/qa` matched, and it executes browser QA rather than designing cases |
| E-8 | **Searched** `src/` for any test-case parser, runner, or coverage checker | — | **Found nothing.** The renderer knows nothing about case sets; this stays a document |

## 3. Shape — components and boundaries

Four written pieces and two existing ones that are not changed. One piece tells
the writer how to proceed; two are opened only when reached; one is the list
itself. The existing length check refuses anything too long to read in one
sitting, and the existing regression cases record what the step must never do.

| ID | Component | Level | Inside | Status | One responsibility | Owns | Depends on | If dependency unavailable | Blocked by | Evidence | Serves |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CMP-1 | Stage spine | component | the skill | NEW | Order the seven passes and refuse at each | the gate verdicts | CMP-2, CMP-3 | references load on demand; absent → the stage cannot pass, gate says so | — | — | FR-1, FR-4, FR-5, FR-7 |
| CMP-2 | Technique reference | component | the skill | NEW | Say which derivation technique fits which shape, and when to stop | technique selection and stopping rules | — | n/a | — | — | FR-1 |
| CMP-3 | Case-set form | component | the skill | NEW | Fix the columns, the ID scheme, and the coverage tables | `TC-n` and the traceability rules | — | n/a | — | — | FR-2, FR-3, FR-7 |
| CMP-4 | The case set artifact | component | — | NEW | Be the reviewable list for one specification | its own IDs, gaps, and ordering | CMP-1, CMP-2, CMP-3 | n/a | CMP-1 | — | FR-2, FR-3, FR-4, FR-6 |
| CMP-5 | Render and check pipeline | container | dstack | UNCHANGED | Refuse a body over its declared budget | the token count | — | build fails loudly | — | E-6 | NFR-1 |
| CMP-6 | Behavioural regression cases | component | the skill | NEW | Record the failure modes this step exists to prevent | the anti-pattern list | CMP-1 | n/a | CMP-1 | — | FR-1, FR-5 |

First buildable slice: `CMP-2` and `CMP-3` are independent of everything and of
each other. `CMP-1` follows; `CMP-4` is produced by running it.

**Requirement coverage**

| Requirement | What it says | Covered by | Or out because |
|---|---|---|---|
| FR-1 | Derive cases using named techniques | CMP-1, CMP-2 | |
| FR-2 | Every case cites one criterion; every criterion has a case; gaps explicit | CMP-3, CMP-4 | |
| FR-3 | Level, preconditions, data, one observable result per case | CMP-3, CMP-4 | |
| FR-4 | Risk order | CMP-1, CMP-4 | |
| FR-5 | Hand to TDD one case at a time | CMP-1, CMP-6 | |
| FR-6 | Emit the criteria running-uat demands | CMP-4 | |
| FR-7 | State what is deliberately not covered | CMP-1, CMP-3 | |
| NFR-1 | Body under budget, reference loads on demand | CMP-5 | |

**Structural decision**

| Chosen decomposition | Alternative rejected | Boundary crossings, primary process | Why this one |
|---|---|---|---|
| One skill body plus two on-demand references | One self-contained body with the techniques inline | 2 (spine → each reference, when reached) | The technique catalogue plus the form runs well past the 5,000-token body ceiling (E-6); bundled files are uncounted and load only when the stage needs them. Same split as both siblings, so the trio stays consistent |

## 8. Acceptance criteria

| ID | Proves | What that requirement says | Given | When | Then (observable) | Checked at | Measured by |
|---|---|---|---|---|---|---|---|
| AC-1 | FR-1 | derive by named techniques | a specification with a numeric range and a rule combination | the skill runs | the case set names, per case, which technique produced it, and both a partition case and a boundary case exist for the range | human | — |
| AC-2 | FR-2 | bidirectional traceability | a produced case set | the coverage table is read | every criterion ID appears with ≥1 `TC-n`, every `TC-n` cites exactly one criterion, and uncovered criteria appear in the gap list | human | — |
| AC-3 | FR-2 | gaps explicit | a criterion no case covers | the set is published | a gap row names that criterion and why it is uncovered — silence is not permitted | human | — |
| AC-4 | FR-3 | case content | any `TC-n` row | it is read | it carries a level, preconditions, data, and exactly one expected observable result | human | — |
| AC-5 | FR-4 | risk order | a set of more than ten cases | the set is read top to bottom | cases appear in descending risk order, and the ordering rationale is stated once | human | — |
| AC-6 | FR-5 | one at a time | a completed case set | it is handed to implementation | the hand-off names one case, not the set, and the skill states that mass red tests break the iron law (E-4) | human | — |
| AC-7 | FR-6 | UAT entry gate | a completed case set | `/running-uat` reads it | the manual-level cases are in Given/When/Then form and satisfy the entry gate at `running-uat:73` without rework | human | — |
| AC-8 | FR-7 | deliberate non-coverage | a produced case set | the out-of-scope section is read | it is non-empty or states `None — <why>`, and each row says what risk is being accepted | human | — |
| AC-9 | NFR-1 | budget | the skill source | `bun run validate` runs | 0 errors, and the skill reports OK with no `token-near-budget` warning | e2e | `bun run validate` on this repo |

Eight of nine are human-judged: this artifact is a document, and the renderer
has no vocabulary for case sets (E-8). `AC-9` is the only mechanical one, and it
is the only requirement a tool can hold.

## 9. Decisions

We kept the step small on purpose. It produces a list and stops; writing and
running the checks stay where they already live, and nothing here teaches the
build machinery a new trick.

| ID | Decision | Serves | Alternative rejected | Why | Reversibility | Decided by | Decided on | ADR? |
|---|---|---|---|---|---|---|---|---|
| D-1 | The output is a case *list*, never test code | FR-5 | emitting runnable test files | Mass red tests break TDD's iron law (E-4): the discipline is one failing test, watched. A list feeds that loop; a directory of red tests replaces it | reversible | agent | 2026-07-28 | no — 1 of 3 |
| D-2 | Techniques and form live in bundled references | NFR-1 | one self-contained body | Body ceiling is 5,000 and the catalogue alone exceeds the headroom (E-6) | reversible | agent | 2026-07-28 | no — forced by a constraint |
| D-3 | Cases cite exactly one criterion, never many | FR-2 | allowing a case to prove several | A case proving three criteria fails all three ambiguously, and the coverage table stops being readable | costly | agent | 2026-07-28 | no — 2 of 3 |
| D-4 | Stop at pairwise unless evidence demands more | FR-1 | full combinatorial coverage | Higher-order interaction defects are rare enough that the cost is not repaid; the stopping rule is what keeps a set finite | reversible | agent | 2026-07-28 | no |
| D-5 | Seven stages, gate table, Light/Full depth, `n/a` verdicts — same shape as both siblings | FR-1 | a shape fitted to this task alone | Three chained skills that diverge in convention drift apart within a month; consistency is worth more than local fit | costly | agent | 2026-07-28 | no — 2 of 3 |

**Non-functional consequences**

| NFR | Structural consequence it caused | Or: none, because |
|---|---|---|
| NFR-1 | Forced D-2 — the two-reference split exists only because of the body ceiling | |

**Open decisions**

| # | Question | Options | Owner | Blocks | Needed by |
|---|---|---|---|---|---|
| 1 | Whether a case set may be handed to a human tester as a script, not only to TDD and UAT | (a) yes, add a manual-run column; (b) no, keep it agent-facing | repo owner | nothing — additive | first manual QA use |
| 2 | Whether `AC-9`'s mechanical check should extend to the case set itself (a linter for orphan `TC-n`) | (a) yes, new renderer code; (b) no, renderer scope is frozen (ADR-0028) | repo owner | nothing | a coverage gap actually ships |

## 10. Out of scope

We are not building the checks, not running them, and not measuring which lines
of code they touched. Someone still writes each check by hand, one at a time.

| ID | Item | Why out | What makes it cheap or expensive later | Revisit when |
|---|---|---|---|---|
| SOUT-1 | Writing the test code | `/test-driven-development` owns it; D-1 | Cheap — the list is already per-case | never |
| SOUT-2 | Running tests, reporting results | `/verifying-before-done`, `/running-uat` own execution | Cheap — no coupling created | never |
| SOUT-3 | White-box coverage measurement | A tool reports it; a spec-derived set is black-box by construction | Cheap — orthogonal | a coverage tool is wired into CI |
| SOUT-4 | Performance and load scripting | Different craft and tools; the NFR's pass condition is this skill's edge | Moderate — would need a new level | a load-testing need is named |
| SOUT-5 | Exploratory testing charters | Unscripted by definition; complements a designed set | Cheap — additive | a charter practice is adopted |

## 11. Cost, verification, and review

| Build effort band | Ongoing operational load | What cutover does to live work | Fallback when unavailable |
|---|---|---|---|
| Under one day | None — a document, no runtime | None; nothing in flight | The four TDD classes, applied per behaviour, as today |

**Reviewer log**

| Date | Reviewer, role | Objection | Resolution | Status |
|---|---|---|---|---|

## 12. Change log

| Date | Change | Affected IDs | Reason | Approved by | Downstream plan tasks invalidated |
|---|---|---|---|---|---|
| 2026-07-28 | Initial draft | all | — | — | — |
| 2026-07-28 | Amended after review + trial: `AC-7` was structurally unmet — the case table had no Given/When/Then and no action column, so the `running-uat` hand-off `FR-6` promised could not work; and the Light depth skipped Stage 4 while still requiring its output, voiding `FR-3` | AC-7, FR-3, FR-6, D-1 | A five-point-of-view review and a 60-case trial found both independently | — | none — no plan written yet |
