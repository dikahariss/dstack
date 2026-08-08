# Test runners per stack, and a worked cycle

Read this when you need the exact command for a stack, or a full red → green →
refactor walkthrough. The rules that decide *whether* to run the cycle live in
`SKILL.md`; this file only shows *how*.

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

Examples are TypeScript because they must be *some* language. The cycle, the
four test classes, and the iron law are identical in each.

## Worked example — a bug fix

A bug fix is always inside a risk tier, so this is the full cycle.

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

**Refactor.** Extract a shared validator only if a second field needs the same
check. Otherwise leave it inline.

## When stuck

| Problem | What to do |
|---|---|
| You do not know how to test the behavior. | Write the API you wish you had. Write the assertion first. Ask the user if the desired behavior is unclear. |
| The test feels too complicated. | The design is too complicated. Simplify the interface, not the test. |
| You must mock everything. | The code is too tightly coupled. Use dependency injection so the unit under test takes its collaborators as parameters. |
| The setup is huge. | Extract setup helpers. If the helpers themselves are huge, simplify the design under test. |

## Good and bad tests

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

## Why order matters — inside a tier (excuses, defused)

Rationalisations for abandoning the cycle on a change that belongs inside one.
Not arguments for running it everywhere — the tier table settled that.

| Excuse | Reality |
|---|---|
| "I'll write tests after to verify it works." | Tests-after pass immediately. Passing immediately proves nothing — you never watched the test catch a bug. |
| "I already manually tested it." | Manual is ad-hoc. No record, cannot re-run on every change, easy to forget edge cases under pressure. |
| "Deleting X hours of code is wasteful." | Sunk cost. The time is gone either way. The choice is between code you trust and code you do not. |
| "Tests-after achieve the same goal." | Tests-after answer "what does this do?" Tests-first answer "what should this do?" — and in a tier, that difference is the whole point. |

