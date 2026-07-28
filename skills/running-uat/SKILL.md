---
name: running-uat
description: >
  Use when acceptance-testing a RUNNING application against acceptance criteria
  from a stakeholder's point of view — driving the real app through a browser,
  judging PASS/FAIL on observed evidence, and looping fixes until the exit
  criteria are met. Covers the entry gate (unit/e2e green first), the evidence
  rules that stop a false PASS, per-persona points of view, and a hard iteration
  cap. Not for unit or e2e tests, and not for testing a dstack skill. Triggers:
  "lakukan UAT", "run UAT", "UAT dengan point of view", "acceptance test",
  "uji terima", "test via browser", "pastikan PASS semuanya", "user acceptance
  testing", "UAT end-to-end", "smoke test the running app".
allowed-tools: Bash Read Write Edit Agent Skill Glob Grep
metadata:
  dstack:
    version: 0.2.0
    type: semantic
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - lakukan uat
      - run uat
      - acceptance test
      - uji terima
      - uat end-to-end
      - uat point of view
      - test via browser
      - pastikan pass semuanya
---
# /running-uat

Acceptance testing judges whether the **running** system satisfies the
stakeholder's acceptance criteria. It is not a defect hunt — it produces an
accept/reject decision, and defects are a by-product.

```
THE ORACLE IS THE ACCEPTANCE CRITERIA — NEVER THE CODE
```

ISTQB defines a test oracle as a source of expected results that "should not be
the code." The moment you read the implementation to decide what *correct* means,
you have stopped doing UAT and started re-running system tests against the
author's own assumptions.

**This skill raises the cost of lying to yourself.** The research on web agents is
blunt: roughly 30% of trajectories an LLM judge marks successful are false
positives, side-effect detection runs at 6–14% precision, and agents facing an
obstacle "guess results, perform unsupported simulations, and fabricate local
files" rather than report failure — and *prompt-based mitigation offers only
limited effectiveness*. The guards below are therefore **structural**, not appeals
to honesty. Follow them literally.

## When to use — and when not

| Situation | Use |
|---|---|
| Judge a running app against acceptance criteria | `/running-uat` (this skill) |
| Write the failing test before production code | `/test-driven-development` |
| About to claim work is done / fixed / passing | `/verifying-before-done` |
| Test whether a **dstack skill** behaves | that skill's own `uat/scenarios.md` — a different sense of "UAT"; do not confuse the two |
| Root-cause a defect this session found | `/debugging` |
| Review a document or design from several expert views | `/multi-persona-review` |

Do not start UAT to *find out* whether the build works. That is the entry gate's
job.

## Entry gate — refuse to start if any row fails

Refusing is a valid and cheap outcome. Report the failing row and stop.

- [ ] **Acceptance criteria enumerated**, Given/When/Then, each naming an
      *observable* consequence. No criteria → no UAT. `/designing-test-cases`
      produces them; its `human`-level rows are this list.
- [ ] **Unit and integration/e2e suites green.** Run them; read the output.
- [ ] **App builds and starts**; the URL responds. Bind a free port and record
      it, so parallel runs do not collide.
- [ ] **Test data seeded** and identified, covering normal *and* edge cases.
- [ ] **Auth path known** — credentials, or an existing session.
- [ ] **Scope frozen.** Copy the AC list verbatim into the run log. A mid-run
      change to the criteria is a scope change: escalate, never edit.

## The loop

1. **Order scenarios by risk** — business impact × likelihood of failure, highest
   first, so a truncated run still covers what matters.
2. **Arm the standing collectors before the first interaction**: console messages
   and uncaught page errors. Attached late, they miss the early throw.
3. **Plant a negative control** — one check you *know* must FAIL. If it reports
   PASS, the observation pipeline is broken: abort the session.
4. **Per scenario**, drive the real UI, then gather evidence (next section) and
   record PASS / FAIL / BLOCKED with artifact paths.
5. **On FAIL** — fix, then run **confirmation** (re-run the failed scenario) *and*
   **regression** (re-run passing scenarios the fix could affect). A scenario that
   just went FAIL → PASS must pass **twice from clean state** before it counts:
   at Google, >80% of test-result transitions are flakiness, not real change.
6. **Cap at 3 attempts per scenario.** On exhaustion, report BLOCKED with evidence
   and stop — do not keep browsing.
7. **Report post-conditions; never self-declare "done."** Present observed
   post-conditions against the frozen exit criteria and let that comparison decide.

Drive the browser with the **`/claude-in-chrome`** skill (load its tools via
`ToolSearch` first), or a Playwright run when the repo already has one and you
want a headless, repeatable pass. Either is fine. **Claiming UAT without actually
driving a browser is not.**

## Evidence — what a PASS must cite

Ranked strongest first. **A PASS requires a DOM/accessibility assertion on a
named element, plus at least one of: the network response, or a post-reload
re-read proving persistence.**

| Rank | Evidence | Proves |
|---|---|---|
| 1 | DOM / accessibility-tree assertion on a uniquely named element | the UI actually reached the state |
| 2 | Network response status + body for the request the action triggered | the server did it — not an optimistic paint |
| 3 | Re-read after reload | it persisted; the system really changed |
| 4 | Console + `pageerror` collectors empty | nothing threw behind a healthy-looking flow |
| 5 | Screenshot | **corroborating only** — and the sole evidence for genuinely visual criteria (layout, chart rendered, theme applied) |

**Screenshots are the weakest link and the easiest to be fooled by.** A
backgrounded or throttled tab returns the last composited frame, not the present
state; `getComputedStyle` in a throttled tab can lag a frame. When a screenshot
contradicts the code, trust the DOM: read `getComputedStyle(el)` and
`elementsFromPoint(x, y)`, force a repaint (resize the window, then restore), and
re-shoot. Never revert code on the strength of one screenshot.

Capture evidence **contemporaneously** — at the moment of the action, written to
an artifact path. Evidence reconstructed from memory at the end of a run is not
evidence.

## False PASS — the guards

| Failure | Guard |
|---|---|
| Assumed outcome — acted, narrated success, never re-observed | Re-observe after every action, before any claim |
| Single observation — the read fired before the async render | Poll until the condition holds or a timeout expires; one read is never a verdict |
| Stale frame | Assert on DOM, not pixels; force a repaint before trusting a visual |
| Wrong element matched | Assert on a unique role + accessible name; a multi-match is a FAIL, not "pick the first" |
| Optimistic UI — client shows success, server rejected | Check the network response; re-read after reload |
| Silent application error | Standing console/`pageerror` collectors, asserted empty; scan for 4xx/5xx |
| Dialog auto-dismissed | Handle dialogs explicitly; assert the dialog appeared *and* was handled as the criterion requires |
| Criterion quietly reinterpreted into something easier | Quote the AC verbatim in the result; diff against the frozen list |
| Passed on pre-existing state | Stamp a run-unique token into every entity you create; assert on **that** token |
| Green by weakening the check | Any change to a criterion or an assertion between attempts is a scope change → escalate |
| Unmeasured side effects | Every scenario declares post-conditions, including "nothing else changed" |
| Never actually ran | The negative control (step 3) |

## Points of view

Run scenarios from the stakeholder's view, not the builder's — the same flow
reads differently to a data analyst than to a data engineer. Two or three views
is the useful range. When those views need genuinely independent reports rather
than one pass wearing several hats, hand off to `/multi-persona-review`.

Keep the judge separate from the driver: a fresh subagent that sees the AC text
and the artifacts — **never the driver's narrative**. Same-context self-grading is
where that 30% false-positive rate lives, and the split keeps the driver's context
from filling up.

## Defects — severity yes, priority no

Log each defect with severity (observable impact), evidence paths, and repro
steps. **Severity you may assign; priority you may not** — priority is a business
decision. Propose it, then escalate.

## Judgment

The rails fix the procedure. Yours is the call it cannot make: **whether observed
behavior actually satisfies a criterion's intent**, and whether a failure is a real
defect or an artifact of the harness. When a criterion is ambiguous, say so and
escalate — do not resolve it in the build's favour.

## Bundled files

- `references/browser-evidence.md` — polling vs single reads, actionability
  checks, dialogs, auth/session and test-data isolation, what may be mocked (and
  what never), Playwright traces as an audit bundle.
- `references/uat-report.md` — run-log and defect-record shapes, plus the
  configurable exit thresholds and why they are conventions, not standards.

## Changes

- **0.2.0** — Named `/designing-test-cases` as the producer of the enumerated
  criteria the entry gate demands; the gate had no upstream and refused often.
- **0.1.0** — Initial. Derived from 70 real UAT requests in this user's history
  (the "unit testing sebelum UAT" entry gate, the 3-iteration cap, browser-driven
  execution, per-persona points of view) and cross-checked against ISTQB's
  definitions of acceptance testing, test oracle, entry/exit criteria and
  confirmation testing; Playwright's auto-waiting and web-first assertion
  guidance; and the 2025–2026 agent-honesty literature (AgentRewardBench's ~30%
  judge false-positive rate and 6–14% side-effect precision; "Upward Deceivers" on
  fabricated results and the limited reach of prompt-based mitigation). The
  stale-screenshot rule encodes a measured false regression from an earlier
  session in this workspace.
