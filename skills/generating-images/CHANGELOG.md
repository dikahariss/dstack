# generating-images — changelog

- **0.5.2** — 2026-09-04: branch review 2026-09-04: the body states the script's engine default and that the codex rows need it passed explicitly.

- **0.5.1** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 94 words (120-word tier: the trigger list is the discovery path); quoted trigger phrases kept.

- **0.5.0** — 2026-09-04: the gate says six rows and has six: the rendered-image check (`low_detail` / `bytes_per_pixel`, emitted by the script since 0.4.0) is now in the body and the JSON example; the parallel-generation row states what is measured (chains are serial by construction; independent images unmeasured); the ceiling table is labelled observed-per-run; the `--ref` example runs on codex, the engine the measurements favour; the two laws are sentence case.
- **0.4.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.0** — Budget 4000 → 4500: three measured failure modes joined the gate
  in one session and each has to state its evidence to survive being argued away.
  **An agent asked for an image may write code to draw one.** Asked
  for photorealistic frames with no reference attached, `agy` returned flat
  two-colour swatches and a flat-polygon vector illustration — real PNGs, correct
  headers, unique files, produced without its image model ever running, and every
  check in the gate passed. Nine such calls yielded zero usable photographs. The
  prompt now names the built-in tool and forbids drawing with code; the script
  reports `bytes_per_pixel` and flags `low_detail` under 0.5 (nine photographs
  measured 1.18–1.99, four code-drawn files 0.005–0.063). A new gate row says
  what no automation can: **look at the image** — one detailed vector drawing
  scored 1.90 and would have passed the signal. Also stops leaving a failed copy
  on disk: agy returned the path of its own `output.txt`, and the text file was
  written to the output path before the header read rejected it.

- **0.3.0** — A generator can return a file instead of making one: `agy` handed
  back a byte-identical copy of an earlier `codex` output sitting in its
  workspace, reported `SUCCESS`, and passed the whole gate. The script now hashes
  the result against every reference, the reference directory and the output
  directory. Measured across nine reference-carrying agy calls: 3 new images, 3
  that returned the reference, 3 `SUCCESS` with an empty path. Clearing the
  workspace does not fix it — a control run holding only the reference returned
  it. codex returned nine unique images on the same prompts, so the
  hold-a-subject-across-calls row points at codex.

- **0.2.x** — Reference images work on **both** engines: `codex exec` takes
  `-i <FILE>`, which 0.1.0 had missed because its "not measured" line was about
  *editing* a file, a different question. `--ref` passes one on either engine.
  Verified with a three-image chain — one product held across a nursery, a
  garden bed and a workshop. Adds the chaining section: the reference carries
  the subject, not the scene. Also fixed the copy-out guard, which checked
  `exists()` where it meant `is_file()` and so died inside `copy2` on a reported
  path of `"."`.

- **0.1.0** — Initial. Written after measuring both CLI routes on one machine:
  neither honours a requested size, both self-report dimensions they did not
  measure, and shipped code was found hardcoding `1080×1920` onto files that
  were 768×1376. `scripts/generate_image.py` exists so that the copy-out and
  the header read cannot be skipped, and it reads dimensions from the file's
  own bytes rather than depending on ImageMagick or Pillow being installed.
