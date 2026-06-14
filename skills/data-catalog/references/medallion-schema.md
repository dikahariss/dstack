# Medallion target — naming + silver/gold/meta

The schema the catalog conforms toward. Bronze → Silver → Gold, plus a
`meta` catalog schema. Single database, one schema per layer/domain.

## Naming rules

| Layer | Schema | Tables |
|---|---|---|
| Bronze | `bronze_<source_system>` | preserve original source table names (1:1 raw mirror) |
| Silver | `silver` (single, unified) | `dim_<entity>`, `fct_<event>`, `ref_<lookup>`, `brd_<relationship>` |
| Gold | `gold_<domain>` | business-friendly names, **no** technical prefixes |
| Meta | `meta` | the catalog itself (see below) |

General: lowercase, `snake_case`, singular nouns, no reserved words,
≤ 63 chars, self-documenting (no `d_vsl`).

## Silver — dimensional model (conform target)

The barrier conforms cross-app entities into these. Prefixes:

- `dim_` — describes who/what (master/entity): `dim_vessel`,
  `dim_seafarer`, `dim_port`, `dim_terminal`, `dim_employee`,
  `dim_company`, `dim_date`.
- `fct_` — events/measurements: `fct_port_clearance`,
  `fct_vessel_movement`, `fct_seafarer_certification`, `fct_revenue`,
  `fct_government_payment`.
- `ref_` — small lookups: `ref_vessel_type`, `ref_country`,
  `ref_certificate_type`.
- `brd_` — M:N bridges: `brd_vessel_seafarer`, `brd_vessel_company`.

Dimensions carry a surrogate key (`<entity>_key`), the natural/business
key, descriptive attributes, and SCD-2 columns (`effective_from`,
`effective_to`, `is_current`) where history matters. Facts reference
dimension keys and carry measurements.

## Gold — business marts (per domain)

Five domains. Tables are denormalized, aggregated, business-named.

| Domain | Schema | Example tables |
|---|---|---|
| Operations | `gold_operations` | `vessel_online_status`, `daily_vessel_movements`, `port_clearance_summary` |
| Finance | `gold_finance` | `monthly_revenue_by_port`, `pnbp_collection_trends`, `revenue_vs_target` |
| HR | `gold_hr` | `seafarer_certification_status`, `employee_headcount_by_department` |
| Safety | `gold_safety` | `vessel_inspection_status`, `compliance_score_by_vessel` |
| Licensing | `gold_licensing` | `active_permits_by_type`, `license_renewal_pipeline` |

## Meta — the catalog schema (Stage-1 output lands here)

| Table | Holds |
|---|---|
| `meta.source_system_catalog` | one row per app: name, engine, bronze schema, owner, active |
| `meta.table_catalog` | one row per table: schema, table, row count, size, scope, disposition, domain, data role |
| `meta.column_catalog` | one row per column: table, column, type, nullable, null %, distinct, description |
| `meta.transformation_lineage` | bronze → silver → gold mappings |

The data dictionary is a view over `information_schema` joined with
`meta.*` descriptions. Stage 1 fills `source_system_catalog`,
`table_catalog`, `column_catalog`; the barrier fills lineage as it maps
sources into silver.
