# Semantic taxonomy (controlled vocabularies) — `taxonomy_version: 3.0`

Free text does not aggregate; enums do. Use EXACTLY these snake_case values.
Record `taxonomy_version` on every `semantic.csv` and `segments.csv` row: a term
whose scope narrows later must not be silently comparable with its older self.

**Governance.** The owner of this file owns the vocabulary. Adding, deprecating,
merging or renaming a term bumps `taxonomy_version` (independent of the data
`schema_version`, which only moves when columns or types change). When `other`
exceeds 5% of any facet in a corpus year, that is the trigger to add terms — and
promotion must re-code the historical `other` rows, not strand them.

---

## Genre is four questions, not one

v2 had a single 27-value `genre`. A paid Sephora Reel where the creator opens the
box, applies the foundation and reads a discount code is *simultaneously and
correctly* unboxing, beauty, product demo, product review and an ad. One slot,
five defensible answers, and the runner-ups were never stored — so the corpus
could not be repaired without re-watching everything. Four orthogonal facets
instead:

### `subject_domain` (pick one) — what it is ABOUT

`art_craft` `cooking_food` `beauty_fashion` `fitness_health` `tech_gadget`
`gaming` `travel_place` `home_interior` `pet_animal` `finance_business`
`education_academic` `parenting_family` `music_dance` `sports` `automotive`
`agriculture_fishery` `religion_spiritual` `news_politics` `comedy_entertainment`
`personal_life` `other`

### `intent` (pick one) — what it is FOR

`teach` (viewer can do it after) · `demonstrate` (show it working) ·
`entertain` · `inform` (report/explain, no how-to) · `persuade` (change a view) ·
`sell` (drive a purchase) · `document` (record, no argument) · `other`

### `production_mode` (pick one) — how it was MADE

`montage_fast_cut` `single_take` `voiceover_broll` `talking_to_camera`
`screen_recording` `slideshow_text` `pov` `interview` `split_screen` `other`

> If two apply — a one-shot piece to camera is both `single_take` and
> `talking_to_camera` — the precedence is: **speaker relation beats cut density
> beats capture method**. So that clip is `talking_to_camera`.

### `is_branded` (boolean)

Commercial status is orthogonal to all three facets above. It is never a genre.

### `subgenre` (one value, governed)

lowercase, snake_case, **singular**, **English**, one value only, scoped under
`subject_domain`. `shaped_canvas_painting`, not `Shaped Canvases` or
`lukisan_kanvas`. Without a language rule this field fragments the moment a
second analyst works in another language — which is exactly the field sold as
the searchable tag.

---

## Objective and funnel — ask BEFORE scoring

Without these, an awareness video that correctly carries no CTA loses points for
being built right, and nothing records that the omission was deliberate.

`objective`: `awareness` `engagement` `traffic` `lead_gen` `sales`
`community_building` `brand_identity` `personal_archive` `unknown`

`funnel_stage`: `top` `middle` `bottom` `not_applicable`

When `objective` is `awareness`, `engagement`, `community_building`,
`brand_identity` or `personal_archive`, the Monetization items are scored
`applicable=false` — not zero.

---

## Hook: three booleans plus a device

`benchmarks.md` states that a hook does three jobs at once. A single-select
`hook_type` therefore guaranteed every good hook was recorded as one third of
itself, in the field most likely to be crossed with retention.

- `hook_interrupts` (bool) — pattern interrupt: a visual or audio jolt
- `hook_promises` (bool) — states or shows what the viewer will get
- `hook_opens_loop` (bool) — poses something only watching resolves

`hook_device` (pick one): `result_first` `question_tease` `bold_claim`
`midaction_start` `relatable_setup` `curiosity_object` `text_promise` `no_hook`
`other`

> `midaction_start` vs `no_hook`: if the opening action is itself legible as
> interesting without context, it is `midaction_start`; if the video merely
> begins, it is `no_hook`.

## `pull_mechanisms` — why people watch

Pick 1–4, pipe-separated. **Order is by share of runtime the mechanism operates
over**, strongest first — "strongest" alone was unreproducible.

`transformation_loop` (raw → finished; the brain wants the end) ·
`curiosity_gap` (a question only watching answers) · `sensory_satisfaction`
(precision, texture, flow) · `novelty` · `relatability` · `aspiration_status` ·
`humor` · `utility` (save-driver) · `emotion_story` · `controversy_debate` ·
`character_charisma` · `suspense_stakes` (will it work)

## `segment_type` — with definitions, because labels alone drift

| Value | Means | Not |
|---|---|---|
| `hook_reveal` | First 0–3 s; the attention claim | Any later reveal |
| `setup_context` | Establishes materials, stakes, or who | Work being done |
| `process_main` | The bulk primary operation | A close-up detail pass |
| `escalation` | **Editing pace rises** (shorter shots, rising music) | Task difficulty rising |
| `demonstration` | Showing the thing working/being used | The finished-object reveal |
| `detail_work` | Close-up fine-grained work | Any wide process shot |
| `finishing` | Final touches before the reveal | The reveal itself |
| `payoff_reveal` | The finished result presented as the payoff | A mid-video partial |
| `cta_outro` | Explicit ask or sign-off | A payoff that happens to end |
| `transition` | Bridging device with no content of its own | A cut |
| `other` | Genuinely none of the above | A lazy default |

> `transformation_step` was removed: every step of a process transforms
> something, so it was never distinguishable from `process_main`.

Segments **tile the video exhaustively and without overlap**. Types may repeat.
Exactly one `hook_reveal`, and it starts at 0.

## `drop_risk`

`low` — no context jump, pace steady, outside 0–3 s.
`medium` — a context jump the viewer can still follow, or a pace dip.
`high` — inside 0–3 s, or an unexplained context jump, or the promise set by the
hook is still unpaid past ~50% of runtime.

## `platform_targets` — multi-value

Pipe-separated from `instagram_reels` `tiktok` `youtube_shorts`
`facebook_reels`. Every platform-specific benchmark (safe zone, duration,
loudness, caption culture) is then evaluated **per named platform**. v2's `multi`
and `unknown` were legal values that defeated the one thing the field existed
for. If the target is genuinely unknown, leave it empty and score the
platform-specific items `applicable=false`.

## Languages

`spoken_language` / `onscreen_language`: **BCP 47** (`id`, `en`, `id-ID`,
`zh-Hans`) — platforms emit BCP 47, and bare ISO 639-1 cannot express the
distinctions a join will need. `none` is a real measurement (no speech). Unknown
is **null**, not a value.

## Booleans

`creator_visible, product_visible, cta_present, attribution_present,
third_party_watermark, is_branded, hook_*`: `true`/`false`.

> `third_party_watermark` is the one to get right. A file exported from another
> platform carries that platform's watermark and handle, and Meta down-ranks
> recycled content. It is a defect, never a branding strength.

## Crosswalk

`subject_domain` is deliberately close to IAB Content Taxonomy Tier-1 so an
external join is possible later. `hook_*`, `pull_mechanisms`, `segment_type` and
`drop_risk` are invented because no standard covers short-form craft constructs —
that invention is justified; inventing a genre vocabulary was not.

## Coding discipline

Two analysts using this file will still disagree unless the corpus measures it.
Before trusting any cross-video aggregate of analyst-written fields, double-code
~20 videos in independent sessions and report per-field agreement. Treat a field
with low agreement as unfit for aggregation, no matter how well-defined it looks.

## text_role (onscreen_text.csv; pick one)

`caption` — burned-in transcription of spoken content
`kicker` — on-screen phrase that is NOT spoken (hook text, label, stat)
`branding` — the publisher's own logo, wordmark or handle
`cta` — an explicit ask: where to watch, buy, follow, link
`credit` — copyright, licence, attribution to a third party
`watermark_thirdparty` — another platform's bug (TikTok, CapCut, Shorts). This
is the value BRD-04 reads. It is never `branding`.
`ui_chrome` — text belonging to a device or app shown inside the frame
`other`

## position_band (fraction of frame height, 9:16)

`top` (0-14%) · `upper_mid` (14-40%) · `center` (40-62%) ·
`lower_mid` (62-75%) · `bottom` (75-100%)

The bands are cut at the platform UI lines, not into equal thirds: on Instagram
Reels the caption/CTA stack covers the bottom 35% (everything below 65%), so
`lower_mid` and `bottom` are the at-risk bands and thirds would hide that.
