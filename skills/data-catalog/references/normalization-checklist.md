# Normalization checklist

The **Architect**'s discipline at the conform barrier. Silver is
**3NF-normalized**: different entities live in different tables, and the
real challenge is reading the source well enough to tell the entities
apart.

Run this over every proposed silver table. The anomaly tests at the end
are the practical proof the normalization holds.

## 1NF — atomicity & uniqueness

| # | Question | ✓ |
|---|---|---|
| 1.1 | Does every cell hold exactly **one** value? | ☐ |
| 1.2 | Is no cell a **JSON / array / concatenated** value? | ☐ |
| 1.3 | Are there no **structured facts hidden in free text**? | ☐ |
| 1.4 | Are there no **numbered columns** (repeating groups: `phone_1`, `phone_2`)? | ☐ |
| 1.5 | Are there no **duplicate columns** for the same fact? | ☐ |
| 1.6 | Does every table have a unique **primary key**? | ☐ |
| 1.7 | Are there no **duplicate rows**? | ☐ |
| 1.8 | Does **row order** carry no meaning (an explicit column holds any ordering)? | ☐ |
| 1.9 | Does **column order** carry no meaning (relationships are by name / dictionary)? | ☐ |

## 2NF — full dependency on the primary key

| # | Question | ✓ |
|---|---|---|
| 2.1 | Does every column depend on the **whole** PK (not part of a composite key)? | ☐ |
| 2.2 | Are no **other-entity attributes** stored inside a transaction table? | ☐ |
| 2.3 | Does every **master** entity have its own table? | ☐ |
| 2.4 | Do transaction tables hold **only FKs** to masters, not the masters' attributes? | ☐ |
| 2.5 | Is one entity **not redefined** across several transaction tables? | ☐ |

## 3NF — no transitive dependency

| # | Question | ✓ |
|---|---|---|
| 3.1 | Is no column's value **determined by another non-key column**? | ☐ |
| 3.2 | Is there no **code + name pair of another entity** in a transaction table? | ☐ |
| 3.3 | Are there no **calculated columns** derived from other columns in the same table? | ☐ |
| 3.4 | Are there no **aggregation columns** (sum / count / avg) in a silver table? (those belong to gold) | ☐ |
| 3.5 | If a calculated column is kept as an exception, is the **reason documented**? | ☐ |

## Anomaly testing — the proof

Three practical tests. If any fails, the normalization is wrong — fix the
table split, not the test. State each against the actual estate.

### Test 1 — insert anomaly

A master must be insertable **without** a transaction. If you cannot add a
new master entity until some event references it, master and transaction
are wrongly fused.

> Generic: a new product is created in the catalog before it has ever been
> ordered — `INSERT` into the product table must succeed on its own.

### Test 2 — delete anomaly

Deleting a transaction must **not** delete a master. If removing one event
erases entity data, the entity is trapped inside the transaction table.

> Generic: a mistaken order from 2016 is deleted — the customer, product,
> and address it referenced stay intact in their own tables.

### Test 3 — update anomaly

Changing a master must touch **one** row. If a master attribute is copied
across many transaction rows, every copy needs updating and they drift.

> Generic: a company is renamed after a merger — one `UPDATE` to the
> company table, and every transaction reflects it through its FK + join.

See `example-maritimhub.md` for these three tests written against vessels,
PKK records, and port calls.

## How the personas use this

- **Architect** — runs the full checklist + the three anomaly tests on the
  silver proposal at the barrier.
- **Engineer** — surfaces the source shapes (repeating groups, embedded
  JSON, code+name pairs) the checklist must catch.
- **Analyst** — confirms which tables are masters vs transactions in
  business terms (an entity boundary is a business judgment).
- **Review panel** — the Architect lens re-runs the three anomaly tests
  against the final model.
