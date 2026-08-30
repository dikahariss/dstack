# Short-form benchmarks — `benchmark_version: 3.0` (compiled 2026-08)

**Read this first.** v2 of this file opened with "Every figure below was verified
by web research" and then shipped a completion table that contradicted itself by
a factor of ~1.9, a caption statistic that reported a *headcount* as an *effect
size*, and eight sources of which exactly one was a primary study. Everything
below either fills all five columns — figure, year, population, n, source type —
or it has been deleted. The deletions are listed, because knowing a number was
removed is more useful than quietly not seeing it.

Record `benchmark_version` on every `scores.csv` row. A threshold that is
re-verified later must not be silently comparable with a score made against the
old one.

---

## What survived

| Figure | Year | Population | n | Source type |
|---|---|---|---|---|
| 80% of respondents said captions make them more likely to finish a video | 2019 | US adults 18–54, online survey | 5,616 | Primary study (Verizon Media / Publicis) |
| Same study, measured behaviour: +8% ad recall, +10% mobile ad memory quality | 2019 | as above | 5,616 | Primary study |
| YouTube Shorts max length 3 min | 2024– | Platform rule | — | Platform documentation |
| TikTok Creator Rewards eligibility requires video ≥60 s | 2026 | Platform rule | — | Platform documentation |
| Replays count toward average-percentage-viewed on Shorts (APV can exceed 100%) | 2026 | Platform behaviour | — | Platform documentation |
| Meta down-ranks visibly watermarked / recycled third-party content | 2022– | Platform rule | — | Platform announcement |

**The caption figure is the one to be careful with.** It is a proportion of
people who *said* something, not a lift in completion. Quote it as "80% of
surveyed US adults said captions make them more likely to finish" — never as
"captions raise completion by 80%". The behavioural effects the same study
actually measured are single-digit.

---

## Safe zones — per platform, and left is not optional

Fractions of the 9:16 canvas. `extract_features.py` uses these directly via
`--platform`; `generic` is the strictest envelope, so an unknown target is never
scored leniently.

| Platform | Top | Bottom | Left | Right |
|---|---|---|---|---|
| Instagram Reels | 14% | **35%** | 6% | 6% |
| TikTok | 7% | **25%** | 4% | 13% |
| YouTube Shorts | 6% | 21% (more when the description expands) | 4% | 11% |
| `generic` (unknown target) | 14% | 35% | 6% | 13% |

v2 applied one set — top 13%, bottom 22%, right 14%, **no left margin at all** —
to all three, and had no Shorts row despite naming Shorts in its own description.
Its 22% bottom sat *above* TikTok's real 25% line, so text between those two rows
scored "safe" while TikTok's UI covered it.

**Judge with `edge_energy_safe_index`, not a raw share.** The safe box is only
~56% of the frame, so uniform texture alone scores ~0.56 as a share. The index
divides by the box area: **1.0 = exactly what uniform texture gives**, above 1.0
means content is concentrated inside the safe area. And if `aspect_ratio` is not
9:16, this whole section describes a frame the feed never shows — the extractor
records that as a limitation and the item is scored `applicable=false`.

## Duration — per platform, no universal sweet spot

| Platform | Max | Notes |
|---|---|---|
| Instagram Reels | 3 min | — |
| TikTok | 10 min | **≥60 s for Creator Rewards eligibility** |
| YouTube Shorts | 3 min | — |

The v2 completion table (`<15 s ≈ 92%`, `15–30 s ≈ 84%`, with a parenthetical
`<20 s averages 68%`) is **deleted**. `<20 s` is the union of the first row and
part of the second, so any weighted average of them lies in [84, 92] — 68% is
arithmetically unreachable, and it is exactly the value of the `31–60 s` row
below it, which is the signature of a bucket-label mix-up. The same file then
claimed viewers who pass 3 s are 45% likely to reach 30 s, which caps 30-second
completion at 45% and contradicts the table by ~1.9×.

**Score duration against the platform's own rules and the video's objective, not
against a completion curve this file cannot source.** A TikTok creator monetising
through Creator Rewards must not be told to cut a 70-second video to 20 seconds.

## Audio loudness

Target **−14 LUFS integrated, true peak ≤ −1 dBTP**. This is the safe value
across all three platforms: each either normalises toward it or leaves a
correctly-mastered file alone.

Whether TikTok normalises in-feed playback is **disputed** in 2026 sources — some
report normalisation near −14 LUFS, at least one reports its normalisation pulls
hot masters below a clean −14 LUFS master. v2 stated "not loudness-normalized" as
dated fact and attached advice that rewarded pushing level. Do not chase loudness
on a contested claim; the downside is a crushed master that also plays quiet.

Integrated LUFS across a whole video is not a music-mastering target. A
dialogue-led clip with real silences reads low and may still be correct.

## Editing rhythm

No published universal cut-rate standard exists. Interpretive only:

- For process and "satisfying" genres the dwell **is** the product — hold key
  shots 1.5–2 s or more even inside a fast montage.
- Cut-on-beat counts only against the measured baseline **and** the p-value.
  `cut_beat_sync_p > 0.05` means the edit is indistinguishable from cuts placed
  at random. On 12 cuts the statistic moves in 8.3 pp steps, so a +18 pp "lift"
  is p ≈ 0.16 — not craft.
- `total_cuts` is sensitive to `param_scene_threshold`. On a clip with 11 known
  cuts, threshold 0.2 found 16 and 0.4 found exactly 11. Compare cut counts only
  across videos extracted at the same threshold.

## Loop

`loop_similarity` is an HSV-histogram correlation between the first and last
**sampled** frame. It is composition-blind — two unrelated shots sharing a
palette score high — and the last sampled frame can precede the true final frame.
Treat it as a hint, not a threshold. v2's `>0.6` / `<0.3` cut-points were the
tool author's, presented under a "verified by web research" heading; they are
**deleted**.

---

## Deleted from v2, and why

| Claim | Why it is gone |
|---|---|
| Completion-rate table (92/84/68/42%) | Internally contradictory; unreachable sub-bucket; no population or n |
| "Viewers decide within 3 s in >70% of cases" | No source anywhere in the file |
| "70–85% retention at 3 s = optimal (TikTok data)" | Traced to an SEO blog of a TTS tool; no methodology, no n; TikTok publishes no such figure |
| ">85% = viral potential, ~2.2–2.8× more views" | The 2.8× upper bound appears in no locatable source; precision manufactured |
| "Pass 3 s → 65% reach 10 s, 45% reach 30 s" | Unsourced, and contradicts the completion table in the same file |
| "Facebook ~85% of views without sound" | Digiday 2016, two publishers' self-reported desktop/mobile autoplay numbers; Meta never published it; Facebook has never exposed sound state in Insights |
| "~56% cross-platform sound-off / TikTok ~73% sound-on" | Set only coheres if Facebook supplies ~45–50% of all short-form views; the 73% matches a Kantar figure about *ad attention*, not playback state |
| "Median shot <0.5 s is below conscious processing" | Psychophysics claim stated as fact with no citation, sitting three lines under the file's own "no universal standard exists" |
| `loop_similarity` 0.6 / 0.3 thresholds | Author cut-points on an unvalidated statistic, presented as researched |

## The honest frame for the whole file

Nothing here has been shown to predict realised performance. These are platform
rules, one survey, and interpretive craft heuristics. The health index built on
top has **face validity only** — no threshold and no item in this package has
ever been tested against how a video actually performed. Say that in the report,
in those words, and treat any corpus finding as hypothesis generation until it is
joined to real outcome data.
