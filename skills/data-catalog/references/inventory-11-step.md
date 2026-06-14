# Per-app inventory — the 11 steps

The procedure a Stage-1 subagent runs for **one** application. It turns
one app's database into uniform catalog entries plus a scope
classification. Output shape: `references/output-schemas.md`.

| # | Step | Produces |
|---|---|---|
| 1 | **Setup** — confirm connection (or locate the schema dump); note the DB engine and version | a reachable target, or a clear "no access" stop |
| 2 | **App manifest entry** — record app id, owner, engine, connectivity status | one row toward `meta.source_system_catalog` |
| 3 | **Schema discovery** — list tables via `information_schema.tables` (or parse the dump) | the table list for this app |
| 4 | **DDL + physical stats** — per table: columns, types, PK/UNIQUE, row count, size | column-level catalog rows |
| 5 | **Data profiling** — per column: null %, distinct count, a small sample, obvious anomalies | quality signals per column |
| 6 | **Volume & growth** — rows/day if timestamps exist; partitioning candidates | sizing notes |
| 7 | **FK dependency graph** — explicit FKs **and** implicit joins (id-name conventions); topological order | the app's internal entity graph |
| 8 | **Duplicate / entity hints** — flag tables that look like a shared entity (vessel, seafarer, port, company) | candidates for the conform barrier |
| 9 | **Tag & classify** — apply `references/classification-rubric.md`: prefilter first, LLM only on GREY | KEEP/MINOR/MAJOR/DROP + Domain + Data Role per table |
| 10 | **Flag for owner review** — mark every OUT-of-scope and DROP for Data-Owner sign-off | a review list (not a final decision) |
| 11 | **Emit catalog entry** — assemble the uniform per-app structure | the subagent's return value |

## Notes

- **Run the prefilter (step 9) before any LLM classification.** Pipe the
  step-3 table list through `scripts/classify_prefilter.py`. Only `GREY`
  tables get LLM judgment.
- Steps 5–6 need live data. With only a DDL dump, record structure and
  mark stats as `unavailable` — do not invent null %s or row counts.
- Step 8 does not *resolve* duplicates (that is the barrier's job across
  all apps). It only *flags* likely shared entities so the barrier has
  candidates.
- Keep the entry per `references/output-schemas.md` exactly — the
  barrier consolidation depends on every app using the same shape.
