# ADR-0024 — Catalog breadth over strict YAGNI for proven reference skills

## Context

dstack's YAGNI discipline is recorded across three DEFERRED registers
(v1, v2, v3) and the v3 reference audit ([RESEARCH.md](../plans/v3/RESEARCH.md)).
Several superpowers skills were held back on strict-YAGNI grounds: the
subagent-dispatch skills (v3 D26, listed under "rejected for v3"),
worktree/parallel tooling (v1 D9), and more generally a posture of
"do not add a skill until a named in-repo need fires its trigger."

On 2026-06-02 the sole user and author directed importing the remaining
proven superpowers skills "copy as-is for now," explicitly relaxing
YAGNI for skill *content*. The reasoning: a skill already field-tested
in a named reference catalog carries low correctness risk and real
upside, and the cost of repeatedly re-litigating each import against the
DEFERRED registers exceeds the cost of carrying it.

This created a documented tension: the planning docs say "resist
building," while the catalog now ships those skills. This ADR records
the decision that resolves the tension so future agents stop
re-litigating it per skill.

## Decision

For skill **content** (a `SKILL.md` body plus its bundled resources),
prefer catalog breadth over strict YAGNI **when** the skill is already
proven in a named reference catalog (superpowers, anthropics-skills,
mattpocock) AND the user wants it. Import it, adapt it to dstack
conventions, and ship it — without waiting for a named in-repo trigger.

The relaxation is scoped to skill content only. It does **not** touch
engine, renderer, ports, or architecture YAGNI:

- ADR-0001 (no IO in domain), ADR-0003/0004 (skills are data; no
  template engine), and ADR-0002 (single host) all stand unchanged.
- D26's bar holds for **catalog-renderer primitives**: dstack still
  renders no orchestration. Importing prose skills that *describe*
  subagent use is explicitly permitted by D26 itself ("Skills can
  describe subagent usage in the prompt body. No catalog support
  needed.").

This supersedes only the *skill-content* dimension of the affected
"rejected/deferred" entries — not their renderer-primitive dimension.

## Trade-offs

- `+` The catalog covers the full proven workflow loop; the user gets
  the skills they want without per-skill litigation.
- `+` Lower discovery cost: future agents stop grading each import
  against the DEFERRED registers.
- `+` Proven skills carry low correctness risk — already field-tested
  upstream.
- `-` The catalog grows faster than strict in-repo need; some skills
  may rarely fire.
- `-` More skills means more trigger-overlap surface to keep
  de-conflicted (handled by the hardening pass, not by holding skills
  back).
- `-` Weakens the "every feature needs a named trigger" discipline at
  the content layer — mitigated by the "proven in a reference catalog"
  gate.

## YAGNI guard

This ADR relaxes YAGNI for skill content only. It does **not** apply to
engine, renderer, ports, or architecture — those still require a named
trigger (see the DEFERRED registers and ADR-0001/0004). A novel,
unproven skill idea is also out of scope: it still needs the
`/writing-skills` baseline-test discipline before it ships. If catalog
growth ever causes trigger mis-selection that a de-confliction pass
cannot fix, revisit (consider bucket organisation, M55, or culling).

## Reversibility

Cheap. Reverting means deleting skill folders; no code or contract
changes, because skills are data (ADR-0003).

## Status

Accepted.
