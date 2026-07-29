---
name: wireframing-interfaces
description: >
  Use when a spec says what a screen must do but nobody can see it yet — before
  implementation invents the layout, or when someone needs to check the flow
  rather than read a table of states. Draws one rough panel per state the spec
  names and records every state it did not draw. Never decides colour, typeface,
  or spacing. Triggers: "wireframe", "mockup", "gambar layarnya", "rancangan
  tampilan", "sketsa UI", "low fidelity", "bagaimana tampilannya", "desain
  layar", "draw.io mockup", "excalidraw wireframe".
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
      - wireframing interfaces
      - wireframe
      - mockup
      - gambar layarnya
      - rancangan tampilan
      - sketsa ui
      - low fidelity
      - bagaimana tampilannya
      - desain layar
---
# /wireframing-interfaces

A spec fixes what a screen must do and what it shows when things go wrong. It
says nothing about how any of it is arranged — so the arrangement gets invented
while the screen is being built, by whoever is building it, and nobody sees it
first. This draws it early enough that changing it costs a redraw.

```
DRAW EVERY STATE THE SPEC NAMES, OR RECORD WHY NOT.
ROUGH ON PURPOSE — A PICTURE THAT LOOKS FINISHED STOPS THE ARGUMENT.
```

The second law is the one people push back on. It is deliberate: a polished
mockup moves the conversation from "that is not the order we do it in" to "not
that shade of blue", and the first sentence is the one worth having.

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| No spec step table to draw from | `/writing-specs` first — do not invent screens |
| Architecture, data, or process diagrams | `/diagramming-architecture` |
| Visual design: brand, colour, type, spacing | a design tool, and a different reviewer |
| Proving accessibility conformance | `/designing-test-cases` derives it, `/running-uat` runs it |

## Stage 0 — Inputs

| Input | Source | If missing |
|---|---|---|
| The spec's step table | `docs/specs/…` §7 | **stop** — route to `/writing-specs`; never invent screens |
| The states each step names | that table's Empty / Loading / Partial / Denied / Failed columns | a step naming none gets one default panel and a gap row |
| Requirement IDs the step realises | the spec's coverage table | a screen tracing nowhere is out of scope |
| Output root | `docs/design/YYYY-MM-DD-<slug>/` | a user or repo preference overrides |

## Which steps get a screen

The step table has **no actor column**, so "has a human actor" is not derivable
from the declared input. The test is syntactic: a step is interactive when its
**Fields and validation** cell is non-empty. A nightly job has no fields; a
screen does.

A step with an empty fields cell that nonetheless names a state is a **spec
defect** — record it and ask. Do not guess.

## The probe

```bash
command -v drawio >/dev/null 2>&1 && echo present || echo absent
[ -n "${DISPLAY:-}" ] && echo display || echo no-display
```

Any failure resolves to **`no-render`**: the editable `.drawio` is still
produced, every render row reads `n/a` with its reason, and absence is
distinguished from no-display. Never assume present.

## The stages — each gate can refuse

Every gate writes one row: *stage · PASS / BLOCKED / `n/a` · evidence*. **A PASS
with an empty evidence cell is not a PASS.** A gate whose subject does not exist
reads `n/a`, never PASS.

### 1. Derive — which screens, which states

One screen per interactive step. Per screen, list the states the spec names.
A state the spec does not name is **skipped and recorded**, never silently
absent — that distinction is the whole discipline. Non-interactive steps get no
screen and a recorded reason.

**Gate:** every interactive step has a screen; every skipped step and every
skipped state has a reason.

### 2. Draw — one panel per named state

The permitted shapes and the fidelity ceiling are in `references/shapes.md`.
Neutral shapes only. A shape unavailable becomes a plain rectangle **plus a
recorded note** — never a silent substitution.

Every screen carries the visible fidelity marker, verbatim from the reference,
so it is identical across artifacts and greppable.

**Gate:** a panel exists per named state; the marker is on every screen.

### 3. Cap the fidelity — a universal negative

No brand colour, no typeface choice, no spacing scale. This quantifies over the
whole artifact, so check every place styling can hide: shape fill and stroke,
text style attributes, any embedded stylesheet, the embedded source XML, and the
exported image. The sink list is in `references/shapes.md`.

**An absence scan passes against an artifact that draws nothing.** That is why
Stage 1's coverage gate, not this one, is what proves the set is real.

**Gate:** every sink scanned or named as unscanned; no styling decision present.

### 4. Check it can be read

Run the bundled checker over the `.drawio` **source** — not the render, and not
conditional on one. Four classes with numbers, listed in `references/shapes.md`.
Report every finding naming the screen and the control.

On the first real run it caught the marker/chrome collision in 3 of 3 panels and
two overflowing labels the author had not seen.

**Gate:** `python3 scripts/check_geometry.py <file>.drawio` ran and its findings
are listed. Exit **2**, or not running it, is **BLOCKED** — the check reads the
source, which exists in every probe verdict, so there is no case where it
cannot run.

### 5. Manifest and hand back

Write the manifest **once, after the last drawing operation returns**; every row
records an **observed** result. Columns and the `WF-n` scheme are in
`references/screen-set.md`.

Report: how many screens, which states were drawn and which skipped and why,
which outputs exist, legibility findings. When a reviewer objects, **fix the
spec and regenerate** — never patch the picture alone, because the next run
erases it and the spec stays wrong.

**Gate:** every screen cites ≥1 step and ≥1 requirement ID; the report claims no
file that is not on disk.

## Output

`docs/design/YYYY-MM-DD-<slug>/` in the target system's repo — a user or repo
preference overrides it. When the caller asks for content inline, produce it
inline and say no file was written.

## Judgment

Two calls are yours. **Which steps are genuinely one screen and which are two** —
the spec's rows are process steps, not screens, and the mapping is not always
one to one. And **where the fidelity cap must bend**: a screen whose entire
point is density needs enough structure to show it, and saying so beats
pretending the cap is free.

## Badly and well

> Spec step: *submit registration — fields: vessel name, GT, owner type;
> Empty: "no drafts yet"; Denied: not your region; Failed: retry banner*

| | |
|---|---|
| ✗ | One polished screen with the populated form, a brand-blue submit button, and no other state. It looks decided, so nobody argues with the order of the fields. |
| ✓ | `WF-1` with four panels — populated, empty, denied, failed — in neutral grey, each marked *not visual design*. Loading is absent **and listed as skipped**, because the spec names no loading state. The reviewer's first comment is "owner type should come before GT", which is the comment worth having. |

## Red flags

| Thought | Reality |
|---|---|
| "The populated state is the interesting one" | It is the one everyone already imagines correctly. The empty and denied states are where screens are actually wrong. |
| "That state is obviously not needed" | Then it costs one row to say so. Silence and absence look identical. |
| "Let me make it look decent" | A picture that looks finished suppresses the objection this exists to invite. |
| "The field label says 'green button', so colour it" | Draw the label as text. No styling is derived from spec content. |
| "No step table, but I know roughly what the screen does" | Then you are inventing requirements. Stop and route to `/writing-specs`. |
| "The reviewer moved a box, keep their version" | The next run erases it. Fix the spec and regenerate. |
| "No renderer here, so nothing to produce" | The editable file still ships; the render rows read `n/a` with a reason. |

## Hand-off

Input from `/writing-specs` §7. The `AC` rows the spec already carries stay the
oracle; this adds a picture, not a new requirement. Send a set that stakeholders
will review through `/multi-persona-review` — but note that a panel of simulated
experts is not the operator whose objection the artifact exists to invite.

## Bundled files

- `references/shapes.md` — the permitted shape set, the fidelity ceiling, the
  sink list, and the exact marker text.
- `references/screen-set.md` — the manifest, the `WF-n` scheme, the state grid,
  and the trace rule.

## Changes

- **0.2.0** — Legibility mandate made honest after the first real trial. Eight
  defect classes became four with numeric thresholds, run by a bundled checker
  over the `.drawio` **source** rather than the rendered SVG — the source exists
  in every probe verdict and is the tool's persisted contract, while the SVG's
  label encoding already broke one parser. Two classes were deleted rather than
  implemented (edge crossings is a layout-search result, not a measurement; short
  terminals are cosmetic) and contrast retired to a one-time palette audit. The
  gate lost its unconditional escape: "recorded as not run" no longer passes.
  `type` semantic → hybrid, which the validator required once `scripts/` existed.
- **0.1.0** — Initial. Built from `docs/specs/2026-07-29-wireframing-interfaces.md`.
  The interactive test is syntactic because a review found the declared input —
  the spec's step table — has no actor column, so the original "has a human
  actor" rule was not derivable from it. The fidelity cap is a product decision
  with a recorded cost, not a limitation. The drawing program is probed rather
  than assumed: it is absent on both machines this is deployed to, so `no-render`
  is a normal verdict. The legibility stage exists because a prior-art survey
  found rendered-output linting treated as a required preflight elsewhere, and a
  wireframe whose labels spill out of their controls is exactly the unreadable
  artifact this skill exists to avoid.
