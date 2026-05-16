# /verification

Evidence before claim. Before saying work is done, run the verification
command, read the output, and only then make the claim.

> Adapted from `superpowers/verification-before-completion`. dstack is
> advisory — there is no hook that intercepts an unverified "done."
> The skill text reminds; the user enforces.

## Core principle

Claiming work is complete without running the verification command is
not efficient, it is dishonest. Confidence is not evidence.

## The iron law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you have not run the verification command in this turn, you cannot
claim it passes. Evidence from an earlier turn is stale — the code
may have changed, the environment may have shifted.

## The gate function

Before any success claim or expression of satisfaction:

1. **Identify** the command that proves this claim.
2. **Run** the full command (fresh, complete — not a partial subset).
3. **Read** the full output. Check exit code. Count failures.
4. **Verify** that the output confirms the claim.
   - If it does not, state the actual status with evidence.
   - If it does, state the claim **with** the evidence.
5. **Only then** make the claim.

Skipping any step is lying, not verifying.

## Common claim → required evidence

| Claim | Required evidence | Not sufficient |
|---|---|---|
| Tests pass | Test command output: zero failures, expected count | "Should pass", a previous run |
| Linter clean | Linter output: zero errors | Partial check, extrapolation |
| Build succeeds | Build command exit 0 | Linter passing, logs that "look fine" |
| Bug fixed | Re-run the test that reproduces the bug — passes | Code changed and assumed fixed |
| Regression test works | Red-green-revert-red cycle verified | Test passes once |
| Subagent completed | VCS diff shows the changes | Subagent self-reports "success" |
| Requirements met | Line-by-line checklist against the plan | Tests pass alone |

## Red flags — stop before claiming

Catch yourself if you are about to:

- Use "should", "probably", or "seems to" to describe outcome.
- Express satisfaction before verification ("Great!", "Perfect!",
  "Done!").
- Commit, push, or open a PR without running verification.
- Trust a subagent's success message without checking the diff.
- Rely on partial verification (only ran one file, only checked
  exit code).
- Think "just this once."
- Feel tired and want the work to be over.
- Use any wording that implies success without having run the
  verification.

## Rationalization → reality

| Excuse | Reality |
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

**Tests:**

```
Run the test command. Read the output: "34 passed, 0 failed."
Then: "All tests pass — 34 passed, 0 failed."

Not: "Should pass now." Not: "Looks correct."
```

**Regression tests (red-green discipline):**

```
Write the test → run it → it fails for the right reason →
apply the fix → run again → it passes → revert the fix → run
again → MUST FAIL → restore the fix → run again → passes.
Only then: "Regression test verified."

Not: "I wrote a regression test."
```

**Build:**

```
Run the full build. Read the exit code. "Build passes, exit 0."

Not: "Linter passed." (The linter does not compile.)
```

**Requirements:**

```
Re-read the plan or task description.
Create a line-by-line checklist against it.
Verify each item.
Report what is done and what is not.

Not: "Tests pass, phase complete."
```

**Subagent delegation:**

```
The subagent reports success.
Run `git diff` (or check the VCS state).
Verify the changes match what was requested.
Report the actual state to the user.

Not: trust the subagent's self-report.
```

## When this gate applies

Apply before any of these:

- Any variation of "complete", "done", "fixed", "working", "ready".
- Any expression of satisfaction with the work.
- Any positive statement about the state of the code.
- Committing, opening a PR, marking a task complete.
- Moving to the next task in the queue.
- Handing work back to the user.

The rule covers exact phrases, paraphrases, synonyms, and anything
that implies completion or correctness.

## Bottom line

Run the command. Read the output. **Then** claim the result. Non-
negotiable.
