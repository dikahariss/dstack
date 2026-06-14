#!/usr/bin/env python3
"""Anti-drift gate (phase 5) — the safety net.

Reassemble a fixed document from per-chunk out_NNN.md files, but REVERT any
chunk whose letter/digit stream drifted from its in_NNN.md source. Legitimate
de-wrapping and heading promotion add zero letters, so they never trip the
revert; hallucination (adds letters) and content loss (removes letters) do.

The letter-stream comparison and thresholds encode the method proven against
7 Indonesian government documents. Dependency-free (stdlib only).

Usage:
  python3 anti_drift_gate.py --in-dir work/<slug> --out final.md \
      [--frontmatter fm.txt] [--add-threshold 40] [--rem-ratio 0.06]

Layout expected under --in-dir: in_001.md/out_001.md, in_002.md/out_002.md, ...
A missing or drifted out_NNN.md falls back to its in_NNN.md (never lose source).
"""
import argparse
import difflib
import re
import sys
from pathlib import Path


def stream(t):
    """Letter/digit stream: ignore whitespace, markdown, '#', and page markers."""
    t = re.sub(r"<!-- page \d+ -->", " ", t)
    return re.sub(r"[^a-z0-9]+", "", t.lower())


def drift(src, fixed):
    """Return (added, removed) letters going from src to fixed."""
    a, b = stream(src), stream(fixed)
    add = rem = 0
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag in ("insert", "replace"):
            add += j2 - j1
        if tag in ("delete", "replace"):
            rem += i2 - i1
    return add, rem


def main():
    ap = argparse.ArgumentParser(description="Letter-stream anti-drift gate.")
    ap.add_argument("--in-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--frontmatter")
    ap.add_argument("--add-threshold", type=int, default=40)
    ap.add_argument("--rem-ratio", type=float, default=0.06)
    a = ap.parse_args()

    d = Path(a.in_dir)
    ins = sorted(d.glob("in_*.md"))
    if not ins:
        print("no in_*.md under %s" % d, file=sys.stderr)
        return 1

    parts, reverted = [], []
    for ipath in ins:
        idx = ipath.stem.split("_", 1)[1]
        opath = d / ("out_%s.md" % idx)
        src = ipath.read_text(encoding="utf-8")
        if not opath.exists():
            parts.append(src)
            reverted.append((idx, "missing out_%s.md" % idx))
            continue
        fixed = opath.read_text(encoding="utf-8")
        add, rem = drift(src, fixed)
        if add > a.add_threshold or rem > a.rem_ratio * max(1, len(stream(src))):
            parts.append(src)
            reverted.append((idx, "add=%d rem=%d" % (add, rem)))
        else:
            parts.append(fixed)

    body = "\n\n".join(p.strip() for p in parts) + "\n"
    fm = ""
    if a.frontmatter:
        fm = Path(a.frontmatter).read_text(encoding="utf-8").rstrip() + "\n\n"
    Path(a.out).write_text(fm + body, encoding="utf-8")

    print("wrote %s: %d chunks, %d reverted" % (a.out, len(ins), len(reverted)))
    for idx, why in reverted:
        print("  revert chunk %s: %s" % (idx, why))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
