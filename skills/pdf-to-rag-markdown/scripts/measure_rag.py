#!/usr/bin/env python3
"""Report RAG-readiness metrics for a converted Markdown document (phase 6).

Prints a JSON object:
  words                    total word count
  headings                 number of ATX headings (#..######)
  page_markers             number of <!-- page N --> provenance markers
  garble_ratio             share of very short (<25 char) non-table/heading
                           body lines — a proxy for scrambled vector text
  table_empty_cell_ratio   empty cells / total cells across all pipe tables

Read-only; no file is modified. Dependency-free.

Usage: python3 measure_rag.py doc.md
"""
import json
import re
import sys
from pathlib import Path


def main():
    if len(sys.argv) != 2:
        print("usage: measure_rag.py <doc.md>", file=sys.stderr)
        return 2

    text = Path(sys.argv[1]).read_text(encoding="utf-8")
    lines = text.splitlines()

    words = len(re.findall(r"\b\w+\b", text))
    headings = sum(1 for l in lines if re.match(r"#{1,6}\s", l))
    page_markers = len(re.findall(r"<!-- page \d+ -->", text))

    body = [
        l for l in lines
        if l.strip()
        and not l.strip().startswith("|")
        and not l.strip().startswith("#")
        and not l.strip().startswith("<!--")
    ]
    short = sum(1 for l in body if len(l.strip()) < 25)
    garble = round(short / len(body), 3) if body else 0.0

    total_cells = empty = 0
    for l in lines:
        s = l.strip()
        if s.startswith("|") and s.count("|") >= 2 and not re.fullmatch(r"[|\s:-]+", s):
            cs = [c.strip() for c in s.strip("|").split("|")]
            total_cells += len(cs)
            empty += sum(1 for c in cs if not c)
    empty_ratio = round(empty / total_cells, 3) if total_cells else 0.0

    print(json.dumps({
        "words": words,
        "headings": headings,
        "page_markers": page_markers,
        "garble_ratio": garble,
        "table_empty_cell_ratio": empty_ratio,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
