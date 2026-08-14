# Unhobbling the skill catalog implementation plan

**Goal:** Stop the 33-skill catalog from capping what the model already knows,
calibrated for Sonnet 5 as the daily driver.

**Architecture:** Build the detector first so the sweep is measured, not
felt. A new `closed-enumeration` render warning names every skill whose body
enumerates without declaring the list open or closed. ADR-0030 then fixes the
doctrine and unblocks ADR-0025's one-way ratchet with an ablation protocol.
`/writing-skills` carries the rules so new skills are born correct. Only then
does the catalog sweep run, driven to zero by the detector. Model-dependent
conflicts (`verifying-before-done`, the subagent trio) are decided by ablation
under Sonnet 5, not by reading Opus 5 docs.

**Stack:** TypeScript on Bun, `bun test`, existing `Warning`/`WarningKind`
pipeline in `ClaudeCodeRenderer`.

**Visible slice:** `backend-only: dstack is a CLI + Markdown catalog with no
screen.` The nearest analog is honored anyway — Task 1 makes
`bun run build` print the exact per-skill worklist the rest of the plan
consumes, so the first thing finished is the thing the user can look at.

Implement task by task. Per task: `/test-driven-development` decides the risk
tier and the test path, then `/verifying-before-done` before marking it done.
No user-visible screens here, so `/running-uat` does not apply; Task 8 is the
equivalent gate. Request review at checkpoints with `/requesting-code-review`.
Steps use `- [ ]` checkboxes.

**Deviation from `/writing-plans` bite-size rule, declared up front:** Tasks
4–7 are mechanical sweeps over 8–13 skills each, so they run 15–25 minutes
rather than 2–5. Splitting them into 33 single-skill tasks would make the plan
unreadable without making any unit of work smaller — each skill inside a batch
is still a 2-minute edit with its own checkbox. The commit boundary is the
batch, which stays one logical change per CLAUDE.md.

---

## Status

**Updated:** 2026-08-14 · **Branch:** `feat/unhobbling-skill-catalog` · **Next:** Task 10 (blocked — needs paired runs)

| Task | State | Evidence |
|---|---|---|
| 1 `closed-enumeration` warning | done | uncommitted — flags exactly **30**, matching the dry-run baseline |
| 2 ADR-0030 | done | written, indexed in 3 places, ADR-0025 marked superseded-in-part; 4 live-rule docs repointed |
| 3 `/writing-skills` shape rules | done | 0.6.0; renders within budget after the tier change |
| 4 sweep — deterministic-dominant | done | 12 skills; ledger 29 → **17** as predicted |
| 5 sweep — workflow 1/2 | done | 6 skills; ledger 17 → **11** as predicted |
| 6 sweep — workflow 2/2 | done | 8 skills; ledger → **3** after fixing a detector bug (see Deviations) |
| 7 sweep — special bands | done | 3 skills; ledger → **0** |
| 8 gate | done | `bun test` **102/102**, typecheck clean, `validate` 0, `build --strict` **exit 0, zero warnings**, `doctor` **33/33 OK** |
| 9 ablation procedure | done | `docs/procedures/skill-ablation.md` |
| 10 ablate `verifying-before-done` | prepared | Stages 1–2 done in `docs/ablations/2026-08-verifying-before-done.md`: 3 real tasks selected from transcripts by claim shape (`19ad64f1`, `df54b54d`, `32e54100`), free version written, decision rule and honesty guard fixed. Stage 3 needs 6 real sessions and its tables are deliberately empty. |
| 11 ablate subagent trio | partial | `dispatching-parallel-agents`: **complete** — 0 real invocations, procedure §1 terminates the run and that is the result. `subagent-driven-development` (4) and `multi-persona-review` (30) clear the bar but need paired runs. |
| 12 re-justify the 13 bands | partial | Narrow-bridge test run: `docs/ablations/2026-08-narrow-bridge-test.md` — 4 pass, 2 contested, 7 fail. **No band moved**: ADR-0030 §5 charges an ablation per move and none has run. |

**Deviations from plan:**
- **No commits this run.** The user asked for manual review of the working
  tree before anything is committed (2026-08-14). Every task's commit step is
  therefore skipped, and Evidence cells read `uncommitted` plus the observed
  verification instead of a SHA. Nothing else about the tasks changes.
- **Task 6 found a real detector bug, fixed with a regression test.** The
  `OPENNESS_MARKER` regex used a literal space, so a marker wrapping across a
  line break (`**not\nexhaustive**` — how Markdown prose actually wraps) re-flagged
  a skill that had declared itself. Caught because Task 6's ledger read 4 against
  a predicted 3. Regex now uses `\s+`; fixture `warnings-wrapped-marker` and a
  named regression test added. Without the ledger's per-batch numbers this would
  have been absorbed silently.
- **Task 8: the sweep regressed `build --strict` from clean to 9 warnings.**
  Measured against a temp worktree at HEAD, which had **zero** warnings of any
  kind. Nine skills were already at 88–90% of budget; one added sentence tipped
  them past the 90% line. Resolved in three stages: (1) removed the repeated
  ADR-0030 rationale I had put in 25 `## Changes` entries — my own bloat, and
  itself a violation of ADR-0030 rule 3; (2) **owner-approved deviation** —
  `/writing-skills` budget 3000 → 4500, overriding this plan's own "shorten, do
  not raise" rule, because it was mis-tiered against peers at 5000 and could not
  hold the required doctrine section at any terseness; (3) trimmed forensic
  detail and one genuinely duplicated statistic from the other four. Final state
  is **exit 0, zero warnings**.
- **A version-bump defect was introduced and caught.** The bump script inserted
  `## Changes` entries only where a blank line followed the heading, so four
  skills (`pdf-to-rag`, `literature-*`) got a version bump with no entry. Found
  by auditing every skill's frontmatter version against its changelog; all 33
  now pair correctly.
- **Tasks 10–12 are honestly incomplete.** Stage 1 of the ablation procedure ran
  across the whole catalog (`docs/ablations/2026-08-invocation-census.md`) and
  produced real findings, including six never-invoked skills. Stages 2–4 need
  paired Sonnet 5 runs — roughly 20 real skill executions — which cannot be
  derived from analysis and were not fabricated.
- **Task 3 hit the token budget, resolved by shortening.** The added Shape
  rules section pushed `writing-skills` to 3167 tokens against a 3000 budget,
  and `bun run build` aborts on the first error — which made the ledger read
  `0 remaining` when nothing had been swept. Resolved per Task 8 Step 3's own
  rule (shorten the prose, do not raise the budget): the section, the Changes
  entry and the band bullet were all condensed, landing under 3000 with the
  ledger back at the expected 29. Lesson applied to Tasks 4–7: check headroom
  before editing, not after.
- **Status write-back at checkpoints, not per task.** With no commits there
  are no SHAs to record, so the block is written back after Tasks 1, 3, 7 and
  12 rather than after each of the twelve. Stated here rather than done
  silently.

---

## Background

Full analysis: `scratchpad/ANALISIS-unhobbling-vs-dstack.md`. The three facts
this plan acts on:

1. **Sonnet 5 reads lists literally.** Anthropic's Sonnet 5 prompting guide:
   it "does **not** silently generalize an instruction from one item to
   another, and it does not infer requests you didn't make." A closed list in
   a skill therefore becomes a ceiling on what the model contributes. Only
   2 of 33 skills currently say a list is open.
2. **ADR-0025's governance is a one-way ratchet.** Rails need a written
   rationale; freedom needs empirical evidence. Result: 13 skills at
   `deterministic-dominant` versus 1 at `judgment-dominant`, against a
   doctrine that calls `workflow` the default.
3. **Two conflicts are model-dependent, not universal.** Anthropic's Opus 5
   guide says to remove explicit verification instructions and to discourage
   subagent delegation. Neither statement appears in the Sonnet 5 guide. The
   daily driver is Sonnet 5, so these are decided by measurement (Tasks
   10–11), not by adopting Opus 5 advice wholesale.

---

## Task 1: `closed-enumeration` render warning

**Tier:** `core` — every later task consumes this detector's output. A wrong
detector silently mis-targets the whole sweep.

**Files:**
- Modify: `src/domain/render/RenderResult.ts:20-27`
- Modify: `src/domain/skill/SkillSpec.ts` (add `ENUMERATION_MIN_ITEMS` beside `COMPREHENSIVE_MODULE_THRESHOLD`)
- Modify: `src/adapters/claude-code/ClaudeCodeRenderer.ts:78-88` (emit) and `:153-155` (helper)
- Create: `test/fixtures/skills/warnings-closed-enum/closed-enum/SKILL.md`
- Create: `test/fixtures/skills/warnings-open-enum/open-enum/SKILL.md`
- Modify: `test/unit/adapters/fs/warnings.test.ts`

- [ ] **Step 1 — write the failing tests**

Append to `test/unit/adapters/fs/warnings.test.ts`, inside the existing
`describe('warning fixtures', …)` block:

```ts
test('closed-enumeration: emitted when a body enumerates with no openness marker', async () => {
  const results = await new BuildCatalog(bucket('warnings-closed-enum'), new ClaudeCodeRenderer(), new NoopTelemetry())
    .execute({ host: HOST, now: new Date(0) });
  expect(results.length).toBe(1);
  const kinds = results[0]!.rendered.warnings.map((w) => w.kind);
  expect(kinds).toContain('closed-enumeration');
});

test('closed-enumeration: suppressed when the body declares the list open', async () => {
  const results = await new BuildCatalog(bucket('warnings-open-enum'), new ClaudeCodeRenderer(), new NoopTelemetry())
    .execute({ host: HOST, now: new Date(0) });
  expect(results.length).toBe(1);
  const kinds = results[0]!.rendered.warnings.map((w) => w.kind);
  expect(kinds).not.toContain('closed-enumeration');
});
```

- [ ] **Step 2 — run it, expect failure**

Run: `bun test test/unit/adapters/fs/warnings.test.ts`
Expected: FAIL — both tests error on the missing fixture directory
(`ENOENT … warnings-closed-enum`).

- [ ] **Step 3 — create the two fixtures**

`test/fixtures/skills/warnings-closed-enum/closed-enum/SKILL.md`:

```markdown
---
name: closed-enum
description: A skill whose body enumerates four items and never says whether the list is open, used to exercise the closed-enumeration warning.
allowed-tools: Read
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    context_budget_tokens: 1000
---
# /closed-enum

Check the input against each category:

1. Numeric out of range.
2. String too long.
3. Null where a value is required.
4. Wrong type entirely.

Report the category that matched.
```

`test/fixtures/skills/warnings-open-enum/open-enum/SKILL.md`: identical, with
one line added after the list:

```markdown
These four are a starting point, not a limit — this list is not exhaustive,
so add any category the input actually shows and say why it belongs.
```

- [ ] **Step 4 — add the warning kind**

`src/domain/render/RenderResult.ts`, extend the union:

```ts
export type WarningKind =
  | 'long-description'
  | 'overlapping-trigger'
  | 'include-cycle-broken'
  | 'token-near-budget'
  | 'comprehensive-skill'
  | 'type-structure-mismatch'
  | 'missing-spine'
  | 'closed-enumeration';
```

- [ ] **Step 5 — add the threshold constant**

`src/domain/skill/SkillSpec.ts`, beside `COMPREHENSIVE_MODULE_THRESHOLD`:

```ts
/**
 * Below this many list items a body is making a point, not enumerating a
 * space the model could extend. Three is where a list starts reading as
 * "the set" rather than "an example" (ADR-0030).
 */
export const ENUMERATION_MIN_ITEMS = 3;
```

- [ ] **Step 6 — implement the detector**

`src/adapters/claude-code/ClaudeCodeRenderer.ts`, beside `hasDeterministicSpine`:

```ts
const OPENNESS_MARKER =
  /not exhaustive|non-exhaustive|extend this list|beyond this list|others may apply|closed by design/i;

function enumerates(body: string): boolean {
  const bullets = (body.match(/^\s*[-*]\s+\S/gm) ?? []).length;
  const ordered = (body.match(/^\s*\d+\.\s+\S/gm) ?? []).length;
  return bullets >= ENUMERATION_MIN_ITEMS || ordered >= ENUMERATION_MIN_ITEMS;
}
```

Add the import to the existing `@domain/skill/SkillSpec` import block, then
emit after the `missing-spine` block (`:88`):

```ts
if (enumerates(skill.prompt) && !OPENNESS_MARKER.test(skill.prompt)) {
  warnings.push({
    kind: 'closed-enumeration',
    message:
      `${skill.spec.id.value}: body enumerates without saying whether the list is closed. ` +
      `Sonnet 5 does not generalize past a written list (ADR-0030). Say "not exhaustive" ` +
      `where the list is a starting point, or "closed by design" where the list is the deliverable.`,
  });
}
```

- [ ] **Step 7 — run it, expect pass**

Run: `bun test test/unit/adapters/fs/warnings.test.ts` → PASS
Then: `bun run typecheck` → no errors
Then: `bun test` → full suite green

- [ ] **Step 8 — capture the worklist**

Run: `bun run build 2>&1 | grep closed-enumeration | sort > /tmp/closed-enum-worklist.txt`
Expected: **30 lines.** Dry-running this heuristic over the catalog on
2026-08-14 gave 30 flagged, 2 already declared (`debugging`,
`designing-test-cases`), 1 with no enumeration at all (`managing-version`,
45 lines). If Task 1's implementation reports a different number, the
regexes diverged from the dry run — reconcile before starting Task 4, because
Tasks 4–7 are budgeted against this split.

Running ledger for the tasks below. Task 3 clears `writing-skills` before the
sweep starts, so it is counted there and not again in Task 5:

| After task | Clears | Remaining |
|---|---|---|
| 1 (baseline) | — | **30** |
| 3 `writing-skills` | 1 | 29 |
| 4 `deterministic-dominant` | 12 | 17 |
| 5 `workflow` first 9 | 6 | 11 |
| 6 `workflow` remaining 8 | 8 | 3 |
| 7 special bands | 3 | **0** |

If any task's actual remainder differs from this column, stop and reconcile
before continuing — the ledger is the plan's only check that the sweep is
complete rather than merely committed.

- [ ] **Step 9 — commit**

`feat(renderer): warn when a skill body enumerates without declaring the list open`

---

## Task 2: ADR-0030 — Sonnet-5 calibrated skill shape

**Tier:** `none` — documentation. Case list before writing: the ADR must
state (a) the openness rule, (b) exit-criteria-over-steps, (c) the
don't-restate-model-knowledge rule, (d) the enumeration-as-product exemption,
(e) the ablation protocol that makes `judgment-dominant` reachable, and (f)
what it supersedes in ADR-0025.

**Files:**
- Create: `docs/adr/0030-sonnet5-calibrated-skill-shape.md`
- Modify: `docs/adr/README.md` (index row)
- Modify: `docs/ARCHITECTURE.md` (ADR index)
- Modify: `docs/adr/0025-hybrid-by-default-doctrine.md` (Status → Superseded by ADR-0030)

- [ ] **Step 1 — write the ADR**

```markdown
# ADR-0030 — Sonnet-5 calibrated skill shape

- **Status:** Accepted
- **Date:** 2026-08-14
- **Supersedes:** ADR-0025 (the four bands are carried forward unchanged; the
  governance clause is replaced)
- **Reversibility:** Cheap.

## Context

Anthropic's Sonnet 5 prompting guide states the model "interprets prompts
literally and explicitly… does not silently generalize an instruction from
one item to another, and does not infer requests you didn't make." Sonnet 5
is this catalog's daily driver. A closed list in a skill is therefore not
guidance — it is a ceiling. The model's own knowledge past item N does not
arrive unless the skill invites it.

Two measurements on the 33-skill catalog:

- 2 of 33 skills declare any list open.
- 13 skills sit at `deterministic-dominant` against 1 at
  `judgment-dominant`, despite ADR-0025 naming `workflow` the default.

The second number is ADR-0025's governance clause working as written: rails
cost a written rationale, freedom costs empirical evidence. That asymmetry is
a one-way ratchet, and the catalog has no procedure that ever removes a rail.

Boris Cherny's ablation practice — delete, observe, restore only what
demonstrably fails — is the missing counterweight. Anthropic's Agent Skills
guidance names the same axis we call calibration: match the degree of freedom
to the task, exact steps only for the "narrow bridge with cliffs on both
sides."

## Decision

**1. Every enumeration declares itself.** A skill body with three or more
list items carries one of two markers:

- *Open* — "not exhaustive", "a starting point, not a limit", "extend this
  list". Use where the list samples a space the model knows more of.
- *Closed by design* — with the reason. Use where the enumeration **is** the
  deliverable (`designing-test-cases` produces the case list) or where the
  set is externally fixed (a file format's legal values).

Enforced by the `closed-enumeration` render warning, not by a validate error.

**2. Write exit criteria, not step sequences.** The default skill shape is
task + guardrails + exit criteria. A fixed step order is reserved for the
narrow bridge: destructive commands, migrations, deploys, anything where one
wrong order is unrecoverable. Elsewhere the model picks the route.

**3. Never restate what the model already knows.** A skill carries our
conventions, our commands, our architecture, our definition of good. It does
not re-teach boundary value analysis or root cause analysis. On Sonnet 5 a
written-out general concept does not add to the model's version — it
*replaces* it with our shorter one.

**4. Bands are carried forward from ADR-0025 unchanged**: `judgment-dominant`
10–20%, `workflow` ~30% (default), `deterministic-dominant` 60–80%+,
`schema-meta` n/a.

**5. Governance, replacing ADR-0025's clause.** Both directions now cost the
same evidence, and there is a defined way to produce it:

- Moving toward rails or toward freedom requires one ablation run (below)
  plus owner approval.
- Once per major model release, every `deterministic-dominant` skill is
  re-justified against the narrow-bridge test or demoted to `workflow`.

**6. The ablation protocol.** For one skill:

1. Pick 3 real past tasks that invoked it.
2. Run each on the daily-driver model with the skill, and again with the
   skill's body replaced by its goal and exit criteria alone.
3. Record what the railed run got right that the free run missed, and what
   the free run surfaced that the railed run never reached.
4. Restore only the rails that item 3 shows are load-bearing.
5. Record the run and the decision in the skill's `## Changes`.

A skill may not move bands on argument alone.

## Trade-offs

- `+` Removes the ratchet: rails can now be lost, not only gained.
- `+` The openness rule is one sentence per skill and directly targets the
  documented Sonnet 5 literalism.
- `+` Keeps ADR-0025's bands, so no skill's existing flag changes meaning.
- `-` Ablation costs real runs. Mitigated: 3 tasks, once per band change.
- `-` The `closed-enumeration` detector is a regex heuristic and will
  false-positive. Mitigated: warning, never an error; the "closed by design"
  marker is a one-line dismissal that also documents the reason.

## YAGNI guard

No new frontmatter field — the marker is prose in the body, so the exemption
and its reason live where a reader will see them. No hard validate error
(D29 still holds). No per-model skill variants: one catalog, calibrated for
the daily driver, with model-specific findings recorded in `## Changes`.
```

- [ ] **Step 2 — index it**

Add the row to `docs/adr/README.md` and to the ADR index in
`docs/ARCHITECTURE.md`. Set ADR-0025's `**Status:**` line to
`Superseded by ADR-0030` — do not edit its body (CLAUDE.md forbids editing
accepted ADRs in place).

- [ ] **Step 3 — verify no stale references**

Run: `grep -rn "ADR-0025" --include='*.md' . | grep -v 0030`
Expected: every hit either cites the bands (still true) or is the superseded
notice. Any hit citing the old governance asymmetry gets a pointer to
ADR-0030.

- [ ] **Step 4 — commit**

`docs(adr): ADR-0030 replaces the ADR-0025 ratchet with an ablation protocol`

---

## Task 3: `/writing-skills` carries the four shape rules

**Tier:** `none`. Case list: the skill must state the openness rule with both
markers, exit-criteria-over-steps with the narrow-bridge exception, the
don't-restate-knowledge rule, and the enumeration-as-product exemption — and
must itself pass the Task 1 detector.

**Files:**
- Modify: `skills/writing-skills/SKILL.md`

- [ ] **Step 1 — add the section**

Insert a `## Shape rules (ADR-0030)` section, and bump `version` in
frontmatter to the next minor.

```markdown
## Shape rules (ADR-0030)

The daily driver is Sonnet 5, which reads lists literally and does not
generalize past them. Four rules follow:

1. **Every list of three or more declares itself.** Either "not exhaustive —
   extend it and say why", or "closed by design because <reason>". A list
   with neither trips the `closed-enumeration` build warning.
2. **Prefer exit criteria to step order.** Write the task, the guardrails,
   and how the model knows it is done. Fix the step order only on a narrow
   bridge — destructive commands, migrations, deploys.
3. **Do not restate what the model knows.** Write our conventions, our
   commands, our definition of good. A general technique written out in a
   skill does not add to the model's knowledge; on Sonnet 5 it replaces it.
4. **Enumeration-as-product is exempt from rule 1's open marker**, not from
   the declaration. Where the list is the deliverable, say so and say why.

Changing a skill's calibration band in either direction needs an ablation run
(ADR-0030 §6) recorded in that skill's `## Changes`.
```

- [ ] **Step 2 — verify the skill passes its own rule**

Run: `bun run render writing-skills | grep -c "not exhaustive\|closed by design"`
Expected: ≥ 1

Run: `bun run build 2>&1 | grep "writing-skills.*closed-enumeration"`
Expected: no output

- [ ] **Step 3 — commit**

`feat(writing-skills): carry the ADR-0030 shape rules`

---

## Task 4: Openness sweep — the 13 `deterministic-dominant` skills

**Tier:** `none`. Case list: for each skill, every enumeration of three or
more gets exactly one declaration; the choice between *open* and *closed by
design* is recorded in that skill's `## Changes`; no other edit rides along.

**Files (modify):** `running-uat`, `writing-specs`, `prioritizing-work`,
`using-git-worktrees`, `designing-test-cases`, `verifying-before-done`,
`wireframing-interfaces`, `diagramming-architecture`,
`discovering-requirements`, `modelling-system-behaviour`,
`finishing-development-branch`, `modelling-business-processes`,
`guarding-destructive-commands` — each `skills/<id>/SKILL.md`

- [ ] **Step 1 — decide per skill, then edit**

Decision rule: is this list the deliverable, or the route to it?

- `designing-test-cases` — the case list **is** the product. *Closed by
  design*, reason stated. Already carries a marker; confirm it reads as a
  deliberate declaration and not an aside.
- `guarding-destructive-commands` — the command list is a safety floor, not a
  ceiling. *Open*: an unlisted destructive command is still destructive.
- The remaining 11 — default to *open* unless the list is externally fixed
  (BPMN element vocabulary in `modelling-business-processes`, UML element
  sets in `modelling-system-behaviour`, both *closed by design*, reason:
  the notation defines them).

- [ ] **Step 2 — bump versions and record**

Each edited skill gets a patch version bump and a `## Changes` line naming
ADR-0030 and which marker was chosen.

- [ ] **Step 3 — verify**

Run: `bun run build 2>&1 | grep closed-enumeration | wc -l`
Expected: **17** per the Task 1 ledger — down 12, from the 29 that Task 3
left. `designing-test-cases` is not in the 12; it already carries a marker
and Step 1 only confirms it reads as a deliberate declaration.

- [ ] **Step 4 — commit**

`refactor(skills): declare list openness across the deterministic-dominant band`

---

## Task 5: Openness sweep — `workflow` band, first 9

**Tier:** `none`. Same case list as Task 4.

**Files (modify):** `debugging`, `pdf-to-rag`, `writing-plans`,
`writing-skills`, `executing-plans`, `managing-version`, `literature-search`,
`literature-trends`, `literature-fulltext` — each `skills/<id>/SKILL.md`

- [ ] **Step 1 — edit**

Six skills to edit, not nine. The dry run confirms why:

- `debugging` already carries a marker — confirm and leave.
- `managing-version` (45 lines) enumerates nothing at all and is never
  flagged — skip it and say so in the commit body.
- `writing-skills` was cleared by Task 3.

The three `literature-*` skills enumerate database adapters: *open*, because
an unlisted database is still a database and the model knows more of them
than we listed. `pdf-to-rag`, `writing-plans` and `executing-plans` are the
remaining three.

- [ ] **Step 2 — bump versions and record** (as Task 4 Step 2)

- [ ] **Step 3 — verify**

Run: `bun run build 2>&1 | grep closed-enumeration | wc -l`
Expected: **11** — down 6 from 17.

- [ ] **Step 4 — commit**

`refactor(skills): declare list openness across the workflow band (1/2)`

---

## Task 6: Openness sweep — `workflow` band, remaining 8

**Tier:** `none`. Same case list as Task 4.

**Files (modify):** `auditing-short-video`, `multi-persona-review`,
`responding-to-review`, `learning-from-sessions`, `requesting-code-review`,
`test-driven-development`, `dispatching-parallel-agents`,
`subagent-driven-development` — each `skills/<id>/SKILL.md`

- [ ] **Step 1 — edit**

`test-driven-development`'s six risk tiers are *closed by design* — the tier
set is the contract other skills name by tier. `multi-persona-review`'s
persona list is *open*: the whole point is surfacing more distinct issues
than one reviewer finds, and a closed persona list caps exactly that.

- [ ] **Step 2 — bump versions and record** (as Task 4 Step 2)

- [ ] **Step 3 — verify**

Run: `bun run build 2>&1 | grep closed-enumeration | wc -l`
Expected: **3** — down 8 from 11. All eight in this batch are flagged; none
were pre-cleared.

- [ ] **Step 4 — commit**

`refactor(skills): declare list openness across the workflow band (2/2)`

---

## Task 7: Openness sweep — the 3 special-band skills

**Tier:** `none`. Same case list as Task 4.

**Files (modify):** `skills/brainstorm/SKILL.md`,
`skills/using-dstack/SKILL.md`, `skills/classify-issue/SKILL.md`

- [ ] **Step 1 — edit**

`classify-issue` is `schema-meta`: its category enum **is** the schema —
*closed by design*, reason: consumers parse it. `using-dstack` routes to
skills; its list of skills is *open* by construction — the catalog grows.
`brainstorm` is `judgment-dominant`; any list in it is *open*.

- [ ] **Step 2 — bump versions and record** (as Task 4 Step 2)

- [ ] **Step 3 — verify the ledger closes**

Run: `bun run build 2>&1 | grep closed-enumeration | wc -l`
Expected: **0** — down 3 from 3. A non-zero result here means an earlier
batch under-delivered; find it before committing rather than absorbing it
into this commit.

- [ ] **Step 4 — commit**

`refactor(skills): declare list openness across the schema-meta and judgment bands`

---

## Task 8: Gate — zero unflagged enumerations, catalog still builds

**Tier:** `none`. This is the plan's equivalent of a UAT gate: the sweep is
not done because four commits landed, it is done because the detector is
silent and nothing else regressed.

- [ ] **Step 1 — the detector is silent**

Run: `bun run build --strict`
Expected: exit 0, no `closed-enumeration` lines.

- [ ] **Step 2 — nothing else regressed**

Run: `bun test` → full suite green
Run: `bun run typecheck` → no errors
Run: `bun run validate` → exit 0

- [ ] **Step 3 — token budgets survived the added sentences**

Run: `bun run build 2>&1 | grep token-near-budget`
Expected: no new skills over 90% of budget versus the Task 1 baseline. Any
skill pushed over gets its added sentence shortened, not its budget raised.

- [ ] **Step 4 — request review**

`/requesting-code-review` on the range from Task 1 to here.

- [ ] **Step 5 — commit any review fixes**

---

## Task 9: Write the ablation procedure

**Tier:** `none`. Case list: the doc must fix how tasks are chosen, how the
railed and free runs are made comparable, what gets recorded, and the
decision rule — and must name Sonnet 5 as the model under test.

**Files:**
- Create: `docs/procedures/skill-ablation.md`

- [ ] **Step 1 — write it**

Content follows ADR-0030 §6, made concrete:

- **Model under test:** Sonnet 5 at the effort actually used daily. An
  ablation run on Opus 5 does not license a change to a skill used on
  Sonnet 5, and the reverse also holds. State the model and effort in the
  record.
- **Task selection:** 3 real past invocations from `~/.claude/projects`
  transcripts, not invented scenarios. Invented tasks flatter whichever
  version the author prefers.
- **Free run:** the skill body replaced by its goal, its guardrails, and its
  exit criteria — not by nothing. Deleting the skill entirely tests skill
  discovery, which is a different question.
- **Record:** a table per task — what the railed run got that the free run
  missed, and what the free run surfaced that the railed run never reached.
  Both columns get filled; a run with an empty second column usually means
  the free version was under-specified, not that the rails won.
- **Decision rule:** restore a rail only when it appears in column one for
  at least 2 of 3 tasks. One appearance is noise.

- [ ] **Step 2 — commit**

`docs: add the skill ablation procedure required by ADR-0030`

---

## Task 10: Ablate `verifying-before-done` on Sonnet 5

**Tier:** `none`. This is the plan's one genuinely open question — the Opus 5
guide says to delete instructions of exactly this shape, and the Sonnet 5
guide does not.

**Files:**
- Create: `docs/ablations/2026-08-verifying-before-done.md`
- Modify (conditional on result): `skills/verifying-before-done/SKILL.md`

- [ ] **Step 1 — run the procedure**

Three past tasks that ended in a completion claim. Railed run: the skill as
written. Free run: "Before claiming work is done, prove it with fresh output
from this turn" plus the skill's exit criteria, nothing else.

- [ ] **Step 2 — record the result**

Note in the record that this session's harness system prompt already carries
an evidence-before-claim rule, so part of the skill is duplicating the
harness. The ablation measures the remainder.

- [ ] **Step 3 — decide, per the decision rule**

Three outcomes, and the plan does not presume which:

- Rails load-bearing on Sonnet 5 → keep `deterministic-dominant`, record the
  evidence, and note that the band is Sonnet-5-specific.
- Rails not load-bearing → demote to `workflow`, keeping only the gate
  function and dropping the phrase list and the iron-law framing.
- Fully duplicated by the harness → the skill's remaining job is the
  post-subagent check; narrow it to that and shrink the budget.

- [ ] **Step 4 — commit**

`docs(ablations): record the verifying-before-done result` (plus the skill
change, as a separate commit if the band moves)

---

## Task 11: Ablate the subagent trio

**Tier:** `none`. `dispatching-parallel-agents`,
`subagent-driven-development` and `multi-persona-review` all push toward
delegation; the Opus 5 guide pushes against it. Sonnet 5's guide is silent,
so this is measured, not assumed.

**Files:**
- Create: `docs/ablations/2026-08-subagent-trio.md`
- Modify (conditional): the three `skills/<id>/SKILL.md`

- [ ] **Step 1 — run the procedure on each of the three**

The question is narrower than Task 10's: does the skill cause delegation on
work the model would have finished in a handful of tool calls? Record the
tool-call count and wall-clock of both runs, not just output quality.

- [ ] **Step 2 — apply the finding**

If a skill over-delegates on Sonnet 5, add a floor to it — a size below
which it does not fire — rather than deleting it. `multi-persona-review`'s
existing 3-iteration cap is the pattern to copy.

- [ ] **Step 3 — commit**

---

## Task 12: Re-justify the 13 `deterministic-dominant` bands

**Tier:** `none`. ADR-0030 §5 requires this once per major model release;
this is the first run. Case list: each of the 13 either passes the
narrow-bridge test in one written sentence, or is demoted to `workflow`.

**Files:**
- Modify: the `deterministic-dominant` skills that fail the test
- Modify: `docs/plans/2026-08-14-unhobbling-skill-catalog.md` (Status block)

- [ ] **Step 1 — apply the narrow-bridge test**

Ask of each: *is there exactly one safe order, with an unrecoverable failure
either side?* Expected passes: `guarding-destructive-commands`,
`using-git-worktrees`, `finishing-development-branch` — all touch
irreversible state. Expected failures, to be confirmed not assumed: the
modelling and diagramming skills, whose output is a file a human reviews
before anything acts on it.

- [ ] **Step 2 — demote what fails, with an ablation each**

A band move needs a run (ADR-0030 §5). Batch the runs: the modelling and
diagramming skills share a shape, so one ablation across two of them is
enough if the results agree — say so in the record if they do not.

- [ ] **Step 3 — verify the ratchet actually moved**

Run: `for d in skills/*/; do sed -n '1,30p' "$d/SKILL.md" | grep -m1 -oP '^\s*calibration:\s*\K.*'; done | sort | uniq -c`
Expected: `deterministic-dominant` below 13. If it is still 13, either every
skill genuinely passed the narrow-bridge test — which the plan doubts — or
the test was applied leniently. Say which in the Status block.

- [ ] **Step 4 — final gate**

Run: `bun test && bun run typecheck && bun run validate && bun run build --strict`
Expected: all green, exit 0.

- [ ] **Step 5 — commit**

---

## Self-review notes

- **Visible slice** — declared `backend-only` (CLI, no screen). Task 1 still
  produces the inspectable worklist before any sweep runs.
- **Coverage** — all five fixes from the analysis land: openness (Tasks 4–7),
  exit-criteria and don't-restate rules (Tasks 2–3), enumeration-as-product
  exemption (Tasks 2, 4–7), ablation protocol (Tasks 2, 9), ratchet
  counterweight (Tasks 2, 12). The two model-dependent conflicts get Tasks
  10–11.
- **Tiers named** — Task 1 is `core`; every other task is `none` and carries
  a written case list, since they are documentation and prose edits with no
  test to write.
- **Stubs retired** — none introduced.
- **Order** — the detector precedes the sweep so the sweep is measured; the
  doctrine precedes the edits so the edits have a rule to cite;
  `/writing-skills` precedes the sweep so new skills stop reintroducing the
  problem; ablations follow the procedure that defines them.
- **Open risk** — Tasks 10–12 may conclude that some rails are load-bearing
  on Sonnet 5 and the current bands were right. That is a legitimate outcome,
  not a failed plan. The failure mode to avoid is running the ablations
  having already decided the answer.
