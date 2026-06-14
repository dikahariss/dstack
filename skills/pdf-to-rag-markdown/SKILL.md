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
  produced garbled output. AI-vision + parallel subagents are the engine, not a
  deterministic script. Assumes a Claude Max plan (fan out freely).
allowed-tools: Bash Read Write Edit Workflow Agent Grep Glob
metadata:
  dstack:
    type: semantic
    version: 0.1.0
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
    agency: deliberative
---
# /pdf-to-rag-markdown

Convert PDFs into retrieval-ready Markdown with **Claude vision + parallel
subagent Workflows** as the primary engine. The AI reads the page; deterministic
tools only triage and assemble. Built for a **Claude Max plan** — fan out many
agents in parallel; the constraint is fidelity, not token cost. This supersedes
the deterministic `pdf2md` script for RAG conversion.

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
5. **Fix-agents change STRUCTURE only, words verbatim.** Gate every fixed chunk
   with a letter-stream diff that reverts any chunk that added or lost letters.

## Pipeline (parallel via Workflow)
| # | Phase | What | Agents |
|---|---|---|---|
| 0 | Triage | `pdfinfo`/`pdfimages`/`pdftotext` per page: scanned? digital? scrambled? | Bash |
| 1 | Render | `pdftoppm -png -r 200` the pages that need vision | Bash |
| 2 | Transcribe | one vision agent per page → `{page, markdown, kind}` (profiles: govdoc / flowchart) | N (pipeline) |
| 3 | Assemble | build/splice md by `<!-- page N -->` marker + YAML frontmatter | py |
| 4 | Fix | one agent per ~6-page chunk: de-wrap, add headings, tidy tables, strip noise — VERBATIM | M (pipeline) |
| 5 | Gate | letter-stream anti-drift reassembly; revert hallucinated/lossy chunks | py |
| 6 | Review | adversarial: score RAG-readiness + ground-check suspect pages vs PNG | per-doc + verify |

Default = vision every page that is not pristine digital prose. For long
pristine-prose docs a `pdftotext` draft + phase-4 AI de-wrap is an allowed
shortcut — but **scanned, diagram, and table pages always go through vision.**

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
The full, proven Workflow scripts and prompts live in the bundled references:
- `references/vision-prompts.md` — faithful **govdoc** + **flowchart-swimlane** transcription prompts.
- `references/workflows.md` — `vision_transcribe.js`, `fix_chunks.js`, the
  letter-stream **anti-drift gate**, `review_workflow.js`, and the splice/measure helpers.

These references were developed and proven against 7 real Indonesian
government documents (scanned, vector flowchart, and table-heavy).

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

- **0.1.0** — Imported into the dstack catalog. Made self-contained:
  dropped a dangling pointer to an external repo's sample docs; the
  bundled `references/` carry the proven Workflow scripts and vision
  prompts. Requires the `Workflow` tool (host registry, ADR-0002).
