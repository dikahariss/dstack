# Fan-out protocol — how a long video is divided and put back together

A 20-minute video is not a long short video. It is a file whose frame budget
exceeds any single context, and the whole architecture exists to divide it
without losing the things that only a single reader would have kept for free.

---

## The budget arithmetic, and the evidence under it

| Finding | Figure | Source |
|---|---|---|
| Uniform-FPS sampling beat adaptive alternatives on long video | best on VideoMME across every model tested | *Frame Sampling Strategies Matter*, arXiv 2509.14769 |
| Accuracy against frame count | rises sharply 16 → 256 frames, peaks around 62% at 256, **falls** at 600 | same |
| High frame rate buys fine motion, not general comprehension | 16 fps gave +1.7 pp on general VideoMME but +15.6 pp on gymnastics and +10.5 pp on diving | *F-16*, arXiv 2503.13956 |
| Shot-aware budgeting beats flat sampling at the same cost | 84.7% vs 11.8% frame recall at 0.5 fps; parity on Video-MME | *InfoShot*, arXiv 2603.17374 |

Together they say one thing: **spend frames where the shots are, and stop before
the budget grows past the point where accuracy stops rising.**

Measured on this pipeline: a 232 s source held 96 shots at `--threshold 0.3`, a
2.42 s mean, and planned 908 frames — 3 agents. A 3 642 s source held 46 shots at
the same threshold (genuine long-take material; the calibration table confirmed
it, since even a 0.05 floor gave a 15.4 s mean) and planned 1 221 frames — 4
agents. Density, not duration, decides the agent count.

**The cap is 400 frames per agent.** `budget.txt` prints the projection before
Stage 3, so the split comes from a number rather than a guess, and
`extract_shots.py` exits 2 on an over-budget slice rather than truncating it.

---

## When to fan out at all

| Situation | What to do |
|---|---|
| `total_frames_planned` ≤ 400 | One pass. No agents. The coordination cost buys nothing. |
| 400 < total, and sequences are known | One agent per sequence; split any sequence over the cap |
| 400 < total, sequences not yet known | Run Stage 2 first. Slicing on a budget boundary cuts scenes in half, and a scene split across two agents is described twice and differently. |
| The user asked for a time range or the top N shots only | Deep-read only those. A full survey is cheap; a full deep pass is not. |

Not exhaustive — the rule underneath is that a slice should be something a reader
could describe coherently on its own.

---

## What each agent receives

Construct it explicitly. An agent must never inherit the coordinating session's
history: it needs exactly this and nothing else.

```
You are reading shots <A> through <B> of a video someone wants to rebuild.

Read first:
  <skill_dir>/references/shot-schema.md      the column contract
  <skill_dir>/references/craft-vocabulary.md what each term means in a frame

Your material:
  <survey>/shots.csv                 rows <A>-<B> only
  <survey>/shots/<shot_id>/sheet.jpg one per shot — VIEW EVERY ONE
  <survey>/shots/<shot_id>/audio.wav one per shot
  <survey>/bible.json                the current bible, READ ONLY
  <survey>/shots/slice_<A>-<B>.json  your manifest

Return:
  shots_deep.csv rows for exactly the shot_ids in your manifest — no others
  graphics.csv rows for on-screen text inside your range
  bible_proposals.json for any entity you could not match to an existing entry

Rules:
  - Set the evidence tier on every optics, light and grade field. `inferred`
    is not a weaker `observed`; it is a different claim.
  - A 2D graphic or screen recording has no lens and no lamp. Those fields are
    `unknown`, not `inferred`.
  - Use bible keys (CHAR_01, LOC_01) in subject_ref and location_ref. Never
    invent a key; propose it in bible_proposals.json instead.
  - Never edit bible.json. A description that disagrees with it is a finding.
  - speech_text is verbatim or empty. A paraphrase is a fabrication.
  - Stamp coder_agent and run_id on every row.
```

The single most important line is *view every sheet*. An agent that reasons from
the CSV alone produces fluent, plausible, unfounded rows — and they are
indistinguishable from real ones once merged.

---

## Merge — the three things fan-out breaks

A single reader gets continuity for free. Ten readers do not. Each of these is a
named check at merge, not something an agent resolves alone.

| Break | How it shows | Resolution |
|---|---|---|
| **Character drift** | Two slices describe the same person differently — "grey overcoat" and "black jacket" | Compare against the frames both cite. If both readings are defensible, it is probably two characters, not one description; split the key. Keep the loser in `variants`. |
| **Location renaming** | A location gets a new key at a slice boundary because the agent never saw the earlier shot | Match on set dressing and palette, not on the agent's description. Merge keys, record the merge. |
| **Grade drift** | Two agents read the same look differently from different frames | `palette_hex` is `observed` and decides it. `grade_name` is `inferred`; take the reading the measured palette supports. |

**Boundaries are where errors concentrate.** Give each agent one shot of overlap
on each side, and check the overlapping rows first: two readings of the same shot
are the cheapest disagreement signal in the whole pipeline. Where they agree, the
interior rows are probably fine. Where they disagree, read that shot yourself.

---

## What the merge must not do

- **Do not average.** Two descriptions of a character are two observations; pick
  one with a reason, or split the entity.
- **Do not silently renumber.** `shot_id` comes from the survey and is stable.
  An agent returning `sh0001` for a shot the survey called `sh0037` has lost
  track of its own manifest, and every row it returned is suspect.
- **Do not drop a row because it is thin.** A shot with three `unknown` groups
  is a measurement of what the file gives up. Deleting it turns a coverage gap
  into an apparent absence.
- **Do not resolve a disagreement by picking the more detailed answer.** Detail
  is what a confabulating model produces most of.
