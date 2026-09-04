# auditing-video — changelog

- **2.1.1** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 120 words (120-word tier: the trigger list is the discovery path); quoted trigger phrases kept.

- **2.1.0** — 2026-09-04: deliverable length calibrated (ADR-0031 rule 5): Opus 5 writes longer files than the task needs; one sentence scoped to the written document, never to progress text.
- **2.0.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **2.0.0** — Renamed from `auditing-short-video`; ADR-0027 keeps the old id a
  trigger. The rename is the smaller half. Ten of the thirty-six items are feed
  mechanics, so widening the name without gating them would score documentaries
  against a one-second attention test and hide the error inside one number.
  `format_class` now sits on `semantic.csv`, gates those ten to
  `applicable=false`, and must stratify any cross-video pooling — the classes
  have different denominators by construction. 8 new regressions.

  Building it exposed a bug nothing had caught: **pandas 3.0 stopped rendering
  NaN as `"nan"` under `astype(str)`**, disarming the `evidence_source` guard's
  own exclusion, so every honestly gated row failed the enum. The
  `applicable=false` path had no test, so a correct audit would have been
  rejected on any pandas 3 install. Fixed with `fillna("")`.

  Rebuilding a video as prompts is now `/reverse-engineering-video`; this skill
  stays the one that answers "is this any good".

- **1.3.2** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **1.3.1** — ADR-0030 list openness: the benchmark rules are open; the 36 checklist items are closed by design, because scores concatenate into one corpus and 35 or 37 is not comparable.
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
