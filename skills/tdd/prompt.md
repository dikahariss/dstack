# /tdd

Test-driven development discipline. Write the failing test before the
production code, watch it fail, then write the minimal code that makes
it pass.

> Adapted from `superpowers/test-driven-development`. dstack today is
> advisory — the user enforces the discipline. There is no hook engine
> that blocks production-code edits without a failing test first.

## The iron law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

If production code was written before the test, delete it. Do not keep
it as reference. Do not "adapt" it while writing tests. Implement fresh
from the tests.

## When to use TDD

- New features
- Bug fixes (the test reproduces the bug)
- Refactors that change observable behavior

**Exceptions to discuss with the user before skipping the discipline:**

- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? That is rationalization. Stop and
write the test.

## The cycle: red → green → refactor

1. **RED — write one failing test.** One behavior, clear name, exercises
   real code (no mocks unless unavoidable).
2. **Verify red.** Run the test. Confirm it fails for the right reason
   (feature missing, not a typo). If it passes, you are testing
   existing behavior — fix the test. If it errors, fix the error.
3. **GREEN — minimal code.** Write the simplest code that makes the
   test pass. Do not add features, refactor adjacent code, or
   "improve" beyond the test.
4. **Verify green.** Run the test. Confirm it passes, all other tests
   still pass, and the output is pristine (no warnings, no stray
   errors).
5. **REFACTOR — clean up.** Remove duplication, rename for clarity,
   extract helpers. Keep all tests green. Do not add behavior.
6. **Next.** Pick the next failing test and start again.

## What a good test looks like

- **Minimal** — one behavior per test. The word "and" in a test name
  means the test should be split.
- **Clear** — the name describes the behavior, not a number
  (`rejects_empty_email`, not `test1`).
- **Real code** — exercises the actual production code path. Use mocks
  only when the alternative is impossible (external network, time,
  randomness).

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

| Excuse | Why it fails |
|---|---|
| "I'll write tests after to verify it works" | Tests-after pass immediately. Passing immediately proves nothing — you never watched the test catch a bug. |
| "I already manually tested it" | Ad-hoc is not systematic. No record, cannot re-run on every change, easy to forget edge cases under pressure. |
| "Deleting X hours is wasteful" | Sunk cost. The time is gone either way. The choice is between code you trust and code you do not. |
| "TDD is dogmatic, pragmatic means adapting" | TDD is the pragmatic shortcut — bugs caught at commit are cheaper than bugs caught in production. |
| "Tests after achieve the same goal" | Tests-after answer "what does this do?" Tests-first answer "what should this do?" Tests-first force edge-case discovery before the implementation biases you. |

## Red flags — stop and start over

Any of these means: revert the production code, write the test first,
start the cycle over.

- Code was written before the test.
- A test was added after the implementation.
- A test passes the first time you run it.
- You cannot explain why the test failed.
- You are thinking "tests can come later".
- You are rationalizing "just this once".
- You are keeping pre-test code "as reference" or "to adapt".

## Example: a bug fix

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
PASS
```

**Refactor** — extract a shared validation helper only if a second field
needs the same check.

## Verification checklist before declaring done

- [ ] Every new function or method has at least one test.
- [ ] Each test was watched as it failed before any production code was
      written.
- [ ] Each test failed for the expected reason (feature missing, not a
      typo).
- [ ] Production code is the minimal code that makes the test pass.
- [ ] All tests pass.
- [ ] Test runner output is pristine — no warnings, no unrelated
      errors.
- [ ] Edge cases and error paths are covered.

Cannot tick every box? You skipped TDD on at least one cycle. Identify
which test was added after, delete the matching production code, and
redo that cycle the right way.

## When stuck

| Problem | What to do |
|---|---|
| Do not know how to test the behavior | Write the API you wish you had. Write the assertion first. Ask the user if the desired behavior is unclear. |
| Test is too complicated | The design is too complicated. Simplify the interface, not the test. |
| Have to mock everything | Code is too tightly coupled. Use dependency injection so the unit under test takes its collaborators as parameters. |
| Test setup is huge | Extract setup helpers. If the helpers themselves are huge, simplify the design under test. |

## Final rule

```
Production code → a test for it exists and was watched to fail
Otherwise → not TDD; stop and ask the user before continuing
```
