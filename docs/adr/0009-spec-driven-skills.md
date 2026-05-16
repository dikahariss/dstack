# ADR-0009 — Each skill ships a contract (inputs / outputs / tools)

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Cheap. The contract is a YAML schema. Loosening it
  is backwards-compatible. Tightening it requires data migration.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Contract | A declared promise about what a skill does. Includes the tools it uses, the inputs it accepts, and the outputs it produces. |
| Tool | A capability the harness (Claude Code) provides to a skill. Examples: `Bash`, `Edit`, `Read`. |
| Static validation | Checking the contract before running the skill. No LLM call needed. |
| Eval | "Evaluation." A test that runs the skill and judges the result. Often expensive because it requires an LLM call. |

## Context

gstack skills are written as prose in Markdown. A reader cannot tell
what tools `/ship` will use, what files it will touch, or what success
looks like, without reading the full `SKILL.md` (about 35,000 tokens
for `/ship`).

To make sure a skill still works after a change, gstack runs LLM-judge
evaluations. These cost about USD 0.15 per run.

A declared contract — structured metadata about what a skill promises —
would let us do several things without running the LLM:

- Check that the tools a skill declares match the harness's tool list.
  A skill that calls a non-existent tool would fail before the LLM is
  invoked.
- Generate documentation automatically. Each skill would describe
  itself.
- Enforce a per-skill token budget at render time. A skill that grew
  too large would fail the build.
- Run cheap regression tests by validating output shape before
  triggering paid LLM evaluations.

## Decision

Every `skill.yaml` declares the following fields. The renderer validates
the YAML at build time and fails if anything is missing or invalid.

```yaml
# Required: identity
id: ship                              # The skill's unique id.
version: 1.0.0                        # Semantic version. Bumped when behavior changes.
description: |                        # One paragraph. Shown in skill listings.
  Ship the current branch as a pull request. Bumps the version,
  writes the CHANGELOG, opens a pull request.

# Required: tool surface
tools:                                # The list of tools this skill uses.
  - Bash
  - Edit
  - Read
  - AskUserQuestion

# Optional: inputs (the skill expects values from the caller)
inputs:
  - name: base_branch
    type: string
    required: false
    default: auto-detect

# Optional: outputs (the skill promises to produce values)
outputs:
  - name: pr_url
    type: url

# Required: budget
context_budget_tokens: 8000           # Hard limit on rendered output size.

# Optional: routing hints
triggers:                             # Natural-language phrases that should route here.
  - "ship this"
  - "create PR"
  - "land the branch"
```

The full schema is documented in `docs/specs/skill-spec.md`.

## Trade-offs

**Upsides (`+`)**

- Static validation catches a class of bugs before any paid LLM call.
- Documentation generation is free. Every skill describes itself.
- The context budget is enforced at render time, not after the LLM call.
- Tools are declared, not inferred from prose. Permission boundaries
  are clear.

**Downsides (`-`)**

- Contributor friction. A new skill needs both a YAML spec and a prompt
  body. We accept this cost. The spec is forcing function, not paperwork.
- The schema itself is a thing to maintain. We accept this cost too.

## YAGNI guard

Do not add fields speculatively. Each field listed above maps to a
concrete use case:

- `tools` → permission enforcement and validation
- `inputs` and `outputs` → contract testing (when those tests are
  written)
- `context_budget_tokens` → enforces [ADR-0010](0010-context-budget.md)
- `triggers` → routing hints used by host adapters that support routing

Do not add fields like `cost_estimate`, `priority`, `tags`, or
`category` until a real use case appears. The bar: two real users, each
giving three real reasons.

## Reversibility

Cheap. The contract is a YAML schema. Removing a field is
backwards-compatible. Adding a field requires updating each existing
skill but is mechanical work.

## References

- gstack has an `allowed-tools` field in skill frontmatter. dstack
  extends the same idea into a full contract.
- See [ADR-0010](0010-context-budget.md) for how `context_budget_tokens`
  is enforced.
