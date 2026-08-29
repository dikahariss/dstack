# Discovery — generating images from the CLI, on the subscriptions we already pay for

Type: **measurement report**, not a requirements discovery. Every number below
was produced by a command run on this machine on 2026-08-29; nothing is quoted
from a vendor page unless the row says so.
Status: VERIFIED
Date: 2026-08-29 · Requested by: repo owner

## 0. Why this exists

`/home/haris/KODING/ShortVideo` already generates images by shelling out to
`codex`, with `agy` tried first (`tools/lib/imagegen.py:52`). Only the codex half
was ever written up
(`ShortVideo/docs/reference/codex-image-generation.md`, verified 2026-08-25 on
codex-cli 0.149.1). The agy half entered the code path with no measurement behind
it, and the question of whether a better route exists was never asked.

This report answers three things before a dstack skill is written: what actually
works on the three subscriptions the owner holds (Antigravity, ChatGPT/Codex,
Claude Code), what each route really returns, and where the ceiling is.

## 1. Versions under test

| Binary | Version | Auth |
|---|---|---|
| `codex` | codex-cli 0.150.1 | `~/.codex/auth.json` → `auth_mode: chatgpt`, `OPENAI_API_KEY: null` |
| `agy` | 1.1.22 | Antigravity Google login, local |
| `gemini` | 0.57.0 | `~/.gemini/oauth_creds.json` present |
| `claude` | 2.1.251 | — |

## 2. Result table — six routes, two of them work

| Route | Works? | Wall clock | Output | Cost |
|---|---|---|---|---|
| `codex exec` → built-in `image_gen` | **YES** | 73–80 s | PNG **941×1672** sRGB, 2.05 MB | ChatGPT subscription quota |
| `agy --print` → built-in `generate_image` | **YES** | 28–122 s | JPEG **768×1376** sRGB, 0.85–0.92 MB | Antigravity account quota |
| `gemini -p` (OAuth, free tier) | **NO** | 4 s, exit 55 | — | — |
| `gemini` + `nanobanana` extension | **NO** as configured | — | 1K/2K/4K | needs `NANOBANANA_API_KEY` (metered Gemini API) |
| `codex` fallback CLI `scripts/image_gen.py` (`gpt-image-2`) | **NO** as configured | — | up to 2160×3840 | needs `OPENAI_API_KEY`, absent on this machine |
| Claude Code | **NO** | — | — | no image-generation tool exists |

The `gemini` failure is not a misconfiguration and cannot be fixed locally:

```
IneligibleTierError: This client is no longer supported for Gemini Code Assist
for individuals. To continue using Gemini, please migrate to the Antigravity
suite of products: https://antigravity.google
  tierId: 'free-tier'   reasonCode: 'UNSUPPORTED_CLIENT'
```

Google folded the individual free tier of Gemini CLI into Antigravity. Anything
built on `gemini` OAuth is dead on arrival; `agy` **is** the surviving path to
the same models.

## 3. Route A — `codex exec`

```bash
codex exec --sandbox read-only --skip-git-repo-check \
  --output-schema schema.json -o out.json - < prompt.txt
```

`schema.json` is `{path, width, height}`, all required, `additionalProperties:
false`. Read `out.json`; never scrape stdout — agent logs are interleaved with
the answer.

| Property | Measured |
|---|---|
| Size | **941×1672** (1.57 MP) on both runs |
| Format | PNG, rgb24, lossless |
| Location | `$CODEX_HOME/generated_images/<session>/exec-<uuid>.png` — filename not choosable |
| Time | 80 s, 73 s |
| Tokens | ~34.7 k per call |
| Text leakage | none observed |

**Size cannot be requested — reconfirmed on 0.150.1.** A prompt demanding
`2160x3840`, quoting the tool's own validity rules back at it, still returned
941×1672. The built-in tool rounds to an internal pixel budget of ~1.5 MP
whatever the prompt says. The published `gpt-image-2` size grid (max edge 3840,
edges multiples of 16, ratio ≤ 3:1, 655,360–8,294,400 px, from
`~/.codex/skills/.system/imagegen/references/image-api.md`) applies to the
**fallback CLI with an API key**, not to the built-in tool. Two upstream issues
describe the same behaviour: openai/codex#19175 and #28723.

## 4. Route B — `agy --print`

```bash
agy --dangerously-skip-permissions \
  --output-format json --json-schema schema.json \
  --print "$(cat prompt.txt)"
```

The answer arrives as `.structured_output` in the JSON on stdout. `--add-dir DIR`
is required before agy can read a local reference file.

| Property | Measured |
|---|---|
| Size | **768×1376** (1.06 MP) on all four runs |
| Format | JPEG — **lossy**, and not selectable |
| Location | `~/.gemini/antigravity-cli/brain/<conversation-id>/<name>_<epoch-ms>.jpg` |
| Time | 122 s, 28 s, 31 s, 108 s |
| Tokens | ~47 k total (36.5 k cache-read) on the first call |

The underlying tool call, lifted from the run transcript
(`.system_generated/logs/transcript_full.jsonl`):

```json
{"name": "generate_image",
 "args": {"AspectRatio": "9:16", "ImageName": "fisherman_at_dawn",
          "Prompt": "…", "toolAction": "…", "toolSummary": "…"}}
```

**There is no size parameter.** `AspectRatio` is the only geometry control. Two
separate prompts demanding exact pixels — one asking for 4K/3840 long edge, one
demanding "exactly 1080 x 1920, do NOT return a square" — both returned
768×1376. The public `agy-image` skill (github.com/Openclaw-Metis/agy-image)
advertises "exact-pixel sizing"; reading its own text, it gets there by
**cropping and scaling with ffmpeg afterwards**, not by generating at that size.
That is resampling, not resolution.

### 4.1 What agy is better at

Two things the codex route cannot do, both verified:

- **Local grounding.** The same prompt ("small Indonesian harbour") gave codex a
  generic tropical waterfront; agy produced batik shirt, ikat headband, jukung
  outriggers, a wooden fish basket. Nano Banana's world knowledge shows.
- **Character consistency.** Given the first image via `--add-dir` and asked for
  the same man in a new pose, agy held the face, the shirt pattern, the headband
  and the harbour across a separate call (108 s). For multi-shot video this is
  the difference between a sequence and a slideshow.

### 4.2 What agy is worse at

- **Text leakage.** Despite `Constraints: no text, no logo, no watermark`, run 1
  lettered a boat hull "PUTRA LAU…". The constraint is advisory, not enforced.
- **JPEG.** Every asset starts one generation of lossy compression down.
- **Housekeeping.** 42 images have accumulated under
  `~/.gemini/antigravity-cli/brain/` from past runs. Nothing prunes them.

## 5. The ceiling nobody clears

| | Pixels | Share of a 1080×1920 frame |
|---|---|---|
| Target (vertical video frame) | 2,073,600 | 100% |
| codex `image_gen` 941×1672 | 1,573,352 | **76%** |
| agy `generate_image` 768×1376 | 1,056,768 | **51%** |

Neither subscription route reaches a full-screen vertical frame. ShortVideo
already measured what that costs downstream: an image at this size retains ~67%
of the detail of a 2160×3840 source, and reducing the Ken Burns zoom does not
win any of it back, because the loss is in the pixels
(`ShortVideo/docs/discovery/2026-08-25-images-as-footage.md` §5).

**The design consequence stands unchanged: generated stills are a gap-filler for
scenes no stock library holds, not a footage source.** A skill that pretends
otherwise will produce soft video.

## 6. If 4K is ever worth paying for

Retrieved 2026-08-29 from `ai.google.dev/gemini-api/docs/pricing`. **There is no
free tier for image generation on the Gemini API.**

| Model | Model ID | 1K | 2K | 4K |
|---|---|---|---|---|
| Nano Banana Pro | `gemini-3-pro-image` | USD 0.134 | USD 0.134 | USD 0.24 |
| Nano Banana 2 | `gemini-3.1-flash-image` | USD 0.067 | USD 0.101 | USD 0.151 |
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | USD 0.0336 | — | — |

Batch pricing is roughly half. Supported resolutions per
`ai.google.dev/gemini-api/docs/image-generation` (same date): Pro 1K/2K/4K, NB2
0.5K/1K/2K/4K, Lite 1K only.

The OpenAI equivalent is `gpt-image-2` through
`~/.codex/skills/.system/imagegen/scripts/image_gen.py` with `--size 2160x3840`,
which needs `OPENAI_API_KEY`. Its `--dry-run` prints the payload without a key
and without network, so the integration can be built and tested before anyone
decides to pay. The ~USD 0.05/image-at-2K figure in the ShortVideo runbook was
**not** re-verified this session.

Both are per-image metered spend against a card. Neither belongs in a default
skill path; both belong behind an explicit flag.

## 7. What this means for the skill

Not a specification — the inputs a specification would need.

1. **Two engines, both real, chosen by intent — not a fallback chain.**
   ShortVideo's current "try agy, else codex" ordering silently prefers the
   *lower*-resolution, lossy engine. That is backwards for a one-off still and
   right for a character sequence. The choice is a judgment surface, not a
   default.
   - codex → highest fidelity available for free, lossless, no text leakage.
   - agy → Indonesian/local subject matter, or any shot that must match an
     earlier one.
2. **Structured output is the contract for both.** `--output-schema`/`-o` for
   codex, `--json-schema` + `--output-format json` for agy. Never parse stdout.
3. **Copy out of the CLI's home directory, always.** Both engines write inside
   their own state directories under names they choose. An asset left there is
   a production dependency on a cache.
4. **Verify pixels on disk, never trust the report.** Both agents self-report
   dimensions by shelling out to `identify` or PIL; that is one more place to be
   wrong. `identify -format "%w %h"` after the copy is cheap.
5. **State the resolution ceiling in the skill body.** The failure this skill
   most needs to prevent is a caller assuming these images can carry a
   full-screen frame.
6. **Load-bearing flags, each with a reason:** `--skip-git-repo-check` (codex
   fails outright outside a trusted git directory), `--add-dir` (agy cannot read
   a reference image otherwise), `--sandbox read-only` (enough — the agent still
   runs `identify`).
7. **Budget 30–120 s per image, serially.** Parallel calls against either
   subscription's rate limit are unmeasured.

## 8. Not measured

Named so nobody assumes they were checked.

- Rate limits and daily quotas on either subscription. A blog puts the Codex
  built-in tool at 250 images/minute; not verified, and irrelevant at 80 s/image.
- Parallel-call behaviour on either engine.
- `agy` aspect ratios other than `9:16`. Vendor docs list `1:1`, `3:2`, `2:3`,
  `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` for the Nano Banana family.
- Which Nano Banana variant `agy` routes `generate_image` to. `agy models` lists
  text models only; the image model is not exposed.
- Whether codex's built-in tool can edit a local file (its skill says the image
  must first be in conversation context via `view_image`).
- Any local/offline generator. Not investigated — it needs a GPU this report
  never checked for.

## 9. Follow-up outside this report

`ShortVideo/docs/reference/codex-image-generation.md` is now partly stale: it
predates the agy path in `tools/lib/imagegen.py`, and the fallback ordering there
prefers the weaker engine. That is a ShortVideo change, not a dstack one.
