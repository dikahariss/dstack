---
name: writing-specs
description: >
  Use when a schema, a service or module boundary, a contract, or a process is
  about to be chosen and the choice is not written down — or when a design fork
  is about to be resolved inside the implementation, where nobody can review it.
  Requires an agreed requirement set as input. Also use when someone asks for an
  HLD, LLD, technical design, solution design, blueprint, or spec-driven
  development. Triggers: "technical design", "architecture design", "design
  doc", "solution design", "HLD", "LLD", "SDD", "spec-driven", "ERD", "API
  contract", "process flow section", "system blueprint", "write the spec".
allowed-tools: Read Grep Glob Write Edit Bash Skill
metadata:
  dstack:
    version: 0.7.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - writing specs
      - technical design
      - architecture design
      - design doc
      - solution design
      - hld lld
      - sdd
      - system blueprint
      - api contract
      - erd
      - process flow section
---
# /writing-specs

A spec is the decision record for **how** a system will be built, written before
it is built. Requirements say what must be true; the spec says what will exist,
where the boundaries fall, and what each piece promises.

```
EVERY DECISION CITES A REQUIREMENT. EVERY REQUIREMENT IS COVERED OR OUT.
CODE IS EVIDENCE, NEVER CONTENT.
```

The second rule resolves a real tension. You **must** read the code before
deciding anything, and cite `path:line` — in the evidence log. You must **not**
scatter file paths and code through the spec body: they are stale within a month
and the spec stops being trusted.

The line: **a path that is the artifact's identity is content; a path that is
proof is evidence.** The document it implements, an ADR it spawns, and a file
that *is* the deliverable are content. Everything you read to justify a decision
is evidence. One snippet exception — a type or payload shape, in the language
the seam actually speaks, where prose would blur the decision.

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| The problem, goal, or constraints are not written down | `/discovering-requirements` first — this skill's input |
| The design is settled; you need tasks, files, and commands | `/writing-plans` |
| The doubt is about whether the idea is right at all | `/brainstorm` |
| Requirements are agreed but nobody decided what comes first | `/prioritizing-work` |

## Pick the depth first

**Light** — reversible, roughly ≤1 day, one component, no new entity, no new
contract: run Stages 1, 2, 6, 7 on one page. **Full** — everything else. Say
which you picked and why; the header carries a `Depth:` line, and silently
truncating the Full form is what that line exists to catch.

A spec may also be **retrospective** — documenting what already shipped. Mark
components `UNCHANGED` and say so in the header; the stages are the same.

## Two audiences, one document

Every section opens with **one to three sentences of plain language**: no type
names, no table names, no framework names, and no industry vocabulary a person
doing the work would not use in a meeting. A stakeholder who stops after the
plain paragraphs must still be able to say "no, that is not how the process
works". That objection arriving now instead of at acceptance is most of this
skill's value — so the document must give it somewhere to land: a reviewer log
and a `CHANGES REQUESTED` status.

## Stage 0 — Inputs

| Input | Source | If missing |
|---|---|---|
| Agreed requirement set with IDs | `docs/discovery/…` | **stop** — run `/discovering-requirements`. A spec with nothing to trace to is a design nobody can check |
| Constraints `C-n` and their status | the same document | treat as unknown and say so; each still needs discharging in Stage 2 |
| Existing code, contracts, schema, data | the repo — read it | Stage 1 refuses to pass |
| Domain glossary and prior decisions | `CONTEXT.md`, `docs/adr/` | note the absence; Stage 7 may create the first ADR |
| Non-functional targets | the `NFR` rows | no target means no way to choose between designs |

Requirements still `DRAFT` may be specced — say so in the header and do not
treat their IDs as stable.

## The stages — each gate can refuse

Every gate writes one row: *stage · PASS or BLOCKED · evidence*. **A PASS with
an empty evidence cell is not a PASS.** BLOCKED names what is missing and
escalates to a named human; where there is nobody to escalate to, the spec still
publishes as `DRAFT` with the row visible and every dependent `CMP`/`ENT`/`OP`
stamped `BLOCKED-PENDING`. A gate whose subject does not exist in this system
reads `n/a`, never PASS — a green row that checked nothing is worse than none.

### 1. Ground — read before deciding

Find how it works today: the modules, the existing seams, the current schema and
what is already in it, the conventions the repo follows. Cite `path:line` per
claim as `E-n`. "Greenfield" is a conclusion you reach after searching and state
explicitly — never an assumption you start from.

Where Stage 1 evidence **contradicts** the discovery document — its typology,
its cardinality, its account of current behaviour — that contradiction is the
most valuable thing this stage produces. Record it as an `E-n` row and escalate;
never silently overwrite in either direction.

**Gate:** every subsystem the spec touches has a citation, or an explicit
"searched X, Y, Z — found nothing" line.

### 2. Shape — components and their boundaries

Name what exists, what changes, what is new, what is deleted, and what is
`EXTERNAL` — a system you do not own and cannot change. Say which **altitude**
each row is at (context, container, component) and what it sits inside; one
diagram never mixes two altitudes.

**Prefer an existing seam to a new one, and the fewest seams that work** — every
boundary is a contract to maintain, a place data can diverge, and a thing to
test. A new boundary is still correct when the two sides have a different rate
of change, a different failure or scaling profile, a different owner, or a real
trust or data-residency line between them. Say which of those applies.

Per component: one responsibility, what it owns, what it depends on, **what it
does when each dependency is unavailable**, and **what it is blocked by** — the
build order, which is not the call graph. Name the first buildable slice.

Write one structural decision row: the decomposition you chose, the one you
rejected, and how many boundary crossings the primary process makes under each.

**Gate:** every component traces to ≥1 requirement; every requirement **and
every `C-n`** is claimed by a component or has an out-of-scope row citing its
ID; every non-`NEW` component cites the `E-n` that located it; the structural
decision row exists.

### 3. Model — entities, states, schema, migration

Carry the typology and cardinality from discovery. Per entity: its **grain**
(one row = one *what*, at what point in its life), its key — natural or
surrogate, stable across reload or not, and what happens when the source
identifier changes or is reused — its relationships with cardinality, its
lifecycle, its owning component, and its **temporality**: current-state only,
append-only history, or effective-dated.

Then the schema. Absence has three meanings that must stay distinguishable:
unknown, not applicable, not yet collected. Then the access patterns — including
reporting and analytical consumers — the volumes they run against, and only then
the indexes that follow. An index with no named access pattern is a guess.

Then the **transition**: for every changed entity, how today's rows reach the
new shape, what happens to rows that do not fit, whether old and new must be
readable side by side, what happens to work in flight, and the point past which
rollback is impossible.

**Gate:** every entity has a grain, a key with a stability statement, an owner,
a temporality, and a lifecycle in which every state has an exit; every
`CHANGED`/`DELETED` entity has a transition row.

### 4. Contract — what each seam promises

Per operation: what it takes, what it returns, **which entities it writes**, its
consistency (atomic in one store, eventual via an event with a stated window, or
compensated), what it does on each failure, whether it is safe to retry, who is
authorised, and its version and compatibility stance. Same for events: name,
payload, producer, consumers, ordering, duplicate behaviour, compatibility.

Payloads get the same field-level grain as the schema. Error cases get a shape,
not just a name — one error envelope decided once, for all operations.

**Gate:** every operation names its errors, its authorisation rule, its
idempotency, and — when it writes entities owned by more than one component —
its consistency; every event names its consumers and its compatibility stance.

### 5. Behave — process and interface

The business process end to end, across every channel and actor from discovery.
**Every terminal outcome that is not success gets a path** — failed, rejected,
timed out, expired, abandoned — each naming the actor who handles it and, for
anything returnable, how the person gets back in. This is the section
non-technical readers actually review, and the rejection routes are usually most
of the real volume.

Then interface behaviour, which is **states and rules, not pixels**: per screen
or step, the fields and their validation, and what is shown when empty, loading,
partial, permission-denied, and failed. A column with no meaning here is written
`n/a — <why>`, not left blank. Layout and visual design are out of scope.

**Gate:** every non-success terminal outcome has a path with a named handler;
every step that crosses a boundary names the `OP-n`/`EVT-n` it uses, and every
`OP-n`/`EVT-n` appears in a step or in out-of-scope.

### 6. Verify — acceptance criteria per requirement

Write acceptance criteria as `Given / When / Then`, each naming an **observable**
consequence and the level it is asserted at — unit, integration, end-to-end, or
human judgement. For a target with a number, name the load, data volume, and
environment it is measured in. `AC-n` cites exactly one requirement ID.

An AC that can only be checked by reading the code is worthless as a test and as
the oracle for `/running-uat`. An AC no automated check can reach is allowed —
mark it human-judged so nobody mistakes it for a test.

**Gate:** every `FR` and `NFR` has ≥1 `AC`; every `AC` names its observable
consequence and its assertion level.

### 7. Close — decisions, diagrams, status

Every decision carries its **reversibility** — reversible, costly, or permanent
once live — independently of whether it earns an ADR. That column is how a
reviewer knows where to spend attention. A decision earns an **ADR** only when
all three hold: hard to reverse, surprising without context, a genuine
trade-off. Fewer than three → the decision row *is* the record.

Every `NFR` with a hard target names the structural consequence it caused, or
states "none — met by the default shape, because …". An NFR that changed nothing
about the design was not a design input.

Diagrams are **Mermaid, inline** — no external tool, no binary. Where a table and
a diagram carry the same fact, the table is normative. When a diagram must be
opened or edited by someone who does not write Mermaid, `/diagramming-architecture`
produces the file; the fence stays. The screens behind §7's step table are
`/wireframing-interfaces`. Which diagram for which
job: `references/diagrams.md`.

`DRAFT` → `AGREED` needs named humans with roles and a date; the agent never
grants it. After that the spec is the source of truth: when implementation
diverges, either the code is wrong or the spec is amended through its change
log. Silent divergence is how a spec becomes fiction.

**Gate:** the gate table is complete; open decisions are listed with owners;
every decision has a reversibility.

## Output

One file: `docs/specs/YYYY-MM-DD-<slug>.md` in the target system's repo — a user
or repo preference overrides it, and when the caller asks for the content
inline, produce it inline and say no file was written. Section order, every
table, and the ID scheme are in `references/spec-doc.md`.

Report in chat as: the shape in two sentences, the depth, counts per ID class,
requirement coverage (`n of m`, the rest listed), open decisions, and any
BLOCKED gate. Not the whole document.

## Judgment

The stages and gates are fixed. The judgment this skill exists to apply is
**where the boundary goes** — which responsibilities belong together, which seam
is worth the contract it costs, and what is deliberately left coupled for now.
No checklist decides that; it comes from the code you read in Stage 1 and the
constraints you inherited. The structural decision row is where you show your
work.

## Decision, badly and well

| | Written as |
|---|---|
| ✗ | "We will use a queue for exports so the system scales better." — no requirement cited, no alternative, no boundary, unfalsifiable claim. |
| ✓ | **`CMP-3` Export worker** — owns report generation; consumes `EVT-2`. Serves `NFR-2` (p95 API latency under 400 ms while an export runs) by moving generation off the request path. *Rejected:* generating inline with a longer timeout — simpler, one fewer deployable, but `NFR-2` is a hard target and one export already blocks the pool (`E-2`). *Cost:* at-least-once delivery, so `OP-7` must be idempotent. *Reversibility:* costly — the queue contract outlives the decision. |

The second is checkable by a reviewer, traceable to a requirement, priced, and
states what it gives up. That is the whole difference.

## Red flags

The recurring ones, **not exhaustive** — any thought ending in "decide it
while coding" belongs here.

| Thought | Reality |
|---|---|
| "The requirements are obvious enough to skip" | Then citing their IDs costs nothing. If you cannot cite one, you are designing something nobody asked for. |
| "I'll read the code as I implement" | Stage 1 exists because a design that ignores the existing seam gets rewritten at the first merge. |
| "The diagram explains it" | A diagram with no plain-language paragraph excludes exactly the reader who most needs to object. |
| "Error handling is an implementation detail" | It is the half of the contract that causes incidents. |
| "We can decide the schema while coding" | Schema is the most expensive thing to change after data exists — and grain is the part nobody notices is wrong. |
| "The rejection path is an edge case" | It is usually most of the real volume. |
| "This decision deserves an ADR" | Only if all three criteria hold. An ADR for everything is an ADR for nothing. |

## Hand-off

Input from `/discovering-requirements`. Send the finished spec through
`/multi-persona-review` before planning against it. Then `/writing-plans` turns
it into tasks — carrying the build order, not re-deriving it — and the `AC-n`
rows feed `/designing-test-cases`, whose output `/running-uat` needs at its
entry gate.

## Bundled files

- `references/spec-doc.md` — the output template, section by section, with the
  ID scheme, the depth-to-section map, and the amend-versus-supersede rule.
- `references/diagrams.md` — which Mermaid diagram answers which question, with
  a minimal example of each and the rules that keep them readable.

## Changes

- **0.7.0** — Band `deterministic-dominant` → **`workflow`** (flag removed — the
  default). Six Sonnet 5 runs against planted traps: **both** versions caught all
  three; the rails bought a BLOCKED gate on 1 of 3 tasks, below the 2-of-3 bar,
  at 2.1× tokens and 4.9× tool calls. Gates stay.
  Evidence: `docs/ablations/2026-08-writing-specs.md`.
- **0.6.1** — ADR-0030 list openness: the red-flag table is open.
- **0.6.0** — Routing row for `/prioritizing-work`: agreed requirements with no
  agreed order land here otherwise, and designing all of them is the mis-route.
- **0.5.0** — English-only pass (`using-dstack` 0.7.0); "business process" left
  to `modelling-business-processes`.
- **0.4.0** — Reciprocated the design-artifact skills: a diagram that must leave
  the document is `/diagramming-architecture`; screens are `/wireframing-interfaces`.
- **0.3.0** — Reciprocated `designing-test-cases`: `AC-n` rows are its input, not
  test cases.
- **0.2.0** — Rebuilt after a five-point-of-view review and a subagent trial;
  two reviewers independently caught that 0.1.0 dropped the Light depth path its
  own discovery required. Gates now record evidence on PASS, name the escalation
  target, define `BLOCKED-PENDING`, and read `n/a` when their subject is absent.
  Added the rules for entity grain and key stability, contract consistency,
  altitude and `EXTERNAL`, a mandatory structural decision row, reversibility,
  and assertion level per AC.
- **0.1.0** — Initial, from `docs/discovery/2026-07-28-writing-specs.md`: the plan
  skill consumed a spec nothing produced, so design was decided inside
  implementation.
