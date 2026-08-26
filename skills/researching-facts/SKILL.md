---
name: researching-facts
description: >
  Use when a question needs an answer from the open web rather than from memory —
  facts, numbers, prices, dates, versions, the current state of a tool, market, or
  regulation — and being wrong would matter. Also use when an earlier answer rested
  on a single search engine, a single snippet, or an aggregator quoting someone
  else, or when a claim has to ship with a citation and a retrieval date. Not for
  harvesting an academic corpus (that is `/literature-search`) and not for a
  library's own API docs (use Context7). Triggers: "research this", "riset",
  "cari data", "cari fakta", "find sources", "search the web", "web research",
  "is this still true", "what's the current", "check the facts", "verify this
  claim", "cite sources", "latest version of", "brave search", "second opinion
  from another search engine".
allowed-tools: WebSearch WebFetch Bash Read Write
metadata:
  dstack:
    type: hybrid
    version: 0.1.1
    context_budget_tokens: 4500
    side_effects: external
    agency: deliberative
    triggers:
      - research this
      - riset
      - cari data
      - cari fakta
      - find sources
      - search the web
      - web research
      - is this still true
      - check the facts
      - verify this claim
      - cite sources
      - latest version of
      - brave search
      - second opinion from another search engine
---
# /researching-facts

Answer from the **open web**, using **more than one engine at once**, and let no
claim ship without a source someone else can open.

**Core principle — two engines, then the source.** A search engine ranks pages;
it does not verify them. One engine's ranking is one company's opinion about
relevance, and a snippet is not a source. Fan out, merge, then fetch.

## When to use
- The answer depends on the world's current state: a price, a limit, a version, a
  date, a regulation, who shipped what.
- A claim already made needs corroboration, or a citation with a retrieval date.
- The first search returned one domain's story and nothing contradicting it.

**When not to:** a library's own API surface (Context7 is authoritative and free);
an academic corpus for an SLR (`/literature-search`); anything answerable from the
repository in front of you.

## The spine

1. **Write the claim, not the topic.** "Brave's API is cheap" is a topic.
   "Brave Search API costs $X per 1,000 requests as of today" is checkable. State
   the stop rule with it: what evidence ends the search.
2. **Build a query set — 3 variants by default.** Vary along axes that surface
   *different* documents: the technical/exact phrasing, the plain-language
   synonym, and the language or jargon of the community that owns the fact
   (Indonesian for an Indonesian regulation, the vendor's own product name for a
   pricing page). Not exhaustive — add a contrarian variant ("X problems",
   "X deprecated") whenever the first round only found the vendor's own telling.
3. **Fan out in ONE message.** Both engines run concurrently only if both tool
   calls sit in the same assistant turn:

   ```bash
   scripts/brave_search.py "<variant 1>" "<variant 2>" "<variant 3>" -n 10
   # optional: --freshness pw|pm|py   --site vendor.com   --news   --json   --raw
   ```

   …issued together with the host's own `WebSearch` on the primary variant.
   Never run one engine, read it, then run the other: the first engine's framing
   then writes the second engine's queries, which is exactly the tunnel vision
   the fan-out exists to break.
4. **Merge.** `brave_search.py` already dedupes by normalized URL and fuses ranks
   across variants (a page several variants agree on outranks a page one variant
   put first; the `2/3 queries` marker shows that agreement). Merge the host's
   results in by hand: a URL both engines return is corroborated *ranking*, not a
   corroborated *fact*. A URL only one engine found is the reason you ran two.
5. **Fetch the primary source** for every load-bearing claim — `WebFetch`, or the
   browser when the page needs one. Prefer the document over anyone's summary of
   it; an aggregator that quotes a doc is not a second source, it is a pointer.
6. **Cross-check against the bar below**, then answer with inline links, each
   load-bearing number tagged with its retrieval date.
7. **Gate — state a fact only if you can attribute it.** Anything that failed the
   bar ships in an explicit "not verified" or "sources disagree" line. Say which
   engines actually ran.

## Evidence bar

| Claim | Bar |
|---|---|
| Number, price, quota, date, version, legal or contract text | The primary source fetched in this session, plus the retrieval date. Aggregator round-ups never suffice — they are stale by construction. |
| Contested or directional ("faster than", "most popular", "dead") | Two **independent** publishers. If they disagree, report the disagreement; do not average it. |
| Background or an uncontested definition | One reputable source, or your own knowledge marked as such. |

Not exhaustive — when a claim fits no row, apply the stricter neighbour.
**Independent** means different owners and different reporting: the same wire
story on five sites is one source; a vendor's blog plus that vendor's docs is one
source; a forum thread quoting a doc is zero — go fetch the doc.

## Stop when

A fresh variant returns no new domain in its top 10 **and** every load-bearing
claim has met its bar. Also stop at the request budget below — then say what is
still unverified rather than padding the answer with what you happen to have.

## Cost and degradation

Brave's API is **metered**: USD 5 per 1,000 requests, with USD 5 of credit each month
(≈1,000 requests) and a card on file whose overage has no spending cap — verified
2026-08-26 on `api-dashboard.search.brave.com/documentation/pricing`. One request
= one query variant, so the default fan-out costs ≈USD 0.015. The script prints the
month-to-date count after every run and logs it to `~/.config/brave-search/usage.log`.

Keep an ordinary question under **12 Brave requests**; say so and ask before a
sweep that would exceed it.

| Situation | What to do |
|---|---|
| Script exits 3 (no key) | Run the host's search alone and **say** "Brave did not run — no key on this machine". Key goes in `$BRAVE_SEARCH_API_KEY` or `~/.config/brave-search/key`. |
| Host has no `WebSearch` (Codex, Gemini CLI) | The script is the only engine; say the answer rests on one engine. |
| No Bash at all (claude.ai web) | Built-in search only; say so. |

Closed by design: these are the three ways the fan-out degrades to one engine, and
every one of them is reported rather than hidden. A silent single-engine answer is
the failure this skill exists to prevent.

## Example

Question: *does the Brave Search API still have a free tier?*

```bash
scripts/brave_search.py \
  "Brave Search API pricing per 1000 requests" \
  "brave search api free tier removed" \
  "brave search api billing overage credit card" -n 5 --freshness py
```

…in the same message as `WebSearch("Brave Search API free tier 2026")`.

The merge showed the vendor page and two independent outlets, one of them
(`implicator.ai`, 2026-06-08) reporting the free tier's removal — a story the
vendor's own page does not tell. Fetching the vendor's pricing doc gave the
authoritative numbers. Answer: no free tier; USD 5 per 1,000 requests, USD 5 monthly
credit, 50 req/s, card required, overages billed (retrieved 2026-08-26).

One engine alone gets you the price. Two engines plus the fetch get you the price
**and** the change that made yesterday's answer wrong.

## Common mistakes

| Mistake | Why it bites |
|---|---|
| Running the engines sequentially | The second query set is contaminated by the first engine's framing; the fan-out stops being independent. |
| Quoting a snippet | Snippets are truncated, undated, and sometimes rewritten. Fetch the page. |
| Counting five copies of one wire story as five sources | Corroboration requires independent reporting, not repetition. |
| Answering with the vendor's page only | Vendors do not announce removals, outages, or price rises in the tense you need. |
| Ranking agreement read as fact agreement | Both engines returning a URL means both rank it, nothing more. |
| Dropping the retrieval date | A price without a date is a claim with no shelf life. |

Not exhaustive — the shape to watch for is *treating a search result as evidence*.

## Where judgment takes over

The spine fixes the fan-out, the merge, and the evidence bar. **Yours** is
deciding which claims in an answer are load-bearing enough to pay for a second
independent source, and when one more query variant would only re-rank what you
already have. Add variants until the marginal one stops changing the answer, and
no further.

See `references/brave-api.md` for endpoints, parameters, freshness syntax, and
result-shape details the script does not expose.

## Changes

- **0.1.1** — Wrote every money figure as `USD 5`, never with a currency sign
  before a digit. Invoking a skill with arguments substitutes `$N` in the body
  with the Nth word of those arguments, so the metered-cost figures reached the
  model as words lifted out of the user's question — corrupting the one section
  that exists to bound unattended spend. Caught by invoking this skill with an
  argument string.
- **0.1.0** — Initial. Written when the catalog had no general web-research skill:
  research meant one built-in `WebSearch` call and whatever it happened to rank.
  Adds a second independent index (Brave), the same-message parallel rule, RRF
  merge across query variants, the independence definition, and mandatory
  disclosure when the fan-out degrades to one engine.
