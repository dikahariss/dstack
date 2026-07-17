#!/usr/bin/env python3
"""Analyze a RIS corpus: dedup + per-year counts + top journals + keyword freq.

Database-agnostic. Preserves nothing but the fields it reads; dedups by DOI
(fallback normalized title+year). Writes CSVs + a JSON summary and prints a
report. Pairs with plot_trends.py.

Usage:
  analyze_corpus.py FILE_OR_DIR [FILE_OR_DIR ...] [-o OUTDIR] [--top 40]

Outputs in OUTDIR (default '.'): corpus_by_year.csv, top_journals.csv,
keyword_frequency.csv, corpus_stats.json. If inputs are multiple files, a
per-file (per-category) count is emitted too.
"""
import argparse, glob, json, os, re, sys
from collections import Counter


def split_records(text):
    buf, inside = [], False
    for ln in text.splitlines():
        if re.match(r"^TY  - ", ln):
            buf, inside = [ln], True
        elif inside:
            buf.append(ln)
            if re.match(r"^ER  -", ln):
                yield "\n".join(buf); buf, inside = [], False


def fld(b, *tags):
    for t in tags:
        m = re.search(rf"^{t}  - ?(.*)$", b, re.M)
        if m and m.group(1).strip():
            return m.group(1).strip()
    return ""


def all_fld(b, tag):
    return [m.group(1).strip() for m in re.finditer(rf"^{tag}  - ?(.*)$", b, re.M) if m.group(1).strip()]


def doi(b):
    d = fld(b, "DO", "L3", "DI") or (re.search(r"10\.\d{4,9}/[^\s\"']+", b) or [""])[0] \
        if not fld(b, "DO", "L3", "DI") else fld(b, "DO", "L3", "DI")
    m = re.search(r"10\.\d{4,9}/[^\s\"']+", d) if d else None
    d = m.group(0) if m else d
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", d, flags=re.I).strip().lower().rstrip(".,;:)]}>") or None


def year(b):
    m = re.search(r"(19|20)\d{2}", fld(b, "PY", "Y1", "DA"))
    return int(m.group(0)) if m else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+")
    ap.add_argument("-o", "--outdir", default=".")
    ap.add_argument("--top", type=int, default=40, help="top-N keywords/journals")
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)

    files = []
    for p in a.inputs:
        files += sorted(glob.glob(os.path.join(p, "*.ris"))) if os.path.isdir(p) \
            else ([p] if os.path.isfile(p) else sorted(glob.glob(p)))
    if not files:
        sys.exit("no .ris files found")

    uniq, per_file = {}, []
    for f in files:
        n = 0
        with open(f, encoding="utf-8-sig", errors="replace") as fh:
            text = fh.read()
        for b in split_records(text):
            n += 1
            k = ("doi:" + doi(b)) if doi(b) else \
                ("tiy:" + re.sub(r"[^a-z0-9]", "", fld(b, "T1", "TI", "T2").lower()) + "|" + str(year(b)))
            uniq.setdefault(k, b)
        per_file.append((os.path.basename(f), n))
    recs = list(uniq.values())
    if not recs:
        sys.exit("no RIS records (TY..ER) parsed — convert BibTeX to RIS first")

    by_year = Counter(year(b) for b in recs if year(b))
    journals = Counter(fld(b, "JO", "JF", "T2", "J2") for b in recs if fld(b, "JO", "JF", "T2", "J2"))
    kw = Counter()
    for b in recs:
        for k in {x.strip().lower().rstrip(".") for x in all_fld(b, "KW") if x.strip()}:
            kw[k] += 1
    disp = {}
    for b in recs:
        for x in all_fld(b, "KW"):
            disp.setdefault(x.strip().lower().rstrip("."), x.strip())

    W = lambda name, rows: open(os.path.join(a.outdir, name), "w", encoding="utf-8").write(
        "\n".join(",".join('"%s"' % str(c).replace('"', "'") for c in r) for r in rows) + "\n")
    yrs = sorted(y for y in by_year)
    W("corpus_by_year.csv", [("year", "count")] + [(y, by_year[y]) for y in yrs])
    W("top_journals.csv", [("journal", "count")] + journals.most_common(a.top))
    W("keyword_frequency.csv", [("keyword", "count")] + [(disp.get(k, k), c) for k, c in kw.most_common(a.top)])

    stats = {"files": len(files), "gross": sum(n for _, n in per_file), "unique": len(recs),
             "with_doi": sum(1 for k in uniq if k.startswith("doi:")),
             "by_year": {str(y): by_year[y] for y in yrs},
             "per_file": [{"file": n_, "records": c} for n_, c in per_file],
             "top_keywords": [{"kw": disp.get(k, k), "count": c} for k, c in kw.most_common(a.top)]}
    with open(os.path.join(a.outdir, "corpus_stats.json"), "w", encoding="utf-8") as jf:
        json.dump(stats, jf, indent=2, ensure_ascii=False)

    e = sys.stderr.write
    e(f"files={stats['files']} gross={stats['gross']} unique={stats['unique']} "
      f"doi={100*stats['with_doi']//max(len(recs),1)}%\n")
    e("by year: " + ", ".join(f"{y}:{by_year[y]}" for y in yrs) + "\n")
    e(f"wrote corpus_by_year.csv, top_journals.csv, keyword_frequency.csv, corpus_stats.json -> {a.outdir}\n")


if __name__ == "__main__":
    main()
