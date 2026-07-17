# Skill Quality Playbook

How to write a dstack skill that follows authoritative agent-skill
guidance, beats reference catalogs on benchmark, passes UAT, and
lands efficiently — with every recommendation traceable to a
credible source.

This playbook combines four evidence layers:

1. **Anthropic's official Skill authoring best practices** (the
   first-party guidance from the team that built the format) —
   [`platform.claude.com/docs/.../agent-skills/best-practices`](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
2. **agentskills.io best practices** (the open standard's authoring
   guide) — [`agentskills.io/skill-creation/best-practices`](https://agentskills.io/skill-creation/best-practices).
3. **SkillsBench (arXiv 2602.12670)** — the first peer-reviewed
   benchmark for Agent Skills, with section-level empirical findings
   we cite directly throughout.
4. **dstack's own v3 Track C measurement loop** (n=19 cases, single
   judge, prototype harness) — used as **corroboration**, not as
   primary evidence. Limitations of the local data are documented
   in §11.

Every recommendation below is tagged with its source. When a
recommendation rests on dstack-only data, that is called out
explicitly.

## At-a-glance evidence base

| Claim | Source |
|---|---|
| SKILL.md body ≤ 500 lines, ≤ 5000 tokens | Anthropic official best practices, §"Token budgets"; agentskills.io §"Structure large skills with progressive disclosure" |
| Curated Skills improve agent performance by **+16.2pp** on average | SkillsBench §4.1.1, Finding 1, Table 3 |
| Self-generated Skills produce **−1.3pp** (no benefit) on average | SkillsBench §4.1.1, Finding 3 |
| 2–3 modules optimal (**+18.6pp**); 4+ modules drop to **+5.9pp** | SkillsBench §4.2.1, Finding 5, Table 5 |
| Detailed/compact Skills outperform comprehensive (**−2.9pp**) | SkillsBench §4.2.2, Finding 6, Table 6 |
| "Concise, stepwise guidance with at least one working example often more effective than exhaustive documentation" | SkillsBench §5 (Discussion) — verbatim |
| Description: max 1024 chars, third-person, what + when | Anthropic official best practices, §"Writing effective descriptions" + §"YAML frontmatter requirements" |
| Naming: gerund form, lowercase+hyphens, max 64 chars | Anthropic official best practices, §"Naming conventions" |
| Match specificity to task fragility (high / medium / low freedom) | Anthropic official best practices, §"Set appropriate degrees of freedom" |
| Pairwise comparison ≫ score-based for judge consistency | LLM-as-a-Judge survey (arXiv 2411.15594, §2.1.3) |
| Style bias dominant (0.76–0.92) among LLM judges | "Judging the Judges: Bias Mitigation Strategies" (arXiv 2604.23178, April 2026) |
| Claude A drafts, Claude B tests, iterate | Anthropic official best practices, §"Develop Skills iteratively with Claude"; Anthropic skill-creator meta-skill |
| Build evaluations BEFORE extensive documentation | Anthropic official best practices, §"Build evaluations first" — verbatim heading |

---

## §0 — The two-line summary

1. Anthropic's first-party data (SkillsBench + their official
   guidance) says: write **concise, stepwise, example-bearing,
   2–3-module skills grounded in real domain expertise**, develop
   them through **Claude A / Claude B iteration**, and start from
   **evaluations, not documentation**.
2. dstack's v3 Track C exercise reproduced this on a small scale and
   added local tooling for the iteration loop (`scripts/benchmark.sh`,
   `scripts/uat-proxy.sh`, `eval/cases.jsonl` + `uat/scenarios.md`
   conventions).

The rest of this playbook is operational detail.

---

## §1 — What the authoritative sources say (recommendations + source)

These are the recommendations the **first-party Anthropic guidance,
the agentskills.io standard, and SkillsBench** converge on. Apply
them by default.

### 1.1 Start from evaluation, not from documentation

> "Build evaluations BEFORE writing extensive documentation. This
> ensures your Skill solves real problems rather than documenting
> imagined ones."
> — Anthropic official best practices, §"Build evaluations first"
> ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

Procedure (Anthropic, same section):

1. Run Claude on representative tasks without the Skill. Document
   failures.
2. Build three scenarios that test those gaps.
3. Establish baseline (without-skill performance).
4. Write the minimum SKILL.md needed to address the gaps.
5. Iterate.

In dstack: this maps to `skills/<id>/eval/cases.jsonl` (≥ 3 cases
per skill) + `skills/<id>/uat/scenarios.md`. The baseline is a
benchmark run against a reference equivalent (see §4).

### 1.2 Be concise — every token competes with context

> "Default assumption: Claude is already very smart. Only add context
> Claude doesn't already have. Challenge each piece of information:
> 'Does Claude really need this explanation?', 'Can I assume Claude
> knows this?', 'Does this paragraph justify its token cost?'"
> — Anthropic official best practices, §"Concise is key"
> ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

SkillsBench corroborates with data:

> "Concise, stepwise guidance with at least one working example is
> often more effective than exhaustive documentation; overly long
> Skills definitions can increase context burden without improving
> decisions."
> — SkillsBench, arXiv 2602.12670, §5 (Discussion), verbatim
> ([source](https://arxiv.org/html/2602.12670v1))

Operational targets:

| Limit | Source |
|---|---|
| SKILL.md body ≤ 500 lines | Anthropic + agentskills.io |
| SKILL.md body ≤ 5000 tokens | agentskills.io specification |
| Description ≤ 1024 chars | Anthropic frontmatter validation |
| Name ≤ 64 chars, lowercase + hyphens only | Anthropic frontmatter validation |

### 1.3 Match specificity to task fragility

> "Match the level of specificity to the task's fragility and
> variability."
>
> - **High freedom** (text-based instructions): multiple approaches
>   are valid, decisions depend on context.
> - **Medium freedom** (pseudocode or scripts with parameters):
>   preferred pattern exists, some variation acceptable.
> - **Low freedom** (specific scripts, few or no parameters):
>   operations are fragile, consistency is critical.
>
> Analogy: "Narrow bridge with cliffs on both sides → low freedom;
> open field with no hazards → high freedom."
> — Anthropic official best practices, §"Set appropriate degrees of
> freedom" ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

agentskills.io says the same thing differently:

> "Be prescriptive when operations are fragile, consistency matters,
> or a specific sequence must be followed."
> — agentskills.io §"Match specificity to fragility"
> ([source](https://agentskills.io/skill-creation/best-practices))

Practical guidance: every section of your SKILL.md gets calibrated
independently. The verification gate is **low-freedom** (run this
exact command); the brainstorm interview is **high-freedom** (the
agent chooses the question).

### 1.4 Provide a default, not a menu

> "When multiple tools or approaches could work, pick a default and
> mention alternatives briefly rather than presenting them as equal
> options. Bad: 'You can use pypdf, pdfplumber, PyMuPDF, or
> pdf2image…' Good: 'Use pdfplumber for text extraction. For
> scanned PDFs requiring OCR, use pdf2image with pytesseract
> instead.'"
> — agentskills.io §"Provide defaults, not menus"
> ([source](https://agentskills.io/skill-creation/best-practices))

Anthropic says the same in their "Avoid offering too many options"
anti-pattern.

### 1.5 Favor procedures over declarations

> "A skill should teach the agent how to approach a class of
> problems, not what to produce for a specific instance."
> — agentskills.io §"Favor procedures over declarations"
> ([source](https://agentskills.io/skill-creation/best-practices))

This is one of the few recommendations agentskills.io makes with a
worked counter-example (specific SQL query vs reusable method).

### 1.6 Include "gotchas" — environment-specific facts that defy
assumptions

> "The highest-value content in many skills is a list of gotchas —
> environment-specific facts that defy reasonable assumptions. These
> aren't general advice ('handle errors appropriately') but concrete
> corrections to mistakes the agent will make without being told
> otherwise."
> — agentskills.io §"Gotchas sections"
> ([source](https://agentskills.io/skill-creation/best-practices))

Examples from agentskills.io's documentation:

> - "The `users` table uses soft deletes. Queries must include
>   `WHERE deleted_at IS NULL` or results will include deactivated
>   accounts."
> - "The user ID is `user_id` in the database, `uid` in the auth
>   service, and `accountId` in the billing API. All three refer
>   to the same value."

dstack equivalent: the "Triage by failure shape" table in
`/debugging`, the "Default verification gate" in `/verification`,
the "honest-claim shape" table — these are all gotchas-as-tables.

### 1.7 Use templates, checklists, and validation loops for
multi-step workflows

Anthropic official best practices (§"Workflows and feedback loops")
recommends three concrete patterns:

1. **Workflow with checklist** — "Copy this checklist and track your
   progress: `[ ] Step 1: …`". Quoted verbatim.
2. **Validation loops** — "Run validator → fix errors → repeat. This
   pattern greatly improves output quality." Quoted verbatim.
3. **Plan-validate-execute** — "Have the agent create an intermediate
   plan in a structured format, validate it against a source of
   truth, and only then execute."

agentskills.io has matching sections (§"Checklists for multi-step
workflows", §"Validation loops", §"Plan-validate-execute").

### 1.8 Provide examples (input → output pairs), not descriptions

> "For Skills where output quality depends on seeing examples,
> provide input/output pairs just like in regular prompting. Examples
> help Claude understand the desired style and level of detail more
> clearly than descriptions alone."
> — Anthropic official best practices, §"Examples pattern"
> ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

The general prompt-engineering literature is consistent:

> "Few-shot prompting improves the AI's performance by providing it
> with a few examples before making a request."
> — Various prompt-engineering guides (Lakera 2026, DigitalOcean,
> MIT Sloan)

In dstack: this is the "wrong vs right" table pattern.

### 1.9 Write the description in third person, with what + when

> "Always write in third person. The description is injected into
> the system prompt, and inconsistent point-of-view can cause
> discovery problems. Good: 'Processes Excel files and generates
> reports'. Avoid: 'I can help you process Excel files', 'You can
> use this to process Excel files'."
>
> "The description is critical for skill selection: Claude uses it
> to choose the right Skill from potentially 100+ available Skills.
> Your description must provide enough detail for Claude to know
> when to select this Skill."
> — Anthropic official best practices, §"Writing effective
> descriptions" ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

Skill-creator (the official Anthropic meta-skill) adds:

> "Claude has a tendency to 'undertrigger' skills — to not use them
> when they'd be useful. To combat this, please make the skill
> descriptions a little bit 'pushy'."
> — `anthropics-skills/skill-creator/SKILL.md`

### 1.10 Use gerund-form names (`processing-pdfs`,
`analyzing-spreadsheets`)

> "Consider using gerund form (verb + -ing) for Skill names, as this
> clearly describes the activity or capability the Skill provides.
> Good naming examples: processing-pdfs, analyzing-spreadsheets,
> managing-databases. Avoid: vague names (helper, utils, tools),
> overly generic (documents, data, files)."
> — Anthropic official best practices, §"Naming conventions"
> ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

### 1.11 Progressive disclosure — one level deep from SKILL.md

> "Keep references one level deep from SKILL.md. All reference files
> should link directly from SKILL.md to ensure Claude reads complete
> files when needed. Claude may partially read files when they're
> referenced from other referenced files — using commands like
> `head -100` rather than reading entire files."
> — Anthropic official best practices, §"Avoid deeply nested
> references" ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

### 1.12 Avoid time-sensitive information

> "Don't include information that will become outdated."
> — Anthropic official best practices, §"Avoid time-sensitive
> information" ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

Example pattern from Anthropic for unavoidable legacy references:
move them to an "Old patterns" section in a collapsible `<details>`
block.

### 1.13 Use consistent terminology

> "Choose one term and use it throughout the Skill. Bad: mixing
> 'API endpoint', 'URL', 'API route', 'path'."
> — Anthropic official best practices, §"Use consistent terminology"

### 1.14 Develop iteratively with Claude A and Claude B

> "The most effective Skill development process involves Claude
> itself. Work with one instance of Claude ('Claude A') to create a
> Skill that is used by other instances ('Claude B'). Claude A
> helps you design and refine instructions, while Claude B tests
> them in real tasks."
> — Anthropic official best practices, §"Develop Skills iteratively
> with Claude" ([source](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

The Anthropic skill-creator skill operationalises this with:

> "Spawn all runs (with-skill AND baseline) in the same turn. For
> each test case, spawn two subagents in the same turn — one with
> the skill, one without."
> — `anthropics-skills/skill-creator/SKILL.md`, "Running and
> evaluating test cases"

dstack's `scripts/benchmark.sh` mirrors this by spawning both skills
in pairwise comparison plus a judge call.

### 1.15 Hybrid by default — spine + named judgment, on a calibration spectrum (dstack)

> **Rule:** every skill body has a deterministic spine (steps + a gate +
> a constraining table/checklist; exact commands where applicable) AND one
> explicit sentence naming where the agent decides and makes the final
> call. How much spine is set by a band; 30% deterministic is only the
> DEFAULT.
> — dstack ADR-0025; consistent with §1.3 (match specificity to fragility).

The deterministic share is a spectrum, not one number:

| Band (`metadata.dstack.calibration`) | Det. share | Example |
|---|---|---|
| `judgment-dominant` | 10–20% | `brainstorm` |
| `workflow` (default, omit the flag) | ~30% | `debugging` |
| `deterministic-dominant` | 60–80%+ | `careful`, `verification` |
| `schema-meta` | n/a | `classify-issue` |

This is a *calibration* axis, separate from `type` (ADR-0015). A
`type: semantic` skill is the normal carrier: no runtime code, but its
prompt still has a spine. Default is `workflow`. Move a skill to
`judgment-dominant` only with empirical evidence (benchmark/UAT/test) that
the default over-constrains it, plus owner approval; moving to more rails
needs only a rationale. Record both in `## Changes`. Exemplar:
`skills/code-review/SKILL.md` (the reference hybrid: deterministic spine + named judgment).

---

## §2 — Anti-patterns (cited)

### 2.1 Self-generated skills add no value on average

> "Self-generated Skills provide negligible or negative benefit
> (−1.3pp average), demonstrating that effective Skills require
> human-curated domain expertise."
> — SkillsBench §4.1.1, Finding 3, Table 3
> ([source](https://arxiv.org/html/2602.12670v1))

Implication: do not let an LLM generate a skill from generic
training knowledge. Always feed in real domain context (real bugs,
real reviews, real runbooks, real ADRs).

agentskills.io says the same:

> "A common pitfall in skill creation is asking an LLM to generate a
> skill without providing domain-specific context — relying solely
> on the LLM's general training knowledge results in vague, generic
> procedures ('handle errors appropriately', 'follow best practices
> for authentication') rather than the specific API patterns, edge
> cases, and project conventions that make a skill valuable."
> — agentskills.io §"Start from real expertise"
> ([source](https://agentskills.io/skill-creation/best-practices))

### 2.2 Comprehensive (kitchen-sink) skills hurt performance

> "Detailed (+18.8pp) and compact (+17.1pp) Skills outperformed
> comprehensive documentation, which hurt performance (−2.9pp)."
> — SkillsBench §4.2.2, Finding 6, Table 6

> "Excessive Skills content creates cognitive overhead or
> conflicting guidance."
> — SkillsBench §4.2.1, verbatim

### 2.3 Loading 4+ skills together → diminishing returns

> "2–3 skills showed the largest improvement (+18.6pp), while 4+
> skills provided only +5.9pp benefit."
> — SkillsBench §4.2.1, Finding 5, Table 5

Implication: avoid building skills that fire simultaneously with
many others. Bucket organisation (M55) and clear non-overlap
matter.

### 2.4 Generic procedural advice (no concrete tooling)

> "Skills work best when success depends on concrete procedures and
> verifier-facing details (steps, constraints, sanity checks),
> rather than broad conceptual knowledge."
> — SkillsBench §5 (Discussion)

Anthropic says the same: a code-review skill that says "look for
issues" is worse than one that says "check all database queries for
SQL injection (use parameterized queries)".

### 2.5 Too many options without a default

> "Don't present multiple approaches unless necessary."
> — Anthropic official best practices, §"Avoid offering too many
> options"

### 2.6 Magic numbers / "voodoo constants"

> "Configuration parameters should also be justified and documented
> to avoid 'voodoo constants' (Ousterhout's law). If you don't know
> the right value, how will Claude determine it?"
> — Anthropic official best practices, §"Solve, don't punt"

### 2.7 Punting to Claude in scripts

> "When writing scripts for Skills, handle error conditions rather
> than punting to Claude."
> — Anthropic official best practices, §"Solve, don't punt"

### 2.8 Windows-style paths

> "Always use forward slashes in file paths, even on Windows."
> — Anthropic official best practices, §"Avoid Windows-style paths"

---

## §3 — Recommended workflow per skill (operationalised)

This combines Anthropic's Claude A / Claude B iteration with dstack
tooling. It is what `scripts/benchmark.sh` and `scripts/uat-proxy.sh`
were built to support.

```
Phase A — Capture intent (Anthropic best practices, §"Build
                          evaluations first")
   │
   ├─ 1. Identify the gap: run Claude on real task WITHOUT a skill;
   │       document the failure modes
   │
   ├─ 2. Identify a reference equivalent from a peer catalog (see §4
   │       reference matchmaking table)
   │
   └─ 3. Write 2–3 fixture cases in skills/<id>/eval/cases.jsonl
           Each case: { prompt, anti_pattern }

Phase B — Draft (Anthropic, §"Develop Skills iteratively") — Claude A
   │
   ├─ 4. Anthropic recommends: ask Claude to draft the SKILL.md from
   │       the gap analysis. Their data: "Claude models understand both
   │       how to write effective agent instructions and what
   │       information agents need."
   │
   ├─ 5. Apply patterns from §1: concise + match specificity to
   │       fragility + default-not-menu + gotchas + examples
   │
   └─ 6. Run `bun run validate` — passes basic schema check

Phase C — Measure (SkillsBench §5 paired-evaluation methodology)
   │
   ├─ 7. Run pairwise benchmark against the reference equivalent:
   │     bash scripts/benchmark.sh <skill> <ref> <cases> <out>
   │
   ├─ 8. Read judge rationale — apply §8 rewrite recipes mapping
   │       judge phrase → pattern to add
   │
   └─ 9. Limit single-judge bias by re-running OR by accepting that
           one verdict is preliminary (see §10 on judge bias)

Phase D — Iterate (Claude B feedback informs Claude A)
   │
   ├─ 10. Targeted rewrite — ONE pattern per losing dimension
   │
   ├─ 11. Bump version, add `## Changes` body section
   │
   └─ 12. Re-bench. If still losing more than 1 iteration in a row,
            the loss is structural (§7).

Phase E — UAT (dstack-specific — no first-party literature equivalent)
   │
   ├─ 13. Author skills/<id>/uat/scenarios.md with 3 scenarios
   │
   ├─ 14. Run `bash scripts/uat-proxy.sh <id>` to capture automated
   │       responses
   │
   └─ 15. User walks the scenarios in a real Claude Code session
            and signs off in skills/<id>/uat/runs/<date>.md
```

The Anthropic skill-creator skill follows this exact shape (their
"Step 1: Spawn all runs", "Step 2: While runs are in progress,
draft assertions") — dstack tooling just wraps it in shell.

---

## §4 — Benchmarking — methodology and caveats

### 4.1 Why pairwise comparison

> "Pairwise comparative assessments outperform other judging methods
> in terms of positional consistency. LLM and human evaluations are
> more aligned in the context of pairwise comparisons compared to
> score-based assessments."
> — LLM-as-a-Judge survey (arXiv 2411.15594), §2.1.3
> ([source](https://arxiv.org/html/2411.15594v6))

dstack's `scripts/benchmark.sh` uses pairwise for this reason, with
anonymised X/Y assignment to control position bias.

### 4.2 Known judge biases (you must caveat your results)

| Bias | Magnitude | Source |
|---|---|---|
| Style bias | 0.76–0.92 across judge models (dominant) | "Judging the Judges: Bias Mitigation Strategies" — arXiv 2604.23178, April 2026 ([source](https://arxiv.org/abs/2604.23178)) |
| Position bias | Real, measurable; mitigated by shuffling A/B | LLM-as-a-Judge survey §2.1.3 |
| Length / verbosity bias | "Methods focusing on sentence-level evaluation or response selection risk propagating biases if the scoring LLM is overly sensitive to stylistic rather than substantive cues" | LLM-as-a-Judge survey §2.3 ([source](https://arxiv.org/html/2411.15594v6)) |
| Sensitivity to formatting / paraphrasing | "Consistency breaks down on inputs as simple as formatting changes, paraphrasing, and shifts in verbosity" | RAND Corp / LLM-judge research (Adaline blog summary 2026) ([source](https://www.adaline.ai/blog/llm-as-a-judge-reliability-bias)) |
| No judge uniformly reliable | "Frontier models exceeded 50% error rates on challenging bias benchmarks" | RAND Corporation 2026 study (cited in same Adaline summary) |

Implication: a single benchmark run is **suggestive**, not
**conclusive**. Mitigations actually implemented in
`scripts/benchmark.sh`:

- Anonymisation of A/B assignment (random per case).
- Pairwise (not score-based).

Mitigations not yet implemented (tracked in v3 plan):

- `--repeat <n>` for variance dampening (planned in M48).
- Multi-judge ensemble (deferred as D27).
- Style-bias normalisation (not in scope).

### 4.3 Reference matchmaking table

dstack-local table mapping common skill types to candidate
reference equivalents. (Source: dstack v3 RESEARCH.md audit of the
four cloned reference repos.)

| dstack skill type | Best reference candidates |
|---|---|
| Debugging / investigation | `superpowers/skills/systematic-debugging`; `mattpocock-skills/skills/engineering/diagnose`; `gstack/.claude/skills/investigate` (note: gstack version is heavy on operational scaffold — isolate the prose body before comparing) |
| TDD / testing | `superpowers/skills/test-driven-development`; `mattpocock-skills/skills/engineering/tdd` |
| Verification / completion-gate | `superpowers/skills/verification-before-completion` |
| Code review (giver) | `gstack/.claude/skills/review` (long; isolate prose body) |
| Code review (receiver) | `superpowers/skills/requesting-code-review` (dstack folded the receiver role into `/code-review`; `/requesting-code-review` covers the dispatch side) |
| Brainstorm / stress-test | `mattpocock-skills/skills/productivity/grill-me`; `superpowers/skills/brainstorming` |
| Plan writing | `superpowers/skills/writing-plans` |
| Plan execution | `superpowers/skills/executing-plans` |
| Branch wrap-up | `superpowers/skills/finishing-a-development-branch` |
| Skill authoring (meta) | `anthropics-skills/skills/skill-creator`; `superpowers/skills/writing-skills` |
| Careful / destructive ops | `gstack/.claude/skills/careful` |

For deterministic or schema-semantic skills (e.g. `/version`,
`/classify-issue`), no equivalent exists in the four reference
catalogs. SkillsBench §4.1.4 notes that 16 of 84 tasks in their
benchmark showed *negative* deltas — not every skill type benefits
from benchmark comparison. Fall back to schema/structural
validation via `bun run validate`.

### 4.4 Benchmark commands

```bash
# Pairwise head-to-head, 3 cases
bash scripts/benchmark.sh \
  skills/<id>/SKILL.md \
  /home/haris/KODING/WORKSPACE-MH/<repo>/skills/<ref>/SKILL.md \
  skills/<id>/eval/cases.jsonl \
  /tmp/dstack-bench/<id>-vs-<ref>

# Aggregate leaderboard
bash scripts/benchmark-aggregate.sh /tmp/dstack-bench/<id>-vs-<ref>

# Inspect verdicts
cat /tmp/dstack-bench/<id>-vs-<ref>/results.jsonl | \
  jq '{case: .case_id, winners: .verdict.winners, rationale: .verdict.rationale}'
```

---

## §5 — UAT (dstack-specific)

Neither Anthropic nor agentskills.io specify a UAT format
(automated evaluation is what their literature recommends —
human-validated scenarios are a dstack addition).

The format that worked in v3 Track C (n=3 skills authored, all
captured automated responses):

```markdown
# UAT scenarios — /<skill-id>

## Scenario 1 — <short title>

**Setup**: In Claude Code session, paste:

> "<exact prompt user types>"

**Pass criteria** (observable behaviours, not feelings):

- [ ] <observable behaviour 1>
- [ ] <observable behaviour 2>
- [ ] <observable behaviour 3>

**Fail criteria**:

- <anti-behaviour 1>
- <anti-behaviour 2>

## Scenario 2 — <…>
## Scenario 3 — <…>

## Sign-off

User signature: ______________________  Date: ___________

All scenarios passed: ☐ yes ☐ no
```

**3 scenarios is the sweet spot** — matches Anthropic's "At least
three evaluations created" checklist requirement (§"Checklist for
effective Skills").

```bash
# Automated UAT proxy — runs each scenario via claude -p
bash scripts/uat-proxy.sh <skill-id>
```

The proxy captures responses for spot-checking. The user still
walks the scenarios in a real Claude Code session for sign-off.

---

## §6 — Quality gate before shipping

Composite checklist drawn from Anthropic's official checklist (the
"Checklist for effective Skills" section) plus dstack additions:

### Core quality (Anthropic checklist)

- [ ] Description is specific and includes key terms (≤ 1024 chars)
- [ ] Description in **third person**, what + when, includes
      trigger contexts
- [ ] Name in **gerund form** or noun-phrase, lowercase + hyphens,
      ≤ 64 chars, not a reserved word
- [ ] SKILL.md body is **≤ 500 lines**
- [ ] Additional details in separate files when needed
- [ ] No time-sensitive information
- [ ] Consistent terminology throughout
- [ ] Examples are concrete, not abstract
- [ ] File references are **one level deep** from SKILL.md
- [ ] Workflows have clear steps; checklists included for
      multi-step work
- [ ] Default provided for any "many tools could work" case (no
      menus)

### Code and scripts (Anthropic checklist, where applicable)

- [ ] Scripts solve problems rather than punt to Claude
- [ ] Error handling is explicit and helpful
- [ ] No "voodoo constants" (every value justified inline)
- [ ] Required packages listed in instructions
- [ ] No Windows-style paths (forward slashes only)
- [ ] Validation/verification steps for critical operations
- [ ] Feedback loops included for quality-critical tasks

### Testing (Anthropic checklist)

- [ ] At least three evaluations created (`eval/cases.jsonl`)
- [ ] Tested with Haiku, Sonnet, **and** Opus where you plan to use it
- [ ] Tested with real usage scenarios (not just synthetic ones)

### dstack additions

- [ ] `metadata.dstack.type` + `side_effects` + `agency` declared
      (v2-native frontmatter — ADR-0014, ADR-0015)
- [ ] `bun run validate` passes (M30 schema + token budget)
- [ ] One pairwise benchmark on file vs a reference equivalent
      (`/tmp/dstack-bench/<id>-vs-*/results.jsonl` exists) — OR
      the skill type has no fair equivalent and structural
      validation is the substitute
- [ ] UAT scenarios authored at `skills/<id>/uat/scenarios.md`
- [ ] Automated UAT proxy captured OR human UAT signed off
- [ ] `## Changes` section logs the iteration delta

---

## §7 — When you lose

```
Benchmark shows dstack loses on dimension D.
   │
   ├─ Read the judge rationale verbatim.
   │
   ├─ Does the rationale name a specific pattern the winner had?
   │   │
   │   ├─ YES — apply §8 rewrite recipes. Re-bench.
   │   │
   │   └─ NO — the loss is on style (LLM-judge style bias is the
   │            dominant bias per arXiv 2604.23178). Two options:
   │            (a) accept the loss and document the limitation;
   │            (b) re-run with anonymised order to test for
   │                position bias.
   │
   └─ Did you lose more than 1 iteration?
       │
       ├─ NO — keep iterating; you have not yet exhausted §8.
       │
       └─ YES — diminishing returns. The loss is structural
                (different scopes, not a fixable gap). Document
                the mismatch in `## Changes`; ship with the
                loss noted, or split the skill.
```

The "1-loss-is-fine" rule has empirical grounding: SkillsBench's
own §4.1.4 reports that 16 of 84 tasks showed *negative* deltas —
skills do not universally help, and an honest catalog says so.

---

## §8 — Common rewrite recipes (judge phrase → pattern to add)

When the judge says X, apply pattern Y from §1:

| Judge rationale (loser side) | Pattern to add | Source |
|---|---|---|
| "more generic" | §1.6 Gotchas / triage table | agentskills.io §"Gotchas sections" |
| "less actionable" / "vague advice" | §1.5 Favor procedures over declarations | agentskills.io §"Favor procedures over declarations" |
| "weaker procedure" | §1.7 Workflow with checklist | Anthropic §"Use workflows for complex tasks" |
| "vague claims" / "not specific" | §1.8 Wrong-vs-right examples pattern | Anthropic §"Examples pattern" |
| "not grounded in this repo" | §1.6 Gotchas tied to actual project context | agentskills.io §"Synthesize from existing project artifacts" |
| "only asks questions" / "no recommendation" | §1.5 Favor procedures + §1.4 Provide defaults | agentskills.io §"Provide defaults, not menus" |
| "no anti-pattern guard" | §1.6 Gotchas + Anthropic "Old patterns" section | Anthropic §"Avoid time-sensitive information" (collapsible "Old patterns") |
| "no recovery path" | §1.7 Validation loops (run → fix → repeat) | Anthropic §"Implement feedback loops" |

This table is the playbook's most operational artifact: when the
judge tells you what is missing, you do not invent a fix — you
apply the recipe whose source supports the move.

---

## §9 — What to skip

These patterns add tokens without contributing value (per Anthropic's
"Concise is key" section and SkillsBench's complexity findings):

- **Marketing voice.** "Powerful", "robust", "comprehensive" add
  zero information.
- **Long descriptions of why the skill exists** ("In today's
  fast-paced development environment…"). Write the iron law /
  procedure instead.
- **Multi-paragraph philosophy.** Replace with one sentence.
- **Real-world impact numbers without a source** ("15–30 min to
  fix" with no study cited). Anthropic does not include these; you
  should not either.
- **Acknowledgements / attribution sections.** Out of scope for
  SKILL.md.
- **Generic "this skill helps you…" intros.** Start with the rule
  or the procedure.
- **Time-sensitive information.** Anthropic explicitly recommends
  against this (§"Avoid time-sensitive information").

---

## §10 — Honest accounting of evidence quality

This playbook stands on different evidence at different levels:

| Confidence | Recommendation source | What it means |
|---|---|---|
| **High** | Anthropic official best practices + agentskills.io standard | First-party guidance from the team that built the format and the open-standard maintainers. Sections 1.1–1.14 are all backed by these. |
| **High (empirical)** | SkillsBench arXiv 2602.12670 | Peer-reviewed benchmark with concrete percentages, section refs, 84 tasks × 7 model-harness configs × 7,308 trajectories. Quantitative claims in this playbook cite SkillsBench by section. |
| **Medium** | LLM-as-a-Judge survey (arXiv 2411.15594) + Bias Mitigation Strategies (arXiv 2604.23178) | Active research area. Caveats on judge reliability are real and large; specific magnitudes vary by study. |
| **Low (dstack-only)** | v3 Track C internal benchmark | n=19 cases, single judge (`claude -p`), prototype bash harness. Useful as corroboration; not generalisable on its own. |

Where this playbook makes a claim, it is sourced. Where the only
source is dstack's internal exercise, the claim is labelled
"dstack-specific". Treat low-confidence claims accordingly.

---

## §11 — What dstack's v3 Track C exercise actually showed
(internal evidence, no extrapolation)

dstack v3 ran 19 head-to-head cases against reference skills with
the prototype harness. The internal data was consistent with the
literature, **at the level of one anecdote**:

| dstack pattern that helped | What changed | Internal verdict |
|---|---|---|
| Triage tables (`/debugging` v0.2.0) | Added 6-row symptom → probe → tooling table | 0/3 wins → 2/3 wins + 1 tie |
| Numbered drills + honest-X tables (`/tdd` v0.2.0) | Added 6-step habit drill + 3-question diagnostic | 1/2 wins → 2/2 wins |
| Repo-grounded commands + wrong-vs-right (`/verification` v0.2.0) | Added default gate with bun commands + honest-claim shape | 1/2 wins → 2/2 wins |
| Recommendation-first reframe (`/brainstorm` v0.2.0) | Iron law changed; worked example added | 0/2 wins → 0/2 wins (still loses; scope mismatch) |

The first three are predicted by the literature (concise, procedural,
example-bearing skills outperform). The fourth is consistent with
SkillsBench Finding 4 (domain variance): not all skills benefit
from rewrite, especially when the reference scope is structurally
narrower.

**Generalisation warning**: n=19 with a single judge is not
sufficient to claim these patterns universally win. The literature
above is what makes them defensible; the dstack run is just
*consistent with* the literature.

---

## Sources

### Primary (first-party / peer-reviewed)

- **Anthropic, "Skill authoring best practices."** Claude Docs.
  [https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- **agentskills.io, "Best practices for skill creators."**
  [https://agentskills.io/skill-creation/best-practices](https://agentskills.io/skill-creation/best-practices)
- **SkillsBench: Benchmarking How Well Agent Skills Work Across
  Diverse Tasks.** arXiv 2602.12670, 2026.
  [https://arxiv.org/abs/2602.12670](https://arxiv.org/abs/2602.12670)
- **A Survey on LLM-as-a-Judge.** arXiv 2411.15594, 2024–2025.
  [https://arxiv.org/abs/2411.15594](https://arxiv.org/abs/2411.15594)
- **Judging the Judges: A Systematic Evaluation of Bias Mitigation
  Strategies in LLM-as-a-Judge Pipelines.** arXiv 2604.23178,
  April 2026.
  [https://arxiv.org/abs/2604.23178](https://arxiv.org/abs/2604.23178)
- **Anthropic, "Equipping agents for the real world with Agent
  Skills."** Anthropic Engineering blog.
  [https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- **anthropics/skills repository, `skills/skill-creator/SKILL.md`.**
  Anthropic's open-source meta-skill for creating skills.
  [https://github.com/anthropics/skills](https://github.com/anthropics/skills)

### Secondary (operational summaries)

- Adaline, "LLM-As-A-Judge: Reliability, Bias, And What The Research
  Says," 2026.
  [https://www.adaline.ai/blog/llm-as-a-judge-reliability-bias](https://www.adaline.ai/blog/llm-as-a-judge-reliability-bias)
- Lakera, "The Ultimate Guide to Prompt Engineering in 2026."
  [https://www.lakera.ai/blog/prompt-engineering-guide](https://www.lakera.ai/blog/prompt-engineering-guide)
- DigitalOcean, "Prompt Engineering Best Practices: Tips, Tricks,
  and Tools."
  [https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices](https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices)
- MIT Sloan, "Effective Prompts for AI: The Essentials."
  [https://mitsloanedtech.mit.edu/ai/basics/effective-prompts/](https://mitsloanedtech.mit.edu/ai/basics/effective-prompts/)

### Reference catalogs consulted (dstack-local)

- `anthropics/skills` (official Anthropic reference)
- `obra/superpowers` (multi-harness skill methodology)
- `mattpocock/skills` (personal skill catalog with bucket organisation)
- `gstack` (operational workflow hub)

### dstack-internal artifacts (low confidence as standalone evidence)

- [`docs/v3-benchmark-report.md`](v3-benchmark-report.md) — v3 Track C
  measurement record (n=19 cases, single judge).
- [`docs/plans/v3/`](plans/v3/) — v3 plan (ROADMAP, RESEARCH,
  DEFERRED) documenting the eval-driven authoring loop design.

---

*This playbook supersedes the earlier (unsourced) draft. Every
non-trivial recommendation now traces to a primary source. Where
internal dstack data is the only evidence, the claim is labelled.
Authors should weight recommendations by the confidence tier in §10.*
