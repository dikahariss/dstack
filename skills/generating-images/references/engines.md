# Engines — what each one is, and what it actually returns

Every number here was produced by running the command on a real machine on
2026-08-29 against `codex-cli 0.150.1`, `agy 1.1.22`, `gemini-cli 0.57.0`.
Nothing is quoted from a vendor page unless the line says so. Re-measure before
trusting a figure on a newer version.

## The routes, ranked by whether they work at all

| Route | Works without a paid API key? | Output |
|---|---|---|
| `codex exec` → built-in `image_gen` | yes, on a ChatGPT subscription | PNG 941×1672 |
| `agy --print` → built-in `generate_image` | yes, on an Antigravity account | JPEG 768×1376 |
| `gemini -p` on the individual free tier | **no — the tier was removed** | — |
| `gemini` + the `nanobanana` extension | no, needs a metered API key | 1K–4K |
| The codex fallback CLI (`gpt-image-2`) | no, needs a metered API key | up to 2160×3840 |
| Claude Code | no such tool exists | — |

---

## codex

```bash
codex exec --sandbox read-only --skip-git-repo-check \
  --output-schema schema.json -o out.json - < prompt.txt
```

| Property | Measured |
|---|---|
| Size | 941×1672 (1.57 MP) on every run, whatever the prompt asked for |
| Format | PNG, rgb24, lossless, ~2 MB |
| Location | `$CODEX_HOME/generated_images/<session>/exec-<uuid>.png`; the filename cannot be chosen |
| Time | 78–113 s (n=7, mean 95 s); earlier runs 73 s, 80 s |
| File size | 1.8–3.0 MB |
| Tokens | ~35 k per call |
| Text leakage | none observed |
| Reference images | **yes** — `-i <FILE>` (repeatable) attaches an image to the initial prompt. Verified 2026-08-30: a three-image chain, each generated with the previous one attached, held the same product across a full change of location |

**Authentication.** `~/.codex/auth.json` with `auth_mode: chatgpt`. The built-in
tool needs no `OPENAI_API_KEY` and bills against the subscription. Check with
`test -f ~/.codex/auth.json`.

**Flags, each load-bearing:**

| Flag | Why it cannot be dropped |
|---|---|
| `--output-schema` + `-o` | the only reliable way to get the path back |
| `--skip-git-repo-check` | outside a trusted git directory the command dies with `Not inside a trusted directory` and prints nothing else |
| `--sandbox read-only` | sufficient — the agent still runs read commands such as `identify` |
| `- < prompt.txt` | the prompt arrives on stdin, which avoids quoting problems on long prompts |

**Size cannot be requested.** A prompt demanding `2160x3840`, quoting the tool's
own published constraints back at it, returned 941×1672. The built-in tool
rounds to an internal pixel budget of roughly 1.5 MP. The `gpt-image-2` size
grid — max edge 3840, both edges multiples of 16, long:short ratio ≤ 3:1, total
pixels 655,360–8,294,400 — governs the **fallback CLI with an API key**, not the
built-in tool. Upstream issues describing the same behaviour: `openai/codex`
#19175 and #28723.

---

## agy (Antigravity CLI)

```bash
agy --dangerously-skip-permissions --add-dir "$REFDIR" \
  --output-format json --json-schema schema.json --print "$(cat prompt.txt)"
```

The answer is `.structured_output` in the JSON printed on stdout.

| Property | Measured |
|---|---|
| Size | 768×1376 (1.06 MP) on all four runs |
| Format | JPEG — lossy, and not selectable |
| Location | `~/.gemini/antigravity-cli/brain/<conversation-id>/<name>_<epoch-ms>.jpg` |
| Time | 28 s, 31 s, 108 s, 122 s |
| Tokens | ~47 k on a cold call, most of it cache-read |

**Authentication.** A local Antigravity Google login; no key file to set. It
bills against the account's own quota.

**The tool has no size parameter.** Lifted from a run transcript:

```json
{"name": "generate_image",
 "args": {"AspectRatio": "9:16", "ImageName": "fisherman_at_dawn", "Prompt": "…"}}
```

`AspectRatio` is the only geometry control. Two prompts demanding exact pixels —
one asking for 4K, one demanding "exactly 1080 x 1920, do NOT return a square" —
both returned 768×1376. Third-party skills advertising "exact-pixel sizing" for
this engine reach it by cropping and scaling with ffmpeg afterwards. That is
resampling, not resolution; do not report it as a generated size.

Aspect ratios verified: `9:16`. The vendor documents `1:1`, `3:2`, `2:3`, `3:4`,
`4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` for this model family
(`ai.google.dev/gemini-api/docs/image-generation`, retrieved 2026-08-29); the
rest are unmeasured here.

**Time.** 32–36 s (n=3, mean 34 s), against codex's 95 s on the same three
prompts — roughly **2.8× faster**. Files are 0.76–0.91 MB JPEG.

**What it is better at.** Same prompt, same subject: codex produced a generic
tropical waterfront, agy produced regionally correct dress, boats and objects.
Its world knowledge of place is the reason to reach for it. Corroborated on a
second subject (2026-08-30): asked for an Indonesian nursery, agy rendered raised
seedbeds with rows of black polybags and concrete edging, while codex produced a
generic white-canopy greenhouse. Same prompt, same run.

**What codex is better at, beyond resolution.** The same run found a trade the
other way. The source frame was a *stacked two-panel* composition — an upper
scene and a lower scene meeting at a hard horizontal seam, a common short-form
device. codex reproduced the seam literally; agy resolved it into one continuous
perspective scene with the lower content as foreground. So: agy for the place,
codex for an unusual composition you need held exactly.

**Character consistency, verified.** Pass an earlier image with `--add-dir`,
**name its path in the prompt**, and ask for the same subject in a new pose:
face, clothing and setting held across a separate call (108 s). The directory
only puts the file in the workspace; agy will not look at it unless the prompt
says which file to look at. This differs from codex, where `-i` attaches the
image directly and the prompt need only say what must match.

**Text leakage, verified.** With `Constraints: no text, no logo, no watermark`
in the prompt, one run still lettered a boat hull. The constraint is advisory.
Inspect the result whenever stray lettering would matter.

**Failure modes, observed in one six-image batch (2026-08-30).** Two of six
failed, in two different ways, and neither produced an image:

| Symptom | What it is |
|---|---|
| `agy returned no structured_output` | the call ran and returned nothing parseable. Re-run it. |
| a reported `path` of `.` | the call claimed success and named a directory. The script now rejects any path that is not a file; before the fix it died inside `copy2` with a raw traceback. |

A 4-of-6 success rate on one batch is not a measured reliability figure, but it
is enough to say: **check every exit code in a batch, never just the last one.**

**Housekeeping.** Generated files accumulate under
`~/.gemini/antigravity-cli/brain/` and nothing prunes them. Copy what you need
out; prune the rest deliberately, never as a side effect of a generation run.

---

## gemini CLI — dead on the individual free tier

```
IneligibleTierError: This client is no longer supported for Gemini Code Assist
for individuals. To continue using Gemini, please migrate to the Antigravity
suite of products.
  tierId: 'free-tier'   reasonCode: 'UNSUPPORTED_CLIENT'
```

Exit 55, four seconds, valid OAuth credentials on disk. This is not a
misconfiguration and cannot be fixed locally — the individual free tier was
folded into Antigravity. Anything built on `gemini` OAuth is dead; `agy` is the
surviving path to the same model family.

The `nanobanana` extension (`gemini extensions install
https://github.com/gemini-cli-extensions/nanobanana`) works, but wants
`NANOBANANA_API_KEY` — a metered Gemini API key, which is the paid route below.

---

## Paid escalation — only on an explicit decision

Retrieved 2026-08-29 from `ai.google.dev/gemini-api/docs/pricing`. **There is no
free tier for image generation on the Gemini API.**

| Model | Model ID | 1K | 2K | 4K |
|---|---|---|---|---|
| Nano Banana Pro | `gemini-3-pro-image` | USD 0.134 | USD 0.134 | USD 0.24 |
| Nano Banana 2 | `gemini-3.1-flash-image` | USD 0.067 | USD 0.101 | USD 0.151 |
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | USD 0.0336 | — | — |

Batch pricing is roughly half of each. Supported resolutions: Pro 1K/2K/4K,
Nano Banana 2 adds 0.5K, Lite is 1K only.

The OpenAI equivalent is the bundled codex CLI at
`$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py` with
`--size 2160x3840`, which needs `OPENAI_API_KEY`. Its `--dry-run` prints the
request payload without a key and without network access, so an integration can
be built and tested before anyone decides to pay for it.

Both are per-image metered spend against a card. Neither belongs on a default
path.

---

## Not measured

Named so nobody assumes otherwise.

- Rate limits and daily quotas on either subscription.
- Behaviour of parallel calls against either engine.
- Which model variant `agy` routes `generate_image` to — `agy models` lists text
  models only.
- Whether the codex built-in tool can **edit** an existing file on disk. Its own
  skill states the image must first be in conversation context via `view_image`.
  This is a different question from attaching a reference, which `-i` does and
  which is now measured.
- Any local or offline generator. Not investigated; it needs a GPU that no probe
  here checked for.
