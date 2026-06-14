# Subagent prompt templates

Construct each subagent's context deliberately. They never inherit your
session — paste only what the template needs. Fill `<…>` placeholders.

## Stage 1 — one per app

```
You are cataloging ONE source application: <app-id> (engine: <engine>).
Connection / schema-dump location: <where>.

Do the 11-step inventory (summarized below). Return ONLY the JSON
structure described under "App catalog entry" — no prose.

1. Confirm access. If unreachable and no dump, return {"error":"no access"}.
2. List tables (information_schema.tables, or parse the dump).
3. Run the prefilter on the table-name list:
   python <skill>/scripts/classify_prefilter.py tables.txt
   KEEP/DROP are settled. Reason ONLY about GREY tables.
4. For each IN table: columns, types, PK/UNIQUE, row count, size; per
   column null %, distinct, a 3-row sample (mask PII), anomalies.
   With a DDL-only dump, set stats to "unavailable" — do NOT invent them.
5. Detect FKs (explicit + implicit id-name joins).
6. Flag tables that look like a SHARED entity (vessel/seafarer/port/
   company) — name the entity. Do not resolve duplicates; just flag.
7. Tag each IN table: disposition KEEP/MINOR/MAJOR/DROP, domain, data role
   (rubric below).
8. Mark every OUT/DROP for owner review.

Rubric: <paste references/classification-rubric.md Step B + tags>
Output: <paste the "App catalog entry" block from output-schemas.md>

Constraints: read the real schema before classifying. Do not migrate or
write to any source database. Return the JSON only.
```

## Barrier — conform (single agent, after ALL Stage-1 returns)

```
You receive <N> app catalog entries (attached). Produce the unified
SILVER model. Return ONLY the "Silver model proposal" JSON.

1. Concatenate all table entries.
2. Cluster tables that represent the SAME real entity across apps
   (e.g. vessel appears in app A as `kapal`, app B as `vessel`). Use the
   shared-entity flags as candidates; confirm by column overlap.
3. For each cluster propose a conformed `dim_*` (or `fct_*` for events),
   listing which source tables map in and the surviving columns.
4. Add `ref_*` for shared lookups and `brd_*` for M:N links.
5. Record bronze→silver lineage per source table.

Naming + targets: <paste references/medallion-schema.md silver section>
Output: <paste "Silver model proposal" from output-schemas.md>

This is NOT parallelizable — you need every app at once. Flag conflicts
(same entity, incompatible keys) for human resolution rather than guessing.
```

## Stage 2 — one per domain

```
You design the GOLD mart for ONE domain: <domain>.
Inputs: the silver model (attached) and this domain's consumers.

Propose business-friendly gold tables (NO dim_/fct_ prefixes) sourced
from silver. For each: name, grain, source silver tables, key measures,
intended dashboard/consumer.

Naming + examples: <paste references/medallion-schema.md gold section>
Output: <paste "Gold mart proposal" from output-schemas.md>

Constraints: every gold table must trace to silver tables that exist in
the attached model. Do not invent silver sources.
```
