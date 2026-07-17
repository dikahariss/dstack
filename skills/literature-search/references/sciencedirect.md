# Adapter: ScienceDirect (Elsevier) — web search engine

> Measured **live** on `https://www.sciencedirect.com/search` (2026). Elsevier's
> own docs are **wrong** on 5 points (wildcards, phrase braces, connector limit,
> char limit, precedence) — this file is measured behavior, not documentation.
> Scope: the ScienceDirect **website** only. NOT Scopus, NOT Web of Science, NOT
> the API. Example terms below (machine learning, organization, circular economy)
> are **incidental** — they demonstrate engine behavior, not a recommended topic.

## HARD RULES (break one → search fails or returns wrong results)
1. **Max 8 boolean connectors per field.** A connector is any `OR`, `AND`, or
   `AND NOT`. The 9th fails with: `Use fewer boolean connectors (max 8 per field)`.
2. **Max 9 terms per field** (9 terms need 8 connectors).
3. **Max 500 characters per field** (`qs`, `tak`).
4. **No wildcards.** `*` → ERROR (`Wildcards '*' are not supported`); `?` is
   silently ignored. Write full words.
5. **Use straight double quotes `"..."` for every multi-word phrase** — the only
   operator that keeps words adjacent.
6. **Never use curly braces `{...}`.** They do NOT mean "exact phrase" here; they
   silently degrade to `AND`.
7. **Wrap each concept group in `( )`** — `(a OR b) AND (c OR d)`.
8. **Operators in UPPERCASE:** `AND`, `OR`, `AND NOT`.
9. **Do not write US and UK spellings separately** — folded automatically
   (`organization` = `organisation`, both 325,355). Writing both wastes budget.
10. **Plurals are folded** (mostly) — `interview` also finds `interviews`.
11. **Over 9 terms? Split into multiple searches and merge.** You cannot fit a
    big query into one field.

## Adapter contract (filled)
| Slot | Value |
|---|---|
| Search field | **`tak`** = Title, Abstract, author Keywords (closest to Scopus TITLE-ABS-KEY). `qs` = all fields (broad, noisy — avoid for SLR). |
| Boolean limits | 8 connectors / 9 terms / 500 chars per field |
| Operators | phrase `"..."`; group `( )`; `AND`/`OR`/`AND NOT`; **no** wildcards; **no** `{}`; **no** proximity (`W/n`, `NEAR`) |
| Spelling / plurals | US/UK and plurals auto-folded — do not duplicate |
| Filters | `date`, `years`, `articleTypes`, `subjectAreas`, `accessTypes`, `publicationTitles` (no language filter) |
| Export | select-all → Export → "Export citation to RIS"; **cap 100 per export**; page with `show`/`offset` |
| Auth | institutional session for full text; citation export works while logged in |

## Field / URL parameters
Compose searches as a URL: `https://www.sciencedirect.com/search?<param>=<url-encoded>`.

| Field | Param | Max chars |
|---|---|---|
| Title, abstract, author keywords | **`tak`** | 500 |
| All fields | `qs` | 500 |
| Title | `title` | 150 |
| Journal/book title | `pub` | 200 |
| Author | `authors` | 100 |
| Year(s) | `date` | 15 |

The 8-connector limit is **per field**. Default field for an SLR: `tak`.

## Operators — measured proof
Three ways to write a two-word phrase give three different meanings (counts in `tak`):

| Typed | Result | Meaning |
|---|---|---|
| `"machine learning"` | 163,440 | phrase — words adjacent (CORRECT) |
| `machine learning` (no quotes) | 176,858 | `machine AND learning` (words anywhere) |
| `{machine learning}` | 176,858 | also `AND` — braces IGNORED |

Wildcards (measured): `recruit*` → ERROR; `organi?ation` → 3 results (the `?`
does nothing), whereas `organization` = `organisation` = 325,355. **Wildcards do
not exist here** — expand to explicit words: `("behavior" OR "behaviour")` only if
a variant truly differs (US/UK already folded, so usually unnecessary).

Precedence is `OR` → `AND` → `AND NOT`, but **always parenthesize** so you never
depend on it. Put `AND NOT (...)` at the END; avoid it if possible (can drop
relevant papers).

## Filters (append to any search URL)
| Filter | Param | Value |
|---|---|---|
| Year range | `date` | `2021-2026` (or one year) |
| Year(s) exact | `years` | `2026` or `2026,2025` |
| Article type | `articleTypes` | `FLA` research · `REV` review · `CH` book chapter · `ABS` conf. abstract |
| Subject area | `subjectAreas` | ASJC top-level code(s), comma-separated |
| Access | `accessTypes` | `openaccess` |
| Journal | `publicationTitles` | numeric journal id(s) |
| Results per page | `show` | `25` \| `50` \| `100` |
| Page offset | `offset` | `0`, `100`, `200`, … (with `show=100`) |

For a Scopus-style "research + review articles": `articleTypes=FLA,REV`.

ASJC subject codes (multiples of 100, range 1100–3600; ✓ = verified live):
`1400` Business, Management & Accounting ✓ · `1700` Computer Science ✓ · `1800`
Decision Sciences · `2000` Economics, Econometrics & Finance · `3200` Psychology
✓ · `3300` Social Sciences ✓.

Example filter suffix: `&date=2021-2026&articleTypes=FLA,REV&subjectAreas=1400&show=100`.
(Filters stack; commas may be written `%2C`.)

## Export to RIS (measured flow)
1. Open the search URL with `show=100` (100 results/page — the max).
2. Read the total (the "N results" text) and, for a trend study, expand the
   **Refine by → Years** facet ("Show more") to read the per-year counts (the
   **population** signal; the top-100 export is only a relevance-sorted sample).
3. Click the **select-all** checkbox at the top of the result list (label
   becomes "Download N articles").
4. Click **Export** → **"Export citation to RIS"**. A file
   `ScienceDirect_citations_<ts>.ris` downloads to the browser's download dir.
5. **Cap = 100 records per export.** For >100, page with `&offset=100`,
   `&offset=200`, … and export each page; or shard by concept and export each.
6. Move each download to a named file (e.g. `01-<slug>.ris`) before the next
   export (downloads share the same prefix).

URL-encoding for a `tak` value: space→`%20`, `"`→`%22`, `(`→`%28`, `)`→`%29`;
letters, digits, `OR`, `AND` stay literal.

## Worked example — sharding an over-limit query (neutral topic)
Target (2 blocks): Block A = 4 terms, Block B = 6 terms → `3 OR + 1 AND + 5 OR =
9 connectors` → **over the limit of 8**. Keep Block A whole (3 connectors) + the
`AND` (1) = 4 used → budget left = 4 connectors = **up to 5 Block-B terms per
search**. So 6 B-terms → 2 searches (split 3+3 for balance; up to 5 would fit),
then dedup:

```
Block A (kept whole): ("circular economy" OR "circular business model" OR "closed-loop" OR "reuse")
Search 1: (Block A) AND ("supply chain" OR "logistics" OR "procurement")
Search 2: (Block A) AND ("manufacturing" OR "packaging" OR "remanufacturing")
```
`(A AND b1..b3) OR (A AND b4..b6) = A AND (b1..b6)` — the union equals the single
big query. Export each search to RIS, then `scripts/ris_merge_dedup.py *.ris`.

## Caveats
- ScienceDirect `tak` searches **author keywords only** (no controlled index
  terms) → lower recall than Scopus for the same query. Treat ScienceDirect as a
  **complementary** source; confirm final counts in Scopus/WoS if available.
- Result counts drift as new papers publish; the **hard rules** (limits,
  wildcards, braces) are engine behavior. If Elsevier updates the UI, re-run one
  phrase probe and one wildcard probe (above) to confirm the rules still hold.
