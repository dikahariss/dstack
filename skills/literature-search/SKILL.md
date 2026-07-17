---
name: literature-search
description: >
  Use when harvesting bibliographic records from an academic database's web
  search for a systematic literature review (SLR), scoping review, or
  bibliometric/trend study — designing a boolean concept-block query, applying
  year / article-type / subject / open-access filters, exporting results to RIS,
  and logging hit counts for PRISMA. Primary tested database is
  ScienceDirect (Elsevier); Emerald, Springer Nature and others plug in as
  per-vendor adapters. Triggers: "SLR search", "cari literatur", "search string",
  "boolean query", "literature keyword strategy", "export/download RIS", "harvest citations",
  "ScienceDirect search", "build a reference corpus".
allowed-tools: Read Bash Write Edit
metadata:
  dstack:
    type: hybrid
    version: 0.1.0
    context_budget_tokens: 3500
    side_effects: local
    agency: deliberative
    triggers:
      - slr search
      - literature search
      - cari literatur
      - search string
      - boolean query
      - literature keyword strategy
      - export ris
      - download ris
      - harvest citations
      - sciencedirect search
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

**Not for:** open-ended web research (use `/deep-research`); a database with an
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
numbered steps are rails; concept and synonym design is yours.

## The adapter contract
Databases differ in syntax and mechanics, and **vendor documentation is often
wrong** — verify on the live site. A per-vendor `references/<vendor>.md` fills
every slot below:

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
| ScienceDirect (Elsevier) | `references/sciencedirect.md` | primary — empirically tested |
| Emerald Insight | copy `references/adding-a-vendor.md` | not yet built |
| Springer Nature | copy `references/adding-a-vendor.md` | not yet built |

## Driving the web UI
Drive the browser with the **`/claude-in-chrome`** skill (load its tools via
ToolSearch first). Prefer composing the search as a **URL** with the adapter's
params (reproducible, scriptable) over manual clicking. Export by following the
adapter's recipe; downloaded files land in the browser's download directory —
move each to a named file per search before the next export.

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
- `references/adding-a-vendor.md` — adapter template + the live-site probe method
  for a new database.
- `scripts/ris_merge_dedup.py` — merge N RIS files → dedup by DOI (fallback
  title+year) → one corpus + a count report. Run with `--help`.

## Common mistakes
| Mistake | Fix |
|---|---|
| Porting another database's syntax verbatim | Each engine differs — read the adapter, verify live |
| One mega-query over the connector limit | Shard into ≤-limit searches + dedup (union is identical) |
| Trusting vendor docs | Docs are often wrong (wildcards, phrase braces) — measure live |
| Not logging counts | Without string+filters+date+count per search, PRISMA is impossible |
| Deduping by title only | DOI first; title+year only as fallback |
| Chasing every synonym | Stop at diminishing returns — new term, no new relevant hits |

## Changes
- **0.1.0** — Initial. Database-agnostic SLR harvest method + adapter contract;
  ScienceDirect as the primary empirically-tested adapter (ported from a
  field-tested guide); RIS merge/dedup script. Stage 1 of the
  literature-search → `/literature-trends` → `/literature-fulltext` pipeline.
