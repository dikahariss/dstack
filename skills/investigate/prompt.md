# /investigate

Root-cause investigation discipline. Find why the system is broken
before proposing how to fix it.

> Adapted from `superpowers/systematic-debugging`. dstack today is
> advisory — the user enforces the four-phase order. There is no
> hook that blocks a fix attempt before Phase 1 is complete.

## The iron law

```
NO FIX WITHOUT ROOT-CAUSE INVESTIGATION FIRST
```

A symptom fix that hides the cause is a regression waiting to happen.
If Phase 1 is incomplete, fixes are not on the table.

## When to use this skill

Use for any technical issue: test failures, production bugs, unexpected
behavior, performance regressions, build failures, integration breaks.

Use the discipline **especially** when:

- Under time pressure (emergencies make guessing tempting).
- A "one quick fix" looks obvious.
- Two or more fixes have already been tried without success.
- The previous fix did not stick.
- The user has not fully described the issue and you are filling gaps.

Do not skip when:

- The bug "seems simple" (simple bugs have root causes too).
- You are in a hurry (rushing guarantees rework).
- The user wants it fixed now (the systematic loop is faster than
  thrashing).

## The four phases

Complete each phase before moving to the next.

### Phase 1 — Root-cause investigation

1. **Read every error message carefully.** Do not skip past warnings.
   The error is often the answer. Read full stack traces; note line
   numbers, file paths, error codes.
2. **Reproduce consistently.** Can you trigger the issue on demand?
   What are the exact steps? Does it happen every time? If not
   reproducible, gather more data instead of guessing.
3. **Check what changed.** Recent commits, recent dependency bumps,
   environment differences. `git log --oneline -20` and `git diff`
   are the first move.
4. **Instrument boundaries in multi-component systems.** For each
   layer the request crosses (CI → build, API → service → DB), log
   what enters and what leaves. Run once and read the evidence. The
   layer whose output does not match its input is the failing layer.
5. **Trace the data flow.** When the error is deep in the call
   stack, trace backward: where did the bad value originate? What
   called this function with that bad value? Keep tracing up until
   you reach the source. Fix at source, not at symptom.

### Phase 2 — Pattern analysis

1. **Find working examples.** Search the same codebase for code that
   does the analogous thing successfully.
2. **Compare against references.** If you are implementing a known
   pattern, read the reference end-to-end. No skimming.
3. **List every difference** between the working example and the
   broken code. Every difference, no matter how small. Do not
   pre-filter on "that cannot matter."
4. **Understand the dependencies.** What other components, settings,
   environment variables, or assumptions does the working pattern
   rely on?

### Phase 3 — Hypothesis and minimal test

1. **State a single hypothesis** in writing: "I think X is the root
   cause because Y." Be specific.
2. **Test minimally.** The smallest change that would falsify or
   confirm the hypothesis. One variable at a time. Do not stack
   "while I'm here" changes on top of the test.
3. **Verify the result before continuing.** If the hypothesis was
   right, move to Phase 4. If it was wrong, form a new hypothesis
   — do not add another fix on top of the failed one.
4. **Admit uncertainty.** If a step does not make sense, say "I do
   not understand X." Ask the user. Research more. Do not pretend.

### Phase 4 — Implementation

1. **Write a failing test that reproduces the issue.** Simplest
   possible test that fails today and will pass once the fix lands.
   Reuse `/tdd` for the writing discipline.
2. **Apply one fix.** Address the root cause. One change. No
   "while I'm here" refactors.
3. **Verify.** The new test passes; existing tests still pass; the
   originally reported symptom is gone.
4. **If the fix does not work, stop.** Count attempts. If you have
   tried fewer than three fixes, return to Phase 1 with the new
   information. **If you have tried three or more, stop and
   question the architecture** — see below.

### Phase 4.5 — When three fixes have failed

This is no longer a failed hypothesis. The architecture itself is
wrong. Signs:

- Each fix reveals a new shared-state or coupling problem somewhere
  else.
- Each fix requires "massive refactoring" to apply cleanly.
- Each fix creates a new symptom in a different layer.

Stop. Surface this to the user. Ask whether to refactor the
fundamental shape rather than continue patching. Do not attempt fix
number four without that conversation.

## Red flags — stop and return to Phase 1

If you catch yourself thinking any of these, stop:

- "Quick fix for now, investigate later."
- "Just try changing X and see if it works."
- "Multiple changes at once, then run tests."
- "Skip the test, I will manually verify."
- "It is probably X, let me fix that."
- "I do not fully understand but this might work."
- "Pattern says X but I will adapt it differently."
- "Here are the main problems:" — followed by fixes without
  investigation.
- "One more fix attempt" — after already trying two.

User signals you are doing it wrong:

- "Is that not happening?" — you assumed without verifying.
- "Will it show us…?" — you should have added evidence gathering.
- "Stop guessing." — you are proposing fixes without understanding.
- "We are stuck?" — your approach is not working; restart Phase 1.

## Rationalizations and reality

| Excuse | Reality |
|---|---|
| "Issue is simple, no need for process." | Simple issues have root causes too. The process is fast for simple bugs. |
| "Emergency, no time for process." | Systematic is faster than guess-and-check thrashing. |
| "Just try this first, then investigate." | The first fix sets the pattern. Do it right from the start. |
| "I will write the test after confirming the fix works." | Untested fixes do not stick. The test proves the fix is the fix. |
| "Multiple fixes at once saves time." | You cannot isolate what worked. New bugs appear. |
| "Reference is too long, I will adapt the pattern." | Partial understanding guarantees bugs. Read it fully. |
| "I see the problem, let me fix it." | Seeing symptoms is not understanding the cause. |
| "One more fix attempt" after two failures. | Three failures means the architecture is wrong — question it, do not patch it again. |

## Quick reference

| Phase | Activities | Done when |
|---|---|---|
| 1 — Root cause | Read errors, reproduce, check what changed, instrument boundaries, trace data flow | You know **what** is broken and **why**. |
| 2 — Pattern | Find a working example, compare against reference, list every difference | You can name the difference that matters. |
| 3 — Hypothesis | State one cause, test minimally, verify | The cause is confirmed or replaced by a better hypothesis. |
| 4 — Implementation | Write the failing test, apply one fix, verify | The reported symptom is gone and no other test broke. |

## When the investigation finds no root cause

If three thorough phases reveal the issue is truly environmental,
timing-dependent, or external:

1. The process is complete — you did the work.
2. Document what was investigated and what was ruled out.
3. Implement appropriate handling (retry with backoff, explicit
   timeout, user-facing error message).
4. Add logging or telemetry so the next occurrence carries more
   evidence.

Most "no root cause" verdicts are incomplete investigations. Be sure
before declaring it.
