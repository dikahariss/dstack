# Output schemas

The uniform structures each subagent returns. Uniformity is what lets the
barrier consolidate without per-source special-casing. JSON, no prose.

## App catalog entry — Engineer + Analyst return one per source app

The **Engineer** (Stage 1a) fills the technical fields; the **Analyst**
(Stage 1b) fills `scope`, `disposition`, `domain`, `data_role`,
`shared_entity`, and `review_flag`.

```json
{
  "app_id": "crm",
  "engine": "postgres",
  "connectivity": "live | dump | none",
  "tables": [
    {
      "schema": "public",
      "table": "tbl_customer",
      "row_count": 124500,
      "size_mb": 88,
      "scope": "IN | OUT",
      "disposition": "KEEP | MINOR | MAJOR | DROP",
      "domain": "sales",
      "data_role": "business-core | reference | audit | bridge",
      "prefilter": "KEEP | DROP | GREY",
      "shared_entity": "customer | null",
      "columns": [
        {
          "name": "customer_id",
          "type": "bigint",
          "nullable": false,
          "null_pct": 0.0,
          "distinct": 124500,
          "is_key": true,
          "note": "natural key"
        }
      ],
      "fks": [{ "column": "company_id", "ref": "billing.company(id)", "kind": "implicit" }],
      "review_flag": "owner-signoff-needed | null"
    }
  ],
  "summary": { "tables": 42, "in": 28, "out": 14, "grey_judged": 9 }
}
```

With a DDL-only dump, set `row_count`, `size_mb`, `null_pct`, `distinct`
to `null` and `connectivity: "dump"`. Do not fabricate stats.

## Silver model proposal — the Architect returns one at the barrier

Silver is **3NF-normalized**: master, transaction, and reference tables,
clean names, no `dim_`/`fct_` prefixes. (Those are gold.)

```json
{
  "masters": [
    {
      "name": "silver_sales.customer",
      "natural_key": "customer_code",
      "sources": ["crm.tbl_customer", "billing.cust_ref"],
      "columns": ["customer_code", "customer_name", "fk_country_id",
                  "created_at", "updated_at", "ingested_at", "processed_at"]
    }
  ],
  "transactions": [
    {
      "name": "silver_sales.order",
      "grain": "one row per order line",
      "sources": ["crm.tbl_order"],
      "fks": ["fk_customer_id", "fk_product_id"],
      "measures": ["order_amount", "quantity"]
    }
  ],
  "references": [{ "name": "silver_ref.country", "sources": ["crm.tbl_negara"] }],
  "lineage": [{ "source": "crm.tbl_customer", "silver": "silver_sales.customer" }],
  "normalization": { "anomaly_tests": "pass | fail per table", "exceptions": [] },
  "conflicts": [{ "entity": "customer", "issue": "incompatible keys across A/B", "needs": "human decision" }]
}
```

Run the three anomaly tests (`normalization-checklist.md`) before
returning. Flag conflicts (same entity, incompatible keys) for human
resolution rather than guessing.

## Gold model proposal — the Architect returns one per domain

Gold is **dimensional / aggregated**: `dim_`/`fct_`/`ref_`/`brd_` star
tables and/or business-named marts, sourced from silver.

```json
{
  "domain": "sales",
  "schema": "gold_sales",
  "tables": [
    {
      "name": "dim_customer",
      "style": "dimension",
      "grain": "one row per customer (SCD-2)",
      "silver_sources": ["silver_sales.customer", "silver_ref.country"],
      "surrogate_key": "customer_key",
      "scd": 2
    },
    {
      "name": "fct_order",
      "style": "fact",
      "grain": "one row per order line",
      "silver_sources": ["silver_sales.order"],
      "dimension_refs": ["dim_customer", "dim_product"],
      "measures": ["order_amount", "quantity"]
    },
    {
      "name": "monthly_revenue_by_region",
      "style": "mart",
      "grain": "one row per region per month",
      "silver_sources": ["silver_sales.order", "silver_sales.customer"],
      "measures": ["total_revenue", "order_count"],
      "consumer": "sales dashboard"
    }
  ]
}
```

Every gold table must trace to silver tables that exist in the conformed
model. Do not invent silver sources.

## Consolidated deliverable — you assemble

Data dictionary (all `meta.*` rows) + IN/OUT classification with the
owner-review list + the silver model + the gold marts + the review-panel
findings. Keep OUT/DROP as **proposed**; never final before the data
owners sign off.
