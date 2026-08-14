---
name: literature-trends
description: >
  Use when turning a corpus of exported bibliographic records (RIS from any
  academic database or reference manager; convert BibTeX to RIS first) into
  research-TOPIC TRENDS and
  categories — parsing and deduping citations, categorizing by topic, computing
  per-year and per-topic bibliometrics, ranking topics by volume and growth, and
  producing trend diagrams (ranking, heatmap, trajectories, keyword frequency,
  volume-vs-growth positioning). Database-agnostic. Triggers: "research trend analysis",
  "bibliometric", "topic categorization", "which topics are growing", "research
  trends", "keyword frequency", "publication trend", "corpus analysis", "trend map".
allowed-tools: Read Bash Write Edit
metadata:
  dstack:
    type: hybrid
    version: 0.2.1
    context_budget_tokens: 3000
    side_effects: local
    agency: deliberative
    triggers:
      - research trend analysis
      - bibliometric
      - topic categorization
      - trend map
      - research trends
      - keyword frequency
      - publication trend
      - corpus analysis
---
# /literature-trends

Turn an exported citation corpus into a **trend map**: topics ranked by volume
and growth, per-year trajectories, keyword themes, and diagrams. **Database-
agnostic** — consumes RIS from `/literature-search` or any reference
manager. **Stage 2** of the pipeline (`/literature-search` → **trends** →
`/literature-fulltext`).

## Two data layers — do not confuse them
| Layer | Source | Use it for |
|---|---|---|
| **Population** | per-topic × per-year **hit counts** logged during search (the database's Year facet) | the **trend signal** — every diagram of "how big / how fast" |
| **Corpus (sample)** | the exported records (often capped, e.g. top-100/search, relevance-sorted) | keyword frequency, journals, dedup, the reference library |

**Critical:** the corpus's own year distribution is **skewed toward recent years**
(relevance sort + per-export cap) — it is **NOT** the trend. Draw year trends from
the **population counts**; use the corpus for keywords/journals only. State this
caveat in the report.

## When to use
- Categorizing a citation corpus by research topic and quantifying which topics
  grow or decline over a year range.
- Bibliometric/scoping mapping to position a thesis or find under-explored niches.

**Not for:** a full systematic *screening/synthesis* of paper content (that is
manual SLR work); harvesting the records (use `/literature-search`).

## Method (the spine)
1. **Parse + dedup** the RIS → `scripts/analyze_corpus.py` (per-year counts, top
   journals, author-keyword frequency; dedup by DOI). Emits CSV + JSON.
2. **Categorize.** If harvested per-topic (one RIS file per concept), the **file
   is the category** — cleanest. Otherwise cluster by author keywords / title
   terms and label the clusters.
3. **Trend matrix.** Assemble a `topic × year` table from the **population**
   counts (a CSV: one row per topic, one column per year). This drives the charts.
4. **Growth metrics.** Rank topics by total volume; compute growth from the first
   full year to the **last full year** — **exclude a partial current year** from
   growth (annualize only if you flag it).
5. **Diagrams** → `scripts/plot_trends.py` renders the standard set. Read
   **`/dataviz`** first for palette/form rules (do not invent chart colors):
   ranking bar (+ growth), `topic×year` heatmap (row-normalized to show shape),
   indexed trajectories (base year = 100), keyword-frequency bar, and a
   volume-vs-growth **positioning** scatter (small+fast-growing = emerging niche).
   Mark any partial year on every chart.
6. **Report.** Rank + interpret (emerging vs mature), name the fastest growers and
   the biggest-but-declining, and recommend keywords / gaps.

**Where judgment takes over:** the categorization scheme, which topics and
keywords matter, reading a trajectory as rising/mature/declining, and how to treat
the partial current year. The scripts are rails; the interpretation is yours.

## Bundled files
- `scripts/analyze_corpus.py` — parse RIS → dedup (DOI, fallback title+year),
  per-year counts, top journals, author-keyword frequency → CSV + JSON. `--help`.
- `scripts/plot_trends.py` — given a `topic×year` CSV (+ optional keyword CSV),
  render the diagram set (PNG, colorblind-safe palette) per `/dataviz`. `--help`.
  Needs `matplotlib` + `numpy` (`pip install matplotlib numpy`); the other pipeline
  scripts are stdlib-only.

## Common mistakes

The recurring ones, **not exhaustive** — a new corpus shape brings its own.

| Mistake | Fix |
|---|---|
| Using the corpus's year distribution as the trend | It is relevance/cap-skewed — use the **population** counts |
| Counting a partial current year as a full year | Exclude it from growth; label it "partial" on charts |
| 15 series on one line chart | Small multiples or a row-normalized heatmap |
| Inventing chart colors | Read `/dataviz`; use its validated palette |
| Deduping by title | DOI first; title+year only as fallback |
| Summing per-topic counts for an "overall" line | Topics overlap → double-counts; use an umbrella query or the deduped corpus |

## Changes
- **0.2.1** — ADR-0030 list openness: common-mistakes table open.
- **0.2.0** — Dropped the three Indonesian trigger phrases (the literal
  translations of "trend analysis", "group the topics", and "trend map") from the
  description and the trigger list under the English-only rule (`/using-dstack`
  0.7.0): models translate intent rather than matching lexically, so the phrases
  cost tokens without adding reach. "research trend analysis" and "topic
  categorization" already covered the first two; the third is now covered by the
  English "trend map", which is what this skill produces. Nothing else here was Indonesian.
- **0.1.0** — Initial. Database-agnostic corpus→trends: parse/dedup + categorize +
  population-vs-sample discipline + growth metrics + the standard diagram set
  (delegates palette to `/dataviz`). Stage 2 of the literature pipeline.
