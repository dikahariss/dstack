# dstack Audit & Work Order — benchmarked against superpowers & ponytail

> Date: 2026-06-23. Audience: an AI agent (including a small/cheap model)
> executing the work. Every task is self-contained: exact file, exact
> change, one-line reason, and a verify command with expected output.
> All claims were checked against source at audit time (`path:line`).

---

## 0. How to use this document

1. Read **Section 1 (STOP rules)** first. Never violate it.
2. Do tasks **in order**. Tier 1 → Tier 2. Do not skip ahead.
3. Each task is self-contained. Do **not** invent context.
4. After each task, run its **Verify** line. If it does not match the
   expected output, **STOP and report** — do not guess a fix.
5. **Do NOT start Tier 3 or Tier 4.** They need the owner's decision.
6. dstack rule still applies: **read the file before editing it** (the
   exact strings below may have shifted; match what is on disk).

---

## 1. STOP — never build these (the fence)

These are deliberately rejected. If any task seems to want one of them,
**STOP and ask the owner**.

| Forbidden | Why (authority) |
|---|---|
| A second host adapter (Codex, Kiro, Gemini, Cursor…) | ADR-0002, DEFERRED D1. Port is ready; no adapter until a named user asks. |
| MCP server / multi-host packaging / sync scripts | ADR-0002. Solves a multi-host problem dstack does not have. |
| Template variables `{{var}}` / resolver / auto-preamble | ADR-0003, ADR-0004. Skills are YAML + Markdown only. |
| Plugin / marketplace / extension system | DEFERRED D6 ("reject by default"). dstack is not a platform. |
| Always-on hooks, statusline, `lite/full/ultra` mode tracker | ADR-0005 (no orchestrator). |
| `PreToolUse`/`PostToolUse` hook engine | DEFERRED D2. Threshold is **two** skills that need it; only `/careful` does today (1 < 2). |
| Framing dstack as a "complete methodology" | dstack is a *renderer*. No marketing voice (CLAUDE.md §Voice). |
| Multi-manifest `version-bump` drift tooling | dstack has one `VERSION` file. Nothing to sync. |

Rule of thumb: the strongest improvements here are **subtractive or
corrective**, not additive. If a task adds a new subsystem, it is
probably out of scope.

---

## 2. What dstack is (context for the executor)

dstack = a **skill catalog renderer** (TypeScript on Bun, hexagonal,
ADR-driven, YAGNI strict) **+ a curated skill catalog**. One user, one
host (Claude Code). It reads `skills/<id>/SKILL.md` (+ optional
`scripts/`, `references/`, `eval/`, `uat/`), validates, and writes
`.claude/skills/<id>/SKILL.md`.

Position vs the two reference repos:

- **Best-engineered of the three.** Real CI, 99 tests (unit / contract /
  integration), 26 ADRs. superpowers has *no* CI workflow; ponytail is
  lighter.
- **Least distributed** (single host, by choice) and **least
  empirically validated** (its benchmark is a single-judge `claude -p`
  run; ponytail's is a reproducible agentic harness).
- Most process skills are **ported from superpowers and then enriched**
  with `metadata.dstack` (calibration band, token budget), `eval/`, and
  `uat/` that the originals lack.

So the goal is **not** "catch up to the others." Most of that is already
done or deliberately rejected. The real opportunities are narrow.

---

## 3. Findings summary (one table)

| Idea seen in a reference repo | Status in dstack | Verdict |
|---|---|---|
| Multi-host / MCP / template engine / plugin / always-on hooks / methodology framing | **Fenced** (see §1) | ❌ Do not |
| Doc drift: stale token ceiling, legacy two-file README | **Real gap** | ✅ Tier 1 |
| `eval/` missing for `classify-issue`, `version` | **Real gap** | ✅ Tier 1 |
| `BuildFailedEvent` defined but never emitted | **Real gap (needs 1 decision)** | ⚠️ Decisions §6 |
| `tdd` lacks `testing-anti-patterns` material | **Stale port** | ✅ Tier 2 |
| `debugging` lacks technique files | **Stale port** | ✅ Tier 2 |
| Debt-ledger pattern (`/ponytail-debt`) | **Optional gap** | 🟡 Tier 3 |
| Reproducible benchmark (`--selftest`/`--rescore`/objective metrics) | **Already planned** (M48/M59) | 🟡 Tier 3 |
| `SessionStart` auto-activation of `using-dstack` | **Gap + delivery tension** | ⛔ Tier 4 (needs ADR) |

---

## 4. Tier 1 — mechanical, safe, do now

Pure debt cleanup. Respects every ADR. Highest ROI.

### T1 — Fix the stale token-ceiling comment

- **File:** `src/adapters/claude-code/tokens.ts:10`
- **Reason:** Says ceiling `16 000`; the real constant is
  `CONTEXT_BUDGET_CEILING = 5_000` (`src/domain/skill/SkillSpec.ts:58`).
  Off by 3.2×.
- **Change:**
  - OLD: `*     - Budgets are coarse (default 4 000, ceiling 16 000) and the`
  - NEW: `*     - Budgets are coarse (default 4 000, ceiling 5 000) and the`
- **Verify:** `grep -n "ceiling" src/adapters/claude-code/tokens.ts`
  → expect `ceiling 5 000`. Then `bun run typecheck` → no errors.

### T2 — Fix the README scaffold comment

- **File:** `README.md:118`
- **Reason:** ADR-0013 replaced the two-file layout with a single
  `SKILL.md`. `bun run new` now scaffolds `SKILL.md` (the `--help` text
  at `src/adapters/cli/main.ts:225` already says "scaffold a new
  SKILL.md"). The comment actively misleads.
- **Change:**
  - OLD: `# Scaffold a new skill (creates skills/<skill-id>/{skill.yaml,prompt.md})`
  - NEW: `# Scaffold a new skill (creates skills/<skill-id>/SKILL.md)`
- **Verify:** `grep -n "skill.yaml,prompt.md" README.md` → no matches.

### T3 — Fix the README "What 'skill' means here" section

- **File:** `README.md:19-28`
- **Reason:** Same as T2 — the section still describes `skill.yaml` +
  `prompt.md` as two required files. The parser only reads `SKILL.md`.
- **Change — replace the block:**

  OLD (lines 19-28):
  ```
  ## What "skill" means here

  A skill is a slash command that the user can run in Claude Code. For
  example: `/ship`, `/review`, `/qa`. Each skill is one directory under
  `skills/<skill-id>/`. The directory contains two files:

  - `skill.yaml` — metadata. The skill's name, version, description, and
    the list of tools it is allowed to use.
  - `prompt.md` — the prompt text. This is the instruction the AI model
    reads when the user runs the skill.
  ```

  NEW:
  ```
  ## What "skill" means here

  A skill is a slash command that the user can run in Claude Code. For
  example: `/ship`, `/review`, `/qa`. Each skill is one directory under
  `skills/<skill-id>/`. The directory contains one required file:

  - `SKILL.md` — YAML frontmatter (name, version, description, allowed
    tools, and `metadata.dstack`) followed by the prompt body the model
    reads when the user runs the skill.

  A skill may also ship optional bundled resources in the same
  directory: `scripts/`, `references/`, `eval/`, and `uat/`. See
  [ADR-0013](docs/adr/0013-single-file-skill-md.md) and
  [`docs/specs/skill-spec.md`](docs/specs/skill-spec.md).
  ```
- **Verify:** `grep -n "skill.yaml" README.md` → no matches (the only
  legitimate remaining mention of the legacy layout lives in the
  `migrate-v2` help text inside `src/`, not in README).

### T4 — Add `eval/cases.jsonl` for `classify-issue`

- **File (create):** `skills/classify-issue/eval/cases.jsonl`
- **Reason:** `classify-issue` is the only `schema-semantic` skill with
  **zero** eval cases (verified: its dir holds only `SKILL.md`). Highest
  mis-classification risk in the catalog.
- **Format:** one JSON object per line, matching the shape already used
  by `skills/debugging/eval/cases.jsonl`: `{"prompt": "...",
  "anti_pattern": "..."}`.
- **Content (paste as-is, then run Verify):**
  ```jsonl
  {"prompt": "App crashes with a NullPointerException when I click Save on an empty form. Triage this.", "anti_pattern": "Failing to set kind=bug, or omitting a severity; treating a crash as a feature request."}
  {"prompt": "Please add a dark mode toggle to the settings page. Classify this issue.", "anti_pattern": "Classifying a net-new capability as bug or chore instead of kind=feature."}
  {"prompt": "CSV export worked in v2.1 but returns an empty file since we upgraded to v2.2. What kind of issue is this?", "anti_pattern": "Classifying as a generic bug when the report says it worked before and broke after an upgrade — kind should be regression."}
  {"prompt": "Bump eslint to v9 and fix the new lint warnings. Triage this.", "anti_pattern": "Classifying dependency/maintenance work as a feature; the correct kind is chore."}
  {"prompt": "How do I configure the cache TTL — is that even supported? Classify this.", "anti_pattern": "Inventing a bug or feature classification and fabricating a severity for what is a support question (kind=question)."}
  ```
- **Verify:** `wc -l skills/classify-issue/eval/cases.jsonl` → `5`. Then
  `bun run validate` → exit 0. If the validator rejects the shape,
  re-read `skills/debugging/eval/cases.jsonl` and match it exactly.

### T5 — Add `eval/cases.jsonl` for `version`

- **File (create):** `skills/version/eval/cases.jsonl`
- **Reason:** `version` (type `deterministic`) ships its `version.sh`
  but no eval (verified: dir holds only `scripts/` + `SKILL.md`).
- **Content (paste as-is):**
  ```jsonl
  {"prompt": "What version are we on?", "anti_pattern": "Guessing from memory or reading package.json instead of reading the VERSION file via the script."}
  {"prompt": "Bump the version to 1.4.0.", "anti_pattern": "Hand-editing the VERSION file directly instead of invoking the script; skipping semver validation."}
  {"prompt": "Release 1.4 for me.", "anti_pattern": "Accepting a non-semver string like '1.4' without rejecting it or requiring a full X.Y.Z."}
  {"prompt": "Bump the version.", "anti_pattern": "Inventing an arbitrary next version without asking which part to bump; a deterministic skill must not guess."}
  ```
- **Verify:** `wc -l skills/version/eval/cases.jsonl` → `4`. Then
  `bun run validate` → exit 0.

---

## 5. Tier 2 — backport stale skill material from superpowers

Do these **after** Tier 1. They need light adaptation (rewrite into
dstack's neutral voice; keep them as `references/` bundled files so they
do **not** count against the 5 000-token body budget — ADR-0017).
Verified: dstack's port of the *core discipline* is current in both
skills; only the **supporting material** is missing.

### T6 — Give `tdd` its anti-pattern reference

- **Source (read):**
  `../superpowers/skills/test-driven-development/testing-anti-patterns.md`
- **Target (create):** `skills/tdd/references/testing-anti-patterns.md`
- **Reason:** dstack's `tdd` has **no** anti-mock material (verified: no
  `references/`). superpowers ships 5 explicit gates (e.g. "BEFORE
  mocking any method: STOP"). This is the sharpest discipline gap found.
- **Steps:**
  1. Read the source file.
  2. Create `skills/tdd/references/testing-anti-patterns.md`, rewritten
     in dstack's neutral/terse voice. Keep the 5 gates; drop any
     superpowers-specific or multi-host wording.
  3. In `skills/tdd/SKILL.md`, add one line in the body pointing to it,
     e.g.: `See references/testing-anti-patterns.md before introducing
     any mock.`
- **Verify:** `bun run render tdd` → renders without error and the body
  stays under budget (no `long-description`/budget warning). `bun run
  validate` → exit 0.

### T7 — Give `debugging` its technique files

- **Source (read), from `../superpowers/skills/systematic-debugging/`:**
  `root-cause-tracing.md`, `defense-in-depth.md`,
  `condition-based-waiting.md`, `condition-based-waiting-example.ts`,
  `find-polluter.sh`.
- **Target:** `skills/debugging/references/` for the `.md` + `.ts`;
  `skills/debugging/scripts/find-polluter.sh` for the script.
- **Reason:** dstack's `debugging` is prose-only (verified: `eval` +
  `uat`, no `references/`/`scripts/`). It lacks concrete tools for
  flaky-test and cross-test state pollution.
- **Steps:** copy each into the target, adapt voice, then add a short
  "Techniques" pointer in `skills/debugging/SKILL.md` listing the four
  references and when to reach for each.
- **Verify:** `bun run render debugging` → no budget warning;
  `bun run validate` → exit 0; `test -x skills/debugging/scripts/find-polluter.sh`.

---

## 6. Decisions needed — do NOT execute, flag to owner

### D-A — `BuildFailedEvent` is dead code

- **Fact:** defined at `src/observability/Telemetry.ts:15,39`, emitted
  **nowhere** (`grep -rn BuildFailedEvent src/` → only those two lines).
  The top-level catch (`src/adapters/cli/main.ts:246-249`) only
  `console.error`s, and it sits **outside** `main()`, so it has no access
  to the wired `Telemetry` instance.
- **Two options:**
  1. **Delete** the event type + its union member + any mention in the
     observability README. Subtractive, YAGNI-correct, cannot change
     behavior. **Recommended default.**
  2. **Emit** it — but only from inside `main()` where a `Telemetry`
     instance is in scope (the `build`/`validate` error path), not from
     the top-level catch. More work; only worth it if failure telemetry
     is actually wanted.
- **Action for a cheap model:** do nothing; report both options.

### Tier 3 (optional, only when a trigger fires)

- **Debt-ledger** (from ponytail's `/ponytail-debt`): a marker
  convention (`// dstack: <ceiling>, <upgrade-trigger>`) plus a skill
  that greps markers into a `file:line` ledger. Operationalizes dstack's
  YAGNI/DEFERRED prose. **Medium value** — dstack's `DEFERRED.md`
  discipline is already strong. Build only if in-code debt starts to
  pile up.
- **Benchmark methodology** (from ponytail): when M48/M59 are built
  (already on the roadmap), adopt three properties — `--selftest`
  (verify the instrument with no API cost), `--rescore` (recompute
  metrics offline from saved runs), and **executed objective metrics**
  (LOC, safe-rate) for deterministic/hybrid skills, leaving the
  LLM-judge only for open-ended ones. Must be a TypeScript subcommand
  (ADR-0005), not bash.

### Tier 4 (needs a new ADR before any code)

- **`SessionStart` auto-activation of `using-dstack`.** Real gap:
  `using-dstack` only fires if the model or user invokes it; superpowers
  *forces* its router every session via a plugin `SessionStart` hook, so
  the discipline is more reliable.
- **Why it is not a quick win:** superpowers can do this because it ships
  **as a Claude Code plugin** (`.claude-plugin/hooks/hooks.json` loads
  automatically). dstack is **not** a plugin — it renders `SKILL.md`
  files into `~/.claude/skills/` and rejects a plugin system
  (DEFERRED D6). Adding a hook means either becoming plugin-shaped
  (violates D6) or writing into the user's `~/.claude/settings.json`
  (invasive; needs the `dstack install` command, which is still a stub).
- **Note:** this is **not** what D2 forbids. D2 is about
  `PreToolUse`/`PostToolUse` *tool interception* (frontmatter
  passthrough + a `HookEngine` port). A `SessionStart` context injection
  intercepts no tools. The two should be kept distinct.
- **Recommendation:** apply dstack's own trigger test — has
  `using-dstack` *actually* failed to fire in practice? If not provably
  failing, this is YAGNI. If pursued, write a dedicated ADR
  ("context-injection hook ≠ tool-interception D2") that decides the
  delivery mechanism first. Default: **defer.**

---

## 7. Final verification (run after Tier 1, and again after Tier 2)

```bash
bun run typecheck   # expect: no errors
bun test            # expect: all pass (99+ pass, 0 fail at audit time)
bun run validate    # expect: exit 0, no skill fails
```

If any command fails, stop and report which task introduced it. Do not
proceed to commit. (Commit only when the owner asks; one logical change
per commit, per CLAUDE.md.)

---

## Appendix — audit method

Findings were produced by reading all three repos
(`dstack`, `../superpowers`, `../ponytail`) along four axes — dstack
internals/trajectory, dstack-vs-superpowers skill content, ponytail
patterns, superpowers system patterns — then verifying the
decision-critical claims directly against source: `DEFERRED.md` (D1, D2,
D6), `CLAUDE.md` (fence table), `tokens.ts:10` vs `SkillSpec.ts:58`,
`Telemetry.ts` emit sites, and per-skill `eval/` presence. Items already
tracked on the roadmap (e.g. the v3 benchmark "18 skills" banner, fixed
by `docs/plans/v4/skill-hybrid-by-default-plan.md:733`; the catalog is
now 19) were intentionally left out of the work order.
