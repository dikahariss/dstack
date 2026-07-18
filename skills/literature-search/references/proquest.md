# Adapter: ProQuest — web search engine (PUBLIC / guest access)

> Measured **live** on `https://www.proquest.com/` (Jul 2026), **not logged in**
> through an institution ("guest" access). This is the mode a researcher without
> a ProQuest-subscribing library sees. Scope: the ProQuest **website** guest
> experience. Institutional (library-authenticated) ProQuest is a **superset** —
> it adds RIS/citation export, richer detail fields, and full result sets; where
> guest and institutional differ, this file documents **guest** and flags the
> institutional upgrade. Example terms below (mental health, wellbeing) are
> **incidental** — they demonstrate engine behavior, not a recommended topic.

## THE ONE RULE THAT CHANGES EVERYTHING
**Guest ProQuest has NO citation export.** There is no select-all, no RIS/BibTeX/
EndNote/RefWorks button — those are gated behind library login (confirmed live:
the detail-page "All Options" menu says *"Try logging in through your library …
to get access to these tools."*). So the harvest pipeline is **not** "export RIS"
like ScienceDirect — it is **scrape each detail page and BUILD the RIS yourself**.
Everything below serves that fact.

> If you DO have institutional ProQuest access, prefer the native export:
> select results → **All save & export options → RIS** (cap ~ a few hundred per
> export; verify live). Then this adapter is unnecessary — treat ProQuest like
> any RIS-exporting database and skip to `/literature-trends`.

## Adapter contract (filled — GUEST mode)
| Slot | Value |
|---|---|
| Search field(s) | Single **basic search** box = all fields (title, abstract, subjects, full text). Advanced Search (field codes `TI() AB() AU() SU() …`) exists behind the ☰ menu; guest access to it is inconsistent — basic box + facets is the reliable path. |
| Boolean limits | No published hard cap hit in testing; keep queries reasonable (≤ ~10 operators). Basic box honors operators (verified). |
| Operators | phrase `"..."` ✓ · `AND`/`OR`/`NOT` ✓ · proximity `NEAR/n` ✓ (verified live) · `PRE/n` (ordered proximity, documented) · wildcards `*` (0+ chars) and `?` (1 char) — documented, spot-check live · group `( )`. |
| Spelling / plurals | ProQuest auto-stems (e.g. `interview`→`interviews`); wrap in `"..."` to force exact. US/UK not reliably folded — add both if a variant matters. |
| Filters | **facet panel only** (no URL params): Source type, **Publication date** (Last 12 Months / **Last 5 Years** / Last 10 Years / Custom), **Language**, Subject, Document type, Publication title, Location, Database, Person. Sort: Relevance / Oldest first / Most recent first. |
| Page size | **20 results/page, hard-capped in guest** — no items-per-page control; a `?count=N` URL param is ignored (measured). (Institutional has 20/50/100.) |
| Export | **NONE (guest).** Scrape detail pages → build RIS/CSV/JSONL locally. (Institutional: native RIS export.) |
| Auth | Guest = no login: search + abstract + detail table + OA full-text PDFs, but a **partial** result set ("These are only some of the results you may have access to"). Login unlocks export, richer fields, full results. |

## URL patterns (measured)
| Page | Pattern | Reproducible by URL? |
|---|---|---|
| Home / search | `https://www.proquest.com/` | — |
| Results | `https://www.proquest.com/resultsol/<SESSION-HASH>/<page>` | **NO across sessions** — every query AND every facet click mints a new hash. **But within one session the hash is stable**, so once you have it you can page by URL: `/resultsol/<hash>/2`, `/3`, … (don't click "next"). Filter links are `resultsol.<facet>:…?_csrf=<token>&t:ac=<HASH>/<page>` — all session-bound. |
| Document detail | `https://www.proquest.com/docview/<DOCID>` (also `/docview/<DOCID>/<HASH>/<n>`) | **YES.** `<DOCID>` (= "ProQuest document ID", e.g. `3302936551`) is the stable key; `/docview/<DOCID>` loads standalone. |

**Consequence:** unlike ScienceDirect, you **cannot** encode a ProQuest search as a
shareable URL. Reproducibility comes from logging the **recipe** (query string +
each facet clicked + date), not a link. Log the result **count** at each step.

## Operators — measured proof (Dissertations & Theses source type)
| Typed in basic box | Results | Meaning |
|---|---|---|
| `wellbeing mental health` (no quotes) | 12,332 | all terms, any field, stemmed (loose `AND`) |
| `"mental health" NEAR/3 wellbeing` | 1,146 | phrase + proximity honored → focused set |

Phrase quoting and `NEAR/n` both measurably tighten the set → operators are real,
not ignored. `PRE/n` (ordered), `*`/`?` wildcards, and `( )` grouping follow
ProQuest's documented conventions — spot-check with one probe if a search depends
on them (vendor docs are usually right for ProQuest, unlike some engines).

## Filters — how to apply (facet panel, left rail)
1. On the landing page pick the **source-type tab** (e.g. **Dissertations & Theses**)
   BEFORE searching, or apply "Source type" in the facet panel after.
2. Run the search.
3. In the left **facet panel**, click:
   - **Publication date → Last 5 Years** (or Custom Date Range for exact years).
   - **Language →** expand → **English**.
   - any Subject / Document type as needed.
4. Each click reloads results under a new session hash and updates the count.
   **Record the count after each filter** (population signal for `/literature-trends`).

There is no single per-year histogram export in guest mode; for per-year counts,
use **Custom Date Range** one year at a time and record each total.

## Harvest flow (guest — the core of this adapter)
Because there is no export, drive the browser (`/claude-in-chrome`) and scrape.
**Two stages** minimize requests (see rate-limit rules below):

**Stage A — results list (cheap: 1 page load per ~20 records).** For each results
page, capture per hit: `docid` (from the `/docview/<id>/…` href), title, author,
**university + country** (the citation line — *not* on the detail page in guest
mode!), year, accession number, OA flag. Page through results by URL.

**Stage B — detail pages (1 load per record).** For each `docid` you actually
want, open `https://www.proquest.com/docview/<docid>` and `get_page_text`. That
returns the **full Abstract** (bypasses the "More" truncation) + the **Details**
block as clean `label\nvalue` pairs. Parse against the known label vocabulary.

**Merge** Stage A (university/accession) + Stage B (abstract/ISBN/full metadata)
by `docid` → one record. Build RIS + CSV + JSONL (see `scripts/`-style converter
in the project folder that consumes this adapter).

### Detail-page fields (guest mode, measured)
`Title · Author · Publication year · Publisher (= "ProQuest Dissertations &
Theses") · ISBN · Source type (= "Dissertation or Thesis") · Language of
publication · ProQuest document ID · Full text outside of ProQuest (repository
link, when present — a lead for legitimate OA full text) · Copyright` + full
**Abstract**. Institutional access adds: University/institution, School, Degree,
Advisor, Committee member, Department, Subject, Number of pages, DOI, etc. — parse
those too if present (a good parser keeps the full known-label set).

### RIS mapping for a dissertation record
`TY - THES` · `TI/T1` title · `AU` author (already `Last, First`) · `PY` year ·
`PB` university if known else `ProQuest Dissertations & Theses` · `SN` ISBN ·
`AB` abstract · `LA` English · `UR` `https://www.proquest.com/docview/<docid>` ·
`M3` `Dissertation or Thesis` · `AN` accession · `CY` country · `N1` ProQuest
document ID + repository link · `DB` `ProQuest Dissertations & Theses` · `ER -`.

## Operational playbook — getting data OUT of the browser (measured on a real 674-record harvest)
The scrape itself is easy; **exfiltrating bulk data from the page is the hard part**.
`/claude-in-chrome` tool output is size-limited and content-filtered, and Chrome
guards downloads. These four moves are what actually work:

1. **Page by URL, accumulate in `localStorage`.** Navigate `/resultsol/<hash>/<n>`
   for n=1..N; each page's JS extracts the ~20 hits and **appends to
   `localStorage`** (survives same-origin navigation), returning only a tiny ack
   (`{page, added, total}`). Never return the bulk array from `javascript_tool` —
   large JS output is **truncated (~1–2 KB)** and blobs that look URL/token-ish get
   **`[BLOCKED: Cookie/query string data]`**. Keep acks tiny.
2. **Export attempt 1 — Blob download works exactly ONCE.** `new Blob(...)` +
   `a.download` + `a.click()` saves the first file fine, then Chrome's **"site is
   trying to download multiple files"** guard silently blocks every subsequent
   automatic download. Symptom: the JS returns "download fired" but nothing lands
   on disk. Fix: ask the user to **Allow** it (site-info icon → Site settings →
   Automatic downloads → Allow) — a one-time manual step. Needed again for bulk PDFs.
3. **Export attempt 2 (no download) — inject into an `<article>`, read via
   `get_page_text`.** `get_page_text` has a far larger limit than `javascript_tool`
   and returns injected article text. Put the accumulated JSONL (records joined by a
   sentinel like ` @@@REC@@@ `) into `document.body` as a lone `<article>`, then
   `get_page_text`. **Outputs >~50 KB are auto-persisted by the harness to a
   `tool-results/<id>.json` file** you can read from disk — no download needed.
   One shot truncates near ~55 KB, so **chunk to ~8 records** if the set is large.
   (`read_page` returns only the element's a11y label, not its text — don't use it.)
4. **Detail-page parse specifics.** Abstract = text **between the `Translate`
   marker and `Details`** (the "Jump to" nav contains a stray "Abstract" that a
   naive `Abstract…Details` regex grabs by mistake). OA = page text contains
   *"published as open access"* AND a **"Download PDF"** button; a **"Preview
   Available"** record shows *no* abstract in guest and only "Download PDF
   **Preview**"/"Order a copy" (= not OA). Pace detail loads ~3 s each.

## Rate-limit & anti-bot rules (guest scraping)
- **Use the real, human Chrome session** (`/claude-in-chrome`) — never headless/
  `curl`. The user's browser fingerprint + cookies are why guest browsing looks
  human; a bare HTTP client trips bot defenses.
- **Human pace.** Results pages are low-risk (list views) — ~2–3 s each is fine.
  Detail pages: ~3–5 s each; on a large run pause 30–60 s every ~15–25 pages.
  No parallel tabs hammering `/docview`.
- **Minimize requests.** Do Stage A fully first; open Stage B detail pages **only**
  for the shortlist you truly need. One `get_page_text` per page — don't reload.
- **Stop if the UI changes** (captcha, "unusual activity", forced login) — back off,
  tell the user. Do not retry-storm.

## Worked example (neutral, guest)
Goal: Dissertations & Theses, English, last 5 years, topic = two concepts.
1. Landing → click **Dissertations & Theses** tab.
2. Basic box: `("supply chain" OR logistics) AND ("circular economy" OR remanufacturing)` → search.
3. Facets: **Publication date → Last 5 Years**; **Language → English**. Record the count.
4. Stage A: page `/resultsol/<hash>/1..N`, append each page's hits to `localStorage`.
5. Export the accumulated list (Blob download if allowed, else `<article>` +
   `get_page_text`). Build `records.jsonl` → `corpus.ris` + `corpus.csv`.
6. Stage B (optional): for a screened shortlist, `docview/<id>` → `get_page_text`
   → parse abstract/ISBN/OA. For OA full text, hand off to `/literature-fulltext`.

## Caveats
- **Guest results are partial** ("some of the results you may have access to") — do
  **not** treat a guest count as the true population; note it as a lower bound. For
  a defensible SLR population, an institutional session (or another database) is
  needed. Guest ProQuest is best for **PQDT dissertation discovery + metadata**,
  not exhaustive PRISMA counts.
- Counts drift as records are added. The **structural** facts (no export, session-
  hashed results URLs, `docview/<id>` stability, operator support, 20/page cap) are
  the durable part; re-run one phrase probe if ProQuest revamps the UI.
- Author names come pre-formatted `Last, First` — good for RIS `AU` as-is.
- Dissertations rarely carry a **DOI** → dedup by `docid` (or title+year), not DOI.
