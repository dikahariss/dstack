# Narrow-bridge test — the 13 `deterministic-dominant` skills

Task 12 of `docs/plans/2026-08-14-unhobbling-skill-catalog.md`, and the first
run of the per-model-release re-justification required by
[ADR-0030](../adr/0030-sonnet5-calibrated-skill-shape.md) §5.

**No band was moved by this document.** ADR-0030 §5 charges one ablation run
for a move in either direction. This is the analysis that decides *which*
ablations are worth running, not a substitute for them.

## The test

> Is there exactly one safe order, with an unrecoverable failure either side?

A skill passes when getting the sequence wrong destroys something that cannot
be restored. It fails when the output is a file a human reviews before anything
acts on it — there, a wrong order costs a redraw, not data.

## Results

| Skill | Verdict | Reasoning | Ablatable? |
|---|---|---|---|
| `guarding-destructive-commands` | **PASS** | The whole skill is the bridge. Wrong order = the destructive command already ran. | yes (6) |
| `using-git-worktrees` | **PASS** | Creating a nested worktree or losing an un-isolated change is recoverable only by hand, sometimes not at all. | yes (6) |
| `finishing-development-branch` | **PASS** | Merge, PR, discard. Discard is irreversible; deleting a branch before removing its worktree wedges the repo. | yes (3, exactly at the bar) |
| `running-uat` | **PASS** | Not for irreversibility but for a stronger reason: the negative control and the standing collectors must be armed **before** the first interaction or the evidence is already gone. Order is the evidence. | yes (17) |
| `verifying-before-done` | **CONTESTED** | The gate is a claim-time check, and a wrong claim is retractable. But Anthropic's Opus 5 guidance explicitly says to remove instructions of this shape, while the Sonnet 5 guidance does not. Model-dependent — exactly what Task 10 must measure. | yes (7) |
| `designing-test-cases` | **CONTESTED** | The enumeration is the deliverable, which argues for rails. But the *order* of enumeration is free. Possibly `workflow` with a closed output contract. | yes (13) |
| `writing-specs` | **FAIL** | Output is a document reviewed before implementation. A wrong section order costs a rewrite. | yes (11) |
| `discovering-requirements` | **FAIL** | Same. Its 0.2.0 entry admits the move to this band was to stop cheap models believing they had ~70% freedom — that is a *model-steering* reason, not a narrow bridge, and it predates Sonnet 5. | yes (8) |
| `prioritizing-work` | **FAIL** | Produces an ordering a human accepts or overrides. Highest imperative density in the catalog (10.6%) on an output nobody executes blind. | yes (4) |
| `wireframing-interfaces` | **FAIL** | Produces pictures for review. | yes (4) |
| `diagramming-architecture` | **FAIL** | Produces pictures for review. | yes (3, exactly at the bar) |
| `modelling-system-behaviour` | **FAIL on the test, BLOCKED on the move** | Output is a `.puml` a human reads. The UML element set is externally fixed, but that is a *closed enumeration*, not a forced order — and ADR-0030 already handles it with the closed-by-design marker. | **no (0 invocations)** |
| `modelling-business-processes` | **FAIL on the test, BLOCKED on the move** | Same shape. `.bpmn` goes to an engine, which is the strongest counter-argument here — but the lint gate, not the band, is what protects that. | **no (0 invocations)** |

## Summary

- **4 pass** — rails earned: `guarding-destructive-commands`, `using-git-worktrees`,
  `finishing-development-branch`, `running-uat`.
- **2 contested** — must be measured, not argued: `verifying-before-done`,
  `designing-test-cases`.
- **7 fail** — candidates for demotion to `workflow`, pending one ablation each.
- **2 of those 7 cannot be ablated at all** (zero invocations), so under
  ADR-0030 §5 they can move in neither direction. They are frozen where the
  ADR-0025 ratchet left them, which is precisely the trap ADR-0030 exists to
  open. Their move waits on first real use.

If all 7 demotions survive their ablations, the band distribution goes from
13/17/1/2 to **6/24/1/2** — `workflow` becomes the actual default the doctrine
always claimed it was.

## The honesty note

This table was written by the same agent that wrote ADR-0030 and predicted the
ratchet. That is a conflict of interest: the analysis finds exactly the result
its author expected. Two guards were applied, and neither is sufficient —

1. Every FAIL names a concrete recoverability argument, not a preference.
2. Two skills the author expected to fail (`running-uat`,
   `designing-test-cases`) were not marked FAIL once the actual test was
   applied.

The ablations remain mandatory. A reviewer who disagrees with a row should
attack the recoverability claim in it, which is the falsifiable part.
