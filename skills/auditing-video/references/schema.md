# Data contract (schema v3.1)

Every table is keyed by `video_id` = sha256(file)[:16]. Identical files always
produce the same id; a re-encode produces a new id, which is correct — a
re-encode is a different asset.

**Read `video_id` as text, always.** It is a 16-char hex prefix, so roughly 542
ids per million are all digits. Inferred dtypes parse those as integers and
destroy the leading zeros, silently breaking the only join the corpus has.

## The three rules that make this a contract rather than a description

**1. Missing is NULL. Never zero.** A `0` in this dataset always means
"measured, and the answer was zero". If a measurement could not run, the column
is empty and a provenance flag says why. This matters most for OCR: on a machine
without Tesseract, "this video has no on-screen text" and "nobody looked" must
not be the same value. Two weight-3 checklist items read that column.

**2. Every table emits its full declared column set, in declared order, always.**
Optional inputs produce nulls, never absent columns. A table whose columns depend
on whether the video had audio cannot be `UNION`ed in SQL, cannot be unified by
Parquet, and silently mis-lands values in a positional `COPY`.

**3. Every percentage ships with its numerator and denominator.** Corpus queries
must pool `SUM(num)/SUM(den)`, never average per-video percentages. Averaging
`50%` (5 of 10) with `20%` (30 of 150) gives 35%; the pooled truth is 21.9%.

## Platform identity — harvested, and the window closes

`video_master.csv` carries, from the yt-dlp `<name>.info.json` sidecar beside
the media: `sidecar_file, platform, platform_post_id, post_url, creator_id,
creator_handle, published_at_utc, parent_media_id, caption, hashtags,
engagement_likes, engagement_comments, engagement_views,
engagement_captured_at_utc`.

`video_id` is `sha256(file)[:16]` — an ASSET identity. No platform reports
performance on it, and a re-encode mints a new one. `platform_post_id` is the
POST identity and is the only thing a platform export can be joined on. It
cannot be recovered once the post is deleted, so it is harvested at extract time
or not at all. `creator_id` is always the durable key (`channel_id` on YouTube,
`uploader_id` on Instagram/TikTok); a handle never lands there.

Only the yt-dlp sidecar is read — an arbitrary `<name>.json` sibling is ignored,
because consuming one suppressed the missing-join warning and stamped a capture
time for engagement that was never fetched. No sidecar means every column above
is NULL and `limitations.txt` says so.

**The engagement snapshot is not performance data.** It is likes and comments at
one instant with no reach, no views and no follower base. `published_at_utc` and
`engagement_captured_at_utc` are both present so post age is computable — that
is the minimum that stops the numbers misleading, not a substitute for Insights.

## Provenance — what made this row possible

On `video_master.csv`:

`schema_version, extractor_version, extracted_at_utc, param_sample_fps,
param_motion_dt_s, param_scene_threshold, param_platform, param_beat_tol_s,
ocr_available, face_detection_available, motion_comparable, tool_ffmpeg,
tool_opencv, tool_pandas, tool_tesseract, tool_pytesseract`

On **every other table**: `video_id, schema_version, extractor_version` (plus
`param_sample_fps` on the per-second table, because that parameter is what a
per-second row *means*).

Analyst-written tables carry their own judgment-layer provenance —
`run_id`, `coder_id`, `analyst_model`, `scored_at_utc`, `benchmark_version`,
`taxonomy_version` — so a 2026 score is never silently compared with a 2029
score on a re-verified threshold.

**`run_id` is part of the key, not decoration.** Machine tables are keyed on
`video_id` alone: a re-extract of identical bytes is the same measurement and
replacing it is right. Analyst tables are keyed `(video_id, run_id)`, because a
second CODING is new evidence. Without it the second coding deletes the first
and the inter-rater agreement `taxonomy.md` requires cannot be computed at all.
Two codings of one real video disagreed on 23% of semantic fields and 14% of
scores; `merge_corpus.py` warns on any analyst table lacking `run_id` and exits
non-zero under `--strict`.

`semantic.csv` travels as its own corpus table (`corpus_semantic.csv`), NOT
flattened into `corpus_videos` — flattening forced a `drop_duplicates(video_id)`
that destroyed the earlier coding on the exact table whose disagreement
motivated the key.

## video_master.csv — 1 row per video (the aggregation unit)

Technical: `filesize_mb, duration_s, width, height, aspect_ratio (9:16 | 16:9 |
1:1 | 4:5 | W:H), orientation, fps, video_codec, pix_fmt, has_audio, audio_codec,
audio_sample_rate, audio_channels, bitrate_kbps, n_sampled_frames,
n_contact_sheets, source_file, container_creation_time, container_encoder`

Editing: `total_cuts, cuts_per_second, n_shots, shot_mean_s, shot_median_s,
shot_min_s, shot_max_s, shot_under_0_5s_n, shot_pct_under_0_5s, shot_under_1s_n,
shot_pct_under_1s`

> `shot_mean_s` is exactly `duration_s / (total_cuts + 1)` by construction —
> it carries no information beyond two columns you already have. Do not feed it
> and `cuts_per_second` to the same model.

Visual: `brightness_mean/std, contrast_mean, saturation_mean/std,
colorfulness_mean/std/median, sharpness_mean/std/median,
motion_mean/std/median, edge_density_mean, frames_with_face_n/pct,
max_face_area_ratio, dom_color_1`

> Medians exist because `sharpness`, `colorfulness` and `motion` are heavy
> right-tailed: one hard-edged text card can set the mean. Prefer the median.
> `motion_*` is **null** when `motion_comparable=false`.

Text: `ocr_frames_sampled, ocr_frames_with_text, seconds_with_text_pct,
total_ocr_words, max_text_area_ratio` — all null when `ocr_available=false`.

Audio: `integrated_lufs, loudness_range_lu, true_peak_dbfs, audio_dbfs_mean,
speech_band_ratio_mean, bass_ratio_mean, n_silences, silence_total_s,
bpm_estimate, n_onsets` — all null when `has_audio=false`.

> `speech_band_ratio` is the energy share in 300–3400 Hz, the telephony band.
> Music sits squarely inside it. It does **not** detect speech, and a
> music-only video reads high.

Craft: `n_cuts_tested, n_cuts_synced, cut_beat_sync_pct,
cut_beat_sync_baseline_pct, cut_beat_sync_lift, cut_beat_sync_p, loop_similarity`

> The baseline is the **union** coverage of the ±`param_beat_tol_s` windows, not
> `2·tol·n/duration` — that formula double-counts overlapping windows and
> overstates the baseline by ~20 pp on dense onsets. `cut_beat_sync_p` is an
> exact binomial tail. **Never call a lift "craft" without reading the p-value:**
> on 12 cuts the statistic moves in 8.3 pp steps.

Framing: `edge_energy_top/bottom/left/right/safe, safe_area_fraction,
edge_energy_safe_index`

> This is `|Laplacian|` edge energy, **not saliency** — no centre bias, no face
> prior, no colour term. It rewards texture and grain and under-weights a large
> smooth subject. The five regions are disjoint and sum to 1.0.
> `edge_energy_safe_index` = safe share ÷ safe area, so **1.0 is what uniform
> texture alone produces**. Comparing a raw share against a "70% target" is
> wrong: the safe box is only ~56% of the frame to begin with.

Hook: `hook_* vs rest_*` for brightness, saturation, colorfulness, motion,
sharpness (0–3 s vs 3 s–end), plus `hook_frames_n`. Below ~4 hook frames the
comparison is too thin to score.

## timeline_per_second.csv — 1 row per WHOLE second

`video_id, schema_version, extractor_version, param_sample_fps, sec,
n_frames_in_sec, brightness, saturation, colorfulness, sharpness, motion_score,
edge_density, face_count, face_area_ratio, dominant_color, audio_dbfs,
speech_band_ratio, bass_ratio, ocr_text, text_area_ratio, cuts_in_sec`

Rows cover `0 .. ceil(duration)-1` with **no gaps**. A second with no sampled
frame is present with nulls and `n_frames_in_sec=0` — an absent row would be
silently dropped by a join to a retention export, at a rate that depends on
duration.

Join key for platform analytics: (`video_id`, `sec`). Joining this to a
retention export yields an **association**, not a cause.

## shot_list.csv, ocr_text.csv, frame_features.csv

`shot_list.csv`: `video_id, schema_version, extractor_version, shot_id, start_s,
end_s, duration_s, mean_brightness, mean_motion, has_face, dominant_color`.
Shots tile the video exactly, so the first and last carry boundary artefacts —
exclude them from `shot_min_s` reasoning.

`ocr_text.csv`: `video_id, schema_version, extractor_version, timestamp_s,
ocr_text, ocr_word_count, text_area_ratio, text_zone`. Empty table (headers
only) when `ocr_available=false`.

`frame_features.csv`: per sampled frame, the raw input behind the per-second
aggregation. **Per-video only — deliberately not merged into the corpus**, since
it is the largest table and adds nothing the per-second table lacks.

## Analyst-written tables

## onscreen_text.csv — WRITTEN BY THE ANALYST FROM VISION

The host reading this skill has vision. It reads stylised display type, mixed
scripts, and handwriting that Tesseract at `conf>55` systematically drops — and
unlike Tesseract it can tell a caption from a logo from a platform watermark.
That reading is a real measurement and it belongs in a table, not only in prose.

`video_id, run_id, coder_id, taxonomy_version, analyst_model, scored_at_utc,
evidence_source, t_start_s, t_end_s, text, text_role, position_band, language,
is_burned_in`

`seg_idx` was removed in 3.1: 7 of 27 rows on one real video pointed at a
segment that did not contain the row's own time span, and three branding rows
spanning 0–31 s were filed under a segment ending at 4.4 s. Join to `segments`
by time overlap instead.

Kept SEPARATE from `ocr_text.csv` on purpose. `ocr_text.csv` is deterministic,
reproducible, and machine-generated; this table is a model reading and is not
reproducible run to run. Merging them would destroy the provenance discipline
the rest of this contract exists to protect. Join them, never union them.

`evidence_source`: `vision` | `ocr` | `vision+ocr`.
`text_role` and `position_band`: enums in references/taxonomy.md.

Derived, and safe to compute per video:
`text_seconds_covered` (union of [t_start_s, t_end_s) where role=caption),
`text_coverage_pct = 100 * text_seconds_covered / duration_s`.

**This is the column GRW-02 and ACC-01 should be scored from when
`ocr_available=false`.** An empty `ocr_text.csv` means Tesseract did not run; it
never means the video has no on-screen text. If this table is also absent, the
items are unmeasured — then, and only then, `applicable=false`.


`semantic.csv` — 1 row: `video_id, taxonomy_version, analyst_model,
scored_at_utc, format_class, platform_targets (pipe-separated), objective,
funnel_stage,
subject_domain, intent, production_mode, is_branded, subgenre, hook_device,
hook_interrupts, hook_promises, hook_opens_loop, pull_mechanisms
(pipe-separated), core_message, spoken_language, onscreen_language,
creator_visible, product_visible, cta_present, attribution_present,
third_party_watermark, series_id, audience_note, notes`

`segments.csv` — `video_id, seg_idx, start_s, end_s, segment_type,
visual_description, retention_function, drop_risk`. Segments must **tile the
video exhaustively and without overlap**: `start_s` of segment n+1 equals `end_s`
of segment n, first starts at 0, last ends at `duration_s`.

`scores.csv` — `video_id, item_id, persona, pillar, item, weight, applicable,
score, evidence, evidence_source, action` (+ `analyst_model, scored_at_utc, benchmark_version`).

> `applicable` is the column v2 lacked. Without it, an item omitted as
> irrelevant shrank the denominator and *raised* the index — the same video read
> 58.7% or 63.7% depending on an undocumented choice. Items with
> `applicable=false` are excluded from both sums.
>
> `item_id` is the stable cross-language aggregation key. `persona` and `pillar`
> are stored as English codes and translated only at render time — a translated
> grouping key fragments every per-persona aggregate in the corpus.

`recommendations.csv` — `video_id, rec_idx, item_ids (pipe-separated),
recommendation, effort (timeline|asset|reshoot), expected_metric,
expected_direction, personas_lifted (pipe-separated)`

> `expected_impact` was an adjective slot. It is replaced by a named metric and
> a direction so the claim can be checked against reality on the next run.

## Corpus layer

`merge_corpus.py` upserts on `video_id` into `corpus_videos / corpus_timeline /
corpus_shots / corpus_ocr / corpus_segments / corpus_scores /
corpus_recommendations`, plus `corpus_manifest.json` (row counts, schema
versions, provenance-flag counts, and **every table it skipped and why**).

**Scale, honestly.** This script holds each table in memory. That is fine to
roughly 100k videos. Beyond that, load the per-video CSVs into a database or a
partitioned Parquet dataset directly and retire the script — do not read
"millions of videos" as a claim about this implementation. Excel is a viewer,
never the system of record.

## Validation

`python scripts/validate_audit.py <audit_dir> [--strict]` exits non-zero on:
illegal enum values (parsed from the authoritative ```enums block in
taxonomy.md), a Monetization gate opened by an objective that does not open it,
blank scores on applicable items, below-benchmark items with no action,
placeholder item text, `evidence_source=stated` whose evidence says nobody was
asked, non-tiling segments, and analyst tables missing `run_id`/`coder_id`.

It exists because an audit shipped with `objective = sell` — not a legal value,
silently failing to gate Monetization — and rendered to .xlsx as a result.

## Deletion

`python scripts/merge_corpus.py <corpus> --forget <video_id>` removes every row
for that video from every corpus table. **Order matters and is not recoverable
if you get it wrong:** the key is `sha256(file)[:16]`, so delete the source file
first and you can no longer compute the key that identifies its rows. Forget
first, then delete. The per-video audit dir and its `contact_sheets/` are not
touched — remove them separately.

## Before you run a corpus query

- **Stratify on `format_class` before pooling any score.** Ten of the thirty-six
  items are `applicable=false` on `long_form` and `other` by construction, so a
  mean that mixes format classes is computed over two different denominators and
  reads as a quality difference that is really a gating difference. The health
  index is already denominator-corrected per video; a cross-video pool is not.
- Filter or stratify on `ocr_available`, `face_detection_available`,
  `motion_comparable`, `param_sample_fps`, `param_scene_threshold` and
  `param_platform` (every `edge_energy_*` column means something different per
  platform).
- **Pick one `run_id` per video, or you double-count.** Analyst tables now hold
  one row set per coding. `GROUP BY video_id` over `corpus_scores` without a
  run filter sums two codings into one video's weight. Every one
  of them changes what a column means.
- Pool percentages from numerator and denominator; never average them.
- Report `n` next to every group mean. Detecting a 5 pp health-index difference
  between two content categories needs roughly 100–140 videos **per category**.
  Below ~30 per cell, describe — do not compare.
- `hook_type × retention` is nested within creator. Without a `creator_id` it is
  a between-creator comparison wearing a hook label.
