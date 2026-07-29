# Shapes, the fidelity ceiling, and where styling hides

## The permitted shape set

Verified to render offline, no network:

| Purpose | Shape |
|---|---|
| The window frame | `mxgraph.mockup.containers.browserWindow` |
| A text input or search field | plain rect, `align=left;spacingLeft=8` — **not** `searchBox` |
| A button | `mxgraph.mockup.forms.button` |
| Anything else — a card, a table, a panel, a list row | plain `rounded=1` rectangle |
| Any label, heading, or body copy | plain `text` |

That is the whole vocabulary. It is short on purpose: a wireframe made of five
shapes cannot accidentally become a design.

**Why not `searchBox`.** The stencil draws its own "Search" placeholder, so a
supplied value renders beside it and every field shows two overlapping texts.
Measured on the first real run: 6 findings across 2 panels. If you must use it,
`mainText=;` suppresses the placeholder — but a plain rect is fully under your
control and simpler.

**A shape that will not render becomes a plain rectangle plus a recorded note.**
Never a silent substitution — plain boxes everywhere look like a deliberate
style choice, and the reader cannot tell the difference.

## The fidelity marker

Every screen carries this text, verbatim, so it is identical across artifacts
and greppable:

```
NOT VISUAL DESIGN — layout and states only, drawn from the spec
```

**Place it above the frame, beside the panel label** — never inside it. The
`browserWindow` stencil reserves a **fixed 110 px of chrome** regardless of
frame height (measured at 200, 400 and 600 px: the separator sits at y=110 in
all three). Content starts at frame `y + 110`.

An earlier version said "top-left of the frame". The first real run obeyed it,
placed the marker 50 px below the frame top, and landed on the toolbar in 3 of
3 panels. The rule was wrong, not the run — which is why this one carries a
measured number instead of a direction.

## The ceiling — what may never appear

| Forbidden | Because |
|---|---|
| Any brand colour | it invites the conversation this exists to avoid |
| A typeface choice | same |
| A spacing scale or grid system | same |
| Icons beyond a plain glyph | they read as finished |
| Shadows, gradients, rounded-corner systems | same |

Neutral fills only — white, and greys for disabled or inactive. Colour is
permitted for exactly one thing: marking a state panel's name, and only in the
panel's own label, never inside the drawn screen.

## Where styling hides — the sink list

The ceiling is a universal negative, so it quantifies over the artifact rather
than over any input. Check every place a style can live:

| # | Sink | How to check |
|---|---|---|
| 1 | shape `fillColor` / `strokeColor` | scan the XML attributes |
| 2 | text style attributes — `fontFamily`, `fontSize`, `fontStyle` | scan the XML attributes |
| 3 | an embedded stylesheet in the exported SVG | scan the SVG for `<style>` |
| 4 | the embedded source XML inside `.drawio.svg` | decode `content=` and scan it too |
| 5 | the exported image | the one place a violation is actually *seen* |

Sinks 4 and 5 are the ones that get missed: the SVG's own attributes can be
clean while the embedded source carries a style string, and the image is the
artifact a stakeholder actually looks at.

**An absence scan passes against an artifact that draws nothing.** All five
sinks clean and zero panels drawn is a passing scan and a useless set — which is
why the coverage gate, not this one, proves the set is real. Record this
weakness rather than relying on the scan alone.

## Drawing a state panel

One panel per state the spec names. Panels sit in a row, left to right, in the
spec's own column order — Empty, Loading, Partial, Denied, Failed — with the
populated state first. Each panel is the same frame size; only the contents
differ. Equal frames are what make the difference between states visible at a
glance.

Label each panel with the state name outside the frame, never inside it.

| State | What the panel shows |
|---|---|
| populated | every field from the spec's Fields and validation cell, in the spec's order |
| Empty | the empty message the spec names, and what the person can do next |
| Loading | whatever the spec says is visible while waiting — not a spinner unless the spec says so |
| Partial | some rows present, the rest accounted for |
| Denied | the refusal the spec names, and the route back |
| Failed | the error the spec names, and whether the work is recoverable |

A state the spec does not name **is not invented**. It is skipped and recorded.

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
