# literature-search — changelog

- **0.4.6** — 2026-09-04: branch review 2026-09-04: the description names Perpusnas as the route to Neliti, not as an adapter.

- **0.4.5** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 87 words (120-word tier: the trigger list is the discovery path); quoted trigger phrases kept.

- **0.4.4** — 2026-09-04: the "Not for" line pointed at `/deep-research`, a skill that does not exist; it now points at `/researching-facts`.
- **0.4.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.2** — ADR-0030 catalog review (list openness, economy); panel-verified, see the 2026-08-14 review workflow.
- **0.4.1** — ADR-0030 list openness: common-mistakes table open — a new vendor brings its own.
- **0.4.0** — Dropped the one Indonesian trigger phrase (the literal translation
  of "search literature") from the description and the trigger list under the
  English-only rule (`/using-dstack` 0.7.0): models translate intent rather than
  matching lexically, so the phrase cost tokens without adding reach. Its slot in
  the description now reads "literature search", which the trigger list already
  carried. Preserved as data: the proper nouns **Neliti**, **Perpusnas**,
  ScienceDirect, Taylor & Francis, Springer, ProQuest, Emerald (including the
  `perpusnas e-resources` trigger and the EZproxy host) and the Neliti adapter's
  Indonesian-language filter value `languages=id` — those are matched against the
  live site.
- **0.3.2** — Measured `robots.txt` on all three proxied engines: each disallows the
  paths its own adapter told you to script (T&F `/action` — both `doSearch` and
  `downloadCitation`; Springer default-deny excluding `/search?query=` + `/search/csv`,
  banning `/article/*.ris*`; Neliti `/search` + `/citations/`). All three now route the
  harvest through the browser session, with the rule generalized in the body.
  Raised the body budget 4000→4500 to hold the compliance rule.
- **0.3.1** — Closed a contradiction with `/literature-fulltext`, which forbade exactly
  what the Neliti adapter prescribed. Adapter now leads with its `robots.txt` map, takes
  ids via browser and metadata via the allowed detail page (Highwire `<meta>`), and
  demotes `/citations/` + `/oai` to "documented, not a harvest path". Added the
  never-spoof-a-UA rule + an eval case, and flagged T&F's 100-DOI batch as extrapolated
  from a 3-DOI measurement (414 risk + fallback).
- **0.3.0** — Added three empirically-tested adapters, measured live via the
  Perpusnas EZproxy: **Taylor & Francis** (Atypon Literatum — clean RIS export +
  scriptable `downloadCitation`; UPPERCASE ops; stemming-on), **Springer Nature
  Link** (export-poor — CSV→DOI→enrich; UPPERCASE ops; left-to-right precedence;
  anti-bot "Client Challenge"), and **Neliti** (Indonesian index — bag-of-words
  search with no operators + per-record RIS endpoint, ~1,000-record ceiling).
  Generalized the "adapter shapes" note to four shapes; added EZproxy guidance;
  registered all three in the table, bundled files, triggers, and common mistakes.
  Added four `eval/` cases covering the new engines; raised the body budget
  3500→4000 (five adapters now exceed 90% of the old ceiling).
- **0.2.0** — Added the **ProQuest (guest)** adapter (`references/proquest.md`) — a
  **scrape-not-export** shape (no RIS in guest mode): session-hashed result URLs,
  20/page cap, `localStorage`+`<article>`/`get_page_text` exfiltration, browser PDF
  handoff. Introduced the "two adapter shapes" note; registered ProQuest in the
  table, bundled files, and triggers. Empirically measured on a 674-record harvest.
- **0.1.0** — Initial. Database-agnostic SLR harvest method + adapter contract;
  ScienceDirect as the primary empirically-tested adapter (ported from a
  field-tested guide); RIS merge/dedup script. Stage 1 of the
  literature-search → `/literature-trends` → `/literature-fulltext` pipeline.
