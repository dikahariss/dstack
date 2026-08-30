# Prompt formats — stills first, then motion, then sound

**The production order is not the reading order.** A rebuild is assembled in four
stages, and the prompts are written to be consumed in that order:

| Stage | What is generated | Why it comes here |
|---|---|---|
| 1 · Stills | **Two** images per shot — a start frame and an end frame — in playback order | Cheap to iterate, and a still is the only place continuity between shots can actually be fixed. Every current generator takes a start frame and an end frame, so both are assets in their own right. |
| 2 · Motion | One silent clip per shot, interpolated between its two frames | The frames are the anchor; the prompt only describes what *moves between them*. |
| 3 · Audio | The voice-over take, plus one prompt per named sound effect | Written once against the whole script, and the effects are placed against the finished picture |
| 4 · Backsound | One music bed under everything | Never changes, so it is generated once |
| 5 · Assemble | Cut to the edit list, sync the audio, burn the captions | |

Two rules follow from that order and are not negotiable.

**Every motion prompt asks for silence.** Several engines generate audio natively,
and audio baked into a clip cannot be removed afterwards — it fights the
voice-over and the bed that stages 3 and 4 produce. So every video prompt ends
with an explicit *no audio, no dialogue, no music, no sound effects — silent
clip*. The sound the shot actually had is still recorded in `shots_deep.csv` and
still becomes a prompt; it is generated separately and laid under the picture.

**Every still after the first carries a continuity reference.** Generating
seventeen stills independently produces seventeen different people wearing
seventeen different shirts. For each bible entity a shot uses, find the most
recent earlier shot that used the same entity and name it: *the same pot as
sh0003, unchanged*. Where the engine accepts a reference image, feed that earlier
still in. Where it does not, the repeated bible description is the only anchor
there is, so it must be reproduced verbatim, not paraphrased.

---

## Prompt formats — one general shape

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

## The motion prompt — stage 2, animated from the still

```
Animate from the reference still. [Camera movement] [What moves] [Speed]
[Exit] — silent clip.
```

Built from one `shots_deep.csv` row, as flowing prose, not as labelled fields.
Where no still is being used, fall back to the full description —
`[Camera] [Subject] [Action] [Scene] [Light] [Grade] [Motion] [Exit]` — and
still end on the silence clause. Rules that decide whether it works:

1. **The motion prompt describes movement, not the scene.** The still already
   fixed the subject, the set and the light. Repeating all of it invites the
   engine to re-invent what you just approved. Say what moves, how fast, and how
   the shot ends — then ask for silence.
2. **Every `inferred` field is hedged in the prompt exactly as it is hedged in
   the data.** "A long-lens look" not "85 mm". The generator does not need the
   false precision, and a hedge is what stops a reading being laundered into a
   fact on its way to a prompt.
3. **`unknown` fields are omitted, never guessed.** An omitted field lets the
   engine choose; a guessed one makes it choose wrong with confidence.
4. **Bible references are expanded, not passed through.** `CHAR_01` means nothing
   to a generator. Substitute the bible's full description every time the
   character appears — that repetition *is* the consistency mechanism.
5. **60–120 words for a full-description prompt.** Below that the engine
   improvises; above it, directives start contradicting each other. An
   animate-from-still motion prompt is legitimately shorter — around 55–75 — for
   the same reason: the still already carries the scene, and restating it is what
   invites the engine to re-invent an approved frame.
6. **State the duration.** It decides how much action can fit, and every engine
   caps it.

## The clip-length problem — read this before generating anything

Current generators emit **4, 6 or 8 second** clips. Real short-form video cuts
much faster than that: measured on one 30.9-second source, seventeen shots
averaged 1.82 s and *not one reached 4 s*. Generating each shot at the 4-second
minimum produces 68 seconds of material for a 31-second video, and every clip
then has to be fitted.

**Do not map one detected shot to one clip.** That is the obvious move and it is
wrong: seventeen shots at the 4-second minimum is 68 seconds of generation for a
31-second video, and every clip then has to be thrown half away. Group instead.

**The unit of production is the clip, not the shot.** Divide the runtime by the
minimum clip length, then place the joins on cuts the source already had:

1. `n_clips = round(duration / 4)` — eight for a 30.9 s video.
2. For each join, take the **nearest real shot boundary** to `k × duration/n`.
   Splitting mid-shot buys nothing; a join that lands on an existing cut is a
   join the viewer was going to see anyway.
3. Each clip covers the shots between its joins, and the frame **morphs** through
   them rather than cutting. That is the trade for generating 32 s instead of 68.

**Adjacent clips share a boundary frame**, so *n* clips need *n+1* images, not
*2n*. Frame *k* is the end frame of clip *k* and the start frame of clip *k+1* —
the same file, used twice. Continuity at every join is then exact by
construction, not something a prompt has to plead for. Measured on the test
file: 9 images and 8 prompts, against 32 images and 17 prompts for the
shot-per-clip mapping that seemed natural first.

Report the fit per clip. Grouping on real boundaries lands most clips within a
few per cent of the minimum — seven of eight needed no retime at all — but say
which ones do, and by how much.

## Every image prompt opens with the same context block

A prompt that describes only its own frame produces a set that drifts, and the
drift lands on the thing that matters most: the recurring object. Measured on a
nine-image run — one product across nine frames — the pot kept its coarse fibre
in the four frames where it sat in a hand and turned into smooth moulded card in
the two frames where it appeared as a tray of many. "Match the attached image"
was the only anchor, and against a different composition the model read it as a
style hint rather than an identity.

So each image prompt is **two blocks**, and the first is identical in all of
them:

```
CONTEXT — identical for every image in this set.
Still <k> of <n> from ONE continuous <duration> <aspect> video about <subject>.
THE RECURRING OBJECT, unchanged in every image: <bible entry, verbatim>
THE LOOK, unchanged in every image: <palette, grade, camera character>
Nothing above may vary between images. <the specific properties that must hold>

THIS FRAME:
<the shot-specific prompt>
```

The context block is generated from `bible.json` — that is what the bible is
**for**, and emitting it only as a per-entity substitution wastes it. It costs
maybe sixty words per call and it is the cheapest continuity you can buy: the
reference image carries what a picture can carry, and this block carries what a
picture cannot, namely which properties are identity and which are free to
change.

Name the properties explicitly. "Same pot" is weaker than "same fibre
coarseness, same wall thickness, same moulded ring in the base" — the second
tells the model where it may not improvise.

## The image prompts — two per shot, generated first

These are the load-bearing prompts, not supporting ones. Every field except
motion, plus the aspect ratio, plus the continuity line — written **twice**:

- **Start frame** — the shot as it begins.
- **End frame** — the same prompt with `end_state` substituted for the action,
  and a line pinning everything that must not drift between the two. The end
  frame is not a new scene; it is the same frame later.

A shot whose `end_state` is `no change` needs only one image, used as both
frames. Say that rather than generating the same picture twice.

```
[Framing], [aspect]. [Subject, bible description verbatim].
[Location, bible description verbatim]. [Light]. [Palette and grade].
Continuity: same [entity] as [shot_id], unchanged — [what must not drift].
No on-screen text, no logo, no watermark.
```

The continuity line is computed, not judged: for each of the shot's bible
references, the most recent earlier shot sharing that reference is the anchor.
A shot whose entities are all new has no continuity line, and those shots are
the ones to generate first and approve hardest — everything after them inherits
whatever they establish.

Captions are **never** generated into the still. They are burned on at assembly
from `graphics.csv`, where their text and timing are already recorded; asking an
image model for text produces misspelled text at the wrong size.

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

*Video (silent)* — 4 s, static frame, flat vector motion graphic on an off-white ground. A
rounded navy card draws itself in from a single outline stroke, then fills solid.
A white club crest and wordmark resolve inside it above a white pill button
reading SUBSCRIBE. The frame holds. A cursor enters from the lower right, travels
to the button and clicks; the button flips to a yellow fill reading SUBSCRIBED,
and a bell icon beside it toggles to filled. Palette is off-white, deep navy and
gold. Real time throughout, no camera movement, no depth of field. Audio: a
single soft UI click on the button press, a short two-note notification chime on
the bell. No music. Ends on a hard cut.

Written for the four-stage order, that same shot's motion prompt drops the scene
description the still already fixed and ends with the silence clause: *Animate
from the reference still. Static frame, no camera movement. The card draws itself
in from a single outline stroke, fills solid, then the crest and wordmark resolve;
the frame holds; a cursor enters from the lower right, travels to the button and
clicks; the button flips to a yellow SUBSCRIBED state and a bell icon toggles to
filled. Real time throughout. No audio, no dialogue, no music, no sound effects —
silent clip. 4 s, 16:9.*

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
| Veo 3.1 / Lite / Fast | 4, 6 or 8 s | **yes** — described as audio-backed, so the silence clause is mandatory | start frame, end frame, reference image | Negative prompts must be phrased as what *is* there ("a landscape with no buildings"), not as "no buildings" |
| Kling | up to ~15 s; up to 6 labelled shots in one generation | varies by version | image-to-video anchors identity, layout and text | For image-to-video describe how the scene *evolves* from the still, not the whole scene again |
| Seedance 2.5 | short clips; separate Edit and Extend modes | yes | start frame, end frame, reference image | Wants playback speed as an explicit percentage, not "slow motion". Extend continues an existing clip — useful when one shot needs more than the maximum |
| Wan 2.5 | short clips | — | start frame, end frame | — |

Hosts that wrap several of these (Google Flow among them) expose one shared
control strip: **start frame, end frame, reference image**, then aspect,
resolution, duration and variant count. Set the aspect deliberately — the
default is landscape, and a 9:16 source generated at 16:9 is silently wrong in
every frame.

Where an engine caps clips shorter than a shot, the shot is split in
`assembly.csv` and each part gets its own prompt — the split is recorded there,
not hidden inside the prompt text.
