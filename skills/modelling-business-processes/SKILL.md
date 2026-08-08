---
name: modelling-business-processes
description: >
  Use when a business process, procedure, or workflow must exist as a real
  BPMN 2.0 file — one that opens in a modeller and can be handed to a process
  engine — rather than as a picture trapped inside a document. Covers the
  pool and lane discipline, the element vocabulary, the approval, revision-loop
  and wait patterns, and the lint gate. `.bpmn` is the mandatory artifact;
  rendered and inline views are optional. Requests for an "activity diagram"
  or a "flowchart of the process" land here too. Not for architecture pictures
  and not for UML use case or sequence models. Triggers: "bpmn", "business
  process", "process diagram", "activity diagram", "approval flow",
  "swimlane", "workflow diagram", "process model", "camunda", "zeebe".
allowed-tools: Read Grep Glob Write Edit Bash Skill
metadata:
  dstack:
    version: 0.2.0
    type: hybrid
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - modelling business processes
      - bpmn
      - business process
      - process diagram
      - activity diagram
      - approval flow
      - swimlane
      - workflow diagram
      - camunda
---
# /modelling-business-processes

A process drawn as a picture is one person's opinion about it. A `.bpmn` file
is a model: it names who acts, what decides, and every way the flow can end,
in a form a modeller opens and an engine can execute.

```
THE .bpmn IS THE ARTIFACT. THE PICTURE IS A VIEW OF IT.
NEVER CLAIM A FILE THIS MACHINE DID NOT PRODUCE.
```

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| What talks to what — services, containers, data | `/diagramming-architecture` |
| Who wants what from the system, or a message ordering | `/modelling-system-behaviour` |
| The process needs only a fence inside the spec | `/writing-specs` — its lane flowchart is enough |
| Nobody has agreed what the process *is* yet | `/discovering-requirements` first |

**"Activity diagram", "process flow diagram" and "business process flowchart"
all land here.** The answer is a BPMN process in every case — say which term was
asked for and which notation was produced, so the caller is not surprised.

## Stage 0 — inputs

| Input | Source | If missing |
|---|---|---|
| The one process this file models, named | the request, the spec | stop — one file, one process; two processes are two files |
| The roles that act in it | the requirement's actor table | stop — a lane is a role, and a step with no role has no owner |
| The trigger that starts it | the spec | stop — a process with no start event is not a process |
| **Every** way it can end | the spec | do not invent one; an unstated end state is a finding, not a guess |
| Output root | `docs/process/<slug>/` | a user or repo preference overrides |

## The probe — run it before producing anything

```bash
python3 --version >/dev/null 2>&1 && echo layout-ok || echo NO-LAYOUT
node --version    >/dev/null 2>&1 && echo lint-ok   || echo NO-LINT
command -v google-chrome >/dev/null 2>&1 && echo render-ok || echo no-render
```

`NO-LAYOUT` or `NO-LINT` **refuses the run** — an unlaid or unlinted `.bpmn` is
not a deliverable. `no-render` is a normal verdict: the `.bpmn` still ships and
every image row reads `n/a` with its reason.

## The stages — each gate can refuse

Every gate writes one row: *stage · PASS / BLOCKED / `n/a` · evidence*. **A PASS
with an empty evidence cell is not a PASS.** A gate whose subject does not exist
reads `n/a`, never PASS.

### 1. Frame — one process, named roles, named ends

Write, before any XML: the pool name (the service, not the department), the
lanes in the order work flows through them, the trigger, and each end state.
A lane is a **role** — `Evaluator`, `Approver` — never a person's name and never
a system. Systems are service tasks inside the role that owns them.

**Gate:** the lane list is roles; every end state is named and traceable to the
spec.

### 2. Author the semantic model — no DI

Write the `<bpmn:collaboration>`, the participant, the `<bpmn:laneSet>`, the flow
nodes and the sequence flows. **Write no `<bpmndi:BPMNDiagram>`** — stage 3 owns
geometry, and hand-written coordinates are how a model becomes unreadable.

The element vocabulary, the naming rules, and the five patterns that cover most
real processes — approval chain, revision loop, wait-for-external, parallel
review, escalation — are in `references/notation.md`. Two rules decide whether
the model is worth anything:

- **A gateway asks a question**: its name ends in `?` and every outgoing flow
  carries the answer as its name. An unlabelled branch is a coin flip.
- **Draw the unhappy path.** Rejected, returned, expired, withdrawn. A model
  with only the happy path is the one that gets built wrong.

**Gate:** every flow node sits in exactly one lane; every gateway with two or
more outgoing flows is named and every branch labelled.

### 3. Lay out — never by hand, never with auto-layout

```bash
python3 scripts/layout_bpmn.py model.bpmn <slug>.bpmn
```

**Do not use `bpmn-auto-layout` on a model with lanes.** Measured: the
collaboration and laneSet survive in the semantic model, but the plane it emits
binds to the *process* and carries no participant or lane shape — the roles
vanish from the picture, and `bpmnlint` reports `no-bpmndi` on the pool and on
every lane. The bundled layouter puts one lane per row and one topological rank
per column, and keeps them.

**Gate:** the script exited 0 and reported the node, flow, lane and column
counts. A refusal names what it refused and why.

### 4. Lint — the gate that decides shipping

```bash
printf '{"extends":"bpmnlint:recommended"}\n' > .bpmnlintrc
npx --yes bpmnlint@latest <slug>.bpmn
```

`bpmnlint` is the check. Do not write a second one: `no-bpmndi` covers DI
completeness and `no-overlapping-elements` covers geometry, both better than a
hand-rolled parser would.

**Every `error` is fixed here, never shipped.** A `warning` is a decision you
record: `fake-join` means two flows arrive at one task with no joining gateway,
which is usually a real choice about whether the task waits for both.

**Gate:** the command ran and its full output is in the report. Zero errors, or
a named reason per remaining error.

### 5. Render — what this machine can do

```bash
PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_EXECUTABLE_PATH="$(command -v google-chrome)" \
  npx --yes bpmn-to-image@latest <slug>.bpmn:<slug>.svg,<slug>.png
```

A file with no DI is **refused** by the renderer, which is why stage 3 is not
optional. On `no-render`, both image rows read `n/a` — the `.bpmn` is unaffected.

**draw.io cannot read `.bpmn`.** Measured: `drawio -x -f png x.bpmn` returns
`Error: Export failed`. There is no `.drawio` row on this path; do not promise
one.

**Gate:** every declared output has a verdict; nothing is claimed that is not on
disk.

### 6. Secondary views — optional, and clearly secondary

A Mermaid `flowchart TB` with one `subgraph` per lane can be pasted into the
spec so the process is visible in a diff. It is an approximation: Mermaid has no
pool, no typed gateway, no message or timer event. Say so where you paste it,
and keep the `.bpmn` normative.

**Gate:** any secondary view names the `.bpmn` it was derived from.

### 7. Hand back

Report: the process modelled, the lanes, the trigger, every end state, the lint
result in full, which outputs exist and which do not and why.

**Gate:** the report claims no file that is not on disk.

## Output

`docs/process/<slug>/` in the target system's repo — a user or repo preference
overrides it. Report in chat as: process, lanes, end states, lint result,
produced and skipped outputs side by side. Not the files.

## Judgment

Two calls are yours. **Where one process ends and the next begins** — a model
spanning intake, payment and issuance in one pool is three processes wearing one
name, and splitting it is a design statement, not a formatting choice. And
**which detail belongs in the model at all**: a step nobody can be accountable
for, and that no branch depends on, is narration. Leave it out and say you did.

## Badly and well

> Ask: "draw the certificate approval process"

| | |
|---|---|
| ✗ | One pool, no lanes, tasks named `Process`, `Check`, `Done`, a gateway named `Gateway_1` with two unlabelled arrows, and no path for a rejection. Rendered to PNG and called finished. |
| ✓ | Pool `Certificate issuance`. Lanes `Applicant`, `Evaluator`, `Approver`. Gateway `Evaluation result?` with branches `approved` and `returned for revision`, the return branch flowing back to the applicant's task. Two end events: `Certificate issued`, `Application withdrawn`. `bpmnlint`: 0 errors, 1 `fake-join` warning, recorded with its reason. |

## Red flags

| Thought | Reality |
|---|---|
| "I'll write the DI by hand, it's only a few boxes" | That is how the picture becomes unreadable. Run the layouter. |
| "`bpmn-auto-layout` will handle it" | Measured: it drops the pool and every lane. `bpmnlint` proves it — `no-bpmndi` on all of them. |
| "The lint warnings are noise" | `fake-join` asks whether a task waits for both inputs. Answer it. |
| "draw.io can open the .bpmn" | Measured `Error: Export failed`. There is no editable-XML row here. |
| "They asked for an activity diagram, so this skill is wrong" | Same intent, and BPMN is the notation. Produce it and name the substitution. |
| "One lane per person" | A lane is a role. Two people in one role share one lane. |
| "The happy path is the process" | The rejection path is the half stakeholders recognise, and the half that gets built wrong. |
| "It rendered, so the model is fine" | Rendering proves geometry exists, not that the process is right. The lint gate is what proves anything. |

## Hand-off

Input from `/discovering-requirements` (its actor table becomes the lanes) and
`/writing-specs` (its process section becomes the flow). The `.bpmn` is
referenced from the spec, never a replacement for it. Send a finished model to
`/multi-persona-review` — a process model is exactly the artifact where an
operations reviewer and an engineer object to different things.

## Bundled files

- `references/notation.md` — the element vocabulary, naming rules, the five
  recurring patterns, and the modelling errors that survive a lint pass.
- `references/toolchain.md` — the measured tool matrix, exact commands, the
  degradation table, and the Camunda 8 / Zeebe extension profile.
- `scripts/layout_bpmn.py` — lane-aware DI generator. Exit 0 laid out,
  1 refused with a reason, 2 unparseable.

## Changes

- **0.2.0** — Dropped the Indonesian trigger phrases from the description and
  the trigger list, and put the example ask into English, under the English-only
  rule (`using-dstack` 0.7.0): models translate intent rather than matching
  lexically, so the phrases cost tokens without adding reach. `approval flow`
  and `process diagram` were added to carry the reach the removed phrases had.
  The Indonesian eval prompts are deliberately untouched — they are the proof
  that an English skill still matches an Indonesian request.
- **0.1.0** — Initial. Four things were measured before the body was written,
  and each changed the design. `drawio -x` **cannot read `.bpmn`** (`Error:
  Export failed`), so the Mermaid→draw.io spine of `/diagramming-architecture`
  does not reach this notation and a separate skill was the only honest option.
  `bpmn-to-image` **refuses a file with no DI**, making layout a mandatory stage
  rather than a nicety. `bpmn-auto-layout` **drops the pool and every lane** —
  confirmed mechanically by `bpmnlint` reporting `no-bpmndi` on the participant
  and both lanes of a two-lane model — which is why a bundled lane-aware
  layouter exists at all; it lays out a real 22-node, 6-lane approval process
  with zero `no-bpmndi` and zero `no-overlapping-elements` findings. And
  `bpmnlint:recommended` **already covers DI completeness and element overlap**,
  so a planned second checker was deleted rather than written.
