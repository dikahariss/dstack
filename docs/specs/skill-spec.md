# Skill specification

This document defines what a skill is on disk: the directory layout, the
`skill.yaml` schema, and the `prompt.md` rules. It also lists the
validation rules the renderer applies before it processes a skill.

This spec is one of four. The others are:

- [host-spec.md](host-spec.md) — what defines a target AI host (Claude Code, etc.).
- [render-spec.md](render-spec.md) — how a skill is turned into output for a host.
- [install-spec.md](install-spec.md) — how rendered output is written to disk.

## Terms used in this document

| Term | Definition |
|---|---|
| Skill | A package of behavior that an AI agent (Claude Code) runs when the user types `/<skill-id>`. |
| Renderer | The dstack component that reads a skill and writes the output file Claude Code consumes. The renderer's full contract is in [render-spec.md](render-spec.md). |
| Frontmatter | A YAML block at the top of a Markdown file, between `---` fences. Claude Code reads frontmatter from `SKILL.md` files. |
| Tool | A capability the host (Claude Code) provides to the LLM. Examples: `Bash`, `Edit`, `Read`. Defined in [host-spec.md](host-spec.md). |
| Token | The unit of text size that LLMs measure. About 1 token per 4 characters of English. |
| Validation | Checking that a value meets the rules listed below. Failed validation causes the build to fail. |
| Computation type | One of four ways a skill performs its work. Defined in [skill-taxonomy.md](../skill-taxonomy.md). |

## On-disk layout

Each skill lives in one directory under `skills/`. The directory
contains exactly two files:

```
skills/<skill-id>/
├── skill.yaml      # Required. Metadata and contract.
└── prompt.md       # Required. The prompt body the LLM reads.
```

Optional shared content lives in `skills/_shared/`. Files there can be
referenced from `skill.yaml`'s `includes` field. See "Includes" below.

## The `skill.yaml` schema

Each field is listed below. Required fields must be present in every
`skill.yaml`. Optional fields may be omitted.

```yaml
# REQUIRED FIELDS

id: string
  # Globally unique. Lowercase letters, digits, hyphens.
  # Must start with a letter. 1 to 64 characters.
  # Must match the directory name.

version: string
  # Semantic version. Examples: "1.0.0", "0.2.1", "2.0.0".
  # Bumped when the prompt or contract changes (see "Versioning rule" below).

description: string
  # One paragraph. Used in skill listings. Up to 200 words.

tools: [list of tool names]
  # The tools this skill is allowed to use.
  # Each name must be in the host's tool registry.
  # The Claude Code tool registry is defined in host-spec.md.

context_budget_tokens: integer
  # The maximum number of tokens the rendered output may contain.
  # Default if omitted: 4000.
  # Hard ceiling: 16000 (set by ADR-0010).

# OPTIONAL FIELDS

inputs:
  # A list of values the skill expects from the caller (the user or another skill).
  - name: string                 # snake_case
    type: string | number | boolean | url | path
    required: boolean            # default: false
    default: any                 # only allowed if required is false
    description: string          # optional, but recommended

outputs:
  # A list of values the skill promises to produce.
  - name: string
    type: string | number | boolean | url | path | record
    description: string

triggers:
  # A list of natural-language phrases. Hosts that support routing may
  # use these to map a user's intent to this skill.
  - string

includes:
  # A list of shared Markdown files to include before the prompt body.
  # Each path is relative to `skills/`.
  - _shared/<filename>.md
```

## The `prompt.md` file

`prompt.md` is plain Markdown. The renderer treats it as text. There is
no template syntax. There is no `{{variable}}` substitution. There is no
Handlebars or Mustache.

If a skill needs to mention one of its `inputs` in the prompt, it does
so in plain prose:

```markdown
This skill expects an input called `base_branch`. If the caller did
not provide it, detect the branch by running `gh pr view`.
```

The renderer does not substitute `base_branch` anywhere. The host
provides input values to the LLM through the host's own mechanism. See
[render-spec.md](render-spec.md) for how the prompt is wrapped with
frontmatter.

## Includes

A skill can declare an `includes` field listing shared Markdown files
under `skills/_shared/`. The renderer concatenates the included files
before the `prompt.md` body. See [render-spec.md](render-spec.md) for
the exact ordering and cycle-detection rules.

Use `includes` when:

- The same paragraph of guidance appears in 5 or more skills, AND
- Editing it in one place is preferable to copying.

Do not use `includes` to build a hidden preamble system. Each include
must be referenced by name in the skill that uses it. See
[ADR-0003](../adr/0003-skill-as-data.md) for the reasoning.

## Validation rules (enforced by the renderer)

The renderer fails the build if any rule below is broken. Severity
"Error" means the build stops. Severity "Warning" means the build
continues but prints a message.

| Rule | Severity | What happens if broken |
|---|---|---|
| `id` matches the directory name | Error | Build fails. |
| `id` is unique across all skills | Error | Build fails. |
| `version` is valid semantic version | Error | Build fails. |
| Every entry in `tools` is in the host's tool registry | Error | Build fails. See [host-spec.md](host-spec.md). |
| `context_budget_tokens` is in the range (0, 16000] | Error | Build fails. The ceiling is set by [ADR-0010](../adr/0010-context-budget.md). |
| Rendered output token count ≤ `context_budget_tokens` | Error | Build fails. |
| `prompt.md` exists and is not empty | Error | Build fails. |
| Each path in `includes` resolves to a real file | Error | Build fails. |
| An input with `required: true` does not also have a `default` | Error | Build fails. |
| Two skills declare overlapping `triggers` | Warning | Build continues. Warning is printed. |
| `description` is more than 200 words | Warning | Build continues. Warning is printed. |

## Computation type (not in the schema today)

A skill's computation type — Deterministic, Open-ended Semantic,
Hybrid, or Schema-constrained Semantic — is described in
[skill-taxonomy.md](../skill-taxonomy.md). The schema today does not
encode this. Adding it would require:

1. A new ADR proposing the addition.
2. A new optional field in `skill.yaml`, for example: `type: hybrid`.
3. Updates to the parser in `src/adapters/fs/FileSkillRepository.ts`.

This is a known evolution path, not committed. See `plan/v1/DEFERRED.md`
for status.

## Example: minimal valid skill

The smallest valid skill is in `skills/example-greet/`. The yaml file
looks like this:

```yaml
id: example-greet
version: 1.0.0
description: |
  Greet the user by name. Demonstrates the minimal skill spec: required
  fields only, no inputs, no outputs, no includes.
tools:
  - AskUserQuestion
context_budget_tokens: 1000
triggers:
  - "say hi"
  - "greet me"
```

The matching `prompt.md` is two sentences of instructions plus a closing
note. See `skills/example-greet/prompt.md`.

## Versioning rule

Bump the `version` field when:

- The semantics of `prompt.md` change (not just typos).
- The `tools` list changes.
- The `inputs` or `outputs` schema changes.
- `context_budget_tokens` increases.

Do not bump the version for:

- Typo fixes that do not change meaning.
- Formatting changes (whitespace, line breaks) in `prompt.md`.

dstack uses semantic versioning:

- Major bump (1.0.0 → 2.0.0): a change that breaks callers.
- Minor bump (1.0.0 → 1.1.0): a new feature that is backwards-compatible.
- Patch bump (1.0.0 → 1.0.1): a fix that does not change behavior visibly.

## Things not to do

The following are anti-patterns. The renderer does not detect them
automatically, but they are wrong.

- **Putting prompt text inside `skill.yaml`.** The yaml file is for
  metadata. The prompt is `prompt.md`. Do not mix them.
- **Declaring a tool you do not use.** The point of the `tools` field
  is to declare a true permission set. List only the tools the skill
  actually uses.
- **Setting `context_budget_tokens` to match whatever the prompt
  happens to be.** Pick a budget first, then keep the prompt under it.
  The budget is a constraint, not a measurement.
- **Adding fields not in this schema.** If a new field is needed, write
  an ADR proposing it. Do not invent fields.

## How to add a new field

To add a new field to the schema:

1. Write an ADR explaining the use case.
2. Update this document.
3. Update the parser in `src/adapters/fs/FileSkillRepository.ts`.
4. Update the validation rules table above.
5. Run `bun test` to confirm existing skills still parse.

## Cross-references

- [host-spec.md](host-spec.md) — the tool registry that `tools` is
  validated against.
- [render-spec.md](render-spec.md) — what the renderer does with a
  parsed skill.
- [install-spec.md](install-spec.md) — how the rendered output reaches
  disk.
- [skill-taxonomy.md](../skill-taxonomy.md) — the design framework for
  choosing how a skill works.
- [ADR-0003](../adr/0003-skill-as-data.md) — why skills are not
  template-engined.
- [ADR-0009](../adr/0009-spec-driven-skills.md) — why skills declare a
  contract.
- [ADR-0010](../adr/0010-context-budget.md) — the token budget rule.
