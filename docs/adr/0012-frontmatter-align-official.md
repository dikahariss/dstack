# ADR-0012 — Frontmatter alignment with the official Agent Skills schema

- **Status:** Accepted
- **Date:** 2026-05-16
- **Reversibility:** Cheap. The change is a YAML-key rename plus two
  optional additive fields. A find-and-replace restores the prior shape.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Official schema | The Agent Skills specification published at agentskills.io and implemented by `anthropics-skills` — Anthropic's reference catalog. |
| Frontmatter | The YAML block at the top of a skill's input file (`skill.yaml`) and at the top of the rendered output file (`SKILL.md`). |
| Input shape | The fields a `skill.yaml` author writes. |
| Output shape | The frontmatter fields the renderer writes into the `SKILL.md` Claude Code consumes. |

## Context

ROADMAP M19 commits dstack to staying compatible with the official
Agent Skills schema. The catalog in `anthropics-skills` uses two
required fields and four optional ones:

| Field | Required? | Constraint |
|---|---|---|
| `name` | required | 1–64 chars, lowercase + hyphens, matches the parent dir |
| `description` | required | 1–1024 chars; embeds the trigger phrasing |
| `license` | optional | short license string or pointer (`Apache-2.0`, `Proprietary. LICENSE.txt has complete terms`) |
| `compatibility` | optional | env requirement (`Requires Python 3.14+`) |
| `metadata` | optional | arbitrary key→string map |
| `allowed-tools` | optional, experimental | space-separated tool list |

dstack's input shape diverges in three places:

1. The identifier field is named `id:`, not `name:`. Internally
   dstack's `SkillId` value object and `SkillSpec.id` field carry
   the same idea, but the YAML key forces a rename when a user
   pastes an `anthropics-skills` example into a dstack skill folder.
2. `license` is absent. Every one of the 19 official skills carries
   one; porting drops the field.
3. `compatibility` is absent. The official spec uses it to document
   environment requirements (Python version, system packages).

M1 will port five skills. Doing the schema migration first costs one
commit and avoids renaming `name:` in every ported skill later.

The renderer **output** already follows the official shape — it emits
`name:`, `version:`, `description:`, `allowed-tools:` in the rendered
`SKILL.md`. The gap is only on the input side.

## Decision

**Rename the input YAML key `id:` to `name:`.** The internal
TypeScript identifier `SkillSpec.id` stays — it refers to the
`SkillId` value object, not the YAML key — so error messages and CLI
output keep their existing wording.

**Add two optional fields to the input schema:**

- `license: string` — license name or pointer. No format enforcement.
- `compatibility: string` — environment requirement. No format
  enforcement.

The renderer forwards both fields into the output frontmatter when
present, so Claude Code (and any future host) sees what the author
wrote.

**Keep dstack-only fields.** These have no official equivalent and
cover concerns the spec leaves to the host:

- `version` (top-level semver) — supports the version-bump rule in
  `docs/specs/skill-spec.md`.
- `tools: [list]` — array form is cleaner than the official's
  experimental space-separated `allowed-tools` string and renders to
  the same output key.
- `context_budget_tokens` — enforced by ADR-0010.
- `triggers: [list]` — structured array complementing the free-form
  description.
- `includes: [list]` — progressive disclosure (ADR-0003).

**Reject the experimental and low-value fields.** `allowed-tools`
(input side) is experimental and string-typed; dstack's `tools:`
array is strictly better. `metadata` (a free-form map) duplicates the
top-level `version` field for the only known use case and adds
ambiguity; skip until a concrete consumer asks.

## Trade-offs

**Upsides (`+`)**

- Skills copied from `anthropics-skills` paste into a dstack folder
  with no key rename.
- License metadata round-trips through render so downstream tools see
  it. Today's renderer would silently drop it.
- The migration is one ADR + one commit; doing it after M1 would
  rename five skill files.

**Downsides (`-`)**

- One breaking input change: every existing `skill.yaml` (the live
  `careful` skill plus nine test fixtures) flips `id:` → `name:`.
- Doc cascade: `docs/specs/skill-spec.md`, the changelog, and the
  ADR index all need updating.

## YAGNI guard

Do not add `metadata` until a real skill needs it. Top-level
`version` covers the case dstack ships today.

Do not enforce `license` as required. Catalog skills authored
in-house typically omit it; making it required would punish that
case.

Do not duplicate the input `allowed-tools` string field. The output
side already emits `allowed-tools:` because Claude Code consumes that
key; the **input** side keeps dstack's array `tools:` because authors
write a list, not a space-joined string.

## Reversibility

Cheap. To revert:

1. Rename `name:` back to `id:` across `skill.yaml` files (one find-
   and-replace).
2. Remove the `license` and `compatibility` parser branches.
3. Restore the prior `docs/specs/skill-spec.md` schema section.

No public API change follows from the migration — `dstack build`,
`dstack render`, `dstack validate`, and `dstack new` all keep their
behavior. Only the input YAML key changes.

## References

- agentskills.io — the official specification.
- `anthropics-skills/` — the reference catalog (19 skills) that this
  decision aligns dstack with.
- ADR-0003 — skills are YAML + Markdown; the schema is part of the
  contract.
- ADR-0009 — each skill ships a contract; the field set is part of it.
- ADR-0010 — the `context_budget_tokens` field this ADR preserves.
- ROADMAP M19 — official-skills compatibility milestone.
