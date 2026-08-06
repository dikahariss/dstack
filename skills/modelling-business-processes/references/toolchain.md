# The BPMN toolchain — measured, not assumed

Everything below was run on 2026-08-06. Re-probe rather than trusting the
verdicts; the versions are recorded so a later run can tell what changed.

## What each tool does, and what it refuses

| Tool | Version seen | Does | Refuses |
|---|---|---|---|
| `scripts/layout_bpmn.py` | bundled | generates DI: pool, lanes, node shapes, edge waypoints | more than one participant; a flow node in no lane |
| `npx bpmnlint` | 11.12.1 | the model's grammar, DI completeness, element overlap | nothing — it always reports |
| `npx bpmn-to-image` | current | `.bpmn` → `.svg` / `.png` / `.pdf` | **a file with no DI** |
| `npx bpmn-auto-layout` | current | DI for a lane-free process | **silently drops the pool and every lane** |
| `drawio` | 28.x | Mermaid, `.drawio`, `.xml` | **`.bpmn` — `Error: Export failed`** |

## The commands

```bash
# 1. semantic model -> laid-out model (the bundled layouter)
python3 scripts/layout_bpmn.py model.bpmn issuance.bpmn

# 2. the gate
printf '{"extends":"bpmnlint:recommended"}\n' > .bpmnlintrc
npx --yes bpmnlint@latest issuance.bpmn

# 3. views, only if chrome is present
PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_EXECUTABLE_PATH="$(command -v google-chrome)" \
  npx --yes bpmn-to-image@latest issuance.bpmn:issuance.svg,issuance.png
```

`bpmn-to-image` bundles puppeteer. Without `PUPPETEER_SKIP_DOWNLOAD` it tries to
fetch its own ~150 MB Chromium on first use; with `PUPPETEER_EXECUTABLE_PATH` it
uses the browser already installed. Set both.

## The degradation matrix

Conditions: **A** = `python3` present · **B** = `node` present ·
**C** = a Chromium-family browser present.

| # | A | B | C | `.bpmn` | lint report | `.svg` / `.png` |
|---|---|---|---|---|---|---|
| R1 | yes | yes | yes | ✓ | ✓ | ✓ |
| R2 | yes | yes | no | ✓ | ✓ | `n/a` — no browser |
| R3 | yes | no | — | **refuse** | `n/a` — no node | `n/a` — no node |
| R4 | no | — | — | **refuse** | `n/a` | `n/a` |

R3 and R4 refuse rather than degrade, and this is the one place this skill is
stricter than `/diagramming-architecture`. That skill's source is readable text,
so a source-only run still delivers something. A `.bpmn` with no DI is refused
by every renderer and opens in a modeller as an empty canvas; an unlinted one
may not be a valid process at all. Neither is a deliverable.

## The lane defect, in full

Two-lane model in, `bpmn-auto-layout` out, then `bpmnlint`:

```
Pool_1    error  Element is missing bpmndi  no-bpmndi
Lane_App  error  Element is missing bpmndi  no-bpmndi
Lane_Ev   error  Element is missing bpmndi  no-bpmndi
```

The `<bpmn:collaboration>` and `<bpmn:laneSet>` are still in the file — the loss
is entirely in the DI, so the model looks fine in a text diff and renders
without roles. The bundled layouter on the same input reports zero `no-bpmndi`
and zero `no-overlapping-elements`, as it does on a real 22-node, 6-lane
approval process.

## The layouter's geometry

One lane per row, one longest-path rank per column. Nodes sharing a cell stack
vertically and the stack is centred in the lane, so lane padding is never
consumed. Forward edges run straight when the two nodes share a row and take a
mid-column dogleg otherwise. Back edges — the revision loops — route through a
channel inside the top padding of the upper lane, staggered so two loops in one
lane do not overlay each other.

Two things the first trial got wrong and this now handles: the back-edge channel
sat close enough to the lane's top edge that bpmn-js drew its label *outside* the
pool, where it was clipped; and events and gateways draw their name outside the
shape, sized from the shape's own width, so a 36 px event hyphenated its label
mid-word (`Applicatio` / `n submitted`). Explicit `BPMNLabel` bounds fix the
second; deeper lane padding fixes the first.

Regeneration from an unchanged model is byte-identical: back edges are found by
a DFS in document order and ranks come from a deterministic topological pass, so
nothing depends on iteration luck. This is stronger than the draw.io path, where
random ids make byte-identity unreachable.

Known limits, each a refusal rather than a silent approximation:

- **One participant.** A multi-pool collaboration with message flows between
  pools needs a person in a modeller.
- **Every flow node must be in a lane** when a `laneSet` exists. A node with no
  lane has no owner, which is a modelling error before it is a layout problem.
- Sub-process **contents** are not laid out. Model a called sub-process as a
  `callActivity` and give it its own file.
- Very long chains render very wide. That is the process being long, not the
  layout failing; if the width is the complaint, the fix is splitting the
  process, not the layouter.

## Camunda 8 / Zeebe profile — only when a target engine is named

Vanilla BPMN carries no assignee and no job type. When the model is destined for
Camunda 8, add the `zeebe` namespace and these extensions; when no engine is
named, leave them out rather than guessing.

```xml
<bpmn:definitions xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" ...>
```

| Need | Extension |
|---|---|
| Who gets the human task | `<zeebe:assignmentDefinition assignee="..."/>` or `candidateGroups` |
| Which worker runs the service task | `<zeebe:taskDefinition type="..."/>` |
| Which form the human sees | `<zeebe:formDefinition formKey="..."/>` |
| How a message correlates to an instance | `<zeebe:subscription correlationKey="=applicationId"/>` |

Conditions use FEEL and begin with `=`: `=documents_complete = true`. Every
variable a condition reads must be written by an earlier task in the same
process — nothing in the toolchain checks that, and it is the failure that
reaches production.

Other engines put their own namespace here (`camunda:` for Platform 7,
`flowable:`, `activiti:`). The semantic model is portable; the extension block
is not. Keep engine-specific attributes in one place so a port stays cheap.
