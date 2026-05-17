# v2 research — 27-source fan-out tree

This document records the research that shaped v2. It is preserved so
future contributors can read the evidence behind the v2 design
decisions, not just the decisions themselves.

The question that drove the research:

> What is the optimal default skill computation type for the dstack v2
> catalog — should the type taxonomy from
> [`docs/skill-taxonomy.md`](../../skill-taxonomy.md) default to
> `hybrid`, `semantic`, `deterministic`, or `schema-semantic`?

The research used a fan-out tree: 1 root question, 3 facets, 9 specific
queries, 14 verification fetches — 27 verified sources total.

## Method

| Layer | Count | Description |
|---|---|---|
| Root | 1 | Best default skill computation type (2026) |
| Facets | 3 | Empirical / Official guidance / Cross-platform |
| Specific | 9 | Three queries per facet |
| Verification | 14 | Drill-down fetches on highest-value sources |

## Key findings that shaped v2

### Finding 1 — Official ecosystem default is `semantic`, not `hybrid`

OpenAI Codex documentation states explicitly:

> "Prefer instructions over scripts unless you need deterministic
> behavior or external tooling."

Anthropic's official quickstart on agentskills.io is `roll-dice` — a
20-line prompt-only skill with inline shell. No `scripts/` folder.

Block (Goose) Engineering blog "3 Principles for Designing Agent
Skills" converges on the same position: instructions first, scripts as
escape hatch.

**Implication**: dstack v2 default should be `semantic` (open-ended
Markdown instructions), not `hybrid`. Hybrid is what production-grade
skills evolve into, not what authors write first.

### Finding 2 — SkillsBench empirical data (arXiv 2602.12670)

The first formal benchmark for Agent Skills, published February 2026,
ran 84 tasks × 7 agent-model configurations × 7,308 trajectories.

Skill-complexity effect on pass-rate delta:

| Complexity | Pass-rate delta |
|---|---|
| Detailed (2–3 modules) | **+18.8pp** |
| Compact | +17.1pp |
| Standard | +10.1pp |
| Comprehensive (4+ modules) | **−2.9pp** (hurts) |

Comprehensive skills with many bundled files actually degrade
performance. Authors should aim for 2–3 modules, not the kitchen sink.

The paper also reports: *"Self-generated Skills provide no benefit on
average."* Models cannot reliably author the procedural knowledge they
benefit from consuming.

**Implication**: v2 validator should warn when a skill bundles more
than 3 module folders (`scripts/`, `references/`, `assets/`, plus
extras). The taxonomy is correct; comprehensive ≠ better.

### Finding 3 — Custom frontmatter is stripped before reaching the model

GitHub Issue [anthropics/claude-code#13005](https://github.com/anthropics/claude-code/issues/13005):

> "SKILL.md files support custom frontmatter fields beyond the
> load-bearing name and description fields, but these custom fields
> are stripped before being injected into the model's context."

**Implication**: dstack-only fields (`type`, `version`, `triggers`,
`context_budget_tokens`, `side_effects`, `agency`, `output_schema`)
are **build-time concerns only**. The LLM never sees them. The
guidance from these fields must be re-expressed in the prompt body if
the model needs to know it.

This means:

- `type` is a catalog-organization and validator concept, not a
  runtime hint.
- Putting fields under `metadata.dstack.*` is fine — Claude Code's
  stripping behavior makes the location irrelevant from a runtime
  perspective. Use `metadata` because the
  [official spec](https://agentskills.io/specification) explicitly
  reserves it for "additional properties not defined by the Agent
  Skills spec."

### Finding 4 — `allowed-tools` format is space-separated, not array

The official spec at
[agentskills.io/specification](https://agentskills.io/specification)
defines `allowed-tools` as a space-separated string:

```yaml
allowed-tools: Bash(git:*) Bash(jq:*) Read
```

dstack v1 emits a YAML array:

```yaml
allowed-tools: [Read, Bash, Grep]
```

This is non-compliant. Other tools (Gemini CLI, Codex, Cursor) may
reject it. v2 must fix.

### Finding 5 — Recommended body ceiling: 5000 tokens, 500 lines

The official spec recommends:

> "Instructions (< 5000 tokens recommended): The full SKILL.md body is
> loaded when the skill is activated"
> "Keep your main SKILL.md under 500 lines."

dstack v1 ceiling is 16000 tokens. That's 3× the official recommended
maximum. SkillsBench data (comprehensive skills hurt -2.9pp) confirms
the recommendation: bigger isn't better.

**Implication**: v2 lowers the body ceiling. Bundled resources are
unlimited (they don't load into context until referenced).

### Finding 6 — Empirical catalog distribution

Direct classification of all 17 skills in
[anthropics/skills](https://github.com/anthropics/skills) (the
reference catalog):

| Pattern | Count | Skills |
|---|---|---|
| Hybrid (has `scripts/`) | 9 | docx, mcp-builder, pdf, pptx, skill-creator, slack-gif-creator, webapp-testing, web-artifacts-builder, xlsx |
| Open-ended Semantic (no `scripts/`) | 8 | algorithmic-art, brand-guidelines, canvas-design, claude-api, doc-coauthoring, frontend-design, internal-comms, theme-factory |
| Deterministic | 0 | — |
| Schema-constrained Semantic | 0 | — |

Hybrid edges out Open-ended (53% vs 47%). Zero Deterministic and zero
Schema-semantic in the official catalog as of May 2026. These two
types exist in the taxonomy but are not yet exercised by Anthropic's
own skills.

**Implication**: dstack v2 should add at least one Deterministic and
one Schema-semantic example skill to validate the build pipeline for
those types (see ROADMAP M32, M34).

### Finding 7 — Ecosystem is multi-host but standardized

The Agent Skills format is supported by 16+ tools as of May 2026:
Claude Code, claude.ai, Cursor, OpenAI Codex, Gemini CLI, Junie,
GitHub Copilot, VS Code, OpenHands, OpenCode, Amp, Goose (Block),
Firebender, Letta, Mux, Autohand, plus more.

Critically: all of them use the same `SKILL.md` format and the same
`.claude/skills/` directory convention (the name is part of the
standard, not a brand reference).

**Implication**: dstack v2 output should be **strict spec-compliant**.
A skill rendered by dstack should work in Gemini CLI, Codex, Cursor,
etc. without modification. The cost of compliance is zero (it just
means putting extensions under `metadata.dstack.*`).

## Verdict (informing ROADMAP.md)

The user's original hypothesis:

> "Default jangan Open-ended murni (AI dipandu jangan terlalu
> open-ended). Default jangan Deterministic murni (buat apa AI). Jadi
> default Hybrid atau Schema-semantic."

The research validates one half and contradicts the other:

| Claim | Verdict |
|---|---|
| Avoid pure Deterministic as default | ✅ Correct. Even "deterministic" skills in the official catalog have SKILL.md bodies. Pure-script ≠ skill. |
| Avoid pure Open-ended as default | ⚠️ Half-correct. The body itself is structured guidance. Open-ended Semantic ≠ "unguided AI". |
| Default `hybrid` or `schema-semantic` | ❌ Contradicted by ecosystem. Default = `semantic`. |
| Production skills trend Hybrid | ✅ Correct (MCP best practices: 85–95% compliance vs 60–70% for instruction-only). |

### The default chosen for v2

**Inferred-from-structure with `semantic` as fallback**:

```
1. Has metadata.dstack.output_schema? → schema-semantic
2. Has scripts/ folder?               → hybrid
3. Has scripts/ + body < 500 tokens?  → deterministic
4. Else (default of defaults)         → semantic
```

Reasons:

1. **Ecosystem-aligned**: matches Codex, Anthropic, Goose, agentskills.io defaults.
2. **No mislabel**: structure is ground truth. A skill with `scripts/`
   is Hybrid; one without is Open-ended.
3. **Lowest friction**: authors are not forced to write code for skills
   that don't need it.
4. **SkillsBench-validated**: comprehensive bundling hurts. Default
   semantic encourages the "concise + 2–3 modules" sweet spot.

## Sources (27)

### Round 1 — Root and facets (4)

- [Best AI Agent Frameworks 2026 — Alice Labs](https://alicelabs.ai/en/insights/best-ai-agent-frameworks-2026)
- [anthropics/skills GitHub repository](https://github.com/anthropics/skills)
- [Agent Skills for Large Language Models — arXiv 2602.12430](https://arxiv.org/pdf/2602.12430)
- [Agent Skills: A Portable Format — Ylang Labs](https://ylanglabs.com/blogs/agent-skills)

### Round 2 — Specifics (9)

- [Agent Skills Specification — agentskills.io](https://agentskills.io/specification)
- [Agent Skills Overview — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Equipping agents for the real world — Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Agent Skills — Codex (OpenAI Developers)](https://developers.openai.com/codex/skills)
- [SkillsBench — arXiv 2602.12670](https://arxiv.org/abs/2602.12670)
- [SWE-Skills-Bench — arXiv 2603.15401](https://arxiv.org/abs/2603.15401)
- [Gemini CLI Skills Getting Started — Agensi](https://www.agensi.io/learn/gemini-cli-skills-getting-started)
- [Structured outputs — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Model Context Protocol Best Practices — MikesBlog](https://oshea00.github.io/posts/mcp-practices/)

### Round 3 — Verification fetches (14)

- [Best practices for skill creators — agentskills.io](https://agentskills.io/skill-creation/best-practices)
- [Using scripts in skills — agentskills.io](https://agentskills.io/skill-creation/using-scripts)
- [Quickstart — agentskills.io](https://agentskills.io/skill-creation/quickstart)
- [Skill authoring best practices — Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [SkillsBench HTML — arXiv html](https://arxiv.org/html/2602.12670v1)
- [mattpocock/skills GitHub](https://github.com/mattpocock/skills)
- [obra/superpowers GitHub](https://github.com/obra/superpowers)
- [Claude Code Skills Stack — DEV Community](https://dev.to/imaginex/a-claude-code-skills-stack-how-to-combine-superpowers-gstack-and-gsd-without-the-chaos-44b3)
- [3 Principles for Designing Agent Skills — Block Engineering](https://engineering.block.xyz/blog/3-principles-for-designing-agent-skills)
- [Testing Agent Skills Systematically — OpenAI Developers](https://developers.openai.com/blog/eval-skills)
- [Standardize skill metadata — GitHub Issue #26438](https://github.com/anthropics/claude-code/issues/26438)
- [SKILL.md validator extended fields — Issue #25380](https://github.com/anthropics/claude-code/issues/25380)
- [Custom frontmatter stripped — Issue #13005](https://github.com/anthropics/claude-code/issues/13005)
- [Instructions vs Agent Skills — Simform Engineering](https://medium.com/simform-engineering/agent-instructions-vs-skills-the-difference-most-developers-miss-a0d854203f36)
