# Medallion target — layers + naming

The schema the catalog conforms toward: Bronze → Silver → Gold, plus a
`meta` catalog schema. The defining split is **silver = normalized,
gold = dimensional**.

## Layers

| Layer | Schema | Shape | Tables |
|---|---|---|---|
| Bronze | `bronze_{source_system}` | raw 1:1 mirror | preserve original source table names |
| Silver | `silver_{domain}` | **3NF normalized**, conformed | clean entity & transaction names, **no** technical prefix |
| Gold | `gold_{domain}` | **dimensional / aggregated**, consumption | star (`dim_`/`fct_`/`ref_`/`brd_`) or business-named marts |
| Meta | `meta` | the catalog itself | see below |

General naming: lowercase, `snake_case`, singular nouns, no reserved
words, ≤ 63 chars, self-documenting (no `d_cust`). Full rules:
`standardization-checklist.md`.

## Silver — the conform target (3NF)

The barrier conforms cross-source entities into **normalized** tables.
This is where the standardization + normalization checklists apply in
full.

- **Master / entity tables** — one per real entity: `customer`, `product`,
  `company`, `employee`. Clean attributes, a natural business key, **no**
  lookups denormalized in.
- **Transaction / event tables** — one per event: `order`, `shipment`,
  `payment`. Hold **only FKs** (`fk_customer_id`) to masters plus the
  event's own measures and timestamps — never a master's attributes.
- **Reference / lookup tables** — small code lists: `product_category`,
  `country`, `currency`. Referenced by FK, never inlined as code+name pairs.
- Tables are partitioned by domain into `silver_{domain}` schemas.
- Every table carries the mandatory audit columns (`created_at`,
  `updated_at`, `ingested_at`, `processed_at`).
- History over time (SCD-2) is built in the **gold** dimensional layer, not
  by denormalizing silver.

Silver is verified by the three anomaly tests in
`normalization-checklist.md`: a master inserts without a transaction; a
transaction deletes without touching its masters; a master updates in one
row.

## Gold — the dimensional / mart layer (per domain)

Built from silver, per business domain. **Denormalization and aggregation
live here, never in silver.** Two table styles, used as the consumer needs:

- **Dimensional star** — conformed `dim_<entity>` (denormalized descriptive
  attributes, SCD-2 where history matters), `fct_<event>` (FKs to dims +
  measures), `ref_<lookup>`, `brd_<relationship>` (M:N bridges). This is
  where `dim_`/`fct_` naming belongs.
- **Aggregated business marts** — denormalized, business-named tables for
  direct dashboard use, **no** technical prefix (e.g. `monthly_revenue_by_region`).

Dimensions carry a surrogate key (`<entity>_key`), the natural key, and
SCD-2 columns (`effective_from`, `effective_to`, `is_current`) where
history matters. Facts reference dimension keys and carry measures.

The **domain list is a parameter of the engagement**, not a fixed set.
Derive it from the actual estate (the classification rubric's Domain tag).
See `example-maritimhub.md` for a five-domain instance.

## Meta — the catalog schema (Stage-1 output lands here)

| Table | Holds |
|---|---|
| `meta.source_system_catalog` | one row per source: name, engine, bronze schema, owner, active |
| `meta.table_catalog` | one row per table: schema, table, row count, size, scope, disposition, domain, data role |
| `meta.column_catalog` | one row per column: table, column, type, nullable, null %, distinct, description |
| `meta.transformation_lineage` | bronze → silver → gold mappings |

The data dictionary is a view over `information_schema` joined with
`meta.*` descriptions. Stage 1 fills `source_system_catalog`,
`table_catalog`, `column_catalog`; the barrier fills lineage as it maps
sources into silver; Stage 2 extends lineage silver → gold.
