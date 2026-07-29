# Diagram set — how a request becomes shipped work through the skill catalog

Source of truth: `pipeline.mmd`. Everything else is generated and disposable.
Probe verdict: **render** — `drawio` 31.0.2 present, `DISPLAY=:0` usable
Date: 2026-07-29

## Gate table

| Stage | Gate | Verdict | Evidence |
|---|---|---|---|
| 1 | one question, one altitude | **PASS** | §Diagrams — question stated, altitude `container`, single altitude throughout |
| 2 | the source parses | **PASS** | `drawio -x` accepted it on first pass; 13 lines, 12 edges, 12 nodes |
| 3 | every declared output has a verdict; nothing claimed that is not on disk | **PASS** | §Outputs — four rows, all `produced`, byte counts observed after the fact |
| 4 | legibility check ran and findings listed | **BLOCKED** | §Legibility — 1 of 8 defect classes was actually checkable. See the escalation |
| 5 | every artifact names its source and hash; rows reflect observed results | **PASS** | this file, written after the last conversion returned |
| 6 | the report claims no file that is not on disk | **PASS** | every path below was stat'd |

## Diagrams

| ID | Question it answers | Altitude | Source file | Source hash | Depicts |
|---|---|---|---|---|---|
| DG-1 | Which skill produces which document, and what does each consume? | container | `pipeline.mmd` | `aa2aa93b5649e8bb` | the catalog's specification chain, `skills/using-dstack/references/skill-catalog.md` |

## Outputs

| ID | Format | Verdict | Path or reason |
|---|---|---|---|
| DG-1 | .mmd | produced | `pipeline.mmd` — 526 bytes |
| DG-1 | .drawio | produced | `pipeline.drawio` — 19,105 bytes |
| DG-1 | .drawio.svg | produced | `pipeline.drawio.svg` — 317,395 bytes, editable source embedded |
| DG-1 | .png | produced | `pipeline.png` — 60,344 bytes |
| DG-1 | .excalidraw | **n/a** | not requested; the source is a flowchart so it would convert |

## Legibility — bundled checker over the `.drawio` source

`python3 scripts/check_geometry.py pipeline.drawio` → **exit 0, clean, 4 checks.**

Eight classes became four, each with a number, run against the source rather
than the render. Two were deleted rather than implemented — edge crossings
(a layout-search result, not a measurement) and short terminals (cosmetic) — and
contrast retired to a one-time palette audit, since the palette is fixed by the
reference and cannot fail against a 4.5:1 bar.

The earlier version of this section recorded 6 of 8 classes as *did not run*.
That verdict is no longer available: the source exists in every probe verdict,
so the gate now blocks on a check that did not run rather than accepting it.

## Change log

| Date | Change | Affected IDs | Reason |
|---|---|---|---|
| 2026-07-29 | Initial set — first real run of `/diagramming-architecture` | DG-1 | trial |
| 2026-07-29 | Legibility re-run under the new mechanism: checker over the source, exit 0 | DG-1 | the 8-class mandate had no implementation for 7 of them |
