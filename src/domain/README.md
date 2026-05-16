# `src/domain/` — Domain layer

This folder holds the domain layer. Code in this folder follows strict
rules.

## Terms

| Term | Definition |
|---|---|
| Domain | The layer that holds core types and business rules. No file system access. No network calls. |
| Entity | A type that has an identity. Two entities with the same data but different ids are different entities. |
| Value object | A type without identity. Two value objects with the same data are equal. Immutable. |
| Aggregate | A group of entities and value objects that are treated as one unit. |
| Port | A TypeScript interface defined by the domain. Adapters implement ports. |

## Rules for code in this folder

1. **No imports from outside this folder**, except built-in TypeScript
   types (`string`, `Date`, `URL`, `Map`, etc.) and other files inside
   `src/domain/`.
2. **No file system access.** No `fs`, no `node:fs`. If a piece of
   logic needs to read a file, define a port and put the file-reading
   code in an adapter.
3. **No network calls.** No `fetch`, no HTTP client.
4. **No process spawning.** No `child_process`, no `spawn`.
5. **No logging.** Code in this folder does not call `console.log`. If
   logging is needed, emit a structured event through the `Telemetry`
   port instead.
6. **No `throw new Error("some string")`**. Use typed error classes
   from `src/domain/errors.ts`. Callers can then check the error type
   instead of parsing message strings.
7. **Pure functions preferred.** Use classes only when the type has
   identity (entity) or invariants (aggregate).

## Files in this folder

| File | Purpose |
|---|---|
| `errors.ts` | Typed error classes raised by the domain. |
| `skill/SkillId.ts` | Value object: a validated skill id string. |
| `skill/SkillSpec.ts` | Value object: the parsed contents of `skill.yaml`. |
| `skill/Skill.ts` | Aggregate: spec plus prompt body, together. |
| `skill/ports.ts` | The `SkillRepository` port. |
| `host/Host.ts` | Entity: a target AI host (currently only Claude Code). |
| `host/ports.ts` | The `HostRenderer` and `Installer` ports, plus `InstallReport`. |
| `render/RenderContext.ts` | Value object: the immutable input to a renderer. |
| `render/RenderResult.ts` | Value object: the immutable output of a renderer, plus `Warning` types. |

## What is NOT in this folder

The following live in adapter folders, not here:

- File system reading and writing (in `src/adapters/fs/`).
- Code that knows Claude Code's directory layout (in
  `src/adapters/claude-code/`).
- Code that uses Bun-specific APIs.

## Tests for this folder

Domain tests are unit tests. They run with:

```bash
bun test src/domain/
```

These tests need no setup. No file system, no temporary directories,
no mocks. If a domain test needs a mock, the logic being tested is in
the wrong layer.

A test of `SkillId`, for example, calls `SkillId.parse('some-id')` and
checks the result. The test does not write to disk and does not need
fixtures.

## Cross-references

- [docs/specs/skill-spec.md](../../docs/specs/skill-spec.md) — the
  on-disk format that maps to the types in `skill/`.
- [docs/specs/host-spec.md](../../docs/specs/host-spec.md) — the host
  contract that maps to `host/Host.ts` and `host/ports.ts`.
- [docs/specs/render-spec.md](../../docs/specs/render-spec.md) — the
  render context and result types defined in `render/`.
- [docs/skill-taxonomy.md](../../docs/skill-taxonomy.md) — the design
  framework. The domain types defined here do not encode taxonomy
  fields today; the framework describes how they could be extended.
- [ADR-0001](../../docs/adr/0001-hexagonal-layered.md) — the layered
  architecture rules this folder follows.
