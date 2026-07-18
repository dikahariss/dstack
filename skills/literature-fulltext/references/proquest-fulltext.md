# ProQuest dissertations — browser-driven OA full-text (no DOI)

> For a **ProQuest Dissertations & Theses (PQDT)** corpus harvested via the
> `/literature-search` ProQuest **guest** adapter. Measured live (Jul 2026) on a
> real 30-PDF fetch. Dissertations have **no DOI**, so the Unpaywall spine in the
> parent skill does not apply — OA is read from ProQuest's own page, and the PDF
> comes **through the logged-in browser** (`/claude-in-chrome`), not `oa_fetch.py`.

## The legal gate still holds
Only fetch **open-access** dissertations (author-retained, published OA on ProQuest)
or ones the repository link exposes freely. Never bypass "Order a copy"/paywall/
login. Preview-only records → **skip, record as closed**. State scope (count, ~size)
and get the user's go-ahead before the bulk fetch — dissertation PDFs are large
(~0.5–8 MB each).

## Step 1 — decide OA per docid (on the `docview/<id>` page)
| Signal on the detail page | Meaning |
|---|---|
| *"published as open access"* text **and** a **"Download PDF"** button | **OA → fetch** |
| **"Download PDF Preview"** + **"Order a copy"**, no abstract, "Preview Available" | **not OA → skip** (closed) |
| **"Full text outside of ProQuest"** → a repository URL (e.g. institutional `…/handle/…`) | second legitimate OA route — fetch from the repo instead if the ProQuest PDF is closed |

Detect in one JS pass while you Stage-B the detail page (see the search adapter):
`oa = /published as open access/i.test(bodyText)` and a button whose text matches
`/download pdf/i` (exclude "Download PDF **Preview**").

## Step 2 — fetch (browser only)
1. `navigate` to `https://www.proquest.com/docview/<docid>`, wait ~3 s for the
   reader to load.
2. Click the **Download PDF** icon (top-right toolbar). It saves **directly** to the
   browser download dir, named by the **title prefix** (e.g. `Burnout,_Engagement,_and_Produ.pdf`).
   - The download URL carries **session tokens** — you **cannot** capture it or
     `curl` it; that is why it must go through the browser. (Trying to read the
     button's `href` trips the `[BLOCKED: Cookie/query string data]` filter.)
3. Wait ~4 s so the file finishes before the next navigation.

## Step 3 — the Chrome "multiple downloads" guard (the gotcha)
The **first** download from `proquest.com` succeeds; **every subsequent automatic
download is silently blocked** by Chrome's "site is trying to download multiple
files" guard. Symptom: the click fires, but nothing lands on disk.
**Fix (one-time, user action):** site-info icon (left of the address bar) → **Site
settings** → **Automatic downloads** → **Allow**. You cannot click Chrome chrome —
ask the user. After that, bulk downloads flow.

## Step 4 — map files → docids, verify, manifest
Filenames are title-derived (truncated, collide on `(1)`), so **do not** trust the
name — map by **download order == click order**: after each small batch, take the N
newest `*.pdf` by mtime and move to `pdf/<docid>.pdf`, in the order you clicked.
Downloads complete in click order at ~4 s spacing, so mtime order is reliable;
sanity-check by comparing the filename prefix to the title.
- **Verify** each is a real PDF (`file <f>` → "PDF document"); a landing page saved
  as `.pdf` is a failure.
- **Manifest** row per record: `docid, title, oa, license, source(=docview URL),
  pdf_file, bytes, status(downloaded|skipped_not_oa)`. License =
  `ProQuest Open Access Dissertation (author-retained; ProQuest does not claim
  copyright in the underlying work)`.

## Pace / batch
`browser_batch` of ~8 navigate+click cycles can exceed the tool timeout (each PDF is
nav + ~3 s + click + ~4 s ≈ 8 s). Use **~5 per batch**, then move that batch's files,
then continue. Downloads keep going even if the batch tool call times out — check
disk before assuming failure.

## Worked shape
```
shortlist docids (OA only) -> for each, in batches of ~5:
  navigate docview/<id>; wait 3s; click Download PDF (top-right); wait 4s
-> move N newest ~/Downloads/*.pdf (mtime order) -> pdf/<docid>.pdf (click order)
-> verify PDFs; write pdf-manifest.csv
```
