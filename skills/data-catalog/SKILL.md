---
name: data-catalog
description: |
  Use when cataloging or inventorying many source applications or
  databases into a data dictionary (kamus data) plus an IN-scope /
  OUT-of-scope classification, or when designing a medallion schema
  across many sources at once — 3NF-normalized silver, dimensional gold
  (bronze/silver/gold; dim_/fct_/ref_/brd_ at gold). Triggers: "data
  catalog", "kamus data", "silver schema", "inventory and classify
  tables", "medallion architecture", "profile dozens of databases",
  "normalize to 3NF", "PRF-001 deliverable". Not for a single small
  database — read it directly instead.
allowed-tools: Agent Read Write
metadata:
  dstack:
    type: hybrid
    version: 0.2.0
    context_budget_tokens: 3500
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
      - normalize to 3NF
      - PRF-001
---
# /data-catalog

Catalog a large, multi-source data estate by **fanning work out to
role-specialized subagents, conforming at a barrier, then reviewing
through three senior lenses**. One agent context cannot hold 40+
databases; this skill makes the size tractable and keeps the output
uniform. The skill is domain-neutral — see `references/example-maritimhub.md`
for a worked instance.

**Core principle:** the work is a *pipeline with one barrier*, staffed by
three senior personas. Per-source inventory is independent (parallel). The
silver model is one conformed source of truth (sequential — it needs every
inventory at once). Get the barrier wrong and the catalog never converges.

```
Engineer  inventory (per app) ─┐ fan-out N
Analyst   classify  (per app) ─┘ pipeline, no barrier between them
            ▼ ALL inventories
Architect conform → SILVER (3NF)      barrier — NOT parallel
Architect design  → GOLD (per domain)  fan-out
            ▼
Review panel: Architect · Engineer · Analyst   three lenses
```

## The three senior personas

Every subagent adopts a named senior role; the same three return as a
review panel at synthesis. Prompts: `references/subagent-prompts.md`.

| Persona | Point of view | In the pipeline |
|---|---|---|
| **Senior Data Engineer** | what is physically there + its quality | Stage 1a: profile each app (DDL, stats, FK graph, prefilter) |
| **Senior Data Analyst** | does the business use it + what it means | Stage 1b: scope IN/OUT, domain, data role, shared-entity naming |
| **Senior Data Architect** | one conformed model + its layers | Barrier: 3NF silver. Stage 2: dimensional/mart gold |

## When to use

- Inventorying/profiling many apps or databases into a data dictionary.
- Classifying tables IN-scope vs OUT-of-scope at volume (dozens of apps).
- Conforming many sources into a unified, normalized silver model.
- Designing per-domain dimensional gold marts after silver is stable.

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
| The domain list (for Stage 2) | Defines the gold fan-out | Derive from the classification's Domain tags; confirm with the user |

Live profiling (null %, distinct, row counts) needs DB connectivity from
wherever the subagents run. If this environment cannot reach the DBs, run
the skill where it can, or feed schema dumps and skip live stats.

## The pipeline

| Phase | Persona | Shape | Unit | Returns | Reference |
|---|---|---|---|---|---|
| **1a. Inventory** | Engineer | fan-out | one app | technical catalog entry + prefilter labels | `inventory-11-step.md`, `output-schemas.md` |
| **1b. Classify** | Analyst | fan-out (after 1a, per app) | one app | KEEP/MINOR/MAJOR/DROP + scope + domain + role | `classification-rubric.md` |
| **Barrier. Conform** | Architect | sequential | all entries | 3NF silver model (`silver_{domain}`) | `medallion-schema.md`, `normalization-checklist.md`, `standardization-checklist.md` |
| **2. Gold** | Architect | fan-out | one domain | dimensional/mart gold (`dim_/fct_/ref_/brd_` or marts) | `medallion-schema.md` |
| **Review** | panel (3 lenses) | parallel | the deliverable | findings to reconcile | `subagent-prompts.md` |

### Stage 1 — inventory then classify (per app)

1. Read the app list. Per app, run an **Engineer** subagent (1a) then feed
   its output to an **Analyst** subagent (1b) — a per-app two-stage
   pipeline, no barrier between them. Cap concurrency; see
   `/dispatching-parallel-agents`.
2. **Run the prefilter first (in 1a).** Each Engineer runs
   `scripts/classify_prefilter.py` on the app's table-name list: `KEEP`
   (reference/audit), `DROP` (framework/backup/temp), or `GREY`. **Only
   `GREY` tables cost LLM judgment** — the hybrid split.
3. The Analyst (1b) classifies only the GREY remainder and tags domain +
   data role. Subagents never inherit your session — construct context
   from `references/subagent-prompts.md`.

### Barrier — conform to 3NF silver (do NOT parallelize)

Run only after **all** Stage-1b agents return. The **Architect** conforms
every app's entries into one **3NF-normalized** silver model: master,
transaction, and reference tables in `silver_{domain}` schemas, clean names
(no `dim_`/`fct_`), `fk_{entity}_id`, mandatory audit columns. It runs the
normalization checklist + the three anomaly tests before returning. This is
the reason the pipeline has a barrier: silver is one conformed model, so it
needs every inventory at once.

### Stage 2 — dimensional gold (per domain)

The **Architect** designs the gold layer per domain: `dim_`/`fct_`/`ref_`/
`brd_` star tables and/or aggregated business marts, sourced from silver.
Denormalization and aggregation live here, never back in silver.

## The medallion split (silver ≠ gold)

| | Silver | Gold |
|---|---|---|
| Shape | **3NF normalized** | **dimensional / aggregated** |
| Schema | `silver_{domain}` | `gold_{domain}` |
| Naming | clean entity names, no prefix | `dim_/fct_/ref_/brd_` or business marts |
| Aggregation | none | yes |

Standards every silver table must meet live in
`references/standardization-checklist.md` (naming, FK pattern, audit
columns, value formats) and `references/normalization-checklist.md`
(1NF/2NF/3NF + the insert/delete/update anomaly tests).

## Synthesis & deliverable

1. Assemble: data dictionary + IN/OUT classification + silver model + gold
   marts into the consolidated deliverable (e.g. a PRF-001-style report).
2. **Review panel.** Dispatch three reviewers in parallel — Architect,
   Engineer, Analyst — each auditing the draft through its own lens
   (`subagent-prompts.md`). Reconcile their findings before finalizing.
3. **Human gate.** IN/OUT-of-scope and DROP decisions need data-owner
   sign-off. Mark them *proposed*, list them for review, do not present
   them as final.

## The judgment surface (bounded)

The spine is fixed — the prefilter regex, the pipeline order, the output
schemas, the silver=3NF / gold=dimensional split, and both checklists.
**Within that frame the three personas reason freely: the Engineer on how
deep to profile and which implicit FKs hold, the Analyst on which GREY
tables are in scope and how entities map in business terms, the Architect
on how sources conform into normalized silver and how gold is shaped.** Do
not improvise the pipeline order, the layer split, the schemas, or the
naming rules.

## Common mistakes

| Mistake | Fix |
|---|---|
| One subagent for "all the apps" | One Engineer + one Analyst per app — isolated context, uniform output |
| Parallelizing the conform step | It needs every inventory at once; keep it sequential |
| Building `dim_`/`fct_` at silver | Silver is 3NF; dimensional tables are gold |
| Aggregations or denormalized lookups in silver | Move them to gold; silver stays normalized |
| Skipping the anomaly tests | Run insert/delete/update on every silver table; they prove the split |
| LLM-classifying every table | Run the prefilter; the LLM only sees `GREY` |
| Subagents inherit your chat | Construct context from the prompt templates; never paste history |
| Presenting DROP/OUT as final | They are proposals until the data owners sign off |
| Skipping the review panel | Three lenses catch model, data, and business defects the doer missed |

## Cross-references

- `/dispatching-parallel-agents` — the fan-out mechanics and concurrency cap.
- `/subagent-driven-development` — if a stage needs a review loop per unit.
- `/verification` — validate each returned catalog against the output schema.

## Bundled files

- `scripts/classify_prefilter.py` — regex pre-classifier (KEEP/DROP/GREY).
- `references/inventory-11-step.md` — the per-app inventory procedure (Engineer + Analyst).
- `references/classification-rubric.md` — the Analyst's KEEP/MINOR/MAJOR/DROP, domain, data role, sign-off.
- `references/standardization-checklist.md` — table + per-column value standards for silver.
- `references/normalization-checklist.md` — 1NF/2NF/3NF + the three anomaly tests.
- `references/medallion-schema.md` — bronze/silver/gold/meta naming; silver=3NF, gold=dimensional.
- `references/subagent-prompts.md` — the three personas + the review-panel prompts.
- `references/output-schemas.md` — the uniform structures each subagent returns.
- `references/example-maritimhub.md` — the spine applied to a real estate.

## Changes

- **0.2.0** — Three named senior personas (Engineer profiles, Analyst
  classifies, Architect conforms+designs) plus a three-lens review panel at
  synthesis. Generalized the spine: domain-neutral examples, parameterized
  domains and data owners, MaritimHub specifics moved to
  `example-maritimhub.md`. Reframed the medallion split per owner decision —
  **silver = 3NF normalized, gold = dimensional** (`dim_/fct_` moved to
  gold); added the standardization + normalization checklists (incl.
  insert/delete/update anomaly tests). Calibration stays
  `deterministic-dominant`: the new checklists add rails, the personas are
  bounded; budget raised 3000→3500 for the persona + panel orchestration.
- **0.1.1** — Set `calibration: deterministic-dominant` (ADR-0025).
  Rationale: the spine is rigid — prefilter regex, fixed pipeline order,
  mandatory output schemas, fixed naming rules — while judgment is bounded.
  Owner-approved.
- **0.1.0** — Initial. Three-stage medallion-cataloging orchestrator
  (per-app inventory → silver conform barrier → per-domain gold), hybrid
  prefilter for IN/OUT classification.
