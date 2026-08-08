---
name: auditing-short-video
description: >
  Use when a short-form video FILE (Reel, TikTok, Shorts, any mp4/webm/mov) needs
  a structured audit and a dataset the user can keep — a per-video fact row plus
  per-second, per-shot and OCR tables that concatenate across many videos. Also
  use when several such audits must be merged into a corpus, or when video
  measurements must be prepared for a database, warehouse, or ML feature store.
  Not for a platform URL (this reads local files only) and not for judging a
  running app. Triggers: "analyze this video", "audit video", "review this video",
  "extract data from a video", "hook analysis", "retention critique",
  "why isn't this reel performing", "video dataset", "merge video audits",
  "video-analyzer".
allowed-tools: Read Write Edit Bash Glob Grep
metadata:
  dstack:
    version: 1.3.0
    type: hybrid
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - audit short video
      - analyze video
      - audit video
      - video hook retention
      - video dataset corpus
      - video-analyzer
---

# Auditing a short-form video

Turn one video file into (1) a measured dataset, (2) a semantic description of
what the video actually is, (3) a scored multi-persona audit, and (4) ranked
fixes the creator can execute.

**The ordering rule:** never present a metric before you have watched the contact
sheets and can say what the video is about. Numbers without the semantic layer
are the failure mode this skill exists to prevent.

**What this cannot tell you.** The file is not the account. Caption, hashtags,
audio trend status, posting time, follower graph and actual watch-time decide
distribution and none of them are in the file. Nothing in this package has been
validated against realised performance — it has face validity only. Say both, in
the report, before the health index.

## Step 0 — Gate

1. **Input is a local file.** Given a platform URL, say so and ask for the file.
   Downloading from a platform is out of scope.
2. **You must be able to view images.** Step 2 requires reading the contact
   sheets. If you cannot, stop and say so — do not score from numbers alone.
3. **Rights.** This writes frames, detected faces and OCR'd on-screen text to
   disk, and corpus mode accumulates them into a searchable index across videos.
   Before auditing anything the user did not make, ask whether they have the
   right to hold that data. Say what is stored and where. Offer `--keep-frames`
   off (the default) so raw frames are deleted after extraction.
4. **Ask, briefly:** target platform(s), the video's objective, whether it is
   part of a series, whether anything is being sold, and one line on what they
   were going for. Five questions once. Without them the checklist guesses, and
   a deliberate choice gets scored as a defect.
5. **Prerequisites:** `ffmpeg`/`ffprobe`, and
   `pip install -r <skill_dir>/scripts/requirements.txt`. Tesseract is optional
   — without it OCR columns are NULL and the two text items are unscored.

## Step 1 — Extract

```bash
python "<skill_dir>/scripts/extract_features.py" "<video>" "<audit_dir>" \
    --platform tiktok        # or instagram_reels | youtube_shorts | generic
```

For corpus mode later, make every `<audit_dir>` a sibling under one parent:
`<corpus_root>/<video_id_or_slug>/`.

Read `<audit_dir>/limitations.txt` now. It lists exactly which measurements ran
on this machine. Every limitation there is a scoring constraint, and you will
reproduce them in the final report.

## Step 1b — The data contract

Read `references/schema.md` once per session. Everything you write below
(`semantic.csv`, `segments.csv`, `scores.csv`, `recommendations.csv`) goes into
`<audit_dir>` with exactly those columns. Schema discipline here is the product.

## Step 2 — Semantics, before any metric talk

View **every** image in `<audit_dir>/contact_sheets/`. Then write, in the user's
language:

1. **What the video literally is** — who and what is on screen, the setting, the
   sequence, the ending. Concrete nouns, not vibes.
2. **Classification** — the four facets in `references/taxonomy.md`
   (`subject_domain`, `intent`, `production_mode`, `is_branded`). They are
   separate on purpose: a branded cooking tutorial is all four at once.
3. **`semantic.csv`** — one row, controlled vocabulary only, free text confined
   to `core_message` and `notes`. Record `taxonomy_version` and `analyst_model`.
4. **`segments.csv`** — narrative acts that tile the video exhaustively with no
   gaps or overlaps. Use the shot list and the dominant-colour arc to place
   boundaries.
5. **`onscreen_text.csv`** — every piece of text you can read in the sheets: the
   captions, the hook text, the branding lockups, the CTA, the end card, and any
   third-party platform watermark. One row each, with `text_role`,
   `position_band` and `evidence_source=vision`. This is a measurement, not a
   note — without it the text you just read exists nowhere a query can reach,
   and `ocr_text.csv` is empty whenever Tesseract is absent.
6. **Why people watch** — the pull mechanisms, each tied to a visible moment.

## Step 3 — Judge against benchmarks

Read `references/benchmarks.md`. It is deliberately short: everything that could
not name a year, a population and a sample size was deleted. Rules that prevent
known mistakes:

- Beat sync: report `cut_beat_sync_lift` **and** `cut_beat_sync_p`. Above 0.05
  the edit is indistinguishable from random placement, whatever the lift looks
  like.
- Safe zone: use `edge_energy_safe_index` (1.0 = uniform texture), never the raw
  share against a "70%" target. Skip entirely unless the video is 9:16.
- A NULL is not a zero, and a NULL column is not an unknown fact. If
  `ocr_available=false` you have no Tesseract reading — you still have your own,
  in `onscreen_text.csv`. Score from it and set `evidence_source=vision`.
- Everything platform-specific is judged per platform named in Step 0.

## Step 4 — Score the checklist

Read `references/persona_checklist.md`. Score all 36 items, each with a measured
evidence string, and set `applicable` honestly — absent-by-design is
`applicable=false`, not 0. Write `<audit_dir>/scores.csv`.

## Step 5 — Rank the fixes

Rank by `weight × score-gap`, restricted to `effort=timeline` first, then
`asset`. A `reshoot` fix never enters the top 3. Name the single best existing
shot to open with, by timestamp. Write `<audit_dir>/recommendations.csv`.

## Step 5b — Validate before you build

```bash
python "<skill_dir>/scripts/validate_audit.py" "<audit_dir>"
```

It exits non-zero on an illegal enum value, a Monetization gate opened by the
wrong objective, a below-benchmark item with no action, placeholder item text,
`stated` evidence nobody was asked for, non-tiling segments, or a missing
`run_id`. **Do not build the workbook on a failing audit** — an earlier run
rendered `objective = sell` into .xlsx and presented it as a result.

Stamp every analyst file with `run_id` (a new value per coding of this video)
and `coder_id`. They are part of the key: without them a second coding deletes
the first in the corpus.

## Step 6 — Build the workbook

```bash
python "<skill_dir>/scripts/build_workbook.py" "<audit_dir>"
```

It reads `scores.csv` and `recommendations.csv` from the same directory, which is
why they are written first.

## Step 7 — Deliver

Flowing prose, in the user's language, in this order:

1. **What this audit can and cannot see** — the file is not the account; face
   validity only; plus the contents of `limitations.txt`.
2. **Content** — what the video is, and its classification.
3. **Why people watch** — pull mechanisms tied to timestamps.
4. **Do not change these** — every item that scored 5, by name.
5. **Top 3 fixes** — each as an edit with a timestamp, with its effort tag.
6. **What the data shows** — the 3–6 most consequential findings, each with its
   number and its benchmark.
7. **Health index** — quote the formula, the per-persona table, and the weight
   distribution. It is craft-weighted; a video can sell nothing and still score
   above 90%. Never let the single number travel alone.

Offer to join `timeline_per_second.csv` to the user's retention export on
(`video_id`, `sec`). That join is what would turn any of this from inference into
measurement — and it is an association even then.

## Optional Step 8 — Corpus

```bash
python "<skill_dir>/scripts/merge_corpus.py" "<corpus_out>" --parent "<corpus_root>"
```

Upserts machine tables on `video_id` and analyst tables on `(video_id, run_id)`,
so two codings of one video coexist and their agreement is a query rather than a
manual diff. Add `--strict` to fail when any analyst table lacks `run_id`.
To remove a video: `--forget <video_id>` — run it BEFORE deleting the source
file, because the key is the file hash. Read `corpus_manifest.json.skipped` — tables that failed
validation are reported, never silently ingested. Before any cross-video query,
read the "Before you run a corpus query" section of `references/schema.md`:
stratify on the provenance flags, pool percentages rather than averaging them,
and report `n`. Treat every corpus finding as hypothesis generation until it is
joined to real outcome data.

## Scope

One video per run; for A/B, run twice and diff. This measures the file, not the
account. If the user wants only a sub-deliverable, still run Steps 1–2 — they are
what stop a wrong answer — but deliver only what was asked.

## Changes

- **1.3.0** — Indonesian trigger phrases removed under the English-only rule
  (using-dstack 0.7.0: models translate intent, so the phrases cost tokens
  without adding reach). The four Indonesian phrases in the description became
  English triggers of the same intent, and `metadata.dstack.triggers` now reads
  "analyze video". Preserved as data: the BCP 47 language codes in `taxonomy.md`
  (which include Indonesian), and the Indonesian prompts in `eval/cases.jsonl`,
  which are the proof that an English skill still matches an Indonesian request.

- **1.2.0** — Everything the second review round found, implemented. A machine
  validator (`validate_audit.py`) now parses the authoritative enum block in
  `taxonomy.md` and fails an audit on illegal values, a mis-opened Monetization
  gate, missing actions, placeholder item text, or `stated` evidence nobody was
  asked for. `semantic.csv` moved onto the `(video_id, run_id)` key and out of
  `corpus_videos` — it was the one table the run_id fix had missed, on the table
  whose disagreement motivated it. Sidecar harvest hardened: yt-dlp only,
  `creator_id` takes the durable key per platform, capture time from yt-dlp's
  own `epoch`, and caption/hashtags harvested. Workbook widths keyed by column
  name after a positional list silently shrank three free-text columns to 11-20
  chars. `subject_domain` gained factual/documentary terms; `drop_risk` no
  longer constant by construction; `is_branded` became
  `commercial_relationship`; MON-01 now times the CTA copy, not the card.
  22 executable regressions in `scripts/test_pipeline.py`.

- **1.1.0** — Added the vision text layer. The host has eyes; v1.0 read every
  caption in Step 2 and then left `ocr_text.csv` empty and two weight-3 items
  unscored, so the text existed only in prose. `onscreen_text.csv` now records
  it as data (role, position band, language, `evidence_source`), kept separate
  from the deterministic Tesseract table so provenance survives. Scoring rule 2
  changed from column-based to evidence-based. Restored the `Frame_features`
  sheet; added `OnScreen_Text`.

- **1.0.0** — Rebuilt after an 8-persona review. Contract now enforced rather
  than described: NULL never imputed to 0, provenance flags (`ocr_available`,
  `face_detection_available`, `motion_comparable`) on the master row and
  `video_id`/versions on every table, fixed column sets so tables UNION, output
  dirs cleaned before each run, and a refusal to fabricate duration-derived
  columns. Beat-sync baseline is now the union of beat windows plus an exact
  binomial p-value. Edge-energy regions are disjoint and area-normalised, and
  renamed from "saliency". Safe zones, duration and loudness are per platform.
  `genre` split into four orthogonal facets; `objective` and `applicable` added
  so a deliberate absence is not a defect; the self-scoring audit items left the
  index. `benchmarks.md` cut to figures that can name a year, population and n.
  Renamed from `video-analyzer` per ADR-0027 (old id kept as a trigger).
