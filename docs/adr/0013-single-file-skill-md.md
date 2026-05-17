# ADR-0013 — Single-file `SKILL.md` source format

- **Status:** Accepted
- **Date:** 2026-05-17
- **Reversibility:** Cheap. A one-shot script splits each `SKILL.md`
  back into the v1 `skill.yaml` + `prompt.md` pair.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Source file | The file an author edits. The renderer reads this, validates it, and produces the on-disk `SKILL.md` the host loads. |
| Frontmatter | A YAML block fenced by `---` at the top of a Markdown file. |
| Body | The Markdown text below the frontmatter. |
| Standard | The Agent Skills format published at agentskills.io and supported by 16+ tools. |

## Context

dstack v1 splits each skill into two source files: `skills/<id>/skill.yaml`
(metadata) and `skills/<id>/prompt.md` (body). The renderer combines them
into a single output `SKILL.md`.

The Agent Skills standard at agentskills.io uses one source file:
`skills/<id>/SKILL.md` with YAML frontmatter at the top and Markdown
body below. Every ecosystem catalog the dstack v2 research surveyed —
`anthropics/skills`, `mattpocock/skills`, `obra/superpowers`,
`gstack`'s `SKILL.md.tmpl` — converges on single-file source.

The v1 split is the outlier. It creates three frictions:

1. **Paste mismatch.** Copying a skill from `anthropics/skills` into
   `dstack/skills/` requires splitting the frontmatter from the body
   by hand.
2. **Mental model mismatch.** Standard skills are "one file per
   skill." dstack authors switch contexts.
3. **Diff noise.** A reordered field in `skill.yaml` produces a noisy
   diff that doesn't reflect a body change.

The win of the split was strict YAML schema completion in the editor.
[ADR-0014](0014-metadata-namespace.md) shows that strict completion is
still possible against the agentskills.io schema with single-file
source.

## Decision

A skill is a directory under `skills/` containing exactly one required
file: `SKILL.md`. Optional bundled resources go in subdirectories (see
[ADR-0017](0017-bundled-resources.md)).

```
skills/<skill-id>/
├── SKILL.md          # Required: YAML frontmatter + Markdown body
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, fonts, data
└── LICENSE.txt       # Optional
```

`SKILL.md` shape:

```markdown
---
name: skill-id
description: One-paragraph description with trigger phrasing.
license: MIT
metadata:
  dstack:
    type: hybrid
    version: 0.2.0
    triggers: [tdd, test first]
    context_budget_tokens: 4000
---

# /skill-id

Prompt body here...
```

The renderer reads this single file and emits a strict spec-compliant
`.claude/skills/<skill-id>/SKILL.md` (see [ADR-0014](0014-metadata-namespace.md)
for which top-level fields are emitted).

Migration of v1 skills: a one-shot `bun run migrate-v2` reads each
`skill.yaml` + `prompt.md` pair, merges into `SKILL.md`, moves
dstack-only fields under `metadata.dstack.*`, and deletes the old
files.

## Trade-offs

**Upsides (`+`)**

- A skill folder copied from `anthropics/skills` works in dstack with
  zero conversion.
- One source file per skill. One mental model.
- Diffs reflect intent: a frontmatter change shows in the same file
  as the body change.
- The source file and the rendered output have the same shape, only
  with the dstack-only fields stripped or rewritten. Easier to debug.

**Downsides (`-`)**

- Authors lose dedicated YAML editor completion for the frontmatter.
  Editor support for Markdown-with-YAML-frontmatter exists (JSON
  Schema via VS Code Markdown extensions) but is less ubiquitous.
- The v1 source format is no longer accepted. v1 → v2 requires a
  one-shot migration.

## YAGNI guard

Do not support both source formats. A dual-mode parser doubles the
parse-tree shape and surfaces every test through two paths. The
migration cost is one command and one commit; the cost of carrying
both formats is permanent.

Do not invent dstack-specific frontmatter rules beyond what the
agentskills.io spec allows. Top-level keys are the spec's; dstack
extensions live under `metadata.dstack.*` (see ADR-0014).

## Reversibility

Cheap. A one-shot script splits each `SKILL.md` back into
`skill.yaml` + `prompt.md` and unwraps `metadata.dstack.*` into top-
level fields. The reverse migration is symmetric to the forward
migration.

## References

- agentskills.io specification.
- `anthropics/skills` reference catalog — the canonical single-file
  source pattern.
- [v2 RESEARCH.md](../plans/v2/RESEARCH.md) Finding 6 — empirical
  distribution.
- [v2 ROADMAP.md](../plans/v2/ROADMAP.md) M21 — the milestone that
  implements this decision.
- [ADR-0003](0003-skill-as-data.md) — the original "skills are
  YAML + Markdown" decision. This ADR refines its file layout
  (single vs. two-file) without changing its substance (no template
  engine, no resolvers).
