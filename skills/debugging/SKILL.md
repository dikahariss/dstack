---
name: debugging
description: |
  Root-cause investigation discipline. Trace the bug to its source before
  proposing any fix. Use when hitting a test failure, a production bug,
  unexpected behavior, a perf regression, a build break, or any technical
  issue where the cause is not obvious. Use when asked to "debug", "find
  the root cause", "investigate", "debug systematically", or "stop
  guessing".
allowed-tools: Read Bash Grep
metadata:
  dstack:
    version: 0.3.0
    type: semantic
    side_effects: readonly
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - debugging
      - find the root cause
      - debug systematically
      - stop guessing
      - root cause first
---
# /debugging

Root-cause investigation discipline. Find why the system is broken
before proposing how to fix it. Symptom fixes hide causes and ship
regressions.

## The iron law

```
NO FIX WITHOUT ROOT-CAUSE INVESTIGATION FIRST
```

If Phase 1 is not complete, fixes are not on the table. Stating a
fix before naming a cause is guessing, not engineering.

## When to use this skill

Use for any technical issue where the cause is not already obvious:
test failures, production bugs, unexpected behavior, performance
regressions, build failures, integration breaks.

Use the discipline **especially** when:

- Under time pressure (emergencies make guessing tempting).
- A "one quick fix" looks obvious.
- Two or more fixes have already been tried without success.
- The previous fix did not stick.
- The user has not fully described the issue and you are filling
  gaps from imagination.

Do not skip when:

- The bug "seems simple". Simple bugs have root causes too.
- You are in a hurry. Rushing guarantees rework.
- The user wants it fixed now. The systematic loop is faster than
  thrashing.

Both lists are samples, not exhaustive — any situation that tempts a fix
before a cause qualifies.

## Triage by failure shape

Different failure shapes have different first probes. Pick the row
that matches before starting Phase 1 — the right starting probe
saves time. This table is procedural, not exhaustive.

| Failure shape | Tell-tale signal | First probe | Tooling |
|---|---|---|---|
| Intermittent ("flaky") | Same input, different outcome; "passes locally, fails CI" | Loop the repro to raise rate before debugging | `for i in $(seq 1 100); do <test> --runInBand --no-cache \|\| break; done`; pin time + seed + RNG |
| Single-user / single-tenant | One specific input crashes; others fine | Diff the one input against working inputs at every layer | `jq` / `psql` to extract the failing record; compare to a known-good record field by field |
| Environment-only | Works locally, fails in staging/prod | Capture the env diff (vars, versions, locale, TZ) | `env \| diff`; `<runtime> --version`; container image SHA; CI artifact download |
| Multi-component | "It worked yesterday"; multiple services in the chain | Instrument each boundary entry/exit before guessing | See worked example below |
| Memory / perf regression | RSS climbs, latency drifts, no error | Establish baseline before fixing | heap snapshots (`node --inspect` + `chrome://inspect`), `--prof`, flame graphs |
| 3+ fixes failed | Each fix moves the symptom | Stop fixing. Question the architecture. | Phase 4.5 below |

### Worked example — multi-layer boundary instrumentation

When a request crosses CI → build → signer → deploy (or
client → API → service → DB), instrument every boundary **before**
guessing which layer is wrong:

```bash
# Layer 1 — outermost (e.g., workflow / client)
echo "=== L1 inputs: ==="; printenv | grep '^EXPECTED_'

# Layer 2 — build / service
echo "=== L2 received: ==="; env | grep '^EXPECTED_' || echo "(missing)"

# Layer 3 — signer / database call
echo "=== L3 keychain / connection: ==="
security list-keychains   # or: psql -c "SELECT current_user, current_database()"

# Layer 4 — the actual operation that fails
codesign --sign "$IDENTITY" --verbose=4 "$APP"   # or the failing call
```

Run once. Read the output. The first layer where expected ≠ received
is the failing layer. Investigate there.

### Worked example — pin variance before chasing flakes

```bash
# Match CI as closely as possible
TZ=UTC LANG=C jest --runInBand --no-cache --randomize \
  --testPathPattern=<file> -t "<exact test name>"

# Loop until failure (raise the rate from 1% to debuggable)
for i in $(seq 1 100); do
  jest --runInBand --no-cache --testPathPattern=<file> \
    || { echo "FAIL on run $i"; break; }
done

# If still won't repro: add CPU pressure
stress-ng --cpu 4 &  # in another shell
# re-run the loop
```

A 50%-flake bug is debuggable. A 1% flake is not. The probe is to
raise the rate, not to add a retry.

## The four phases

Complete each phase before moving to the next. The phase order is closed by
design — a fix before a named cause is the failure this skill exists to
prevent. The activities inside each phase are a floor, not exhaustive: any
probe that yields evidence (a debugger, `git bisect`, bisecting the input)
counts.

### Phase 1 — Root-cause investigation

1. **Read every error message carefully.** Do not skip past
   warnings. The error is often the answer. Read the full stack
   trace; note line numbers, file paths, error codes.
2. **Reproduce consistently.** Can you trigger it on demand? What
   are the exact steps? Does it happen every time? If not
   reproducible, gather more data before forming a hypothesis.
3. **Check what changed.** `git log --oneline -20` and `git diff`.
   Recent commits, recent dependency bumps, environment
   differences (CI vs local, prod vs staging).
4. **Instrument the boundaries.** For each layer the request
   crosses, log what enters and what leaves. The layer whose output
   does not match its input is the failing layer.

   Generic shape:

   ```
   For each boundary in the failing path:
     log("entered <layer>: input=", <inputs>)
     ... actual work ...
     log("exited <layer>: output=", <outputs>)
   ```

   Run once. Read the evidence. Locate the layer that broke.
5. **Trace the data flow.** When the error is deep in the call
   stack, trace backward. Where did the bad value originate? What
   called this with that value? Keep tracing until you reach the
   source. Fix at the source, not at the symptom.

### Phase 2 — Pattern analysis

1. **Find a working example.** Search the same codebase for code
   that does the analogous thing successfully.
2. **Read the reference end-to-end** if you are implementing a
   known pattern. No skimming.
3. **List every difference** between the working example and the
   broken code. Every difference, no matter how small. Do not pre-
   filter on "that cannot matter".
4. **Understand the dependencies.** What components, settings,
   environment variables, or assumptions does the working pattern
   rely on that the broken code might be missing?

### Phase 3 — Hypothesis and minimal test

1. **Generate 3 to 5 ranked hypotheses, then state the top one in
   writing.** Format: "If X is the cause, then changing Y will make
   the bug disappear (or changing Z will make it worse)." Each
   hypothesis must be **falsifiable** — if you cannot name the
   prediction, the hypothesis is a vibe; sharpen it or discard it.
   Single-hypothesis generation anchors on the first plausible idea
   and is a common debugging anti-pattern.
2. **Test minimally.** The smallest change that would falsify or
   confirm the hypothesis. One variable at a time. Do not stack
   "while I'm here" changes onto the test.
3. **Verify the result before continuing.** If the hypothesis was
   right, move to Phase 4. If it was wrong, form a **new**
   hypothesis. Do not pile another fix on top of the failed one.
4. **Admit uncertainty.** If a step does not make sense, say "I do
   not understand X." Ask the user. Research more. Do not pretend.

### Phase 4 — Implementation

For **memory / perf regressions**, the regression test is
*measurement*, not assertion. Baseline first:

```bash
# Memory leak — Node.js
node --inspect --max-old-space-size=512 <entry>
# Open chrome://inspect, Memory tab, take heap snapshot
# Run the workload, take a second snapshot, diff retained sizes

# Perf regression — capture timing baseline before fix
hyperfine --warmup 3 'before-fix-cmd' --export-json before.json
# After fix:
hyperfine --warmup 3 'after-fix-cmd' --export-json after.json
# Compare medians; flag regressions > 5%
```

For correctness bugs:

1. **Write a failing test that reproduces the issue.** Simplest
   possible test that fails today and will pass once the fix lands.
   Use `/test-driven-development` for the writing discipline.
2. **Apply one fix.** Address the root cause. One change. No
   "while I'm here" refactors. No bundled improvements. The boundary
   instrumentation from Phase 1 step 4 comes out in the same change;
   log lines left behind are narration. No comment announcing the fix
   (`// fix for the null case`, `// bug #123`) — only a genuinely
   non-obvious root cause earns one line recording *why* the code is
   shaped this way, with the issue reference.
3. **Verify.** Use `/verifying-before-done` — run the test, read the
   output, confirm: the new test passes, every existing test still
   passes, the originally reported symptom is gone.
4. **If the fix does not work, stop.** Count attempts. Fewer than
   three: return to Phase 1 with the new information. **Three or
   more: stop and question the architecture** (Phase 4.5).

### Phase 4.5 — When three fixes have failed

This is no longer a failed hypothesis. The architecture itself is
wrong. Signs:

- Each fix reveals a new shared-state or coupling problem
  somewhere else.
- Each fix requires "massive refactoring" to apply cleanly.
- Each fix creates a new symptom in a different layer.

Stop. Surface to the user: "I have tried three fixes; each one
revealed a different symptom. I think the shape of [X] is wrong,
not the implementation of [X]. Should we refactor instead of
patching?" Do not attempt fix number four without that conversation.

## Red flags — stop and return to Phase 1

If you catch yourself thinking any of these — a sample, not exhaustive; any
thought that reaches for a fix before a named cause belongs here:

- "Quick fix for now, investigate later."
- "Just try changing X and see if it works."
- "Multiple changes at once, then run tests."
- "Skip the test, I will manually verify."
- "It is probably X, let me fix that."
- "I do not fully understand but this might work."
- "Pattern says X but I will adapt it differently."
- "Here are the main problems:" — followed by fixes, no
  investigation.
- "One more fix attempt" — after already trying two.

User signals you are doing it wrong — not exhaustive:

- "Is that not happening?" — you assumed without verifying.
- "Will it show us…?" — you should have added evidence gathering.
- "Stop guessing." — you are proposing fixes without understanding.
- "We are stuck?" — your approach is not working; restart Phase 1.

## Rationalizations and reality

Not exhaustive — counter a new excuse the same way: name the reality it dodges.

| Excuse | Reality |
|---|---|
| "Issue is simple, no process needed." | Simple issues have root causes too. The process is fast for simple bugs. |
| "Emergency, no time for process." | Systematic is faster than guess-and-check thrashing. |
| "Just try this first, then investigate." | The first fix sets the pattern. Do it right from the start. |
| "I will write the test after confirming the fix." | Untested fixes do not stick. The test proves the fix is the fix. |
| "Multiple fixes at once saves time." | You cannot isolate which one worked. New bugs sneak in. |
| "Reference is too long, I will adapt the pattern." | Partial understanding guarantees bugs. Read it fully. |
| "I see the problem, let me fix it." | Seeing the symptom is not understanding the cause. |
| "One more fix" after two failures. | Three failures means the architecture is wrong — question it, do not patch it again. |

## Quick reference

| Phase | Activities | Done when |
|---|---|---|
| 1 — Root cause | Read errors, reproduce, check what changed, instrument boundaries, trace data flow | You can name **what** is broken and **why**. |
| 2 — Pattern | Find a working example, compare against reference, list every difference | You can point to the difference that matters. |
| 3 — Hypothesis | State one cause, test minimally, verify | The cause is confirmed, or you have a better hypothesis. |
| 4 — Implementation | Write the failing test, apply one fix, verify | The reported symptom is gone and no other test broke. |

## When investigation finds no root cause

If three thorough phases reveal the issue is truly environmental,
timing-dependent, or external:

1. The process is complete — you did the work.
2. Document what was investigated and what was ruled out.
3. Implement appropriate handling — retry with backoff, explicit
   timeout, user-facing error message.
4. Add logging or telemetry so the next occurrence carries more
   evidence than this one.

Most "no root cause" verdicts are incomplete investigations. Be sure
before declaring it.

## Cross-references

- `/test-driven-development` — Phase 4 step 1 (failing test for the bug) uses the same
  red phase.
- `/verifying-before-done` — Phase 4 step 3 (verify the fix) is the evidence
  gate. Re-run the test, read the output, then claim "fixed".

## Final rule

```
Root cause named → fix is on the table
Otherwise → stay in Phase 1 or raise it with the user
```

## Changes

- **0.3.0** — Phase 4 step 2 now retracts the boundary instrumentation
  and bars comments announcing the fix, keeping only the *why* line a
  non-obvious cause earns. The owner reported generated code arriving
  padded with narration, which reads as machine-written and costs
  credibility at senior level.
- **0.2.1** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.0** — Added the "Triage by failure shape" table mapping
  symptom → first probe → tooling, plus worked examples for
  multi-layer boundary instrumentation and flake reproduction. Phase
  3 step 1 now requires 3 to 5 ranked falsifiable hypotheses. Phase
  4 prefaces memory/perf regressions with measurement-based
  baselining (heap snapshots, hyperfine). Added v2 schema fields:
  `type: semantic`, `side_effects: readonly`, `agency: deliberative`.
  Driven by a v3 Track C benchmark loss on specificity (3/3 cases).
- **0.1.0** — Initial port from v1 skill catalog.
