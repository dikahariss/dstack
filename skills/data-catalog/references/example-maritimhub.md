# Worked example — MaritimHub estate

The generic spine applied to one real estate. Everything here is an
**instance**, not part of the skill's rules — read it to see the patterns
filled in, then parameterize for your own engagement.

## Engagement parameters

| Parameter | This estate |
|---|---|
| Sources | ~43 internal apps (`buku_pelaut`/Oracle, `kapal_online`, `inaportnet`, `sik`, …) |
| Domains | `operations`, `finance`, `hr`, `safety`, `licensing` (five) |
| Data owners | the 5 Direktorat (sign-off gate for OUT/DROP) |
| Deliverable | PRF-001 consolidated data-catalog report |
| Shared entities | vessel, seafarer, port, terminal, company |

## Stage 1 — per-app entry (Engineer + Analyst)

`buku_pelaut` (Oracle): the Engineer profiles `tbl_pelaut` (124k rows,
`pelaut_id` natural key, implicit FK `kapal_id` → `kapal_online.vessel`);
the Analyst tags it `scope: IN`, `domain: hr`, `data_role: business-core`,
`shared_entity: seafarer`.

## Barrier — conformed SILVER (3NF)

Cross-app entities normalized into `silver_{domain}`, clean names, no
`dim_`/`fct_` prefixes, mandatory audit columns:

| Silver table | Kind | Conformed from |
|---|---|---|
| `silver_operations.vessel` | master | `kapal_online.vessel`, `inaportnet.vessel_ref` (`kapal` ≡ `vessel`) |
| `silver_hr.seafarer` | master | `buku_pelaut.tbl_pelaut`, `sik.crew` |
| `silver_operations.port` | master | `inaportnet.port_ref` |
| `silver_operations.port_call` | transaction | `inaportnet.port_call` (FK-only: `fk_vessel_id`, `fk_port_id`) |
| `silver_hr.certification` | transaction | `sik.crew_assignment` |
| `silver_ref.vessel_type` | reference | `buku_pelaut.tbl_jenis_kapal` |

`port_call` holds `fk_vessel_id`, not the vessel's name or tonnage — those
live once, in `silver_operations.vessel`.

## Stage 2 — GOLD (dimensional / mart), per domain

Denormalization + aggregation, sourced from silver:

| Domain | Schema | Tables |
|---|---|---|
| Operations | `gold_operations` | `dim_vessel`, `fct_port_clearance`, `fct_vessel_movement`, `vessel_online_status` (mart) |
| Finance | `gold_finance` | `fct_government_payment`, `monthly_revenue_by_port`, `pnbp_collection_trends` |
| HR | `gold_hr` | `dim_seafarer`, `fct_certification`, `seafarer_certification_status` |
| Safety | `gold_safety` | `vessel_inspection_status`, `compliance_score_by_vessel` |
| Licensing | `gold_licensing` | `active_permits_by_type`, `license_renewal_pipeline` |
| (cross) | `gold_*` | `brd_vessel_seafarer`, `ref_vessel_type` |

## Anomaly tests, in maritime terms

The three `normalization-checklist.md` tests proving the silver split is
right:

- **Insert** — a vessel finishes construction and is registered in
  `kapal_online` before any port visit. `INSERT INTO silver_operations.vessel`
  must succeed on its own, with no `port_call` row.
- **Delete** — a PKK record entered in error in 2016 is deleted. The
  vessel, agent, and port it referenced stay intact in their own master
  tables; only the `port_call` row goes.
- **Update** — a company is renamed after a merger, or a vessel's gross
  tonnage is revised after re-measurement. One `UPDATE` to
  `silver_operations.vessel` (or `company`), and every `port_call` reflects
  it through `fk_vessel_id` + a join — no row-by-row rewrite.
