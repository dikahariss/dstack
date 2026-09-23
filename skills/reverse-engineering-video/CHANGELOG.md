# reverse-engineering-video — changelog

- **0.3.4** — 2026-09-04: branch review 2026-09-04: the length sentence agrees with Stage 6 items 6 and 8; the single-message launch rule is in the body, not only the protocol file.

- **0.3.3** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 111 words (120-word tier: the trigger list is the discovery path); quoted trigger phrases kept.

- **0.3.2** — 2026-09-04: the fan-out row says to launch every sequence agent in one message, one Agent call each (ADR-0031 rule 6).

- **0.3.1** — 2026-09-04: the editorial parenthetical inside delivery item 1 ("the count changed with the five-stage production order…") is removed; the closed-by-design declaration above the list already carries it.
- **0.3.0** — 2026-09-04: deliverable length calibrated (ADR-0031 rule 5): Opus 5 writes longer files than the task needs; one sentence scoped to the written document, never to progress text.
- **0.2.2** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.1** — Every image prompt now opens with an identical context block built
  from `bible.json`. Found by reviewing a real nine-image run: the product kept
  its coarse coir fibre in the four frames where it sat in a hand and became
  smooth moulded card in the two where the composition changed to a tray of many.
  "Match the attached image" was the only anchor, and against a different
  composition the model read it as a style hint rather than an identity. The
  bible existed and was being spent only on per-entity substitution. Budget
  3500 → 4000 to hold it alongside the 0.2.0 doctrine.

- **0.2.0** — Reworked for how the generators actually take input, after a run
  on a real file. Two stills per shot (start frame and end frame) rather than
  one; a `no change` end state means one image serves both. Every motion prompt
  ends in an explicit silence clause, because audio-backed engines bake audio in
  and it cannot be removed afterwards — it fights the voice-over and bed
  generated later. Each still after the first carries a computed continuity
  anchor naming the earlier shot that established each entity it shares.
  Package order is now the production order: stills, video, audio, backsound,
  assemble. The clip-length fit is reported per shot: short-form cuts far faster
  than any generator's 4-second minimum — on the test file no shot reached it —
  so a rebuild is 68 s of material for a 31 s video and every clip needs
  retiming or trimming — which is why shots are now **grouped into clips** at the
  generator's minimum rather than mapped one to one, with each join on a real cut
  and adjacent clips sharing a boundary frame. Measured on the test file: 9
  images and 8 prompts, against 32 and 17 for the mapping that seemed natural
  first. `audio_map.csv` became opt-in; a rebuild never reads it and it cost a
  whole decode pass. Budget 3000 → 3500: the rules above are permanent doctrine,
  and 3000 was a guess made when the skill was smaller.

- **0.1.0** — Initial. The catalog's only video skill audited short form against
  a hook-and-retention instrument, which answers "is this any good", not "how was
  this made". Detection is ffmpeg alone: 96 shots from a 232 s file in 8.4 s, and
  a detection-only pass over 60.7 minutes in 1 min 30 s. The per-shot ladder
  replaced a global rate after the frame-budget evidence showed accuracy peaking
  near 256 frames and falling past it. Threshold calibration was added when a
  fixed 0.3 found 4 cuts on a window where 0.08 found 30.
