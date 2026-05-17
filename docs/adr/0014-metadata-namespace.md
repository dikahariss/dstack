# ADR-0014 — `metadata.dstack.*` namespace for non-standard fields

- **Status:** Accepted
- **Date:** 2026-05-17
- **Reversibility:** Cheap. A find-and-replace moves keys back to
  top-level frontmatter.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Top-level frontmatter | The keys directly inside the `---` block at the top of `SKILL.md`. |
| `metadata` field | The optional catch-all map the agentskills.io spec defines for non-standard properties. |
| Namespace | A key prefix that scopes ownership of extension keys. |
| Strict compliance | The rendered output passes the agentskills.io schema validator without warnings. |

## Context

The agentskills.io specification defines six top-level frontmatter
fields and explicitly reserves `metadata` for "additional properties
not defined by the Agent Skills spec":

| Field | Required | Purpose |
|---|---|---|
| `name` | Yes | Identifier |
| `description` | Yes | Triggering and intent |
| `license` | No | License string or pointer |
| `compatibility` | No | Environment requirement |
| `metadata` | No | Arbitrary key/value map for extensions |
| `allowed-tools` | No (experimental) | Space-separated tool list |

dstack v1 emits `version`, `triggers`, `tools`, and
`context_budget_tokens` at the top level. None are in the spec.
Several v2 additions also have no spec equivalent: `type`,
`side_effects`, `agency`, `output_schema`.

Two empirical facts make placement consequential:

- [Issue anthropics/claude-code#13005](https://github.com/anthropics/claude-code/issues/13005)
  confirms that custom top-level frontmatter fields are stripped
  before reaching the model. Putting fields at the top level gains
  nothing at runtime.
- [Issue anthropics/claude-code#25380](https://github.com/anthropics/claude-code/issues/25380)
  shows the official SKILL.md validator rejects unknown top-level
  fields. dstack output today fails strict validation in several
  places.

The spec recommends "reasonably unique key names" inside `metadata`
to avoid accidental conflicts with other tooling.

## Decision

Every non-standard field lives under `metadata.dstack.*`. The
renderer's output frontmatter contains only:

- The two required spec fields: `name`, `description`.
- The three optional spec fields when set: `license`, `compatibility`,
  `metadata`.
- The experimental spec field `allowed-tools` when set, as a
  space-separated string (see ADR-0014's sibling
  [ROADMAP M23](../plans/v2/ROADMAP.md#m23-fix-allowed-tools-to-space-separated-string)).

All dstack-only metadata sits under `metadata.dstack`:

```yaml
---
name: code-review
description: Receive code-review feedback with technical rigor...
license: MIT
metadata:
  dstack:
    type: hybrid
    version: 0.2.0
    triggers:
      - code review
      - respond to review
    context_budget_tokens: 4000
    side_effects: local
    agency: deliberative
allowed-tools: Read Bash Grep Glob Edit
---
```

The source file (`skills/<id>/SKILL.md`) accepts the same shape — the
parser does not "promote" or "demote" keys.

Reserved sub-keys under `metadata.dstack` (as of v2):

| Key | Purpose | Source |
|---|---|---|
| `type` | Computation type | [ADR-0015](0015-type-taxonomy-adoption.md) |
| `version` | Semver | Renamed from v1 top-level `version` |
| `triggers` | List of natural-language trigger phrases | Renamed from v1 |
| `context_budget_tokens` | Token budget for the body | Renamed from v1 |
| `side_effects` | `readonly` / `local` / `external` | [ADR-0015](0015-type-taxonomy-adoption.md) |
| `agency` | `reactive` / `deliberative` / `autonomous` | [ADR-0015](0015-type-taxonomy-adoption.md) |
| `output_schema` | JSON Schema for schema-semantic skills | [ADR-0015](0015-type-taxonomy-adoption.md) |

Other tools that read `SKILL.md` ignore unknown keys under `metadata`.
Strict spec validators accept the shape.

## Trade-offs

**Upsides (`+`)**

- Output is strict spec-compliant. dstack-rendered `SKILL.md` works
  in Gemini CLI, Codex, Cursor, Goose, etc. without modification.
- The metadata catch-all is the spec's blessed extension path.
  Forward-compatible by design.
- Adding a new dstack-only field requires no spec coordination — pick
  a unique key under `metadata.dstack` and document it.

**Downsides (`-`)**

- One extra level of YAML nesting at read time.
- Authors familiar with v1's flat layout must re-learn where each
  field lives. Migration script handles this once.

## YAGNI guard

Do not claim namespaces beyond `dstack` (no `metadata.maritimhub.*`,
no `metadata.gstack.*`). dstack is the tool; the namespace stays
matched to the tool.

Do not promote any `metadata.dstack.*` field to top level unless the
agentskills.io spec ratifies it. The promotion is one find-and-replace
when it happens.

Do not add an opinion on what other tools put under `metadata` — only
dstack's own keys. If another tool puts something under
`metadata.cursor.*`, dstack reads, preserves, and emits it unchanged.

## Reversibility

Cheap. To revert, a find-and-replace unwraps `metadata.dstack.X` to
top-level `X` and removes the `metadata` wrapper if empty. v1 ADRs
(0009, 0010, 0012) remain as the canonical reference for the
pre-namespace shape.

## References

- agentskills.io specification — top-level field reservations.
- [Issue anthropics/claude-code#13005](https://github.com/anthropics/claude-code/issues/13005)
  — custom fields stripped before reaching model.
- [Issue anthropics/claude-code#25380](https://github.com/anthropics/claude-code/issues/25380)
  — validator rejection of extensions.
- [ADR-0012](0012-frontmatter-align-official.md) — the first step of
  spec alignment. This ADR extends 0012 by moving dstack-only fields
  out of the top level.
- [v2 RESEARCH.md](../plans/v2/RESEARCH.md) Findings 3 and 4.
