# ADR-0010 — Hard token budget per rendered skill

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Cheap. The budget is enforced at one point (the
  renderer). Raising or lowering it is one yaml or constant edit.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Token | The unit of text that LLMs measure. Roughly 1 token is 4 characters of English text. LLMs charge by tokens used. |
| Context budget | The maximum number of tokens a skill's prompt may contain. |
| Context window | The maximum number of tokens an LLM can read in one call. Modern Claude models have very large context windows (200,000 to 1,000,000 tokens). |
| Soft limit | A warning. The build continues if exceeded. |
| Hard limit | An error. The build fails if exceeded. |

## Context

It is easy for a skill to grow into the tens of thousands of tokens
once it accumulates workflow steps, examples, and shared preamble.
Soft warnings on size ("watch for feature growth") tend to become
noise: when every build prints the same warning for the same three
big skills, readers learn to scroll past it.

Modern Claude models have context windows from 200 000 to 1 000 000
tokens. A 35 000-token skill is 3 to 18 percent of the window. So
token bloat is not a correctness failure today. But it has three
real costs:

1. Latency. Longer prompts take longer for the LLM to process.
2. Prompt cache misses. Prompts that change require re-processing.
3. Reader cost. Each maintainer pays time to scroll past unrelated
   content.

The right discipline is to write a smaller skill, not to grow the
budget when the prompt grows.

## Decision

Every `skill.yaml` declares a field `context_budget_tokens: N`. After
rendering, the renderer counts the tokens in the output. If the count
exceeds the declared budget, the renderer raises a
`TokenBudgetExceededError` and the build fails.

Default values:

- The default budget for a new skill is 4,000 tokens. This is set in
  `docs/specs/skill-spec.md`.
- The hard ceiling for any skill is 16,000 tokens. A skill that
  declares more than 16,000 fails the build with an error message
  pointing at this ADR.

If a skill needs more than 16,000 tokens, the author must:

1. Write a new ADR that explains why.
2. Raise the ceiling in the renderer.

This requires a deliberate decision. The friction is intentional.

Token counting uses an offline approximation (4 characters per token,
with a 5% safety margin). The exact Anthropic tokenizer would require
a network call, an API key, and a new dependency for every build; the
approximation error (±10%) is bounded and well inside the 10% margin
between the warning threshold and the budget ceiling. Precise counting
is deferred as a future on-demand subcommand, not a build-time
requirement (see `docs/plans/v1/DEFERRED.md`).

## Trade-offs

**Upsides (`+`)**

- A budget overrun is a build error, not a warning. Errors block the
  build; warnings get ignored over time.
- The budget is part of each skill's contract. Readers can see how
  large a skill is allowed to grow.
- The discipline of writing smaller skills is enforced by code, not by
  documentation.

**Downsides (`-`)**

- Some legitimately large skills (multi-stage workflows) will need
  their own ADR before they can ship. We accept this cost. Those
  skills should declare their size explicitly.
- A skill that pulls in content at runtime (for example, reading a
  file inside the prompt's instructions) is not covered by the static
  budget. That dynamic content is the harness's concern, not the
  renderer's.

## YAGNI guard

Do not add per-host budgets unless one host has a smaller context
window than Claude. Today, this is not the case.

Do not split the budget into "instruction budget" and "context budget."
That kind of fine-grained accounting is a future optimization with no
current need.

## Reversibility

Cheap. The budget is enforced at one place (the renderer). Raising the
budget for one skill is a yaml edit. Raising the ceiling for all skills
is a one-line constant change.

## References

- Soft warnings on skill size are easy to ignore; hard budgets force
  the conversation at build time. dstack chooses the stricter
  discipline deliberately.
- See [ADR-0009](0009-spec-driven-skills.md) for how the budget is
  declared.
