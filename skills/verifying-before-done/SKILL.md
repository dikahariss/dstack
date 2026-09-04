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
    version: 0.6.2
    type: semantic
    side_effects: local
    agency: deliberative
    calibration: judgment-dominant
    context_budget_tokens: 3500
    triggers:
      - verify
      - prove it
      - before declaring done
      - evidence before claim
      - a subagent said it worked
---
# /verifying-before-done

Evidence before claim. Before saying work is done, run the command that
proves it **in this turn**, read the output, then claim.

Confidence is not evidence. Evidence from an earlier turn is stale — the
code, the environment, or the dependencies may have moved since.

## Where the judgment is

Deciding **which command actually proves this claim** is the whole skill.
A passing unit suite does not prove a screen renders; a clean typecheck
does not prove a migration is reversible; `git status` clean does not
prove the change landed on the right branch. Pick the command that would
*fail* if the claim were false, and run that one.

## The gate

1. Name the command that proves the claim.
2. Run it, complete — not a subset.
3. Read the output. Check the exit code. Count the failures.
4. Claim only what the output supports, **with** the evidence: the
   command, the exit code, the counts.

If the output does not support the claim, state the real status instead.
That is a finished task, not a failed one.

## After a subagent reports success

This is the case the surrounding harness does **not** cover, and the
reason this skill still exists. A harness rule tells you to report *your
own* outcomes faithfully. It says nothing about a subagent's report.

A subagent's success message is a claim, not evidence. Re-run its
verification yourself, or read the artifact it says it produced. Measured
2026-08-14: a subagent correctly reported the test suite was green on this
machine and red on CI — believing either half without checking would have
been wrong practice, and the half that was right was right by luck of
which machine it ran on.

## Default gate when the repo names none

Use the repo's own gate if it has one — a CLAUDE.md verification section,
`make verify`, `bun run check`. Otherwise, in order, stopping at the first
non-zero exit:

```bash
bun run typecheck                 # exit 0
bun test                          # exit 0, pass count visible
bun run validate --strict         # exit 0
bun test path/to/changed.test.ts  # the check specific to THIS change
```

A screen was touched? A green suite is not evidence it renders. Open it,
or run `/running-uat`.

These four steps are **not exhaustive** — they are the floor for a
TypeScript/Bun repo. A change to infrastructure, data, or a published
contract needs its own proving command, and naming it is the judgment
above.

## Honest-claim shape

The pattern, not the set — every claim gets the same treatment: command,
exit code, counts.

| Wrong | Right |
|---|---|
| "Looks good, tests should pass." | "bun test: 92/92 pass, exit 0. Done." |
| "I ran the tests." | "bun test path/to/file: 14/14 pass, exit 0. Done." |
| "Everything works." | "typecheck 0, test 92/92, validate --strict 0. Done." |
| "The subagent said it's fixed." | "Re-ran its command myself: 14/14, exit 0." |

## Cross-references

- `/test-driven-development` — decides what test the change owed in the
  first place.
- `/running-uat` — product-level evidence for anything with a screen.
- `/finishing-development-branch` — runs this gate before integrating.
