# scripts/

- `classify_prefilter.py` — deterministic IN/OUT pre-classifier for
  Stage 1. Reads table names (stdin or a file, one per line), emits
  `KEEP` / `DROP` / `GREY` per table. Only `GREY` tables need LLM
  judgment. No dependencies beyond the Python 3 standard library.

  ```bash
  python classify_prefilter.py tables.txt          # TSV to stdout
  python classify_prefilter.py tables.txt --json    # JSON with summary
  cat tables.txt | python classify_prefilter.py     # stdin
  ```

  Keep the regex rules in sync with `references/classification-rubric.md`.
