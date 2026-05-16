# /tdd

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
   This is the same evidence gate `/verification` enforces.
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
- [ ] Edge cases and error paths are covered.

Cannot tick every box? You skipped TDD on at least one cycle.
Identify which test was added after, delete the matching production
code, and redo that cycle the right way.

## Cross-references

- `/verification` — the green-verification step uses the same
  evidence rule. Re-run before claiming "done", not from memory.
- `/debugging` — when fixing a bug, the failing-test step is the
  same red phase.

## Final rule

```
Production code → a test for it exists AND was watched to fail
Otherwise → not TDD; stop and raise it with the user
```
