# Adapter: Springer Nature Link (SpringerLink) — web search engine

> Measured **live** on `https://link.springer.com/search` (2026), reached through
> an EZproxy (Perpusnas port `:2222`). Springer rebranded SpringerLink to
> **"Springer Nature Link"** in 2024; the host is still `link.springer.com` and the
> URL schema below is the current one. Scope: the Springer **website** search only,
> NOT the Springer Nature **API** (`api.springernature.com`, noted at the end) and
> NOT Scopus. Example terms (machine learning, robotics, healthcare, circular
> economy) are **incidental** — they demonstrate engine behavior, not a topic.

## HARD RULES (break one → wrong results, silently)
1. **Operators must be UPPERCASE** `AND` / `OR` / `NOT`. A lowercase `or`/`and` is
   treated as an ordinary **search term**, not an operator. Measured: `"machine
   learning" OR "robotics"` = **242,572** but `"machine learning" or "robotics"` =
   **10,806** (the lowercase `or` silently wrecks the query).
2. **No operator precedence — the engine reads strictly LEFT-TO-RIGHT.** There is
   **no** "AND binds tighter than OR". So you **MUST wrap every OR group in `( )`**.
   Measured: `"healthcare" AND "machine learning" OR "robotics"` = **70,649**
   (parsed `(healthcare AND ML) OR robotics`) vs the intended
   `"healthcare" AND ("machine learning" OR "robotics")` = **47,718**. Different
   sets — the missing parentheses change the meaning.
3. **Use straight double quotes `"..."` for every multi-word phrase** (words in that
   order). Measured: `"machine learning"` = **224,140** < unquoted `machine
   learning` = **251,426** (unquoted = `machine AND learning`, words anywhere).
4. **Space between words = AND** (the default). `machine learning` = `machine AND
   learning`.
5. **Wildcard `*`** = any number of letters; per Springer docs it "works best with
   **≥3 characters before** the `*`" (e.g. `comput*`). **`?`** is **not documented**
   — do not rely on a single-character wildcard; spot-check if you need it.
6. **No documented auto-stemming or US/UK folding.** Springer tells users to use
   `*` "for variations of the root word" — so plurals and spelling variants are
   **not** reliably folded (unlike ScienceDirect). Add `*` or list variants
   explicitly when a variant matters.
7. **Pace requests — there is an anti-bot wall.** Rapid programmatic `fetch()`/XHR
   bursts (≈5–6 in a row) trigger a **"Client Challenge"** interstitial (a ~3 KB
   page, HTTP 200, `<title>Client Challenge</title>`) instead of results. **Drive
   real page navigations** (they run the challenge JS and pass) and **space
   requests out**; do not scrape counts by hammering XHR.

## Adapter contract (filled)
| Slot | Value |
|---|---|
| Search field | Single **`query=`** = an **all-fields** keyword search (title + abstract + keywords + **full text**) — broad and noisy, closer to ScienceDirect's `qs` than its `tak`. **There is no title/abstract/keyword-only field in the simple box** (field scoping only on `/advanced-search`). |
| Boolean limits | No published cap on operators/terms/characters (none hit in testing before the anti-bot wall stops you). Shard for the **export** cap, not a query cap. |
| Operators | phrase `"..."`; group `( )` (**mandatory** around OR blocks — rule 2); `AND`/`OR`/`NOT` **UPPERCASE only**; wildcard `*` (≥3 leading chars); `?` undocumented; **no** proximity operator |
| Spelling / plurals | **not** auto-folded (rule 6) — use `*` or list variants |
| Filters | `content-type`, `date`+`dateFrom`+`dateTo`, `language`, `openAccess`, `facet-discipline`, `facet-sub-discipline`, `taxonomy`, `sortBy` (all below) |
| Export | **No bulk RIS/BibTeX.** Only **"Download results (.csv)"** (`/search/csv`, same params), **capped 1,000 rows**, and per-item RIS one at a time. → this is a **CSV→DOI→enrich** adapter, not an export-RIS one (see Export). |
| Auth | search + metadata public; **full text** needs entitlement (the proxy supplies it); **CSV export may need a free personal Springer login**; API needs a key |

## Field / URL parameters
Compose searches as a URL: `https://link.springer.com/search?query=<url-encoded>&...`
(through the proxy: `https://e-resources.perpusnas.go.id:2222/search?...`). A fresh
search may carry `new-search=true`; results paginate with `page=N` (**20/page**).

| Field | Param | Coverage |
|---|---|---|
| Keywords (all fields) | **`query`** | title + abstract + keywords + full text |

Field-scoped search (Title / Author / Journal-or-book) exists **only** on the
`/advanced-search` form, which composes one `query=` string + facet params — the
public box has **no** `title:`/`abstract:` prefixes.

## Operators — measured proof (in `query`, filtered Article · 2022–2026 · English)
| Typed | Results | Meaning |
|---|---|---|
| `"machine learning"` | 224,140 | phrase — words adjacent (CORRECT) |
| `machine learning` (no quotes) | 251,426 | `machine AND learning` (anywhere) |
| `"machine learning" OR "robotics"` | 242,572 | real `OR` (UPPERCASE) |
| `"machine learning" or "robotics"` | 10,806 | lowercase `or` = a term → wrong |
| `"healthcare" AND "ML" OR "robotics"` | 70,649 | left-to-right `(H AND ML) OR R` |
| `"healthcare" AND ("ML" OR "robotics")` | 47,718 | intended grouping (parenthesized) |

## Filters (append to any search URL; values url-encoded)
| Filter | Param | Value(s) |
|---|---|---|
| Content type | `content-type` | `Article` (umbrella) · **`Research`** (research article) · **`Review`** (review article) · `News` |
| Date range | `date` + `dateFrom` + `dateTo` | `date=custom&dateFrom=2021&dateTo=2026` (also relative: last 3/6/12/24 months) |
| Language | `language` | `En`, `De`, `Fr`, … |
| Open access | `openAccess` | `true` |
| Discipline | `facet-discipline` | quoted name, e.g. `"Computer Science"`, `"Business and Management"`, `"Psychology"` |
| Sub-discipline | `facet-sub-discipline` | quoted name, e.g. `"Artificial Intelligence"` |
| Topic (keyword taxonomy) | `taxonomy` | quoted term, e.g. `"Machine Learning"` |
| Sort | `sortBy` | `relevance` · `newestFirst` · `oldestFirst` |
| Page | `page` | `1`, `2`, … (20 results/page) |

> Springer's **research-article vs review** split **is** a live URL filter
> (`content-type=Research` / `content-type=Review`), even though the help docs
> imply it is not — measured on the facet panel. To mirror a Scopus "research +
> review", run both `content-type=Research` and `content-type=Review` and merge,
> or use the `Article` umbrella and screen types afterward.

Per-year population (for `/literature-trends`): re-run the query once per year with
`dateFrom=dateTo=YEAR` and read each total (or expand the Year facet), since the
CSV/first pages are a relevance-sorted sample, not the population.

## robots.txt — default-deny with an allow-list
`link.springer.com/robots.txt` opens `User-agent: *` with **`Disallow: /`**, then adds
~40 `Allow:` prefixes. Article/chapter/content pages **are** allowed (`/article/`,
`/chapter/`, `/content/`, `/doi/`); but `Allow: /search$` is **anchored**, so a real
query URL (`/search?query=…`) and the CSV endpoint (`/search/csv?…`) fall through to the
default `Disallow: /`. **`/article/*.ris*` is disallowed outright.**

Practical reading: **drive search + CSV export from the browser** (which the anti-bot
"Client Challenge" already forces — rule 7), and reserve scripted fetching for the
allowed article/DOI pages. Better still, take the **Metadata API** below — it is the
sanctioned automation path and sidesteps this entirely.

## Export — the critical slot (Springer is export-poor)
**There is NO bulk RIS/BibTeX from a result set** — no select-all → export. The
only two routes:

1. **"Download results (.csv)"** → `GET /search/csv?<the same params as /search>`.
   **Capped at 1,000 rows.** The CSV carries **DOIs** (not abstracts). It may
   require a **free personal Springer account login** — the institutional proxy
   entitlement does not necessarily satisfy that; verify on your proxy. **Because
   of the 1,000 cap, shard** the search (by year, or by concept block) so each
   export is < 1,000, then **dedup by DOI**.
2. **Per-item citation** ("Cite this article" → **RIS**; chapters/protocols also
   ENW/BIB) — one record at a time; impractical at corpus scale.

**Adapter shape → CSV→DOI→enrich.** Harvest the DOIs from the (sharded) CSVs, then
resolve each DOI to full RIS/metadata **off-platform** — via **CrossRef**
(`https://api.crossref.org/works/<doi>`, free, no key) or the Springer API below.
This replaces the "export RIS per search" step other adapters use. If personal
login blocks even the CSV through the proxy, fall back to a **per-page scrape**
(20 results/page, real navigations, build RIS locally) as in the ProQuest adapter.

### Cleaner alternative — the Springer Nature Metadata API
Springer offers an official query **API** (`https://api.springernature.com/meta/v2/json`,
free API key from `dev.springernature.com`) returning Title/Authors/**Abstract**/
**DOI**/Keywords/Subject as JSON, paginated via `s` (start) + `p` (page size),
query via `q=` with `keyword:`, `title:`, `doi:`, `year:`, `subject:`, `type:`.
Per this skill's own rule ("a database with an official query **API** → call the
API instead of scraping the UI"), **prefer the API** when a key + its rate limits
are workable — it sidesteps the 1,000-row CSV cap, the personal-login friction, and
the anti-bot wall entirely.

## Worked example — sharding for the 1,000-row CSV cap (neutral topic)
Goal: a corpus for `("circular economy" OR "closed-loop") AND ("supply chain" OR
"logistics")`, Article, 2021–2026, English — say it returns 3,800 hits (> 1,000, so
one CSV can't hold it). Shard **by year** (each year < 1,000):

```
Base: query=("circular economy" OR "closed-loop") AND ("supply chain" OR "logistics")
      &content-type=Article&language=En&sortBy=newestFirst
Search 1: &date=custom&dateFrom=2021&dateTo=2021   → CSV (DOIs)
Search 2: &date=custom&dateFrom=2022&dateTo=2022   → CSV
… one per year through 2026.
```
Download each `/search/csv`, concatenate the DOI columns, **dedup by DOI**, then
enrich each DOI to RIS via CrossRef/the API → one corpus. (Note both OR blocks are
parenthesized and every operator is UPPERCASE — rules 1–2.)

## Caveats
- `query=` searches **full text**, so recall is high but **precision is low** (lots
  of papers that merely mention a term in the body). There is no
  title-abstract-keyword-only field in the simple UI — expect more screening noise
  than a ScienceDirect `tak` search; tighten with phrases + an extra `AND` block.
- The **hard rules** (uppercase operators, left-to-right precedence, CSV-only
  export, anti-bot wall) are engine behavior and durable; the **counts** drift as
  papers publish. If Springer revamps the UI, re-run the phrase probe (rule 3), the
  lowercase-`or` probe (rule 1), and one paren vs no-paren probe (rule 2).
- Springer entitlement via the proxy governs **full-text** access; **search +
  metadata + the CSV DOIs** are available regardless, which is all the harvest
  needs before `/literature-fulltext`.
