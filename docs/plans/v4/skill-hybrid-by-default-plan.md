# Hybrid-by-default doctrine — implementation plan

**Goal:** Make every dstack skill *hybrid by default*: a deterministic
spine that guides HOW the agent works, plus one named place where the
agent uses its own judgment and makes the final call. Encode this in the
docs, the authoring skill, and one light build warning. Add a
`calibration` flag so the owner can move a skill off the default band
when evidence proves the default is sub-optimal.

**Architecture:** Two axes, kept separate.
1. `type` (ADR-0015) = *how work runs* (code vs LLM). Unchanged.
2. **Calibration** (this plan, ADR-0025) = *how much freedom the prompt
   gives the agent*. The deterministic share is a **spectrum, not one
   number**: a skill can be 10%, 20%, the **30% default**, or up to ~80%
   deterministic. Four named bands mark points on that spectrum. A new
   **optional `calibration` frontmatter flag** records the band; omitted
   = `workflow` (the ~30% Hybrid default). Moving off `workflow` is
   **owner-decided and evidence-based** (see Governance). Enforcement
   stays light: docs + `/writing-skills` + CLAUDE.md + one band-aware
   build *warning* (`missing-spine`). No hard error gate (deferred, D29).

**Stack:** Markdown (docs, ADR, skills) + a small TypeScript/Bun change
(the `calibration` field through `SkillType`/`SkillSpec`/parser/renderer,
the `missing-spine` warning, fixtures, tests).

Implement task by task. Per code task: `/tdd` for the red-green-refactor
cycle, then `/verification` before marking it done. Doc/skill tasks use
`bun run validate` + `bun run build --strict` as their gate. Request
review at checkpoints with `/requesting-code-review`. Steps use `- [ ]`
checkboxes.

**Write for a cheap model.** Every doctrine section leads with a one-line
rule, then a table, then one example. Short sentences. Concrete numbers.
All documents in English. A smaller model must be able to read a skill's
frontmatter `calibration` value and know how much to lean on rails vs its
own judgment, without re-deriving anything.

---

## The doctrine (self-contained, cheap-model first)

**The one rule:** every skill body has (1) a deterministic spine and
(2) a named judgment surface. How *much* spine depends on the band; the
*presence* of both never changes.

### Part 1 — the invariant (true for all 18 skills)

- **Spine** = structure that controls HOW the agent works (ordered steps,
  a gate, a constraining table/checklist, exact commands).
- **Judgment surface** = one explicit sentence saying WHERE the agent
  decides, may research the latest, and makes the final call.
- Even the most deterministic skill names a small judgment ("pick the
  subcommand"). Even the most judgment-heavy skill keeps a small spine
  ("recommendation first, then one question").

### Part 2 — the spectrum and the four bands

"Deterministic share" = how much of the skill's value is rails vs
judgment. It is a **dial, not one number**. 30% is only the DEFAULT.

```
more judgment  <───────────────────────────────────────────>  more rails
    10–20%            ~30% (DEFAULT)           60–80%+            ~100%
 judgment-            workflow             deterministic-      (type:
 dominant            (Hybrid)               dominant         deterministic)
```

| Band (`calibration`) | Det. share | Use when | Example |
|---|---|---|---|
| `judgment-dominant` | 10–20% | the agent's reasoning IS the product; rails are tiny | `brainstorm` |
| `workflow` **(DEFAULT)** | ~30% | a task with ground truth; rails guide, agent decides | `debugging`, `code-review` |
| `deterministic-dominant` | 60–80%+ | safety/consistency-critical; rails dominate, judgment is small and bounded | `careful`, `verification` |
| `schema-meta` | not a % | determinism is the output schema or a routing rule, not a procedure | `classify-issue`, `using-dstack` |

`type: deterministic` skills (e.g. `version`) sit at the ~100% end. They
need **no** `calibration` flag — the `type` already says it.

### Part 3 — the flag

```yaml
metadata:
  dstack:
    calibration: workflow   # or: judgment-dominant | deterministic-dominant | schema-meta
```

- **Optional.** Omitted = `workflow`.
- It does **not** change `type` (different axis).
- It is **rendered into the skill's frontmatter**, so the consuming model
  always sees the band — including `calibration: workflow` on default
  skills. One line, zero body-token cost (frontmatter is not counted).

### Part 4 — Governance (default Hybrid; an override is earned)

A skill stays `workflow` (Hybrid, ~30%) by default. The justification
needed to move depends on the **direction**:

| Move | Direction | Evidence required | Owner decision |
|---|---|---|---|
| `workflow` → `judgment-dominant` | MORE AI freedom (risky) | **Empirical** — a benchmark, UAT, or test showing the default over-constrains this skill | **Required** |
| `workflow` → `deterministic-dominant` | MORE rails (safe) | A documented rationale (high failure cost, external mutation, etc.) | **Required** |
| `workflow` → `schema-meta` | structural (safe) | A documented rationale (output is schema-bound, or skill is a router) | **Required** |

This asymmetry is the point: **adding AI freedom must be proven; adding
rails only needs a reason.** Record both the evidence and the decision in
the skill's `## Changes`. Example:

```
0.3.0 — calibration: judgment-dominant. Evidence: v3 benchmark — /brainstorm
loses to mattpocock/grill-me when over-structured. Owner-approved 2026-06-04.
```

A skill becomes "mostly AI judgment" only on proof plus a human decision,
never by drift. That is what keeps the Hybrid default safe.

### Part 5 — what "spine" means (the five elements)

Have at least the first three; element (e) only where a command applies.
Deterministic-dominant skills will have more of them; judgment-dominant
skills may have only (a) + (b).

| # | Spine element | Example in catalog |
|---|---|---|
| (a) | Ordered procedure / numbered phases / step sequence | `debugging` four phases; `version` intent→command table |
| (b) | A gate — "do not proceed until X" / stop / iron law | `verification` "NO COMPLETION CLAIMS WITHOUT FRESH EVIDENCE" |
| (c) | A checklist (`- [ ]`) or a copy-this list | `tdd` verification checklist |
| (d) | A constraining table — forbidden-action / wrong-vs-right / red-flags / triage | `debugging` triage table; `careful` patterns table |
| (e) | Exact command(s) with expected output | `verification` default gate bash with exit codes |

### Part 6 — what "named judgment" means (reusable sentences)

- **workflow / judgment-dominant bands:**
  > Where your judgment takes over: `<decision>`. Research the latest
  > `<facts/APIs>` as needed; the rails constrain HOW, not WHAT — the
  > final call is yours.
- **deterministic-dominant / schema-meta bands:** the judgment line must
  be **bounded** (one scoped call) and must **not** say "research the
  latest, the call is yours." Example (`careful`):
  > The only judgment: is this novel command also destructive? If unsure,
  > pause and ask. Do not improvise a "faster" path.

### Part 7 — exemplar and the two-axis reminder

`skills/angular21-maritimhub/SKILL.md` § "How the work is split" already
states the split as **"Deterministic (~30%, the scripts) / Semantic
(~70%, you)."** It is the `workflow`-band template. Point new authors
there.

| Concept | Axis | Source | This plan |
|---|---|---|---|
| `type: deterministic\|semantic\|hybrid\|schema-semantic` | *How work runs* | ADR-0015 | Unchanged |
| `calibration` (4 bands) | *How much freedom the prompt gives* | ADR-0025 | New, separate axis |

A `type: semantic` skill is the normal carrier of the doctrine: no
runtime code, yet its prompt still has a deterministic spine. Do **not**
set `type: hybrid` to satisfy the doctrine.

---

## Audit results (point-in-time, 18 skills)

Two independent labels per skill:
- **Tier** = how much *work* this rollout needs. P0 = missing the
  `type/side_effects/agency` triplet OR no spine. P1 = has a spine but
  judgment unnamed or one element missing. P2 = strong, conformance only.
- **Band** = the skill's *ideal calibration* (from `docs/plans/v4/RESEARCH.md`).

| Skill | Tier | Band → flag to set | Why this band |
|---|---|---|---|
| `careful` | **P0** | `deterministic-dominant` | Safety guardrail; high failure cost |
| `verification` | P2 | `deterministic-dominant` | Discipline gate; the rails ARE the value |
| `finishing-a-development-branch` | P2 | `deterministic-dominant` | `side_effects: external`; exact bash dominates |
| `using-git-worktrees` | P2 | `deterministic-dominant` | Deterministic by design (detection + exact bash) |
| `version` | P2 | *(none — `type: deterministic`)* | ~100% script; type already says it |
| `brainstorm` | P2 | `judgment-dominant` | **Empirical:** v3 benchmark loss when over-structured |
| `classify-issue` | P1 | `schema-meta` | Determinism is the output schema, not steps |
| `using-dstack` | P1 | `schema-meta` | Meta/router; "spine" is a routing rule |
| `debugging` | P2 | `workflow` (default) | Workflow; rails help (benchmark-proven) |
| `code-review` | P2 | `workflow` | Workflow + script |
| `tdd` | P2 | `workflow` | Discipline but well-balanced ~40%; stays workflow |
| `writing-plans` | P2 | `workflow` | Workflow |
| `writing-skills` | P2 | `workflow` | Workflow |
| `dispatching-parallel-agents` | P1 | `workflow` | Workflow |
| `executing-plans` | P1 | `workflow` | Workflow router |
| `subagent-driven-development` | P2 | `workflow` | Workflow |
| `requesting-code-review` | P1 | `workflow` | Workflow |
| `angular21-maritimhub` | P1 | `workflow` | The workflow exemplar |

**Bands:** 4 deterministic-dominant, 1 judgment-dominant, 2 schema-meta,
10 workflow (default), 1 via `type: deterministic`. Only the **7
non-default** skills need the flag *set*; the 10 workflow skills may omit
it (the renderer still emits `calibration: workflow`).

Current token usage (`bun run validate`, for headroom planning):

```
angular21-maritimhub 2776/4500   brainstorm 2052/2500   careful 801/1500
classify-issue 927/1500   code-review 2300/3500   debugging 3474/4500
dispatching-parallel-agents 1847/3000   executing-plans 821/1500
finishing-a-development-branch 2040/3500   requesting-code-review 803/2000
subagent-driven-development 3539/4500   tdd 2382/4500   using-dstack 803/1800
using-git-worktrees 2304/3500   verification 2131/3500   version 390/1000
writing-plans 1204/2500   writing-skills 1816/2500
```

`context_budget_tokens` is **body-only** — frontmatter edits (the
triplet, the `calibration` flag) cost zero budget. Watch only
`brainstorm` (448 free) and `writing-skills` (684 free) for body edits.

---

## File-structure map (what each task touches)

| File | Responsibility | Track |
|---|---|---|
| `docs/adr/0025-hybrid-by-default-doctrine.md` | New ADR: bands + flag + governance | A |
| `docs/adr/README.md` | Add ADR-0025 index row | A |
| `docs/ARCHITECTURE.md` | Add ADR-0025 to its index | A |
| `docs/specs/skill-spec.md` | Document the `calibration` field | A |
| `docs/skill-quality-playbook.md` | New §1.15 doctrine; fix stale §4.3 | A, C |
| `docs/skill-taxonomy.md` | De-stale Part 6; type-vs-calibration note; real examples | A, C |
| `skills/writing-skills/SKILL.md` | Encode doctrine + band-picking + fix `TodoWrite` | A |
| `CLAUDE.md` | Point "Code conventions" at the doctrine | A |
| `src/domain/skill/SkillType.ts` | Add `Calibration` union | B |
| `src/domain/skill/SkillSpec.ts` | Add `calibration` field | B |
| `src/adapters/fs/FileSkillRepository.ts` | Parse `calibration` (default `workflow`) | B |
| `src/adapters/claude-code/ClaudeCodeRenderer.ts` | Emit `calibration`; band-aware `missing-spine` | B |
| `src/domain/render/RenderResult.ts` | Add `missing-spine` to `WarningKind` | B |
| `src/adapters/cli/warning-formatter.ts` | Render the new warning kind | B |
| `test/fixtures/skills/warnings-no-spine/no-spine/SKILL.md` | Fixture | B |
| `test/unit/adapters/fs/warnings.test.ts` | Warning + calibration tests | B |
| `docs/plans/v3/DEFERRED.md` | D29: trigger to escalate to a hard gate | B |
| `skills/careful/SKILL.md` | P0: triplet + flag + bounded judgment | D |
| 7× non-default `skills/<id>/SKILL.md` | Set `calibration` + record evidence/owner | D |
| 10× workflow `skills/<id>/SKILL.md` | Name judgment; flag optional | D |
| `docs/v3-benchmark-report.md` | Staleness banner (8→18) | C |
| `docs/plans/v3/skill-hardening-plan.md` | Superseded-by banner → this plan | E |

---

## Track A — Doctrine and terminology (foundation; do first)

### Task A1: Write ADR-0025

**Files:**
- Create: `docs/adr/0025-hybrid-by-default-doctrine.md`
- Modify: `docs/adr/README.md` (index; 0025 is the next free number after 0024)
- Modify: `docs/ARCHITECTURE.md` (ADR index)

- [ ] **Step 1 — write the ADR.** Six-section format from
  `docs/adr/README.md`. Exact content:

```markdown
# ADR-0025 — Hybrid by default: deterministic spine + named judgment, with a calibration flag

- **Status:** Accepted
- **Date:** 2026-06-04
- **Reversibility:** Cheap.

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
```

- [ ] **Step 2 — index it.** Add to `docs/adr/README.md` after the 0024 row:

```markdown
| [0025](0025-hybrid-by-default-doctrine.md) | Hybrid by default: spine + judgment + calibration flag | Accepted | Cheap |
```

- [ ] **Step 3 — add to `docs/ARCHITECTURE.md`** ADR index (match its row format).

- [ ] **Step 4 — verify.** Run: `grep -r "0025" docs/adr/README.md docs/ARCHITECTURE.md`
  Expected: the row in both.

- [ ] **Step 5 — commit:** `docs(adr): add ADR-0025 hybrid-by-default doctrine + calibration flag`

### Task A2: Document the `calibration` field in the spec

**Files:**
- Modify: `docs/specs/skill-spec.md` (frontmatter schema + validation table + type-inference note)

- [ ] **Step 1 — add the field** to the OPTIONAL `metadata.dstack` block,
  after `agency`:

```yaml
    calibration: deterministic-dominant | workflow | judgment-dominant | schema-meta
      # Freedom-calibration band (ADR-0025). Defaults to `workflow`.
      # Independent of `type`. Rendered into output frontmatter so the
      # consuming model sees the band. Moving off `workflow` is
      # owner-decided; see ADR-0025 Governance.
```

- [ ] **Step 2 — add a validation row** to the rules table:

```markdown
| `calibration` is one of the four band values | Error | Parse fails. |
| `calibration: judgment-dominant` or `deterministic-dominant` AND body has no spine | Warning | `missing-spine` (band-aware). |
```

- [ ] **Step 3 — one-line note** under "Type inference": "`calibration` is
  a separate axis from `type`; it is never inferred from `type` and never
  changes it (ADR-0025)."

- [ ] **Step 4 — verify.** Run: `bun run validate` → still `18 OK, 0 ERR`
  (spec is a doc; this confirms no regression).

- [ ] **Step 5 — commit:** `docs(spec): document the calibration field (ADR-0025)`

### Task A3: Add the doctrine to the quality playbook

**Files:**
- Modify: `docs/skill-quality-playbook.md` (add §1.15 after §1.14)

- [ ] **Step 1 — insert §1.15** (cheap-model first: rule, table, example):

```markdown
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
`skills/angular21-maritimhub/SKILL.md` § "How the work is split".
```

- [ ] **Step 2 — verify.** Run: `bun run validate` → `18 OK, 0 ERR`.

- [ ] **Step 3 — commit:** `docs(playbook): add §1.15 hybrid-by-default doctrine`

### Task A4: De-stale and clarify the taxonomy

**Files:**
- Modify: `docs/skill-taxonomy.md`

- [ ] **Step 1 — fix Part 6 staleness.** Replace the Part 6 intro
  ("None of these changes are committed yet…") with:

```markdown
## Part 6 — Implications for dstack architecture

Section 6.1 (the `type`/`side_effects`/`agency` fields) has since been
adopted by [ADR-0015](adr/0015-type-taxonomy-adoption.md) and is live in
[skill-spec.md](specs/skill-spec.md). The `calibration` field
([ADR-0025](adr/0025-hybrid-by-default-doctrine.md)) is a separate axis,
also live. Subsections 6.2–6.5 remain proposals; each needs its own ADR.
```

- [ ] **Step 2 — add a type-vs-calibration note** at the end of Part 1:

```markdown
### Computation type is not the calibration doctrine

The four types answer *how work runs* (code vs LLM). They are distinct
from the **calibration** axis ([ADR-0025](adr/0025-hybrid-by-default-doctrine.md)):
how much freedom the prompt gives the agent (judgment-dominant → workflow
→ deterministic-dominant → schema-meta). A `type: semantic` skill normally
still has a deterministic spine. Do not set `type: hybrid` to satisfy the
doctrine; the doctrine is satisfied by body structure + the `calibration`
flag, not the type enum.
```

- [ ] **Step 3 — ground the example skills.** Part 1's example table and
  the `/ship` worked example use skills not in the catalog (`/ship`,
  `/freeze`, `/office-hours`, `/retro`, `/canary`, `/autoplan`, `/qa`).
  Swap the example table to real skills (`/version` Deterministic,
  `/code-review` Hybrid, `/classify-issue` Schema-constrained,
  `/brainstorm` Open-ended Semantic); keep `/ship` only as an explicitly
  labelled hypothetical in the worked example.

- [ ] **Step 4 — verify.** Run: `grep -nE "/ship|/freeze|/office-hours|/retro|/canary|/autoplan|/qa" docs/skill-taxonomy.md`
  Expected: remaining hits only inside the labelled hypothetical.

- [ ] **Step 5 — commit:** `docs(taxonomy): de-stale Part 6, separate type from calibration, ground examples`

### Task A5: Encode the doctrine in `/writing-skills` + CLAUDE.md

**Files:**
- Modify: `skills/writing-skills/SKILL.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1 — extend the "SKILL.md shape" body list.** After the
  "**The pattern / steps**" bullet:

```markdown
- **Spine + named judgment, then pick a band** (ADR-0025, playbook §1.15) —
  the body needs a deterministic spine (steps + a gate + a table/checklist;
  exact commands where applicable) AND one sentence naming where the
  agent's judgment takes over. Then pick a calibration band: `workflow`
  (~30% det, the default — omit the flag), `judgment-dominant` (10–20%),
  `deterministic-dominant` (60–80%+), or `schema-meta`. Set
  `metadata.dstack.calibration` only when NOT `workflow`. Moving to
  `judgment-dominant` needs benchmark/UAT/test evidence + owner approval
  (record in `## Changes`). Exemplar: `skills/angular21-maritimhub` §
  "How the work is split".
```

- [ ] **Step 2 — add a checklist item** after "One excellent example…":

```markdown
- [ ] Spine present (steps + gate + table/checklist) AND judgment named in
      one sentence; `calibration` band chosen (flag set if not `workflow`)
```

- [ ] **Step 3 — fix `TodoWrite`.** Change the heading
  `## Checklist (use TodoWrite)` to `## Checklist (track one todo per item)`
  (`TodoWrite` is not in the Claude Code tool registry).

- [ ] **Step 4 — bump + changelog.** `version: 0.2.0`; `## Changes`:

```markdown
- **0.2.0** — Encoded the hybrid-by-default doctrine (ADR-0025): spine +
  named judgment + the four calibration bands and when to set the flag.
  Fixed the `TodoWrite` heading to host-accurate phrasing.
```

- [ ] **Step 5 — CLAUDE.md.** In "Code conventions", after the
  "No comments unless WHY is non-obvious" row:

```markdown
| Skills are hybrid by default | Body: deterministic spine + a named judgment surface. Pick a calibration band (default `workflow` ~30%). Set `metadata.dstack.calibration` if not `workflow`. See ADR-0025 + playbook §1.15. |
```

- [ ] **Step 6 — verify.** Run: `bun run validate` → `writing-skills: OK`.
  If `> 2500` tokens, raise `context_budget_tokens` to `3000` (additions
  ~150 tokens; headroom 684 — should fit). Confirm `18 OK, 0 ERR`.

- [ ] **Step 7 — commit:** `feat(writing-skills): encode hybrid-by-default doctrine + bands; fix TodoWrite`

**Checkpoint:** `/requesting-code-review` on Track A before rollout.

---

## Track B — Light enforcement (the calibration field + the warning)

### Task B1: Add the `calibration` frontmatter field

**Files:**
- Modify: `src/domain/skill/SkillType.ts` (add the `Calibration` union)
- Modify: `src/domain/skill/SkillSpec.ts` (add the field)
- Modify: `src/adapters/fs/FileSkillRepository.ts` (parse; default `workflow`)
- Modify: `src/adapters/claude-code/ClaudeCodeRenderer.ts` (emit in `buildFrontmatter`)
- Modify: `test/unit/adapters/fs/warnings.test.ts` (or a new spec test) for parse/render

- [ ] **Step 1 — write the failing test.** A skill declaring
  `calibration: judgment-dominant` parses to that value; a skill omitting
  it defaults to `workflow`; the renderer emits `calibration: <value>`.
  Add a focused test (mirror the existing parse tests; reuse a fixture or
  add a tiny one).

- [ ] **Step 2 — add the union.** In `src/domain/skill/SkillType.ts`,
  mirror the existing `SideEffects`/`Agency` unions:

```ts
export type Calibration = 'deterministic-dominant' | 'workflow' | 'judgment-dominant' | 'schema-meta';
```

- [ ] **Step 3 — add the field** in `src/domain/skill/SkillSpec.ts`
  (import `Calibration`; add to `SkillSpecData`, the class fields, and the
  constructor), mirroring `agency`:

```ts
readonly calibration: Calibration;   // defaults to 'workflow'
```

- [ ] **Step 4 — parse + default** in `FileSkillRepository.ts` where
  `sideEffects`/`agency` are read: read `metadata.dstack.calibration`,
  validate against the four values (throw `SkillSpecError` on a bad
  value), default to `'workflow'` when absent.

- [ ] **Step 5 — emit** in `ClaudeCodeRenderer.buildFrontmatter`, next to
  the `side_effects`/`agency` lines:

```ts
lines.push(`    calibration: ${spec.calibration}`);
```

- [ ] **Step 6 — run tests.** `bun test` → the new test passes;
  `bun run typecheck` → exit 0.

- [ ] **Step 7 — commit:** `feat(skill): add calibration field (ADR-0025)`

### Task B2: Add the band-aware `missing-spine` warning

**Files:**
- Modify: `src/domain/render/RenderResult.ts` (`WarningKind`)
- Modify: `src/adapters/claude-code/ClaudeCodeRenderer.ts` (emit)
- Modify: `src/adapters/cli/warning-formatter.ts` (render the kind)
- Create: `test/fixtures/skills/warnings-no-spine/no-spine/SKILL.md`
- Modify: `test/unit/adapters/fs/warnings.test.ts`

Heuristic: warn when the skill is **expected** to have a spine
(`type !== 'deterministic'` AND `calibration` is `workflow` or
`deterministic-dominant`) and the body has **no** ordered-list line
(`/^\s*\d+\.\s/m`), **no** table row (`/^\s*\|.*\|/m`), and **no**
checklist (`/- \[ \]/`). `judgment-dominant` and `schema-meta` are exempt
(their spine is intentionally tiny or structural).

- [ ] **Step 1 — failing test.** Append to `warnings.test.ts`:

```ts
test('missing-spine: emitted when a workflow body has no list/table/checklist', async () => {
  const results = await new BuildCatalog(bucket('warnings-no-spine'), new ClaudeCodeRenderer(), new NoopTelemetry())
    .execute({ host: HOST, now: new Date(0) });
  expect(results.length).toBe(1);
  const kinds = results[0]!.rendered.warnings.map((w) => w.kind);
  expect(kinds).toContain('missing-spine');
});
```

- [ ] **Step 2 — fixture** at `test/fixtures/skills/warnings-no-spine/no-spine/SKILL.md`:

```markdown
---
name: no-spine
description: A skill whose body is flat prose with no procedure, table, or checklist, used to exercise the missing-spine warning.
allowed-tools: Read
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    context_budget_tokens: 1000
---
# /no-spine

This skill is intentionally structureless. It explains an idea in flowing
prose and never lays down an ordered procedure, a constraining table, or a
checklist, so the renderer should flag it as lacking a deterministic spine.
```

(No `calibration` → defaults to `workflow` → eligible for the warning.)

- [ ] **Step 3 — run, expect FAIL** (`missing-spine` kind does not exist):
  `bun test test/unit/adapters/fs/warnings.test.ts`

- [ ] **Step 4 — add the kind** in `RenderResult.ts`:

```ts
export type WarningKind =
  | 'long-description'
  | 'overlapping-trigger'
  | 'include-cycle-broken'
  | 'token-near-budget'
  | 'comprehensive-skill'
  | 'type-structure-mismatch'
  | 'missing-spine';
```

- [ ] **Step 5 — emit** in `ClaudeCodeRenderer.render`, after the
  `comprehensive-skill` block:

```ts
const expectsSpine = skill.spec.type !== 'deterministic' &&
  (skill.spec.calibration === 'workflow' || skill.spec.calibration === 'deterministic-dominant');
if (expectsSpine && !hasDeterministicSpine(skill.prompt)) {
  warnings.push({
    kind: 'missing-spine',
    message:
      `${skill.spec.id.value}: body has no ordered list, table, or checklist. ` +
      `Hybrid-by-default (ADR-0025) wants a spine + a named judgment surface. ` +
      `Add steps/a gate/a table, or set calibration: judgment-dominant/schema-meta if intended.`,
  });
}
```

  Plus the module-scope helper:

```ts
/** ADR-0025: a body has a deterministic spine if it has an ordered list, a table, or a checklist. */
function hasDeterministicSpine(body: string): boolean {
  return /^\s*\d+\.\s/m.test(body) || /^\s*\|.*\|/m.test(body) || /- \[ \]/.test(body);
}
```

- [ ] **Step 6 — formatter.** In `src/adapters/cli/warning-formatter.ts`
  add a label for `missing-spine` (read the file; match the existing
  per-kind pattern — an exhaustive `switch` will fail typecheck until the
  case is added, which is the signal it is wired).

- [ ] **Step 7 — run, expect PASS:** `bun test test/unit/adapters/fs/warnings.test.ts`

- [ ] **Step 8 — no real skill regresses.** `bun run build --strict` →
  exit 0. (All 18 have a list/table; judgment-dominant `brainstorm` and
  schema-meta skills are exempt anyway. A real hit = a real violation; fix
  in Track D, not by relaxing the heuristic.)

- [ ] **Step 9 — `bun run typecheck && bun test`** → both pass.

- [ ] **Step 10 — commit:** `feat(renderer): band-aware missing-spine warning (ADR-0025)`

### Task B3: Record the escalation trigger

**Files:** Modify `docs/plans/v3/DEFERRED.md`

- [ ] **Step 1 — add D29** (match the file's entry format):

```markdown
## D29 — Machine-enforced hybrid-by-default (hard gate)

ADR-0025 enforces the doctrine lightly: docs + /writing-skills + the
optional `calibration` flag + a band-aware `missing-spine` *warning*. A
validate ERROR gate and a CI check that `calibration: judgment-dominant`
carries an evidence line were deliberately NOT added (YAGNI).

**Trigger to revisit:** ≥3 skills ship spine-less while the warning is
ignored, OR a skill is set to `judgment-dominant` without an evidence line
and ships, OR a second host needs the bands machine-enforced. Then: write
an ADR superseding the light-enforcement clause of ADR-0025, promote
`missing-spine` to an error, and add the evidence-line CI check.
```

- [ ] **Step 2 — verify.** `grep -n "D29" docs/plans/v3/DEFERRED.md`

- [ ] **Step 3 — commit:** `docs(deferred): D29 trigger to escalate hybrid-by-default enforcement`

---

## Track C — Doc-bug fixes (the "@docs kurang tepat" items)

### Task C1: Staleness banner on the v3 benchmark report

**Files:** Modify `docs/v3-benchmark-report.md`

- [ ] **Step 1 — add the banner** immediately after the H1 (do not rewrite
  a dated artifact):

```markdown
> **Point-in-time artifact (2026-05-17).** This report measured the
> 8-skill v3 catalog. The catalog has since grown to **18 skills** (10
> imported under [ADR-0024](adr/0024-catalog-breadth-over-yagni.md)). For
> current state run `bun run validate`. The hybrid-by-default rollout over
> all 18 is tracked in
> [docs/plans/v4/skill-hybrid-by-default-plan.md](plans/v4/skill-hybrid-by-default-plan.md).
```

- [ ] **Step 2 — commit:** `docs(benchmark): banner v3 report as point-in-time (8→18 skills)`

### Task C2: Fix the playbook reference table

**Files:** Modify `docs/skill-quality-playbook.md` §4.3

- [ ] **Step 1 — fix the `receiving-code-review` row** (folded into
  `code-review`):

```markdown
| Code review (receiver) | `superpowers/skills/requesting-code-review` (dstack folded the receiver role into `/code-review`; `/requesting-code-review` covers the dispatch side) |
```

- [ ] **Step 2 — verify.** `grep -n "receiving-code-review" docs/skill-quality-playbook.md`
  Expected: no remaining hit (or only a labelled historical note).

- [ ] **Step 3 — commit:** `docs(playbook): fix §4.3 stale receiving-code-review reference`

### Task C3: Flag the unverifiable citations (USER decision, not an invented edit)

The playbook and ADR-0015 cite arXiv papers dated **after** the assistant
knowledge cutoff (e.g. "SkillsBench 2602.12670, Feb 2026"; "2604.23178,
April 2026"). They cannot be verified here and are load-bearing.

- [ ] **Step 1 — decide with the user.** Options: (a) confirm real → no
  change; (b) placeholder → add a one-line caveat atop the playbook §10
  evidence table ("Citations dated after the authoring cutoff are pending
  independent verification"); (c) replace with verifiable sources.
  **Surface; do not guess.**

- [ ] **Step 2 —** apply the agreed edit if (b)/(c); commit accordingly.

---

## Track D — Per-skill calibration (tiered rollout)

For **every** touched skill: bump `metadata.dstack.version` and add a
`## Changes` entry. After each, `bun run validate` (watch
`<used>/<budget>`); `bun run build --strict` at the end of the track.

**Flag-setting rule:** set `metadata.dstack.calibration` only on the 7
non-default skills. For `judgment-dominant`, the `## Changes` line MUST
carry the evidence + owner approval (Governance). The 10 workflow skills
omit the flag.

### Task D1 (P0): `careful` — triplet + `deterministic-dominant` + bounded judgment

**Files:** Modify `skills/careful/SKILL.md`

- [ ] **Step 1 — add the frontmatter triplet + flag** under
  `metadata.dstack` (currently stops at `triggers`):

```yaml
    type: semantic
    side_effects: readonly
    agency: reactive
    calibration: deterministic-dominant
```

- [ ] **Step 2 — bounded judgment** (table is a floor). Add after
  "Safe exceptions":

```markdown
## The table is a floor, not a whitelist

The only judgment here: is a destructive command NOT in the table (e.g.
`terraform destroy`, `flyctl apps destroy`, `gh repo delete`, `bq rm`)
still destructive? If it is irreversible or hits shared/prod state, run
the pause protocol as if it were listed. Do not improvise a faster path.
The call to pause is yours; everything else follows the protocol.
```

- [ ] **Step 3 — bump `0.3.0`**; `## Changes`:
  `- **0.3.0** — Declared type/side_effects/agency + calibration:
  deterministic-dominant (ADR-0025; safety guardrail, high failure cost).
  Named the bounded judgment (table is a floor).`

- [ ] **Step 4 — verify.** `bun run validate` → `careful: OK`; `18 OK, 0 ERR`.

- [ ] **Step 5 — commit:** `feat(careful): triplet + deterministic-dominant + bounded judgment (ADR-0025)`

### Task D2: the other 3 `deterministic-dominant` skills

Set `calibration: deterministic-dominant` + a one-line rationale in
`## Changes` (rails-direction → rationale, no benchmark needed). Keep
judgment lines **bounded**.

- [ ] **`verification`** — rationale: "discipline gate; the rails are the
  value." Judgment is already named ("identify the command that proves
  THIS claim") — keep it; just add the flag. Budget 3500 (used 2131).
- [ ] **`finishing-a-development-branch`** — rationale: "`side_effects:
  external`; exact bash dominates." Bounded judgment line: "Confirm the
  base branch when `merge-base` is ambiguous — that one detection is your
  call." Budget 3500 (used 2040). Also apply Track E hardening.
- [ ] **`using-git-worktrees`** — rationale: "deterministic by design."
  Bounded judgment: "Prefer the native worktree tool; if the harness lacks
  one, fall back to `git worktree` — that fallback choice is your call."
  Budget 3500 (used 2304). Also apply Track E hardening.

### Task D3: the `judgment-dominant` skill (evidence + owner required)

- [ ] **`brainstorm`** — set `calibration: judgment-dominant`. `## Changes`
  MUST carry the empirical evidence + owner approval:
  `- **0.3.0** — calibration: judgment-dominant. Evidence: v3 benchmark —
  /brainstorm loses to mattpocock/grill-me when over-structured (docs/
  v3-benchmark-report.md). Owner-approved 2026-06-04.` Add ONE line that
  it is intentionally judgment-heavy (spine = recommendation-first +
  stop/keep gates). Budget is tight (2052/2500, 448 free) — one sentence
  only.

### Task D4: the 2 `schema-meta` skills

Set `calibration: schema-meta` + a rationale.

- [ ] **`classify-issue`** — rationale: "determinism is the output schema,
  not a procedure." Name the judgment: "Severity and area are your call;
  the schema constrains the *shape* of the answer, not the decision." Add
  a small "misclassification traps" table (e.g. *feature phrased as a bug
  → still `feature`*; *worked, then stopped → `regression`*). Budget 1500
  (used 927).
- [ ] **`using-dstack`** — rationale: "meta/router; the spine is the
  invoke-before-acting rule." Name the judgment: "Deciding whether a
  borderline skill applies is your judgment — bias toward invoking, but
  the call is yours." Budget 1800 (used 803).

### Task D5: the `workflow` P1 skills (judgment line; flag omitted)

- [ ] **`dispatching-parallel-agents`** — name the judgment ("deciding the
  failures are truly independent is your call") + add a concrete
  integrate-time verify command with expected output. Apply Track E
  hardening. Budget 3000 (used 1847).
- [ ] **`executing-plans`** — name the handoff gate ("plan review is where
  your judgment overrides the plan; verification is delegated to
  `/verification` — mandatory"). Apply Track E hardening. Budget 1500
  (used 821).
- [ ] **`requesting-code-review`** — name the judgment ("deciding what
  context to craft for the reviewer is your call and sets the review's
  ceiling"). Budget 2000 (used 803).
- [ ] **`angular21-maritimhub`** — structural: add `side_effects: local` +
  `agency: deliberative` (it edits files / runs schematics). Body is the
  workflow exemplar; optional small "never auto-flip zoneless / never
  de-RxJS working HTTP" red-flags table. Budget 4500 (used 2776).

### Task D6: the `workflow` P2 skills (conformance)

`debugging`, `tdd`, `code-review`, `writing-skills` are already exemplary
— **no edit**, record as conformant. `version` is `type: deterministic`
— no flag, no judgment line. The rest get one judgment sentence:

- [ ] **`subagent-driven-development`** — "your judgment is which context
  each subagent needs, and whether a BLOCKED status means the plan is
  wrong vs the model is too weak." Apply Track E hardening. Budget 4500
  (used 3539 — watch headroom).
- [ ] **`writing-plans`** — "deciding the file split and task ordering is
  your design call." Budget 2500 (used 1204).

- [ ] **Verify D1–D6.** `bun run validate` → `18 OK, 0 ERR`;
  `bun run build --strict` → exit 0 (no `missing-spine`).

- [ ] **Commit:** group as `feat(skills): roll out calibration bands + named judgment (ADR-0025)` or per-skill.

---

## Track E — Absorb the narrow v3 hardening plan

`docs/plans/v3/skill-hardening-plan.md` covers 5 imported skills
(graphviz→tables, `TodoWrite`→generic, voice, cross-refs,
`finishing-a-development-branch` type decision). Same files as Track D for
those 5 — do both edits in the **same touch** per skill.

### Task E1: Fold and supersede

**Files:** Modify `docs/plans/v3/skill-hardening-plan.md`

- [ ] **Step 1 — when executing Track D** for the 5 imports
  (`executing-plans`, `finishing-a-development-branch`,
  `dispatching-parallel-agents`, `subagent-driven-development`,
  `using-git-worktrees`), also apply that skill's row from the v3 plan's
  "Per-skill work" (graphviz conversion, `TodoWrite` rephrase,
  cross-references, trigger de-confliction, and the
  `finishing-a-development-branch` `hybrid` + `scripts/check-branch-state.sh`
  decision — confirm the script extraction with the user first).

- [ ] **Step 2 — banner the old plan** under its H1:

```markdown
> **Superseded by [docs/plans/v4/skill-hybrid-by-default-plan.md](../v4/skill-hybrid-by-default-plan.md).**
> The five-skill hardening items below are folded into that plan's Track D
> + Track E so each file is touched once. Kept for the per-skill gap detail.
```

- [ ] **Step 3 — commit:** `docs(plans): supersede v3 hardening plan with v4 doctrine plan`

---

## Track F — Whole-plan verification gate

- [ ] **Step 1 — run the full gate:**

```bash
bun run validate          # 18 OK, 0 ERR; watch <used>/<budget>
bun run build --strict    # exit 0 (proves no skill trips missing-spine)
bun run typecheck         # exit 0 (calibration field wired everywhere)
bun test                  # all pass, incl. calibration + missing-spine tests
bun run doctor            # source/install consistency
```

- [ ] **Step 2 — calibration emitted.** Run:
  `bun run render brainstorm | grep calibration`
  Expected: `calibration: judgment-dominant`. Run the same for a default
  skill (`bun run render debugging | grep calibration`) → `calibration: workflow`.

- [ ] **Step 3 — cross-reference integrity.** Run:
  `grep -rn "0025" docs/ && grep -rn "skill-hybrid-by-default-plan" docs/`
  Expected: ADR-0025 indexed in `adr/README.md` + `ARCHITECTURE.md`; the
  plan linked from ADR-0025, RESEARCH.md, the v3 benchmark banner, the
  superseded v3 hardening plan.

- [ ] **Step 4 — final review.** `/requesting-code-review` on the branch,
  then `/finishing-a-development-branch`.

---

## Self-review (coverage against the brief)

| Brief requirement | Covered by |
|---|---|
| "hybrid by default; 30% deterministic / 70% AI semantic" | The invariant + `workflow` default band — doctrine + ADR-0025 |
| "deterministic can be 10/20/30-default/up to 80%" | The spectrum + four bands (Part 2) |
| "a flag that marks a skill AI-semantic, by my decision, when testing shows the default is sub-optimal" | The `calibration` flag + asymmetric Governance (Part 4); `judgment-dominant` needs evidence + owner approval |
| "AI free to research the latest + final decision stays AI" | Named judgment sentence (Part 6); scoped away from deterministic-dominant |
| "fix all documents" | The two v4 docs (plan + RESEARCH) are the only docs that hold the doctrine today; spec/taxonomy/playbook/writing-skills/CLAUDE.md edits are specified as Track A tasks to apply on execution |
| "cheap models understand; English" | Rule-first sections, tables, examples, short sentences; the flag is rendered so a cheap model reads the band directly |
| Audit all 18, tiered execution | Audit table (tier + band) + Track D |
| Light enforcement | Optional flag + band-aware warning; no error gate (D29) |
| Supersede the narrow v3 plan | Track E |

**Sequencing:** A → B → C → D (P0 → deterministic-dominant →
judgment-dominant → schema-meta → workflow, folding E per-skill) → F.
Track A defines everything; Track B1 (the field) must land before B2 (the
band-aware warning) and before Track D sets flags.

**Open item needing the user:** Track C3 (post-cutoff citations) — do not
edit without the owner's call on whether they are real.
