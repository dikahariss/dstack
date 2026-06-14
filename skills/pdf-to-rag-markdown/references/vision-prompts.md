# Vision transcription prompts

Two profiles, both used by `vision_transcribe.js`. Each agent **Reads the page
PNG** then returns a structured object `{page, markdown, kind, blank}`. The schema
forces faithfulness; the prompt enforces structure for RAG.

The single inviolable rule in both: **transcribe ONLY what is visible. Never
invent, summarize, paraphrase, or translate. Blank cells stay blank. Faithfulness
over completeness.** Preserve Indonesian spelling/casing/numbers exactly —
including the source's own typos.

---

## Profile: `govdoc` (prose / cover / signature / table pages)

```
You are transcribing ONE scanned page of an Indonesian Government document
(Instruksi Presiden / Peraturan / Keputusan) into clean Markdown for a RAG
knowledge base. The page is a scanned image; transcribe it faithfully FROM THE
IMAGE.

STEP 1 — Read the image file with the Read tool: <PNG_PATH>
STEP 2 — Transcribe what is VISIBLE. ABSOLUTE RULES:
- Transcribe ONLY text on the page. NEVER invent/summarize/paraphrase/translate.
  If the page is blank or only an emblem/letterhead, return near-empty markdown
  and set blank=true.
- Preserve Indonesian spelling, capitalization, numbers, punctuation EXACTLY
  (keep source typos).
- JOIN hard-wrapped lines into proper paragraphs / single list items (the source
  justifies text, breaking sentences across many lines). No one-word-per-line.

STRUCTURE for RAG:
- Main document title → "# ..."; immediate subtitles → "## ...". (Only at the
  very top of the document.)
- Garuda emblem text "PRESIDEN / REPUBLIK INDONESIA" → omit; set kind=emblem if
  that is all there is.
- Operative clauses (KESATU/KEDUA/PERTAMA/…, "Kepada:", "Untuk:") → "### KESATU"
  style headings or clean lists; preserve nested a./b./1)/2) sub-items.
- Tables → valid Markdown pipe table; merge multi-line headers into one cell;
  drop a pure "1 2 3" column-number row; never invent data for blank cells.
- Signature block (place, date, "ttd", name) → plain text lines, NOT headings;
  put "ttd" on its own line before the name.
- Page numbers / running headers ("-5-", "2021, No. 778") → OMIT.

Return ONLY: page=<n>, markdown=<clean md, no page marker, no frontmatter>,
kind=<cover|prose|list|table|signature|emblem|blank|other>, blank=<bool>.
```

## Profile: `flowchart` (bagan alur / process diagram / scrambled table pages)

Use when the deterministic extractor read a page's boxes/labels in scrambled
order (vector flowcharts have a text layer but no reading order).

```
You are transcribing ONE page that is a FLOWCHART (bagan alur), a process/
workflow diagram, or a table drawn as vector graphics — the text extractor read
its boxes in SCRAMBLED order, so re-read the VISUAL structure FROM THE IMAGE.

STEP 1 — Read the image: <PNG_PATH>
STEP 2 — Transcribe what is visible, in correct visual order. ABSOLUTE RULES:
faithfulness as above.

STRUCTURE for RAG:
- Section heading if present ("w. Bagan alur layanan", "Bagan Alur (Flow Chart)
  Penerbitan ...") → "### ..." using the exact title.
- A flowchart with SWIMLANES (actor columns: Pemohon, Pelaksana, Sub Koordinator,
  Kasubdit, Direktur, Output) → a valid pipe table: one row per numbered step,
  columns = the lanes; mark the acting lane, leave other lanes blank, fill the
  Output column. Equal column count on every row.
- A pure flowchart (no lanes) → an ORDERED nested list following the arrows
  (top→bottom); each box is an item with its exact label; a decision diamond
  (Ya/Tidak, Setuju/Revisi/Tolak) becomes labelled sub-items. Do NOT invent
  connections.
- A plain table → valid pipe table.
- Page number ("-37-") → OMIT.

Return ONLY: page=<n>, markdown=<clean md>, kind=<flowchart|table|prose|other>,
blank=<bool>.
```

## Fix-pass prompt (phase 4 — structure only, verbatim)

```
Repair the Markdown STRUCTURE of one chunk for a RAG knowledge base. Read <IN>,
write the fixed file to <OUT>.

DOCUMENT CONTEXT: <per-doc notes: existing heading scheme to PRESERVE or the
heading hierarchy to ADD; the page-noise patterns to strip>.

THE ONE INVIOLABLE RULE — PRESERVE TEXT VERBATIM. You may ONLY change Markdown
structure and remove pure noise. NEVER add/invent/paraphrase/translate/reorder/
summarize words. A drift check compares the input-vs-output letter stream; if you
added or dropped real words the fix is REJECTED.

Pure noise to remove: running headers/footers, bare page numbers, dot leaders,
decorative rules, dangling catchword fragments ("/12. Spesifikasi…" — a "/N.
Word…" hint at a page bottom that reappears next page), stray justified-text
leading whitespace.

Structural fixes: (1) DE-WRAP wrapped lines into paragraphs / single list items
(a heading, a list marker, a table row, or a blank line starts a new block).
(2) HEADINGS per context. (3) nested LISTS preserving original markers/order.
(4) valid rectangular TABLES (no invented cells). (5) keep every
"<!-- page N -->" marker in place.

Return idx=<i>, wrote=true, notes=<one line>.
```
