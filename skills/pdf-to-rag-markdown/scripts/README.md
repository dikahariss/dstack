# scripts/ — the deterministic spine

Runnable, dependency-free (Python 3 stdlib) helpers for the pipeline's
deterministic phases. The semantic work (vision transcription, grounding) is
done by `Workflow` subagents — see `../references/`. Run these via the Bash tool.

| Script | Phase | What it does |
|---|---|---|
| `splice.py` | 3 | `assemble` a doc from per-page vision results + frontmatter, or `splice` re-transcribed pages into an existing doc, keyed on `<!-- page N -->` markers. |
| `anti_drift_gate.py` | 5 | The safety net. Reassemble fixed chunks but **revert** any whose letter/digit stream drifted from the source (hallucination/loss); de-wrap & headings add zero letters so they pass. |
| `polish_tables.py` | 6 | Pad ragged pipe tables into valid rectangles; cell text never changes. |
| `measure_rag.py` | 6 | Print RAG-readiness metrics (words, headings, page markers, garble ratio, table empty-cell ratio). Read-only. |

Phase 0 (triage) and phase 1 (render) are two-line shell snippets kept inline in
`../references/workflows.md`. The phase-2/4/6 `Workflow` orchestration scripts
(`vision_transcribe.js`, `fix_chunks.js`, `review_workflow.js`) live there too,
as templates the orchestrator inlines — `Workflow` scripts run sandboxed (no
filesystem) and cannot read these helper files at runtime.

Each script prints `--help`. Examples:

```bash
python3 splice.py assemble --results pages.json --frontmatter fm.txt --out doc.md
python3 anti_drift_gate.py --in-dir work/inpres-2-2021 --frontmatter fm.txt --out final.md
python3 polish_tables.py --in final.md --out final.md
python3 measure_rag.py final.md
```
