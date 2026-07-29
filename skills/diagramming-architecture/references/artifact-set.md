# The artifact set — manifest, IDs, provenance

One directory per set: `docs/design/YYYY-MM-DD-<slug>/` in the target system's
repo. It holds the sources, the artifacts, and one `manifest.md`.

## ID scheme

| Prefix | For | Cites |
|---|---|---|
| `DG-n` | one diagram, at one altitude | the requirement or spec section it depicts |

`DG-n` is stable and never renumbered. A diagram that is dropped keeps its ID
with a `WITHDRAWN` row and a reason — downstream documents cite these.

## The manifest

```markdown
# Diagram set — <what these depict>

Source of truth: the `.mmd` files in this directory. Everything else is
generated and disposable.
Probe verdict: render | no-render — <the reason, when no-render>
Date: YYYY-MM-DD

## Diagrams

| ID | Question it answers | Altitude | Source file | Source hash | Depicts |
|---|---|---|---|---|---|
| DG-1 | | context / container / component / data / process | `<slug>.mmd` | | spec §n, FR-n |

## Outputs

| ID | Format | Verdict | Path or reason |
|---|---|---|---|
| DG-1 | .drawio | produced | `<slug>.drawio` |
| DG-1 | .drawio.svg | n/a | no display on this machine |
| DG-1 | .png | failed | `drawio` exited 1: <stderr line> |

## Legibility

| ID | Check | Findings |
|---|---|---|
| DG-1 | ran / did not run — <reason> | text overflow on "Registration API"; none otherwise |

## Change log

| Date | Change | Affected IDs | Reason |
|---|---|---|---|
```

## The three verdicts, kept distinct

| Verdict | Means |
|---|---|
| `produced` | the file is on disk and was observed there |
| `n/a` | deliberately not produced — with the reason, which is never blank |
| `failed` | attempted and errored — with the error, verbatim |

`n/a` and `failed` are different facts. Merging them hides whether the machine
could not, or tried and could not. A row absent entirely is a fourth thing —
not attempted — and should not happen: every declared output gets a row.

## Write the manifest last

The manifest is committed **once, after the last output operation returns**, and
every row records an **observed** result. Writing it from intent is how a set
claims a file that is not there. If the manifest write itself fails, nothing
else is claimed either.

## Provenance and regeneration

Every artifact names its source file and that source's hash. Regeneration from
an unchanged hash produces output that is **identical after normalising the
per-run random fields**:

| Ecosystem | Field | Why it varies |
|---|---|---|
| draw.io | `diagram id` | minted per run |
| Excalidraw | `seed`, `versionNonce` | required by the format, filled from a random source |

Byte-identity is not achievable in either. Measured 2026-07-29: two draw.io runs
on one unchanged source produced files of identical length differing only in the
`diagram id`. The source hash is the thing that proves nothing moved.

## When an artifact comes back edited

Read it, convert it to XML, and **report the difference against the source**.
Never write the source from an artifact: the next regeneration would erase the
edit anyway, and the person reading the spec would never see it. The edit is
applied to the `.mmd` by a human who understands what changed.

Round-trip is deliberately out of the first cut — see the spec's `OUT-6`. This
paragraph exists so the rule is known when it arrives.

## What this set does not license claiming

- That the diagram is **correct** — it depicts what the source says, and the
  source is as right as its author.
- That it is **complete** — a set covers the questions someone thought to ask.
- That it is **legible on a machine with no renderer** — there, nothing was
  checked, and the manifest says so.
- That an artifact still matches its source **after a human edited it** — the
  hash detects that only when the check is run.
