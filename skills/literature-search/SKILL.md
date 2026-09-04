---
name: literature-search
description: >
  Use when citations must be harvested from an academic database's WEB search
  for a systematic, scoping, or bibliometric review; produces a RIS corpus
  with PRISMA hit counts. Tested adapters: ScienceDirect, Taylor & Francis
  (tandfonline), Springer Nature Link, ProQuest Dissertations & Theses
  (guest), Neliti / Perpusnas e-resources; Emerald and others plug in as
  adapters. Not for a database with a query API, and not for open-web
  research. Triggers: "SLR search", "literature search", "search string",
  "boolean query", "export RIS", "harvest citations", "build a reference
  corpus", any database name above.
allowed-tools: Read Bash Write Edit
metadata:
  dstack:
    type: hybrid
    version: 0.4.5
    context_budget_tokens: 4500
    side_effects: local
    agency: deliberative
    triggers:
      - slr search
      - literature search
      - search string
      - boolean query
      - literature keyword strategy
      - export ris
      - download ris
      - harvest citations
      - sciencedirect search
      - taylor & francis search
      - tandfonline
      - springer search
      - proquest search
      - proquest dissertations
      - harvest dissertations
      - neliti
      - perpusnas e-resources
---
# /literature-search

Build a **reproducible boolean search** on an academic database web UI, run it,
export the citations to **RIS**, and log the counts — so a reference manager (or
`/literature-trends`) can dedup them into a review corpus. The **method is
database-agnostic**; each database's exact syntax, hard limits, filters, and
export mechanics live in a **per-vendor adapter** under `references/`.
ScienceDirect is the primary, empirically tested adapter.

**Core principle — recall first (Cochrane).** A relevant paper missed is lost
permanently; noise only costs screening time. Favor sensitivity, log every
search, dedup later.

## When to use
- Assembling citations for an SLR / scoping / bibliometric trend study from a
  database's **web** search.
- Translating one boolean query across several databases.
- Exporting RIS to build a reference corpus (convert BibTeX to RIS first).

**This is stage 1 of a pipeline.** Analyze the exported RIS with
`/literature-trends`; fetch open-access PDFs with `/literature-fulltext`.

**Not for:** open-ended web research (use `/researching-facts`); a database with an
official query **API** (call the API instead of scraping the UI); looking up one
already-known paper.

## Vendor-agnostic method (the spine)
1. **Concept blocks.** Split the question into 2–3 orthogonal concepts joined by
   `AND`. Inside a block, list synonyms joined by `OR`.
2. **Phrases + synonyms.** Wrap every multi-word phrase in `"double quotes"`.
   Pick only impactful synonyms; don't spend slots on spelling/plural variants if
   the engine folds them (check the adapter).
3. **Respect the hard limits.** Every engine caps connectors / terms / characters
   per field (see adapter). If the query exceeds them, **shard** the larger block
   into several searches: `(A AND b1) OR (A AND b2) = A AND (b1 OR b2)` — the
   union is identical.
4. **Filters.** Apply year range, article type (research/review), subject area,
   and open-access via the adapter's URL params or the UI refine panel.
5. **Log every run.** Record `string + filters + date + hit count` — mandatory
   for PRISMA and reproducibility. For a **trend study**, also capture the
   **per-year hit counts** (expand the database's Year facet, not just the single
   total) — that per-year *population* is what `/literature-trends` needs.
6. **Export to RIS** per search using the adapter's export recipe (mind the
   per-export cap). Keep one file per search (audit trail).
7. **Merge + dedup** by DOI (fallback: normalized title+year) →
   `scripts/ris_merge_dedup.py`.

**Where judgment takes over:** choosing the concepts, deciding which synonyms
earn a slot, and reading the hit count to steer — too much noise → add an `AND`
block or tighten phrases; too few → loosen or add synonyms; stop adding synonyms
at diminishing returns (a new term surfaces no new relevant papers). The
numbered steps are rails; concept and synonym design is yours. Some engines
break the spine — **Neliti has no operators at all** (bag-of-words); the adapter
tells you when the method itself must bend.

## The adapter contract
**Vendor documentation is often wrong** — verify on the live site. A per-vendor
`references/<vendor>.md` fills every slot below — the seven slots are **closed
by design** (the contract this skill reads); vendor quirks get extra sections:

| Slot | What the adapter specifies |
|---|---|
| Search field(s) | URL param + coverage (title/abstract/keywords vs all fields) |
| Boolean limits | max connectors, max terms, max characters per field |
| Operators | phrase syntax, wildcard support, grouping, precedence |
| Spelling / plurals | auto-folded, or must be written explicitly |
| Filters | params for year, article type, subject area, access |
| Export | how to export RIS/BibTeX; per-export cap; pagination |
| Auth | login/session needed for export or full text |

To add a database, copy `references/adding-a-vendor.md` → `references/<vendor>.md`
and fill every slot **empirically** (run the probe tests in that template).

| Database | Adapter | Status |
|---|---|---|
| ScienceDirect (Elsevier) | `references/sciencedirect.md` | primary — empirically tested (RIS export) |
| Taylor & Francis (Atypon Literatum) | `references/taylorfrancis.md` | empirically tested (RIS export; scriptable `downloadCitation`) |
| Springer Nature Link | `references/springer.md` | empirically tested — **export-poor** (CSV→DOI→enrich; no bulk RIS) |
| ProQuest (guest / public) | `references/proquest.md` | empirically tested — **scrape-not-export** (build RIS from detail pages) |
| Neliti (Indonesian index) | `references/neliti.md` | empirically tested — **bag-of-words** (no operators), **robots-constrained** |
| Emerald Insight | copy `references/adding-a-vendor.md` | not yet built |

> **Adapter shapes differ — the export slot is decisive.** Some *export* RIS in
> bulk (ScienceDirect, Taylor & Francis); the rest harvest RIS another way — the
> status table and the bundled-files notes name each shape and its harvest step.

## Driving the web UI
Drive the browser with the **`/claude-in-chrome`** skill (load its tools via
ToolSearch first). Prefer composing the search as a **URL** with the adapter's
params (reproducible, scriptable) over manual clicking — **unless** the adapter
says results URLs are session-hashed (e.g. ProQuest), in which case log the
**recipe** (query + each facet + count) instead of a link. Export by following the
adapter's recipe; downloaded files land in the browser's download directory —
move each to a named file per search before the next export. For a **scrape-not-
export** adapter, `get_page_text` each detail page and build the RIS locally.
Behind an **EZproxy** (e.g. Perpusnas `e-resources.perpusnas.go.id:<port>`) the
target is rewritten to `host:port` with path + params unchanged, so adapter URLs
still work — but mind per-engine **anti-bot walls** (Springer): pace requests,
prefer real navigations over `fetch()` bursts.

**Check `robots.txt` before scripting any fetch loop**, and honor its `Crawl-delay`.
Neither open access nor an institutional login implies crawl-permitted — **all three
proxied engines disallow their own search/export paths** to unlisted agents: T&F
`Disallow: /action` (both `doSearch` and `downloadCitation`), Springer default-denies
with an allow-list that excludes `/search?query=` and `/search/csv`, Neliti disallows
`/search` + `/citations/` and blocks `ClaudeBot`/`anthropic-ai` outright. **So drive
these from the browser session and pace it** — the entitlement covers your reading, not
a crawler. A **403 is a refusal**: never spoof a User-Agent to get past one (that hides
the fetch, it doesn't authorize it). For corpus-scale automation, use the vendor's API
or TDM programme, or ask.

## Checklist (before trusting a harvest)
- [ ] Every multi-word phrase quoted; concept blocks parenthesized; connectors ≤ adapter limit.
- [ ] No unsupported wildcards; spelling/plural handled per the adapter.
- [ ] Filters (year / type / subject / access) applied **and** recorded.
- [ ] Each search logged: string + filters + date + hit count.
- [ ] Over-limit query sharded into multiple searches with a dedup plan.
- [ ] RIS exported per search, then merged + deduped by DOI.

## Bundled files
- `references/sciencedirect.md` — the ScienceDirect web engine: hard limits,
  operators, filters, export flow, pagination — measured on the live site. Read
  before any ScienceDirect search.
- `references/taylorfrancis.md` — Taylor & Francis / **Atypon Literatum** engine:
  UPPERCASE operators, stemming-on (quotes disable it), no connector cap,
  `pageSize=100` + 0-indexed `startPage`, scriptable `/action/downloadCitation` RIS
  (multi-DOI, no login). Read before any T&F / Atypon search.
- `references/springer.md` — Springer Nature Link: UPPERCASE operators, **left-to-
  right precedence (parenthesize every OR block)**, anti-bot "Client Challenge",
  **no bulk RIS** (CSV cap 1,000 → DOI → CrossRef/API enrich). Read before any
  Springer search.
- `references/proquest.md` — ProQuest **guest** engine: no export → scrape
  `docview/<id>` detail pages and build RIS/CSV/JSONL; session-hashed result URLs,
  20/page cap, `localStorage`+`get_page_text` exfiltration, anti-bot pace. Read
  before any ProQuest harvest.
- `references/neliti.md` — Neliti (Indonesian index): **no boolean/phrase/wildcard**
  (bag-of-words OR union), filters + year-sharding, ~1,000-record reachable ceiling,
  and a **`robots.txt` that disallows `/search` + `/citations/`** — browser for ids,
  detail-page `<meta>` for RIS. Read before any Neliti harvest.
- `references/adding-a-vendor.md` — adapter template + the live-site probe method
  for a new database.
- `scripts/ris_merge_dedup.py` — merge N RIS files → dedup by DOI (fallback
  title+year) → one corpus + a count report. Run with `--help`.

## Common mistakes

The recurring ones, **not exhaustive** — a new vendor brings its own.

| Mistake | Fix |
|---|---|
| Porting another database's syntax verbatim | Each engine differs — read the adapter, verify live |
| One mega-query over the connector limit | Shard into ≤-limit searches + dedup (union is identical) |
| Trusting vendor docs | Docs are often wrong (wildcards, phrase braces, precedence) — measure live |
| Assuming lowercase `or` works | Springer & T&F need **UPPERCASE** operators — lowercase becomes a search term |
| Feeding a boolean string to Neliti | Neliti has no operators — bare words (OR union) + filters + year-shard |
| Reading "no login needed" (or "we're entitled") as "crawl freely" | Check `robots.txt` — all 3 proxied engines disallow their search/export paths; drive the browser, never spoof a UA past a 403 |
| Not logging counts | Without string+filters+date+count per search, PRISMA is impossible |
| Deduping by title only | DOI first; title+year only as fallback |
| Chasing every synonym | Stop at diminishing returns — new term, no new relevant hits |
