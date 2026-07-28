# Sourcing a constraint

Stage 4 of `/discovering-requirements`. Nothing here is optional when the domain
is regulated, contractual, or holds personal data.

## Step 1 — Scope the regimes before sourcing anything

A regime nobody named cannot be sourced, and the classic failure is building
correctly to the one standard that was considered while a second one that also
applied was never identified. Walk this list and record a verdict per row.

| Regime class | Verdict | Reason |
|---|---|---|
| Sector regulator (transport, health, finance, …) | APPLIES / DOES NOT APPLY | … |
| Personal-data / privacy law | | |
| Records, archival, and retention law | | |
| Procurement, contract, SLA, or MoU terms | | |
| Accessibility or public-service standards | | |
| Internal policy, SOP, or security baseline | | |
| Cross-border / data-residency rules | | |

`DOES NOT APPLY` needs a reason, not a blank. "Out of scope for this release" is
not a reason — that is a scope decision, and it belongs in §7 with an ID.

## Step 2 — The evidentiary floor

| Status | What it takes | Who may set it |
|---|---|---|
| `VERIFIED` | the text **as published by the issuing authority** or an official consolidated register, read directly | a **named human** only |
| `AGENT-SOURCED (pending review)` | the agent read a clause and recorded every column below | the agent |
| `ASSUMPTION` | anything less — recalled, inferred, or from a secondary source | the agent, with an owner |

**The agent may not write `VERIFIED`.** This is deliberate. The status carries
legal weight, an audit will ask who determined it, and a table cell is not an
answer. It also removes a perverse incentive: if `ASSUMPTION` required a named
owner and `VERIFIED` required nothing, the cheapest path for an agent would be
to claim the stronger status.

A law-firm briefing, a consultancy summary, a vendor whitepaper, a government
press release, or a model's own recall are **never** grounds above `ASSUMPTION`,
however precisely they quote the clause. If the source is a scanned regulation,
run `/pdf-to-rag` and cite the converted text plus the original file.

## Step 3 — Required columns

| Column | Why it exists |
|---|---|
| Constraint | one sentence, negative where possible ("registration may not…") |
| Source | document title + article / section / clause |
| Version / as amended | a correctly numbered clause from a superseded consolidation is indistinguishable from a correct one without this |
| In force at | the date the cited text was binding |
| Jurisdiction | territorial scope — the wrong territory's retention period looks identical to the right one |
| Retrieved on | the URL you read will have changed by the time anyone rechecks |
| Status | per the table above |
| Verified by | the human name, when status is `VERIFIED`; blank otherwise |
| Design impact | what it forbids, requires, or bounds |

## Step 4 — The privacy gate

Fires when any entity or attribute relates to an identified or identifiable
natural person. "Owner can be an individual" is personal data entering the
schema — the typology question in Stage 3 is where this is caught.

When it fires, §5 must carry a row for each of: lawful basis · purpose and
purpose limitation · data minimisation · retention period **and** deletion path
· data-subject rights and how each is fulfilled · cross-border transfer or
residency · controller versus processor role · special-category data · breach
notification · whether a DPIA is triggered.

This gate is **BLOCKING**. The never-block posture does not reach it: an
unresolved privacy question escalates to a named human, it does not become an
assumption row. Retrofitting consent and deletion onto a finished schema is the
single most expensive discovery failure in this catalogue.

## Step 5 — Precedence

A constraint at `VERIFIED` **overrides** a goal or a requirement it contradicts.
Record the conflict and the resolution in the conflict register; never drop
either side silently. A constraint at `AGENT-SOURCED` or `ASSUMPTION` does not
override anything — it raises a blocking question about which one is true.

Every constraint must be **discharged**: at least one requirement cites its
`C-n`, or an explicit out-of-scope row cites it with a reason. A constraint with
a filled-in design impact and no requirement is how "we knew about that rule"
becomes "nobody built it".

## Step 6 — What the document is not

Add this line verbatim under §5:

> Sourced by an agent; this is not a legal determination and requires review by
> <role> before the design is built on it.

`AGREED` on a document containing an un-reviewed §5 is organisational acceptance
of an AI-authored compliance analysis. The disclaimer plus a named reviewer is
what stops the document from acquiring an assurance nobody granted it.

## Assumptions expire

Every `ASSUMPTION` and `AGENT-SOURCED` row carries a `Needed by` date in §8.
On that date the row is re-checked or the work stops depending on it. §5 Status
is the **one field** that may be amended in place on an `AGREED` document —
dated and attributed in the change log — precisely so that correcting a wrong
legal assumption does not require authoring a whole new discovery document.
