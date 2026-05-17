# dstack v2 — Roadmap

The list of work needed to take dstack from v1 (catalog renderer for
six prose-only skills, dstack-specific schema) to v2 (strict
agentskills.io-compatible renderer with bundled-resources support and
type-aware catalog).

The evidence behind v2's design choices is in [RESEARCH.md](RESEARCH.md).
The items deliberately left out are in [DEFERRED.md](DEFERRED.md).

Each milestone has:

- **Why**: the user problem this solves.
- **Acceptance**: the concrete conditions that mark the milestone as done.
- **Effort**: estimated AI-pair time.
- **Depends on**: other milestones or ADRs that must finish first.
- **Open questions**: decisions still to make.

## The v2 thesis

dstack v1 was a working catalog renderer for one user, one host. v2
re-aligns dstack with the **Agent Skills open standard** maintained at
[agentskills.io](https://agentskills.io), now supported by 16+ tools.

The goal is a dstack catalog whose output runs **anywhere** (Claude
Code, Gemini CLI, Codex, Cursor, Goose, etc.) without modification,
while preserving dstack's strengths: type-aware validation, token
budgets, hexagonal architecture, single source of truth.

## Three pillars of v2

1. **Spec compliance** — single-file `SKILL.md` source, strict
   frontmatter, extensions under `metadata.dstack.*`.
2. **Bundled resources** — `scripts/`, `references/`, `assets/` (and
   free-form subfolders) ship with each skill.
3. **Type taxonomy** — adopt `type: hybrid | semantic | deterministic
   | schema-semantic` with inferred default and per-type validation.

## Tier classification

This roadmap uses the same MoSCoW prioritization as
[v1's ROADMAP](../v1/ROADMAP.md).

| Tier | Meaning |
|---|---|
| **Must** | dstack cannot be considered v2 without this. |
| **Should** | High value, but v2 can ship without it. |
| **Could** | Nice to have. Postpone if Must or Should take longer. |

---

# Must (blocking for v2)

## M21 — Single-file `SKILL.md` source format

- **Why.** v1 uses `skills/<id>/skill.yaml` + `prompt.md` (two files).
  The Agent Skills standard uses one file: `skills/<id>/SKILL.md` with
  YAML frontmatter at the top, Markdown body below. Two-file source
  forces every author to translate when copying from `anthropics/skills`
  and prevents dstack output from being legible as standard skills.
- **Acceptance**:
  - `FileSkillRepository` reads `skills/<id>/SKILL.md` and parses the
    YAML frontmatter (between `---` fences) plus the Markdown body.
  - Frontmatter parsing preserves `file:line` source location for
    error reporting (the `parseDocument` + `LineCounter` pattern from
    v1).
  - A new `bun run migrate-v2` subcommand reads the old
    `skill.yaml` + `prompt.md` pair, merges them into `SKILL.md`,
    moves dstack-only fields under `metadata.dstack.*` (see M22), and
    deletes the old files. Idempotent.
  - All v1 tests pass after running migrate-v2 on `test/fixtures/`.
- **Effort**: 3 to 4 hours.
- **Depends on**: ADR-0013 (single-file source format) written first.
- **Open questions**:
  - Should `bun run new <id>` continue to scaffold a new skill? Yes,
    but emit `SKILL.md` instead of yaml + md.
  - Should we keep parser support for the old format as a deprecation
    bridge? **Decision: no.** v2 is a clean break. Authors run
    `migrate-v2` once.

## M22 — Move dstack extensions under `metadata.dstack.*`

- **Why.** v1 emits frontmatter with `version`, `description`,
  `allowed-tools`, optionally `license`, `compatibility`. Three of
  these (`version` is not in the spec; `allowed-tools` is experimental;
  array-vs-string format) are non-compliant with the agentskills.io
  schema. Other tooling may reject dstack output.
  [Issue #13005](https://github.com/anthropics/claude-code/issues/13005)
  confirms unknown top-level fields are stripped before reaching the
  model — so putting them under `metadata` loses nothing.
- **Acceptance**:
  - Renderer emits frontmatter with exactly these top-level fields:
    `name`, `description`, optionally `license`, optionally
    `compatibility`, optionally `metadata`, optionally `allowed-tools`.
  - dstack-only fields go under `metadata.dstack.*`:
    `metadata.dstack.version`, `metadata.dstack.type`,
    `metadata.dstack.triggers`, `metadata.dstack.context_budget_tokens`,
    `metadata.dstack.side_effects`, `metadata.dstack.agency`,
    `metadata.dstack.output_schema`.
  - The rendered output passes a strict validator against the
    agentskills.io schema (see M30).
- **Effort**: 1 hour.
- **Depends on**: ADR-0014 (metadata namespace), M21 (source format).
- **Open questions**: None.

## M23 — Fix `allowed-tools` to space-separated string

- **Why.** v1 emits `allowed-tools: [Read, Bash, Grep]` (YAML array).
  The official spec defines it as a space-separated string:
  `allowed-tools: Read Bash Grep`. v1 violates the spec here. Tools
  that strict-validate (Gemini CLI, Codex) may reject array form.
- **Acceptance**:
  - Renderer emits `allowed-tools` as a space-separated string when
    present.
  - Source format (`SKILL.md` frontmatter) still accepts the dstack-
    native array form (`tools: [Read, Bash]`) for editor ergonomics —
    parser converts to space-separated on render.
  - A new test verifies render output uses string form.
- **Effort**: 30 minutes.
- **Depends on**: M22.
- **Open questions**: None.

## M24 — Per-tier token budget (body ≤ 5000, bundled unlimited)

- **Why.** v1's [ADR-0010](../../adr/0010-context-budget.md) sets a
  global ceiling of 16000 tokens. The Agent Skills specification
  recommends `SKILL.md` body ≤ 5000 tokens and ≤ 500 lines. SkillsBench
  data (arXiv 2602.12670) shows comprehensive skills (>3 modules)
  *hurt* performance by 2.9pp on average. v1's 16k ceiling is 3× the
  recommended maximum and allows anti-pattern skills.
- **Acceptance**:
  - The token budget applies only to `SKILL.md` body (frontmatter +
    Markdown text). Bundled files under `scripts/`, `references/`,
    `assets/` (and any free-form subfolders) are NOT counted.
  - Default `context_budget_tokens` stays at 4000.
  - Hard ceiling drops from 16000 to 5000.
  - Warning threshold stays at 90% of declared budget.
  - A second metric, `bundled_resource_count`, is computed and
    surfaced in `dstack list` (informational only — no enforcement).
- **Effort**: 1 to 2 hours.
- **Depends on**: ADR-0016 (per-tier budget, supersedes ADR-0010).
- **Open questions**:
  - What happens to v1 skills that declared `context_budget_tokens >
    5000`? **Decision: migrate-v2 caps them at 5000 and emits a
    warning** asking the author to confirm the lower budget.

## M25 — Bundled resources support (`scripts/`, `references/`, `assets/`)

- **Why.** v1 has no way to ship executable scripts, reference docs, or
  output templates with a skill. The 9 of 17 official anthropic skills
  that need scripts have no analog in dstack. Without this, dstack
  cannot port `pdf`, `docx`, `skill-creator`, `webapp-testing`, or any
  Hybrid skill.
- **Acceptance**:
  - `FileSkillRepository` walks the skill directory and records every
    file under `skills/<id>/` other than `SKILL.md` as a bundled
    resource (with relative path from skill root).
  - `Installer` copies each bundled resource to `.claude/skills/<id>/`
    preserving its relative path and executable bit.
  - Path policy: reject `..` segments, reject absolute paths, reject
    symlinks. Reject paths starting with `_shared/` (reserved for
    legacy includes).
  - Free-form subfolders are allowed (so dstack can host skills like
    `claude-api/python/`, `theme-factory/themes/`).
  - A new contract test in `test/contract/Installer.contract.ts`
    verifies bundled-resource copying.
- **Effort**: 3 to 4 hours.
- **Depends on**: ADR-0017 (bundled resources), M21, M24.
- **Open questions**:
  - Should `_shared/` includes (M3 from v1) be deprecated since
    `references/` covers the same use case? **Decision: yes, but in a
    later milestone.** v2 keeps `_shared/` working for backward
    compatibility; the deprecation is tracked separately.

## M26 — Optional `LICENSE.txt` bundling

- **Why.** All 16 of 17 anthropics skills ship a `LICENSE.txt` at the
  skill root. The spec recommends it. Without this, dstack output is
  not legally complete for any skill that wants to declare licensing
  beyond the `license:` frontmatter string.
- **Acceptance**:
  - If `skills/<id>/LICENSE.txt` exists, the installer copies it
    verbatim to `.claude/skills/<id>/LICENSE.txt`.
  - `skill.spec.license` may reference it: `license: "Complete terms
    in LICENSE.txt"` (the spec's recommended pattern).
  - No new field is required.
- **Effort**: 30 minutes.
- **Depends on**: M25.
- **Open questions**: None.

## M27 — `type:` field with inferred default

- **Why.** [`docs/skill-taxonomy.md`](../../skill-taxonomy.md) defines
  four computation types, but `skill.yaml` does not yet encode them.
  Without an explicit type, the catalog cannot be audited, the
  validator cannot detect anti-patterns, and CI cannot reject
  dangerous combinations.
- **Acceptance**:
  - `metadata.dstack.type` accepts: `hybrid | semantic | deterministic
    | schema-semantic`.
  - When not declared, the type is inferred from structure:
    1. Has `metadata.dstack.output_schema` → `schema-semantic`
    2. Has `scripts/` folder → `hybrid`
    3. Has `scripts/` + body < 500 tokens → `deterministic`
    4. Else → `semantic`
  - Validator soft-warns when declared type contradicts structure:
    - `type: hybrid` but no `scripts/` → "labeled Hybrid but appears
      Semantic. Add scripts or change type."
    - `type: semantic` but has `scripts/` → "labeled Open-ended
      Semantic but has scripts. Consider Hybrid."
    - `type: deterministic` but body > 1000 tokens → "labeled
      Deterministic but prompt is large. Consider Hybrid."
    - `type: schema-semantic` but no `output_schema` → reject (hard
      error).
- **Effort**: 2 to 3 hours.
- **Depends on**: ADR-0015 (type taxonomy adoption), M22, M25.
- **Open questions**:
  - Should the inferred default be visible in `dstack list`?
    **Decision: yes, with a marker** (`hybrid*` if inferred, `hybrid`
    if declared).

---

# Should (high value, not blocking)

## M28 — `side_effects:` and `agency:` orthogonal axes

- **Why.** The taxonomy defines two safety-critical axes beyond `type`:
  `side_effects: readonly | local | external` and `agency: reactive |
  deliberative | autonomous`. The taxonomy's
  [Part 3 final check](../../skill-taxonomy.md#final-check-failure-cost)
  identifies the dangerous combination — semantic + external +
  autonomous — that almost always causes incidents. Without these
  fields, dstack cannot detect or reject the combination.
- **Acceptance**:
  - `metadata.dstack.side_effects` accepts `readonly | local |
    external`.
  - `metadata.dstack.agency` accepts `reactive | deliberative |
    autonomous`.
  - Defaults if omitted: `side_effects: readonly`, `agency: reactive`
    (the safest values).
  - `dstack list` shows both columns when `--profile` flag is passed.
- **Effort**: 30 minutes.
- **Depends on**: M27.
- **Open questions**: None.

## M29 — Anti-pattern validator

- **Why.** Two anti-patterns have empirical evidence behind them:
  1. SkillsBench Table 6 shows comprehensive skills (4+ modules) hurt
     performance by 2.9pp.
  2. Taxonomy anti-pattern 5: `semantic + external + autonomous`
     causes incidents.
  Neither is caught by v1's validator.
- **Acceptance**:
  - New validator rule: skills with 4+ module folders (under
    `skills/<id>/`) emit a `comprehensive-skill` warning citing
    SkillsBench data.
  - New validator rule: `type == semantic && side_effects == external
    && agency == autonomous` produces a build-time error (not a
    warning).
  - `dstack build --strict` (already shipped as v1 M14) treats the
    `comprehensive-skill` warning as fatal when strict mode is on.
- **Effort**: 1 hour.
- **Depends on**: M27, M28.
- **Open questions**: None.

## M30 — Spec-compliance test against agentskills.io schema

- **Why.** v1 [M19](../v1/DONE.md) added a spec-compatibility check
  but only against the inferred schema from anthropic-skills
  examples. agentskills.io now publishes a formal validator
  (`skills-ref validate ./skill`). v2 output should pass that
  validator without modification.
- **Acceptance**:
  - A new test in `test/contract/` runs the agentskills.io
    `skills-ref` validator (or a pinned local copy of the schema)
    against every rendered `SKILL.md`.
  - Test fails if any rendered skill is non-compliant.
  - Run as part of `bun test` and CI.
- **Effort**: 1 hour.
- **Depends on**: M22, M23.
- **Open questions**:
  - Pin the schema locally, or fetch from the website at test time?
    **Decision: pin locally.** Tests must run offline.

## M31 — Migrate existing six dstack skills to v2 format

- **Why.** The six v1 skills (`careful`, `tdd`, `debugging`,
  `code-review`, `brainstorm`, `verification`) currently use the v1
  schema. They need to (a) move to single-file `SKILL.md`, (b) declare
  explicit type, (c) declare `side_effects` and `agency`.
- **Acceptance**:
  - Each of the six skills has been re-classified per the taxonomy:
    | Skill | v1 effective type | v2 declared type |
    |---|---|---|
    | tdd | semantic | semantic |
    | brainstorm | semantic | semantic |
    | debugging | semantic | semantic |
    | code-review | semantic (degraded) | semantic for v2, upgrade to hybrid in M33 |
    | verification | semantic (degraded) | semantic for v2; could upgrade to hybrid in a follow-up |
    | careful | semantic (advisory) | semantic, with a note that the hook-based version is deferred (D2) |
  - All six skills converted via `bun run migrate-v2`.
  - `bun run build` passes for all six.
  - Each skill carries `metadata.dstack.side_effects` and
    `metadata.dstack.agency` explicitly.
- **Effort**: 1 hour (mostly running migrate-v2 plus a hand-tune of
  classifications).
- **Depends on**: M21, M22, M27, M28.
- **Open questions**: None.

## M32 — Add a Deterministic example skill

- **Why.** The official anthropic-skills catalog has zero
  Deterministic skills. dstack v2 needs at least one in-house example
  to validate the build pipeline for this type. Candidate: `/version`
  (read VERSION, write VERSION) or `/freeze` (set a flag file).
- **Acceptance**:
  - One skill of type `deterministic` lives under `skills/`.
  - Its body is under 500 tokens (it points the agent at a script).
  - It has a `scripts/<name>.sh` (or `.py`) that does the deterministic
    work.
  - Validator infers `type: deterministic` correctly.
- **Effort**: 1 to 2 hours.
- **Depends on**: M25, M27.
- **Open questions**:
  - Which deterministic skill is most useful for the user's workflow?
    Open for the author to pick at implementation time.

## M33 — Upgrade `code-review` to Hybrid

- **Why.** Per the taxonomy audit in M31, `code-review` is currently
  Open-ended Semantic but really should be Hybrid: read diff (code),
  reason (LLM), apply edits (code). Today the LLM does all of that via
  prompt instructions. Adding a `scripts/get_diff.sh` and changing the
  type to `hybrid` is the textbook Hybrid pattern from
  [taxonomy Part 1](../../skill-taxonomy.md#type-3-hybrid).
- **Acceptance**:
  - `skills/code-review/scripts/get_diff.sh` runs `git diff` (or `gh
    pr diff`) with the right arguments and prints to stdout.
  - The prompt body instructs the agent: "Run `scripts/get_diff.sh`,
    then reason about the diff, then apply suggested edits via Edit."
  - Type is declared `hybrid` (no longer inferred as Semantic).
  - Validator does not warn (scripts present, type matches structure).
- **Effort**: 1 to 2 hours.
- **Depends on**: M25, M27, M31.
- **Open questions**: None.

## M34 — Add a Schema-constrained Semantic example skill

- **Why.** Like M32, the official catalog has zero Schema-semantic
  skills. dstack v2 needs an example to validate that path. Candidate:
  `/classify-issue` that emits `{type: bug | feature | chore,
  priority: 1-5, reasoning: string}`.
- **Acceptance**:
  - One skill of type `schema-semantic` lives under `skills/`.
  - It declares `metadata.dstack.output_schema` as inline JSON Schema
    or a pointer to a file in the skill folder.
  - The schema is non-trivial (no `{result: string}` anti-pattern).
  - Validator infers or accepts `type: schema-semantic` and validates
    the schema is real JSON Schema (not just a YAML map).
- **Effort**: 1 to 2 hours.
- **Depends on**: M25, M27, M35 (output_schema field).
- **Open questions**:
  - How does the rendered skill convey the schema to Claude Code?
    **Initial decision: embed as a Markdown table in the SKILL.md
    body.** Future work could emit an MCP tool definition (deferred —
    see [DEFERRED.md](DEFERRED.md) D14).

---

# Could (postpone if Must or Should run long)

## M35 — `output_schema:` field for Schema-semantic skills

- **Why.** The Schema-semantic path needs a way to declare the schema.
  Without it, M34 has nothing to build on.
- **Acceptance**:
  - `metadata.dstack.output_schema` accepts an inline JSON Schema
    object OR a relative path to a `.json` file in the skill folder.
  - Validator checks the schema is parseable JSON Schema (via a
    library like `ajv`).
  - Validator rejects "too permissive" schemas: any schema where every
    string field is unbounded (anti-pattern 3 from the taxonomy).
- **Effort**: 2 hours.
- **Depends on**: M27.
- **Open questions**:
  - Use `ajv` (build-time JSON Schema validator) or write a minimal
    structural check? **Decision: `ajv`.** It's well-known and avoids
    reimplementation.

## M36 — `dstack list --group-by type`

- **Why.** Once the catalog has all four types represented, the user
  wants to see catalog profile at a glance: how many of each type.
- **Acceptance**:
  - `dstack list --group-by type` groups output by `type`.
  - The default `dstack list` adds a `type` column.
- **Effort**: 30 minutes.
- **Depends on**: M27.
- **Open questions**: None.

## M37 — `dstack new --type <type>` per-type scaffolding

- **Why.** v1's `dstack new <id>` emits a generic template. With the
  taxonomy in place, the template should adapt to the chosen type:
  Deterministic templates start with a script stub; Schema-semantic
  templates include an `output_schema` skeleton.
- **Acceptance**:
  - `dstack new <id> --type <type>` scaffolds the right structure for
    each of the four types.
  - The body of each template includes per-type "starter" prose.
- **Effort**: 1 hour.
- **Depends on**: M27, M32, M33, M34.
- **Open questions**: None.

## M38 — `dstack diff <version-a> <version-b>` for skills

- **Why.** Inherited from v1 M16. Auditing what changed in a skill
  between versions. Easier in v2 because each skill is a single file.
- **Acceptance**: Open. This is a "Could" placeholder for follow-up
  scope.
- **Effort**: 1 to 2 hours when picked up.
- **Depends on**: M21.

---

# Effort summary

| Tier | Items | Estimated effort |
|---|---|---|
| Must | M21–M27 | ~12 to 16 hours |
| Should | M28–M34 | ~7 to 10 hours |
| Could | M35–M38 | ~5 to 7 hours |

# Suggested order

The dependencies suggest this order:

```
ADR-0013 (single-file SKILL.md)
   |
   v
M21 (parse new format) ─── M22 (metadata namespace)
                                  |
                                  v
                          M23 (allowed-tools string)
                                  |
                                  v
                          ADR-0016, M24 (per-tier budget)
                                  |
                                  v
            ADR-0017, M25 (bundled resources) ── M26 (LICENSE.txt)
                                  |
                                  v
                  ADR-0015, M27 (type field + inferred default)
                                  |
                                  v
            M28 (axes)  ──  M29 (anti-pattern validator) ──  M30 (spec test)
                                  |
                                  v
                          M31 (migrate 6 skills)
                                  |
                                  +───────────┬──────────────┬─────────────┐
                                              |              |             |
                                              v              v             v
                                         M32 (det.)   M33 (hybrid)   M35 → M34 (schema-sem.)
                                              |
                                              v
                                      M36, M37, M38 (anytime after M27)
```

A reasonable v2 launch order: ADR-0013–0017 + M21–M27 (Must) lands the
schema. M28–M31 then make the validator type-aware and migrate the
catalog. M32–M34 add the missing-type examples. M35–M38 are cleanup.

# What's next (after v2 ships)

Once v2 ships, the catalog has four computation types validated and
strict spec compliance. The natural follow-up directions are tracked
in [DEFERRED.md](DEFERRED.md). The most likely v3 themes:

- **Multi-host renderers** (Gemini CLI, Codex, Cursor) — the renderer
  port is already in place; v2's spec compliance means most hosts
  need zero per-host transform.
- **Schema-driven CI gates** — beyond the dangerous-combination check
  from M29, more sophisticated per-skill type checks.
- **LLM-judge evaluation harness** — still deferred (v1 D3), but with
  SkillsBench as a reference design, this is now more concretely
  scoped.
