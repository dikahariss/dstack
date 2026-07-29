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

## Legibility — three checks, over the source

| Class | Threshold | Why a reader misreads without it |
|---|---|---|
| edge through a shape | overlap > **8 px** into a box the edge does not connect | the reader infers a connection that does not exist |
| element overlap | partial intersection > **20 px²** between two elements (full containment is intentional and skipped) | the reader binds text to the wrong element |
| text overflow, width | `len(label) x font-size x 0.55` > box width − **8 px** | content is lost |
| reserved region | any element inside a stencil's reserved area — `browserWindow` reserves its top **110 px** | the element lands on chrome the stencil draws |

Run it: `python3 scripts/check_geometry.py <file>.drawio` — exit 0 clean,
1 findings, **2 unparseable, which is not a pass.**

It reads the **`.drawio` source**, never the rendered SVG. The source is the
tool's persisted contract; the SVG's label encoding is a renderer detail that
already broke one parser (1 `<text>` against 20 `<foreignObject>` in one file).
The source is also present in *both* probe verdicts, so the check runs on
machines with no renderer at all.

**Deleted, not implemented:** *edge crossings* — "crossing where a reroute would
avoid it" is a layout-search result, not a measurement; it fires on nearly every
non-planar graph and is actionable on almost none. *Short terminal* — cosmetic.
**Retired to a one-time audit:** *contrast*. The palette is fixed by this
reference, so the check measured 10.8:1 and 12.6:1 against a 4.5:1 bar and
cannot fail unless the palette changes. Audited once below, including the
stencil defaults.

## Palette audit — done once, not per run

| Colour | Source | Contrast against white | Verdict |
|---|---|---|---|
| `#333333` | this reference | 12.6:1 | pass |
| `#666666` | this reference | 5.7:1 | pass |
| `#888888` | this reference | 3.5:1 | body text only at ≥14 px |
| `#999999` | this reference | 2.8:1 | borders and rules only, never text |
| `#c4c4c4` | **`mxgraph.mockup.*` stencil defaults** — specified nowhere in our source | 1.7:1 | decorative only; the set does not fully control it |

Re-run this audit when the permitted shape set or the fill list changes — not
on every diagram.

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
