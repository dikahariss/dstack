# literature-fulltext — changelog

- **0.4.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.4.1** — ADR-0030 list openness: common-mistakes table open; the legal/ethical gate is closed by design.
- **0.4.0** — English-only pass (`using-dstack` 0.7.0: models translate intent,
  so the phrase only cost tokens); "download articles for these DOIs" and "get
  the PDFs" already covered it. Preserved as data: Neliti, ProQuest, Unpaywall
  and the `media.neliti.com` / `citation_pdf_url` details.
  `context_budget_tokens` re-targeted 2500 → 2750: the body had been sitting at
  2239/2500 since 0.3.0, so any edit tripped the near-budget warning.
- **0.3.0** — Fixed a **recall bug** in `oa_fetch.py`: reading only
  `best_oa_location.url_for_pdf` silently dropped gold-OA records whose best location
  exposes no direct PDF (measured: eLife `10.7554/eLife.00005` reported closed, yet
  `oa_locations[1]` served a 22-page PDF). It now falls back to the first
  `oa_locations` entry with a PDF, reporting that copy's `host` but **keeping the best
  location's license** when the copy declares none (a blank license reads as "unknown
  → don't redistribute"); the summary separates `closed_skipped` from `oa_no_pdf`.
  Added the **Neliti** no-DOI path (browser-gathered ids → `citation_pdf_url` →
  `media.neliti.com`), closing the handoff `/literature-search`'s Neliti adapter
  promised — with its `robots.txt` limits (`/search`, `/citations/`, `/oai`
  disallowed; scripted UA gets 403; no UA spoofing) and per-record license variance.
- **0.2.0** — Added the **no-DOI ProQuest dissertation** path
  (`references/proquest-fulltext.md`): OA read from ProQuest's own flag (not
  Unpaywall), browser-driven PDF download (session-token URLs, the Chrome
  "multiple downloads" guard, mtime→docid mapping, PQDT license). Same legal gate.
  Empirically measured on a 30-PDF fetch. Triggers + mistakes rows added.
- **0.1.0** — Initial. OA-only full-text fetch via Unpaywall with a hard legal/
  ethical gate, polite rate-limiting, and a license manifest. Stage 3 of the
  literature pipeline.
