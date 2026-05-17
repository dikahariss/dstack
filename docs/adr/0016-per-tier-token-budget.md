# ADR-0016 — Per-tier token budget (body ≤ 5000, bundled unlimited)

- **Status:** Accepted (supersedes [ADR-0010](0010-context-budget.md))
- **Date:** 2026-05-17
- **Reversibility:** Cheap. The ceiling is one constant; bundled
  exemption is one branch in the counter.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Body | The frontmatter plus the Markdown body of `SKILL.md`. The full text Claude Code loads when a skill is activated. |
| Bundled resource | A file in a subdirectory of the skill folder (`scripts/X.py`, `references/Y.md`, `assets/Z.json`). Loaded on demand, not at activation. |
| Body ceiling | The maximum token count for `SKILL.md` body. A hard limit. |
| Spec recommendation | The body-size guidance from agentskills.io (≤ 5000 tokens, ≤ 500 lines). |

## Context

[ADR-0010](0010-context-budget.md) set a hard ceiling of 16,000 tokens
per rendered skill in v1. That ceiling counted the entire rendered
file as one unit, because v1 had no bundled resources.

Two changes in v2 force a re-think:

1. **Bundled resources land** ([ADR-0017](0017-bundled-resources.md)).
   `scripts/`, `references/`, `assets/` files do not enter Claude
   Code's context window until the agent reads or executes them. They
   should not count against the budget.

2. **Spec publishes a recommendation.** The agentskills.io
   specification ([best-practices](https://agentskills.io/skill-creation/best-practices),
   May 2026) recommends:
   > "Instructions (< 5000 tokens recommended): The full SKILL.md
   > body is loaded when the skill is activated"
   > "Keep your main SKILL.md under 500 lines."

The v1 16,000-token ceiling is 3.2× the spec recommendation. v1 was
permissive because nothing better was known. The recommendation is
now public and grounded in production usage.

Empirical support from SkillsBench (arXiv 2602.12670, Feb 2026):
"Comprehensive" skills (defined as 4+ module files) showed a
**-2.9pp** pass-rate delta compared to a no-skill baseline. Larger
isn't better. The recommendation matches the data.

## Decision

Token budgeting becomes per-tier:

| Tier | What counts | Ceiling |
|---|---|---|
| Body | Frontmatter + Markdown body of `SKILL.md` | **5,000 tokens** (hard) |
| Bundled | Files under `scripts/`, `references/`, `assets/`, any free-form subfolder | Not counted |

Default for a new skill: `metadata.dstack.context_budget_tokens: 4000`
(unchanged from v1).

Warning threshold: 90% of the declared budget (unchanged from v1).

Validation rules:

- If `metadata.dstack.context_budget_tokens > 5000`, the build fails
  with an error pointing at this ADR.
- If body token count > declared budget, the build fails.
- If body token count > 90% of declared budget, a `token-near-budget`
  warning is emitted.
- Bundled-resource size is reported in `dstack list` as a separate
  column (`bundled_count` and `bundled_bytes`), informational only.

### v1 skills with budgets > 5000

The v1 → v2 migration (`bun run migrate-v2`) caps any skill with
`context_budget_tokens > 5000` at 5000 and emits a one-shot warning
asking the author to confirm.

In practice, no v1 skill in the dstack catalog exceeds 5000 tokens
today. The migration warning is precautionary.

### Why "body ≤ 5000" works under v2

A skill that previously needed 10,000 tokens of prose now has two
choices, both better than the v1 ceiling:

1. Move detail into `references/<topic>.md`. Tell the agent when to
   read it. Body shrinks to the navigation layer (the "table of
   contents" pattern from
   [agentskills.io best-practices](https://agentskills.io/skill-creation/best-practices)).
2. Move logic into `scripts/<task>.py`. Tell the agent to run it.
   Body becomes "use these scripts in this order."

Both paths align with progressive disclosure as Anthropic describes
it: Level 1 (metadata) → Level 2 (body) → Level 3 (bundled).

## Trade-offs

**Upsides (`+`)**

- Output aligns with agentskills.io spec recommendation. Skills land
  in the size range Anthropic tested.
- Authors are nudged toward bundled resources for detail, which is
  the only way to scale skill content without harming activation
  performance (SkillsBench).
- Bundled assets no longer compete with the body for budget. A skill
  can ship a 50-page reference doc without inflating its body cost.
- Anti-pattern detection becomes simple: a comprehensive skill is
  one with > 3 module folders, not a token-count check.

**Downsides (`-`)**

- The 16,000-token ceiling from v1 is no longer available. A skill
  that legitimately needs a large body must split it.
- Token budgeting reports two numbers (`body_tokens`,
  `bundled_count`). Reading the budget output requires understanding
  the tier model.
- v1 skills near the 5000-token line require attention during
  migration.

## YAGNI guard

Do not add a third budget tier (e.g., separate budgets for
`references/` vs `scripts/`). The Claude Code architecture treats
all bundled files identically — they load on demand. Splitting the
budget would invent a distinction the runtime does not make.

Do not raise the 5000-token ceiling without one of the following:

1. The agentskills.io spec changes its recommendation, OR
2. Empirical evidence (a successor to SkillsBench) shows skills
   above 5000 tokens outperforming smaller skills, OR
3. A concrete dstack skill needs more than 5000 tokens and cannot
   reasonably move content to `references/`.

Do not enforce a bundled-byte ceiling. Disk is cheap. The body
ceiling is what protects activation performance.

## Reversibility

Cheap. To revert to ADR-0010's behavior:

1. Restore the 16,000-token ceiling.
2. Restore the single-budget mode (count entire rendered output,
   including bundled).
3. Strip the bundled-resource columns from `dstack list`.

Skills authored under ADR-0016 with bundled resources continue to
work — the renderer just counts everything against the ceiling
again.

## References

- [ADR-0010](0010-context-budget.md) — the predecessor. Marked
  superseded by this ADR.
- [agentskills.io best-practices](https://agentskills.io/skill-creation/best-practices)
  — the source of the 5000-token recommendation.
- [SkillsBench arXiv 2602.12670](https://arxiv.org/abs/2602.12670)
  — empirical support for the smaller-body discipline.
- [v2 RESEARCH.md](../plans/v2/RESEARCH.md) Finding 5.
- [v2 ROADMAP M24](../plans/v2/ROADMAP.md) — the milestone that
  implements this ADR.
- [ADR-0017](0017-bundled-resources.md) — the bundled-resources
  decision this ADR depends on.
