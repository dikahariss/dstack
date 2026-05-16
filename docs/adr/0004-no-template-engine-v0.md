# ADR-0004 — No template engine, no resolvers at v0

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Cheap. A template engine can be added later inside
  the renderer.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Render | The act of producing the final output file from a skill's source. |
| Renderer | The component that performs rendering. In dstack, this is `ClaudeCodeRenderer`. |
| Step | One discrete action in the rendering process. |

## Context

This ADR follows [ADR-0003](0003-skill-as-data.md). ADR-0003 decides
that skills are YAML plus Markdown. This ADR decides what code runs at
render time.

gstack's render process has roughly 14 steps per template:

```
1. Load the template file.
2. Run the preamble resolver.
3. Run the design resolver.
4. Run the review resolver.
5. Run the testing resolver.
... (more resolvers) ...
12. Transform the frontmatter for the target host.
13. Apply path rewrites (for the target host).
14. Apply tool name rewrites (for the target host).
15. Write the output file.
```

Each step transforms the data in some way. The output is hard to predict
from the input because resolvers reference each other and share state.

## Decision

dstack's render process has exactly five steps:

```
1. Read the skill's directory: load skill.yaml and prompt.md.
2. If skill.yaml has an `includes` field, read and concatenate those
   files.
3. Build the frontmatter (YAML header) for the target host.
4. Combine frontmatter + included content + prompt body.
5. Write the output file.
```

Five steps. The output is predictable from the input. Each step is a
short function.

Steps that gstack performs but dstack does not:

- **No global preamble injection.** If a skill needs a preamble, it
  uses `includes` to add one. The skill that does not need a preamble
  does not get one.
- **No resolvers.** Resolvers are functions that inject content based
  on the skill's contents. dstack does not have them.
- **No path rewrites.** v0 ships one host (Claude Code). The output
  paths match Claude Code's expected format directly.
- **No tool name rewrites.** v0 declares Claude Code tool names
  directly. A future host adapter can rewrite tool names if needed,
  inside its own adapter file.

## Trade-offs

**Upsides (`+`)**

- Render time is proportional to the number of skills, not the number
  of skills times the number of resolvers.
- The output is easy to audit: it is the concatenation of `prompt.md`
  with the included files, prefixed by a known frontmatter format.
- The renderer fits in `ClaudeCodeRenderer.ts` (target: under 200 lines).
- There is a small test surface. Tests are direct.

**Downsides (`-`)**

- A change that affects every skill (for example, "add the same warning
  to all skills") must be made in one of two ways:
  1. Add an explicit `includes` to every skill that should have the
     warning, OR
  2. Run a one-time text-replacement script across `skills/*/prompt.md`.
  The explicit `includes` option is preferred.
- The render code does not know what the harness (Claude Code) can do.
  Skills must declare their own tool list in `skill.yaml`.

## YAGNI guard

Do not add a template engine to the renderer until a real need arises.
A real need is:

- A cross-cutting concern (some change that should appear in many
  skills) has caused a real bug, AND
- Solving it with explicit `includes` is impractical (for example, the
  change must be context-aware).

When that day comes, prefer the simplest possible solution: a
concatenation rule, or a single text-substitution step. Do not build a
plugin system.

Reason: gstack's resolvers began as four functions and grew to 17 over
time. A plugin system attracts plugins.

## Reversibility

Cheap. The renderer is the only component that produces output. Adding
a transformation step is an edit to one function. The hard part is
keeping ourselves from adding such steps before the need is real.

## References

- gstack's `scripts/resolvers/` directory contains 17 files, totaling
  about 4,500 lines. Each resolver had a reason for existing. The total
  cost is what made this rewrite worth doing.
