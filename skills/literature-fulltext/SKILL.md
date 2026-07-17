---
name: literature-fulltext
description: >
  Use when downloading full-text PDFs for a citation
  corpus — resolving open-access availability by DOI via Unpaywall or the
  database's own OA flag, fetching ONLY legitimately open-access or
  institution-licensed content, politely rate-limited, with a license manifest.
  Stage 3 after /literature-search and /literature-trends. Triggers: "download OA
  PDF", "fetch full text", "unduh artikel", "unpaywall", "download articles for
  these DOIs", "open access download", "get the PDFs", "download open access".
allowed-tools: Read Bash Write Edit
metadata:
  dstack:
    type: hybrid
    version: 0.1.0
    context_budget_tokens: 2500
    side_effects: external
    agency: deliberative
    triggers:
      - download oa pdf
      - fetch full text
      - unduh artikel
      - unpaywall
      - download articles
      - open access download
      - get the pdfs
---
# /literature-fulltext

Fetch **full-text PDFs** for a citation corpus — but **only content that is
legitimately open-access or licensed to your institution**. **Stage 3** of the
pipeline (`/literature-search` → `/literature-trends` → **fulltext**).

## Legal / ethical gate — non-negotiable
- **Only** download: gold/green/bronze **open-access** articles (author- or
  publisher-posted) OR articles your **institution is licensed** for.
- **Never** bypass paywalls, logins, or captchas; never use pirate mirrors
  (Sci-Hub and the like). If a DOI is closed, **skip it** and record it as closed.
- Respect each host's **robots.txt / Terms of Service** and **rate-limit**
  (default ≥1s between requests; back off on 429/503).
- Downloading is an **external side effect**: state the scope (how many PDFs,
  from where, est. size) and get the user's go-ahead **before a bulk fetch**.

## When to use
- Building a local OA full-text set for a review corpus you already harvested.
- Resolving which of a DOI list are open-access and fetching those.

**Not for:** mass-downloading a publisher's catalog; acquiring paywalled papers;
scraping behind authentication. Use the publisher's own bulk/TDM API if you have
a text-and-data-mining agreement.

## Method (the spine)
1. **Extract DOIs** from the corpus (the RIS `DO` field of the merged corpus, e.g.
   `corpus-merged-dedup.ris` from `/literature-search`).
2. **Resolve OA** per DOI via **Unpaywall** (`api.unpaywall.org/v2/<doi>?email=
   <you>` — the email is mandatory and identifies you). Read `is_oa` and
   `best_oa_location.url_for_pdf` + `license`.
3. **Filter** to `is_oa == true` (plus anything your institution session grants).
   Everything else → the closed list (skip, do not force).
4. **Download politely** — `scripts/oa_fetch.py`: rate-limited, descriptive
   User-Agent with contact, retry/backoff, verify the response is a PDF.
5. **Save + manifest** — one PDF per DOI (`<doi-slug>.pdf`) and a manifest row:
   `doi, is_oa, license, host, url, file, bytes, status`.
6. **Report** counts: OA found / downloaded / closed-skipped, and the manifest
   path.

**Where judgment takes over:** which OA location to trust when several exist,
whether an institution session legitimately grants access, and how to treat an
ambiguous or missing license (default: record it, don't redistribute).

## Checklist (before a bulk fetch)
- [ ] Scope stated (count, hosts, est. size) and user approved.
- [ ] Unpaywall email set; rate limit ≥1s; back-off on errors.
- [ ] Only `is_oa` (or institution-licensed) DOIs queued; closed ones skipped.
- [ ] Each download verified as a real PDF; license recorded in the manifest.
- [ ] No paywall/captcha/login bypass anywhere in the run.

## Bundled files
- `scripts/oa_fetch.py` — given a RIS/DOI list + `--email`, resolve OA via
  Unpaywall and download the open-access PDFs, rate-limited, writing a manifest
  CSV. Skips closed DOIs. `--help`.

## Common mistakes
| Mistake | Fix |
|---|---|
| Fetching a closed-access DOI anyway | Skip it; record as closed — never bypass the paywall |
| Calling Unpaywall without `email` | It is mandatory; requests without it are rejected/blocked |
| Hammering hosts | Rate-limit ≥1s, back off on 429/503 |
| Saving the DOI landing page as "the PDF" | Verify `Content-Type: application/pdf` before saving |
| Not recording the license | Log `license` per file; do not redistribute unknown-license PDFs |
| Bulk-fetching without asking | External side effect — state scope, get approval first |

## Changes
- **0.1.0** — Initial. OA-only full-text fetch via Unpaywall with a hard legal/
  ethical gate, polite rate-limiting, and a license manifest. Stage 3 of the
  literature pipeline.
