# ADR-0025 — Hybrid by default: deterministic spine + named judgment, with a calibration flag

- **Status:** Superseded by [ADR-0030](0030-sonnet5-calibrated-skill-shape.md)
- **Date:** 2026-06-04
- **Reversibility:** Cheap.

> **Superseded in part (2026-08-14).** The four calibration bands below are
> carried forward by [ADR-0030](0030-sonnet5-calibrated-skill-shape.md)
> unchanged, and every `metadata.dstack.calibration` value keeps its meaning.
> What ADR-0030 replaces is the **governance clause** — the asymmetry where
> rails cost a written rationale and freedom costs empirical evidence. That
> asymmetry proved to be a one-way ratchet: by 2026-08-14 the catalog held 13
> `deterministic-dominant` skills against 1 `judgment-dominant`, with no
> procedure that had ever removed a rail. ADR-0030 charges both directions the
> same evidence and defines an ablation protocol to produce it.

## Context

The catalog has 18 skills. The v4 audit (docs/plans/v4/RESEARCH.md) found
the benchmark-winning skills (debugging, tdd, verification) already pair a
deterministic spine with AI judgment, while weaker skills rarely *name*
where judgment takes over. One skill (careful) does not declare the
type/side_effects/agency triplet at all.

The owner's direction: every skill is "hybrid by default" — roughly 30%
deterministic, 70% AI semantic, with the agent free to research the latest
but channeled by rails and the final decision left to the agent. BUT the
30% is a default, not a law: the deterministic share is a spectrum (10%,
20%, 30% default, up to ~80%), and some skills should be marked as mostly
AI-semantic — only when testing shows the default is sub-optimal and the
owner decides it.

Tension: the computation-type taxonomy (ADR-0015) defines deterministic as
*no LLM at runtime* and rejected a hard-coded default-Hybrid type. So
"hybrid by default" must NOT mean "set type: hybrid everywhere."

## Decision

Adopt a freedom-calibration doctrine on an axis SEPARATE from type. Every
skill body must carry (1) a deterministic spine and (2) a named judgment
surface. The *amount* of spine is chosen from four bands on a spectrum:

| Band | Deterministic share |
|---|---|
| judgment-dominant | 10–20% |
| workflow (DEFAULT) | ~30% |
| deterministic-dominant | 60–80%+ |
| schema-meta | n/a (schema or routing) |

Record the band with an optional frontmatter flag,
`metadata.dstack.calibration` (omitted = workflow). It is rendered into
the output frontmatter so a cheap model sees the band directly. It does
NOT change type. type: deterministic skills omit it.

Governance is asymmetric. A skill stays workflow by default. Moving to
judgment-dominant (more AI freedom) requires empirical evidence (a
benchmark, UAT, or test) that the default over-constrains, PLUS owner
approval. Moving to deterministic-dominant or schema-meta (more rails)
requires only a documented rationale, PLUS owner approval. Record the
evidence and the decision in the skill's ## Changes.

This does NOT change ADR-0015. type stays inferred-from-structure with a
semantic fallback; most skills remain type: semantic. The doctrine governs
prompt structure and the calibration flag, not the type enum.

Enforcement is light: the doctrine lives in /writing-skills, the playbook,
and CLAUDE.md. One band-aware build *warning* (missing-spine) flags a
workflow/deterministic-dominant skill whose body has no ordered list,
table, or checklist. judgment-dominant, schema-meta, and type:
deterministic skills are exempt. No hard error gate (deferred, D29).

## Trade-offs

- `+` Formalizes and spreads what the benchmark-winning skills already do.
- `+` The flag makes each skill's band explicit and cheap-model-readable.
- `+` Asymmetric governance: AI freedom is earned by proof; rails are cheap.
- `+` type (ADR-0015) semantics are untouched.
- `-` One new optional frontmatter field to learn (mitigated: default
  workflow; most skills omit it).
- `-` The spine warning is a heuristic; it can false-positive — mitigated:
  warning not error, and three bands are exempt.

## YAGNI guard

Do not add a hard validate ERROR gate now (D29 holds the trigger). Do not
force type: hybrid. Do not add scripts to a skill with no ground truth to
read (taxonomy anti-pattern #6). Do not add bands beyond the four; a skill
that fits none needs an ADR, not a quiet new enum value.

## Reversibility

Cheap. The doctrine is docs + skill content (skills are data, ADR-0003).
The code change (one union type, one optional field, one warning kind,
~30 lines + fixtures) reverts by deletion; skills that set the flag keep
it harmlessly under metadata.dstack.

## References

- [ADR-0015](0015-type-taxonomy-adoption.md) — the type axis this sits beside.
- [docs/skill-quality-playbook.md](../skill-quality-playbook.md) §1.15.
- [docs/plans/v4/RESEARCH.md](../plans/v4/RESEARCH.md) — band analysis.
- [docs/plans/v4/skill-hybrid-by-default-plan.md](../plans/v4/skill-hybrid-by-default-plan.md) — rollout.
