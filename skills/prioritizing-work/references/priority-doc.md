# The priority document

One file, `docs/priority/YYYY-MM-DD-<slug>.md`, in the **target system's
repo**. A user preference for location overrides this.

The document exists so a later reader can check the decision without
re-running it. That means every number carries where it came from, and
every departure from the numbers carries why.

## Header

```markdown
# Priority round — <scope>

**Lane:** PROJECT — L1: "Perjanjian Kerja Sama §7.2, delivery 2026-10-31"
**Rungs evaluated:** L1 fired · L2–L5 not evaluated (stopped at first match)
**Split:** none
**Round date:** 2026-08-09 · **Re-run when:** any rung's answer changes
**Pass order:** effort estimated 2026-08-07, before value — R10

**Constants**
| Constant | Value |
|---|---|
| Effort unit | person-days, whole team |
| Roles summed | PM, design, eng, QA |
| `period` | 1 month |
| S/M/L fallback | S=2, M=8, L=21 pd |
| Timeframe | Increment, ends 2026-10-31 |
| Capacity | 40 pd |
| Primary journeys | submit a filing · retrieve a filing receipt |
| Should threshold | ≥25% of 120 named filers |
```

For a PRODUCT round the last four rows become: the **one** goal metric
with its current value, the reach window, the reach unit, and the
confidence encoding.

A constant recorded as `TBD` means the round is `BLOCKED`. Write the
block, not the table.

## Scored rows

**PROJECT lane** — one row per item:

| Item | Letter | Gate evidence | Value (band quoted) | Effort (band quoted) | `R` | Tier | Provenance |
|---|---|---|---|---|---|---|---|

**PRODUCT lane**:

| Item | Kano | Fulfilment | Band | R | I | C | E | Score | Tier | Provenance |
|---|---|---|---|---|---|---|---|---|---|---|

Rules that apply to both:

- The **band row is quoted verbatim** in the value and effort cells —
  `18 pd → 6 (band 14–20 pd)`. R7 makes a skipped reference read visible.
- The **provenance cell names the source**, not the tier letter alone:
  `E1 — filings_by_agent dashboard, 2026-04-01→06-30`.
- RICE scores print their two lines in the row or directly beneath it.
- Nothing from two lanes appears in one sorted table (R11).

## Required sections

### `## Cannot score`

Every `UNSCORABLE` item, with the **missing field** named and the
cheapest measurement that would fix it, with a person-day cost. Never a
low score standing in for a missing one.

### `## Routed out`

Every `OUT-*` item with its destination. An empty section on a round of
more than 8 items means Stage 1 was skipped (S10).

### `## Riskiest assumption`

The #1 assumption, its `impact × (1 − confidence)` score, its cheapest
falsifier with a cost and an observable outcome, and the sequence
position that falsifier occupies. R1 requires
`position ≤ max(1, ceil(0.2 × N))`.

### `## Order departs from score`

**Every** departure, one line each, with its reason — or the literal
`none`. A round that presents the sorted table as the decision has
misused the framework even when every number is right.

```markdown
## Order departs from score
- C outranks A on ratio (2.00 vs 1.67) but is sequenced after it: C is blocked_by A.
- E is scheduled before D despite a lower ratio: E is the falsifier for assumption #1 (R1).
```

### `## Alarms`

Every self-check alarm that fired, with what was done. An alarm
acknowledged and not acted on is recorded as such — silently passing one
is what trains the next round to dismiss all thirteen.

## Chat report

Not the whole document. Report: the lane and its deciding rung · the #1
assumption and its falsifier · the top tier · every `UNSCORABLE` · every
alarm that fired.
