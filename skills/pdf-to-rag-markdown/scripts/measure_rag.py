#!/usr/bin/env python3
"""Report RAG-readiness metrics for a converted Markdown document (finish/QA pass).

Prints a JSON object:
  words                    total word count
  headings                 number of ATX headings (#..######)
  page_markers             number of <!-- page N --> provenance markers
  garble_ratio             share of very short (<25 char) NON-structural body lines
                           — a proxy for scrambled vector text. Structural short
                           lines (dictum tokens, "Kepada:"/"Untuk:" labels, signature
                           block, list markers, ALL-CAPS headings) are EXCLUDED so the
                           metric does not over-count on terse legal/structural docs.
  table_empty_cell_ratio   empty cells / total cells across all pipe tables. A HIGH
                           value is EXPECTED and faithful on a merged-cell matrix
                           (blank merged cells must never be back-filled) — not a defect.

Read-only; no file is modified. Dependency-free.

Usage: python3 measure_rag.py doc.md
"""
import json
import re
import sys
from pathlib import Path

DICTUM = re.compile(r"^(KESATU|KEDUA|KETIGA|KEEMPAT|KELIMA|KEENAM|KETUJUH|KEDELAPAN|KESEMBILAN|KESEPULUH|PERTAMA)\b", re.I)
LISTMARK = re.compile(r"^(\(\d+\)|\d+\.|[a-z]\.|[a-z]\))\s", re.I)
SIGCUE = re.compile(r"^(Dikeluarkan|Ditetapkan|pada tanggal|Salinan sesuai|Agar setiap|ttd)", re.I)


def is_structural(s):
    """A short line that is legitimately terse (not scrambled garble)."""
    return bool(
        s.endswith(":")           # "Kepada :", "Untuk :", "Menimbang :"
        or DICTUM.match(s)         # operative dictum headings
        or LISTMARK.match(s)       # a./b./(1)/1) list markers
        or SIGCUE.match(s)         # signature / place-date block
        or s.isupper()             # ALL-CAPS headings / names / LAMPIRAN
    )


def main():
    if len(sys.argv) != 2:
        print("usage: measure_rag.py <doc.md>", file=sys.stderr)
        return 2

    text = Path(sys.argv[1]).read_text(encoding="utf-8")
    lines = text.splitlines()

    words = len(re.findall(r"\b\w+\b", text))
    headings = sum(1 for l in lines if re.match(r"#{1,6}\s", l))
    page_markers = len(re.findall(r"<!-- page \d+ -->", text))

    body = [l for l in lines if l.strip() and not l.strip().startswith(("|", "#", "<!--"))]
    body_clean = [l for l in body if not is_structural(l.strip())]
    short = sum(1 for l in body_clean if len(l.strip()) < 25)
    garble = round(short / len(body_clean), 3) if body_clean else 0.0

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
