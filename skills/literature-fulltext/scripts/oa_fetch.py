#!/usr/bin/env python3
"""Resolve open-access PDFs for a DOI list via Unpaywall and download them.

OA-ONLY and polite by design: it downloads a PDF only when Unpaywall reports the
DOI is open-access, verifies the response is really a PDF, rate-limits, backs off
on 429/503, and writes a license manifest. It NEVER bypasses paywalls/logins.
Closed DOIs are skipped and logged. Dependency-free (urllib).

Usage:
  oa_fetch.py (RIS_OR_DIR | --dois a.txt | DOI ...) --email you@example.com
              [-o OUTDIR] [--rate 1.0] [--dry-run]

  --email   REQUIRED by Unpaywall (identifies you; requests without it fail).
  --dry-run resolve OA status only; write the manifest, download nothing
            (use it to preview scope before a bulk fetch).

Writes OUTDIR/<slug>.pdf and OUTDIR/manifest.csv
  (doi,is_oa,license,host,url,file,bytes,status).
"""
import argparse, csv, glob, json, os, re, sys, time, urllib.request, urllib.error, urllib.parse

API = "https://api.unpaywall.org/v2/"


def dois_from(paths, doi_file, cli):
    out = []
    if doi_file:
        with open(doi_file, encoding="utf-8-sig") as df:
            out += [l.strip() for l in df if l.strip()]
    for p in paths:
        files = glob.glob(os.path.join(p, "*.ris")) if os.path.isdir(p) else \
            ([p] if os.path.isfile(p) else glob.glob(p))
        for f in files:
            out += re.findall(r"10\.\d{4,9}/[^\s\"']+", open(f, encoding="utf-8-sig", errors="replace").read())
    out += cli
    seen, uniq = set(), []
    for d in out:
        d = re.sub(r"^https?://(dx\.)?doi\.org/", "", d, flags=re.I).strip().lower().rstrip(".,;:)]}>")
        if d and d.startswith("10.") and d not in seen:
            seen.add(d); uniq.append(d)
    return uniq


def get(url, ua, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": ua})
            return urllib.request.urlopen(req, timeout=30)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and i < tries - 1:
                time.sleep(2 ** (i + 1)); continue
            raise
        except Exception:
            if i < tries - 1:
                time.sleep(2 ** (i + 1)); continue
            raise


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="*", help="RIS files/dirs or bare DOIs")
    ap.add_argument("--dois", help="text file, one DOI per line")
    ap.add_argument("--email", required=True, help="your email (Unpaywall requires it)")
    ap.add_argument("-o", "--outdir", default="oa_pdfs")
    ap.add_argument("--rate", type=float, default=1.0, help="seconds between requests (>=1 recommended)")
    ap.add_argument("--dry-run", action="store_true", help="resolve only; download nothing")
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)
    ua = f"literature-fulltext/0.1 (mailto:{a.email})"

    dois = dois_from(a.inputs, a.dois, [x for x in a.inputs if x.startswith("10.")])
    if not dois:
        sys.exit("no DOIs found in inputs")

    man = open(os.path.join(a.outdir, "manifest.csv"), "w", newline="", encoding="utf-8")
    w = csv.writer(man); w.writerow(["doi", "is_oa", "license", "host", "url", "file", "bytes", "status"])
    n_oa = n_dl = n_closed = n_err = n_badpdf = n_nopdf = 0
    for i, doi in enumerate(dois):
        time.sleep(a.rate if i else 0)
        try:
            meta = json.load(get(API + urllib.parse.quote(doi) + "?email=" + urllib.parse.quote(a.email), ua))
        except Exception as e:
            n_err += 1; w.writerow([doi, "", "", "", "", "", "", f"lookup_error:{e}"]); continue
        is_oa = bool(meta.get("is_oa"))
        loc = meta.get("best_oa_location") or {}
        url = loc.get("url_for_pdf") or ""
        lic = loc.get("license") or ""
        host = loc.get("host_type") or ""
        if is_oa and not url:
            # best_oa_location often exposes no direct PDF even for gold OA (e.g.
            # eLife). Every oa_locations entry is an Unpaywall-vetted OA copy, so
            # fall back to the first one with a PDF instead of dropping the record.
            for alt in meta.get("oa_locations") or []:
                if alt.get("url_for_pdf"):
                    url = alt["url_for_pdf"]
                    # Report where the PDF actually came from, but keep the best
                    # location's license when the fallback copy declares none — a
                    # blank license reads as "unknown, don't redistribute" and would
                    # silently downgrade a work the publisher licensed CC-BY.
                    host = alt.get("host_type") or host
                    lic = alt.get("license") or lic
                    break
        if not is_oa:
            n_closed += 1; w.writerow([doi, is_oa, lic, host, url, "", "", "closed"]); continue
        if not url:
            n_nopdf += 1; w.writerow([doi, is_oa, lic, host, "", "", "", "oa_no_pdf_url"]); continue
        n_oa += 1
        if a.dry_run:
            w.writerow([doi, is_oa, lic, host, url, "", "", "oa_found_dryrun"]); continue
        slug = re.sub(r"[^\w.-]", "_", doi)[:120] + ".pdf"
        path = os.path.join(a.outdir, slug)
        try:
            time.sleep(a.rate)
            r = get(url, ua)
            ct = (r.headers.get("Content-Type") or "").lower()
            body = r.read()
            if "pdf" not in ct and not body[:5].startswith(b"%PDF"):
                n_badpdf += 1
                w.writerow([doi, is_oa, lic, host, url, "", len(body), "not_a_pdf"]); continue
            with open(path, "wb") as pf:
                pf.write(body)
            n_dl += 1; w.writerow([doi, is_oa, lic, host, url, slug, len(body), "downloaded"])
        except Exception as e:
            n_err += 1; w.writerow([doi, is_oa, lic, host, url, "", "", f"download_error:{e}"])
    man.close()
    e = sys.stderr.write
    e(f"DOIs={len(dois)}  OA_found={n_oa}  downloaded={n_dl}  closed_skipped={n_closed}  oa_no_pdf={n_nopdf}  not_pdf={n_badpdf}  errors={n_err}\n")
    e(f"manifest -> {os.path.join(a.outdir,'manifest.csv')}" + ("  (dry-run: no files)\n" if a.dry_run else "\n"))


if __name__ == "__main__":
    main()
