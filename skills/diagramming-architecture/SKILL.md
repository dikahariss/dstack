---
name: diagramming-architecture
description: >
  Use when a diagram needs to leave the document it lives in — to be opened,
  edited, or handed to someone who does not write Mermaid; when a picture is
  wanted for a review, a slide, or a whiteboard; or when a spec's inline fence
  should also exist as a file. Produces the source plus editable and viewable
  files, and states per output what this machine could and could not produce.
  Triggers: "buat diagram", "diagram arsitektur", "gambar arsitekturnya",
  "excalidraw", "draw.io", "drawio", "export diagram", "editable diagram",
  "C4 diagram", "ERD gambar", "diagram alur", "diagram bisa diedit".
allowed-tools: Read Grep Glob Write Edit Bash Skill
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - diagramming architecture
      - buat diagram
      - diagram arsitektur
      - gambar arsitekturnya
      - excalidraw
      - drawio
      - export diagram
      - editable diagram
      - c4 diagram
      - diagram alur
---
# /diagramming-architecture

A diagram written as a fence inside a document cannot be opened, moved, or
handed back. This turns the text source into files other people can edit —
without the text ceasing to be the one that counts.

```
THE TEXT SOURCE IS THE ONE THAT COUNTS.
NEVER CLAIM AN OUTPUT THIS MACHINE DID NOT PRODUCE.
```

The second law is not politeness. The drawing program is absent on most
machines this runs on, and a run that quietly produces nothing while reporting
success is worse than one that refuses.

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| The diagram belongs inside the spec and nowhere else | leave the Mermaid fence — `/writing-specs` is right |
| A screen, a form, a layout | `/wireframing-interfaces` |
| A chart of data — bars, lines, distributions | `/dataviz` |
| No design to draw yet | `/writing-specs` first |

## Stage 0 — Inputs

| Input | Source | If missing |
|---|---|---|
| What the diagram must answer, in one sentence | the request, the spec | stop — a picture with no question becomes decoration |
| Its altitude | context / container / component / data / process | pick one, say which, and say why |
| The design it depicts | `docs/specs/…`, the code | draw nothing you cannot cite |
| Output root | `docs/design/YYYY-MM-DD-<slug>/` | a user or repo preference overrides |

## The probe — run it before producing anything

```bash
command -v drawio >/dev/null 2>&1 && echo present || echo absent
[ -n "${DISPLAY:-}" ] && echo display || echo no-display
```

Any failure resolves to **`no-render`**. Never assume present. `no-render` is a
normal verdict, not an error: the text source and the `.drawio` XML are still
produced, and every other row reads `n/a` with its reason.

**Absence and no-display are different reasons.** Say which.

## The stages — each gate can refuse

Every gate writes one row: *stage · PASS / BLOCKED / `n/a` · evidence*. **A PASS
with an empty evidence cell is not a PASS.** A gate whose subject does not exist
reads `n/a`, never PASS. BLOCKED names what is missing and escalates; the set
still publishes with the row visible.

### 1. Frame — one question, one altitude

Name what the diagram answers and at which altitude. A request spanning two
altitudes is **split into one diagram per altitude**, each labelled — or refused
with the reason. Mixing container and component in one picture is the most
common way a diagram stops being readable.

**Gate:** the question is one sentence; the altitude is named.

### 2. Author the source

Write Mermaid. Which type answers which question, and the layout recipes that
keep it readable, are in `references/formats.md`. Keep labels short, detail on
the edges, and roughly a dozen nodes — past that, split and say why.

**Gate:** the source parses; a parse error is fixed here, never shipped.

### 3. Convert and render — what this machine can do

Per the probe. The full matrix is in `references/formats.md`; the shape of it:

| Verdict | `.mmd` | `.drawio` | `.drawio.svg`, `.png` | `.excalidraw` |
|---|---|---|---|---|
| `render` | yes | yes | yes | yes, flowcharts only |
| `no-render` | yes | yes | `n/a` + reason | yes, flowcharts only |

**Measured, not assumed:** draw.io converts sequence, state and ER diagrams to
editable `.drawio` just as it does flowcharts. The flowchart-only limit belongs
to the Mermaid→Excalidraw converter alone — do not apply it to the draw.io path.

**Gate:** every declared output has a verdict; nothing is claimed that is not on
disk.

### 4. Check it can be read

A diagram nobody can read has failed regardless of how well it traces. When a
viewable form exists, check it and report every finding: text overflowing its
box, text against fill contrast, edges penetrating or running along borders,
labels colliding, arrow runs too short after the last bend.

When no viewable form exists, say the check **did not run**. Never let silence
imply the diagram is clean.

**Gate:** the check ran and its findings are listed, or it is recorded as not
run with the reason.

### 5. Manifest — commit what was observed

Write the manifest **once, after the last output operation returns**. Every row
records an **observed** result, never an intended one: an operation that errored
reads failed, not produced. Columns, the `DG-n` scheme, and the provenance rule
are in `references/artifact-set.md`.

Regeneration from an unchanged source is **identical after normalising the
per-run random fields** — draw.io mints a random `diagram id`, and the
Excalidraw format requires `seed` and `versionNonce`. Byte-identity is
unachievable in either ecosystem; the source hash is what proves nothing moved.

**Gate:** every artifact names its source and the source's hash; every row
reflects an observed result.

### 6. Hand back

Report: what the diagram answers, the altitude, which outputs exist, which do
not and why, and any legibility findings. Reference the artifact **from** the
spec — never move the fence out of it. The spec's table stays normative.

**Gate:** the report claims no file that is not on disk.

## Output

`docs/design/YYYY-MM-DD-<slug>/` in the target system's repo — a user or repo
preference overrides it. When the caller asks for content inline, produce it
inline and say no file was written.

Report in chat as: the question answered, the altitude, produced and skipped
outputs side by side, legibility findings, and any BLOCKED gate. Not the files.

## Judgment

Two calls are yours. **Which picture answers the question being asked** — a
sequence diagram for what is really a hierarchy costs a reader more than no
picture. And **when not to draw at all**: if a table already carries it, a
diagram adds maintenance and no information. Say so and stop.

## Badly and well

> Ask: "diagram the export flow"

| | |
|---|---|
| ✗ | One picture with the browser, the API, the worker, the queue, the table schema, and the deploy target. Two altitudes, fourteen nodes, no stated question. |
| ✓ | `DG-1` *container*: what runs and what talks to what — 5 nodes, edges labelled. `DG-2` *component*, inside the worker: how one export is produced. Each answers one question; the second exists only because the first raised it. |

## Red flags

| Thought | Reality |
|---|---|
| "I'll render it and see" | Probe first. A run that assumes the program is present reports files that do not exist. |
| "It's a sequence diagram, so no editable file" | Measured false for draw.io. That limit is the Excalidraw converter's alone. |
| "Two runs should be byte-identical" | Impossible in both ecosystems — random ids and nonces. Compare the source hash. |
| "The picture looks fine to me" | You are not the reader who has to object. Run the legibility check. |
| "One diagram can cover both levels" | That is the diagram nobody reads. Split it. |
| "No renderer here, so nothing to do" | Wrong. Source and editable file still ship; the rest reads `n/a` with a reason. |

## Hand-off

Input from `/writing-specs`. The artifact is referenced from the spec, never a
replacement for its fence. Send a set that will be reviewed by others through
`/multi-persona-review`.

## Bundled files

- `references/formats.md` — which diagram answers which question, the layout
  recipes, the full degradation matrix, and what each format carries.
- `references/artifact-set.md` — the manifest, the `DG-n` scheme, the provenance
  and normalisation rules.

## Changes

- **0.1.0** — Initial. Built from `docs/specs/2026-07-29-diagramming-architecture.md`.
  Three things were established by measurement rather than assumption before the
  body was written: the drawing program is absent on both deploy targets, so
  absence is a first-class verdict rather than an error; **draw.io converts
  sequence, state and ER diagrams to editable output** — an earlier draft wrongly
  carried the Excalidraw converter's flowchart-only limit across to it; and
  byte-identical regeneration is impossible in both ecosystems, so idempotence is
  scoped to identity after normalising per-run random fields. The legibility
  stage exists because a prior-art survey found rendered-output linting treated
  as a required preflight elsewhere, and nothing in the first draft of this spec
  checked whether the picture could be read at all.
