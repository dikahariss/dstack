---
name: generating-images
description: >
  Use when an image has to be created rather than found — a scene no stock
  library holds, a placeholder asset, a cover, a mockup photo — and the machine
  has an agent CLI that can draw one. Covers which engine to send the request
  to, the structured-output contract that returns a real path, the pixel
  verification that stops a false claim, and the resolution ceiling a caller
  must be told about. Not for charts (`/dataviz`), diagrams
  (`/diagramming-architecture`), or screen layouts (`/wireframing-interfaces`).
  Triggers: "generate an image", "buatkan gambar", "bikin ilustrasi", "make me
  a picture", "AI image", "text to image", "imagegen", "image_gen", "nano
  banana", "gpt-image", "generate a cover", "generate a thumbnail",
  "placeholder photo", "generate stills for a video".
allowed-tools: Read Write Edit Bash Glob
metadata:
  dstack:
    version: 0.2.1
    type: hybrid
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4000
    triggers:
      - generating images
      - generate an image
      - buatkan gambar
      - bikin ilustrasi
      - text to image
      - imagegen
      - nano banana
      - gpt-image
      - generate a cover image
      - placeholder photo
---
# /generating-images

An agent CLI you already pay for can draw. It cannot draw at the size you ask
for, and it will tell you dimensions it did not measure.

```
MEASURE THE FILE ON DISK. NEVER REPORT A SIZE THE AGENT REPORTED.
COPY THE ASSET OUT OF THE CLI'S OWN STATE DIRECTORY.
```

Both laws come from the same place: the generator writes into its own cache
under a name it chose, and every one of these agents self-reports dimensions by
guessing or by shelling out to a tool that may not be there.

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| A chart, a plot, anything with data behind it | `/dataviz` |
| Architecture, ERD, C4, sequence, BPMN | `/diagramming-architecture`, `/modelling-system-behaviour` |
| A screen, a form, a layout | `/wireframing-interfaces` |
| A photograph that exists in the world | a stock library — search before you generate |
| An icon, logo, or anything that must scale | SVG by hand; a raster generator cannot be re-sized later |

Generation is the answer only when nothing can be found and nothing can be
drawn deterministically. It is slow (30–120 s), it is quota, and what comes
back is not what you asked for.

## Stage 0 — Probe, do not assume

Never run a generator you have not confirmed. One line:

```bash
for c in codex agy; do command -v "$c" >/dev/null && echo "$c: present"; done
```

Absent binary, or a login that has expired → say so and stop. A run that
silently produces nothing while reporting success is the failure this stage
exists to prevent. See `references/engines.md` for how each engine is
authenticated and what its absence looks like.

## Stage 1 — Choose the engine on intent

This is the judgment surface. There is no fallback chain: picking whichever
engine answers first silently prefers a worse image.

| The request | Engine | Why |
|---|---|---|
| A single still, highest fidelity available, lossless | `codex` | ~1.57 MP PNG; no observed text leakage |
| An unusual composition that must hold exactly — a split frame, a hard seam | `codex` | reproduces a stacked two-panel frame literally; agy resolves it into one continuous scene |
| A subject with strong local or cultural specificity | `agy` | markedly better world knowledge of place, dress, objects |
| A series where turnaround matters | `agy` | ~34 s against codex's ~95 s on the same prompts |
| A shot that must match an earlier image — same person, same room | either; `agy` by default | both take a reference: `agy` adds its directory to the workspace, `codex` attaches it with `-i`. Chain them — each image generated with the previous one attached |
| Anything with legible text rendered *in* the image | neither by default | both leak or mangle lettering; see `references/engines.md` |

Not exhaustive — these are the axes that have been measured. When two rows
apply, fidelity loses to consistency: a sharp shot that breaks continuity is
the more expensive mistake.

## Stage 2 — Call it through the script

`scripts/generate_image.py` is the whole spine: it enforces the JSON-schema
contract, copies the file out of the CLI's cache, and reads the real dimensions
out of the image header. Standard library only, no image package needed.

```bash
python3 "<skill_dir>/scripts/generate_image.py" \
  --engine codex --prompt-file prompt.txt --out assets/harbour.png

python3 "<skill_dir>/scripts/generate_image.py" \
  --prompt-file prompt.txt --out assets/shot-02.png \
  --ref assets/shot-01.png     # both engines; repeatable. agy is the default
```

One JSON object on stdout, and it is the only thing you may quote:

```json
{"engine":"codex","out":"assets/harbour.png",
 "reported":{"width":941,"height":1672},"actual":{"width":941,"height":1672},
 "matched":true,"format":"png","seconds":76.6}
```

`actual` comes from the file's own header. `matched: false` is information, not
an error — it means the agent's self-report was wrong, which is exactly what
this field exists to catch. Exit 3 means the engine is not installed.

The raw commands each engine needs, and why every flag is load-bearing, are in
`references/engines.md` — read that before driving an engine by hand.

## Stage 3 — The gate

No asset is delivered until all four hold. Closed by design: each row is a
failure that has actually shipped.

| # | Check | How |
|---|---|---|
| 1 | The script exited 0 | a non-zero exit means there is no asset, whatever the log said. **In a batch, check every call, not the last one** — one run had two of six fail while the tail of the log looked healthy |
| 2 | The size you quote is `actual`, never `reported` | straight from the JSON |
| 3 | The asset lives in the project, not the CLI's cache | the script's `--out` did this; confirm the path |
| 4 | The caller is told the real size **and** the ceiling | in the reply |

Row 2 holds even when `matched` is true. The next run is when it will not be.

## Chaining, when a series must hold together

Generate serially and attach the previous image to the next call. The reference
carries the subject, not the scene: it holds a product, a person or a palette
across a change of location, and the prompt still has to describe the new
location in full. Say in the prompt *what* must match — "the same pot, same
fibre texture" — because "match the attached image" alone is read as a style
note.

Verified 2026-08-30 on codex: three images, each generated with the previous
attached, held one product across a nursery, a garden bed and a workshop.

## Stage 4 — State the ceiling

Neither engine accepts a size. Asking for one changes nothing: a request for
`2160x3840`, quoting the tool's own validity rules, came back at the same size
as a request that named none.

| | Pixels | Share of a 1080×1920 frame |
|---|---|---|
| codex | 941×1672 | 76% |
| agy | 768×1376 | 51% |

So a generated still cannot carry a full-screen vertical frame, and upscaling
does not recover detail that was never captured. Say this to the caller when
the target is video or print. If they need true 4K, `references/engines.md`
carries the metered API routes and their per-image prices — that is an
explicit, paid decision, never a silent default.

## The prompt

One labelled block. Labels beat prose: they survive the agent's own rewriting
of your text into its tool call.

```
Generate exactly ONE image.

Use case: photorealistic-natural
Subject: a fisherman mending a net on a wooden boat at dawn
Scene/backdrop: small harbour, soft golden light, mist on the water
Style/medium: candid documentary photography, 35mm, shallow depth of field
Composition/framing: vertical 9:16, subject lower two thirds, clean headroom
Constraints: no text, no logo, no watermark, realistic hands, natural skin

Report the absolute path of the saved file and its real pixel dimensions.
Do not move or copy the file.
```

`Constraints: no text` earns its line — without it the generator invents
lettering that reads as broken signage and ruins the shot. It is advisory, not
enforced: check the result. The final two lines keep the file where the schema
says it is, so your copy step is the only thing that moves it.

## Common mistakes

Not exhaustive — the shape to watch for is *trusting a number nobody measured*.

| Mistake | Why it bites |
|---|---|
| Hardcoding the expected size into the returned metadata | Real code shipped `"width": 1080, "height": 1920` on a cache hit while the files on disk were 768×1376. Every consumer downstream then planned around a frame that did not exist. |
| Defaulting a missing dimension to the target size | Same failure, one line later. A missing dimension means the call failed; it does not mean the image is perfect. |
| Try engine A, fall back to engine B | Ordering is not intent. The faster engine is the lower-resolution one. |
| Leaving the asset in `$CODEX_HOME` or the agy brain directory | A production dependency on a cache nobody prunes. |
| Parsing the path out of stdout | Agent logs are interleaved with the answer, and the format changes between versions. |
| Generating in parallel to save time | Neither subscription's rate limit has been measured. Serial, 30–120 s each. |

## Where judgment takes over

The spine fixes the probe, the schema, the gate and the disclosure. **Yours** is
deciding whether an image should be generated at all rather than found or
drawn, which engine the subject actually calls for, and how much of the scene
to specify before the prompt stops describing and starts over-constraining.

See `references/engines.md` for per-engine measurements, authentication, output
locations, failure modes, and the paid escalation routes.

## Changes

- **0.2.1** — The copy-out step checked `exists()` where it meant `is_file()`.
  An engine that reports `"."` as its path passes `exists()`, and the script
  then died inside `copy2` with a raw `IsADirectoryError` traceback — the
  silent-failure shape this script exists to prevent, reached by a different
  door. Observed twice in one six-image agy batch, alongside one
  `no structured_output`. Both failure modes recorded, and the gate now says to
  check every call in a batch rather than the last one.

- **0.2.0** — Reference images work on **both** engines, and `agy` is now the
  default. `codex exec` takes `-i <FILE>`, which the 0.1.0 reference had not
  found: its "not measured" line was about *editing* a file on disk, a different
  question, and the gap read as "codex cannot do continuity". Verified with a
  three-image chain, each generated with the previous attached — one product
  held across a nursery, a garden bed and a workshop. `--ref` replaces the
  agy-only `--ref-dir` as the way to pass one; `--ref-dir` stays for a whole
  directory. Adds the chaining section: the reference carries the subject, not
  the scene, so the prompt must still describe the new location in full and must
  name what has to match.

- **0.1.0** — Initial. Written after measuring both CLI routes on one machine:
  neither honours a requested size, both self-report dimensions they did not
  measure, and shipped code was found hardcoding `1080×1920` onto files that
  were 768×1376. `scripts/generate_image.py` exists so that the copy-out and
  the header read cannot be skipped, and it reads dimensions from the file's
  own bytes rather than depending on ImageMagick or Pillow being installed.
