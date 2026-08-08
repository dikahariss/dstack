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
    version: 0.7.0
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

## The iron law — and where it applies

```
INSIDE A RISK TIER:  NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
OUTSIDE ONE:         TESTS STILL COME FROM THE SPEC — JUST NOT FIRST
```

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

One yes puts it inside.

| Tier | Why the cycle earns its cost here |
|---|---|
| **Money** — pricing, billing, quotas, balances, refunds | An error moves real value, and reconciliation is manual |
| **Authentication, authorization, tenancy** — roles, permissions, sessions, cross-tenant isolation | A leak has no rollback; the data is already disclosed |
| **Data loss or corruption** — migrations, destructive updates, merges, dedup | The failure is discovered after the old value is gone |
| **Computational core** — algorithms, parsers, state machines, date/timezone/money maths, retry and idempotency | Correctness is defined by cases, not by looking at a screen |
| **A bug being fixed** — any area, no exceptions | The reproducing test *is* the bug report — automated whenever a test can express the failure; a purely visual defect reproduces as a `/running-uat` scenario watched failing before the fix. Skip the watched red and you have not proven the cause — only that the symptom stopped |
| **A contract others consume** — published API, event schema, library export | Silent breakage lands in someone else's system |

**Outside** — UI layout, styling and copy; wiring and glue; scaffolding. A
bug in any of these areas is still inside — see the bug row.

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
and its output. `/verifying-before-done` is the gate. A green suite is a
precondition for that evidence, never a substitute.

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

## The cycle: red → green → refactor

1. **RED — write one failing test.** One behavior. Clear name.
   Exercises the real code path (no mocks unless unavoidable).
2. **Verify red.** Run the test. It must fail for the right reason
   — the feature is missing, not because of a typo. If the test
   passes, you are testing existing behavior; fix the test. If it
   errors, fix the error first.
3. **GREEN — minimal code.** Write the simplest code that makes the
   test pass. Do not add features, do not refactor adjacent code,
   do not "improve" anything beyond the test's reach.
4. **Verify green.** Run the test. It passes, every other test
   still passes, output is pristine — no warnings, no stray errors.
   This is the same evidence gate `/verifying-before-done` enforces.
5. **REFACTOR — clean up.** Remove duplication, rename for clarity,
   extract helpers. Keep tests green. Do not add behavior.
6. **Next.** Pick the next failing test. Repeat.

## What a good test looks like

- **Minimal** — one behavior per test. If the test name needs the
  word "and", split it.
- **Clear** — the name describes the behavior, not a number
  (`rejects_empty_email`, not `test1`).
- **Real code** — exercises the actual production code path. Use
  mocks only when the alternative is impossible (external network,
  time, randomness).


Worked Good/Bad examples live in `references/runners-and-example.md`.

## Cover more than the happy path

A test written after looking at your own implementation inherits its blind
spots — you test the branches you remember writing. **Derive the cases from the
contract** (what the behavior promises), not from the code. That is what makes
the set unbiased.

Walk all four rows before calling a behavior covered:

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

## Why order matters — inside a tier

The excuse-vs-reality table ("I'll write tests after to verify", "I already
manually tested it", sunk cost) lives in `references/runners-and-example.md`.
None of them survives the tier table above.

## Red flags — stop and restart the cycle

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

## Verification checklist before declaring done

Every change, whichever path it took:

- [ ] The tier was named before implementation started — there is no default.
- [ ] The frozen list can be pointed to and predates the first implementation
      edit; code-derived additions are marked. A wrong implementation would
      fail this set.
- [ ] All four classes walked: happy path, edge/boundary, invalid/error,
      and at least one **chaos** case (dependency failure, timeout,
      duplicate or concurrent call) — or a stated reason none applies.
- [ ] All tests pass, and the runner output is pristine — no warnings,
      no unrelated errors.
- [ ] **Evidence of the product working** — feature/flow → `/running-uat`;
      cosmetic → the changed screen looked at; never merely a green suite.

Inside a tier, additionally:

- [ ] Every new function or method has at least one test.
- [ ] Each test was watched as it failed before any production code was
      written — for a purely visual bug, its `/running-uat` scenario watched
      failing.
- [ ] Each test failed for the expected reason (feature missing,
      not a typo).
- [ ] Production code is the minimal code that makes the test pass.

Cannot tick every box? Inside a tier, you skipped a cycle — identify which
test was added after, delete the matching production code, and redo that
cycle properly. Outside one, the failure is in the case list: rebuild it from
the spec and re-check coverage.

## Cross-references

- `/designing-test-cases` — where the frozen case set comes from. **Both paths
  need it**, and it is the step that carries the value: inside a tier it feeds
  the cycle one row at a time (a directory of simultaneously-red tests is not
  this cycle); outside one it is the list the tests-after must be derived from.
- `/running-uat` — the product-level evidence a green suite does not provide.
  Mandatory before reporting a user-visible feature done.
- `/verifying-before-done` — the gate for every completion claim. Re-run in this
  turn, not from memory.
- `/debugging` — when fixing a bug, the failing-test step is the
  same red phase. A bug fix is always inside a tier.

## Final rule

```
Tier named → inside:  a test exists AND was watched to fail
             outside: the case list existed BEFORE the code
Either way → the product was shown working, not just the suite
```

## Bundled files

- `references/runners-and-example.md` — the per-stack runner commands, a full
  worked red → green → refactor bug fix, and the when-stuck table.

## Changes

- **0.7.0** — English-only pass (`using-dstack` 0.7.0). Trigger is now `does
  this need tdd`; 0.6.0's quotations are English reported speech.
- **0.6.0** — **The cycle is no longer the default for every change.** Owner's
  transcripts across three CLI installs made this the catalog's most expensive
  skill — median 90 min to the next human turn, p90 460 min (n=6; the metric
  includes user idle time, an upper bound) — while
  `designing-test-cases` cost 27 min; the owner reported it slow, off-target,
  and still needing heavy manual testing. The research splits the same way:
  agent-written tests barely move task resolution (74.4% vs 71.8%; suppressing
  them cuts input tokens 33–49% for 1.8–2.6 pt —
  [2602.07900](https://arxiv.org/html/2602.07900v2)), yet tests generated
  after faulty code catch 14% of faults vs 25% for independent derivation
  ([2607.05139](https://arxiv.org/pdf/2607.05139)). The derivation carries the
  value, not the ceremony. Added six mandatory risk tiers, a
  freeze-list-then-implement path outside them, a named-tier decision, and the
  "green tests are not a working product" gate — the archetypal correction being
  78 green server tests answered with the owner still seeing no result. Scoped
  the drill, excuse table, red flags and checklist per path; moved the runner
  table and worked example to `references/`.
- **0.5.0** — Reciprocated the `designing-test-cases` boundary: a case set is
  consumed one row at a time, because a batch of simultaneous red tests defeats
  the watched-failing step this skill exists to protect.
- **0.4.0** — Added **"Cover more than the happy path"**: the four test classes
  (happy / edge / invalid / **chaos-failure-injection**) with the bias rule —
  derive cases from the contract, not from the implementation you just wrote —
  and a "could this pass against a wrong implementation?" gate. Added a
  stack-agnostic run-command table (Bun, npm, Angular, .NET, Python, Go, Rust,
  PHP) after finding the skill named only TypeScript tooling while the owner's
  repos are majority .NET, Node, and Python. Moved `## Changes` to the end of
  the body — it had been sitting mid-document, splitting "What a good test
  looks like" from its own Good/Bad examples.

- **0.3.0** — Renamed `tdd` → `test-driven-development`: the abbreviation
  was opaque to newcomers and broke the catalog's gerund/descriptive naming
  convention (Anthropic best practices, §"Naming conventions"). Matches the
  upstream superpowers name. The `tdd` trigger keyword is kept, so "do TDD"
  still routes here.
- **0.2.0** — Added the numbered habit-fix drill for "I write tests
  after the code" plus the honest-test diagnostic table. Added v2
  schema fields (`type: semantic`, `side_effects: local`, `agency:
  deliberative`). Driven by v3 Track C benchmark case-2 loss against
  superpowers/test-driven-development on specificity + procedure.
- **0.1.0** — Initial port from v1 skill catalog.
