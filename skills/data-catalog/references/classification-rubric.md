# Classification rubric

The **Analyst**'s rubric for one app (Stage 1b), applied to the technical
inventory the Engineer returns. Two axes per table: **scope** (does it
proceed) and **disposition** (how much work to migrate it). Run the
deterministic prefilter first; reason only over what is left.

## Step A — deterministic prefilter (the script)

`scripts/classify_prefilter.py` reads table names and returns:

| Prefilter | Meaning | Rule (first match wins) |
|---|---|---|
| `DROP` | OUT-of-scope by rule | `django_*`/`auth_*`/`alembic_*`/`flyway_*` (framework); `*_migrations*`; `*_backup/_bak/_old/_copy*`; `*_tmp/_temp/_scratch/_dummy*`; `*_session/_cache/_celery/_jobqueue*` |
| `KEEP` | IN-scope by rule | `*_audit/_history/_hist/_log/_changelog` (audit); `master_*`/`ref_*`/`lookup_*`/`kode_*` (reference) |
| `GREY` | no rule matched | everything else → Step B |

Keep the regex patterns and this table in sync. The script is the
source of truth for the deterministic cases.

## Step B — LLM judgment (GREY only)

For each GREY table, decide scope, then disposition.

**Scope:**

| Scope | When |
|---|---|
| IN | business data the org actually queries or reports on |
| OUT | purely technical, ephemeral, or abandoned; no business consumer |

**Disposition (IN tables only):**

| Tag | Meaning |
|---|---|
| `KEEP` | clean; migrate to silver as-is |
| `MINOR` | small cleanup (types, nulls, naming) before silver |
| `MAJOR` | significant rework / merge before it fits the model |
| `DROP` | reclassified OUT after inspection (record why) |

## Domain + Data Role tags (every IN table)

- **Domain** — the business area. The domain set is a **parameter of the
  engagement** — derive it from the actual estate (e.g. `sales`, `finance`,
  `hr`, `operations`), do not assume a fixed list.
- **Data Role** — one of: `business-core` (transactional entities),
  `reference` (lookups), `audit` (history/log), `bridge` (M:N link).

## Expected distribution (sanity check, not a target)

If your IN/OUT split is wildly off these bands, re-examine the prefilter
hits and your GREY calls:

| Bucket | Rough share | Scope |
|---|---|---|
| Business core | 40–50% | IN |
| Reference | 10–15% | IN |
| Audit / history | 5–10% | IN |
| Technical log | 15–25% | OUT |
| Framework internal | 5–10% | OUT |
| Backup / temp | 5–10% | OUT |

## Sign-off gate

OUT-of-scope and DROP decisions are **proposals**. The engagement's data
owners sign off before anything is treated as final. Emit them as a review
list; never silently drop a table.
