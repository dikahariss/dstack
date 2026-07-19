# Adapter: Taylor & Francis Online (Atypon Literatum) — web search engine

> Measured **live** on `https://www.tandfonline.com/action/doSearch` (2026),
> reached through an EZproxy (Perpusnas port `:2162`). T&F runs the **Atypon
> Literatum** engine (Lucene/Solr) — the same platform many publishers use, so this
> adapter largely transfers to sibling Literatum sites. Scope: the `tandfonline.com`
> **journal** search, NOT the `taylorfrancis.com` eBooks platform. Example terms
> (machine learning, robotics, organization, behaviour) are **incidental** — they
> demonstrate engine behavior, not a topic.

## HARD RULES (break one → wrong results)
1. **Operators must be UPPERCASE** `AND` / `OR` / `NOT`; default between words is
   **AND**. A lowercase `or` is a literal search term. Measured: `"machine learning"
   OR "robotics"` = **41,569** vs `"machine learning" or "robotics"` = **39**.
2. **Grouping `( )` — parentheses must be BALANCED.** An unbalanced bracket returns
   **0 results silently** (not an error). Precedence is `NOT` → `AND` → `OR`, but
   parenthesize mixed-operator queries anyway. Validate against the **parsed-query
   echo** Literatum renders above the results.
3. **Double quotes `"..."` = exact phrase AND disable stemming.** Measured: phrase
   `"machine learning"` = 36,375 < unquoted `machine learning` = 59,395; and
   `"organization"` = 164,678 < unquoted `organization` = 282,593 (quotes strip the
   stemmer). Inside quotes, wildcards/operators/proximity are treated literally.
4. **Stemming is ON by default** for text/full-text fields (plurals + word forms:
   `organization` also matches `organize`, `organizational`). **US/UK spellings are
   folded** — measured `behavior` = 470,015 ≈ `behaviour` = 471,111. So **do not**
   spend query slots on plural or US/UK variants; quote a term only when you need it
   exact.
5. **Wildcards:** `*` = 0+ chars (`behavi*` = 445,910), `?` = 0/1 char. **A leading
   wildcard (`*ology`) ERRORS.** Wildcards are **ignored inside quotes** and are not
   stemmed.
6. **Proximity** `"climate policy"~3` (within 3 words); **fuzzy** `term~` (spelling
   variants). Both Lucene-style.
7. **No connector/term cap** (unlike ScienceDirect's 8) — chain many `OR`s freely
   (practical ceiling ≈ 2,000 chars). **Little to no sharding needed** for the query
   itself; shard only to page the export.
8. **Stop-words** (a, is, the, of…) are dropped unless quoted.
9. **`NOT` — use sparingly, and only at the END.** A `NOT` block placed early can strip
   relevant papers that merely *mention* the excluded term, which is a silent recall loss
   in an SLR. Prefer screening the noise out afterwards over excluding it in-query.

## Adapter contract (filled)
| Slot | Value |
|---|---|
| Search field | **`AllField`** = all fields **including full text** (broad, recall-first; closest single param to a recall search). Field-scoped params exist via the Advanced form: `Title`, `Abstract`, `Keyword`, `ContribAuthorRaw` (author), `doi`, `Affiliation`. |
| Boolean limits | **none published** — no per-field connector cap; ~2,000-char practical limit |
| Operators | phrase `"..."` (disables stemming); group `( )` (balanced!); `AND`/`OR`/`NOT` UPPERCASE, default AND; wildcards `*` `?` (no leading, none in quotes); proximity `"..."~n`; fuzzy `term~` |
| Spelling / plurals | **auto-stemmed + US/UK folded** — quote to force exact |
| Filters | `ContentItemType`, `AfterYear`+`BeforeYear`, `subjectTitle`, open-access facet, `sortBy` (below) |
| Export | **clean RIS.** Select-all-on-page → **Download citations** → RIS/BibTeX/EndNote/Text/RefWorks + Citation / Citation&Abstract. **Scriptable endpoint** `/action/downloadCitation` (below) — **multi-DOI, no login, includes abstract** |
| Auth | full text needs entitlement (the proxy supplies it); **search + citation/RIS export need no login** |

## Field / URL parameters
Compose as a URL: `https://www.tandfonline.com/action/doSearch?AllField=<enc>&...`
(through the proxy: `https://e-resources.perpusnas.go.id:2162/action/doSearch?...`).
URL-encode space→`%20`, `"`→`%22`, `(`→`%28`, `)`→`%29`; keep `AND`/`OR`/`NOT`
literal & uppercase.

| Purpose | Param | Notes |
|---|---|---|
| All fields (+ full text) | **`AllField`** | default recall search |
| Title / Abstract / Keyword / Author | `Title` / `Abstract` / `Keyword` / `ContribAuthorRaw` | via Advanced form; verify multi-row grammar live |
| Content type | `ContentItemType` | `research-article` · `review-article` · `other` · `book-review` · `editorial` — **repeat the param** to union types |
| Date range | `AfterYear` + `BeforeYear` | `AfterYear=2021&BeforeYear=2026` (inclusive year range) |
| Subject | `subjectTitle` | URL-encoded display name |
| Sort | `sortBy` | `relevancy` · `Earliest_asc` (oldest) · newest / most-downloaded variants |
| Results per page | `pageSize` | **`100` works** (confirmed) — use it to page the export |
| Page (0-indexed!) | `startPage` | `0` = first page; `pageSize=100&startPage=1` = records 101–200 |

To mirror a Scopus "research + review": `&ContentItemType=research-article&ContentItemType=review-article`.

## Export to RIS — the scriptable path (measured)
T&F is a **clean export-RIS adapter** (contrast Springer). Two routes:

**A) UI:** on the results page tick records (or **select-all**, which grabs the
current page) → **Download citations** → choose **RIS** + **Citation & Abstract**.
Select-all = the current page, so set `pageSize=100` and page with `startPage`.

> **robots.txt: `Disallow: /action` and `Disallow: /search` for `User-agent: *`.**
> That covers **both** `/action/doSearch` and `/action/downloadCitation` — a plain prefix
> rule, no wildcard ambiguity. So route B is **not** a licence to run an unattended
> `curl` loop: drive the search and the citation download from the **logged-in browser
> session** (route A, or `downloadCitation` triggered from that session), paced. The
> institutional entitlement authorizes *your reading*, not a crawler. If you need
> corpus-scale automation, ask T&F for API/TDM access rather than scripting `/action`.

**B) The endpoint's shape (drive it from the browser, don't crawl it):**
```
/action/downloadCitation?doi=<DOI>&format=ris&include=abs&direct=true&submit=Download+citation
```
- **`include=abs`** = citation **+ abstract** (`include=cit` = citation only).
- **Multiple records in one call: repeat `&doi=<DOI>`** — measured: 3 DOIs → one
  RIS file with 3 records. **No login** (works through the proxy session).
- Returned RIS fields (measured): `TY T1 AU Y1 PY DA DO T2 JF JO SP VL IS PB AB SN M3 UR ER` — includes the **abstract** (`AB`).

**Harvest loop:** search with `pageSize=100` → scrape the 100 DOIs from the page
(`data-doi` attributes / `/doi/…` hrefs) → one `downloadCitation` call with 100
`&doi=` → a 100-record RIS → advance `startPage` → repeat → merge + dedup by DOI
(`scripts/ris_merge_dedup.py`). One request per 100 records; pace politely.

> **Batch size is measured at 3 DOIs, not 100.** 100 `&doi=` builds a ~4,000-char
> URL, which the server may reject (**414 URI Too Long**). Ramp up — try 100, and
> on a 414/empty response fall back to **25–50 DOIs per call** (or POST the form if
> the UI issues one). Verify the RIS record count equals the DOIs you sent before
> advancing `startPage`; a short file means the batch was silently truncated.

## Filters — measured example
`"machine learning"` as `ContentItemType=research-article`, `AfterYear=2022`,
`BeforeYear=2026`, `pageSize=100` → **36,375 results**, **100 DOIs/page**. Open
access has a "Only show Open Access" facet in the refine panel — capture its exact
URL param live if you need OA-only (not confirmed here).

Per-year population (for `/literature-trends`): re-run the query once per year with
`AfterYear=YEAR&BeforeYear=YEAR` and read each total — the harvested pages are a
relevance-sorted sample, not the population. Log the per-year totals for PRISMA.

## Worked example — a 2-block query (no sharding needed)
Because there is **no connector cap**, both concept blocks fit in one `AllField`:
```
AllField = ("circular economy" OR "closed-loop" OR "remanufacturing")
           AND ("supply chain" OR "logistics" OR "procurement")
&ContentItemType=research-article&ContentItemType=review-article
&AfterYear=2021&BeforeYear=2026&pageSize=100&sortBy=relevancy
```
Both OR blocks are parenthesized and balanced (rule 2); operators UPPERCASE (rule
1); no plural/US-UK variants needed (rule 4). Then page `startPage=0,1,2,…` and
pull RIS per page via `downloadCitation`.

## Caveats
- **`AllField` includes full text** → higher recall but noisier than a
  title-abstract-keyword search. Tighten with an extra `AND` block or scope to
  `Title`/`Abstract`/`Keyword` via the Advanced form when precision matters.
- **Unbalanced parentheses → 0 results, silently.** Always check the parsed-query
  echo Literatum prints above the results before trusting a count.
- The **engine rules** (uppercase operators, quotes-disable-stemming, no-leading-
  wildcard, 0-indexed `startPage`, `downloadCitation` shape) are stable Literatum
  behavior; **counts** drift as content publishes. Re-run the uppercase-`or` probe
  (rule 1) and the quoted-vs-unquoted probe (rule 3) if the platform changes.
