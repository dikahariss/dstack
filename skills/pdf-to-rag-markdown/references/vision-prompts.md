# Vision transcription + grounding prompts

Four profiles. **Transcribe** profiles (`govdoc`, `matrix`, `flowchart`) each Read
a page PNG and return `{page, markdown, kind, blank}`. The **`ground`** profile
Reads the PNG + a transcription and returns a verdict. The schema forces
faithfulness; the prompt enforces structure for RAG.

The single inviolable rule in every transcribe profile: **transcribe ONLY what is
visible. Never invent, summarize, paraphrase, or translate. Blank cells stay blank.
Faithfulness over completeness.** Preserve Indonesian spelling/casing/numbers
exactly — including the source's own typos.

---

## SHARED — intentionally-omitted page chrome

Both the transcribe profiles AND the `ground` profile cite this list. Transcribe
agents OMIT these; the ground agent must NOT report them as missing (they are
correct-by-design, not defects):

- bare page numbers and running headers — `- 5 -`, `-37-`, `2021, No. 778`;
- the Garuda emblem caption — `PRESIDEN` / `REPUBLIK INDONESIA` letterhead;
- decorative rules, dot leaders, a pure `1 2 3` column-number row;
- **bottom-of-page continuation catchwords** — a few words (often a `/N. Word…`
  fragment, sometimes with `…`, sometimes without) at the page foot that reappear
  as the first content of the next page. These are a print artifact, never body.

Everything else (operative text, clause numbers, table cells, names, dates) is
BODY and must be transcribed / is fair game for the grounder.

---

## Profile: `govdoc` (prose / cover / signature / dictum / addressee pages)

```
You are transcribing ONE scanned page of an Indonesian Government document
(Instruksi Presiden / Peraturan / Keputusan) into clean Markdown for a RAG
knowledge base. Transcribe faithfully FROM THE IMAGE (any OCR text layer is
unreliable; read the picture, use the spacing shown in the image).

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
- Main document title block (e.g. INSTRUKSI PRESIDEN REPUBLIK INDONESIA / NOMOR n
  TAHUN yyyy / TENTANG / <subject>) → "# ..." headings, only at the very top of
  the document's first page.
- "Menginstruksikan:" / "Kepada :" / "Untuk :" → keep each label, then the EXACT
  numbered/lettered addressee or instruction list under it (each entry a list item).
- Operative dictum (KESATU, KEDUA, KETIGA, … / PERTAMA) → "### KESATU" style
  headings; preserve every nested a./b./1)/2) sub-item and each named Menteri /
  instansi verbatim.
- Simple tables → valid Markdown pipe table; merge multi-line headers into one
  cell; never invent data for blank cells. (For WIDE multi-column matrices use the
  `matrix` profile instead.)
- Signature / closing block (place, date, "PRESIDEN ...,", "ttd.", NAME; and
  "Salinan sesuai dengan aslinya", the copying authority, the copyist NAME) →
  plain text lines, NOT headings; "ttd." on its own line before the name. If the
  signed name is partly obscured by a stamp, transcribe only what is legible and
  do NOT guess the rest.
- OMIT the page chrome listed in "SHARED — intentionally-omitted page chrome".

Return ONLY: page=<n>, markdown=<clean md, no page marker, no frontmatter>,
kind=<cover|prose|dictum|list|table|signature|emblem|blank|other>, blank=<bool>.
```

## Profile: `matrix` (wide multi-column tables / Rencana Aksi / lampiran matrices)

Use for a wide N-column government table — an action-plan "matrix", a multi-column
lampiran — especially one that spans many pages. Different from `govdoc`'s simple
table (this locks the column count and handles merged + page-spanning cells).

```
You are transcribing ONE page of a wide multi-column government MATRIX (e.g. a
"Rencana Aksi" action plan) into a Markdown pipe table for a RAG knowledge base.
Read faithfully FROM THE IMAGE.

STEP 1 — Read the image with the Read tool: <PNG_PATH>
STEP 2 — Transcribe the table. ABSOLUTE RULES:
- Transcribe ONLY visible text. NEVER invent or fabricate any cell. A visually
  blank or merged-down cell stays EMPTY — do NOT repeat the value above or guess.
- Preserve spelling/numbers exactly, incl. source typos; keep nested a./b./c.
  lettering inside a cell; use the spacing shown in the image.

STRUCTURE for RAG:
- Lock the COLUMN SET from the table header (reconstruct a multi-line/stacked
  header — e.g. "Target Waktu Penyelesaian", "Instansi Penanggung jawab" — into a
  single header cell each). Emit ONE pipe table with EXACTLY those columns, in
  order, and repeat the header row once at the top of THIS page's table.
- If THIS page shows NO column header (a continuation page), use the locked header
  given to you as context (<MATRIX_HEADER>) if provided; otherwise infer the same
  column set/order from the body cells. NEVER drop or reorder columns across pages.
- One pipe row per matrix row (per action item). EVERY row has the same number of
  pipe-separated cells; use an empty cell where the source cell is blank or merged.
- Join multi-line wrapped text inside a cell into that one cell.
- If the first row continues an item split from the previous page (No./Program
  blank), transcribe it faithfully as its own row.
- Keep the lampiran header + matrix title only on the lampiran's FIRST page.
- OMIT the page chrome listed in "SHARED — intentionally-omitted page chrome".

Return ONLY: page=<n>, markdown=<the pipe table>, kind=<matrix|table|other>,
blank=<bool>.
```

## Profile: `flowchart` (bagan alur / org chart / process diagram / scrambled table)

Use for a page whose boxes/labels a text extractor read in SCRAMBLED order, or any
diagram — vector OR scanned. Pick by visual CONTENT, not by scanned-vs-vector.

```
You are transcribing ONE page that is a FLOWCHART (bagan alur), an ORGANIZATIONAL
chart (bagan struktur organisasi), a process/workflow diagram, or a table drawn as
graphics — re-read the VISUAL structure FROM THE IMAGE.

STEP 1 — Read the image: <PNG_PATH>
STEP 2 — Transcribe what is visible, in correct visual order. ABSOLUTE RULES:
faithfulness as in the other profiles.

STRUCTURE for RAG:
- Section heading if present ("w. Bagan alur layanan", "A. BAGAN STRUKTUR
  ORGANISASI ...") → "### ..." using the exact title. A page may hold MULTIPLE
  charts — emit each under its own ### heading, top to bottom.
- An ORG/hierarchy chart → a NESTED bullet list following the lines drawn: the top
  unit is the top bullet, units directly under it indented one level, siblings at
  the same level. Include a "JABATAN FUNGSIONAL DAN JABATAN PELAKSANA" box at the
  level it is actually drawn (usually a direct child of the top unit, not nested
  under a sub-unit). Do NOT invent reporting lines you cannot see.
- A SWIMLANE flowchart (actor columns) → a valid pipe table: one row per numbered
  step, columns = the lanes; mark the acting lane, leave others blank, fill Output.
- A pure flowchart (no lanes) → an ORDERED nested list following the arrows;
  decision diamonds (Ya/Tidak) become labelled sub-items.
- A plain table → valid pipe table (use `matrix` for wide multi-column ones).
- OMIT the page chrome listed in "SHARED — intentionally-omitted page chrome".

Return ONLY: page=<n>, markdown=<clean md>, kind=<orgchart|flowchart|table|prose|other>,
blank=<bool>.
```

## Profile: `ground` (adversarial grounding — CONVERSION fidelity, not completeness)

Pipeline this stage right after a transcribe stage (`pipeline(pages, transcribe,
ground)`) so each page is verified the instant it is read.

```
You are adversarially GROUND-CHECKING a transcribed page against its SOURCE IMAGE.
Score CONVERSION fidelity, not completeness. Be precise and skeptical.

STEP 1 — Read the SOURCE image with the Read tool: <PNG_PATH>
STEP 2 — Read (or consider) the transcription to check: <MARKDOWN>
STEP 3 — Compare BODY content cell-by-cell / line-by-line and report:
- invented: any sentence, list item, table cell, name, or unit in the
  transcription that is NOT visible on the page (hallucination or a guessed cell).
- missing: any BODY text / table row / cell visible on the page but ABSENT from the
  transcription.
- altered: any cell/word whose wording, number, date, or spelling DIFFERS from the
  image — quote both as "image: X | md: Y".
- grounded: true ONLY if invented, missing, and altered are all empty.

NOT defects — never report these as missing or altered (correct-by-design):
- everything in "SHARED — intentionally-omitted page chrome" (page numbers, the
  Garuda/emblem caption, running headers, decorative rules, and bottom continuation
  catchwords);
- a visually blank or merged matrix cell left empty in the transcription;
- a source typo faithfully reproduced (it is faithful, not an error).
For a single-letter/diacritic claim, you may be misreading at this resolution —
only assert `altered` when the difference is unambiguous; otherwise leave it out.

Return ONLY: page=<n>, grounded=<bool>, invented=[..], missing=[..], altered=[..],
notes=<one line>.
```

## Fix-pass prompt (digital fallback — structure only, verbatim)

`scripts/dewrap.py` is the default for clean-digital prose. Use this AI fix-pass
only when dewrap mis-structures an irregular digital doc (see `workflows.md`
Phase 4). It is gated by `scripts/anti_drift_gate.py`.

```
Repair the Markdown STRUCTURE of one chunk for a RAG knowledge base. Read <IN>,
write the fixed file to <OUT>.

DOCUMENT CONTEXT: <per-doc notes: existing heading scheme to PRESERVE or the
heading hierarchy to ADD; the page-noise patterns to strip>.

THE ONE INVIOLABLE RULE — PRESERVE TEXT VERBATIM. You may ONLY change Markdown
structure and remove pure noise. NEVER add/invent/paraphrase/translate/reorder/
summarize words. A drift check compares the input-vs-output letter stream; if you
added or dropped real words the fix is REJECTED.

Pure noise to remove: the page chrome in "SHARED — intentionally-omitted page
chrome" (running headers/footers, bare page numbers, dot leaders, decorative
rules, bottom continuation catchwords), stray justified-text leading whitespace.

Structural fixes: (1) DE-WRAP wrapped lines into paragraphs / single list items
(a heading, a list marker, a table row, or a blank line starts a new block).
(2) HEADINGS per context. (3) nested LISTS preserving original markers/order.
(4) valid rectangular TABLES (no invented cells). (5) keep every
"<!-- page N -->" marker in place.

Return idx=<i>, wrote=true, notes=<one line>.
```
