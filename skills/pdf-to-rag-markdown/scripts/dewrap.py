#!/usr/bin/env python3
"""Deterministic de-wrap + heading promotion for Indonesian regulation prose.

FAST PATH for clean-digital prose pages (a real `pdftotext -layout` text layer).
A Peraturan/UU/Permen is regular enough to de-wrap and promote headings without
an LLM. This is LETTER-NEUTRAL: it only joins wrapped lines (drops the newline,
inserts a space), strips page-number noise, and prefixes heading markers — it
never adds, drops, or reorders words. Pair it with the anti-drift gate as the
safety net for the digital fix-pass (grounding guards vision output, not dewrapped
prose). For scanned/garbled/vector pages use vision (this script is digital-only).

Input: a `pdftotext -layout` draft (YAML frontmatter + per-page `<!-- page N -->`
markers + raw layout text; built per workflows.md Phase 3).
Output: same, with prose de-wrapped and BAB/Bagian/Paragraf/Pasal promoted.

Usage: python3 dewrap.py --in draft.md --out clean.md
"""
import argparse
import re
from pathlib import Path

PAGENO = re.compile(r"^\s*-?\s*\d{1,4}\s*-?\s*$")              # "- 4 -" / "4"
MARKER = re.compile(r"^<!-- page \d+ -->$")
BAB    = re.compile(r"^\s*BAB\s+([IVXLCDM]+)\s*$")
BAGIAN = re.compile(r"^\s*(Bagian\s+[A-Za-z]+)\s*$")
PARAG  = re.compile(r"^\s*(Paragraf\s+\d+)\s*$")
PASAL  = re.compile(r"^\s*(Pasal\s+\d+[A-Za-z]?)\s*$")
DICTUM = re.compile(r"^\s*(KESATU|KEDUA|KETIGA|KEEMPAT|KELIMA|KEENAM|KETUJUH|KEDELAPAN|KESEMBILAN|KESEPULUH|PERTAMA)\s*:?\s*$")
LIST   = re.compile(r"^\s*(\(\d+\)|\d+\.|[a-z]\.|[a-z]\))\s+\S")
STRUCT = (BAB, BAGIAN, PARAG, PASAL, DICTUM)


def is_struct(line):
    return any(rx.match(line) for rx in STRUCT)


def is_block_start(line):
    s = line.strip()
    return (not s) or MARKER.match(s) or is_struct(line) or LIST.match(line) or s.startswith("#")


def process_page(text):
    lines = text.split("\n")
    out, buf, i, n = [], [], 0, len(lines)

    def flush():
        if buf:
            s = " ".join(x.strip() for x in buf).strip()
            s = re.sub(r"\s{2,}", " ", s)                 # collapse justified double-spaces
            s = re.sub(r"([a-z])-\s+([a-z])", r"\1-\2", s)  # rejoin hyphen-wrap (perundang- undangan)
            out.append(s)
            buf.clear()

    while i < n:
        raw = lines[i]
        s = raw.strip()
        if (not s) or PAGENO.match(raw) or s == ".":
            flush(); i += 1; continue
        if MARKER.match(s):
            flush(); out.append(s); i += 1; continue

        m = BAB.match(raw)
        if m:
            flush(); i += 1
            title = []
            while i < n and lines[i].strip() and not is_struct(lines[i]) and not LIST.match(lines[i]):
                t = lines[i].strip(); i += 1
                if t != ".":
                    title.append(t)
            out.append(("# BAB " + m.group(1) + (" " + " ".join(title) if title else "")).rstrip())
            continue

        done = False
        for rx, lvl in ((BAGIAN, "##"), (PARAG, "###")):
            m = rx.match(raw)
            if m:
                flush(); i += 1
                title = ""
                if i < n and lines[i].strip() and not is_struct(lines[i]) and not LIST.match(lines[i]):
                    title = lines[i].strip(); i += 1
                out.append(lvl + " " + m.group(1).strip() + (" — " + title if title else ""))
                done = True
                break
        if done:
            continue

        m = PASAL.match(raw)
        if m:
            flush(); out.append("#### " + m.group(1).strip()); i += 1; continue
        m = DICTUM.match(raw)
        if m:
            flush(); out.append("### " + m.group(1).strip()); i += 1; continue

        # list item or paragraph: accumulate continuation lines until the next block
        flush()
        buf.append(s); i += 1
        while i < n and not is_block_start(lines[i]):
            buf.append(lines[i].strip()); i += 1
        flush()

    flush()
    return "\n\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="Deterministic de-wrap + heading promotion.")
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    doc = Path(a.inp).read_text(encoding="utf-8")
    parts = doc.split("---\n", 2)
    if len(parts) == 3 and parts[0] == "":
        fm, body = "---\n" + parts[1] + "---\n\n", parts[2]
    else:
        fm, body = "", doc

    toks = list(re.finditer(r"<!-- page (\d+) -->", body))
    chunks = []
    for j, mt in enumerate(toks):
        end = toks[j + 1].start() if j + 1 < len(toks) else len(body)
        chunks.append(body[mt.start():end])
    cleaned = "\n\n".join(process_page(c) for c in chunks) if chunks else process_page(body)

    Path(a.out).write_text(fm + cleaned.strip() + "\n", encoding="utf-8")
    print("dewrap -> %s (%d pages)" % (a.out, len(toks)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
