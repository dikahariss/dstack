#!/usr/bin/env python3
"""Page assemble / splice (phase 3) — keyed on the <!-- page N --> marker.

Two modes:
  assemble  build a fresh document from per-page vision results plus a YAML
            frontmatter file (for fully scanned docs with no digital base).
  splice    replace specific pages inside an existing document with new
            markdown (e.g. re-transcribed vision pages); every other page is
            left byte-for-byte untouched.

--results is JSON: a list of {page, markdown}, or a Workflow task-output object
whose "result" holds that list (possibly as a JSON string). Dependency-free.

Usage:
  python3 splice.py assemble --results pages.json --frontmatter fm.txt --out doc.md
  python3 splice.py splice   --doc doc.md --results pages.json --out doc.md
"""
import argparse
import json
import re
import sys
from pathlib import Path

MARKER = re.compile(r"^<!-- page (\d+) -->$", re.M)


def replace_page(text, page, new_md):
    ms = list(MARKER.finditer(text))
    for i, m in enumerate(ms):
        if int(m.group(1)) == page:
            end = ms[i + 1].start() if i + 1 < len(ms) else len(text)
            return text[:m.end()] + "\n%s\n\n" % new_md.rstrip() + text[end:], True
    return text, False


def load_results(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "result" in data:
        data = data["result"]
        if isinstance(data, str):
            data = json.loads(data)
    return sorted(data, key=lambda r: int(r["page"]))


def main():
    ap = argparse.ArgumentParser(description="Assemble or splice page markdown.")
    sub = ap.add_subparsers(dest="mode", required=True)
    a1 = sub.add_parser("assemble")
    a1.add_argument("--results", required=True)
    a1.add_argument("--frontmatter", required=True)
    a1.add_argument("--out", required=True)
    a2 = sub.add_parser("splice")
    a2.add_argument("--doc", required=True)
    a2.add_argument("--results", required=True)
    a2.add_argument("--out", required=True)
    a = ap.parse_args()

    results = load_results(a.results)

    if a.mode == "assemble":
        fm = Path(a.frontmatter).read_text(encoding="utf-8").rstrip() + "\n\n"
        body = "".join(
            "<!-- page %s -->\n\n%s\n\n" % (r["page"], r["markdown"].rstrip())
            for r in results
        )
        Path(a.out).write_text(fm + body, encoding="utf-8")
        print("assembled %d pages -> %s" % (len(results), a.out))
        return 0

    text = Path(a.doc).read_text(encoding="utf-8")
    done, missed = 0, []
    for r in results:
        text, ok = replace_page(text, int(r["page"]), r["markdown"])
        if ok:
            done += 1
        else:
            missed.append(r["page"])
    Path(a.out).write_text(text, encoding="utf-8")
    msg = "spliced %d pages -> %s" % (done, a.out)
    if missed:
        msg += "; no marker for pages %s" % missed
    print(msg)
    return 0 if not missed else 1


if __name__ == "__main__":
    raise SystemExit(main())
