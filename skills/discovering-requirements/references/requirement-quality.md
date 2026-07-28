# The requirement quality bar

Applied to every `BR` / `SR` / `FR` / `NFR` before the document leaves DRAFT.
The characteristics follow ISO/IEC/IEEE 29148; the smells are the shapes that
violate them in practice.

## Per requirement

| Characteristic | Ask | Fails when |
|---|---|---|
| **Necessary** | remove it — does anything break? | it restates another requirement one level up, or nothing depends on it |
| **Singular** | how many things must be true for this to pass? | contains "and", "also", ";", or a comma list of behaviours |
| **Complete** | does it state condition, action, and outcome without needing anything else? | "rejects invalid rows" with *invalid* defined nowhere; any `TBD` |
| **Unambiguous** | could two engineers build different things from this? | "appropriate", "as needed", "etc.", "properly" |
| **Verifiable** | what test proves it? | "user-friendly", "fast", "robust", "intuitive", "scalable" |
| **Feasible** | possible within the stack, budget, and time? | assumes data the system never collects, or a dependency nobody owns |
| **Implementation-free** (BR/SR only) | does it name a technology or UI? | "using Redis", "a dropdown showing…" — that is a design decision |
| **Traceable** | which parent does it serve, and which child serves it? | traces nowhere, or has no child and no out-of-scope row |
| **Correct** | does the affected actor recognise it as their need? | it came from you, or from someone describing them, and is marked INFERRED |

## Per set

| Characteristic | Ask |
|---|---|
| **Complete** | is any actor from §4 missing a requirement? any error path unwritten? any `C-n` undischarged? |
| **Consistent** | do any two requirements contradict, or use one term for two things? A contradiction goes in the conflict register — it is not an open question |
| **Feasible as a set** | forty requirements each individually doable, and collectively unbuildable in the window, is a failing set |
| **Able to be validated** | can the set be checked against the need without building it first? |
| **Bounded** | does the set stay inside the stated scope? |
| **Comprehensible** | can a non-technical stakeholder read the `BR`/`SR` levels unaided? |
| **Not single-sourced** | which requirements have exactly one source, and is that source the affected actor or someone describing them? |

## Pass condition, not a number

An `NFR` needs a **pass condition** — something a test can decide. A number is
the common form, not the only one, and demanding a number deforms exactly the
requirements that matter most.

| Kind | Pass condition |
|---|---|
| Scalar | "p95 under 2 s for a 12-month range" |
| Criterion set | "every function operable by keyboard alone; form errors announced to a screen reader" |
| Obligation | "each personal-data field has a stated lawful basis recorded in §5, `C-3`" |
| State | "a submission acknowledged with 2xx is retrievable after a process restart" |

Accessibility is **mandatory**, not one row among nine: name the conformance
target and the test method. "Contrast ≥ 4.5:1" alone is the trap — it is the
part that happens to be a number.

## Requirement smells — and the rewrite

| Smell | Example | Rewrite |
|---|---|---|
| Vague adjective | "The report loads quickly." | "The report renders within 2 s at p95 for a 12-month range." |
| Compound | "Users can export and share and schedule reports." | Three requirements, three IDs. |
| Option in disguise | "The system should probably validate the file." | "The system rejects a file whose header row does not match the template, and names the first mismatched column." |
| Solution as requirement | "Add a Redis cache for the vessel lookup." | "Vessel lookup responds within 200 ms at p95 under 50 concurrent users." |
| Unbounded quantity | "Handles large files." | "Accepts files up to 20 MB and 500 rows." |
| Hidden actor | "The record is archived after a period." | "A nightly job archives records untouched for 90 days." |
| Passive escape | "Notifications will be sent." | "The system sends the requester an email within 5 minutes of approval." |
| Untestable negative | "The system never loses data." | "A submission acknowledged with 2xx is retrievable after a process restart." |
| Level collapse | `SR-2` "operator can submit a batch" → `FR-4` "the system lets an operator submit a batch" | `FR-4` "The system accepts a CSV of up to 500 records in one submission." An `FR` that only rewords its `SR` fails **Necessary**. |

## Modal verbs — and how they relate to priority

| Verb | Meaning |
|---|---|
| `shall` / present indicative ("the system accepts…") | mandatory once shipped — the default for `FR` and `NFR` |
| `should` | recommended; its absence is acceptable and is recorded as such |
| `may` | optional; needs no justification if dropped |

Do not use `will`, and do not mix `must not` with `shall not` in one document.

The modal verb and the MoSCoW column govern **different things**: the verb
states the obligation once shipped, the column states inclusion in the first
cut. A `COULD` requirement is still written with `shall`.

## Non-functional categories — the checklist

Walk all of these once. Most sets are missing three of them.

| Category | The question that surfaces it |
|---|---|
| Performance | what volume, what latency, at what percentile, under what concurrency? |
| Availability | what uptime, what happens during a dependency outage? |
| Security | who is authorised, what is authenticated, what is logged? |
| Privacy / data protection | what personal data, lawful basis, retention, deletion path, data-subject rights? (→ the Stage 4 privacy gate) |
| Compliance | which rule binds this, and which clause? (→ `C-n`) |
| Accessibility | conformance target and test method — mandatory |
| Observability | how will an operator know it is failing before the user reports it? |
| Operability | who runs it, how is it recovered, what does rollback look like? |
| Portability / locale | timezone, number and date format, currency, character set |

## The final check

> Could a competent implementer who has never met the affected actor build the
> wrong thing while satisfying every requirement as written?

If yes, the ambiguity is still in the document. Find it before design starts —
it is one edit here and a rebuild later.
