# Screen set — requesting a diagram

Derived from: `docs/specs/2026-07-29-diagramming-architecture.md` §7 (status: DRAFT)
Probe verdict: **render** — `drawio` 31.0.2 present, `DISPLAY=:0`
Fidelity: capped — neutral greys only, no brand colour, no typeface choice, no spacing scale
Date: 2026-07-29

## Gate table

| Stage | Gate | Verdict | Evidence |
|---|---|---|---|
| 0 | the spec's step table exists with a Fields and validation column | **BLOCKED, then cleared** | The column was absent from every spec in the repo. The skill refused, the spec was amended to match its own template, and the run resumed. Recorded rather than worked around |
| 1 | every interactive step has a screen; every skip has a reason | **PASS** | 1 screen from 3 steps; 2 steps skipped with reasons below |
| 2 | a panel per named state; marker on every screen | **PASS** | 3 panels, 23 elements, marker present in 3/3 |
| 3 | every sink scanned or named; no styling decision present | **PASS with a finding** | 5 sinks scanned; one colour appeared that this set did not specify — see below |
| 4 | the checker ran; exit 2 or not running it is BLOCKED | **PASS** | `check_geometry.py` exit 0, 4 checks, 0 findings — after the redraw. Before it: exit 1, 7 findings |
| 5 | every screen cites ≥1 step and ≥1 requirement; no file claimed that is not on disk | **PASS** | WF-1 cites the step and FR-3; all three paths stat'd |

## Screens

| ID | Screen | Realises (step) | Realises (requirement) | States drawn | States skipped |
|---|---|---|---|---|---|
| WF-1 | Request a diagram | §7 "Request a diagram" | FR-3 (detect toolchain, state produced-or-skipped) | populated, Empty, Failed | Loading, Partial, Denied — the spec names none for this step |

## Steps with no screen

| Step | Why no screen |
|---|---|
| Probe | Fields and validation reads `n/a — no fields; not interactive` |
| Read the manifest | Fields cell reads `none — read-only surface` |

## Outputs

| ID | Format | Verdict | Path |
|---|---|---|---|
| WF-1 | .drawio | produced | `wf-1.drawio` — redrawn |
| WF-1 | .drawio.svg | produced | `wf-1.drawio.svg` — 363,680 bytes, source embedded |
| WF-1 | .png | produced | `wf-1.png` — 42,120 bytes |

## Fidelity scan — five sinks

| Sink | Scanned | Finding |
|---|---|---|
| shape fill / stroke | yes | 7 colours, all neutral greys and white — within the cap |
| text style attributes | yes | 27 `font-family` declarations in the SVG, none chosen by this set — draw.io emits its own |
| embedded stylesheet | yes | none |
| embedded source XML | yes | present, and carries only the greys above |
| exported image | yes, by a person | see §Legibility |

**Finding:** `#c4c4c4` appears in the rendered output and is specified nowhere
in the source. It comes from the `mxgraph.mockup.*` shape family's own
defaults. The cap holds in substance — it is another grey — but the set does
not fully control its own styling, and that is worth knowing before anyone
claims it does.

## Legibility — bundled checker over the `.drawio` source

`python3 scripts/check_geometry.py wf-1.drawio` → **exit 0, clean, 4 checks.**

The first run of this set, before the fix, produced **7 findings**:

| Class | Findings | Was it seen by eye? |
|---|---|---|
| reserved-region | 5 — `mk0`, `mk620`, `mk1240`, `q0`, `f1240` inside the browser chrome | only 3 of 5 |
| text-overflow | 2 — `e2620` needs 466 px in a 440 px box; `f1240` needs 607 px in 480 px | **neither** |

The eye found two classes; the checker found seven instances across two, four of
which nobody had noticed. That gap is the argument for the mechanical check.

Both root causes were **prevention** problems, fixed in `references/shapes.md`:
the marker now sits above the frame (the stencil reserves a measured, fixed
110 px of chrome), and the input control is a plain rect rather than
`searchBox`, whose stencil draws its own "Search" placeholder beside any
supplied value.

## Change log

| Date | Change | Affected IDs | Reason |
|---|---|---|---|
| 2026-07-29 | Initial set — first real run of `/wireframing-interfaces` | WF-1 | trial |
| 2026-07-29 | Redrawn after the fix plan. Checker exit 0 where it had 7 findings. Marker moved above the frame; searchBox replaced by a plain rect | WF-1 | the first trial found both defects; the checker now catches one of them mechanically and the other is unconstructible |
