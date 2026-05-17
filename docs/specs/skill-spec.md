# Skill specification (v2)

This document defines what a skill is on disk: the directory layout, the
`SKILL.md` frontmatter schema, the body rules, and the bundled-resource
contract. It also lists the validation rules the parser and renderer
apply before a skill is built.

This spec is one of four. The others are:

- [host-spec.md](host-spec.md) — what defines a target AI host (Claude Code, etc.).
- [render-spec.md](render-spec.md) — how a skill is turned into output for a host.
- [install-spec.md](install-spec.md) — how rendered output is written to disk.

## Terms used in this document

| Term | Definition |
|---|---|
| Skill | A package of behavior an AI agent (Claude Code) runs when the user types `/<skill-id>`. |
| SKILL.md | The single source file. YAML frontmatter (between `---` fences) plus a Markdown body. |
| Frontmatter | The YAML block at the top of `SKILL.md`. Carries `name`, `description`, `allowed-tools`, optional `license` / `compatibility`, and a `metadata.dstack.*` namespace for dstack-specific fields. |
| Bundled resources | Files under the skill folder (e.g. `scripts/`, `references/`, `assets/`) that ship alongside the prompt. Not included in the prompt body and not counted against the token budget. |
| Tool | A capability the host (Claude Code) provides to the LLM. Examples: `Bash`, `Edit`, `Read`. Defined in [host-spec.md](host-spec.md). |
| Token | The unit of text size that LLMs measure. About 1 token per 4 characters of English. |
| Validation | Checking that a value meets the rules listed below. Failed validation causes the build to fail. |
| Computation type | One of four ways a skill performs its work: `deterministic`, `semantic`, `hybrid`, `schema-semantic`. Defined in [skill-taxonomy.md](../skill-taxonomy.md). |

## On-disk layout

Each skill lives in one directory under `skills/`. The directory must
contain `SKILL.md` and may carry bundled resources:

```
skills/<skill-id>/
├── SKILL.md            # Required. YAML frontmatter + Markdown body.
├── scripts/            # Optional. Bundled helpers (executable bit preserved).
├── references/         # Optional. Read-only context the body can point to.
├── assets/             # Optional. Binary or large reference material.
├── LICENSE.txt         # Optional. Copied verbatim to the install root.
└── <free-form>/        # Optional. Any other subfolder ships verbatim.
```

Optional shared Markdown lives in `skills/_shared/`. Files there can be
referenced from `metadata.dstack.includes`. See "Includes" below. The
`_shared/` folder is reserved — it is not treated as a skill directory.

The legacy v1 layout (`skill.yaml` + `prompt.md`) is still accepted
during the migration window. Loading a legacy skill emits a
`legacy-source-format` warning. Run `dstack migrate-v2` to convert.
See [ADR-0013](../adr/0013-single-file-skill-md.md).

## The `SKILL.md` frontmatter

```yaml
# REQUIRED (top-level, spec-compatible with agentskills.io)

name: string
  # Globally unique. Lowercase letters, digits, hyphens.
  # Must start with a letter. 1 to 64 characters.
  # Must match the directory name.

description: string
  # One paragraph. Used in skill listings. Up to 1024 characters.

allowed-tools: string | [string]
  # Either a space-separated string ("Read Bash Edit") or a YAML list.
  # Each name must be in the host's tool registry — see host-spec.md.

# OPTIONAL (top-level)

license: string
  # License name or pointer (e.g. "MIT", "Apache-2.0").
  # Forwarded verbatim. Aligned with the official Agent Skills schema.

compatibility: string
  # Environment requirement (e.g. "Requires Bun 1.3+").
  # Forwarded verbatim. Aligned with the official Agent Skills schema.

# REQUIRED (under metadata.dstack)

metadata:
  dstack:
    version: string
      # Semantic version: "1.0.0", "0.2.1", "2.0.0".
      # Bumped on every behavior change. See "Versioning rule" below.

    context_budget_tokens: integer
      # Body-only token ceiling. Default if omitted: 4000.
      # Hard ceiling: 5000 (per ADR-0016). Bundled resources are not
      # counted; they load on demand.

    # OPTIONAL (under metadata.dstack)

    type: deterministic | semantic | hybrid | schema-semantic
      # The computation type. If omitted, the parser infers from
      # structure (see "Type inference" below).

    side_effects: readonly | local | external
      # What the skill is allowed to touch. Defaults to `readonly`.

    agency: reactive | deliberative | autonomous
      # How autonomously the skill acts. Defaults to `reactive`.

    triggers: [string]
      # Natural-language phrases the host may use for routing.

    includes: [string]
      # Relative paths under `skills/`. Each file is concatenated
      # before the body. Cycles are broken with a warning.

    output_schema: object | string
      # Required iff `type: schema-semantic`. Inline JSON Schema or a
      # relative path to a JSON Schema file in the skill folder.
```

Custom frontmatter fields that are not part of the agentskills.io spec
live under `metadata.dstack.*` so they survive Claude Code's
frontmatter normalisation. See [ADR-0014](../adr/0014-metadata-namespace.md).

## The body

Everything after the closing `---` fence is plain Markdown. The renderer
treats it as text. There is no template syntax, no `{{variable}}`
substitution, no Handlebars.

If a skill needs to reference a bundled script, do it in plain prose:

```markdown
Run `scripts/get_diff.sh` via the Bash tool to fetch the diff.
```

The Installer copies the script verbatim under the skill folder, so the
relative path the body mentions matches the path Claude sees at runtime.

## Bundled resources

Files inside `scripts/`, `references/`, `assets/`, and any other
free-form subfolder ship alongside `SKILL.md` and load on demand. They
are not part of the prompt body and not counted against
`context_budget_tokens`. Per [ADR-0017](../adr/0017-bundled-resources.md):

- Symlinks are rejected. Bundled files must be real files.
- Paths that contain `..` or that resolve outside the skill folder are
  rejected.
- The executable bit is preserved on install.
- Files under `_shared/` at any level are reserved for `includes:`
  and are not copied as bundled resources of any individual skill.

## Type inference

If `metadata.dstack.type` is omitted, the parser infers a type from
structure ([ADR-0015](../adr/0015-type-taxonomy-adoption.md)):

1. `output_schema` declared → `schema-semantic`.
2. `scripts/` folder present and body ≤ 500 tokens → `deterministic`.
3. `scripts/` folder present → `hybrid`.
4. Otherwise → `semantic` (the ecosystem default).

When a declared type conflicts with the structure, the parser emits a
`type-structure-mismatch` warning. Example: `type: semantic` plus a
`scripts/` folder.

The combination `type: semantic` + `side_effects: external` +
`agency: autonomous` is rejected outright (`DangerousCombinationError`):
an unconstrained LLM with external write access and no reactive gate.

## Includes

A skill can declare `metadata.dstack.includes` listing shared Markdown
files under `skills/`. The renderer concatenates the included files
before the body. See [render-spec.md](render-spec.md) for the exact
ordering and cycle-detection rules.

Use `includes` when:

- The same paragraph of guidance appears in 5 or more skills, AND
- Editing it in one place is preferable to copying.

Do not use `includes` to build a hidden preamble system. Each include
must be referenced by name in the skill that uses it. See
[ADR-0003](../adr/0003-skill-as-data.md).

## Validation rules (enforced by the parser and renderer)

| Rule | Severity | What happens if broken |
|---|---|---|
| `name` matches the directory name | Error | Parse fails. |
| `name` is unique across all skills | Error | Build fails. |
| `metadata.dstack.version` is a non-empty string | Error | Parse fails. |
| Every entry in `allowed-tools` is in the host's tool registry | Error | Build fails. |
| `metadata.dstack.context_budget_tokens` is in (0, 5000] | Error | Parse fails. |
| Rendered body token count ≤ `context_budget_tokens` | Error | Build fails. |
| SKILL.md body is non-empty | Error | Parse fails. |
| Each path in `includes` resolves to a real file | Error | Parse fails. |
| `type: schema-semantic` requires `output_schema` | Error | Build fails (`MissingOutputSchemaError`). |
| `type: semantic` + `side_effects: external` + `agency: autonomous` | Error | Build fails (`DangerousCombinationError`). |
| Declared `type` does not match structure | Warning | Build continues. |
| Body tokens > 90% of budget | Warning | Build continues. |
| Skill ships ≥ 4 module folders (SkillsBench threshold) | Warning | Build continues. |
| Legacy `skill.yaml + prompt.md` layout detected | Warning | Build continues; suggest `migrate-v2`. |

## Example: a real Hybrid skill

`skills/code-review/SKILL.md` is the reference Hybrid example:

```yaml
---
name: code-review
description: Receive code-review feedback with technical rigor...
allowed-tools: Read Bash Grep Glob Edit
metadata:
  dstack:
    type: hybrid
    version: 0.2.0
    context_budget_tokens: 3500
    side_effects: local
    agency: deliberative
    triggers:
      - code review
      - respond to review
---
# /code-review

...body...

## Fetch the diff first

Run `scripts/get_diff.sh` via the Bash tool to get the diff that needs
review.
```

The matching `scripts/get_diff.sh` ships alongside `SKILL.md`.

## Versioning rule

Bump `metadata.dstack.version` when:

- The semantics of the body change (not just typos).
- The `allowed-tools` list changes.
- `context_budget_tokens` increases.
- A bundled script's interface changes.

Do not bump the version for typo fixes that do not change meaning, or
for whitespace-only edits.

dstack uses semantic versioning:

- Major bump (1.0.0 → 2.0.0): a change that breaks callers.
- Minor bump (1.0.0 → 1.1.0): a new feature that is backwards-compatible.
- Patch bump (1.0.0 → 1.0.1): a fix that does not change behavior visibly.

## Things not to do

- **Putting top-level dstack fields outside `metadata.dstack`.** They
  get stripped from the rendered output. See ADR-0014.
- **Declaring a tool you do not use.** `allowed-tools` is a permission
  set. List only the tools the skill actually uses.
- **Picking a budget that matches whatever the body currently is.**
  The budget is a constraint, not a measurement.
- **Adding bundled files that contain `..` or symlinks.** The
  Installer rejects both.

## How to add a new field

1. Write an ADR explaining the use case.
2. Update this document.
3. Update the parser in `src/adapters/fs/FileSkillRepository.ts`.
4. Update the validation rules table above.
5. Run `bun test` to confirm existing skills still parse.

## Cross-references

- [host-spec.md](host-spec.md) — the tool registry that `allowed-tools`
  is validated against.
- [render-spec.md](render-spec.md) — what the renderer does with a
  parsed skill.
- [install-spec.md](install-spec.md) — how the rendered output reaches
  disk.
- [skill-taxonomy.md](../skill-taxonomy.md) — the design framework for
  choosing a computation type.
- [ADR-0003](../adr/0003-skill-as-data.md) — why skills are not
  template-engined.
- [ADR-0013](../adr/0013-single-file-skill-md.md) — single-file source format.
- [ADR-0014](../adr/0014-metadata-namespace.md) — `metadata.dstack.*` namespace.
- [ADR-0015](../adr/0015-type-taxonomy-adoption.md) — type / side_effects / agency.
- [ADR-0016](../adr/0016-per-tier-token-budget.md) — body-only token budget.
- [ADR-0017](../adr/0017-bundled-resources.md) — bundled-resource contract.
