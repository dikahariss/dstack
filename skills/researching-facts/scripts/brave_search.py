#!/usr/bin/env python3
"""Query the Brave Search API with several query variants at once and fuse the results.

Runs every query concurrently, merges the hits by normalized URL, and ranks them
with reciprocal-rank fusion so a page several variants agree on outranks a page
one variant put first. Prints a compact table (or JSON) ready to read alongside
the host's own web-search results. Dependency-free (urllib).

Key lookup order: $BRAVE_SEARCH_API_KEY, then ~/.config/brave-search/key.
Exits 3 when no key is configured, so the caller can fall back to its own search
and SAY that Brave did not run.

Usage:
  brave_search.py QUERY [QUERY ...] [-n 10] [--news] [--freshness pw]
                  [--country id] [--lang id] [--site example.com] [--json]

  --news       search /news instead of /web (recency-ordered, adds a date)
  --freshness  pd | pw | pm | py | YYYY-MM-DDtoYYYY-MM-DD
  --site       restrict every query to one domain (appends `site:`)
  --raw        one section per query instead of a fused list
"""
import argparse, datetime, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

ENDPOINT = "https://api.search.brave.com/res/v1/{kind}/search"
KEY_FILE = os.path.expanduser("~/.config/brave-search/key")
USAGE_LOG = os.path.expanduser("~/.config/brave-search/usage.log")
PRICE_PER_REQUEST = 0.005  # Search plan, $5 / 1000 requests; $5 free credit each month
TRACKING = re.compile(r"^(utm_|fbclid|gclid|mc_|ref$|source$)")


def record_usage(n):
    """Every request is metered against a card with no spending cap, so keep the
    month-to-date count visible rather than invisible. Never fatal."""
    month = datetime.date.today().strftime("%Y-%m")
    try:
        with open(USAGE_LOG, "a", encoding="utf-8") as f:
            f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')}\t{n}\n")
        with open(USAGE_LOG, encoding="utf-8") as f:
            mtd = sum(int(l.split("\t")[1]) for l in f if l.startswith(month) and "\t" in l)
    except (OSError, ValueError, IndexError):
        return f"{n} request(s) this run (usage log unavailable)"
    return (f"{n} request(s) this run · {mtd} this month "
            f"(~${mtd * PRICE_PER_REQUEST:.2f} of the $5 monthly credit)")


def load_key():
    key = os.environ.get("BRAVE_SEARCH_API_KEY", "").strip()
    if key:
        return key
    try:
        with open(KEY_FILE, encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def canon(url):
    """Collapse the cosmetic differences two engines disagree on, so dedup works."""
    try:
        u = urllib.parse.urlsplit(url)
    except ValueError:
        return url
    host = u.netloc.lower().removeprefix("www.")
    path = u.path.rstrip("/") or "/"
    qs = [(k, v) for k, v in urllib.parse.parse_qsl(u.query) if not TRACKING.match(k)]
    return f"{host}{path}?{urllib.parse.urlencode(sorted(qs))}" if qs else f"{host}{path}"


def fetch(query, args, key, tries=4):
    params = {"q": query, "count": args.count, "spellcheck": 0}
    if args.country:
        params["country"] = args.country
    if args.lang:
        params["search_lang"] = args.lang
    if args.freshness:
        params["freshness"] = args.freshness
    if not args.news:
        params["result_filter"] = "web"
    url = ENDPOINT.format(kind="news" if args.news else "web") + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "Accept-Encoding": "identity",
        "X-Subscription-Token": key,
    })
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 401:
                sys.exit("brave: 401 — key rejected. Check $BRAVE_SEARCH_API_KEY or " + KEY_FILE)
            if e.code in (429, 503) and attempt < tries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            return {"_error": f"HTTP {e.code}: {e.read()[:200].decode('utf-8', 'replace')}"}
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < tries - 1:
                time.sleep(1.0 * (attempt + 1))
                continue
            return {"_error": str(e)}
    return {"_error": "exhausted retries"}


def results_of(payload, news):
    if "_error" in payload:
        return []
    node = payload.get("results", []) if news else payload.get("web", {}).get("results", [])
    out = []
    for r in node:
        out.append({
            "title": re.sub(r"<[^>]+>", "", r.get("title", "")).strip(),
            "url": r.get("url", ""),
            "snippet": re.sub(r"<[^>]+>", "", r.get("description", "") or "").strip(),
            "age": r.get("age") or r.get("page_age") or "",
        })
    return [r for r in out if r["url"]]


def main():
    p = argparse.ArgumentParser(description="Brave Search multi-query fan-out.")
    p.add_argument("queries", nargs="+")
    p.add_argument("-n", "--count", type=int, default=10, help="results per query (max 20)")
    p.add_argument("--news", action="store_true")
    p.add_argument("--freshness", default="")
    p.add_argument("--country", default="", help="two-letter code, e.g. id, us")
    p.add_argument("--lang", default="", help="search_lang, e.g. id, en")
    p.add_argument("--site", default="", help="restrict to one domain")
    p.add_argument("--json", action="store_true")
    p.add_argument("--raw", action="store_true", help="per-query sections, no fusion")
    args = p.parse_args()
    args.count = max(1, min(20, args.count))

    key = load_key()
    if not key:
        sys.exit(3)  # caller falls back to its own search and reports Brave as not run

    queries = [f"{q} site:{args.site}" if args.site else q for q in args.queries]
    with ThreadPoolExecutor(max_workers=min(8, len(queries))) as pool:
        payloads = list(pool.map(lambda q: fetch(q, args, key), queries))

    usage = record_usage(len(queries))
    errors = [f"{q}: {pl['_error']}" for q, pl in zip(queries, payloads) if "_error" in pl]
    per_query = [(q, results_of(pl, args.news)) for q, pl in zip(queries, payloads)]

    if args.raw:
        payload = [{"query": q, "results": rs} for q, rs in per_query]
    else:
        fused = {}
        for q, rs in per_query:
            for rank, r in enumerate(rs):
                hit = fused.setdefault(canon(r["url"]), {**r, "score": 0.0, "found_by": []})
                hit["score"] += 1.0 / (rank + 60)  # RRF: k=60, the standard damping
                hit["found_by"].append(q)
                if len(r["snippet"]) > len(hit["snippet"]):
                    hit["snippet"] = r["snippet"]
        payload = sorted(fused.values(), key=lambda h: -h["score"])

    if args.json:
        print(json.dumps({"results": payload, "errors": errors, "queries": queries, "usage": usage},
                         ensure_ascii=False, indent=1))
        return

    print(f"# Brave — {len(queries)} quer{'y' if len(queries) == 1 else 'ies'}, "
          f"{sum(len(rs) for _, rs in per_query)} hits, "
          f"{len(payload) if not args.raw else sum(len(s['results']) for s in payload)} after dedup\n")
    if args.raw:
        for section in payload:
            print(f"## {section['query']}")
            for r in section["results"]:
                print(f"- [{r['title']}]({r['url']}){' — ' + r['age'] if r['age'] else ''}\n  {r['snippet'][:240]}")
            print()
    else:
        for i, r in enumerate(payload, 1):
            agree = f" · {len(r['found_by'])}/{len(queries)} queries" if len(r["found_by"]) > 1 else ""
            print(f"{i}. [{r['title']}]({r['url']})"
                  f"{' — ' + r['age'] if r['age'] else ''}{agree}\n   {r['snippet'][:240]}")
    print(f"\n_{usage}_")
    for e in errors:
        print(f"! query failed — {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
