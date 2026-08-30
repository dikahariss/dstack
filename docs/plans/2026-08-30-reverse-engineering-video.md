# Reverse-engineering video implementation plan

**Goal:** Ship `reverse-engineering-video` — a skill that turns any video file
(target 20 min now, 90 min later) into a production package: a shot bible, an
edit list, an on-screen-text table, and generation prompts for video, image,
speech, sound effects and music — and
rename `auditing-short-video` to `auditing-video` so the catalog's audit skill
is no longer artificially bound to short form.

**Architecture:** Four stages. **Survey** the whole file cheaply with ffmpeg
(shot boundaries, low-rate contact sheets, audio map) — measured at 8.4 s for a
232 s source and 5 min 26 s for a 60.7-minute one, with a detection-only mode
that skips two of the three decode passes. **Structure** the shot list into a
scene/sequence tree, which is what makes the file divisible. **Deep-read** each
sequence in a parallel subagent at 3–5 fps *inside* shots, never globally.
**Merge** the agent outputs against a shared bible, then render prompts. The
prompt format is engine-general and detail-complete: one shot record carrying the
union of every published engine formula, with a per-engine notes table rather
than per-engine adapters.

**Stack:** Bash + ffmpeg/ffprobe (mandatory), Python 3 + numpy/pillow (frames and
sheets), PySceneDetect (optional upgrade), Bun for dstack's own build.

**Visible slice:** `backend-only: dstack is a skill-catalog renderer; it has no
screen.` The nearest equivalent is honoured instead — Task 1 ends with a real
shot list printed from a real video on this machine, before any prose is written.

Implement task by task. Per task: `/test-driven-development` decides the risk
tier and the test path, then `/verifying-before-done` before marking it done.
Request review at checkpoints with `/requesting-code-review`.
Steps use `- [ ]` checkboxes.

## Status

**Updated:** 2026-08-30 · **Branch:** `feat/reverse-engineering-video` · **Next:** complete

| Task | State | Evidence |
|---|---|---|
| 1 Scaffold + survey | done | `9bcc4e1`, `7d62777` — 11 tests green; 232 s file → 96 shots, mean 2.42 s, 908 frames → 3 agents, 8.4 s |
| 2 Dense in-shot extraction | done | `9bcc4e1` — 8 tests green; exact planned frame count per shot, over-budget slice exits 2 |
| 3 Shot schema | done | `2d2e6b4` — `shots_deep.csv` 11 groups + `bible.json`, `assembly.csv`, `graphics.csv` |
| 4 Craft vocabulary | done | `2d2e6b4` — 182 lines, under the 250 cap; dolly-vs-zoom parallax rule is the worked case |
| 5 Prompt formats | done | `2d2e6b4` — engine-union order + 5 sibling formats; worked example is real shot `sh0000` |
| 6 Fan-out protocol | done | `2d2e6b4` — 400-frame cap, agent contract, 3 merge checks |
| 7 SKILL.md | done | `694bd35` — 2383/3000 tokens, `bun run validate` OK |
| 8 Package validator | done | `694bd35` — 18 tests green |
| 9 Eval cases | done | `694bd35` — 8 cases, valid JSON |
| 10 Rename to auditing-video | done | `c00369e` — v2.0.0, old ids kept as triggers |
| 11 format_class gate | done | `c00369e` — 8 new pipeline regressions, ALL PASS |
| 12 Stale reference sweep | done | `c00369e` — only historical records retain the old id |
| 13 Router + catalog | done | `c00369e` — using-dstack 0.23.0, and ~430 tokens cheaper per session |
| 14 Verification gate | done | typecheck clean; `bun test` 102/102; validate 36 OK 0 ERR 0 warn; `build --strict` clean; 37 Python tests green |
| 15 Sync all targets | done | 4 Claude dirs + Codex + Gemini + claude.ai; file counts verified 13/15/3; old id removed from all seven |

**Deviations from plan:**
- **A1 was measured too narrowly.** The 87× realtime figure covered shot
  detection alone. The full survey decodes the file three times (detection,
  loudness, sheets), so a 3 642 s source took **5 min 26 s**, not the ~42 s the
  architecture paragraph projected. The projection in the header is corrected and
  `--no-sheets` / `--no-audio-map` were added for a detection-only pass.
- **Threshold calibration added, unplanned.** On a 300 s window of one source,
  `--threshold` 0.30 found 4 cuts, 0.15 found 19, 0.08 found 30 — no single value
  serves all content, and a wrong boundary set is wrong in every downstream
  reading. Detection now always runs at a 0.05 floor and caches every candidate
  to `cuts.csv`; `--threshold` filters that table, so changing it costs no
  decode. `calibration.txt` reports shot count and mean shot length at seven
  thresholds. Measured on the 232 s source: 0.30 → 96 shots (2.42 s mean),
  0.15 → 166 (1.40 s), 0.50 → 33 (7.05 s).
- **A long mean shot is now flagged, not passed on.** The first 60-minute run
  returned 47 shots at a 77.5 s mean, which is either genuine long-take material
  or a mis-set threshold; the survey could not tell the difference and said
  nothing. It now writes the ambiguity into `limitations.txt`.
- **Task 15 found the claude.ai UI had moved.** Skills are now at
  `claude.ai/customize/skills`; Settings → Capabilities only links there, the
  menu is `Add skill`, and the file count renders as a `Contents · N` tab rather
  than the `N files` label the procedure was written against. A rename also
  turned out to be two web operations, not one: the new id uploads as a new
  skill and the old one stays behind serving a stale copy. All recorded in
  `docs/procedures/claude-web-skill-sync.md`, together with the CDP path that
  works when the Claude-in-Chrome extension has no local browser.
- **A3 was wrong.** numpy 2.5.1 and pillow 10.2.0 are present system-wide; the
  original check imported `cv2` first and the whole line failed on that. Only
  `cv2` and `scenedetect` are absent, and the survey needs neither.

**Self-review, Critic position (2026-08-30):** the weakest task is Task 4, the
craft vocabulary — it is the one most likely to drift into restating what the
model already knows, which ADR-0030 forbids. It stays, capped at 250 lines and
admitting only terms with a confusable neighbour, because the dolly-versus-zoom
parallax rule is genuinely not something a frame-sampled reading gets right by
default. The first task likely to stall is Task 1 Step 6, on A3; Step 1 now
installs the dependencies and the script degrades rather than crashing.

## Assumptions and risks

| # | The plan assumes | Checked? | If false | Fallback |
|---|---|---|---|---|
| A1 | ffmpeg can detect shot boundaries without PySceneDetect | **yes** — 2026-08-30, `select='gt(scene,0.3)'` found 95 cuts in a 232 s file in 2.65 s wall clock (355% CPU) | — | — |
| A2 | `ffmpeg`, `ffprobe`, `python3` are on PATH | **yes** — 2026-08-30, all three at `/usr/bin` | Survey cannot run | Skill's Step 0 gate refuses and names the missing binary |
| A3 | numpy / pillow installable for the frame work | no — `cv2`, `scenedetect`, `numpy` all absent on this host today | Contact sheets cannot be built | `scripts/requirements.txt` + a Step 0 prerequisite line, same pattern `auditing-short-video` already uses |
| A4 | The `applicable=false` column can carry duration gating without breaking corpus comparability | no — it is designed for absent-by-design, and a whole gated class is a new use | Audits of long and short video stop being comparable | Add `format_class` to the master row so a query stratifies on it before pooling; state the rule in `schema.md` |
| A5 | A VLM can read camera movement from 3–5 fps frames | no — VideoHallu measured GPT-4o and Gemini-2.5-Pro at ~50% on synthetic-video hallucination | Shot records assert movements that never happened | Per-field `evidence` tier (`observed`/`inferred`/`unknown`); `inferred` may never be stated as fact in the delivered prose |
| A6 | A 20-minute video splits into sequences an agent can hold | partly — 95 shots/232 s extrapolates to ~500 shots at 20 min, ~480 frames per agent at 10 agents | One agent exceeds its context | Hard cap of 400 frames per agent in the fan-out protocol; the survey prints the projected budget before Stage 3 |
| A7 | Renaming the skill id does not orphan users who typed the old one | yes — ADR-0027 §6 requires the old id survive as a trigger | Discovery breaks | `auditing-short-video` and `video-analyzer` both kept in `metadata.dstack.triggers` |

## Task 1: Scaffold the skill and ship a working survey

**Tier:** `contract` — `shots.csv` is consumed by Stage 3 subagents and by
`validate_package.py`; its columns are a contract.

**Files:**
- Create: `skills/reverse-engineering-video/scripts/survey_video.py`
- Create: `skills/reverse-engineering-video/scripts/requirements.txt`
- Test: `skills/reverse-engineering-video/scripts/test_survey.py`

- [ ] **Step 1 — scaffold and install the prerequisites**

```bash
bun run new reverse-engineering-video --type=hybrid
printf 'numpy>=1.24\npillow>=10.0\n\n# Optional upgrade: detect-adaptive handles\n# fades and slow dissolves that the ffmpeg scene filter misses.\n# scenedetect[opencv]>=0.6\n' \
  > skills/reverse-engineering-video/scripts/requirements.txt
pip install -r skills/reverse-engineering-video/scripts/requirements.txt
python3 -c "import numpy, PIL; print('deps ok')"
```

A3 says these are absent on this host today, so this step is where that is
resolved. The script must still degrade rather than crash without pillow: shot
detection is pure ffmpeg and must keep working, with a `limitations.txt` line
saying contact sheets were skipped — the same pattern `auditing-video` already
uses for a missing Tesseract.

- [ ] **Step 2 — write the failing test**

```python
# skills/reverse-engineering-video/scripts/test_survey.py
import csv, subprocess, sys, tempfile, pathlib

SCRIPT = pathlib.Path(__file__).parent / "survey_video.py"
COLUMNS = ["video_id", "shot_id", "t_start_s", "t_end_s", "duration_s",
           "cut_confidence", "sample_fps", "n_frames_planned", "sequence_id"]

def make_clip(path):
    # Three 2-second solid-colour segments concatenated: two guaranteed cuts.
    subprocess.run(["ffmpeg", "-v", "error", "-y",
        "-f", "lavfi", "-i", "color=c=red:s=320x240:d=2",
        "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=2",
        "-f", "lavfi", "-i", "color=c=green:s=320x240:d=2",
        "-filter_complex", "[0][1][2]concat=n=3:v=1:a=0",
        "-r", "25", str(path)], check=True)

def test_detects_two_cuts_and_writes_contract_columns():
    with tempfile.TemporaryDirectory() as d:
        clip = pathlib.Path(d) / "clip.mp4"
        make_clip(clip)
        out = pathlib.Path(d) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)], check=True)
        rows = list(csv.DictReader((out / "shots.csv").open()))
        assert list(rows[0].keys()) == COLUMNS
        assert len(rows) == 3, f"expected 3 shots, got {len(rows)}"
        assert float(rows[0]["t_start_s"]) == 0.0
        assert abs(float(rows[-1]["t_end_s"]) - 6.0) < 0.2

def test_shots_tile_without_gaps():
    with tempfile.TemporaryDirectory() as d:
        clip = pathlib.Path(d) / "clip.mp4"
        make_clip(clip)
        out = pathlib.Path(d) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)], check=True)
        rows = list(csv.DictReader((out / "shots.csv").open()))
        for a, b in zip(rows, rows[1:]):
            assert float(a["t_end_s"]) == float(b["t_start_s"]), "shot list must tile"

def test_sample_fps_follows_the_duration_ladder():
    # A 2.0 s shot sits in the 1.5-5 s band -> 4 fps.
    with tempfile.TemporaryDirectory() as d:
        clip = pathlib.Path(d) / "clip.mp4"
        make_clip(clip)
        out = pathlib.Path(d) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)], check=True)
        rows = list(csv.DictReader((out / "shots.csv").open()))
        assert float(rows[0]["sample_fps"]) == 4.0
        assert int(rows[0]["n_frames_planned"]) == 8
```

- [ ] **Step 3 — run it, expect failure**

Run: `python3 skills/reverse-engineering-video/scripts/test_survey.py`
Expected: FAIL — `survey_video.py` does not exist.

- [ ] **Step 4 — implement the survey**

`survey_video.py` takes `<video> <outdir>` plus `--threshold` (default 0.3),
`--detector` (`ffmpeg` default, `pyscenedetect` optional) and `--survey-fps`
(default 0.25). It writes:

- `shots.csv` — the nine contract columns above, tiling the file with no gaps.
- `survey_sheets/S**.jpg` — time-labelled 5×6 grids at `--survey-fps`.
- `probe.json` — duration, native fps, resolution, aspect, audio stream count.
- `budget.txt` — the projected Stage 3 frame total and the agent count it implies.

The shot detector is the checked ffmpeg command from A1:

```python
CUT_FILTER = "select='gt(scene,{t})',metadata=print:file=-"
```

The per-shot sampling ladder, derived from the frame-budget evidence in
`references/fanout-protocol.md` — **closed by design**: these four bands are the
contract Stage 3 agents plan against, and a fifth band would make two runs of the
same video incomparable.

| Shot duration | `sample_fps` | Floor | Ceiling |
|---|---|---|---|
| ≤ 1.5 s | 5 | 4 frames | — |
| 1.5–5 s | 4 | 4 frames | — |
| 5–15 s | 3 | — | — |
| > 15 s | 2 | — | 48 frames |

Every shot gets at least 4 frames regardless of the ladder: at fewer than that a
push-in and a cut are indistinguishable, which is the failure the whole ladder
exists to prevent.

- [ ] **Step 5 — run it, expect pass**

Run: `python3 skills/reverse-engineering-video/scripts/test_survey.py` → 3 passed

- [ ] **Step 6 — run it on a real file and read the output**

```bash
python3 skills/reverse-engineering-video/scripts/survey_video.py \
  "/home/haris/Downloads/Real_Madrid-xfz3prepmd58s8ns4wdpfiwm.mp4" \
  /tmp/rev-survey
head -5 /tmp/rev-survey/shots.csv && cat /tmp/rev-survey/budget.txt
```

Expected: ~95 shot rows, a budget line naming the projected frame count and
agent count. Record the actual numbers in the Status block's Evidence column.

- [ ] **Step 7 — commit**

## Task 2: Dense in-shot extraction

**Tier:** `contract` — Stage 3 agents call this and read its sheets.

**Files:**
- Create: `skills/reverse-engineering-video/scripts/extract_shots.py`
- Test: `skills/reverse-engineering-video/scripts/test_extract.py`

- [ ] **Step 1 — write the failing test**

```python
# skills/reverse-engineering-video/scripts/test_extract.py
import csv, subprocess, sys, tempfile, pathlib
from test_survey import make_clip

SCRIPT = pathlib.Path(__file__).parent / "extract_shots.py"
SURVEY = pathlib.Path(__file__).parent / "survey_video.py"

def surveyed(d):
    clip = pathlib.Path(d) / "clip.mp4"
    make_clip(clip)                      # 3 x 2 s solid colours, 2 cuts
    out = pathlib.Path(d) / "survey"
    subprocess.run([sys.executable, str(SURVEY), str(clip), str(out)], check=True)
    return clip, out

def test_extracts_exactly_n_frames_planned_per_shot():
    with tempfile.TemporaryDirectory() as d:
        clip, out = surveyed(d)
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                        "--shots", "0-2"], check=True)
        for row in csv.DictReader((out / "shots.csv").open()):
            frames = sorted((out / "shots" / row["shot_id"]).glob("f*.jpg"))
            assert len(frames) == int(row["n_frames_planned"]), \
                f'{row["shot_id"]}: {len(frames)} != {row["n_frames_planned"]}'

def test_writes_one_audio_slice_per_shot_matching_the_shot_window():
    with tempfile.TemporaryDirectory() as d:
        clip, out = surveyed(d)
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                        "--shots", "0-2"], check=True)
        for row in csv.DictReader((out / "shots.csv").open()):
            wav = out / "shots" / row["shot_id"] / "audio.wav"
            assert wav.exists(), f'{row["shot_id"]}: no audio slice'
            dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                                  "format=duration", "-of", "csv=p=0", str(wav)],
                                 capture_output=True, text=True).stdout.strip()
            assert abs(float(dur) - float(row["duration_s"])) < 0.15

def test_refuses_a_slice_whose_budget_exceeds_the_cap():
    with tempfile.TemporaryDirectory() as d:
        clip, out = surveyed(d)
        r = subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                            "--shots", "0-2", "--max-frames", "5"],
                           capture_output=True, text=True)
        assert r.returncode == 2, "over-budget slice must exit 2, not truncate"
        assert "0-2" in r.stderr and "5" in r.stderr, \
            "the refusal must name the range and the cap so the caller can re-split"

def test_a_contact_sheet_per_shot_carries_readable_timestamps():
    with tempfile.TemporaryDirectory() as d:
        clip, out = surveyed(d)
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                        "--shots", "0-2"], check=True)
        sheets = list((out / "shots").rglob("sheet.jpg"))
        assert len(sheets) == 3, f"expected 3 sheets, got {len(sheets)}"
```

- [ ] **Step 2 — run it, expect failure**

Run: `python3 skills/reverse-engineering-video/scripts/test_extract.py`
Expected: FAIL — `extract_shots.py` does not exist.

- [ ] **Step 3 — implement**

`extract_shots.py <video> <survey_dir> --shots 0-49 [--outdir]` reads
`shots.csv`, extracts each shot's frames at its own `sample_fps` with one ffmpeg
call per shot (`-ss <start> -t <duration> -vf fps=<f>`), writes
`shots/<shot_id>/f####.jpg` and one labelled contact sheet per shot, and exits 2
if the slice's projected frames exceed `--max-frames` (default 400).

It also writes `shots/<shot_id>/audio.wav` for the slice, so speech and sound
effects are read from the same window as the picture.

- [ ] **Step 4 — run it, expect pass**

Run: `python3 skills/reverse-engineering-video/scripts/test_extract.py` → 3 passed

- [ ] **Step 5 — commit**

## Task 3: The shot record schema

**Tier:** `none` — reference prose. Cases the document must cover, written before
drafting: every field in the union of the Veo 3.1, Kling and Seedance formulas;
an `evidence` tier per field group; the bible cross-reference fields; the audio
fields split into speech / diegetic SFX / music; the transition field; and a
worked example row filled from a real shot.

**Files:**
- Create: `skills/reverse-engineering-video/references/shot-schema.md`

- [ ] **Step 1 — write the document**

It fixes `shots_deep.csv` — one row per shot, written by a Stage 3 agent:

| Group | Fields | Evidence tier |
|---|---|---|
| Identity | `video_id`, `shot_id`, `sequence_id`, `t_start_s`, `t_end_s` | observed |
| Subject | `subject_ref`, `subject_description`, `subject_action`, `subject_position` | observed |
| Scene | `location`, `time_of_day`, `weather`, `set_dressing`, `background_elements` | observed |
| Camera | `framing`, `angle`, `movement`, `movement_speed` | observed |
| Optics | `lens_feel`, `depth_of_field`, `focal_length_est` | **inferred** |
| Light | `light_source`, `light_direction`, `light_quality`, `colour_temp_est` | `light_source`/`direction`/`quality` observed; `colour_temp_est` **inferred** |
| Grade | `palette_hex`, `grade_name`, `contrast`, `saturation` | `palette_hex` observed; `grade_name` **inferred** |
| Motion | `playback_speed`, `speed_ramp` | observed |
| Audio | `speech_text`, `speech_delivery`, `sfx_diegetic`, `music_state`, `music_change` | observed |
| Exit | `transition_out`, `transition_duration_s` | observed |
| Provenance | `evidence_optics`, `evidence_light`, `evidence_grade`, `coder_agent`, `run_id` | — |

Two sibling tables complete the package. Without them the deliverable is a pile of
clips with no instruction for reassembly and no on-screen text:

- **`assembly.csv`** — the edit list. One row per shot in playback order:
  `order_index`, `shot_id`, `source_in_s`, `source_out_s`, `timeline_in_s`,
  `transition_in`, `transition_duration_s`, `audio_bed_ref`. It exports to CMX
  3600 EDL so the package opens in an NLE rather than living only as prose.
- **`graphics.csv`** — every piece of on-screen text and graphic: `t_start_s`,
  `t_end_s`, `text`, `text_role` (title / lower_third / caption / cta / credit /
  watermark), `position_band`, `font_character`, `animation_in`, `animation_out`.
  Read from the frames, not from OCR alone, and marked `evidence_source=vision`.

**The evidence rule, stated once and enforced in the deliverable:** a field
carrying `inferred` describes a reading, not a measurement. Focal length and
colour temperature are not recoverable from pixels — they are deduced from
perspective compression and white balance. The delivered prose writes "reads as a
long lens" and never "shot on 85 mm". `/researching-facts` found VideoHallu
measuring GPT-4o and Gemini-2.5-Pro at roughly 50% accuracy on synthetic-video
hallucination; this column is the response to that number.

Field list openness: the eleven groups are **closed by design** — deep rows from
different agents and different runs concatenate into one table, and a run
producing a twelfth group is not comparable. Extend by editing this file, never
mid-run. Values *within* a field are open and come from `craft-vocabulary.md`.

- [ ] **Step 2 — commit**

## Task 4: The craft vocabulary

**Tier:** `none`. Cases to cover, written first: shot sizes; camera angles;
camera movements with the static/handheld/mechanical split; lens feel; depth of
field; light source, direction and quality; colour-temperature bands; named
grades; playback speed and ramps; transition types. Each entry needs the term, a
one-line recognition cue (what in the frame tells you it is this), and whether it
is observable or inferred.

**Files:**
- Create: `skills/reverse-engineering-video/references/craft-vocabulary.md`

- [ ] **Step 1 — write it as recognition, not intention**

The distinction that makes this file worth writing rather than restating the
model's own knowledge: a director's reference maps *feeling → choice*
("isolation → extreme wide"). This file maps *frame → term*, because the skill
reads finished footage. Example row shape:

| Term | Recognition cue | Tier |
|---|---|---|
| dolly in | Subject size grows while background perspective shifts; parallax between fore- and background changes | observed |
| zoom in | Subject size grows with **no** parallax change; background compresses | observed |
| long lens | Background compressed, planes stacked, shallow falloff at moderate aperture | inferred |

Dolly versus zoom is the worked case: both grow the subject, only parallax
separates them, and it is the single most common misread in a frame-sampled
reading. Every movement entry names what distinguishes it from its neighbour.

**Size cap: 250 lines.** An entry earns its place only if a reader could
otherwise confuse the term with its neighbour — the discriminator is the
content, and a term with no confusable neighbour needs no entry at all. This cap
exists because ADR-0030 forbids restating what the model already knows: the model
knows what a close-up is, and does not reliably know that parallax is what
separates a dolly from a zoom.

- [ ] **Step 2 — commit**

## Task 5: Prompt formats — general, detail-complete

**Tier:** `none`. Cases to cover: the general shot prompt and how it is built
from a `shots_deep.csv` row; the image prompt for a first/reference frame; the
speech prompt; the sound-effects prompt; the music prompt; the per-engine notes
table; and one fully worked shot rendered into all five.

**Files:**
- Create: `skills/reverse-engineering-video/references/prompt-formats.md`

- [ ] **Step 1 — write the general format**

One order, carrying every field, derived from the union of the published
formulas retrieved 2026-08-30:

```
[Camera] [Subject] [Subject action] [Scene] [Light] [Grade] [Motion] [Audio] [Exit]
```

with the source formulas recorded so a future editor can see what the union
covers:

| Engine | Published formula | Source |
|---|---|---|
| Veo 3.1 | `[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]`; clips 4/6/8 s; dialogue in quotes, `SFX:` and `Ambient noise:` lines; negative prompts stated positively | cloud.google.com Veo 3.1 prompting guide |
| Kling | `Subject (description) + Subject Movement + Scene (description) + (Camera Language + Lighting + Atmosphere)`; up to 6 labelled shots, ~15 s | kling.ai text-to-video prompt guide |
| Seedance-family | Header block + per-shot paragraphs, `SFX:` and `Music:` on every shot, speed as a percentage | reference skill supplied by the user |

The engine differences that survive the union are **notes, not adapters**: clip
length caps, whether audio is native, and whether reference images are accepted.
They go in one table at the end. Everything else is the same prompt.

- [ ] **Step 2 — write the four sibling prompt formats**

- **Image** (first frame / reference still) — subject, wardrobe, set, framing,
  light, grade, aspect. Hands off to `/generating-images` for rendering.
- **Speech** — verbatim line, delivery, pace, accent, emotional state, and
  whether it is sync dialogue or voice-over.
- **Sound effects** — one prompt per named diegetic sound, with its duration and
  where in the shot it lands.
- **Music / backsound** — 4–7 descriptors in the order genre, tempo, key
  instruments, vocal treatment, production quality, mood; plus a structure map in
  square-bracket section tags and an explicit hard-stop marker. Four to seven is
  the band the current published guidance gives; fewer leaves the generator too
  much latitude, more sets directives fighting each other.

- [ ] **Step 3 — write the assembly output format**

`assembly.csv` renders two ways: a CMX 3600 EDL an NLE can import, and a plain
cut sheet a person can follow. Both name the same `shot_id`s as the prompts, so
a generated clip has exactly one place on the timeline. This is the step that
turns a pile of prompts into something someone can actually rebuild.

- [ ] **Step 4 — write the worked example**

One real shot from the Task 1 survey, carried from its `shots_deep.csv` row
through all five prompts plus its assembly row and any `graphics.csv` rows that
overlap it, with the `inferred` fields visibly hedged.

- [ ] **Step 4 — commit**

## Task 6: The fan-out protocol

**Tier:** `none`. Cases to cover: when to fan out at all; how sequences are cut
into agent slices; the exact prompt an agent receives; what it must return; the
frame-budget arithmetic; and the merge-time consistency checks that a single
agent would get for free.

**Files:**
- Create: `skills/reverse-engineering-video/references/fanout-protocol.md`

- [ ] **Step 1 — write the budget arithmetic with its evidence**

| Finding | Figure | Source |
|---|---|---|
| Uniform-FPS beat adaptive sampling on long video | best on VideoMME across every model tested | Frame Sampling Strategies Matter, arXiv 2509.14769 |
| Accuracy against frame count | rises sharply 16→256, peaks ~62% at 256, **falls** at 600 | same |
| High fps buys fine motion, not comprehension | 16 fps gave +1.7 pp on general VideoMME but +15.6 pp on gymnastics, +10.5 pp on diving | F-16, arXiv 2503.13956 |
| Shot-aware budgeting beats flat sampling | 84.7% vs 11.8% frame recall at 0.5 fps; parity on Video-MME | InfoShot, arXiv 2603.17374 |

The arithmetic those four produce: measured on this machine, a 232 s file held 95
shots — 2.4 s average. A 20-minute video therefore projects to roughly 500 shots
and, on the Task 1 ladder, roughly 4 800 frames. One agent cannot hold that. Ten
agents of 50 shots hold ~480 frames each, which sits near the 256-frame band where
the measured accuracy curve peaks. **400 frames is the hard cap per agent**, and
the survey prints the projection before Stage 3 so the split is chosen from a
number rather than a guess.

- [ ] **Step 2 — write the agent contract**

Each agent receives: its shot rows, its extracted sheets, its audio slices, the
current bible, and the schema. It returns `shots_deep.csv` rows for its slice and
nothing else. It never edits the bible — divergence is a merge-time finding, not
something an agent resolves alone.

- [ ] **Step 3 — write the merge checks**

The three things fan-out breaks and a single reader would not: a character
described differently in two slices; a location renamed across a boundary; a
grade drifting because two agents read the same look from different frames. Each
is a named check at merge, resolved into the bible, with the losing description
recorded rather than deleted.

- [ ] **Step 4 — commit**

## Task 7: Write SKILL.md

**Tier:** `none`. Cases to cover: the gate (local file, vision required, rights);
the four stages with exact commands; the fan-out decision; the delivery order;
what the skill cannot recover; the named judgment surface; and `## Changes`.

**Files:**
- Modify: `skills/reverse-engineering-video/SKILL.md`

- [ ] **Step 1 — frontmatter**

```yaml
name: reverse-engineering-video
description: >
  Use when a video FILE has to be taken apart and rebuilt as generation
  prompts — a shot-by-shot breakdown plus ready-to-run prompts for video,
  image, speech, sound effects and music. Handles long files, not only
  short form: shots are detected first, then read densely inside each shot
  and fanned out across parallel agents. Not for judging whether a video is
  good (that is /auditing-video) and not for a platform URL (local files
  only). Triggers: "reverse engineer this video", "recreate this video",
  "break this video into shots", "video to prompt", "shot list from a
  video", "how was this video made", "scene breakdown", "storyboard from
  footage", "prompt untuk bikin video seperti ini".
allowed-tools: Read Write Edit Bash Glob Grep Agent
metadata:
  dstack:
    version: 0.1.0
    type: hybrid
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - reverse engineer video
      - video to prompt
      - recreate this video
      - shot breakdown
      - scene breakdown from video
```

- [ ] **Step 2 — write the rights gate**

Step 0 refuses nothing outright but forces a distinction the research made
concrete: extracting a *grammar* (shot sizes, movement, grade, pacing) is reading
style; reproducing a *specific sequence* shot-for-shot with the same characters
and beats is reproducing expression, and courts apply substantial-similarity
analysis to AI output the same way they apply it to anything else. The gate asks
what the package is for, and flags every recognizable person, brand, character
and piece of third-party work the survey found, so the user decides with the list
in front of them rather than after generating.

- [ ] **Step 3 — write the four stages with exact commands and the delivery order**

Delivery order, closed by design (limits before output, structure before
prompts): what could not be recovered → what the video is → the structure → the
bible → the prompts → the assembly (edit list plus on-screen text) → what to
generate first. Append sections beyond these seven rather than reordering.

- [ ] **Step 4 — name the judgment surface in one sentence**

The spine fixes detection, sampling, budgets and schema; the judgment is where
the scene and sequence boundaries fall — a cut is measurable, a scene is a
reading — and which shots are worth a deep pass at all.

- [ ] **Step 5 — check the budget**

Run: `bun run validate` → the skill reports under 5000 tokens.

- [ ] **Step 6 — commit**

## Task 8: Package validator

**Tier:** `core` — this is what stops a fabricated package shipping.

**Files:**
- Create: `skills/reverse-engineering-video/scripts/validate_package.py`
- Test: `skills/reverse-engineering-video/scripts/test_validate.py`

- [ ] **Step 1 — write the failing tests**

```python
# skills/reverse-engineering-video/scripts/test_validate.py
import csv, json, subprocess, sys, tempfile, pathlib

SCRIPT = pathlib.Path(__file__).parent / "validate_package.py"

GOOD_DEEP = {
    "video_id": "abc123", "shot_id": "sh0001", "sequence_id": "sq01",
    "t_start_s": "0.0", "t_end_s": "2.4",
    "subject_ref": "CHAR_01", "subject_description": "man in grey coat",
    "subject_action": "turns toward camera", "subject_position": "frame right",
    "location": "LOC_01", "time_of_day": "dusk", "weather": "clear",
    "set_dressing": "bare table", "background_elements": "window, rain streaks",
    "framing": "medium close-up", "angle": "eye level",
    "movement": "slow dolly in", "movement_speed": "slow",
    "lens_feel": "reads as a long lens", "depth_of_field": "shallow",
    "focal_length_est": "reads as 85-100mm equivalent",
    "light_source": "practical lamp", "light_direction": "side",
    "light_quality": "soft", "colour_temp_est": "reads warm, tungsten range",
    "palette_hex": "#2b1d16;#c88a4a", "grade_name": "reads as warm low-contrast",
    "contrast": "low", "saturation": "muted",
    "playback_speed": "real time", "speed_ramp": "none",
    "speech_text": "", "speech_delivery": "", "sfx_diegetic": "rain on glass",
    "music_state": "absent", "music_change": "none",
    "transition_out": "cut", "transition_duration_s": "0",
    "evidence_optics": "inferred", "evidence_light": "observed",
    "evidence_grade": "inferred", "coder_agent": "agent-3", "run_id": "r001",
}

def write_pkg(d, deep_overrides=None, bible=None, assembly=None):
    d = pathlib.Path(d)
    row = dict(GOOD_DEEP); row.update(deep_overrides or {})
    with (d / "shots_deep.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(GOOD_DEEP)); w.writeheader(); w.writerow(row)
    (d / "bible.json").write_text(json.dumps(bible if bible is not None else {
        "characters": {"CHAR_01": {"description": "man in grey coat"}},
        "locations": {"LOC_01": {"description": "unlit room, rain outside"}}}))
    (d / "assembly.csv").write_text(assembly if assembly is not None else
        "order_index,shot_id,source_in_s,source_out_s,timeline_in_s,"
        "transition_in,transition_duration_s,audio_bed_ref\n"
        "1,sh0001,0.0,2.4,0.0,cut,0,BED_01\n")
    (d / "prompts.md").write_text("## sh0001\nMedium close-up, ...\n")
    return d

def run(d):
    return subprocess.run([sys.executable, str(SCRIPT), str(d)],
                          capture_output=True, text=True)

def test_accepts_a_well_formed_package():
    with tempfile.TemporaryDirectory() as d:
        assert run(write_pkg(d)).returncode == 0

def test_rejects_an_inferred_field_stated_as_fact():
    # The whole point of the evidence tier: `inferred` may not be asserted.
    with tempfile.TemporaryDirectory() as d:
        r = run(write_pkg(d, {"focal_length_est": "85mm"}))
        assert r.returncode == 1
        assert "focal_length_est" in r.stderr

def test_rejects_a_bible_reference_no_bible_entry_defines():
    with tempfile.TemporaryDirectory() as d:
        r = run(write_pkg(d, {"subject_ref": "CHAR_99"}))
        assert r.returncode == 1 and "CHAR_99" in r.stderr

def test_rejects_a_deep_row_missing_run_id_or_coder_agent():
    # Without these two, a second reading of the same video overwrites the first.
    with tempfile.TemporaryDirectory() as d:
        r = run(write_pkg(d, {"run_id": ""}))
        assert r.returncode == 1 and "run_id" in r.stderr

def test_rejects_an_assembly_row_naming_a_shot_that_does_not_exist():
    with tempfile.TemporaryDirectory() as d:
        r = run(write_pkg(d, assembly=(
            "order_index,shot_id,source_in_s,source_out_s,timeline_in_s,"
            "transition_in,transition_duration_s,audio_bed_ref\n"
            "1,sh9999,0.0,2.4,0.0,cut,0,BED_01\n")))
        assert r.returncode == 1 and "sh9999" in r.stderr

def test_rejects_a_shot_with_no_prompt():
    with tempfile.TemporaryDirectory() as d:
        d = write_pkg(d); (d / "prompts.md").write_text("## nothing here\n")
        r = run(d)
        assert r.returncode == 1 and "sh0001" in r.stderr
```

- [ ] **Step 2 — run them, expect failure**

Run: `python3 skills/reverse-engineering-video/scripts/test_validate.py`
Expected: FAIL — `validate_package.py` does not exist.

- [ ] **Step 3 — implement, exit 1 on any violation, naming the row**

- [ ] **Step 4 — run them, expect pass** → 6 passed

- [ ] **Step 5 — commit**

## Task 9: Behavioural eval

**Tier:** `none`. Cases: an Indonesian request routes here; an English one routes
here; "is this reel any good" routes to `/auditing-video` instead; a platform URL
is refused; a 60-minute file triggers the fan-out rather than a single pass.

**Files:**
- Create: `skills/reverse-engineering-video/eval/cases.jsonl`

- [ ] **Step 1 — write the cases, following `/brainstorm`'s bundled `eval/` shape**
- [ ] **Step 2 — commit**

## Task 10: Rename auditing-short-video to auditing-video

**Tier:** `contract` — the skill id is what the router, the catalog and the user
type.

**Files:**
- Rename: `skills/auditing-short-video/` → `skills/auditing-video/`
- Modify: `skills/auditing-video/SKILL.md`

- [ ] **Step 1 — move**

```bash
git mv skills/auditing-short-video skills/auditing-video
```

- [ ] **Step 2 — edit frontmatter**

`name: auditing-video`; version `2.0.0`; description rewritten to cover any
duration and to hand short-form-only judgement to the new `format_class` gate;
`metadata.dstack.triggers` gains `auditing-short-video` and keeps
`video-analyzer`, per ADR-0027 §6.

- [ ] **Step 3 — write the `## Changes` entry** saying what the rename cost and
      what preserves discovery.

- [ ] **Step 4 — run** `bun run validate` → passes with the new id.

- [ ] **Step 5 — commit** (rename only; the instrument change is Task 11)

## Task 11: Gate the short-form items by format class

**Tier:** `contract` — `scores.csv` rows concatenate into a corpus.

**Files:**
- Modify: `skills/auditing-video/references/taxonomy.md`
- Modify: `skills/auditing-video/references/persona_checklist.md`
- Modify: `skills/auditing-video/references/schema.md`
- Modify: `skills/auditing-video/scripts/validate_audit.py`
- Modify: `skills/auditing-video/scripts/test_pipeline.py`

- [ ] **Step 1 — list the cases before implementing**

`format_class` enum: `short_vertical`, `long_form`, `other`. The items that are
short-form-only, to be forced `applicable=false` when `format_class != short_vertical`:
CRD-01, CRD-02, CRD-03, CRD-04 (hook window), CST-02 (platform duration rule),
CST-05 (loop-ability), GRW-01 (retention inference), GRW-05 (safe zone), BRD-04
(third-party watermark), MON-03 (ad-spec readiness). Ten of thirty-six. The
remaining twenty-six are craft and rights items that hold at any duration.

- [ ] **Step 2 — write the failing test**

```python
# appended to skills/auditing-video/scripts/test_pipeline.py
SHORT_ONLY = ["CRD-01", "CRD-02", "CRD-03", "CRD-04", "CST-02",
              "CST-05", "GRW-01", "GRW-05", "BRD-04", "MON-03"]

def test_long_form_audit_forces_the_ten_short_only_items_inapplicable():
    d = audit_dir(format_class="long_form")
    set_item(d, "CRD-01", applicable="true", score="4")
    r = validate(d)
    assert r.returncode == 1
    assert "CRD-01" in r.stderr and "long_form" in r.stderr

def test_long_form_audit_passes_when_all_ten_are_gated_off():
    d = audit_dir(format_class="long_form")
    for item in SHORT_ONLY:
        set_item(d, item, applicable="false", score="")
    assert validate(d).returncode == 0

def test_short_vertical_audit_still_requires_all_thirty_six_scored():
    d = audit_dir(format_class="short_vertical")
    set_item(d, "CRD-01", applicable="false", score="")
    r = validate(d)
    assert r.returncode == 1, "gating a hook item off is only legal for long_form"

def test_master_row_carries_format_class_for_corpus_stratification():
    d = audit_dir(format_class="long_form")
    master = read_csv(d / "video_master.csv")[0]
    assert master["format_class"] == "long_form"

def test_illegal_format_class_is_rejected():
    d = audit_dir(format_class="vertical-ish")
    assert validate(d).returncode == 1
```

- [ ] **Step 3 — run, expect failure**

Run: `python3 skills/auditing-video/scripts/test_pipeline.py`
Expected: FAIL — `format_class` is not a known column.

- [ ] **Step 4 — implement**: enum in `taxonomy.md`, a gate column in
      `persona_checklist.md`, the stratification rule in `schema.md`'s
      "Before you run a corpus query" section (A4's fallback), and the check in
      `validate_audit.py`.

- [ ] **Step 5 — run, expect pass** → all pipeline tests green.

- [ ] **Step 6 — commit**

## Task 12: Stale reference sweep

**Tier:** `none`. Cases: every occurrence of the old id in every tracked file.

**Files:**
- Modify: whatever the grep finds.

- [ ] **Step 1 — find them**

```bash
git grep -n "auditing-short-video" -- ':!skills/auditing-video/SKILL.md'
git grep -n "audit short video"
```

- [ ] **Step 2 — update every hit.** CLAUDE.md pacing rule 4: if it appears in
      five files, all five change. A half-done rename is worse than none.

- [ ] **Step 3 — verify nothing is left**

```bash
git grep -c "auditing-short-video" | grep -v "SKILL.md:" || echo "clean"
```

- [ ] **Step 4 — commit**

## Task 13: Register both skills in the router

**Tier:** `none`. Cases: a router row for each; a catalog entry for each; the
chain each belongs to; `## Changes`; the version bump in the same edit.

**Files:**
- Modify: `skills/using-dstack/SKILL.md`
- Modify: `skills/using-dstack/references/skill-catalog.md`

- [ ] **Step 1 — router rows**

| Situation | Skill |
|---|---|
| Audit a video file and build a dataset or corpus from it | `/auditing-video` |
| Take a video apart into shots and rebuild it as generation prompts | `/reverse-engineering-video` |

- [ ] **Step 2 — catalog entries** carrying the boundary between the two: one
      judges, one reconstructs; the same file can go through both.

- [ ] **Step 3 — chain**: `/reverse-engineering-video` →
      `/dispatching-parallel-agents` (Stage 3) → `/generating-images` (rendering
      the stills the prompts describe).

- [ ] **Step 4 — bump `using-dstack` version and write `## Changes`** in the
      same edit. Shipping unregistered is the anti-pattern; shipping registered
      without a version bump is the same defect one step later.

- [ ] **Step 5 — commit**

## Task 14: Full verification gate

**Tier:** `none` — this is the gate, not a change.

- [ ] **Step 1 — run everything, in this turn, and read the output**

```bash
bun run typecheck
bun test
bun run validate
bun run build --strict
python3 skills/reverse-engineering-video/scripts/test_survey.py
python3 skills/reverse-engineering-video/scripts/test_extract.py
python3 skills/reverse-engineering-video/scripts/test_validate.py
python3 skills/auditing-video/scripts/test_pipeline.py
```

- [ ] **Step 2 — end-to-end on a real long file**

```bash
python3 skills/reverse-engineering-video/scripts/survey_video.py \
  /home/haris/Downloads/video1436059290.mp4 /tmp/rev-long
cat /tmp/rev-long/budget.txt
```

That file is 3 642 s — 60.7 minutes. It is the 90-minute case in miniature and
the only honest test of whether the survey stays cheap at length. Record the wall
clock and the projected agent count.

- [ ] **Step 3 — commit**

## Task 15: Sync every install target

**Tier:** `none`. CLAUDE.md: a build is not finished at `bun run build`.

- [ ] **Step 1 — `bun run build`** (this repo's `.claude/skills/`)
- [ ] **Step 2 — rsync to the four Claude config dirs** per README
- [ ] **Step 3 — Codex and Gemini CLI symlinks** per README
- [ ] **Step 4 — claude.ai web**, per `docs/procedures/claude-web-skill-sync.md`.
      `reverse-engineering-video` is new, so it can batch. `auditing-video` is a
      rename — upload it alone, and delete the old `auditing-short-video` entry
      by hand, because the web account holds a copy and will otherwise serve both.
- [ ] **Step 5 — report what actually synced**, naming anything still pending.
