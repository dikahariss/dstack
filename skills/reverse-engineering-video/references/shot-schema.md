# The data contract

Four tables plus one JSON document. Every Stage 3 agent writes rows in exactly
these shapes, so slices produced by different agents concatenate instead of
colliding. Read this once per session before writing a single row.

Column sets are **closed by design**: deep rows from different agents and
different runs are unioned into one table, and a run that invents a twelfth
field group is not comparable with the ones beside it. Extend by editing this
file, never mid-run. Values *within* a field are open and come from
`craft-vocabulary.md`.

---

## The evidence rule — read this before the tables

A frame shows you framing, composition, palette, action and text. It does not
show you focal length, colour temperature, or the name of a grade. Those are
**read off** the image using craft knowledge, and a reading can be wrong.

Every field belongs to one of three tiers:

| Tier | Meaning | How it may be written in the delivered prose |
|---|---|---|
| `observed` | Visible in the sampled frames. Anyone looking at the same frames would agree. | As fact. |
| `inferred` | Deduced from craft knowledge; not measurable from pixels. | Hedged whenever it carries a **figure**. "Reads as 85 mm", never "85 mm". |
| `unknown` | Not recoverable from this file. | Named as missing. Never filled with a plausible guess. |

The hedge requirement is narrower than it first looks, and deliberately so: the
danger in an `inferred` field is **false precision, and false precision is
numeric**. `85mm` and `3200K` wear the costume of a measurement a frame cannot
yield; `shallow`, `muted` and `warm low-contrast` are plainly qualitative and
cannot be mistaken for one. `validate_package.py` enforces exactly that — a
digit in an `inferred` field without a hedge fails the package.

This is not caution for its own sake. Published benchmarks put frontier
vision-language models near chance on temporal and action hallucination in
video, so a confident assertion about camera movement is exactly the output most
likely to be invented. The tier columns are what stop an invention from
travelling into a prompt as if it were a measurement.

**A `NULL` is not a zero, and an empty field is not a fact about the video.**
Leave it empty and set the tier to `unknown`.

**Check whether the shot is photographic before reading photographic properties
into it.** A 2D motion graphic, a screen recording, an animated title card and a
flat-shaded cartoon have no lens and no lamp: `lens_feel`, `focal_length_est`,
`depth_of_field`, `light_source`, `light_direction` and `colour_temp_est` are
`unknown` there, not `inferred`. This is the failure mode a model reaching for a
familiar template produces — "soft frontal key, reads as 3200 K" written about a
vector graphic, which is invention with the shape of expertise.

---

## `shots_deep.csv` — one row per shot

| Group | Fields | Tier |
|---|---|---|
| Identity | `video_id`, `shot_id`, `sequence_id`, `t_start_s`, `t_end_s` | — |
| Subject | `subject_ref`, `subject_description`, `subject_action`, `subject_position` | observed |
| Scene | `location_ref`, `time_of_day`, `weather`, `set_dressing`, `background_elements` | observed |
| Camera | `framing`, `angle`, `movement`, `movement_speed` | observed |
| Optics | `lens_feel`, `depth_of_field`, `focal_length_est` | **inferred** |
| Light | `light_source`, `light_direction`, `light_quality`, `colour_temp_est` | source/direction/quality observed; `colour_temp_est` **inferred** |
| Grade | `palette_hex`, `grade_name`, `contrast`, `saturation` | `palette_hex` observed; `grade_name` **inferred** |
| Motion | `playback_speed`, `speed_ramp` | observed |
| Audio | `speech_text`, `speech_delivery`, `sfx_diegetic`, `music_state`, `music_change` | observed |
| Exit | `transition_out`, `transition_duration_s` | observed |
| Provenance | `evidence_optics`, `evidence_light`, `evidence_grade`, `coder_agent`, `run_id` | — |

Notes that decide whether two rows can be compared:

- `subject_ref` resolves against **any** bible section — `characters`, `props`
  or `locations`. A shot's subject is often not a person: a plant on a stand, a
  press forming a pot, a room. Forcing the column into `characters` makes an
  object-led shot record an empty subject, which reads downstream as "nothing
  is on screen".
- `subject_ref` and `location_ref` are **keys into `bible.json`**, not prose.
  Write `CHAR_01`, not "the man in the grey coat". The prose lives in the bible
  once; a shot row points at it. This is what makes a character consistent
  across a hundred prompts written by ten different agents.
- `subject_description` carries only what is true **in this shot** — the pose,
  the wardrobe state, the visible damage. Anything permanent belongs in the
  bible.
- `speech_text` is verbatim or empty. A paraphrase is a fabrication with a
  plausible shape. If the audio is unintelligible, leave it empty and set
  `speech_delivery` to `unintelligible`.
- `run_id` and `coder_agent` are part of the key. Without them a second reading
  of the same video silently overwrites the first, and the disagreement between
  two readings — which is the most useful signal a second pass produces —
  disappears.
- `sequence_id` comes from Stage 2. The survey leaves it empty on purpose: a cut
  is measurable, a sequence is a reading.

---

## `bible.json` — the consistency anchor

```json
{
  "characters": {
    "CHAR_01": {
      "description": "man, late 30s, tall and lean, close-cropped dark hair",
      "wardrobe": "charcoal wool overcoat, white collarless shirt",
      "first_seen_shot": "sh0004",
      "appears_in": ["sh0004", "sh0011", "sh0032"],
      "evidence": "observed"
    }
  },
  "locations": { "LOC_01": { "description": "...", "appears_in": ["sh0004"] } },
  "props":     { "PROP_01": { "description": "...", "appears_in": ["sh0011"] } },
  "look": {
    "palette": ["#2b1d16", "#c88a4a", "#8fa3ad"],
    "grade_name": "reads as warm low-contrast with lifted blacks",
    "evidence": "inferred"
  },
  "audio_identity": {
    "music": "reads as sparse solo piano, slow, minor",
    "ambience": "interior room tone with rain outside",
    "evidence": "inferred"
  }
}
```

One description per entity, written once. When two agents describe the same
character differently, that is a **merge finding**, not something either agent
resolves alone — see `fanout-protocol.md`. Keep the rejected description in the
entry's `variants` array rather than deleting it; a disagreement about what a
character looks like is usually a disagreement about whether it is the same
character.

---

## `assembly.csv` — the edit list

Without this the package is a pile of clips nobody can reassemble.

| Field | Meaning |
|---|---|
| `order_index` | Playback position, 1-based |
| `shot_id` | Must exist in `shots_deep.csv` |
| `source_in_s`, `source_out_s` | In and out points in the original |
| `timeline_in_s` | Where it lands on the rebuilt timeline |
| `transition_in` | `cut`, `dissolve`, `fade_from_black`, `wipe`, `match_cut` |
| `transition_duration_s` | `0` for a cut |
| `audio_bed_ref` | Which music or ambience bed runs under it |

Renders two ways: a CMX 3600 EDL an NLE can import, and a plain cut sheet a
person can follow. Both name the same `shot_id`s as the prompts, so a generated
clip has exactly one place to go.

---

## `graphics.csv` — on-screen text and graphics

A rebuild without titles, lower thirds and captions is not a rebuild.

| Field | Meaning |
|---|---|
| `t_start_s`, `t_end_s` | When it is legible, not when it starts animating |
| `text` | Verbatim, including case and punctuation |
| `text_role` | `title`, `lower_third`, `caption`, `cta`, `credit`, `watermark`, `ui` |
| `position_band` | `top`, `upper_mid`, `centre`, `lower_mid`, `bottom` |
| `font_character` | What the letterforms read as — a description, never a font name unless it is genuinely identifiable |
| `animation_in`, `animation_out` | `cut`, `fade`, `slide`, `typewriter`, `scale` |
| `evidence_source` | `vision` when read from frames, `ocr` when a tool produced it |

`font_character` is `inferred` by nature. Naming a typeface from a video frame is
a guess dressed as an identification; describe the letterforms instead unless a
logotype makes it certain.

---

## Before you merge or query

1. **Stratify on `run_id` before pooling.** Two readings of one video are two
   observations, not two videos.
2. **Never average a tier.** An `inferred` field and an `observed` field of the
   same name are different measurements. Filter, do not blend.
3. **Report `n`.** A pattern across four shots is an anecdote.
4. **A field that is empty in half the rows is a coverage problem**, not a
   finding about the video. Check `limitations.txt` before reading meaning into
   an absence.
