#!/usr/bin/env python3
"""Pad ragged Markdown pipe tables into valid rectangles (QA tidy).

For each contiguous block of pipe-table rows, find the widest row and pad every
other row to that column count with empty cells, then ensure exactly one
separator row right after the header. Cell *text* is never changed — only empty
padding cells are added — so this is safe to run after the anti-drift gate.
Dependency-free.

Usage: python3 polish_tables.py --in doc.md --out doc.md
"""
import argparse
import re
from pathlib import Path


def cells(line):
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split("|")]


def is_row(line):
    s = line.strip()
    return s.startswith("|") and s.count("|") >= 2


def is_sep(line):
    if not is_row(line):
        return False
    cs = [c for c in cells(line) if c]
    return bool(cs) and all(re.fullmatch(r":?-+:?", c) for c in cs)


def render(cols):
    return "| " + " | ".join(cols) + " |"


def fix_block(rows):
    grid = [cells(r) for r in rows if not is_sep(r)]
    if not grid:
        return rows
    n = max(len(r) for r in grid)
    padded = [render(r + [""] * (n - len(r))) for r in grid]
    sep = render(["---"] * n)
    return [padded[0], sep] + padded[1:]


def main():
    ap = argparse.ArgumentParser(description="Normalize ragged pipe tables.")
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    lines = Path(a.inp).read_text(encoding="utf-8").splitlines()
    out, block = [], []
    for ln in lines:
        if is_row(ln):
            block.append(ln)
        else:
            if block:
                out.extend(fix_block(block))
                block = []
            out.append(ln)
    if block:
        out.extend(fix_block(block))

    Path(a.out).write_text("\n".join(out) + "\n", encoding="utf-8")
    print("polished tables -> %s" % a.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
