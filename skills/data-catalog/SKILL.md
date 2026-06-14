---
name: data-catalog
description: |
  Use when cataloging or inventorying many source applications or
  databases into a data dictionary (kamus data) plus an IN-scope /
  OUT-of-scope classification, or when designing a medallion
  silver/gold dimensional schema (bronze/silver/gold, dim_/fct_/ref_/
  brd_) across many sources at once. Triggers: "data catalog", "kamus
  data", "silver schema", "inventory and classify tables", "medallion
  architecture", "profile dozens of databases", "PRF-001 deliverable".
  Not for a single small database — read it directly instead.
allowed-tools: Agent Read Write
metadata:
  dstack:
    type: hybrid
    version: 0.1.1
    context_budget_tokens: 3000
    side_effects: local
    agency: deliberative
    calibration: deterministic-dominant
    triggers:
      - data catalog
      - kamus data
      - silver schema
      - inventory and classify tables
      - medallion architecture
      - profile databases
      - PRF-001
---
# /data-catalog

Catalog a large, multi-source data estate by **fanning work out to
subagents, conforming at a barrier, then fanning out again**. One
agent context cannot hold 40+ databases; this skill makes the size
tractable and keeps the output uniform.

**Core principle:** the work is a *pipeline with one barrier*, not a
flat fan-out. Per-source inventory is independent (parallel). The
silver model is a single source of truth (sequential — it needs every
inventory at once). Get the barrier wrong and the catalog never
converges.

```
Stage 1: inventory+classify   ──fan-out per app (N)──┐
Barrier: conform              ──ALL inventories ─────┤ (not parallel)
Stage 2: gold marts           ──fan-out per domain ──┘
```

## When to use

- Inventorying/profiling many apps or databases into a data dictionary.
- Classifying tables IN-scope vs OUT-of-scope at volume (dozens of apps).
- Deriving a unified silver dimensional model from many sources.
- Designing per-domain gold marts after silver is stable.

Do not use when:

- One small database — just `Read`/query it; no orchestration needed.
- You have **no** schema access at all — get dumps first (see Prerequisites).
- The sources are unrelated and never conform — then it is N separate
  small jobs, not a catalog (the barrier buys nothing).

## Prerequisites (check before Stage 1)

| Need | Why | If missing |
|---|---|---|
| Schema access per app — live `information_schema` **or** a DDL/schema dump | Stage 1 profiles real columns, not guesses | Ask the user for dumps; do not fabricate schemas |
| The app list (ids + connection/dump location) | Defines the fan-out width | Stop; ask for the manifest |
| The domain list (for Stage 2) | Defines the gold fan-out | Default to the domains in `references/medallion-schema.md`; confirm |

Live profiling (null %, distinct, row counts) needs DB connectivity from
wherever the subagents run. If this environment cannot reach the DBs,
run the skill where it can, or feed schema dumps and skip live stats.

## The pipeline

| Phase | Shape | Unit | Returns | Reference |
|---|---|---|---|---|
| **1. Inventory & classify** | fan-out | one app | catalog entry per table + KEEP/MINOR/MAJOR/DROP | `references/inventory-11-step.md`, `references/classification-rubric.md` |
| **Barrier. Conform** | sequential | all entries | unified silver model (`dim_/fct_/ref_/brd_`) | `references/medallion-schema.md` |
| **2. Gold marts** | fan-out | one domain | business-friendly gold tables | `references/medallion-schema.md` |

### Stage 1 — inventory & classify (one subagent per app)

1. Read the app list. For each app, dispatch **one** subagent (Agent
   tool). Cap concurrency — see `/dispatching-parallel-agents`.
2. **Run the prefilter first.** Each subagent runs
   `scripts/classify_prefilter.py` on the app's table-name list. It
   returns `KEEP` (reference/audit), `DROP` (framework/backup/temp),
   or `GREY`. **Only `GREY` tables cost LLM judgment** — this is the
   hybrid split: deterministic regex does the bulk, the LLM handles
   the ambiguous tail.
3. The subagent profiles + classifies per the 11 steps and returns the
   uniform schema in `references/output-schemas.md`. It does **not**
   inherit your session — construct its context from
   `references/subagent-prompts.md`.

### Barrier — conform (do NOT parallelize)

Run only after **all** Stage-1 agents return.

1. Consolidate every app's catalog entries.
2. Detect cross-app duplicates — the same real entity (vessel,
   seafarer, port) appears under different names across apps.
3. Propose the unified **silver** dimensional model (conformed
   dimensions + facts) per `references/medallion-schema.md`.

This step is the reason the pipeline has a barrier: silver is one
conformed model, so it needs every inventory at once. A pure
`parallel()` fan-out cannot produce it.

### Stage 2 — gold marts (one subagent per domain)

For each business domain, dispatch one subagent to propose
business-friendly gold tables (no `dim_`/`fct_` prefixes) sourced from
the silver model. See `references/medallion-schema.md` for the domains
and naming rules.

## Synthesis & deliverable

1. Assemble: data dictionary + IN/OUT classification + silver model +
   gold marts into the consolidated deliverable (a PRF-001-style report).
2. **Human gate.** IN/OUT-of-scope and DROP decisions need Data-Owner
   sign-off (the 5 Direktorat). Mark them as *proposed*, list them for
   review, and do not present them as final. See the rubric reference.

## The judgment surface (bounded)

The spine is fixed — the prefilter regex, the pipeline order, and the
output schemas. **Within that frame the agent reasons freely and makes
the final call on exactly three things: which GREY tables are in scope
(after the prefilter narrows them), how cross-app entities conform at the
barrier, and how each domain's gold marts are shaped.** Do not improvise
the pipeline order, the schema, or the naming rules.

## Common mistakes

| Mistake | Fix |
|---|---|
| One subagent for "all the apps" | One per app — isolated context, uniform output |
| Parallelizing the conform step | It needs every inventory at once; keep it sequential |
| LLM-classifying every table | Run the prefilter; LLM only sees `GREY` |
| Subagents inherit your chat | Construct context from the prompt templates; never paste history |
| Presenting DROP/OUT as final | They are proposals until the Data Owners sign off |
| Referencing source DDL the agent never read | Make each subagent read its app's schema/dump first |

## Cross-references

- `/dispatching-parallel-agents` — the fan-out mechanics and concurrency cap.
- `/subagent-driven-development` — if a stage needs a review loop per unit.
- `/verification` — validate each returned catalog against the output schema.

## Bundled files

- `scripts/classify_prefilter.py` — regex pre-classifier (KEEP/DROP/GREY).
- `references/inventory-11-step.md` — the per-app inventory procedure.
- `references/classification-rubric.md` — KEEP/MINOR/MAJOR/DROP, domain, data role, sign-off.
- `references/medallion-schema.md` — bronze/silver/gold/meta naming + silver & gold targets.
- `references/subagent-prompts.md` — per-stage subagent prompt templates.
- `references/output-schemas.md` — the uniform structures each subagent returns.

## Changes

- **0.1.1** — Set `calibration: deterministic-dominant` (ADR-0025).
  Rationale: the spine is rigid — prefilter regex, fixed 3-stage pipeline
  order, mandatory output schemas, and fixed naming rules — while judgment
  is bounded to three named areas (GREY classification, cross-app
  conformance, gold design). Spine strength matches the `careful` /
  `verification` exemplars. Owner-approved (governance: more rails needs
  rationale + owner sign-off, not empirical evidence).
- **0.1.0** — Initial. Three-stage medallion-cataloging orchestrator
  (per-app inventory → silver conform barrier → per-domain gold),
  hybrid prefilter for IN/OUT classification. Subagent dispatch per the
  catalog's D26 stance (the body describes dispatch; the host runs it).
