# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

```
Agent tool (general-purpose):
  description: "Review spec compliance for Task N"
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## Spec rows this task covers

    [The same spec text the implementer received: every ID in the task's
    `Covers:` line and any decision, contract, or schema row it touches — or
    "none"]

    ## What Implementer Claims They Built

    [From implementer's report]

    ## Verify against the code

    The implementer's report is a claim, not evidence. Read the diff and compare
    it to the task text and those spec rows line by line. A difference from a spec
    row is reported even where the task text allowed it. Report what is missing and what was added
    that the task did not ask for, each with `file:line`.

    ## Your Job

    Read the implementation code and verify:

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?
    - Did they add "nice to haves" that weren't in spec?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]
```
