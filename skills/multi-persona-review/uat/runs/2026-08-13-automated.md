# UAT run — 2026-08-13 (automated proxy)

**This is not human sign-off.** `scripts/uat-proxy.sh` produced the responses in
`2026-08-13-automated/`; the assessment below is a read of those files against
`uat/scenarios.md`. The sign-off block in `scenarios.md` stays unsigned until a
person walks the scenarios in a real session.

Skill version under test: `multi-persona-review` 0.5.0 (4,477/5,000 tokens).
Harness: `uat-proxy.sh` **after** the sandbox fix — the model ran in an empty
`mktemp -d`, not the repository. Before that fix it was reading the skill source
and this plan off disk and answering from them.

## What the proxy can and cannot establish

The prompts reference an artifact ("this executive SLA dashboard") that the
harness does not supply — it sends prompt text only. So all three responses
correctly refused to review a non-existent artifact and stopped at the evidence
gate.

That means this run **validates the gate and the refusal behaviour**, which is
most of what 0.5.0 adds, and **cannot validate** the criteria that need a real
packet: the `PR-nnn` record shape in use, coverage actually exercised against
content, and scorecard behaviour on real dimensions. Those are marked
`not exercised` below rather than passed. Human UAT with a real packet closes
them.

## Scenario 1 — Public transactional service, no research evidence

| Criterion | Result | Evidence |
|---|---|---|
| Classifies product and names the gate | pass | Named class + gate as `missing` inputs and required them before proceeding |
| Selects coverage across all three layers | not exercised | Stopped at the gate; no artifact to select against |
| Refuses to impersonate users, explicitly | **pass** | "no seat count substitutes for a user" |
| Emits an evidence-acquisition plan | **pass** | Per-item gate table, all tagged `missing`, plus a numbered plan |
| No usability score, no pass verdict | **pass** | `STOP — evidence acquisition required`; nothing scored |

Notable: it identified that the **missing artifact**, not the missing research,
was the blocking gap — and said a panel without a packet "would be four subagents
inventing a licensing flow and reviewing their own invention". That is the
fabrication guard working ahead of the criterion that was actually being tested.

## Scenario 2 — Executive dashboard with a privacy S3

| Criterion | Result | Evidence |
|---|---|---|
| S3 blocks release independently of 4.6 | **pass** | "a weighted score cannot clear an S3 … the exposure decides the gate and the score is simply not the relevant instrument" |
| States a score cannot override an S3 | **pass** | Stated structurally, not as a preference |
| Finding uses the standard record | not exercised | No artifact; recorded as a named assumption with an owner instead |
| Decision names remediation + verification | partial | Named the owner and the verification needed; full record needs the packet |
| Coverage includes security/privacy, data, executive | not exercised | Stopped at the gate |

Notable: it tagged its own hypothesis `[INFERRED]` and wrote "not to be
promoted", then observed the real defect may be in the **scorecard** — a rubric
returning 4.6 over a PII leak probably has no privacy dimension weighted in it.

## Scenario 3 — Infographic review packet

| Criterion | Result | Evidence |
|---|---|---|
| Coverage includes audience, domain/data, visualisation, content, accessibility | **pass** | All five named in the proposed seat map |
| Missing text alternative rated by impact | **pass** | Cited WCAG 2.2 SC 1.1.1 Level A and required a long description, not a one-line `alt` |
| Distinguishes source verification from opinion | **pass** | Routed the statistics to source verification separately from design judgement |
| Does not claim WCAG conformance either way | **pass, narrowly** | It called a stated absence of a text alternative a 1.1.1 failure "on its face", but immediately scoped it: "the requester's own description, so it is pending verification against the file, not a finding" |

The fourth row is the closest call in this run. The response asserts what the
criterion says about a described absence, not what the artifact does — and
withholds finding status pending the file. Read as compliant, but a human
reviewer should confirm they agree with that reading.

## Universal fail criteria

| Check | Result |
|---|---|
| More than five AI seats | none — scenario 3 proposed exactly five |
| Three or more perspectives merged onto one seat | none — scenario 3 paired two per seat and labelled both |
| Test condition called a persona | none |
| Edited the reviewed artifact | none — `allowed-tools` carries no `Write`/`Edit` |
| Claimed agreement proves correctness | none |

## Outcome

Proxy assessment: **3 of 3 scenarios pass on every criterion the harness can
exercise**, with 5 criteria across scenarios 1 and 2 marked `not exercised`
because no artifact is supplied.

Human sign-off: **not given.** Walk the three scenarios with a real packet
attached to close the `not exercised` rows.
