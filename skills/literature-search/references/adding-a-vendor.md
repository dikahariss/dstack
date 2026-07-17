# Adding a database adapter

Each academic database has its own search syntax, hard limits, filters, and
export mechanics — and **vendor documentation is frequently wrong**. To add one
(e.g. Emerald Insight, Springer Nature, Taylor & Francis, Wiley), **copy this
file to `references/<vendor>.md`** and fill every slot by **measuring on the live
site**, not by copying the vendor's help pages.

## Step 1 — probe the engine (run each on the live site, record the result)
| Probe | How | What it tells you |
|---|---|---|
| **Phrase** | Search `"machine learning"` vs `machine learning` (no quotes). Compare counts. | Does the phrase operator exist? What syntax (`"..."`, `{...}`)? |
| **Wildcard** | Search `comput*` and `organi?ation`. | Are `*` / `?` supported, errored, or ignored? |
| **Connector limit** | Add `OR` terms one at a time until it errors. | Max connectors / terms per field. |
| **Char limit** | Paste a long query; find where it truncates/errors. | Max characters per field. |
| **Grouping** | `(a OR b) AND (c OR d)`. | Do parentheses work? Precedence? |
| **Spelling/plural** | `organization` vs `organisation`; `interview` vs `interviews`. | Auto-folded or not? |
| **Fields** | Locate the title/abstract/keyword field vs an all-fields field. | Which URL param, what coverage. |

## Step 2 — discover filters
Run a search, open the "refine"/facet panel, and find the URL params (or click
targets) for: **year range**, **article type** (research vs review), **subject
area**, **open access**. Record the exact param names and value formats. Also
note how to read the **per-year hit counts** (the Year facet/histogram): a trend
study (`/literature-trends`) needs that per-year *population*, not just the single
total.

## Step 3 — discover the export flow
Find how to export **RIS** (or BibTeX): the select-all control, the export
button/menu, the **per-export cap** (how many records at once), and the
**pagination** params (results-per-page, offset/page). Note where files download
and their filename pattern. Record whether **login/session** is required.

## Step 4 — fill the adapter contract
Copy this table into `references/<vendor>.md` and complete every row:

```
| Slot | Value |
|---|---|
| Search field(s) | <param> = <coverage> |
| Boolean limits  | max connectors / terms / chars per field |
| Operators       | phrase syntax; wildcard support; grouping; precedence |
| Spelling/plurals| folded / explicit |
| Filters         | year=<param>, type=<param+codes>, subject=<param>, access=<param> |
| Export          | select-all → export path; RIS format; per-export cap; pagination params |
| Auth            | session/login needed? for export? for full text? |
```

Then add a **worked example** (a neutral 2-block query sharded to fit the limit)
and a **caveats** section (coverage gaps vs Scopus/WoS, count drift). Keep every
example **domain-neutral** — the adapter documents the engine, not any one
research topic.

## Step 5 — register it
Add a row to the "Database / Adapter / Status" table in the skill body so the
agent knows the adapter exists and is tested.

> Model the finished file on `references/sciencedirect.md` — it is the reference
> instance of a completed, empirically-verified adapter.
