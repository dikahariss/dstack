---
name: discovering-requirements
description: >
  Use when the problem behind a request has not been written down — a feature
  ask, a redesign, a "build me system X" brief, a BRD / SRS / KAK / TOR to be
  drafted, or a schema about to be modelled with no stated goal, no named
  actors, and no verified constraints. Also use when a request names a solution
  but never the problem it solves, when actors or permissions are unclear, or
  when the work touches regulated, contractual, or personal-data territory. Run
  it before any spec, design, model, or plan. Triggers: "requirements
  gathering", "requirements analysis", "functional requirements", "business
  requirements", "schema design", "build a new module", "problem statement",
  "BRD", "SRS", "KAK", "TOR", "user story", "acceptance criteria", "user
  needs", "discovery", "before design".
allowed-tools: Read Grep Glob Write WebSearch WebFetch AskUserQuestion Bash Skill
metadata:
  dstack:
    version: 0.3.0
    type: semantic
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - discovering requirements
      - requirements gathering
      - requirements analysis
      - problem statement
      - business requirements
      - functional requirements
      - build a new module
      - schema design
      - brd
      - srs
      - kak tor
      - user story
      - acceptance criteria
---
# /discovering-requirements

Discovery answers **what problem, whose, whether it is worth solving, and how we
will know it is solved** — before anyone designs. The deliverable is a written
document with numbered requirements, not a shared feeling at the end of a
conversation.

```
NO GOAL WITHOUT A METRIC. NO CONSTRAINT WITHOUT A PRIMARY SOURCE.
EVERY GATE LEAVES A WRITTEN VERDICT.
```

## When to use — and when not

Use when the request names a **solution** but not the problem ("add a
dashboard", "we need a queue"), when a data model is about to be designed, when
actors and their permissions are unclear, or when the domain is regulated.

Do not use for: a bug with a known cause (`/debugging`), or a change whose
problem, goal, and scope are already written down and agreed — say so in one
line and go to planning. Refusing to run is a valid outcome.

## Pick the depth before Stage 0

**Light** — reversible, roughly ≤1 day to build, no new entity, no personal
data, no actor outside the delivery team: run Stages 1, 2, 6, 7 only, on one
page, with no `BR`/`SR` levels. **Full** — everything else. Three conditional
modules fire only on their trigger: regulated domain or personal data → Stage 4;
human end users outside the delivery team → Stage 3.

Announce the depth and why. Silently truncating the full form is the failure
this rule prevents; the exact section list per depth is in the template.

## Posture — research first, recommend, ask last

1. **Read before asking.** Repo (`CONTEXT.md`, ADRs, README, schema, code), the
   ticket, prior documents, and the primary source for any rule involved. If the
   request's domain is not this repo's domain, find the target system first and
   name which repo the evidence came from — a clean search of the wrong repo
   reads exactly like an absence of evidence.
2. **Recommend, do not interrogate.** Lead with the answer you would pick and
   why, then ask for confirmation or override.
3. **Batch into at most one round.** A stream of one-at-a-time questions gets
   refused, and rightly.
4. **Record open points as assumptions and keep going** — *except* the two
   carve-outs below.

**The never-block rule does not apply to:** anything in the Stage 4 legal /
personal-data gate, and any gate returning BLOCKED. Those stop the stage and
escalate to a named human. Everything else becomes a ranked assumption row.

## What a gate does

Refuse means **stop the stage, write `BLOCKED` and the missing thing into the
gate table, then escalate** — never "considered and moved on". Every gate writes
one row: *stage · PASS or BLOCKED · evidence*. The table is mandatory even when
every row is PASS, because a document that skipped all eight gates is otherwise
indistinguishable from one that passed them.

A BLOCKED gate does not end the document: keep writing, and stamp every
requirement that depends on it `BLOCKED-PENDING`. What it ends is the authority
to build on that part.

## Stage 0 — Inventory the inputs

Missing inputs are not a reason to stop; they are ranked assumption rows.

| Input | Source | If missing |
|---|---|---|
| The raw request, verbatim | the user's words | stop — nothing to discover |
| Demand evidence | tickets, logs, counts, observed rework | Stage 1 stamps `DEMAND UNVALIDATED` |
| Current behaviour, **verified** | run it, read the code and metrics | mark UNVERIFIED; never assume |
| Affected people | the real-world transaction, not the roles table | Stage 3 derives them, marked INFERRED |
| Domain constraints | rules, standards, contracts, SLAs, policy | Stage 4 scopes and sources them |
| Personal data present? | the entities and attributes in play | Stage 4 privacy gate decides |
| Success signal | today's metric value, or how to measure it | Stage 2 has a qualitative path |
| Time / budget / tech limits | the user, the stack, the platform | assumption with an owner |

## The stages

### 1. Frame the problem

Separate what **is** happening from what **should** be, and verify the "is".
State who is hurt and what it costs them. Then ask *why* until the answer stops
being a solution: "we need a queue" → "exports time out" → "one export blocks
every other request". The last answer is the problem; the first was a design.

**Gate:** the problem statement names no solution, technology, or UI. Demand
resting only on an assertion still passes — stamped `DEMAND UNVALIDATED` in §1
and carried to Stage 2.5, which is where it can actually stop the work.

### 2. Goal and success metric

One primary goal with a baseline, a target, and how it is measured. At least one
**guardrail** metric — what must not get worse — with a threshold.

No instrumentation? Two legal paths, never an invented number: a qualitative
baseline stating method and sample ("n=9, one morning, one counter"), or
`baseline: UNINSTRUMENTED` **on condition that** building the instrument becomes
a first-cut requirement with its own ID.

Write one line under the goal: why moving this number means the problem is
solved, and the cheapest way it could move without the problem being solved.

**Gate:** baseline (numeric, qualitative, or UNINSTRUMENTED+ID) + target +
measurement method + owner + one guardrail.

### 2.5 Viability — the stage that can say no

Given the goal, the baseline, and a rough cost to move it: is this worth doing?
Name at least one kill criterion. `DO NOT BUILD` and `NOT NOW` are terminal
statuses, as legitimate as proceeding — write the document up to here, set the
status, and stop.

**Gate:** BLOCKED if the goal is `DEMAND UNVALIDATED` **and** the build is not
cheap enough to be its own experiment — rule of thumb, it costs more than the
instrumentation that would have validated the demand. Route to `/brainstorm`
when the doubt is about the idea rather than the evidence.

### 3. Actors and the behaviour change

Seed the actor list from the **real-world transaction**, never from the
roles/permissions table — that table cannot see anyone without an account. Sort
every actor into one of four classes — acts on the system, is acted upon,
intermediary, downstream (columns and examples in the template).

Each actor records what they do today, what must change, **what makes that
change possible** (authority, incentive, bandwidth, device, connectivity), and
what happens if they do not. An unresourced behaviour change is a risk row, not
a table cell.

Behaviour evidence carries a status like every other claim: `OBSERVED` /
`REPORTED` / `INFERRED`. When nobody affected was consulted, write the standing
row *"affected actors observed: none"* — visibly, not by omission.

Enumerate **typology and cardinality** for every entity; the model is
`/writing-specs`.
"A vessel has an owner" hides what breaks schemas later: can an owner be an
individual, a company, *and* a state institution; can there be several at once?
Ask two more of every entity: **is it, or does any attribute identify, a natural
person?** (→ Stage 4 privacy gate) and **what is its lifecycle?**

*Conditional module — human end users outside the delivery team:* map the
journey across every channel and the context of use per actor, then name which
step actually fails. Both tables are in the template.

**Gate:** every actor has a behaviour change **or** a stated effect borne, and
an evidence status. Zero `OBSERVED` and zero `REPORTED` rows is BLOCKED — a set
where every row says `INFERRED` passes on form and certifies nothing.

### 4. Constraints and compliance

Sourcing comes second. **Scope first:** enumerate the candidate regimes — sector
regulator, personal-data law, records and archival law, procurement or contract,
internal policy — and record each `APPLIES` / `DOES NOT APPLY` with a reason. A
regime nobody named cannot be sourced.

Then source each constraint from the document that owns it. Status is
constrained: **you may not write `VERIFIED`.** The agent writes
`AGENT-SOURCED (pending review)` or `ASSUMPTION`; only a named human converts a
row to `VERIFIED`, and their name goes in the row. Full evidentiary floor,
required columns, and the precedence rule: `references/constraint-sourcing.md`.

**Gate (BLOCKING, no assumption escape):** every applicable regime scoped; every
constraint carries a source, a status, and — where personal data is present —
lawful basis, purpose, minimisation, retention and deletion path, data-subject
rights, and transfer or residency.

### 5. Write the requirements — four levels

| Level | ID | Answers | Rule |
|---|---|---|---|
| Business | `BR-n` | why the organisation wants this | traces to a goal |
| Stakeholder | `SR-n` | what an actor needs to be able to do | implementation-free |
| Functional | `FR-n` | what the system must do | traces to an `SR-n` |
| Non-functional | `NFR-n` | how well — performance, security, privacy, availability, accessibility, observability, operability | has a **pass condition**; traces to a `BR-n` or `C-n` |

A legal constraint `C-n` is a legitimate trace parent, and a requirement whose
only parent is a `C-n` is MUST by default. "Has a pass condition" replaces "has
a number" deliberately: conformance and lawful basis have no number, and a
numbers-only rule ejects exactly the requirements that matter most.

Requirements must be **necessary, singular, unambiguous, complete, verifiable,
feasible, correct, and traceable** — the bar, the smells, and the bad → good
rewrites are in `references/requirement-quality.md`. Two requirements that
contradict go in the conflict register with a resolution and a decider; a
conflict is neither an assumption nor an open question.

**Gate:** every `FR` traces up to an `SR` and a `BR`; every `NFR` to a `BR` or
`C-n`; **and downward** — every `BR` has at least one `SR`, every `SR` at least
one `FR`, every `C-n` at least one requirement discharging it, or an explicit
Out-of-scope row citing that ID. Forward-only tracing hides silent scope loss.

### 6. Scope, priority, and ranked assumptions

Name the smallest cut that moves the metric: state each `FR`'s expected
contribution to the goal, then take the shortest prefix that plausibly reaches
the target. Priority (`MUST`/`SHOULD`/`COULD`) applies to `FR` **and** `NFR`.

Assumptions are ranked by *impact if wrong* × *confidence*, sorted, and §1 names
the single riskiest one plus the cheapest thing that would settle it.

**Gate:** out-of-scope list non-empty and ID-bearing; no more than half of the
requirements **not parented by a `C-n`** marked `MUST`. Compliance-driven rows
are exempt — counting them would make the gate unsatisfiable on exactly the
work where it matters least.

### 7. Close

Set the status. `DRAFT` → `AGREED` requires a named human in `Agreed by` with a
date; the agent never grants it. Downstream skills may read a `DRAFT`, but may
not treat its IDs as stable. Amend an `AGREED` document through its change log —
supersede only when the *problem or goal* itself changed.

**Gate:** the gate table is complete, one row per stage that ran.

## Output

One file: `docs/discovery/YYYY-MM-DD-<slug>.md` **in the target system's repo**,
not whichever repo the session started in; a user preference overrides it. It
opens with a summary a non-technical reader can act on, then the detail;
sections, columns, and ID rules are in `references/discovery-doc.md`.

Report in chat as: the problem in one sentence, the goal with its metric, the
depth chosen, requirement counts per level, the riskiest assumption, and any
BLOCKED gate. Not the whole document.

## Judgment

The spine and the gates are fixed. Your judgment is **when the evidence is
enough to stop** — which unknowns are load-bearing enough to block on, and which
become ranked assumptions. Spend a budget proportional to the expected build;
when it is spent, what is still unknown becomes an assumption row and the
document ships `DRAFT`. Discovery that never ends is the same failure as
discovery that never happened.

## What a requirement looks like, badly and well

> Request: "Add a bulk-upload page so operators stop uploading one by one."
> Framed, the problem is throughput; bulk upload is one design for it.

| | Requirement |
|---|---|
| ✗ | `FR-4` The system should handle large uploads quickly and be user-friendly. — not singular, not verifiable, traces to nothing. |
| ✓ | `FR-4` The system accepts a CSV of up to 500 records in one submission. (← `SR-2`, MUST) |
| ✓ | `FR-5` On a row that fails validation, the system rejects that row, accepts the rest, and returns the failed row numbers with a reason for each. (← `SR-2`, MUST) |

`FR-5` is not in the request. It came from asking what happens when the input is
partly wrong — which is where most real requirements are found. The full worked
example, goal to traceability, is in `references/worked-example.md`.

## Red flags — you are skipping discovery

| Thought | Reality |
|---|---|
| "The request is clear enough" | A clear *request* is not a stated *problem*. Frame it anyway. |
| "I know that rule already" | Stage 4 exists because that memory has been wrong before. Cite the clause. |
| "I'll record it as an assumption and move on" | Not for legal, privacy, or a BLOCKED gate. Those escalate. |
| "Nobody is available to observe" | Then write "affected actors observed: none" and let it be visible. |
| "It's clearly worth building" | Stage 2.5 costs two lines and is the only place that can say no. |

## Hand-off

`/brainstorm` is a **sibling**, not a predecessor: invoke it when Stage 2.5
finds the doubt is about the idea itself. `/writing-specs` turns an `AGREED` set
into a design, and carries the IDs into acceptance criteria and test cases.
Send the document through `/multi-persona-review` before designing on top — but
a panel of simulated experts does not substitute for Stage 3's real actors.

## Bundled files

- `references/discovery-doc.md` — the output template, section by section.
- `references/requirement-quality.md` — the quality bar, smells, rewrites.
- `references/constraint-sourcing.md` — regime scoping, the evidentiary floor
  for a constraint, required source columns, and constraint precedence.
- `references/worked-example.md` — one request carried end to end.

## Changes

- **0.3.0** — English-only pass (`using-dstack` 0.7.0). Reach kept via
  "requirements analysis", "functional requirements", "schema design", "build a
  new module". `KAK`/`TOR` stay — they are document types, not prose.
- **0.2.0** — Rebuilt after a five-point-of-view review (BA, PM, compliance/DPO,
  UX, holistic) returning seven blocking findings, then a subagent trial that
  found eight more. Gates leave a written verdict, define what refusal does, and
  say what a BLOCKED gate does downstream; never-block gained legal and BLOCKED
  carve-outs. Added Stage 2.5 viability with `DO NOT BUILD`, Stage 7 close with
  a human-granted `AGREED`, Light/Full depth, actor classes with evidence
  provenance, regime scoping, an evidentiary floor, downward traceability, `C-n`
  as trace parent, a conflict register, ranked assumptions, and pass-conditions.
  The trial fixed an unsatisfiable MUST-ratio gate, an evidence gate that passed
  on all-`INFERRED` rows, and a multi-repo blind spot. Calibration `workflow` → `deterministic-dominant` (ADR-0025):
  a fixed spine with eight gates is the shape `running-uat` uses at that band,
  and the default told cheap models they had ~70% freedom over it.
  Owner-approved in session.
- **0.1.0** — Initial. Spine from impact mapping; requirement levels and quality
  bar from ISO/IEC/IEEE 29148; Stage 4 and the research-first posture from mined
  session history, where design repeatedly started before domain rules were
  verified and interrogation was refused.
