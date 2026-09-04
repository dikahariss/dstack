---
name: pdf-to-rag
description: >
  Use when converting one or more PDFs into retrieval-ready (RAG) Markdown —
  especially scanned/OCR'd, image- or flowchart-heavy, table-heavy,
  or Indonesian government/legal/regulatory documents (Permenhub, Inpres, Juknis,
  UU, Peraturan, SK/Keputusan). Triggers: "convert PDF to markdown", "pdf to rag",
  "prepare for RAG", "extract this regulation",
  scanned pages, OCR garble, scrambled tables, word-splits, missing heading
  structure, or when an earlier deterministic extractor (pdf2md, plain pdftotext)
  produced garbled output. Runs autonomously end to end; one vision agent per
  page that needs vision.
allowed-tools: Bash Read Write Edit Workflow Grep Glob
metadata:
  dstack:
    type: hybrid
    version: 0.7.0
    triggers:
      - convert pdf to markdown
      - pdf to rag
      - prepare for rag
      - scanned pdf
      - ocr garble
      - flowchart pages
      - permenhub
      - inpres
      - juknis
      - peraturan
    context_budget_tokens: 3500
    side_effects: local
    agency: autonomous
---
# /pdf-to-rag

Convert PDFs into retrieval-ready Markdown with **Claude vision + parallel
subagent Workflows** as the primary engine. The AI reads the page;
deterministic tools triage, de-wrap clean prose, and assemble.

**The unit of delegation is one vision agent per page, grounded in the same
pass.** That is the whole fan-out: a document with N vision pages costs N
transcribe agents and N ground agents, sent through one Workflow at the
Workflow's own concurrency limit, which the run log names. Do not add agents
beyond it — no reviewer agents, no per-chunk fix agents unless `dewrap.py`
demonstrably mis-structured a region (Phase 4 fallback), and never a pilot
batch before the real one.

## Run autonomously — one overlapped pass (default)
Finish end-to-end in one go. Staging (pilot → ask → phase → wait) is what
makes a doc take an hour — not the compute. Don't pilot, don't ask which
approach, don't ask before running the Workflow; ask only on a real blocker
(missing file, ambiguous target).

**Fork on doc type first (from triage):**
- **Digital / mixed** (reliable `pdftotext -layout` text layer): build a draft, run
  `scripts/dewrap.py` on the clean-prose pages, send only chart/diagram/scrambled
  pages to vision, then `splice.py splice` those vision pages into the dewrapped draft.
- **Fully scanned** (Tagged:no, a full-page image per page, empty or garbled OCR):
  SKIP the draft + dewrap; vision every page (per-page profile), then `splice.py
  assemble` the doc from the vision results. No dewrap, no gate — faithfulness is
  guarded by grounding.

Then:
1. **Prep (Bash, seconds):** triage → render the vision pages → (digital only) draft +
   `dewrap.py`.
2. **One Workflow, overlapped:** `pipeline(pages, transcribe, ground)` — each page is
   grounded the instant it is read; ground **all** vision pages in this single pass (never
   sample → ask → rest).
3. **Finish (Bash):** merge the vision pages — `splice.py assemble` (scanned) or
   `splice.py splice` into the draft (digital) → `polish_tables.py` → `measure_rag.py`.
   Run `anti_drift_gate.py` only if the AI fix-pass fallback ran (dewrap is
   letter-neutral and needs no gate).
4. **Verify-before-fix:** `grounded=false` is a suspicion, not a verdict. For each
   flagged page re-read the PNG for the `high` and `medium` items and classify each
   as (a) genuine drift, (b) intentionally-omitted chrome, or (c) a reviewer misread;
   treat a `low` single-letter claim as KEEP without a re-read. Fix only (a) with the
   Edit tool (a targeted span replace — **never** `splice.py splice`, which would
   discard the correct rest of the page); a re-fix must agree with a second read
   before overwriting. Copy `doc.md` → `doc.pre-ground.md` first.

`dewrap.py` is letter-neutral and word-identical to the AI fix-pass on the benchmark,
so clean prose never earns an agent; de-wrap, triage, assembly and gate are rails,
vision and grounding stay AI.

## When to use
- Turning PDF(s) into Markdown for a RAG / knowledge base.
- Scanned/OCR'd docs; image/diagram/flowchart (bagan alur) pages; table/matrix-heavy
  pages; Indonesian government/legal/regulatory docs.
- When deterministic extraction produced garble, scrambled tables, split words, or no
  heading structure.

**Not** for: a single clean digital PDF you only need as flat text (`pdftotext` is
enough); non-PDF sources.

## Core principles (non-negotiable)
1. **Vision is the source of truth for any non-pristine page.** Render → read the image
   → faithful Markdown. Never reconstruct scrambled extractor text by reasoning; render
   and look.
2. **Faithful, never editorial.** Transcribe exactly what is on the page. For
   legal/regulatory corpora, **source typos stay** (correcting the law is wrong). Only
   fix *conversion artifacts*: dropped spaces (`yangmenjadi`→`yang menjadi`), ligature
   loss, `<br>` clutter. A merged/blank table cell stays blank — **never back-fill**.
3. **Grounding is low-precision by design.** A second agent compares each page's md to
   its PNG and defaults to flagging, so it OVER-flags — most flags are intentionally-
   omitted chrome (page numbers, emblem caption, catchwords) or the reviewer's own
   single-letter misread. It only adds pages to a review queue; it never licenses a
   blind edit. Apply verify-before-fix (above). The ground prompt must carry the same
   omitted-chrome allow-list as the transcribe prompt.
4. **Structure for chunking.** Promote real headings (BAB / Bagian / Pasal / Paragraf;
   dictum KESATU…/PERTAMA…; lettered A./B. Lampiran), keep a `<!-- page N -->` marker
   per page, emit valid rectangular tables.
5. **Structure-only, words verbatim.** `dewrap.py` / AI fix-agents change only
   structure; the anti-drift gate reverts drift — but the gate guards the **digital
   fix-pass only**, not vision output (vision faithfulness is guarded by grounding).

## Pipeline (parallel via Workflow)
| # | Phase | What | Agents |
|---|---|---|---|
| 0 | Triage | `pdfinfo`/`pdfimages`/`pdftotext`: digital vs scanned; text-layer trustworthy? | Bash |
| 1 | Render | `pdftoppm -png -r 200` the pages that need vision | Bash |
| 2 | Transcribe | one vision agent/page → `{page, markdown, kind}` (profiles: govdoc / matrix / flowchart) | N (pipeline) |
| 3 | Assemble | `scripts/splice.py`: build/splice by `<!-- page N -->` marker + YAML frontmatter | py |
| 4 | Prose *(digital only)* | `scripts/dewrap.py`: de-wrap + promote BAB/Bagian/Paragraf/Pasal (letter-neutral). AI fix-agents only as fallback | py |
| 5 | Gate *(digital only)* | `scripts/anti_drift_gate.py`: revert any fix-chunk that added/lost letters | py |
| 6 | Ground | `ground` profile vs PNG — **pipelined with phase 2**, one pass over **all** vision pages → review queue → verify-before-fix | verify |

## Deciding the path & per-page profile
The doc fork is closed by design — exactly two paths. The page signals are **not
exhaustive**: route any page you distrust to vision.
| Signal | Verdict |
|---|---|
| Doc: Tagged:no + full-page image/page + empty/garbled OCR | **scanned path** — vision every page |
| Doc: reliable `pdftotext -layout` layer | **digital path** — dewrap prose, vision only non-prose |
| Page: empty / no text layer | vision (scanned) |
| Page: ≥45% non-pipe **short** lines in the OUTPUT draft | vision (scrambled vector flowchart/table) |
| Page: clean prose paragraphs (digital doc) | `dewrap.py`, not vision |

**Pick the profile by content, not scanned-vs-vector:** govdoc = prose/cover/signature/
dictum/addressee; matrix = wide multi-column tables / Rencana Aksi; flowchart = any
bagan alur / swimlane / org chart / scrambled diagram.

## Conventions
- **Frontmatter** (phase 3): `title`, `source_file`, `total_pages`, `conversion_method`,
  `page_markers: true`.
- **Digital draft**: `pdftotext -layout` (keeps columns), split on the `\f` form-feed,
  one `<!-- page N -->` per page. Plain `pdftotext` only for triage char-counts.
- **De-wrap is letter-neutral**: joining wrapped/hyphenated words changes no letters, so
  the gate never trips on legitimate de-wrap.

## Bundled files
- `scripts/` — deterministic spine, dependency-free, run via Bash (`--help` each):
  `dewrap.py` (phase-4 prose), `anti_drift_gate.py` (phase-5 gate), `splice.py`
  (phase-3 assemble/splice), `polish_tables.py`, `measure_rag.py`.
- `references/vision-prompts.md` — the shared omitted-chrome list + four profiles
  (`govdoc`, `matrix`, `flowchart`, `ground`) + the digital fix-pass prompt.
- `references/workflows.md` — the fast one-pass orchestration (doc-type fork + pipelined
  transcribe→ground + verify-before-fix) and per-phase Bash/Workflow templates.

## Common mistakes

Recurring ones; **not exhaustive**.

| Mistake | Fix |
|---|---|
| Auto-applying `grounded=false` without re-reading the image | Verify-before-fix: most flags are omitted chrome or reviewer misreads, not defects |
| Flipping a single letter on the reviewer's word | Re-read the PNG (higher dpi); default KEEP unless unambiguous + a second read agrees |
| Dewrapping a scanned doc's unreliable OCR | No text layer → skip dewrap; vision every page + `splice.py assemble` |
| Back-filling blank/merged matrix cells | Leave them blank — a high `table_empty_cell_ratio` is faithful, not a defect |
| "Correcting" source typos | Keep faithful — confirm via pdftotext+vision agreement |
| Reconstructing scrambled flowchart text | It drifts → render + vision that page (flowchart profile) instead |
| Trusting `garble_ratio` on a structural doc | It over-counts short signature/label/dictum lines — confirm by eye |
| Dropping page markers / no cost recap | Keep `<!-- page N -->`; sum each Workflow's `subagent_tokens` at the end |
