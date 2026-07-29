# Legibility mandate and prevention constraints — fix plan

**Goal:** make the legibility promise honest. Three checks that always run
against a stable substrate, with numbers; two prevention constraints that make
the trial's two real defects unconstructible; and a gate that can actually fail.

**Architecture:** the check moves from the **rendered SVG** to the **`.drawio`
source XML**. The source is the tool's persisted contract; the SVG is a
renderer implementation detail that already broke once. The source is also
present in *both* probe verdicts and is the only substrate a headless CI can
see. Eight defect classes become three with thresholds; contrast retires to a
one-time palette audit; two classes are deleted as undecidable or cosmetic.

**Stack:** Python 3 stdlib only (`xml.etree`, `re`) — matching the repo's other
bundled scripts. No new dependency.

**Fixes:** the four defects found by the first real trial, recorded in
`docs/design/2026-07-29-skill-pipeline/manifest.md` and
`docs/design/2026-07-29-diagram-request-screen/manifest.md`.

Execute task by task. Run the stated command and compare against the expected
output before ticking. `/verifying-before-done` before any "done".

## Evidence this plan rests on — all measured, not assumed

| # | Fact | How it was established |
|---|---|---|
| M-1 | 7 skills in this catalog ship `scripts/`; the two new ones ship 0 | `find skills -maxdepth 2 -type d -name scripts` |
| M-2 | Geometry is fully present in the source: 34 `mxGeometry` / 80 coordinates in `pipeline.drawio`, 23 / 117 in `wf-1.drawio` | grep on the artifacts |
| M-3 | The SVG substrate is unstable: 1 `<text>`, 20 `<foreignObject>`, 21 `<switch>` in one file | grep on `pipeline.drawio.svg` |
| M-4 | CI has no `drawio`, no `DISPLAY`, no `xvfb` — 0 hits | `.github/workflows/ci.yml` |
| M-5 | **`browserWindow` chrome is a fixed 110 px**, identical at frame heights 200/400/600 — not proportional | rendered three frames, measured the separator |
| M-6 | The marker placement rule was **obeyed** and still collided: marker 50 px below frame top, chrome occupies 110 px | `shapes.md:31` + the trial artifact |
| M-7 | `mainText=;` suppresses the `searchBox` placeholder; a plain rect with `align=left;spacingLeft=8` is cleaner still | rendered both |
| M-8 | Labels are extractable from `<foreignObject>` `<div>` — but that binds to the unstable substrate, so it is **not** the chosen path | rendered and parsed |

## File structure first

| File | Its one responsibility |
|---|---|
| `skills/diagramming-architecture/scripts/check_geometry.py` | the three checks, over `.drawio` source XML |
| `skills/wireframing-interfaces/scripts/check_geometry.py` | same checker, self-contained copy (skills install standalone) |
| `.../diagramming-architecture/references/formats.md` | class list 8→3 with thresholds; palette audit replaces per-run contrast |
| `.../wireframing-interfaces/references/shapes.md` | same, plus the two prevention constraints with measured numbers |
| both `SKILL.md` | the gate gains a failing branch; the check command is named |
| both `eval/cases.jsonl` | the escape hatch widened so the honest report is not the anti-pattern |
| both `references/*-set.md` | one identical class list; every class emits a row |

Tasks 1 and 2 are independent of everything and of each other. Task 3 depends
on 1. Tasks 4–7 depend on 3.

---

### Task 1: Fix the two prevention constraints

The trial's two real defects are **prevention** problems. Neither is detectable:
the `searchBox` double-text is drawn by the stencil and appears in neither
substrate, and the marker collision came from obeying a rule that was wrong.

**Files:** `skills/wireframing-interfaces/references/shapes.md`

- [ ] **Step 1 — replace the input-control row**

Replace `mxgraph.mockup.forms.searchBox` with a plain rectangle,
`rounded=0;whiteSpace=wrap;html=1;align=left;spacingLeft=8`. Record why in one
line: the stencil draws its own "Search" placeholder, so a supplied value
renders beside it. Keep `searchBox` as an option **only** with `mainText=;`, and
say that.

- [ ] **Step 2 — replace the marker placement rule**

Currently *"Place it top-left of the frame"* — obeyed, and still wrong (M-6).
Replace with the measured constraint:

> The `browserWindow` stencil reserves a **fixed 110 px** of chrome regardless
> of frame height (measured at 200/400/600). Content starts at frame `y + 110`.
> Place the marker **above the frame**, beside the panel label, so no stencil
> geometry can move under it.

- [ ] **Step 3 — verify the constraint is real, not remembered**

```bash
cd /tmp && printf '<mxfile><diagram name="t"><mxGraphModel page="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="w" value="" style="shape=mxgraph.mockup.containers.browserWindow;html=1;mainText=;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="400" height="300" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>' > chk.drawio && drawio --no-sandbox -x -f svg -o chk.svg chk.drawio >/dev/null 2>&1 && grep -c 'M 0 110' chk.svg
```

Expected: `1` or more — the 110 px separator is present at a 300 px frame too.

---

### Task 2: Cut the class list from eight to three

**Files:** both `references/formats.md` and `references/shapes.md`

- [ ] **Step 1 — delete two classes outright**

| Deleted | Why |
|---|---|
| edge crossings | *"crossing where a reroute would avoid it"* is a layout-search result, not a measurement. Fires on nearly every non-planar graph, actionable on almost none — the check that gets muted and takes the others with it |
| short terminal | cosmetic; no reader misreads a diagram because an arrow ran 6 px after its bend |

- [ ] **Step 2 — retire contrast from the per-run gate**

The palette is fixed by the skill itself (*"neutral fills only — white, and
greys"*), so the check measured 10.8:1 and 12.6:1 against a 4.5:1 bar. It cannot
fail unless the reference changes. Move it to a **one-time palette audit**
recorded in the reference — covering the stencil defaults too, since `#c4c4c4`
appeared from `mxgraph.mockup.*` and no source specified it.

- [ ] **Step 3 — keep three, each with a number**

| Class | Threshold | Why a reader misreads without it |
|---|---|---|
| edge through a shape | overlap > **8 px** into a box the edge does not connect | the reader infers a connection that does not exist |
| element overlap | intersection area > **20 px²** between two labelled elements | the reader binds text to the wrong element |
| text overflow, width | estimated text width > box width − **8 px** padding | content is lost |

Estimated width = `len(label) × font-size × 0.55`, the ratio already used in the
trial. State it, so a reader can reproduce a verdict.

- [ ] **Step 4 — verify no class survives without a number**

```bash
grep -A20 'defect class' skills/*/references/{formats,shapes}.md | grep -cE '\*\*[0-9]+ ?(px|px²)\*\*'
```

Expected: `6` — three classes × two files.

---

### Task 3: Build the checker

**Files:** `skills/diagramming-architecture/scripts/check_geometry.py`, and an
identical copy in `skills/wireframing-interfaces/scripts/`.

Self-contained duplication is deliberate: a skill installs standalone, and the
catalog has no shared-script mechanism a skill may rely on at runtime.

- [ ] **Step 1 — parse the source, not the render**

Read `.drawio`, walk `mxCell`, collect `(id, value, style, x, y, w, h)` from
`mxGeometry`; classify vertex vs edge from the `vertex`/`edge` attributes and
`source`/`target`.

- [ ] **Step 2 — three predicates, three thresholds**

`segment_into_box(edge, box, tol=8)` · `rect_overlap_area(a, b) > 20` ·
`text_too_wide(label, w, font, pad=8)`. Stdlib only.

- [ ] **Step 3 — exit codes and output**

Findings to stdout, one per line: `CLASS | element-id | measurement | threshold`.
Exit `0` clean, `1` findings, `2` unparseable input. **`2` is not a pass.**

- [ ] **Step 4 — verify it catches what the trial found by hand**

```bash
python3 skills/wireframing-interfaces/scripts/check_geometry.py docs/design/2026-07-29-diagram-request-screen/wf-1.drawio; echo "exit=$?"
```

Expected: the marker/frame overlap reported as `element-overlap` with a measured
area, exit `1`. If it exits `0`, the checker does not detect the defect the
trial found by eye and Task 3 is not done.

---

### Task 4: Give the gate a failing branch

**Files:** both `SKILL.md`

- [ ] **Step 1 — replace the unconditional escape**

Currently *"the check ran and its findings are listed, **or** it is recorded as
not run with the reason"* — the second branch is always available and always
free, so the gate cannot fail. Replace:

> **Gate:** the checker ran (exit 0 or 1) and its findings are listed. Exit 2,
> or not running it at all, is **BLOCKED** — the source is present in every
> probe verdict, so there is no case where it cannot run.

That is what moving to the source substrate buys: the excuse disappears.

- [ ] **Step 2 — name the command in the body**, so the check is invocable
rather than described.

- [ ] **Step 3 — verify the words "did not run" no longer license a pass**

```bash
grep -c 'recorded as not run' skills/*/SKILL.md
```

Expected: `0` in both.

---

### Task 5: Widen the eval escape hatch

**Files:** both `eval/cases.jsonl`

- [ ] **Step 1** — the two legibility cases condition the honest report on
*"when no viewable form was produced"*. The trial produced one and still could
not check — a state the eval does not admit, so it scores the only honest
behaviour as the anti-pattern and teaches the agent to claim the check.

Rewrite against the new mechanism: the anti-pattern becomes *not running the
checker when the source exists*, which is always.

- [ ] **Step 2 — verify**

```bash
python3 -c "
import json
for f in ['skills/diagramming-architecture/eval/cases.jsonl','skills/wireframing-interfaces/eval/cases.jsonl']:
    n=sum(1 for l in open(f) if l.strip() and json.loads(l))
    print(f, n, 'valid')"
```

Expected: both files parse, counts unchanged.

---

### Task 6: One class list, every class emits a row

**Files:** both `references/*-set.md`

- [ ] **Step 1** — the trial's manifest reported contrast and collision,
invented "control overflow", imported a diagramming class into a wireframing
set, and dropped `clipped frame` silently — in a set whose discipline is
*"silence and absence look identical"*. That happened on run one, hand-written.

Fix the template so the three classes are identical in both skills and each
emits a row whatever its verdict.

- [ ] **Step 2 — verify the two lists match**

```bash
diff <(grep -oE '^\| (edge through a shape|element overlap|text overflow[^|]*)' skills/diagramming-architecture/references/artifact-set.md) \
     <(grep -oE '^\| (edge through a shape|element overlap|text overflow[^|]*)' skills/wireframing-interfaces/references/screen-set.md) && echo IDENTICAL
```

Expected: `IDENTICAL`.

---

### Task 7: Regenerate the trial and prove the loop closes

- [ ] **Step 1** — redraw `wf-1` with the Task 1 constraints: marker above the
frame, plain-rect inputs.

- [ ] **Step 2 — the checker must now be quiet on what it previously caught**

```bash
python3 skills/wireframing-interfaces/scripts/check_geometry.py docs/design/2026-07-29-diagram-request-screen/wf-1.drawio; echo "exit=$?"
```

Expected: `exit=0`, no `element-overlap` finding for the marker.

- [ ] **Step 3 — read the PNG** and confirm by eye that the double-text and the
marker collision are gone. The checker cannot see the stencil-drawn placeholder
(it is in neither substrate), so this step is the only proof for that defect.

- [ ] **Step 4 — amend both manifests** with a change-log row recording what was
re-run and why.

---

### Task 8: Full gate and commit

- [ ] **Step 1**

```bash
bun run validate && bun run build --strict && bun run typecheck && bun test
```

Expected: `29 OK, 0 ERR`; build exit 0 no warning; `tsc` exit 0; `99 pass, 0 fail`.

- [ ] **Step 2 — confirm the scripts installed**

```bash
ls .claude/skills/{diagramming-architecture,wireframing-interfaces}/scripts/
```

Expected: `check_geometry.py` under both.

- [ ] **Step 3 — commit**, body explaining why the substrate moved and why five
of eight classes were removed rather than implemented.

---

## Self-review

1. **Coverage** — trial defect → task: legibility mandate unbacked → T2+T3+T4;
   marker collision → T1; searchBox double-text → T1; uncontrolled `#c4c4c4` →
   T2 step 2. Review findings → task: gate cannot fail → T4; eval penalises
   honesty → T5; wrong substrate → T3; no thresholds → T2; undecidable classes →
   T2; manifest class-list leak → T6. No gap.
2. **Placeholders** — none; every command literal, every expectation stated.
3. **Consistency** — the thresholds named in T2 are the ones T3 implements and
   T2 step 4 counts.

## What this plan does not do

- It does not make the stencil-drawn `searchBox` placeholder detectable. It is
  absent from both substrates; T1 makes it unconstructible instead.
- It does not put the check in CI. `.github/workflows/ci.yml` never sees
  `docs/design/`, and the artifacts land in the *target* repo. Source-XML
  substrate makes CI *possible* later; placing it there is a separate decision.
- It does not revisit whether the two skills should exist, or the fidelity cap.
