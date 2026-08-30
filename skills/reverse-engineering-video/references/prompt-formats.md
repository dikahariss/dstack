# Prompt formats — one general shape, five outputs

The engines disagree about syntax and agree about substance. Every published
formula asks for the same things in a different order, so this skill writes **one
detailed prompt per shot** and keeps the engine differences as a notes table
rather than as adapters. A new engine next quarter costs a row in that table, not
a rewrite of the analysis.

The published formulas, retrieved 2026-08-30, and what the union of them covers:

| Engine | Its formula | What it adds to the union |
|---|---|---|
| Veo 3.1 | `[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]` | Camera first; audio as separate sentences; negative prompts written as positive absences |
| Kling | `Subject (description) + Subject Movement + Scene (description) + (Camera Language + Lighting + Atmosphere)` | Subject first; lighting and atmosphere bracketed together |
| Seedance-family | Header block, then one paragraph per shot, `SFX:` and `Music:` on every shot | Reference-image anchoring; playback speed as an explicit percentage |

Nothing in any of them is absent from the general order below.

---

## The general video prompt

```
[Camera] [Subject] [Subject action] [Scene] [Light] [Grade] [Motion] [Audio] [Exit]
```

Built directly from one `shots_deep.csv` row, in that order, as flowing prose —
not as labelled fields. Rules that decide whether it works:

1. **Every `inferred` field is hedged in the prompt exactly as it is hedged in
   the data.** "A long-lens look" not "85 mm". The generator does not need the
   false precision, and a hedge is what stops a reading being laundered into a
   fact on its way to a prompt.
2. **`unknown` fields are omitted, never guessed.** An omitted field lets the
   engine choose; a guessed one makes it choose wrong with confidence.
3. **Bible references are expanded, not passed through.** `CHAR_01` means nothing
   to a generator. Substitute the bible's full description every time the
   character appears — that repetition *is* the consistency mechanism.
4. **60–120 words.** Below that the engine improvises; above it, directives start
   contradicting each other.
5. **State the duration.** It decides how much action can fit, and every engine
   caps it.

## The image prompt — first frame or reference still

Same fields minus motion, plus the aspect ratio and an explicit statement of
what must stay fixed for later shots. Used two ways: to generate a reference
still that anchors an image-to-video generation, and to rebuild a graphic or
title card that no video engine should be asked to animate from scratch.

Hand rendering to `/generating-images`; do not invent a rendering path here.

## The speech prompt

```
Line:      <verbatim, or empty>
Delivery:  <pace, volume, emotional state, accent if identifiable>
Type:      sync dialogue | voice-over | crowd | unintelligible
Placement: <t_start_s in the shot>
```

Empty means the shot has no speech. `unintelligible` means there is speech that
could not be transcribed — a different fact, and the prompt must say which.

## The sound-effects prompt

One prompt per named diegetic sound, never a list in one prompt:

```
Sound:     <what makes it, not what it sounds like>
Duration:  <seconds>
Placement: <t offset within the shot>
Character: <sharp/dull, close/distant, wet/dry, single/repeating>
```

"What makes it" matters: *a heavy wooden door closing on a stone floor*
generates better than *a thud*.

## The music / backsound prompt

Four to seven descriptors, in this order — fewer leaves the generator too much
latitude, more sets directives fighting each other:

```
[Genre/subgenre], [tempo or energy], [key instruments], [vocal treatment],
[production quality], [mood]
```

Then a structure map, as bracketed section tags in the order they occur, with an
explicit terminator so the track does not trail off:

```
[Intro] [Verse] [Chorus] [Bridge] [Outro] [End]
```

For a bed under dialogue, add `instrumental`, `no vocals`, `seamless loop`,
`no fade`. For a hard landing on a cut, ask for a button ending.

Take the descriptors from `bible.json.audio_identity`, which is `inferred` — a
music bed's genre is a reading of a mix, so hedge it and say so.

---

## Worked example — a real shot from this pipeline

Source: a 232 s file, surveyed at `--threshold 0.3` → 96 shots. Shot `sh0000`,
`0.000–3.960 s`, sampled at 4 fps for 16 frames.

**What the sheet shows, frame by frame:** an outline drawing itself in (0.12 s),
a SUBSCRIBE button appearing (0.37 s), the card filling navy (0.62 s), a club
name and crest resolving (0.87 s), the frame holding while a cursor travels in
(1.12–1.86 s), a click (2.10 s), the button flipping to SUBSCRIBED in yellow
(2.35 s), then a bell toggling (2.60–3.84 s).

**Why the rate is the point.** At 1 fps this shot samples at 0, 1, 2 and 3
seconds: an outline, a static card, a static card, a subscribed card. The cursor
travel and the click — the entire content of the shot — fall between samples. At
4 fps the interaction is legible. This is what the ladder in `survey_video.py` is
buying.

**The row** (abbreviated; empty fields are `unknown`, not omitted by accident):

| Field | Value |
|---|---|
| `framing` | full-frame graphic, card centred, ~35% of frame width |
| `angle` | flat / no perspective |
| `movement` | static |
| `lens_feel`, `focal_length_est`, `depth_of_field` | *(empty)* |
| `evidence_optics` | `unknown` |
| `light_source`, `light_direction`, `colour_temp_est` | *(empty)* |
| `evidence_light` | `unknown` |
| `palette_hex` | `#f2f2f2;#1a2a6c;#f5d76e` |
| `grade_name` | flat vector, no grade |
| `evidence_grade` | `observed` |
| `playback_speed` | real time |
| `sfx_diegetic` | UI click at 2.10 s; notification chime at 2.60 s |
| `music_state` | absent |
| `transition_out` | cut |

**A 2D graphic has no optics and no lighting.** Those fields are `unknown`, not
`inferred` — there is no lens to read and no lamp to place. Writing "soft
frontal key, reads as 3200 K" here would be pure invention, and it is exactly the
invention a model reaching for a familiar template produces. Check whether the
shot is photographic before reading photographic properties into it.

**Rendered prompts:**

*Video* — 4 s, static frame, flat vector motion graphic on an off-white ground. A
rounded navy card draws itself in from a single outline stroke, then fills solid.
A white club crest and wordmark resolve inside it above a white pill button
reading SUBSCRIBE. The frame holds. A cursor enters from the lower right, travels
to the button and clicks; the button flips to a yellow fill reading SUBSCRIBED,
and a bell icon beside it toggles to filled. Palette is off-white, deep navy and
gold. Real time throughout, no camera movement, no depth of field. Audio: a
single soft UI click on the button press, a short two-note notification chime on
the bell. No music. Ends on a hard cut.

*Image (first frame)* — Flat vector graphic, 16:9, off-white background, a single
thin navy rounded-rectangle outline centred at about 35% of frame width, no fill,
no text, no shadow. Palette `#f2f2f2` ground, `#1a2a6c` stroke.

*Speech* — none. `Type: none`.

*SFX* — (1) Sound: a soft mechanical mouse-button click. Duration: 0.1 s.
Placement: 2.10 s. Character: sharp, close, dry, single. (2) Sound: a short
two-note digital notification chime. Duration: 0.5 s. Placement: 2.60 s.
Character: bright, close, dry, single.

*Music* — none in this shot. `music_state=absent`.

---

## Engine notes — what actually differs

Retrieved 2026-08-30. This table is **open**: it goes stale on the engines'
schedule, not this skill's, so re-check before relying on a number.

| Engine | Clip length | Native audio | Reference inputs | Quirk worth knowing |
|---|---|---|---|---|
| Veo 3.1 | 4, 6 or 8 s | yes | reference images for scene, character, object, style | Negative prompts must be phrased as what *is* there ("a landscape with no buildings"), not as "no buildings" |
| Kling | up to ~15 s; up to 6 labelled shots in one generation | varies by version | image-to-video anchors identity, layout and text | For image-to-video describe how the scene *evolves* from the still, not the whole scene again |
| Seedance-family | short clips, multi-shot header format | yes | accepts multiple images plus clips and audio | Wants playback speed as an explicit percentage, not "slow motion" |

Where an engine caps clips shorter than a shot, the shot is split in
`assembly.csv` and each part gets its own prompt — the split is recorded there,
not hidden inside the prompt text.
