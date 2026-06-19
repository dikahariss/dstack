# Standardization checklist

Two checklists the **Architect** owns and the **Engineer** applies when
conforming bronze sources into the normalized silver layer. The Analyst
supplies the business meaning. Every silver table and every column must
pass these before it counts as conformed.

Silver is **3NF-normalized** (see `normalization-checklist.md`); these
rules govern how its tables and values are named and shaped.

## A. Table standardization

| # | Rule | Pass condition |
|---|---|---|
| A1 | Table names are `snake_case`, English, singular, self-documenting | `order_line`, not `tOrderLines` / `ordln` / `order_lines` |
| A2 | Schema reflects the business domain: `silver_{domain}` | `silver_sales`, `silver_finance` |
| A3 | Silver tables carry **no** technical prefix (`dim_`/`fct_` belong to gold) | `customer`, not `dim_customer` |
| A4 | Column names use a suffix matching type/unit | `_at` (timestamp), `_date`, `_id` (key), `_amount`, `_pct`, `_count`, unit suffixes (`_kg`, `_m`) |
| A5 | FK names follow `fk_{referenced_entity}_id`, consistent across all tables | `fk_customer_id`, `fk_product_id` — the same name wherever that entity is referenced |
| A6 | Business keys use one standard name across tables | a customer's natural key is `customer_code` everywhere, never `kode`/`cust_no` elsewhere |
| A7 | The same kind of data uses the same data type everywhere | every monetary column is `numeric(18,2)`; every surrogate id is `bigint` |
| A8 | Mandatory audit columns on every silver table | `created_at`, `updated_at`, `ingested_at`, `processed_at` |
| A9 | Semantics — every attribute has a definition entry in the data dictionary | meaning is unambiguous; the reader never has to guess |
| A10 | Units — numeric values carry an explicit unit, reflected in the column name | `cargo_weight_kg`, `distance_nm` — never a bare `weight` |

## B. Per-column value standard

Two parts: the **standard** each column must satisfy, and the
**standardization** process that gets it there.

### B1. Standard — conditions the stored value must meet

| # | Condition |
|---|---|
| B1.1 | Format follows the agreed pattern — ISO 8601 dates/timestamps, fixed digit counts, documented code patterns |
| B1.2 | The most precise data type for the value (a real `date` / `numeric` / `boolean`, **not** a fallback `varchar`) |
| B1.3 | Categorical and status/boolean values reference a valid, documented code list |

### B2. Standardization — the process applied bronze → silver

| # | Action |
|---|---|
| B2.1 | Unify formats — dates, id numbers, reference codes, case (lower/upper) — to one agreed form |
| B2.2 | Convert every placeholder and invalid value (`"-"`, `"N/A"`, `"null"`, `0000-00-00`, `"."`) to native `NULL` |
| B2.3 | Enum/status values use one convention: lowercase, English |
| B2.4 | Free text is `TRIM`med, encoding repaired (mojibake fixed), capitalization unified |
| B2.5 | Cross-source values for the same entity are unified to one format (the conform barrier's job) |
| B2.6 | A default value is used only when it carries a clear, documented business meaning |

## How the personas use this

- **Architect** — owns the standard: defines the suffixes, the FK pattern,
  the audit columns, the code lists; enforces them in the silver proposal.
- **Engineer** — applies the standardization process (B2) during the
  bronze→silver transform; reports any value that cannot be standardized.
- **Analyst** — supplies the business meaning behind code lists (B1.3) and
  the dictionary definitions (A9).
- **Review panel** — the Engineer lens checks B2 was applied; the Architect
  lens checks A1–A10 hold; the Analyst lens checks A9 / B1.3 make business
  sense.

See `example-maritimhub.md` for these rules applied to a real estate.
