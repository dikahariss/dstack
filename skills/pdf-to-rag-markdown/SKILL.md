---
name: pdf-to-rag-markdown
description: >
  Use when converting one or more PDFs into retrieval-ready (RAG) Markdown —
  especially scanned/OCR'd, image- or flowchart-heavy (bagan alur), table-heavy,
  or Indonesian government/legal/regulatory documents (Permenhub, Inpres, Juknis,
  UU, Peraturan, SK/Keputusan). Triggers: "convert PDF to markdown", "pdf to rag",
  "siapkan/sempurnakan untuk RAG", "konversi PDF", "extract this regulation",
  scanned pages, OCR garble, scrambled tables, word-splits, missing heading
  structure, or when an earlier deterministic extractor (pdf2md, plain pdftotext)
  produced garbled output. Assumes a Claude Max plan (fan out subagents freely).
allowed-tools: Bash Read Write Edit Workflow Grep Glob
metadata:
  dstack:
    type: hybrid
    version: 0.4.0
    triggers:
      - convert pdf to markdown
      - pdf to rag
      - siapkan untuk rag
      - sempurnakan untuk rag
      - konversi pdf
      - scanned pdf
      - ocr garble
      - bagan alur
      - flowchart pages
      - permenhub
      - inpres
      - juknis
      - peraturan
    context_budget_tokens: 3500
    side_effects: local
    agency: autonomous
---
# /pdf-to-rag-markdown

Convert PDFs into retrieval-ready Markdown with **Claude vision + parallel
subagent Workflows** as the primary engine. The AI reads the page; deterministic
tools only triage and assemble. Built for a **Claude Max plan** — fan out many
agents in parallel; the constraint is fidelity, not token cost. This supersedes
the deterministic `pdf2md` script for RAG conversion.

## Run autonomously — one overlapped pass (default)
Finish end-to-end in one go. Staging (pilot → ask → phase → wait → phase) is what
makes a doc take an hour — not the compute. Go straight to the full fan-out. The
user is on Max and optimizes for speed + fidelity, not approval gates.

1. **Deterministic prep (Bash, seconds):** triage → render non-pristine pages →
   `pdftotext -layout` draft → `scripts/splice.py assemble`.
2. **Clean-digital prose → `scripts/dewrap.py` (~10 ms, not AI):** de-wrap +
   promote BAB/Bagian/Paragraf/Pasal, letter-neutral. Proven word-identical to
   per-chunk AI fix-agents (added=0 / removed=0 across 245 pages) — so the AI
   budget goes to vision + grounding, not mechanical de-wrap. Use AI fix-agents
   only as a fallback when dewrap mis-structures an irregular doc.
3. **One Workflow, overlapped:** `pipeline(chartPages, transcribe, ground)` — each
   chart is grounded the instant it is read, pages keep flowing, and ALL chart
   pages ground in this single pass (never sample → ask → rest). Don't pilot.
4. **Deterministic finish (Bash):** splice charts in → `anti_drift_gate.py` →
   `polish_tables.py` → `measure_rag.py`.
5. **Auto-fix** any `grounded=false` page in place; re-verify only those — never
   report-and-wait. Ask only on a real blocker (missing file; ambiguous target).

Measured: a 279-page Permenhub dropped ~1h → ~6 min projected, identical output.
≤30% deterministic still holds — de-wrap/triage/assembly/gate are rails; vision
and grounding (all the judgment) stay AI.

## When to use
- Turning PDF(s) into Markdown for a RAG / knowledge base.
- Scanned or OCR'd docs; image/diagram/flowchart (bagan alur) pages; table-heavy
  pages; Indonesian government/legal/regulatory docs.
- When deterministic extraction produced garble, scrambled tables, split words,
  or no heading structure.

**Not** for: a single clean digital PDF you only need as flat text (`pdftotext`
is enough); non-PDF sources.

## Core principles (non-negotiable)
1. **Vision is the source of truth for any non-pristine page.** Render → Claude
   reads the image → faithful Markdown. Never reconstruct scrambled extractor
   text by reasoning about it; render and look.
2. **Faithful, never editorial.** Transcribe exactly what is on the page. For
   legal/regulatory corpora, **source typos stay** (correcting the law is wrong).
   Test: if `pdftotext` AND vision independently read the same "typo", it is in
   the source → keep. Only fix *conversion artifacts*: dropped spaces
   (`yangmenjadi`→`yang menjadi`), ligature loss (`sertfikat` only if the source
   shows `sertifikat`), `<br>` clutter in cells, a vision-altered word.
3. **Adversarially verify grounding.** A second agent compares each suspect
   page's Markdown to its PNG; `grounded=false` if any sentence/cell is not
   visible. Vision hallucinates on sparse or dense pages — default to flagging.
4. **Structure for chunking.** Promote real headings (BAB / Bagian / Pasal /
   Paragraf; dictum KESATU…/PERTAMA…; lettered A./B. Lampiran sections), keep a
   `<!-- page N -->` marker per page, and emit valid rectangular tables.
5. **Structure-only, words verbatim.** Whether prose is de-wrapped by `dewrap.py`
   or by AI fix-agents, change only structure; the anti-drift gate reverts any
   chunk that added or lost letters.

## Pipeline (parallel via Workflow)
| # | Phase | What | Agents |
|---|---|---|---|
| 0 | Triage | `pdfinfo`/`pdfimages`/`pdftotext` per page: scanned? digital? scrambled? | Bash |
| 1 | Render | `pdftoppm -png -r 200` the pages that need vision | Bash |
| 2 | Transcribe | one vision agent per page → `{page, markdown, kind}` (profiles: govdoc / flowchart) | N (pipeline) |
| 3 | Assemble | `scripts/splice.py`: build/splice md by `<!-- page N -->` marker + YAML frontmatter | py |
| 4 | Prose | `scripts/dewrap.py`: de-wrap + promote BAB/Bagian/Paragraf/Pasal (letter-neutral, ~10 ms). AI fix-agents only as fallback for irregular docs | py |
| 5 | Gate | `scripts/anti_drift_gate.py`: letter-stream reassembly; revert hallucinated/lossy chunks | py |
| 6 | Review | adversarial ground-check vs PNG — **pipelined with phase 2** (`pipeline(pages, transcribe, ground)`), one pass over all chart pages | verify |

Default = vision every page that is not pristine digital prose; clean-digital
prose runs through `scripts/dewrap.py` (phase 4), not vision. Phases 2 and 6
pipeline together (transcribe → ground) and run concurrently with phase 4 —
**scanned, diagram, and table pages always go through vision.**

## Deciding which pages need vision
| Signal | Verdict |
|---|---|
| `pdftotext` page empty / no text layer | vision (scanned) |
| one full-page image per page, large file/page | vision (scanned) |
| ≥45% non-pipe **short** lines in the OUTPUT after a draft | vision (scrambled vector flowchart/table) |
| clean prose paragraphs | optional fast path |

**Pick the profile by CONTENT, not by scanned-vs-vector:** a *scanned* page that
is a flowchart still uses the `flowchart` profile. govdoc = prose/cover/signature/
simple table; flowchart = any bagan alur / swimlane / scrambled diagram.

## Conventions
- **Frontmatter** (phase 3): `title`, `source_file`, `total_pages`,
  `conversion_method`, `page_markers: true`.
- **Digital base**: build the page-1..N draft with `pdftotext -layout` (keeps
  columns/tables), split into pages on the `\f` form-feed, one `<!-- page N -->`
  per page. Use plain `pdftotext` only for triage char-counts.
- **Chunk boundaries** (phase 4): align ~6-page chunks to page-region edges where
  practical so one agent isn't handed mixed clean-vision + raw-prose input. The
  anti-drift gate protects mixed chunks regardless.
- **De-wrap is letter-neutral**: joining wrapped/hyphenated words removes only
  spaces/hyphens, so the gate's letter stream is unchanged — legitimate de-wrap
  never trips the revert.

## Example
Everything ships bundled and ready to run:
- `scripts/` — the deterministic spine as runnable, dependency-free helpers:
  `dewrap.py` (phase-4 prose de-wrap+headings), `anti_drift_gate.py` (phase-5
  safety net), `splice.py` (phase-3 assemble/splice), `polish_tables.py`,
  `measure_rag.py`. Run via Bash; each prints `--help`.
- `references/vision-prompts.md` — faithful **govdoc** + **flowchart-swimlane** transcription prompts.
- `references/workflows.md` — the parallel **Workflow** orchestration templates
  (`vision_transcribe.js`, `fix_chunks.js`, `review_workflow.js`) the orchestrator
  inlines, plus the phase-0/1 triage + render commands.

The vision method and these helpers were developed and proven against 7 real
Indonesian government documents (scanned, vector flowchart, and table-heavy).

## Common mistakes
| Mistake | Fix |
|---|---|
| Trusting vision blindly | Always run the grounding verify pass; default to flagging |
| "Correcting" source typos | Keep faithful — confirm via pdftotext+vision agreement |
| Letting fix-agents reword prose | Structure-only + letter-stream gate |
| One giant chunk per doc | ~6 pages/chunk so agents stay accurate and parallelise |
| An agent reconstructing scrambled flowchart text | It drifts → render + vision that page instead |
| Detecting flowchart pages on the *source* | Tables look scrambled too; detect on the OUTPUT |
| Dropping page markers | Keep `<!-- page N -->` for provenance + splicing |
| No final cost recap | Sum each Workflow's `subagent_tokens`; report at the end |

## Changes

- **0.4.0** — Speed pass (same quality). (1) `scripts/dewrap.py`: deterministic
  de-wrap + heading promotion for clean-digital prose — benchmarked word-identical
  to the per-chunk AI fix-agents (added=0/removed=0 over 245 pages) at ~10 ms vs
  ~8.6 min, so prose no longer burns AI agents. (2) One overlapped pass:
  `pipeline(pages, transcribe, ground)` grounds each chart as it is read and grounds
  ALL pages in a single run (was 3 staged runs); no pilot. Projected ~1h → ~6 min on
  the 279-page benchmark. AI stays the engine for vision + grounding (the judgment);
  rationale-backed move of mechanical de-wrap to a rail (ADR-0025, owner-approved).
- **0.3.0** — Added the "Run autonomously — do not checkpoint" directive and set
  `agency: autonomous`: default to AI-semantic, finish end-to-end without piloting,
  scope questions, or report-and-wait; fix grounding findings automatically.
  Owner feedback after a 279-page run that took ~1h of back-and-forth — the staging
  and asking, not the compute, was the cost. Calibration stays `workflow` (≤30%
  deterministic: triage, assembly, anti-drift gate only).
- **0.2.0** — Extracted the deterministic spine into runnable `scripts/`
  (`anti_drift_gate.py`, `splice.py`) and implemented the two previously
  named-only helpers (`polish_tables.py`, `measure_rag.py`); all four are
  stdlib-only and smoke-tested. `type: semantic → hybrid` (a `scripts/` folder is
  now present; calibration stays `workflow`). The `Workflow` orchestration
  templates + vision prompts stay in `references/` because `Workflow` scripts run
  sandboxed and cannot read sibling files at runtime. Dropped unused `Agent` from
  `allowed-tools` (fan-out is via `Workflow`). Tightened the description to
  triggers-only per /writing-skills.
- **0.1.0** — Imported into the dstack catalog. Made self-contained:
  dropped a dangling pointer to an external repo's sample docs; the
  bundled `references/` carry the proven Workflow scripts and vision
  prompts. Requires the `Workflow` tool (host registry, ADR-0002).
