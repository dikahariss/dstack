# Adapter: Neliti (neliti.com) — web search engine

> Measured **live** on `https://www.neliti.com` and through the Perpusnas EZproxy
> (`:2116`), 2026. Neliti is an **aggregator/index of Indonesian research** —
> journal articles, theses, conference papers, books, government/NGO policy &
> research reports, datasets (~300k+ items, backed by the National Library of
> Indonesia). Treat it as a **complementary regional / grey-literature source**, not
> a primary international database. Example terms (volcano, photosynthesis,
> education) are **incidental** — they demonstrate engine behavior, not a topic.

## THE ONE RULE THAT CHANGES EVERYTHING
**Neliti's search has NO boolean, NO phrase, NO wildcard, NO grouping.** It is a
plain **bag-of-words** engine whose default multi-term behavior is **OR (union)**.
Anything that looks like an operator is treated as a **literal search term**:

| Typed (`q=`, type=journalarticle) | Results | What actually happened |
|---|---|---|
| `volcano` | 464 | baseline |
| `volcano photosynthesis` | 647 | **OR union** (adding a word *raises* the count) |
| `volcano AND photosynthesis` | **10,000** | `AND` = an ultra-common literal word → hits the display cap |
| `"volcano photosynthesis"` | 647 | quotes **stripped** — identical to unquoted |

So a query like `("remote work" OR "hybrid work" OR "telework")` **does not work** on
Neliti: the quotes and parentheses are ignored and `OR` is indexed as a word. **This
is the first thing to fix** when porting a boolean strategy here.

**Consequences for an SLR harvest:**
- **Synonyms → bare, space-separated words** (default OR): `q=remote hybrid telework flexible`.
- **You cannot phrase-lock** a multi-word term, and **cannot AND two concept blocks**
  in one query.
- **Concept-AND must be done off-engine:** run one search per concept (or per
  synonym), harvest each, then **intersect locally by publication id**. Or narrow
  with **filters** (`type`, `languages`, `year`) so a single OR-union stays small.
- **Reachable ceiling ≈ 1,000 records** per (query+filter): the total display caps
  at **10,000**, but `page=` dies at ~page 50 (`page ≥ ~60` silently resets to page
  1). **Shard by year** (`year=2021`, `2022`, …) to keep each slice fully
  harvestable — and log per-year counts for PRISMA/trends.

## ROBOTS.TXT — read before writing any fetch loop
Neliti is **open access but not open to crawlers**, and its `robots.txt` is stricter
than its (absent) paywall. Under `User-agent: *`:

| Path | Status |
|---|---|
| `/search`, `/utils/search-suggest`, `/api/` | **Disallow** |
| `/citations/` (the RIS endpoint), `/oai` | **Disallow** |
| `/publications/*/download` | **Disallow** |
| `/publications/<id>/<slug>` (detail page) | **Allow** |
| `media.neliti.com/…pdf` (the PDF host) | **Allow** |
| every bot | **`Crawl-delay: 2`** |

`ClaudeBot`, `Claude-Web`, and `anthropic-ai` are additionally **blocked outright**
(`Disallow: /`), and CloudFront **403s** any request without a browser User-Agent.

**Never spoof a browser User-Agent to defeat that 403.** The 403 and the disallow
list are the site refusing scripted agents; a spoofed UA does not make the fetch
permitted, only undetected. Instead:

- **`/search` — drive the browser** (`/claude-in-chrome`), interactively, to read
  counts and collect `/publications/<id>/…` ids. Do not script a crawl of it.
- **Metadata — take it from the detail page**, which *is* robots-allowed: its Highwire
  `<meta>` tags (below) carry title / authors / journal / volume / pages / date and
  `citation_pdf_url`. Build the RIS from those, honoring `Crawl-delay: 2`.
- **`/citations/<id>/ris` and `/oai` are disallowed.** They are documented below
  because they exist and work — **not** as a scripted harvest path. Use them only for
  a handful of records pulled by hand in a browser.

This constraint matches `/literature-fulltext`'s Neliti path; the two must not drift.

## Adapter contract (filled)
| Slot | Value |
|---|---|
| Search field | Single **`q=`** free-text box = title + abstract + metadata (author/journal/subject). No field-scoped syntax (`title:`/`author:` **not** supported). |
| Boolean limits | **N/A — no operators.** Default = OR union; `AND`/`OR`/`NOT` are literal words; `-term` exclusion **ignored**; `"..."`, `( )`, `*`, `?` **stripped/no-op**. |
| Operators | **none** |
| Spelling / plurals | engine does loose prefix/stem matching already (`volcan?` matched *more*, not fewer) — do not add wildcards |
| Filters | `languages`, `year`, `year_start`+`year_end`, `type`, `grades`, `country`, `sort_by` (below) |
| Export | **No bulk/select-all export.** A per-record RIS endpoint exists (`/citations/<id>/ris`) but is **robots-disallowed** → for a harvest, build RIS from the detail page's **Highwire `<meta>` tags**. |
| Auth | **NONE** for search, detail, RIS/BibTeX export, OAI, or OA PDF. Login only for personal features. **No-auth ≠ crawl-permitted — see robots.txt above.** |

## Search & filter URL parameters (measured)
Compose as `https://www.neliti.com/search?q=<terms>&...` (through the proxy:
`https://e-resources.perpusnas.go.id:2116/search?q=...`). **20 results/page**,
server-rendered.

| Filter | Param | Values / notes |
|---|---|---|
| Query | `q` | space-separated bare words (OR union) |
| Language | `languages` | `ar en es id ms pt ru tr uk` — **repeatable** (`languages=id&languages=en` = OR within facet) |
| Year (single) | `year` | e.g. `year=2025` |
| Year (range) | `year_start` + `year_end` | e.g. `year_start=2021&year_end=2026` |
| Type | `type` | `journalarticle` · `thesis` · `conferencepaper` · `book` · `dataset` · `other` (repeatable) |
| Journal grade | `grades` | `international` · `national` · `local` · `scopus` · `none` (Indonesian accreditation / Scopus tier) |
| Publisher country | `country` | ISO-2 (`id`, `au`, …) |
| Sort | `sort_by` | *(empty)* = relevance · `date_published` · `title` |
| Page | `page` | 20/page; **reachable to ~page 50 (~1,000 records)**, then resets |

Repeat a facet param → **OR within that facet**. Different facets → AND across
facets (`q=volcano&type=thesis&languages=id`).

## Export — building RIS the robots-allowed way
There is **no select-all / bulk export**, and the one scriptable endpoint is
disallowed — so the harvest is **browser for ids, detail page for metadata**.

**`<id>`** = the number in every result/detail link (`/publications/<id>/<slug>`) and
in the OAI id (`oai:neliti.com:<id>`).

### Harvest flow
1. Build the search: bare-word `q=` + filters (`type`, `languages`, `year`). Shard by
   **year** so each slice is < ~1,000 records.
2. **In the browser** (`/claude-in-chrome`), page through results (`page=1..N`,
   20/page) and collect the `/publications/<id>/…` **ids** plus the per-year count for
   PRISMA. `/search` is robots-disallowed to scripted agents — drive it, don't crawl it.
3. For each id, fetch the **detail page** `/publications/<id>/<slug>` (robots-allowed)
   at **`Crawl-delay: 2`** and read its Highwire `<meta>` tags:
   `citation_title`, `citation_author`×n, `citation_journal_title`, `citation_issn`,
   `citation_volume`, `citation_issue`, `citation_firstpage`/`lastpage`,
   `citation_publication_date`, `citation_pdf_url`. Emit one RIS record per id.
4. **Dedup by normalized title + year as the PRIMARY key**, DOI only as a secondary
   check when present — the reverse of every other adapter, because most Neliti records
   carry no DOI. Merge with `scripts/ris_merge_dedup.py`.

### The disallowed endpoints (documented, not a harvest path)
- **Per-record citation:** `/citations/<id>/ris` → RIS
  (`application/x-research-info-systems`), `/citations/<id>/bib` → BibTeX. Measured:
  HTTP 200, no auth, works through the proxy; fields
  `TY AU T1 T2 JF DA PY IS VL SP EP AB DO ER` — the only source of the **abstract
  (`AB`)**, which the `<meta>` tags lack. **`/citations/` is `Disallow`** — reach it
  by hand in a browser for a few records, never in a fetch loop.
- **OAI-PMH** base `/oai` (v2.0, `oai_dc` only, 200/response + `resumptionToken`,
  **sets = journals**, no query/search). Also **`Disallow`**.
- If a run genuinely needs abstracts at corpus scale, that is a **request-permission**
  conversation with Neliti, not a workaround.

### Direct OA PDF (robots-allowed)
`citation_pdf_url` → `https://media.neliti.com/media/publications/<id>-...pdf`
(Neliti self-hosts full text) — the handoff to `/literature-fulltext`.

## Perpusnas proxy note
`:2116` **works** (confirmed: search, filters, and `/citations/<id>/ris` all resolve
through it) but **adds nothing** — Neliti content is open-access, fetchable
anonymously. The EZproxy can mangle complex query strings (quotes/`&`), though that
is **moot** here since Neliti ignores operators anyway. For scripted harvesting,
**native `neliti.com` is simplest**; the proxy is fine for interactive use.

## Worked example (neutral)
Goal: Indonesian journal articles on a two-concept topic, 2021–2026. Since you can't
AND two blocks in-engine, **narrow with filters + intersect off-engine**:
```
Concept run A: q=education technology&type=journalarticle&languages=id&year=2023
Concept run B: q=rural school access&type=journalarticle&languages=id&year=2023
```
Harvest each (ids → RIS), then keep the **intersection of ids** (records surfaced by
both concept runs), repeating per year 2021…2026. Or, if one OR-union is specific
enough, run it alone and screen manually.

## Caveats
- **No operators** → recall/precision are controlled by **filters + sharding + local
  set logic**, not by query syntax. Do not trust a boolean string here.
- **~1,000-record reachable ceiling** per query+filter (10,000 display cap, `page`
  dies ~50) → shard by year; a large OR-union will be **truncated** invisibly.
- **DOIs frequently absent** → dedup by title+year as the primary key, DOI only when
  present.
- **Bahasa Indonesia bias**; overlaps Garuda/SINTA/DOAJ; variable peer-review rigor.
  Best for Indonesian journals, theses, and **policy/grey literature** — position it
  as complementary. The **structural facts** (no operators, 1k ceiling, no-auth, and
  the robots disallow list) are durable; **counts** drift as records are added — but
  re-read `robots.txt` before each harvest, since that is the constraint that decides
  which paths you may script at all.
