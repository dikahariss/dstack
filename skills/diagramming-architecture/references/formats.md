# Which picture, which format, and what this machine can do

## Which diagram answers which question

| The question | Mermaid type | Altitude |
|---|---|---|
| What pieces exist and what talks to what? | `flowchart` | container / component |
| What happens, in what order, between whom? | `sequenceDiagram` | any |
| What does the system keep track of, and how do they relate? | `erDiagram` | data |
| What states can this thing be in? | `stateDiagram-v2` | data |
| What does a person go through, step by step? | `flowchart` with `subgraph` lanes | process |

One question per diagram. A picture answering three answers none — draw three.

## Layout recipes

Layout is the part that decides whether a diagram is read or skimmed. Named
recipes beat improvising coordinates:

| Recipe | Shape | Use when |
|---|---|---|
| **Left-to-right pipeline** | `flowchart LR`, one row | a flow with a clear start and end |
| **Top-down hierarchy** | `flowchart TD` | containment, ownership, org shape |
| **Swimlanes** | `flowchart TB` + one `subgraph` per actor | who does which step |
| **Hub and spokes** | one central node, radial edges | one thing many others depend on |
| **Two columns** | two `subgraph`s side by side | before/after, or ours/theirs |
| **Timeline** | `flowchart LR` with equal-width nodes | ordered phases, no branching |

Rules that survive every recipe: short node labels, detail on the edge labels,
roughly a dozen nodes, and every edge labelled. An unlabelled arrow means
"related somehow", which each reader resolves differently.

## What each format carries

| Format | Editable | Embeds its source | Needs a renderer | Notes |
|---|---|---|---|---|
| `.mmd` | yes, as text | it *is* the source | no | always produced |
| `.drawio` | yes, in draw.io | it is the source | no — plain XML | always produced |
| `.drawio.svg` | yes, in draw.io | **yes**, via `-e` | yes | view and edit in one file |
| `.png` | no | with `-e`, yes | yes | for slides and chat |
| `.excalidraw` | yes, at excalidraw.com | it is the source | no to generate, yes to render | **flowcharts only** |

## The degradation matrix

Conditions: **A** = the program is on `PATH` · **B** = a display is usable ·
**C** = the diagram is a flowchart.

| # | A | B | C | `.mmd` | `.drawio` | `.drawio.svg` / `.png` | `.excalidraw` |
|---|---|---|---|---|---|---|---|
| R1 | yes | yes | yes | ✓ | ✓ | ✓ | ✓ |
| R2 | yes | yes | no | ✓ | ✓ | ✓ | `n/a` — not a flowchart |
| R3 | yes | no | yes | ✓ | ✓ | `n/a` — no display | ✓ |
| R4 | yes | no | no | ✓ | ✓ | `n/a` — no display | `n/a` — not a flowchart |
| R5 | no | — | yes | ✓ | ✓ | `n/a` — program absent | ✓ |
| R6 | no | — | no | ✓ | ✓ | `n/a` — program absent | `n/a` — not a flowchart |

**`C` gates only the Excalidraw column.** Verified 2026-07-29: `drawio -x`
converted `sequenceDiagram`, `stateDiagram-v2` and `erDiagram` to editable
`.drawio` — 10, 16 and 8 cells respectively. The flowchart-only ceiling is a
property of `@excalidraw/mermaid-to-excalidraw`, not of draw.io. An earlier
draft applied it to both and would have refused editable output that works.

**No row collapses.** Six rows, not four: `B` and `C` gate different columns, so
neither can be folded away without losing a case.

## The commands

```bash
# source → editable XML (works for every diagram type)
drawio --no-sandbox -x -f xml -o <slug>.drawio <slug>.mmd

# → viewable, with the editable source embedded
drawio --no-sandbox -x -f svg -e -o <slug>.drawio.svg <slug>.mmd
drawio --no-sandbox -x -f png -e -o <slug>.png <slug>.mmd

# an edited artifact back to XML, to compare against the source
drawio --no-sandbox -x -f xml -o back.xml <slug>.drawio.svg
```

A non-zero exit is surfaced verbatim and the row reads **failed**, which is not
the same as skipped. Never leave a zero-byte artifact behind.

## Legibility — what to check on a rendered diagram

A diagram that traces perfectly and cannot be read has failed. When a viewable
form exists, check and report:

| Defect | What it looks like |
|---|---|
| text overflow, width | a label wider than its box |
| text overflow, height | a label taller than its box |
| text contrast | font colour too close to its fill for that font size |
| edge through a shape | a line penetrating a box it does not connect to |
| edge along a border | a line running flush with a box or frame edge |
| edge crossings | lines crossing where a reroute would avoid it |
| label collision | a label box overlapping another box |
| short terminal | an arrow head with almost no run after the last bend |

Report every finding with the element named. Fix by adjusting the source, then
regenerate — never by hand-editing the rendered file, which the next run erases.

## The Excalidraw path

Generating `.excalidraw` needs **no browser**: it is plain JSON and can be
written directly. Only *rendering* it needs one, which is why there is no
viewable form on this path and why the file is a hand-off, opened by a person
at excalidraw.com.

Two traps:

- **Bindings are reciprocal.** When an arrow binds to a shape, the shape must
  also list that arrow in its `boundElements`. Miss it and the file opens with
  the arrow detached.
- **`seed` and `versionNonce` are required and random.** They are why two runs
  never produce identical bytes. Normalise them before comparing.
