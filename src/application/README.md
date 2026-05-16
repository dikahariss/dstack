# `src/application/` — Application layer

This folder holds the application layer. The application layer contains
use cases. A use case is one operation that a user invokes.

## Terms

| Term | Definition |
|---|---|
| Use case | A class that represents one user-visible operation. Each use case has one public method, usually called `execute`. |
| Port | A TypeScript interface defined by the domain. Use cases depend on ports, not on concrete adapter classes. |
| Adapter | Concrete code that implements a port. The application layer does not import adapters directly. |
| Wiring | The act of creating concrete adapters and passing them to use cases. Done in `src/adapters/cli/main.ts`. |

## Rules for code in this folder

1. **Constructor-inject ports.** Each use case receives its required
   ports through its constructor. Inside the use case, no
   `new FileSkillRepository()` or other concrete-class construction.
2. **One public method per use case.** Usually `execute(input)`. A use
   case is not a service object with eight methods. If you need eight
   methods, create eight use cases.
3. **No imports from `src/adapters/`.** Use cases see ports
   (interfaces) only. The wiring code in `main.ts` chooses which
   concrete adapter implements each port.
4. **Throw typed errors from `src/domain/errors.ts`.** If you must
   wrap an adapter error, wrap it in a domain error before throwing.

## Files in this folder

| File | Purpose |
|---|---|
| `BuildSkill.ts` | Use case: load one skill, validate its tools, render it, check the token budget. |
| `BuildCatalog.ts` | Use case: load every skill, check for duplicate ids, render each one. |
| `InstallSkills.ts` | Use case: take rendered results and pass them to the installer. |

These three use cases are the entire application surface today. The
`dstack build` command runs `BuildCatalog` followed by `InstallSkills`.

## How tests work

Tests of use cases substitute fake adapters for every port. For
example, a test of `BuildCatalog` might look like:

```typescript
const repo: SkillRepository = new FakeSkillRepository([skill1, skill2]);
const renderer: HostRenderer = new FakeRenderer(/* deterministic output */);
const telemetry: Telemetry = new NoopTelemetry();

const useCase = new BuildCatalog(repo, renderer, telemetry);
const results = await useCase.execute({ host, now: new Date() });

// Assertions on results...
```

The test does not need:

- A real file system.
- The Playwright library or Chromium browser.
- An actual Claude Code installation.

Each use case test runs in under 5 milliseconds.

## What is NOT in this folder

The following do not belong here:

- File system code (in `src/adapters/fs/`).
- Code that knows Claude Code's directory layout (in
  `src/adapters/claude-code/`).
- The CLI entrypoint (in `src/adapters/cli/`).
- Concrete adapter classes (in `src/adapters/`).

## Cross-references

- [docs/specs/render-spec.md](../../docs/specs/render-spec.md) — the
  render pipeline the `BuildSkill` and `BuildCatalog` use cases drive.
- [docs/specs/install-spec.md](../../docs/specs/install-spec.md) — the
  install behavior the `InstallSkills` use case drives.
- [docs/skill-taxonomy.md](../../docs/skill-taxonomy.md) — design
  framework. If the taxonomy is adopted into `skill.yaml`, use cases
  would dispatch differently per computation type.
- [ADR-0001](../../docs/adr/0001-hexagonal-layered.md) — the layered
  architecture rules this folder follows.
