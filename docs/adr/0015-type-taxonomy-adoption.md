# ADR-0015 — Adopt the four-type computation taxonomy in `skill.yaml`

- **Status:** Accepted
- **Date:** 2026-05-17
- **Reversibility:** Moderate. The `type` field becomes a parsed
  concept used by the validator and `dstack list`. Removing it means
  deleting those branches plus the metadata key.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Computation type | One of four ways a skill performs its work: `deterministic`, `semantic`, `hybrid`, `schema-semantic`. Defined in [`docs/skill-taxonomy.md`](../skill-taxonomy.md). |
| Inferred default | The type the renderer assigns when a skill does not declare one explicitly. |
| Side effects | What the skill changes in the world: `readonly`, `local`, `external`. |
| Agency | How autonomously the skill acts: `reactive`, `deliberative`, `autonomous`. |
| Anti-pattern | A combination of choices that the taxonomy or empirical research flags as harmful. |

## Context

[`docs/skill-taxonomy.md`](../skill-taxonomy.md) defines four
computation types and describes how each one should be tested,
validated, and budgeted. v1's `skill.yaml` does not encode any of it.
Section 6 of the taxonomy is explicit that adoption requires a new ADR.

Three v2 capabilities depend on a parsed type:

1. **Per-type validator** — detect when a skill claims one type but
   has the structure of another (e.g., `type: hybrid` with no
   `scripts/`).
2. **CI gate** — reject the dangerous combination `semantic + external
   + autonomous` (taxonomy Part 3 final check).
3. **Catalog audit** — `dstack list --group-by type` shows the
   catalog profile at a glance.

The empirical case for adopting the taxonomy:

- The reference catalog `anthropics/skills` is 53% Hybrid and 47%
  Open-ended Semantic ([v2 RESEARCH.md](../plans/v2/RESEARCH.md)
  Finding 6). Without a type field, neither status is recoverable
  from a single inspection.
- SkillsBench (arXiv 2602.12670, Feb 2026) shows the most effective
  skills are "Detailed" or "Compact" (2–3 modules), not
  "Comprehensive." Without `type` and `side_effects`, the validator
  cannot warn at build time.
- The taxonomy's dangerous-combination rule has no enforcement
  mechanism in v1.

The fan-out research (RESEARCH.md Findings 1, 2, 6) converged on:
**inferred-from-structure default with `semantic` as fallback**, not
a hard-coded "default Hybrid." The official ecosystem (Anthropic,
OpenAI Codex, Block/Goose, agentskills.io quickstart) defaults to
instructions-only; production-grade skills *evolve* to Hybrid.

## Decision

Adopt three new fields under `metadata.dstack.*` (see [ADR-0014](0014-metadata-namespace.md)):

```yaml
metadata:
  dstack:
    type: hybrid | semantic | deterministic | schema-semantic
    side_effects: readonly | local | external
    agency: reactive | deliberative | autonomous
```

All three are optional. Defaults follow.

### Default for `type`: inferred from structure

When `metadata.dstack.type` is not declared, the renderer infers it
in this order:

1. If `metadata.dstack.output_schema` is set → `schema-semantic`.
2. Else if a `scripts/` folder exists → `hybrid`.
3. Else if a `scripts/` folder exists AND body < 500 tokens →
   `deterministic` (this rule fires before step 2 takes effect when
   the body is unusually small).
4. Else → `semantic` (the catch-all default).

The inferred default is visible in `dstack list` with an asterisk
(`hybrid*` if inferred, `hybrid` if declared).

### Defaults for `side_effects` and `agency`

When omitted, the renderer defaults to the safest values:

- `side_effects: readonly`
- `agency: reactive`

Authors who write a skill that mutates state or runs autonomously
must declare it explicitly. The friction is intentional — these
declarations are the inputs to the dangerous-combination check.

### Validation rules tied to the new fields

The validator (M27 + M29 in [v2 ROADMAP](../plans/v2/ROADMAP.md))
runs these checks:

| Rule | Severity | Trigger |
|---|---|---|
| `type: hybrid` AND no `scripts/` folder | Warning | "Labeled Hybrid but appears Semantic." |
| `type: semantic` AND `scripts/` folder exists | Warning | "Has scripts but labeled Semantic. Consider Hybrid." |
| `type: deterministic` AND body > 1000 tokens | Warning | "Labeled Deterministic but prompt is large." |
| `type: schema-semantic` AND no `output_schema` | Error | "Schema-semantic skills must declare `output_schema`." |
| `type: semantic` AND `side_effects: external` AND `agency: autonomous` | Error | Dangerous combination (taxonomy Part 3). |
| ≥ 4 module folders under skill root | Warning | SkillsBench: comprehensive skills hurt -2.9pp. |

## Trade-offs

**Upsides (`+`)**

- Every skill in the catalog declares (or implies via structure) a
  computation type. The taxonomy stops being documentation-only.
- Per-type validation catches anti-patterns at build time, not in
  production.
- The dangerous-combination rule is enforced, not just described.
- `dstack list --group-by type` (M36) gives catalog profile at a
  glance.
- Inferred default means migration of v1 skills is mechanical —
  most are correctly classified as `semantic` from their (empty)
  structure.

**Downsides (`-`)**

- Three more fields to learn. Mitigated by sensible defaults: most
  skills can omit all three.
- The validator surface grows. Each new rule is one more thing that
  can fail a build.
- "Inferred default" means the type can change when structure
  changes (e.g., adding a `scripts/` folder upgrades the inferred
  type from `semantic` to `hybrid`). This is surprising at first and
  must be documented.

## YAGNI guard

Do not add the remaining four orthogonal axes from the taxonomy
(knowledge source, temporal pattern, coordination, statefulness)
unless a concrete validator rule or CI gate needs them. They are
descriptive in the taxonomy doc; v2 only encodes the three that have
empirical or theoretical anti-patterns attached.

Do not invent new `type` values beyond the four. If a skill does not
fit, the taxonomy needs revision (a new ADR), not a new enum value
quietly added.

Do not auto-upgrade a skill's type when its structure changes. The
inferred default applies only on a missing declaration. A declared
`type: semantic` with `scripts/` present produces a warning, not a
silent re-classification.

## Reversibility

Moderate. To reverse:

1. Remove the validator rules from the application layer.
2. Remove the three new keys from the metadata parser.
3. Remove the `--group-by type` flag from `dstack list`.
4. Delete the `type` column from `dstack list`'s default output.

Skills that already declared the keys are unaffected: the keys remain
under `metadata.dstack.*` and other tools ignore them.

## References

- [`docs/skill-taxonomy.md`](../skill-taxonomy.md) — the taxonomy this
  ADR adopts into code.
- [v2 RESEARCH.md](../plans/v2/RESEARCH.md) Findings 1, 2, 6 — the
  empirical case for inferred-default-`semantic`.
- SkillsBench paper (arXiv 2602.12670) — the source for the
  comprehensive-skill warning threshold.
- [ADR-0014](0014-metadata-namespace.md) — namespace these fields
  live under.
- [v2 ROADMAP M27, M28, M29](../plans/v2/ROADMAP.md) — the milestones
  that implement this ADR.
