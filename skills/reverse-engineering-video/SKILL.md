---
name: reverse-engineering-video
description: >
  Use when a video FILE has to be taken apart and rebuilt as generation
  prompts — a shot-by-shot breakdown plus ready-to-run prompts for video,
  image, speech, sound effects and music, with an edit list that puts the
  clips back in order. Handles long files, not only short form: shots are
  detected first, read densely inside each shot, and fanned out across
  parallel agents. Not for judging whether a video is any good (that is
  /auditing-video) and not for a platform URL — this reads local files.
  Triggers: "reverse engineer this video", "recreate this video", "break
  this video into shots", "video to prompt", "shot list from a video",
  "how was this video made", "scene breakdown", "storyboard from footage",
  "make a prompt from this video", "analyse the cinematography".
allowed-tools: Read Write Edit Bash Glob Grep Agent
metadata:
  dstack:
    version: 0.2.1
    type: hybrid
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4000
    triggers:
      - reverse engineer video
      - video to prompt
      - recreate this video
      - shot breakdown
      - scene breakdown from video
---

# Reverse-engineering a video

Turn a video file into a package someone can rebuild from: a **shot bible**, a
**deep row per shot**, an **edit list**, an **on-screen-text table**, and
**generation prompts** for video, image, speech, sound effects and music.

**Core principle — the sampling rate is per shot, never global.** At 1 fps a
dolly-in and a cut look identical. At the 3–5 fps needed to read movement, a
20-minute file produces thousands of frames, past the point where measured
accuracy against frame count stops rising. So: detect shots first, spend frames
inside them, and divide the file across agents when the budget says to.

**The honesty rule.** A frame shows framing, action, palette and text. It does
not show focal length, colour temperature, or the name of a grade — those are
*read off* the image and can be wrong. Every optics, light and grade field
carries an evidence tier, and an `inferred` reading stays hedged all the way into
the prompt. Detail is what a confabulating model produces most of; the tier is
what stops it travelling as fact.

## Step 0 — Gate

1. **A local file.** Given a platform URL, say so and ask for the file.
   Downloading from a platform is out of scope.
2. **You must be able to view images.** Every stage past the survey rests on
   reading contact sheets. If you cannot, stop and say so — never write shot
   rows from a CSV alone. Fluent, plausible, unfounded rows are indistinguishable
   from real ones once merged.
3. **Rights, before generating anything.** Reading a video's *grammar* — shot
   sizes, movement, pacing, grade — is reading style. Reproducing a specific
   sequence with its characters and beats is reproducing expression, and that is
   where similarity claims live. Ask what the package is for, and after Stage 1
   name every recognizable person, brand, logo, character and piece of
   third-party work the survey found, so the decision is made with the list in
   view. This is not legal advice; it is the list nobody assembles afterwards.
4. **Ask, briefly, once:** what they are rebuilding and why; which engines they
   will generate with; whether the whole file matters or a range; and whether
   any character or location must stay consistent across shots. Four questions.
   Without them the deep pass optimises for the wrong thing.
5. **Prerequisites:** `ffmpeg`/`ffprobe` on PATH, and
   `pip install -r <skill_dir>/scripts/requirements.txt`.

## Stage 1 — Survey the whole file

```bash
python3 "<skill_dir>/scripts/survey_video.py" "<video>" "<work_dir>"
```

Then **read three files before anything else**:

- `calibration.txt` — shot count and mean shot length at seven thresholds.
  **No single threshold serves all content.** On one 300 s sample, 0.30 found 4
  cuts and 0.08 found 30. Pick a row and re-run with `--threshold <value>`;
  detection is cached, so changing it costs no decoding.
- `limitations.txt` — what did not run, and whether the mean shot length is
  suspicious.
- `budget.txt` — total planned frames and the agent count they imply.

Add `--no-sheets --no-audio-map` for a detection-only pass while calibrating.

## Stage 2 — Structure, from the survey sheets

View every image in `<work_dir>/survey_sheets/`. Then write, in the user's
language:

1. **What the video literally is** — concrete nouns. Who, where, what happens,
   how it ends.
2. **The tree** — group shots into scenes (one location and continuous time),
   scenes into sequences (one dramatic unit). Fill `sequence_id` in `shots.csv`.
   The survey left it empty on purpose: a cut is measurable, a sequence is a
   reading, and only you can make it.
3. **The rights list** from Step 0.3.
4. **Which shots earn a deep pass** — all of them, a range, or the N that carry
   the piece. Say what you are leaving out.

## Stage 3 — Deep-read the shots

Read `references/fanout-protocol.md`. Below 400 planned frames, read them
yourself; above it, one agent per sequence.

```bash
python3 "<skill_dir>/scripts/extract_shots.py" "<video>" "<work_dir>" --shots 0-49
```

It refuses a slice over the cap rather than truncating it. Give each agent one
shot of overlap on each side — two readings of the same shot are the cheapest
disagreement signal in the pipeline.

Rows follow `references/shot-schema.md`; terms come from
`references/craft-vocabulary.md`, which maps *frame to term* rather than
intention to choice, because this skill reads finished footage.

## Stage 4 — Merge

Three things fan-out breaks that a single reader keeps for free: a character
described differently in two slices, a location renamed at a boundary, a grade
read differently from different frames. Check the overlapping rows first. Resolve
into `bible.json`, keeping the losing description in `variants` rather than
deleting it — a disagreement about what a character looks like is usually a
disagreement about whether it is the same character.

Never resolve by picking the more detailed answer.

## Stage 5 — Render the package

Per `references/prompt-formats.md`. One general prompt shape carries the union of
the published engine formulas; the differences are a notes table, not adapters.

**The package is ordered for production, in five stages:** (1) one still per
**join** — *n+1* images for *n* clips, each serving as the end of one clip and
the start of the next; (2) a **silent** motion prompt per clip, interpolated
between its two frames; (3) one voice-over script and one prompt per sound
effect; (4) one music bed; (5) the assembly — `assembly.csv` plus `graphics.csv`
for the captions burned on at the end.

**Group shots into clips before writing a single prompt.** Generators emit 4, 6
or 8 second clips and short-form cuts far faster — on one 30.9 s source no shot
reached 4 s. One clip per shot is the obvious mapping and it is wrong: it costs
68 s of generation for a 31 s video. Divide the runtime by the minimum clip
length, put each join on the nearest real cut, and let the frame morph through
the shots inside a clip. Adjacent clips **share** a boundary frame, so continuity
at every join is exact by construction. Measured: 9 images and 8 prompts, against
32 and 17 for the shot-per-clip mapping.

**Every motion prompt asks for silence.** Engines that generate audio natively
bake it in, and baked-in audio cannot be removed — it fights the voice-over and
bed that stages 3 and 4 produce. The shot's real sound is still recorded and
still becomes its own prompt; it is laid under the picture at assembly.

**Stills are generated before anything is animated,** because a still is the only
place continuity between shots can be fixed cheaply. Seventeen independently
generated stills give seventeen different people in seventeen different shirts.

**Every image prompt opens with an identical context block** from `bible.json`:
the recurring object verbatim, the look, and the named properties that may not
vary. Without it a set drifts on the thing that matters — measured, one product
kept its coarse fibre in a hand and became smooth card once the composition
changed.

```bash
python3 "<skill_dir>/scripts/validate_package.py" "<work_dir>"
```

It fails on an `inferred` field stated as fact, a bible key nothing defines, an
assembly row naming a shot that does not exist, a shot with no prompt, and a row
missing `run_id`. **Do not deliver on a failing package.**

## Stage 6 — Deliver

Flowing prose, in the user's language, in this order — closed by design (limits
before output, structure before prompts); append sections rather than reordering:

1. **What this could and could not recover** — `limitations.txt`, the threshold
   chosen and why, and every `unknown` field group.
   (The order below is closed at nine; the count changed with the five-stage
   production order and would change again only for another such reason.)
2. **What the video is** — and its structure.
3. **The rights list** — recognizable people, brands, works.
4. **The bible** — characters, locations, look, audio identity.
5. **The stills** — one per join, in playback order, each labelled with the two
   clips it serves. This is what gets generated and approved first.
6. **The motion** — the silent prompt per clip, with the shots it covers, its
   two frames, and its fit verdict.
7. **The sound** — the voice-over script, then the sound effects, then the bed.
8. **The assembly** — the edit list and the on-screen text.
9. **What to generate first** — the shot whose entities are all new, since
   everything after it inherits what it establishes.

## What this cannot recover

Closed by design — these are properties of the medium, not gaps to fill later:
the lens and lighting *equipment*; what was cut; anything a dissolve shorter than
the sampling interval did; the original audio stems once mixed; intent. A shot
that reads as one choice may have been a compromise.

## Where judgment takes over

The spine fixes detection, sampling, budgets, schema and validation. **Yours** is
where the scene and sequence boundaries fall, which shots deserve a deep pass at
all, and — at merge — whether two differing descriptions are one entity read
twice or two entities read once.

## Changes

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
