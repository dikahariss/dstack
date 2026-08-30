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
    version: 0.1.0
    type: hybrid
    side_effects: local
    agency: deliberative
    context_budget_tokens: 3000
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

**The package is ordered for production, in five stages:** (1) a still per shot,
each carrying a computed continuity reference to the earlier still that
established each entity it shares; (2) a **silent** motion prompt per shot,
animated from that still; (3) one voice-over script; (4) one music bed; (5) the
assembly — `assembly.csv` plus `graphics.csv` for the captions burned on at the
end.

**Every motion prompt asks for silence.** Engines that generate audio natively
bake it in, and baked-in audio cannot be removed — it fights the voice-over and
bed that stages 3 and 4 produce. The shot's real sound is still recorded and
still becomes its own prompt; it is laid under the picture at assembly.

**Stills are generated before anything is animated,** because a still is the only
place continuity between shots can be fixed cheaply. Seventeen independently
generated stills give seventeen different people in seventeen different shirts.

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
5. **The stills** — every image prompt in playback order, each with its
   continuity reference. This is what gets generated and approved first.
6. **The motion** — the silent clip prompt per shot.
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

- **0.1.0** — Initial. Written because the catalog's only video skill audited
  short form against a hook-and-retention instrument, which answers "is this any
  good" and not "how was this made". Detection uses ffmpeg alone (PySceneDetect
  optional): measured 96 shots from a 232 s file in 8.4 s, and a detection-only
  pass over a 60.7-minute file in 1 min 30 s. The per-shot sampling ladder
  replaces a global rate after the frame-budget evidence showed accuracy rising
  to ~256 frames and falling past it, while high frame rates bought fine motion
  rather than comprehension. Threshold calibration was added when a fixed 0.3
  returned 4 cuts on a window where 0.08 returned 30.
