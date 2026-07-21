# ADR-0026 — Broaden the project purpose: skills plus non-skill performance content

- **Status:** Superseded by [ADR-0028](0028-renderer-only-scope.md)
- **Date:** 2026-06-14
- **Reversibility:** Cheap.

> **Superseded (2026-07-21).** The non-skill content (`docs/hpi-riset/`)
> was removed from this repository so the renderer could be published as
> a standalone open-source tool. The project scope is again renderer-only.
> See [ADR-0028](0028-renderer-only-scope.md). This ADR is kept for
> history; the reasoning below reflects the situation before the split.

## Context

dstack was founded and documented as "a skill catalog renderer for Claude
Code" (CLAUDE.md, README.md, CONTEXT.md). That describes the *tool* — the
only software in the repo. But the repo now also holds non-skill work:
`docs/hpi-riset/`, the research corpus and draft chapters for an
unpublished personal book (title and contents kept private). The owner's
stated purpose is wider than the tool: raise individual performance, by
AI skills **and** other means (the book is the first "other means").

The framing had drifted into contradiction. Three entry-point docs said
"skill catalog renderer"; `docs/README.md` already said dstack's goal is
"to raise individual performance, with AI skills *or* other means." A new
reader met two different projects.

## Decision

State the purpose at two levels and keep them distinct.

- **Project purpose (broad).** dstack exists to raise the owner's
  individual performance, on two tracks: (1) **skills** — AI agent
  workflows rendered for Claude Code; (2) **non-skill content** —
  evidence-based research and writing on high performance (today:
  `docs/hpi-riset/`).
- **Tool scope (narrow, unchanged).** The software stays exactly what it
  was: it reads skills from `skills/<id>/`, validates them, and writes
  `.claude/skills/<id>/SKILL.md`. Non-skill content is static; the
  renderer never reads, transforms, or emits it.

Lead with the purpose in CLAUDE.md, README.md, and CONTEXT.md; describe
the renderer as the mechanism, not the mission.

**This broadening grants no new feature license.** It is a statement of
purpose, not a roadmap. Every DEFERRED item (D1–D11) stands on its own
trigger; D8 ("the dstack tool is a skill catalog renderer, not a product
surface") remains in force. "It serves the mission" is never, by itself,
a reason to build — new software earns its place through the same YAGNI
gates and ADRs as before.

## Trade-offs

- `+` Resolves the contradiction; one coherent story across all entry docs.
- `+` Records the owner's actual intent, so non-skill work is first-class,
  not clutter to be deleted by a future reader.
- `+` The explicit "no feature license" clause makes the wider purpose
  un-weaponizable for scope creep — the fence is now written down.
- `-` A broad purpose invites "is X mission-aligned?" requests; mitigated
  by the clause above and by keeping tool scope frozen.
- `-` Leading with mission risks marketing tone; mitigated by the terse
  voice rule (CLAUDE.md "Voice") — state purpose flatly, no adjectives.

## YAGNI guard

The broadening is documentation only. Do NOT: add a port, adapter, or
build step for non-skill content; make the renderer aware of
`docs/hpi-riset/`; treat the book as a pipeline input; or cite "the
mission" to justify a DEFERRED feature. A second non-skill track that
ever needs tooling gets its own ADR. Until then this ADR changes words,
not code.

## Reversibility

Cheap. Pure documentation. Revert by restoring the three entry-doc
openings; no code, schema, or test depends on it.

## References

- [docs/README.md](../README.md) — the broad-purpose statement this ADR makes authoritative.
- [ADR-0002](0002-single-host-v0.md) — tool/host scope, unchanged.
- [docs/plans/v1/DEFERRED.md](../plans/v1/DEFERRED.md) — D8 "not a product surface", still in force.
