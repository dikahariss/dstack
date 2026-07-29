# Shapes, the fidelity ceiling, and where styling hides

## The permitted shape set

Verified to render offline, no network:

| Purpose | Shape |
|---|---|
| The window frame | `mxgraph.mockup.containers.browserWindow` |
| A text input or search field | `mxgraph.mockup.forms.searchBox` |
| A button | `mxgraph.mockup.forms.button` |
| Anything else — a card, a table, a panel, a list row | plain `rounded=1` rectangle |
| Any label, heading, or body copy | plain `text` |

That is the whole vocabulary. It is short on purpose: a wireframe made of five
shapes cannot accidentally become a design.

**A shape that will not render becomes a plain rectangle plus a recorded note.**
Never a silent substitution — plain boxes everywhere look like a deliberate
style choice, and the reader cannot tell the difference.

## The fidelity marker

Every screen carries this text, verbatim, so it is identical across artifacts
and greppable:

```
NOT VISUAL DESIGN — layout and states only, drawn from the spec
```

Place it top-left of the frame, plain text, same size as body copy. It is not
decoration; it is the sentence that stops a reviewer treating the picture as a
decision.

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

## Legibility — what to check on a rendered panel

| Defect | What it looks like |
|---|---|
| label overflow | a field label wider or taller than its control |
| text contrast | label colour too close to its fill for that size |
| collision | two labels or a label and a control overlapping |
| clipped frame | content extending past the window frame |

Report every finding naming the screen and the control. Fix by adjusting the
generated source and regenerating — never by editing the rendered file, which
the next run erases.
