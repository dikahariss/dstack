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
    version: 0.4.0
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

## The rule

No fix before a named cause; the phase table below says when each phase is
done.

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

That list is a sample, not exhaustive — any situation that tempts a fix
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

## The order that is not negotiable

No fix before a named cause. Everything below is an exit criterion, not a
sequence — reach it by whatever probe yields evidence (a debugger,
`git bisect`, bisecting the input, boundary logs).

| Phase | Done when | Our specifics |
|---|---|---|
| 1 — Root cause | You can name what is broken and why | Reproduce on demand; check what changed (`git log`, `git diff`, env diff); instrument the boundaries — the layer whose output ≠ its input is the failing one |
| 2 — Pattern | You can point to the difference that matters | Compare against a working example in the same codebase; list the differences before judging which matter |
| 3 — Hypothesis | The cause is confirmed or replaced | 3–5 ranked and falsifiable ("if X, changing Y makes it disappear"); one variable per test; a wrong hypothesis is replaced, never patched over |
| 4 — Fix | Symptom gone, no other test broke, instrumentation removed | Failing test first (`/test-driven-development`); one change; no fix-announcing comment; three failed fixes → Phase 4.5 |
| Memory / perf regression | The regression test is a measurement against a baseline taken before the fix | Baseline first — keep the block below verbatim |

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

## Phase 4.5 — When three fixes have failed

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

- `/test-driven-development` — the failing test in Phase 4 is its red phase.
- `/verifying-before-done` — the method behind Phase 4's done-when.

## Final rule

```
Root cause named → fix is on the table
Otherwise → stay in Phase 1 or raise it with the user
```
