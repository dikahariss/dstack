---
name: test-driven-development
description: |
  Test-driven development discipline. Write the failing test first, watch
  it fail, then write the minimal code that makes it pass. Use when
  implementing a new feature, fixing a bug, or refactoring with behavior
  change. Use when asked to "do TDD", "test-first", "red-green-refactor",
  or "write the test first".
allowed-tools: Read Write Edit Bash
metadata:
  dstack:
    version: 0.4.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - tdd
      - test first
      - red green refactor
      - write the test first
---
# /test-driven-development

Test-driven development discipline. Write the failing test before the
production code, watch it fail, then write the minimal code that makes
it pass.

## The iron law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

If production code was written before its test, **delete it**. Do not
keep it as reference. Do not "adapt" it while writing the test. Re-
implement fresh from the test you write next.

## When to use this skill

- New features.
- Bug fixes — the test reproduces the bug; the fix makes it pass.
- Refactors that change observable behavior.

**Exceptions** (raise with the user before skipping the discipline):

- Throwaway prototypes you will delete this session.
- Generated code.
- Configuration files with no executable behavior.

Thinking "skip TDD just this once"? That is rationalization. Write
the test.

## Fixing the "I write tests after the code" habit

If the habit is the problem (not the discipline), here is the
numbered drill. Do this for one week on a real task:

1. **Pick a tiny feature.** A 10-line change at most. Smaller is
   better — drill is about the habit, not the feature.
2. **Open the test file before the source file.** Physically.
   Different window or tab. The first keystroke goes in the test.
3. **Write a degenerate test that can be passed by `return 0`** (or
   the language equivalent — `return null`, `return ""`, etc.).
   This is intentional, not weak. The point is to see red.
4. **Run it. Watch it fail.** If it does not fail, the test is not
   testing what you think; fix the test, not the source.
5. **Add the minimum to make it pass — even if it is dumb.** Hardcode
   the value if that is what the test allows.
6. **Write the next test.** Now the test demands more than the
   hardcoded value. Now the source has to generalise. This is where
   real TDD takes over.

### The honest-test diagnostic

If you cannot tell whether you are doing TDD or just writing tests
after, ask three questions for each test:

| Question | Honest answer | Verdict |
|---|---|---|
| Did I write this test before the source change? | Yes | TDD |
| Did this test fail when I first ran it? | Yes (red phase happened) | TDD |
| Did I delete the source and re-implement from the test? | If no, the existing source is implicitly guiding the test → not TDD |

Two "no" answers in a row → reset. Delete the source, start at step 1.

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


### Good

```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

One behavior, real function, asserts what matters.

### Bad

```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```

Vague name, tests the mock instead of the code.

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

## Why order matters

| Excuse | Reality |
|---|---|
| "I'll write tests after to verify it works." | Tests-after pass immediately. Passing immediately proves nothing — you never watched the test catch a bug. |
| "I already manually tested it." | Manual is ad-hoc. No record, cannot re-run on every change, easy to forget edge cases under pressure. |
| "Deleting X hours of code is wasteful." | Sunk cost. The time is gone either way. The choice is between code you trust and code you do not. |
| "TDD is dogmatic; pragmatic means adapting." | TDD is the pragmatic shortcut — bugs caught at commit are cheaper than bugs caught in production. |
| "Tests-after achieve the same goal." | Tests-after answer "what does this do?" Tests-first answer "what should this do?" Tests-first force edge-case discovery before your implementation biases you. |

## Red flags — stop and restart the cycle

Any of these means: revert the production code, write the test
first, start the cycle over.

- Code was written before the test.
- A test was added after the implementation.
- A test passes the first time you run it.
- You cannot explain why the test failed.
- You are thinking "tests can come later".
- You are rationalizing "just this once".
- You are keeping pre-test code "as reference" or "to adapt".

## Run the test — pick the stack's command

The discipline is language-agnostic; only the command changes. Read the repo's
own runner first (`package.json` scripts, `*.csproj`, `pyproject.toml`, a
Makefile) — never assume the stack.

| Stack | One test | Whole suite |
|---|---|---|
| Bun | `bun test path/x.test.ts -t "name"` | `bun test` |
| Node / npm | `npm test -- -t "name"` | `npm test` |
| Angular | `ng test --include='**/x.spec.ts'` | `ng test --watch=false` |
| .NET | `dotnet test --filter "FullyQualifiedName~Name"` | `dotnet test` |
| Python | `pytest path::test_name` | `pytest -q` |
| Go | `go test -run TestName ./...` | `go test ./...` |
| Rust | `cargo test name` | `cargo test` |
| PHP | `vendor/bin/phpunit --filter name` | `vendor/bin/phpunit` |

Examples in this skill are TypeScript because they must be *some* language.
The cycle, the four test classes, and the iron law are identical in each.

## Worked example — a bug fix

**Bug:** the form accepts an empty email.

**RED**

```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

**Verify red.**

```
$ npm test
FAIL  rejects empty email
  expected 'Email required', got undefined
```

**GREEN**

```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  ...
}
```

**Verify green.**

```
$ npm test
PASS  rejects empty email
PASS  (... all prior tests)
```

**Refactor.** Extract a shared validator only if a second field needs
the same check. Otherwise leave it inline.

## When stuck

| Problem | What to do |
|---|---|
| You do not know how to test the behavior. | Write the API you wish you had. Write the assertion first. Ask the user if the desired behavior is unclear. |
| The test feels too complicated. | The design is too complicated. Simplify the interface, not the test. |
| You must mock everything. | The code is too tightly coupled. Use dependency injection so the unit under test takes its collaborators as parameters. |
| The setup is huge. | Extract setup helpers. If the helpers themselves are huge, simplify the design under test. |

## Verification checklist before declaring done

- [ ] Every new function or method has at least one test.
- [ ] Each test was watched as it failed before any production code
      was written.
- [ ] Each test failed for the expected reason (feature missing,
      not a typo).
- [ ] Production code is the minimal code that makes the test pass.
- [ ] All tests pass.
- [ ] Test-runner output is pristine — no warnings, no unrelated
      errors.
- [ ] All four classes walked: happy path, edge/boundary, invalid/error,
      and at least one **chaos** case (dependency failure, timeout,
      duplicate or concurrent call) — or a stated reason none applies.
- [ ] The cases came from the contract, not from reading the
      implementation. A wrong implementation would fail this set.

Cannot tick every box? You skipped TDD on at least one cycle.
Identify which test was added after, delete the matching production
code, and redo that cycle the right way.

## Cross-references

- `/verifying-before-done` — the green-verification step uses the same
  evidence rule. Re-run before claiming "done", not from memory.
- `/debugging` — when fixing a bug, the failing-test step is the
  same red phase.

## Final rule

```
Production code → a test for it exists AND was watched to fail
Otherwise → not TDD; stop and raise it with the user
```

## Changes

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
