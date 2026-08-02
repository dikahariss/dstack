# Multi-persona audit checklist — 36 scored items, 7 personas

Save results as `scores.csv` with columns exactly: `video_id, item_id, persona,
pillar, item, weight, applicable, score, evidence, action` (+ `analyst_model,
scored_at_utc, benchmark_version`).

`item_id` is the stable cross-language aggregation key — never translate,
renumber, or reuse it. `persona` and `pillar` are stored as the **English**
values below and translated only when rendering the report; a translated
grouping key fragments every per-persona corpus aggregate. Item text, evidence
and actions are written in the user's language.

## The three rules that stop a wrong score

**1. `applicable=false` is a real answer.** An element absent *by design* is not
a defect. Score `applicable=false` — the item leaves both the numerator and the
denominator — and put the justification in `evidence`. Without this column, v2's
ranking (`weight × score-gap`) was maximised by exactly the deliberate-absence
case: the five items that hit 0 by absence all carry weight 3, so a silent,
textless, CTA-free art video was mathematically guaranteed to be told "add
on-screen text, add captions, add a CTA". That is advice to demolish the
restraint that was the work.

**2. Score from EVIDENCE, and name where the evidence came from.** Not from
columns. The two are different, and confusing them throws away the best evidence
you have. An empty `ocr_text.csv` means Tesseract did not run — it never means
the video has no on-screen text. You have vision: read the contact sheets, write
what you find into `onscreen_text.csv` with `evidence_source=vision`, and score
GRW-02 / GRW-03 / ACC-01 from that. Do the same for faces (CRD-04) when
`face_detection_available=false`, and for caption position (GRW-05) — the
`edge_energy_*` columns measure where the *texture* is, not where the *text* is,
so on a real Reel they can pass a video whose captions sit under the platform UI.

Record `evidence_source` on every score, from this exact set:
`computed` (you can name the column and the value), `vision` (you read it off
the contact sheets), `stated` (**the user answered a question you asked — record
the question and the answer in `evidence`; you may not use this token for your
own inference**), `inferred` (a defensible reading with no direct evidence — the
only legal token for GRW-01), `judgment` (a craft opinion against no threshold).

Two codings of one video disagreed on this column with kappa = 0.318 — the worst
field in the audit, and the only column a pipeline could use to filter opinion
out of a feature set. `computed` that cannot name a column is the failure mode. Mark `applicable=false` only
when NO source could answer it — GRW-04 (trending audio) and ACC-03 (music
licence) are the genuine cases, because neither the file nor the sheets contain
the answer. Read `limitations.txt` first: it says which machine measurements
ran, not which facts are knowable.

**3. Gate on the stated objective.** When `semantic.csv.objective` is
`awareness`, `engagement`, `community_building`, `brand_identity` or
`personal_archive`, the Monetization items are `applicable=false`. A top-of-funnel
video that correctly carries no CTA must not be docked for being built right.

## Scoring rubric

| | Meaning |
|---|---|
| **0** | Present but absent-by-omission where the objective needed it |
| **1** | Present but broken (e.g. beat sync with `cut_beat_sync_p > 0.05`) |
| **2** | Below benchmark with a measurable gap |
| **3** | Adequate; meets the minimum |
| **4** | Above benchmark |
| **5** | Exemplary — a strength to preserve and name back to the creator |

Weights: 3 = directly moves distribution/retention/conversion; 2 = meaningful
lever; 1 = hygiene. **Weights are fixed here**, not per-video — a corpus with
per-row weights compares ratios built from different weight vectors.

## The `action` column is a contract

**This is machine-checked.** `validate_audit.py` fails an audit where any item
with `applicable=true` and `score < 5` has an empty `action`, or where `item` is
a placeholder rather than the item's real text. One pass shipped 23
below-benchmark items with zero actions and 36/36 titles reading `item CRD-01`;
it was the more rule-conformant pass and the one no human could act on.

Every non-5 item needs an action written as
`<verb> <what> at <timestamp>` using footage that already exists — or, for an
item scoring 4 (already above benchmark) where no edit is warranted, the literal
string `no change needed`. The column may never be empty: empty means nobody
decided, and `no change needed` means somebody did. Do not invent a fix to fill
it; that dilutes the ranked list, which is the one part a creator reads — `trim`,
`reorder`, `hold`, `overlay`, `retime`, `cut` — or the literal string
`requires new footage`. "Strengthen the hook" is not an action; "cut 0:47–0:49 to
the head and push the current opening to 0:02" is. Every recommendation is then
tagged `effort` = `timeline` (existing footage), `asset` (new overlay/caption/
audio) or `reshoot`. **A `reshoot` item never enters the top 3** — it goes to a
separate "next time you shoot" list.

---

## Creative Director (10 items, weight 24)

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| CRD-01 | Hook | Visual motion in the first second | 3 | `motion_score` at t=0.5 s vs `motion_median`; null if `motion_comparable=false` |
| CRD-02 | Hook | Audio energy in the first second | 3 | `audio_dbfs` at t=0 vs plateau |
| CRD-03 | Hook | Result or promise shown early | 3 | contact sheets 0–3 s; needs `hook_frames_n >= 4` |
| CRD-04 | Hook | Human face within first 3 s | 2 | `face_count` in the hook window; if detection is unavailable, look at the first contact sheet and record `evidence_source=vision` |
| CRD-05 | Pacing | Shot duration allows processing | 3 | `shot_median_s`, `shot_pct_under_0_5s` vs the genre's own norm |
| CRD-06 | Pacing | Cuts synced to beat above chance | 2 | `cut_beat_sync_lift` **and** `cut_beat_sync_p`; p>0.05 caps this at 1 |
| CRD-07 | Pacing | Rhythm variation (breathing room) | 2 | `cuts_in_sec` distribution |
| CRD-08 | Visual | Image quality consistent | 2 | `sharpness` curve; use the median |
| CRD-09 | Visual | Colour choice fits the stated intent | 2 | `saturation_mean`, `colorfulness_median` **vs the video's own genre and intent** — there is no colour benchmark, so this is explicitly a judgment |
| CRD-10 | Visual | Deliberate colour/act structure | 2 | `dominant_color` arc across seconds |

## Content Strategist (6 items, weight 15)

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| CST-01 | Structure | Format fits the named platform | 3 | aspect/resolution/codec vs `platform_targets` |
| CST-02 | Structure | Duration fits platform rules and objective | 3 | `duration_s` vs the platform table; TikTok monetisation needs ≥60 s |
| CST-03 | Structure | Clear narrative acts | 2 | your `segments.csv` |
| CST-04 | Structure | Drop-risk transitions mitigated | 3 | `segments.csv.drop_risk`, taxonomy 3.1+ only. The 3.0 rule made segment 1 `high` on every video, so this item was scoring a constant |
| CST-05 | Structure | Loop-ability | 2 | `loop_similarity` as a hint, plus your own look at first vs last frame |
| CST-06 | Message | One clear core message | 2 | can you state it in one sentence? |

## Growth / Distribution (7 items, weight 18)

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| GRW-01 | Retention | Watch-time signals protected | 3 | hook + pacing findings; **inference only — mark it as such** |
| GRW-02 | Distribution | On-screen text carries the message sound-off | 3 | `onscreen_text.csv` rows with `text_role=caption\|kicker`; fall back to `seconds_with_text_pct` when OCR ran |
| GRW-03 | Distribution | Machine-readable keywords present | 3 | the `text` column of `onscreen_text.csv` (brand, title, topic words) |
| GRW-04 | Distribution | Audio supports discovery | 2 | **Not scoreable from the file.** Ask the user what sound was used and whether it came from the in-app library. No answer → `applicable=false` |
| GRW-05 | Distribution | Critical content inside the safe zone | 2 | `onscreen_text.csv.position_band` — `lower_mid`/`bottom` is at risk. `edge_energy_safe_index` is corroboration only; it measures texture, not text |
| GRW-06 | Interaction | Comment trigger exists | 3 | a content-intrinsic open loop. "Comment X below" / "tag 3 friends" is engagement bait and is demoted — do not recommend it |
| GRW-07 | Interaction | Save/share trigger exists | 2 | screenshot-worthy frame, reference value |

## Brand (4 items, weight 9)

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| BRD-01 | Identity | Own attribution visible and not UI-occluded | 2 | handle/watermark in `ocr_text`, positioned outside the platform margins |
| BRD-02 | Identity | Recognisable visual signature | 2 | consistent style across sheets; check against the creator's other audits if any exist |
| BRD-03 | Identity | Differentiator communicated | 2 | is the unique element named or shown? |
| BRD-04 | Identity | **No third-party platform watermark** | 3 | any `onscreen_text.csv` row with `text_role=watermark_thirdparty`; that is how the boolean is determined. A TikTok watermark on a file posted to Reels is a reach cap, not a branding strength. Present → score 0 and make re-export from source the top fix |

## Performance / Monetization (3 items, weight 7)

Scored **only** when `objective` is `traffic`, `lead_gen` or `sales`. Otherwise
all three are `applicable=false`.

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| MON-01 | Conversion | Explicit CTA present and timed | 3 | **Time the CTA COPY, not the card.** A platform logo is not an ask. Find the frame where the offer text ("now streaming", "link in bio", "shop now") first becomes legible, and report its dwell as a share of runtime. Measured on one real promo: the card appeared at 31.8 s and the offer line at 35.0 s — 1.2 s of 36.2 s (3.3%), and both codings scored it 5/5 off the card |
| MON-02 | Conversion | Commercial path visible | 2 | price/availability/link cues |
| MON-03 | Conversion | Paid-media readiness | 2 | three checks: ad-spec safe zone, licensed audio (see ACC-03), platform ad duration cap. Any unknown → `applicable=false` |

## Community (2 items, weight 4)

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| COM-01 | Conversation | Deliberate information gap | 2 | distinct from GRW-06: this is an *unanswered* question, not a prompt to comment |
| COM-02 | Conversation | Series or sequel potential | 2 | `semantic.csv.series_id`; can this spawn part 2? |

## Accessibility & Rights (4 items, weight 8)

| ID | Pillar | Item | Weight | What to measure |
|---|---|---|---|---|
| ACC-01 | Access | **Spoken content** is captioned | 3 | `onscreen_text.csv` rows with `text_role=caption` covering the spoken runtime. N/A only when `spoken_language = none` |
| ACC-02 | Access | Text contrast adequate | 1 | if text exists, check contrast in the sheets |
| ACC-03 | Rights | Music licence clear | 2 | **Not verifiable from the file.** Ask the user. No answer → `applicable=false` |
| ACC-04 | Rights | Third-party works in frame cleared | 2 | scan sheets for other people's art, brands, or bystanders |

---

## Not scored — audit provenance

These record whether the audit itself is usable. They are **not** in the health
index: v2 scored them, and since they are satisfied by the act of running the
skill, every video received a guaranteed 4.5% floor on a number named "content
health".

- `PRV-01` Baseline metrics captured — yes by construction
- `PRV-02` Join-ready with performance data — `(video_id, sec)` exists
- `PRV-03` A/B hypothesis named — did the analyst name a testable variant?

## The health index — the formula, so the report can quote it

```
weighted     = weight × score          per item where applicable = true
weighted_max = weight × 5              per item where applicable = true
health_index = 100 × SUM(weighted) / SUM(weighted_max)
```

Total weight across all 36 items is **85** (max 425), distributed:
Creative Director 28.2%, Growth 21.2%, Content Strategist 17.6%, Brand 10.6%,
Accessibility 9.4%, Monetization 8.2%, Community 4.7%.

**State that distribution in the report.** It is craft-weighted: a video can
score 0 on all three Monetization items and still ceiling above 90%. That is a
defensible weighting for a craft review and a misleading one for a commercial
review, so report the per-persona indexes *alongside* the composite and never let
the single number travel alone.

The index is a weighted mean of ordinal analyst judgments. It is not a
measurement, it moves in 0.24 pp steps, and it has never been validated against
realised performance. Do not report an "estimated post-fix index" to one decimal
as if it were a forecast.

## Three rules for reporting the index

**1. Never compare the index across videos until the `applicable` mask's own
reliability is measured.** The mask is a coding decision, not metadata. On one
real video the same score vector spans **36.67% to 100.00% — 63.33 pp — under
mask choice alone, with no score changed**. Report the mask's kappa next to the
index, or do not report the index.

**2. Print the noise band.** Two codings of the same video by the same model in
the same session moved the index 2.12 pp. Simulated at the observed disagreement
rate the index has sd ≈ 1.2 pp and a 95% band ≈ 4.8 pp wide. **Any difference
narrower than about 2.4 pp is coder noise.** Say so wherever the number appears.

**3. Report per-persona `n`, and suppress any persona below 3 applicable items.**
In one comparison Monetization *rose* 9.14 pp in the stricter pass, purely
because its own worst item left the denominator — leaving n=2. The composite
pathology this checklist removed at item level reappears at persona level.

Also: block `evidence_source` from every corpus aggregate until it passes a
reliability gate (kappa >= 0.67). It currently does not.

## After scoring

1. Write `scores.csv`, then `recommendations.csv`, **then** run
   `build_workbook.py` — the workbook reads both.
2. Report the health index with its formula, the per-persona table, and the
   CRITICAL items.
3. Rank the top 3 by `weight × score-gap`, **restricted to `effort=timeline`
   first**, then `asset`. Prefer fixes that solve distinct problems — not fixes
   that happen to be entered against several personas.
4. Name every score-5 item back to the creator as "do not change these".
