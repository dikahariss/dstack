# `test/` — Test strategy

This folder holds tests for dstack. This README describes the test
strategy and conventions.

## Terms

| Term | Definition |
|---|---|
| Unit test | A test of one small piece of code. No file system, no network, no other dependencies. |
| Contract test | A shared test suite for a port (interface). Every adapter that implements the port must pass the same suite. |
| Integration test | A test that wires real adapters together and runs a use case against real input/output (usually a temporary directory). |
| LLM-judge eval | A test where a separate LLM scores the output of a skill. Expensive because of the LLM call cost. |
| Fixture | A small input file used by a test. |
| Tier | A category of test based on speed and cost. |

## Tiers

| Tier | Speed (total) | Cost | What it covers |
|---|---|---|---|
| Unit | Under 50 ms | Free | Domain entities, value objects, pure functions. |
| Contract | Under 500 ms | Free | One shared suite per port. Every adapter that implements the port passes the same suite. |
| Integration | Under 2 seconds | Free | One full use case wired with real adapters, running against a temporary directory. |
| LLM-judge | Over 30 seconds | Paid (about USD 0.15 per run) | Not used in v0. See [DEFERRED.md](../docs/plans/v1/DEFERRED.md) D3. |

## Folder layout

```
test/
├── unit/
│   ├── domain/
│   │   └── SkillId.test.ts
│   └── adapters/
│       ├── cli/
│       │   ├── scaffold.test.ts             # `dstack new` scaffolder.
│       │   └── warning-formatter.test.ts    # CLI warning output.
│       ├── claude-code/
│       │   └── tokens.test.ts               # approximateTokenCount formula + determinism.
│       └── fs/
│           └── error-messages.test.ts       # SkillSpecError file:line locations.
├── contract/
│   ├── SkillRepository.contract.ts          # Defines the shared suite.
│   └── FileSkillRepository.contract.test.ts # Applies the suite to one adapter.
├── integration/
│   └── (future) build-and-install.test.ts
└── fixtures/
    └── skills/
        ├── good/                            # Valid skills used by tests.
        ├── missing-prompt/                  # Invalid skill: no prompt.md.
        └── bad-yaml/                        # Invalid YAML or wrong-type fields, for error-message tests.
```

## How contract tests work

Hexagonal architecture (see [ADR-0001](../docs/adr/0001-hexagonal-layered.md))
pays off when every adapter passes a shared test suite. This catches
behavior drift between two implementations of the same port.

The pattern:

```typescript
// test/contract/SkillRepository.contract.ts
export function runSkillRepositoryContract(
  name: string,
  factory: () => Promise<SkillRepository>,
) {
  describe(`SkillRepository contract: ${name}`, () => {
    test('loadAll returns empty array for empty root', async () => {
      const repo = await factory();
      expect(await repo.loadAll()).toEqual([]);
    });

    test('loadById returns null for unknown id', async () => {
      // ...
    });

    test('loadAll throws SkillSpecError when prompt.md is missing', async () => {
      // ...
    });

    // More invariants the port promises.
  });
}

// test/contract/FileSkillRepository.contract.test.ts
runSkillRepositoryContract('FileSkillRepository', async () => {
  return new FileSkillRepository(await fixtureSkillsRoot());
});
```

If a second `SkillRepository` is ever added (for example, a
`HttpSkillRepository` that fetches skills from a URL), it gets its own
file that calls `runSkillRepositoryContract` with its own factory. The
same suite then validates the new adapter. Drift between
implementations is caught at test time, not in production.

## What this folder does NOT test in v0

- **LLM-judge evaluations.** Skills are run by humans on real Claude
  Code at v0. Automated LLM-based scoring is deferred until a second
  user exists. See `docs/plans/v1/DEFERRED.md` D3.
- **Browser integration.** That belongs in `packages/browse/test/`
  (when that package is implemented).
- **Performance benchmarks.** The renderer is small enough that
  performance is not a known problem. Add benchmarks when there is
  evidence of a slow path, not before.

## Running tests

| Command | What it runs |
|---|---|
| `bun test` | Every test in every tier. |
| `bun test test/unit/` | Unit tests only. |
| `bun test test/contract/` | Contract tests only. |
| `bun test test/integration/` | Integration tests only (when written; not yet present in v0). |

Total runtime today is about 100 ms across 6 files (40 pass).
If a tier's runtime exceeds its budget in the table above, profile
before adding test skips. Slow tests that are skipped stay slow forever.

## Adding a new test

For a new unit test:

1. Find or create the right file under `test/unit/`.
2. Import the code under test from `src/`.
3. Write tests that exercise pure logic. No file system or network.

For a new contract test:

1. Find the contract suite file under `test/contract/`. If the port
   does not have one yet, create it as a `*.contract.ts` file (not
   `*.test.ts`).
2. Apply the suite from each adapter's `*.contract.test.ts` file.

For a new integration test:

1. Create a file under `test/integration/`.
2. Use a temporary directory.
3. Wire real adapters.
4. Run a use case end to end.
5. Clean up the temporary directory.
