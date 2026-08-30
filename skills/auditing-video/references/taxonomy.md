# Semantic taxonomy (controlled vocabularies) — `taxonomy_version: 3.1`

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
`education_academic` `history_archaeology` `science_nature` `documentary_factual`
`parenting_family` `music_dance` `sports` `automotive` `agriculture_fishery`
`religion_spiritual` `news_politics` `comedy_entertainment` `personal_life`
`other`

> `history_archaeology`, `science_nature` and `documentary_factual` were added in
> 3.1. Two independent codings of one National Geographic archaeology promo
> landed in `comedy_entertainment` and `education_academic` — two unrelated
> IAB Tier-1 buckets — because neither term existed. Neither coder used `other`,
> so the 5%-`other` governance trigger would never have fired: the vocabulary
> hole shipped as clean-looking wrong data. **When no term fits, use `other`.
> That is the mechanism by which this file learns it is incomplete.**

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
>
> Within the speaker-relation tier the precedence rule is silent, so use the
> **eyeline test**: if the subject looks into the lens and addresses the viewer,
> `talking_to_camera`; if the eyeline is off-lens and the subject is answering
> someone, `interview` — even when the interviewer is never seen or heard. A
> press-junket answer is an `interview`.

### `commercial_relationship` (pick one) — replaces the `is_branded` boolean

`none` — no commercial relationship
`creator_sponsored` — an independent creator paid or gifted by a third party
`brand_owned` — the brand's own channel, own product
`first_party_promo` — the publisher promoting its own catalogue on its own
channel, often with hired talent (a network promoting its own series)
`affiliate` — commission on third-party sales

> A boolean could not tell these apart, and every retention and conversion
> benchmark in the checklist was written for `creator_sponsored`. Applying them
> unchanged to `first_party_promo` is why a network promo scores "adequate" on
> questions nobody asked of it. `is_branded` is retained as a derived
> convenience: true for anything other than `none`.

### `subgenre` (one value, governed)

lowercase, snake_case, **singular**, **English**, one value only, scoped under
`subject_domain`. `shaped_canvas_painting`, not `Shaped Canvases` or
`lukisan_kanvas`. Without a language rule this field fragments the moment a
second analyst works in another language — which is exactly the field sold as
the searchable tag.

---

## `format_class` — decides which items apply at all

The instrument was calibrated on short vertical video. Ten of its thirty-six
items only mean something there, so a format class has to be set before scoring
or the audit measures a documentary against a feed video's rules.

| Value | What it is |
|---|---|
| `short_vertical` | A vertical clip made for a feed: Reels, TikTok, Shorts. All 36 items apply. |
| `long_form` | Anything over roughly three minutes, or any landscape piece made to be watched deliberately rather than scrolled past. Ten items gate off. |
| `other` | Square social video, a stitched carousel, a screen recording with no feed target — anything that is neither. Ten items gate off; say why in `notes`. |

Duration alone does not decide it. A 20-second landscape product film is
`other`, not `short_vertical`; a four-minute vertical vlog cut for TikTok is
`short_vertical`. Ask the user, then record it.

The ten items that gate to `applicable=false` outside `short_vertical`:
CRD-01, CRD-02, CRD-03, CRD-04 (the hook window), CST-02 (platform duration
rules), CST-05 (loop-ability), GRW-01 (retention inference), GRW-05 (safe zone),
BRD-04 (third-party watermark), MON-03 (paid-media ad specs). **Closed by
design** — the list is what makes two audits comparable, so it changes by
editing this file and bumping `taxonomy_version`, never mid-run. The other 26
are craft and rights items that hold at any duration.

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
`character_charisma` (the person themselves, earned over time) ·
`talent_draw` (recognition of a already-famous face; the viewer stops before
any charisma has been performed) · `suspense_stakes` (will it work)

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

Judge the RISK, never the POSITION. The positional clause in 3.0 (`high` if
"inside 0–3 s") made `high` automatic for segment 1 of every video, because
`hook_reveal` is mandated to start at 0 — a constant cannot discriminate, and
CST-04 (weight 3) reads this column.

`low` — no context jump; pace steady; the viewer always knows what they are
looking at.
`medium` — a context jump the viewer can still follow, or a noticeable pace dip.
`high` — an UNEXPLAINED context jump, a dead opening (first second below the
video's own median motion AND below its median audio), or a promise the hook set
that is still unpaid past ~50% of runtime.

> The unpaid-promise clause does NOT apply when `pull_mechanisms` leads with
> `transformation_loop` or `suspense_stakes`, or when `hook_opens_loop=true` and
> the loop is the product. Withholding is the format there, not a defect.

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

## Machine-readable vocabulary — AUTHORITATIVE

Everything above explains these values to a human. This block IS the contract:
`scripts/validate_audit.py` parses it and nothing else, so there is exactly one
source of truth and no heuristic that can drift. Adding a term means editing
here AND above, and bumping `taxonomy_version`.

```enums
subject_domain: art_craft cooking_food beauty_fashion fitness_health tech_gadget gaming travel_place home_interior pet_animal finance_business education_academic history_archaeology science_nature documentary_factual parenting_family music_dance sports automotive agriculture_fishery religion_spiritual news_politics comedy_entertainment personal_life other
intent: teach demonstrate entertain inform persuade sell document other
production_mode: montage_fast_cut single_take voiceover_broll talking_to_camera screen_recording slideshow_text pov interview split_screen other
commercial_relationship: none creator_sponsored brand_owned first_party_promo affiliate
format_class: short_vertical long_form other
objective: awareness engagement traffic lead_gen sales community_building brand_identity personal_archive unknown
funnel_stage: top middle bottom not_applicable
hook_device: result_first question_tease bold_claim midaction_start relatable_setup curiosity_object text_promise no_hook other
pull_mechanisms: transformation_loop curiosity_gap sensory_satisfaction novelty relatability aspiration_status humor utility emotion_story controversy_debate character_charisma talent_draw suspense_stakes
segment_type: hook_reveal setup_context process_main escalation demonstration detail_work finishing payoff_reveal cta_outro transition other
drop_risk: low medium high
platform_targets: instagram_reels tiktok youtube_shorts facebook_reels
text_role: caption kicker branding cta credit watermark_thirdparty ui_chrome other
position_band: top upper_mid center lower_mid bottom
evidence_source: computed vision stated inferred judgment
```
