# The screen set — manifest, IDs, and the trace rule

One directory per set: `docs/design/YYYY-MM-DD-<slug>/` in the target system's
repo, holding the `.drawio` sources, any rendered output, and one `manifest.md`.

## ID scheme

| Prefix | For | Cites |
|---|---|---|
| `WF-n` | one screen | ≥1 spec step **and** ≥1 requirement ID |
| `G-n` | a state or step deliberately not drawn | what it leaves uncovered |

`WF-n` is stable and never renumbered. A screen that is dropped keeps its ID
with a `WITHDRAWN` row and a reason.

## The manifest

```markdown
# Screen set — <what these screens are for>

Derived from: docs/specs/YYYY-MM-DD-<slug>.md §7 (status: DRAFT | AGREED)
Probe verdict: render | no-render — <reason when no-render>
Fidelity: capped — neutral shapes only, no colour system, no typeface, no spacing scale
Date: YYYY-MM-DD

## Screens

| ID | Screen | Realises (step) | Realises (requirement) | States drawn | States skipped |
|---|---|---|---|---|---|
| WF-1 | | step row | FR-n | populated, empty, denied | loading — spec names none |

## Steps with no screen

| Step | Why no screen |
|---|---|
| nightly archive job | Fields and validation cell is empty — not interactive |

## Outputs

| ID | Format | Verdict | Path or reason |
|---|---|---|---|
| WF-1 | .drawio | produced | `wf-1.drawio` |
| WF-1 | .svg | n/a | no display on this machine |

## Fidelity scan

| Sink | Scanned | Findings |
|---|---|---|
| shape fill / stroke | yes | none |
| exported image | n/a | nothing rendered on this machine |

## Legibility

| ID | Check | Findings |
|---|---|---|
| WF-1 | ran / did not run — <reason> | label "Jenis kepemilikan" overflows its control |

## Gaps

| ID | Kind | Subject | Why not drawn | Risk accepted | Accepted by |
|---|---|---|---|---|---|
| G-1 | skipped-state | WF-1 loading | the spec names no loading state | a wait with no feedback ships unnoticed | |

## Change log

| Date | Change | Affected IDs | Reason |
|---|---|---|---|
```

## The trace rule, both directions

Every screen names ≥1 spec step and ≥1 requirement ID. A screen tracing nowhere
does not exist — it is a screen someone wanted, not one the spec asked for.

Downward: every interactive step has a screen or a `G-n` row. A step that is
neither drawn nor recorded is the silent omission this whole set exists to
prevent, and it is invisible unless the check runs in both directions.

## The three verdicts, kept distinct

| Verdict | Means |
|---|---|
| `produced` | the file is on disk and was observed there |
| `n/a` | deliberately not produced, with the reason — never blank |
| `failed` | attempted and errored, with the error verbatim |

A row absent entirely is a fourth thing and should not happen: every declared
output gets a row.

## Write the manifest last

Committed **once, after the last drawing operation returns**, from observed
results only. A manifest written from intent claims panels that are not there,
and a stakeholder reading it has no way to tell.

## When a reviewer objects

That objection is the artifact's whole purpose. Handle it in the **spec**, then
regenerate:

| The objection | Where it goes |
|---|---|
| "that is not the order we do it in" | the spec's step table — the field order is a spec fact |
| "this state can't happen" | the spec's state columns |
| "there's a step missing before this" | the spec's process section |
| "the label is wrong" | the spec's Fields and validation cell |
| "this box should sit over there" | the only one that is genuinely layout — record it and redraw |

Everything except the last is a spec change. Patching the picture alone leaves
the spec wrong, and the next regeneration erases the patch.

## What this set does not license claiming

- That the screen is **good**. No panel here proves that; only the person who
  does the work daily can say, and only if they are shown it.
- That the flow is **complete**. It covers the steps the spec wrote down.
- That it is **accessible**. Focus order and labels are visible here;
  conformance is `/designing-test-cases` and `/running-uat`.
- That it is **legible on a machine with no renderer**. Nothing was checked
  there, and the manifest says so.
- That anything about **appearance** has been decided. Nothing here has.
