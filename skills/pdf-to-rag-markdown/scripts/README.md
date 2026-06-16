# scripts/ — the deterministic spine

Runnable, dependency-free (Python 3 stdlib) helpers. The semantic work (vision
transcription + grounding) is done by `Workflow` subagents — see `../references/`.
Run these via the Bash tool; each prints `--help`.

| Script | Phase | What it does |
|---|---|---|
| `splice.py` | 3 | `assemble` a doc from per-page vision results + frontmatter, or `splice` re-transcribed pages into an existing doc, keyed on `<!-- page N -->` markers. |
| `dewrap.py` | 4 *(digital only)* | Deterministic de-wrap + BAB/Bagian/Paragraf/Pasal heading promotion for clean-digital prose. Letter-neutral; benchmarked word-identical to the AI fix-pass at ~10 ms. |
| `anti_drift_gate.py` | 5 *(digital only)* | Safety net for the AI fix-pass: reassemble `out_NNN.md` chunks but **revert** any whose letter/digit stream drifted from `in_NNN.md`. Guards the digital fix-pass ONLY — not vision output. |
| `polish_tables.py` | QA | Pad ragged pipe tables into valid rectangles; cell text never changes. |
| `measure_rag.py` | QA | RAG-readiness metrics (words, headings, page markers, garble ratio, table empty-cell ratio). Read-only. `garble_ratio` excludes structural short lines; a high `table_empty_cell_ratio` on a merged matrix is faithful, not a defect. |

Phase 0 (triage) and phase 1 (render) are shell snippets in `../references/workflows.md`.
The phase-2 transcribe + phase-6 grounding `Workflow` orchestration also lives there, as
templates the orchestrator inlines — `Workflow` scripts run sandboxed (no filesystem) and
cannot read these helper files or the prompt files at runtime.

A **fully-scanned** doc skips `dewrap.py` + `anti_drift_gate.py` (no text layer): build it
from vision results with `splice.py assemble`; grounding is the faithfulness guard.

```bash
python3 splice.py assemble --results pages.json --frontmatter fm.txt --out doc.md
python3 dewrap.py --in draft.md --out clean.md           # digital prose only
python3 anti_drift_gate.py --in-dir work/<slug> --frontmatter fm.txt --out final.md
python3 polish_tables.py --in final.md --out final.md
python3 measure_rag.py final.md
```
