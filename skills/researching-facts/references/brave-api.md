# Brave Search API — reference

Everything here is what `scripts/brave_search.py` wraps or deliberately leaves
out. Read it when the default fan-out is not enough.

## Auth and key location

Header `X-Subscription-Token: <key>`, plus `Accept: application/json`. The script
reads the key from `$BRAVE_SEARCH_API_KEY` first, then `~/.config/brave-search/key`
(mode 600), and exits **3** when neither exists so the caller can degrade to its
own search and say so.

Install the key on a new machine:

```bash
mkdir -p ~/.config/brave-search && chmod 700 ~/.config/brave-search
printf '%s' 'BSA...' > ~/.config/brave-search/key && chmod 600 ~/.config/brave-search/key
```

The key never lives in a repository, a skill file, or a shell profile that gets
committed. One key per person; a key in a transcript is a key to rotate.

## Endpoints

| Endpoint | Path | Notes |
|---|---|---|
| Web | `/res/v1/web/search` | The default. `result_filter=web` drops the video/FAQ/discussion mixers. |
| News | `/res/v1/news/search` | Recency-ordered, every hit carries a date. `--news`. |
| Images / Videos | `/res/v1/images/search`, `/res/v1/videos/search` | Not wrapped. |
| Suggest / Spellcheck | `/res/v1/suggest/search`, `/res/v1/spellcheck/search` | Cheaper meter ($5 per 10,000), separate rate limit. |
| Summarizer | `/res/v1/summarizer/search` | Two-step: a web call with `summary=1` returns a key you then poll. Not wrapped — the point of this skill is reading sources, not a second model's précis of them. |

Not exhaustive; Brave adds endpoints. `api-dashboard.search.brave.com/documentation`
is the current list.

## Parameters worth knowing

| Param | Values | Effect |
|---|---|---|
| `q` | ≤400 chars, ≤50 words | Supports `site:`, `-term`, `"exact phrase"`, `filetype:`. |
| `count` | 1–20 (web), default 20 | Results **per request**, not per page. |
| `offset` | 0–9 | Pagination, in pages of `count`. |
| `freshness` | `pd`, `pw`, `pm`, `py`, or `YYYY-MM-DDtoYYYY-MM-DD` | Past day/week/month/year, or an explicit range. |
| `country` | 2-letter, e.g. `id`, `us` | Regional index bias. Set it for national regulation, prices, or availability. |
| `search_lang` / `ui_lang` | e.g. `id`, `en` | Document language vs interface strings. |
| `safesearch` | `off`, `moderate`, `strict` | Default moderate. |
| `result_filter` | csv of `web,news,videos,discussions,faq` | Trim the payload before it reaches your context. |
| `goggles_url` | URL of a Goggle | Re-ranks by a published bias definition. Powerful, rarely needed, unwrapped. |

## Rate limits and metering

Response headers carry the truth: `x-ratelimit-limit`, `-remaining`, `-reset`,
and `x-ratelimit-policy` as `<n>;w=<seconds>` pairs — one burst window (per
second) and one quota window (per month). On the Search plan the observed burst
is **50 req/s**, and the monthly bucket reads `0` because the plan is metered
rather than capped: nothing stops the spend, so the script's month-to-date
counter in `~/.config/brave-search/usage.log` is the only local brake.

| Status | Meaning | Script behaviour |
|---|---|---|
| 401 | Key rejected or plan not activated | Exits with the key path in the message. |
| 422 | Bad parameter (usually `freshness` or `count`) | Reports the body; fix the parameter. |
| 429 | Burst limit | Backs off 1.5s, 3s, 4.5s, then reports. |
| 503 | Upstream | Same backoff. |

Attribution: Brave's terms require crediting Brave Search when results are shown
to an end user. An agent reading them to write an answer with its own citations
is not display, but a UI that lists them is.

## Result shape

`web.results[]` → `title`, `url`, `description` (HTML-escaped, may contain
`<strong>` — the script strips tags), `page_age`, `age`, `profile.name`,
`meta_url.hostname`, sometimes `extra_snippets` (a paid-plan array of extra
passages; often the most useful field and **not** wrapped — reach for `--json`
plus a `jq` pass if a claim hangs on one). `news.results[]` is the same shape
with `age` always populated.

The script's fused output keeps `title`, `url`, `snippet`, `age`, `score`
(reciprocal-rank fusion, k=60) and `found_by` (which variants returned it).
`--raw` skips fusion and prints one section per query when you need to see what
each variant found on its own.
