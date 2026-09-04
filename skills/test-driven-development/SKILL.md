---
name: test-driven-development
description: |
  Decides how much test discipline a change has earned, then applies it.
  Not every change: the full red-green-refactor cycle is mandatory only
  inside six risk tiers (money, authz/tenancy, data loss, computational
  core, bug fixes, consumed contracts); everywhere else it freezes the
  case list first, implements, then tests from that list. Also carries
  the rule that a green suite is not evidence the product works. Use when
  implementing a feature, fixing a bug, or refactoring with behavior
  change, and when asked to "do TDD", "test-first", "red-green-refactor",
  "write the test first", or "does this need TDD".
allowed-tools: Read Write Edit Bash
metadata:
  dstack:
    version: 0.9.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
    triggers:
      - tdd
      - test first
      - red green refactor
      - write the test first
      - does this need tdd
      - risk tier
      - tests after the code
---
# /test-driven-development

How much test discipline this change has earned — then that discipline,
applied.

## The law, and where it applies

No production code before a failing test inside a tier; outside a tier the
case list is frozen first — the tier decides how much of what follows applies.

The cycle is the most expensive discipline in this catalog and its cost is not
repaid evenly. Spend it where a defect is expensive to find late; buy the
cheaper guarantee everywhere else.

**Name the tier before writing anything.** One line, out loud: *"Tier: money —
running the full cycle"* or *"No tier — implementing first, tests from the
frozen list after."* There is no default: notice code exists with no tier
named, stop and answer the question now — inside applies retroactively
(pre-test code gets deleted); outside requires the case list to have preceded
the code, or rebuild it from the spec.

Inside a tier the law is absolute: production code written before its test gets
**deleted** — not kept as reference, not "adapted" while the test is written.

## Is this change inside a risk tier?

One yes puts it inside. These six are **closed by design** — other skills name
tasks by tier, so the set is a contract. Widen a tier by ADR; never invent one.

| Tier | Why the cycle earns its cost here |
|---|---|
| **Money** — pricing, billing, quotas, balances, refunds | An error moves real value, and reconciliation is manual |
| **Authentication, authorization, tenancy** — roles, permissions, sessions, cross-tenant isolation | A leak has no rollback; the data is already disclosed |
| **Data loss or corruption** — migrations, destructive updates, merges, dedup | The failure is discovered after the old value is gone |
| **Computational core** — algorithms, parsers, state machines, date/timezone/money maths, retry and idempotency | Correctness is defined by cases, not by looking at a screen |
| **A bug being fixed** — any area, no exceptions | The reproducing test *is* the bug report — automated whenever a test can express the failure; a purely visual defect reproduces as a `/running-uat` scenario watched failing before the fix. Skip the watched red and you have not proven the cause — only that the symptom stopped |
| **A contract others consume** — published API, event schema, library export | Silent breakage lands in someone else's system |

**Outside** — for example UI layout, styling and copy; wiring and glue;
scaffolding. A bug in any of these areas is still inside — see the bug row.

**No durable behavior** — throwaway prototypes and exploratory spikes deleted
this session, generated code, configuration with no executable behavior: no
case list, no tests; declare it in one line, like the tier. The outside path
is for changes whose behavior survives the session.

A behavior-preserving refactor is neither path: the existing suite must be
green before and after, and no test changes what it asserts in the same
commit. The tier question applies to changes that add or alter behavior.

Borderline? Ask what it costs to learn of the defect a week late. Cheap → outside.

## Outside a tier — the cheap path

Order changes, the derivation rule does not.

1. **Freeze the cases first — where they can be seen.** Before the first
   implementation edit, write the situations this change must handle **and
   each one's expected outcome** into the conversation or the plan file —
   `/designing-test-cases` if the set is non-trivial. A list first seen after
   the code is not frozen. Minutes, not hours.
2. **Implement.**
3. **Write the tests from the frozen list** — never by reading back the code you
   just wrote. Every row is covered or explicitly dropped with a reason. Rows
   may be *added* during implementation — marked code-derived, so the
   spec-derived core stays identifiable; a frozen row is never deleted or
   reworded.
4. **Verify the product, not just the suite** — see the next section.

Why this order is safe here but the derivation rule is not negotiable: tests
generated with the finished (faulty) code in context caught **14% of faults
versus 25%** for independently derived tests — faults propagate from the code
into the assertions ([arXiv 2607.05139](https://arxiv.org/pdf/2607.05139)).
Freezing cases *and expected outcomes* before implementing removes that bias
channel; that this recovers most of test-first's value at lower cost is the
catalog's bet, not the paper's measurement.

## Green tests are not a working product

The most expensive failure this skill can produce is a confident report of a
green suite for a product that does not work. Unit tests exercise the units you
thought of; they say nothing about whether the screen renders, the flow
completes, or the thing is usable.

```
"All tests pass" answers a question nobody asked.
Show the product doing the thing.
```

Before reporting done, produce evidence at the level the change lives at: a
user-visible **feature or flow** needs `/running-uat`; a cosmetic change needs
the changed screen opened and looked at — screenshot, not the full protocol;
an API change needs the request and its real response; a job needs the run
and its output. A green suite is a precondition for that evidence, never a
substitute.

The research backs the negative half. The controlled result is same-model
suppression: discouraging test writing cut input tokens **33–49%** for a
**1.8–2.6 point** resolution loss ([arXiv 2602.07900](https://arxiv.org/html/2602.07900v2));
across models, the heaviest test-writer (74.4%, tests in ~83% of tasks) and a
near-zero writer (71.8%, 0.6%) land close. Treating tests as a **regression
asset for the user** — not a device that makes the agent solve the task — is
this catalog's policy for where to spend them, not the paper's claim.

## The honest-test diagnostic

Inside a tier, two questions: did the test exist before the source change,
and did it fail on its first run? Two noes means the source guided the test —
delete the source and redo the cycle from a degenerate red test (`return 0`).
Outside a tier the diagnostic is one question: did the case list precede the
code?

## Inside a tier: the cycle, with our three rules

Run red → green → refactor one behavior at a time. Red must fail for the
right reason — a first run that passes means you are testing existing
behavior; one that errors means fix the error first. Green is the minimal
code, comments included: density inherited from the file, never introduced;
a *why* the code cannot show is the only comment that earns its place.
Green's runner output is pristine — no warnings, no stray errors. Mocks only
when the alternative is impossible (network, time, randomness).

## Cover more than the happy path

A test written after looking at your own implementation inherits its blind
spots — you test the branches you remember writing. **Derive the cases from the
contract** (what the behavior promises), not from the code. That is what makes
the set unbiased.

Walk all four rows before calling a behavior covered. The four classes are
closed by design — **Done means** walks them — while every *Typical cases*
cell is a sample, not exhaustive:

| Class | Ask | Typical cases |
|---|---|---|
| **Happy path** | What is it for? | the documented, expected input |
| **Edge / boundary** | Where does behavior change? | empty, zero, one, max, off-by-one, very large, unicode/multi-byte, duplicate, unsorted, negative |
| **Invalid / error** | What must it refuse? | null or missing field, wrong type, malformed, unauthorized, out of range — assert the *specific* error, not merely that it threw |
| **Chaos / failure injection** | What breaks around it? | dependency down or slow, timeout, retry exhausted, partial write, duplicate or out-of-order delivery, concurrent callers, cancellation mid-flight |

Chaos cases are the most-skipped and the most expensive in production: code
that only ever ran against a healthy dependency is untested against the case
that will page you. Inject the failure on purpose — make the fake throw, hang,
return a partial result, or answer twice.

**Bias check before moving on:** could this test set pass against an
implementation you know is wrong? If yes, a case is missing.

## Red flags — stop and restart the cycle

Neither list below is exhaustive — any rationalization with the same effect
counts. The excuse-vs-reality table lives in
`references/runners-and-example.md`; none of it survives the tier table above.

**Inside a tier**, any of these means: revert the production code, write the
test first, start the cycle over.

- Code was written before the test.
- A test was added after the implementation.
- A test passes the first time you run it.
- You cannot explain why the test failed.
- You are thinking "tests can come later".
- You are rationalizing "just this once".
- You are keeping pre-test code "as reference" or "to adapt".

**Outside a tier**, the cycle is not the thing to protect — the derivation is.
Stop and redo the case list if any of these is true:

- The cases were read off the finished implementation instead of the spec.
- No list existed before implementation started.
- A row from the frozen list is uncovered and nobody said why.
- The tier was never named, so "outside" was assumed rather than decided.
- "All tests pass" is about to be reported as if it meant the feature works.

## Running the test, and a worked cycle

Stack-by-stack runner commands (Bun, npm, Angular, .NET, Python, Go, Rust,
PHP), a full red → green → refactor walkthrough of a bug fix, and the
when-stuck table live in `references/runners-and-example.md`. Read the repo's
own runner first — `package.json` scripts, `*.csproj`, `pyproject.toml`, a
Makefile — never assume the stack.

## Done means

- The tier was named before implementation started.
- The frozen case list predates the first implementation edit; code-derived
  additions are marked; a wrong implementation would fail this set.
- All four classes walked, or a stated reason a class does not apply.
- The diff carries no narration comment, commented-out code, or unowned TODO.
- Inside a tier: each test was watched failing for the expected reason
  before its production code existed.

The completion claim itself carries the command, exit code and output from
this turn; `/verifying-before-done` is the method.

## Cross-references

- `/designing-test-cases` — where the frozen case set comes from. **Both paths
  need it**, and it is the step that carries the value: inside a tier it feeds
  the cycle one row at a time (a directory of simultaneously-red tests is not
  this cycle); outside one it is the list the tests-after must be derived from.
- `/running-uat` — the product-level evidence a green suite does not provide.
  Mandatory before reporting a user-visible feature done.
- `/verifying-before-done` — the method behind the completion claim.
- `/debugging` — when fixing a bug, the failing-test step is the
  same red phase. A bug fix is always inside a tier.

## Final rule

```
Tier named → inside:  a test exists AND was watched to fail
             outside: the case list existed BEFORE the code
Either way → the product was shown working, not just the suite
```

## Bundled files

- `references/runners-and-example.md` — runners, worked cycle, excuse table,
  when-stuck table.
