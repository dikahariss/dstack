# ADR-0003 — Skills are YAML + Markdown, not templates

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Moderate. Skills can be migrated to a template
  format with a script. The harder part is updating any code that
  assumes flat skills.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Template | A file containing placeholders that are filled in by a separate process before the file is used. Example: `.tmpl` files processed by a generator. |
| Resolver | A function that produces text to be inserted into a template. |
| Preamble | A shared block of text added to the top of many skills. |
| Include | A directive in `skill.yaml` that references a shared file to be inserted into the prompt. |

## Context

A template-driven skill pipeline (skills as `.tmpl` files, a generator
that runs registered resolvers, a shared preamble injected into every
output) is a common pattern. It scales the way most pipelines scale:
the generator grows, the resolver count grows, the preamble grows.
Three costs of this approach show up at scale:

1. **Hard to debug.** A rendered `SKILL.md` does not look like its
   source file. To understand why a behavior appears in the output, a
   reader follows the chain: template → resolvers → preamble →
   emitted output. Three levels of indirection.

2. **Strong coupling between skills.** Every skill shares the same
   preamble. Changing the preamble affects every skill at once.
   Sometimes that is the intent; sometimes it is an accidental
   regression.

3. **Token cost of shared content.** Large rendered skills can run
   tens of thousands of tokens. Most of that text is shared
   scaffolding, not skill-specific instruction. Modern Claude models
   have large context windows, so this is not a hard limit. The
   latency and the price of the LLM call are real, even when not
   blocking.

## Decision

A skill is a directory under `skills/`. The directory contains exactly
two files:

```
skills/<skill-id>/
├── skill.yaml      # Metadata: id, version, description, tools, etc.
└── prompt.md       # The prompt text the LLM will read.
```

There is no template engine. There are no `.tmpl` files. There are no
resolvers. The renderer reads `skill.yaml` and `prompt.md`, adds the
correct header (frontmatter) for the target host, and writes the result.

Shared content (a block of text used in several skills) is handled in
one of two ways:

1. **Explicit include.** A skill's `skill.yaml` may list `includes`,
   referencing files in `skills/_shared/`. The renderer concatenates
   the listed files with the prompt. The include is visible at the
   call site.

2. **Manual duplication.** If a snippet appears in three skills, copy
   it into each. Three copies is acceptable. Five or more copies is a
   signal to extract a shared include.

## Trade-offs

**Upsides (`+`)**

- A reader of `prompt.md` sees exactly what the LLM will see, plus or
  minus the frontmatter. No hidden injection.
- No template engine to maintain. Engine bugs would all be in one file
  (the renderer), not in a chain of resolvers.
- The token cost of each skill is the cost of that skill alone. There
  is no shared preamble that every skill carries.
- Comparing two skills is a simple `diff` of their prompt files.

**Downsides (`-`)**

- When the same phrase legitimately repeats across many skills, we
  duplicate it instead of extracting it. We accept this cost. See the
  YAGNI guard below.
- Contributors must read `docs/specs/skill-spec.md` to know what fields
  are required in `skill.yaml`. There is no automatic injection. This
  is a one-time documentation cost.

## YAGNI guard

Do not add a template engine unless all three of these are true:

1. A specific shared snippet appears word-for-word in five or more
   skills, AND
2. Editing the snippet in those places has caused at least one bug,
   AND
3. The explicit `includes:` directive in `skill.yaml` is not enough.

Reason: the urge to "remove duplication in the preamble" is what
produces large resolver systems in the first place. The cost of
duplication is paid once when writing. The cost of indirection is
paid every time someone reads the code.

## Reversibility

Moderate. Skills can be migrated to a template format with a script
because the file format is structured. The harder part is updating any
code that assumed flat skills. The cost scales with how many use cases
read skills directly.

## References

- A typical shared preamble of around 120 lines can fit into a 30-line
  file under `skills/_shared/preamble.md` once the lines that exist
  only for runtime substitution are removed.
- See [ADR-0004](0004-no-template-engine-v0.md) for the operational
  result of this decision.
