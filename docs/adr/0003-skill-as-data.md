# ADR-0003 — Skills are YAML + Markdown, not templates

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Moderate. Skills can be migrated to a template
  format with a script. The harder part is updating any code that
  assumes flat skills.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Template | A file containing placeholders that are filled in by a separate process before the file is used. Example: gstack `.tmpl` files. |
| Resolver | A function that produces text to be inserted into a template. gstack has 17 resolvers. |
| Preamble | A shared block of text that is added to the top of many skills. gstack has a 120-line preamble that appears in every skill. |
| Include | A directive in `skill.yaml` that references a shared file to be inserted into the prompt. |

## Context

gstack skills are `.tmpl` files. A program called `gen-skill-docs.ts`
processes each `.tmpl` file by:

1. Loading the template.
2. Running every registered resolver. Each resolver reads parts of the
   template and returns text to insert.
3. Combining the results.
4. Writing the final `SKILL.md` for each host.

The generator is 687 lines of TypeScript. The resolvers total about
4,500 additional lines. Three costs of this approach are visible:

1. **Hard to debug.** A rendered `SKILL.md` does not look like its
   source file. To understand why a behavior appears in the output, a
   reader follows the chain: template → resolvers → preamble → emitted
   output. Three levels of indirection.

2. **Strong coupling between skills.** All 48 skills share the same
   preamble (about 120 lines). Changing the preamble affects every
   skill at once. Sometimes that is the intent; sometimes it is an
   accidental regression.

3. **Token cost of shared content.** The largest rendered skills are
   over 35,000 tokens. Most of that text is shared scaffolding, not
   skill-specific instruction. Modern Claude models have large context
   windows, so this is not a hard limit. The latency and the price of
   the LLM call are real, even when not blocking.

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

Reason: the urge to "remove duplication in the preamble" produced
gstack's 4,500 lines of resolvers. The cost of duplication is paid once
when writing. The cost of indirection is paid every time someone reads
the code.

## Reversibility

Moderate. Skills can be migrated to a template format with a script
because the file format is structured. The harder part is updating any
code that assumed flat skills. The cost scales with how many use cases
read skills directly.

## References

- The gstack file `preamble.ts` is 120 lines. The same content can fit
  into a 30-line file under `skills/_shared/preamble.md` for any skill
  that needs it.
- See [ADR-0004](0004-no-template-engine-v0.md) for the operational
  result of this decision.
