# ADR-0011 — Import path aliases for cross-layer references

- **Status:** Accepted
- **Date:** 2026-05-16
- **Reversibility:** Cheap. A find-and-replace can restore relative paths.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Path alias | A symbolic prefix (for example `@domain/...`) that the TypeScript compiler and Bun resolve to a directory under the repo root. |
| Sibling import | An import whose path starts with `./X` — the imported file lives in the same directory. |
| Cross-layer import | An import that crosses a layer boundary (domain → application → adapters) or hops across folders within a layer. |

## Context

After Phase 2 (M3, M4) the catalog has more files, and test files in
particular reach four levels deep when referencing the source tree:

```typescript
import { FileSkillRepository } from '../../../../src/adapters/fs/FileSkillRepository';
import { SkillId } from '../../../../src/domain/skill/SkillId';
```

This makes three things harder:

1. **Reading.** A reader counts `..` segments to know where the file
   lives. The path tells the reader nothing about which layer the
   import targets.
2. **Refactoring.** Moving a file means recomputing every relative
   path that points to it or out of it.
3. **Layer discipline.** ADR-0001 says the dependency direction is
   `adapters → application → domain`. A relative path obscures the
   direction; an alias makes it explicit at the import site.

The cost of fixing this is small. The cost of leaving it grows linearly
with the catalog size.

## Decision

Use TypeScript path aliases for every import that is not a sibling.
The four aliases map to the four source roots:

| Alias | Resolves to |
|---|---|
| `@domain/*` | `src/domain/*` |
| `@app/*` | `src/application/*` |
| `@adapters/*` | `src/adapters/*` |
| `@obs/*` | `src/observability/*` |

Configuration lives in `tsconfig.json` under `compilerOptions.paths`.
Bun resolves these paths natively at runtime — no bundler or runtime
flag is needed.

Convention for picking the form:

- **Sibling (`./X`)**: stay relative. The relative path is short and
  unambiguous, and the import tracks file rename.
- **Anything else**: use the alias. This includes parent (`../X`),
  grand-parent (`../../X`), and cross-layer hops.

Example:

```typescript
// src/adapters/fs/FileSkillRepository.ts
import { Skill } from '@domain/skill/Skill';            // cross-layer → alias
import { SkillRepository } from '@domain/skill/ports';  // cross-layer → alias
import { assertAllowed } from './paths';                // sibling → relative
```

## Trade-offs

**Upsides (`+`)**

- Reading: an import that starts with `@domain/` tells the reader the
  target layer without counting directory segments.
- Refactoring: moving `src/adapters/fs/FileSkillRepository.ts` does not
  change any caller's import path. Moving a folder still requires
  updating callers, but no path-walking arithmetic.
- Layer discipline: a forbidden direction (for example `@domain/...`
  inside `src/domain/...`) becomes obvious in code review. A relative
  `../skill/X` is harder to flag.
- Test files shrink: `../../../../src/adapters/fs/...` becomes
  `@adapters/fs/...`.

**Downsides (`-`)**

- Two ways to import. Convention is required so the codebase stays
  consistent; the "sibling stays relative" rule keeps the choice
  mechanical, not subjective.
- Aliases depend on tooling. `tsc`, Bun, and any future bundler must
  resolve the same `paths` table. Bun reads `tsconfig.json` directly,
  so this is one source of truth today; tomorrow a different tool
  would need to be aware.
- `baseUrl` is deprecated in TypeScript 7. The current configuration
  uses relative `paths` entries (for example `"./src/domain/*"`) which
  do not require `baseUrl`. Future TypeScript upgrades stay compatible.

## YAGNI guard

Do not create a fifth alias for `packages/browse/` until that package
has real code that imports `src/`. Today `packages/browse/` is a
README; aliasing into it would be a phantom layer.

Do not alias subfolders below the layer roots (for example, do not
add `@skills/*` mapped to `src/domain/skill/*`). The four roots above
match the four layer boundaries; finer aliases proliferate without a
matching architectural cue.

Do not alias relative paths inside a single file's directory.
`./tokens` is shorter and clearer than `@adapters/claude-code/tokens`
when the import sits next to the imported file.

## Reversibility

Cheap. To undo:

1. Remove the `paths` block from `tsconfig.json`.
2. Run a single repo-wide find-and-replace: each alias mapping is
   one-to-one with a directory path, so the substitutions are
   deterministic.

The decision touches import lines only, so no architectural change
follows from reversal.

## References

- TypeScript handbook, "Module Resolution → paths".
- ADR-0001 — the layer rule the aliases make visible at the import
  site.
- ADR-0005 — Bun is the runtime that must resolve the aliases. Bun
  reads `tsconfig.json` directly.
