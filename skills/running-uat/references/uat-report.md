# UAT run log, defect records, and exit thresholds

## Acceptance criterion — the shape that is testable

```
AC-03  Saving a draft catalog entry
  Given  I am signed in as a data steward
   When  I edit a catalog entry and click Save while status is "draft"
   Then  the entry persists with status "draft"
    and  it still appears after a page reload
```

The **Then** must name something observable at the system boundary. Rewrite test:
*if someone could write an automated check straight from this line, it is specific
enough; if they would have to ask a question first, it is not.*

Anti-patterns that make a criterion unjudgeable:

| Anti-pattern | Why it fails |
|---|---|
| "fast", "user-friendly", "intuitive" | no oracle — nothing to observe |
| states a solution ("use a modal") instead of an outcome | prescribes implementation; can't be judged from the stakeholder's view |
| a mini-specification in one criterion | no clear pass boundary |
| conjunctions ("… **and** …" in Given or Then) | partial pass is indistinguishable from pass; split it |
| imperative UI steps ("click `#btn-save`") | couples the criterion to the DOM instead of the business rule |
| no negative path | empty state, permission denied, and timeout are the most-forgotten criteria |

## Run log — one row per scenario attempt

```
run: 2026-07-19T14:02+07:00   build: a1b2c3d   base URL: http://127.0.0.1:4310
AC hash (frozen): 9f2c…            negative control: PASS-as-FAIL confirmed ✓

| # | AC | attempt | verdict | evidence | note |
|---|----|---------|---------|----------|------|
| 1 | AC-03 | 1 | FAIL | dom-01.txt, net-01.json | saved, but status flipped to "published" |
| 2 | AC-03 | 2 | PASS | dom-04.txt, net-04.json, reload-04.txt | after fix 4e5f6a7 |
| 3 | AC-03 | 2b | PASS | dom-07.txt | second clean-state pass (confirmation) |
| 4 | AC-01,02,04 | — | PASS | … | regression after the AC-03 fix |
```

Rules the table enforces: every verdict cites an artifact path; a FAIL→PASS
transition needs a second clean-state pass; a fix triggers a regression row.

## Defect record

```
DEF-2  Draft save publishes the entry
  severity   : major   (data visible to consumers before review — observable impact)
  priority   : NOT SET — business decision; set by the owner, or by
               /prioritizing-work against the rest of the work
  scenario   : AC-03, attempt 1
  evidence   : dom-01.txt (status="published"), net-01.json (PATCH 200, body status=published)
  repro      : 1. sign in as steward  2. open entry X  3. edit title  4. Save
  observed   : status becomes "published"
  expected   : status stays "draft" (AC-03)
  hypothesis : business impact — unreviewed rows reach downstream consumers
```

**Severity is yours; priority is not.** Severity is the observed impact and is
technical. Priority is business importance, is set with the owner, and shifts over
time — a misspelt company name is low severity and high priority. Propose
severity with evidence; escalate priority to the owner, or to
`/prioritizing-work` when the question is where this sits against other work.

## Exit criteria — defaults to agree, not standards to assert

| Gate | Common default |
|---|---|
| Scenarios executed | 100% of the frozen AC list |
| Severity-1 defects | zero open, each confirmation-tested |
| Severity-2 defects | ~95% resolved, remainder triaged with a named owner |
| Remaining defects | formally triaged: fix now / defer with owner / not a defect |
| Sign-off | the stakeholder accepts — the agent reports, it does not accept on their behalf |

**Say plainly that these numbers are convention.** ISTQB defines the *concepts* of
entry and exit criteria (and makes "definition of done" a synonym for exit
criteria, "definition of ready" for entry criteria); it does not set thresholds.
The 95–100% figures, the five-level severity scale, and the three-level priority
scale are practitioner convention. The one formal test-documentation standard,
ISO/IEC/IEEE 29119-3, is paywalled and actively contested — do not cite it as
settled authority.

## Session shape

Borrow Session-Based Test Management: a **charter** (what this session is testing
and what it is looking for, without prescribing steps), a **fixed budget** set
before starting, and a **session report** at the end. Exit criteria terminate the
session — not the disappearance of all findings. Exit criteria exist precisely to
prevent endless cycles.

Anything discovered that is not on the frozen AC list is an **observation**: log
it, do not open a new test loop for it. Scope ballooning mid-UAT is the most
commonly reported way these sessions fail.
