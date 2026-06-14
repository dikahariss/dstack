# Output schemas

The uniform structures each subagent returns. Uniformity is what lets
the barrier consolidate without per-app special-casing. JSON, no prose.

## App catalog entry (Stage 1 returns one per app)

```json
{
  "app_id": "buku_pelaut",
  "engine": "oracle",
  "connectivity": "live | dump | none",
  "tables": [
    {
      "schema": "public",
      "table": "tbl_pelaut",
      "row_count": 124500,
      "size_mb": 88,
      "scope": "IN | OUT",
      "disposition": "KEEP | MINOR | MAJOR | DROP",
      "domain": "hr",
      "data_role": "business-core | reference | audit | bridge",
      "prefilter": "KEEP | DROP | GREY",
      "shared_entity": "seafarer | null",
      "columns": [
        {
          "name": "pelaut_id",
          "type": "bigint",
          "nullable": false,
          "null_pct": 0.0,
          "distinct": 124500,
          "is_key": true,
          "note": "natural key"
        }
      ],
      "fks": [{ "column": "kapal_id", "ref": "kapal_online.vessel(id)", "kind": "implicit" }],
      "review_flag": "owner-signoff-needed | null"
    }
  ],
  "summary": { "tables": 42, "in": 28, "out": 14, "grey_judged": 9 }
}
```

With a DDL-only dump, set `row_count`, `size_mb`, `null_pct`, `distinct`
to `null` and `connectivity: "dump"`. Do not fabricate stats.

## Silver model proposal (the barrier returns one)

```json
{
  "dimensions": [
    {
      "name": "dim_vessel",
      "grain": "one row per vessel (SCD-2)",
      "natural_key": "vessel_code",
      "sources": ["kapal_online.vessel", "inaportnet.vessel_ref"],
      "columns": ["vessel_key", "vessel_code", "vessel_name", "vessel_type", "gross_tonnage"]
    }
  ],
  "facts": [
    {
      "name": "fct_port_clearance",
      "grain": "one row per clearance event",
      "sources": ["inaportnet.port_call"],
      "dimension_refs": ["dim_vessel", "dim_port"],
      "measures": ["cargo_weight", "revenue_amount"]
    }
  ],
  "references": [{ "name": "ref_vessel_type", "sources": ["buku_pelaut.tbl_jenis_kapal"] }],
  "bridges": [{ "name": "brd_vessel_seafarer", "sources": ["sik.crew_assignment"] }],
  "lineage": [{ "source": "kapal_online.vessel", "silver": "dim_vessel" }],
  "conflicts": [{ "entity": "vessel", "issue": "incompatible keys across A/B", "needs": "human decision" }]
}
```

## Gold mart proposal (Stage 2 returns one per domain)

```json
{
  "domain": "operations",
  "schema": "gold_operations",
  "tables": [
    {
      "name": "vessel_online_status",
      "grain": "one row per vessel, current",
      "silver_sources": ["dim_vessel", "fct_port_clearance"],
      "measures": ["total_clearances_ytd", "days_since_last_activity"],
      "consumer": "operations dashboard"
    }
  ]
}
```

## Consolidated deliverable (you assemble; PRF-001-style)

Data dictionary (all `meta.*` rows) + IN/OUT classification with the
owner-review list + the silver model + the gold marts. Keep OUT/DROP as
**proposed**; never final before the 5-Direktorat sign-off.
