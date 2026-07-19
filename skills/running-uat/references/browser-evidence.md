# Browser evidence — mechanics behind the PASS rules

Everything here exists because a browser lies to you in specific, repeatable
ways. Sources are named so a future reader can re-check them.

## 1. Every agent observation is non-retrying

Playwright draws the line explicitly: `expect(locator).toBeVisible()` **polls**
until the condition holds or the timeout expires (default 5s), while
`await locator.isVisible()` returns a boolean for the DOM **at that instant**.
Its own best-practices page says not to write `expect(await el.isVisible())`
because "using non-retrying assertions can lead to a flaky test."

An agent driving a browser through a tool API has *only* the instantaneous form.
Every `read_page`, `get_page_text`, screenshot, or `javascript_tool` call is a
single sample. So the retry has to be yours:

```
read → condition met?  → yes: record evidence
                       → no : wait ~250–500ms, read again
                              (cap total wait; on expiry record FAIL, not "probably fine")
```

A read that is 200 ms early is a false FAIL. A read against a view that has not
yet re-rendered is a false PASS. Both are the same bug: judging from one sample.

## 2. What "the element is ready" actually means

Before acting, Playwright checks up to five things — a useful checklist even when
you are not using Playwright:

| Check | Meaning | Trap |
|---|---|---|
| Visible | non-empty bounding box, not `visibility:hidden` | **`opacity:0` passes** — invisible to a human, "visible" to the check |
| Stable | same bounding box for two consecutive animation frames | a mid-animation observation is a transient, not a state |
| Enabled | not `disabled`, not `aria-disabled` | — |
| Editable | enabled and not `readonly` | — |
| Receives events | the element is the hit target at that point | an overlay or modal silently eats the click |

`force: true` disables these checks — which is exactly how a click "succeeds"
while landing on an overlay. Do not use it to make a scenario go green.

The **stable** check is the formal answer to the stale-screenshot problem: a
frame captured mid-animation, or from a throttled background tab, does not
represent settled state.

## 3. Locators: ambiguity is a silent false PASS

Prefer, in order: role → text → label → placeholder → alt → title → test-id.
Role-based locators match how users and assistive technology perceive the page;
CSS/XPath break as the DOM shifts.

Treat a multi-match as a **FAIL**, not something to resolve with `.first()`. An
assertion satisfied by the *wrong* Submit button reports PASS and tells you
nothing.

## 4. Dialogs block everything

Native `alert` / `confirm` / `prompt` are modal: they block page execution until
handled. Playwright auto-dismisses them by default — which quietly turns an
"accept" the criterion required into a "dismiss," and the run diverges without
error. In a Claude-in-Chrome session an unhandled dialog freezes the automation
entirely, and Anthropic's own troubleshooting lists it as the first thing to
check when the browser stops responding.

Rules: register the handler per scenario; assert both that the dialog appeared
and that it was handled the way the criterion specifies; avoid triggering dialogs
you did not plan for. `beforeunload` on a dirty form is the same class of trap.

## 5. Auth, session, and data isolation

Each scenario should be independent — its own storage, cookies, and data.
Shared state produces cascading failures that look like real defects.

- **Auth**: authenticate once in a setup step and reuse the stored state rather
  than logging in per scenario. That file holds live session cookies — never
  commit it.
- **Ambient sessions are a reproducibility hazard.** Claude-in-Chrome uses your
  real browser's login state, which is convenient and means the run depends on
  something not recorded in the setup. Note it in the report.
- **Mutating scenarios need their own account or their own record**, or they race
  each other.
- **Run-unique token**: stamp a timestamp or UUID into every entity you create
  and assert on *that*. It is the only cheap defence against passing on leftover
  data from a previous run.

## 6. What may be mocked

| Target | Allowed? |
|---|---|
| Clock (freeze/advance time) | **Yes** — usually necessary, and makes visual comparison deterministic |
| Genuine third-party services outside the acceptance boundary | Yes, if declared in the report |
| The system under acceptance (its own API/backend) | **No.** The acceptance question is whether the integrated system satisfies the need; a stubbed backend answers a different question |

Declare every interception in the report. Guidance here is thin in the
literature — this is a defensible position, not a citation.

## 7. Audit trail

Capture per step: timestamp, action, target (role + accessible name), the
observation, and the artifact path. Write it **as it happens** — evidence
reconstructed from context at the end of the run is the exact failure mode this
guards against.

If the repo has Playwright, its **trace** is the closest thing to a ready-made
UAT evidence bundle: DOM snapshots, action log, network, console, and a
screenshot film strip in one file (`trace: 'on-first-retry'`, or
`retain-on-failure`). Otherwise keep a directory per run with the log plus
numbered artifacts.

## Sources

ISTQB Glossary (test oracle, entry/exit criteria, confirmation testing) ·
Playwright docs: Assertions, Auto-waiting/Actionability, Locators, Dialogs,
Authentication, Mock APIs, Trace Viewer, Best Practices · Anthropic, *Use Claude
Code with Chrome* and *Best practices for computer and browser use* ·
*An Empirical Analysis of UI-based Flaky Tests* (arXiv 2103.02669) · Luo et al.,
*An empirical analysis of flaky tests* (FSE 2014).
