#!/usr/bin/env python3
"""Merge N RIS files and deduplicate — DOI first, then normalized title+year.

Database-agnostic: works on RIS exported from ScienceDirect, Scopus, Emerald,
Springer, a reference manager, etc. Preserves each unique record's ORIGINAL RIS
block verbatim (first occurrence wins), so abstracts/authors/keywords survive.

Usage:
  ris_merge_dedup.py FILE_OR_DIR [FILE_OR_DIR ...] [-o merged.ris] [--quiet]

  Paths may be .ris files or directories (scanned for *.ris). With no -o, the
  merged corpus is written to 'corpus-merged-dedup.ris' in the current dir.

Exit: prints a count report (per-file, gross, unique, duplicates, %DOI) to stderr.
"""
import argparse, glob, os, re, sys


def split_records(text):
    """Yield raw RIS blocks (TY..ER inclusive)."""
    lines = text.splitlines()
    buf, inside = [], False
    for ln in lines:
        if re.match(r"^TY  - ", ln):
            buf, inside = [ln], True
        elif inside:
            buf.append(ln)
            if re.match(r"^ER  -", ln):
                yield "\n".join(buf)
                buf, inside = [], False


def field(block, *tags):
    for tag in tags:
        m = re.search(rf"^{tag}  - ?(.*)$", block, re.M)
        if m and m.group(1).strip():
            return m.group(1).strip()
    return ""


def norm_doi(block):
    doi = field(block, "DO", "L3", "DI")
    if not doi:
        m = re.search(r"10\.\d{4,9}/[^\s\"']+", block)  # bare DOI anywhere
        doi = m.group(0) if m else ""
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi, flags=re.I)
    return doi.strip().lower().rstrip(".,;:)]}>") or None


def year(block):
    m = re.search(r"(19|20)\d{2}", field(block, "PY", "Y1", "DA"))
    return m.group(0) if m else "?"


def key(block):
    doi = norm_doi(block)
    if doi:
        return "doi:" + doi
    title = re.sub(r"[^a-z0-9]", "", field(block, "T1", "TI", "T2").lower())
    return "tiy:" + title + "|" + year(block)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+", help=".ris files or directories")
    ap.add_argument("-o", "--output", default="corpus-merged-dedup.ris")
    ap.add_argument("--quiet", action="store_true", help="suppress per-file report")
    a = ap.parse_args()

    files = []
    for p in a.inputs:
        if os.path.isdir(p):
            files += sorted(glob.glob(os.path.join(p, "*.ris")))
        elif os.path.isfile(p):
            files.append(p)
        else:
            files += sorted(glob.glob(p))
    if not files:
        sys.exit("no .ris files found in: " + " ".join(a.inputs))

    uniq = {}          # key -> raw block (first occurrence)
    sources = {}       # key -> set(filenames)
    gross = 0
    per_file = []
    for f in files:
        n = 0
        with open(f, encoding="utf-8-sig", errors="replace") as fh:
            for blk in split_records(fh.read()):
                n += 1
                gross += 1
                k = key(blk)
                sources.setdefault(k, set()).add(os.path.basename(f))
                if k not in uniq:
                    uniq[k] = blk
        per_file.append((os.path.basename(f), n))

    if gross == 0:
        sys.exit("no RIS records (TY..ER) parsed — is the input RIS? "
                 "convert BibTeX to RIS before merging")

    with open(a.output, "w", encoding="utf-8") as out:
        for blk in uniq.values():
            out.write(blk.rstrip() + "\n\n")

    n_uniq = len(uniq)
    n_doi = sum(1 for k in uniq if k.startswith("doi:"))
    multi = sum(1 for k in sources if len(sources[k]) > 1)
    w = sys.stderr.write
    if not a.quiet:
        w("per file:\n")
        for name, n in per_file:
            w(f"  {n:5d}  {name}\n")
    w(f"\nfiles={len(files)}  gross={gross}  unique={n_uniq}  "
      f"duplicates_removed={gross - n_uniq}\n")
    w(f"with DOI={n_doi} ({100*n_doi//max(n_uniq,1)}%)  "
      f"in >1 file={multi}\n")
    w(f"wrote {n_uniq} records -> {a.output}\n")


if __name__ == "__main__":
    main()
