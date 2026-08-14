---
name: verifying-before-done
description: |
  Evidence-before-claim gate. Before declaring work complete, fixed, or
  passing — run the verification command in this turn, read the output,
  and only then make the claim. Use before committing, before pushing,
  before opening a PR, before saying "done", and after any subagent
  reports success.
allowed-tools: Bash Read
metadata:
  dstack:
    version: 0.5.1
    type: semantic
    side_effects: local
    agency: deliberative
    calibration: deterministic-dominant
    context_budget_tokens: 3500
    triggers:
      - verify
      - prove it
      - before declaring done
      - evidence before claim
---
# /verifying-before-done

Evidence before claim. Before saying work is done, run the
verification command in **this** turn, read the output, and only
then make the claim.

## The iron law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you have not run the verification command in this turn, you
cannot claim it passes. Evidence from an earlier turn is stale —
code may have changed, environment may have shifted, dependencies
may have been re-installed.

Confidence is not evidence.

## When to use this skill

Apply this gate before any of these:

- Any variation of "complete", "done", "fixed", "working", "ready",
  "all set".
- Any expression of satisfaction with the work.
- Any positive statement about the state of the code.
- Committing, pushing, opening a PR, marking a task complete.
- Moving to the next task in the queue.
- Handing work back to the user.

That list is **not exhaustive** — it names the common shapes, not the
set. The rule covers exact phrases, paraphrases, synonyms, and anything
that implies completion or correctness.

## The gate function

Before any claim:

1. **Identify** the command that proves this claim.
2. **Run** the full command (fresh, complete — not a partial subset).
3. **Read** the full output. Check the exit code. Count failures.
4. **Verify** that the output confirms the claim.
   - If it does not: state the actual status with evidence. Do not
     claim done.
   - If it does: state the claim **with** the evidence — name the
     command, the exit code, the pass/fail count.
5. **Only then** make the claim.

Skipping any step is lying, not verifying.

## Claim → required evidence

| Claim | Required evidence | Not sufficient |
|---|---|---|
| Tests pass | Test command output: zero failures, expected count | "Should pass", a previous run, "the file looks right" |
| Linter clean | Linter output: zero errors | Partial check, extrapolation, fewer warnings than before |
| Build succeeds | Build command exit 0 | Linter passing, "logs look fine" |
| Type check clean | `tsc --noEmit` exit 0 | Build worked, IDE shows no red squiggle |
| Bug fixed | Re-run the test that reproduces the bug — passes | Code changed and assumed fixed |
| Regression test works | Red-green-revert-red cycle verified | Test passes once |
| Subagent completed | VCS diff shows the changes you requested | Subagent self-reports "success" |
| Requirements met | Line-by-line checklist against the plan | Tests pass alone |
| User-visible feature works | `/running-uat` evidence: the running app driven and observed passing | A green suite alone — tests say nothing about the screen |

## Default verification gate (use this when no CLAUDE.md rule applies)

If the repo has its own gate (a CLAUDE.md "verification" section, a
`make verify`, a `bun run check`, etc.) use that exact command. When
unsure, the **default gate** is:

```bash
# Numbered gate. Stop at the first non-zero exit.

# 1. Type system
bun run typecheck              # exit 0 = pass

# 2. Test suite
bun test                       # exit 0 = pass; expected pass count visible

# 3. Lint / validator (catalog-specific for dstack)
bun run validate --strict      # exit 0 = pass

# 4. The change-specific check
# e.g., for a refactor: run the test most directly touched
# e.g., for a bug fix: re-run the regression test
bun test path/to/changed.test.ts

# 5. Touches a screen? Product-level evidence: open it, or /running-uat
```

For a refactor touching the auth module specifically, the
change-specific check might be:

```bash
bun test test/integration/auth   # the suite that exercises the refactor
git diff --stat src/auth          # confirm the refactor scope is what was claimed
```

State the exit code of each step in the claim:

> "Verified: typecheck exit 0, bun test 92/92 pass, validate --strict
> exit 0, integration/auth 14/14 pass. Auth refactor complete."

### Honest-claim shape

| Wrong | Right |
|---|---|
| "Looks good, tests should pass." | "bun test: 92/92 pass, exit 0. Done." |
| "I ran the tests." | "bun test path/to/file: 14/14 pass, exit 0. Done." |
| "Everything works." | "typecheck 0, test 92/92, validate --strict 0. Done." |
| "All set." | (run the gate; state the exit codes; then claim) |

## Changes

- **0.5.1** — ADR-0030 list openness: both the trigger list and the red-flag list are open — they name common shapes, not the set.
- **0.5.0** — Reciprocated `/test-driven-development` 0.6.0's product-evidence
  rule: a claim table row and a gate step for user-visible work — a green
  suite alone no longer satisfies "done" for anything with a screen.
- **0.4.0** — Renamed `verification` → `verifying-before-done`. The bare
  noun did not say *when* to reach for it; the gerund encodes the trigger
  moment. The "verify"/"prove it" triggers are kept.
- **0.3.0** — calibration: deterministic-dominant (ADR-0025; discipline
  gate, the rails are the value). Judgment stays bounded: identify the
  command that proves THIS claim — no "research the latest, your call."
- **0.2.0** — Added the default verification gate (numbered bash
  with explicit exit-code checks) and the honest-claim shape table
  contrasting vague vs evidence-grounded claims. Added v2 schema
  fields (`type: semantic`, `side_effects: local`, `agency:
  deliberative`). Driven by a v3 Track C benchmark case-1 loss on
  specificity + groundedness.
- **0.1.0** — Initial port from v1 skill catalog.

## Red flags — stop before claiming

If you catch yourself about to do any of these:

- Use "should", "probably", or "seems to" about the outcome.
- Type "Great!", "Perfect!", "Done!" before running anything.
- Commit, push, or open a PR without running verification.
- Trust a subagent's success message without checking the diff.
- Rely on partial verification (one file, only the exit code).
- Think "just this once".
- Feel tired and want the work to be over.

Each of these means: stop. Run the command. Then claim. The list is a
sample of the feeling, not a checklist to match against — any impulse to
claim before evidence belongs here.

## Common excuses, defused

| Excuse | Reply |
|---|---|
| "Should work now." | Run the verification. |
| "I am confident." | Confidence is not evidence. |
| "Just this once." | No exceptions. |
| "Linter passed." | The linter does not run the compiler or the tests. |
| "The subagent said success." | Verify independently against the diff. |
| "I am tired." | Exhaustion is not a reason to skip. |
| "Partial check is enough." | Partial proves nothing about the rest. |
| "Different words so the rule does not apply." | Spirit over letter. |

## Key patterns

**Tests.**

```
Run the test command. Read the output: "34 passed, 0 failed."
Claim: "All tests pass — 34 passed, 0 failed (bun test)."

Not: "Should pass now." Not: "Looks correct."
```

**Regression test (red-green-revert discipline — same as `/test-driven-development`).**

```
Write the test → run it → fails for the right reason.
Apply the fix → run again → passes.
Revert the fix → run again → MUST FAIL.
Restore the fix → run again → passes.
Only now: "Regression test verified."

Not: "I wrote a regression test."
```

**Build.**

```
Run the full build. Read the exit code. "Build passes, exit 0."

Not: "Linter passed." (The linter does not compile.)
```

**Requirements.**

```
Re-read the plan or task description.
Make a line-by-line checklist against it.
Tick each line only after observing the evidence.
Report what is done, what is not, what is deferred.

Not: "Tests pass, phase complete."
```

**Subagent delegation.**

```
The subagent reports success.
Run `git diff` (or check the VCS state).
Verify the changes match what was requested.
Report the actual state to the user.

Not: trust the subagent's self-report.
```

## Response templates

**All claims verified:**

```
Done — ran <command> (exit 0). <Specific evidence: 34/34 tests
passed, build artifact at X, diff at file:line>.
```

**Partial completion:**

```
Items 1, 2, 4 done — ran <command>, output confirms.
Item 3 not done because <reason>. Item 5 deferred — see
<follow-up>.
```

**Cannot verify in this environment:**

```
Cannot verify <claim> here because <reason>. The check that would
verify it is <command>. Want me to run it, or accept the
limitation?
```

## Cross-references

- `/test-driven-development` — the green-verification step is the same gate. Re-run
  the test, do not say "should pass now".
- `/debugging` — Phase 4 step 3 ("verify the fix") is this gate.
- `/responding-to-review` — when applying review fixes, each implemented
  item is gated by running the test, not by "fixed".

## Bottom line

Run the command. Read the output. **Then** claim the result.

Non-negotiable.
