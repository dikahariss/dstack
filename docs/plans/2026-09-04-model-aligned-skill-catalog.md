# Model-aligned skill catalog implementation plan

> **v2 — revised after the 2026-09-04 panel review** (Dreamer, Realist, Critic, model-guidance fidelity, dstack governance; decision record in `docs/plans/2026-09-04-plan-review-decision.md`). What changed from v1: an ablation gate (Task 4) now precedes the removal of the verification pointers it measures, and every rail the gate does not measure — red-flag lists, the implementer self-review, the per-task review cadence — stays in the body until its own Task 12 row reports; removed text is demoted to bundled files, not deleted; one versioning rule; the router edit keeps its instrument; the census is saved before the 30-day window erases it; the ablations are rescoped to what that window can still measure, with a budget; the sync is two web uploads, not four; every replacement text a reviewer showed to overcorrect is corrected.

**Goal:** Bring all 36 skills into line with Anthropic's current prompting
guidance for the models actually in use — Opus 5 daily, Sonnet 5 for light
work, Fable 5.1 occasionally — acting on the findings in
[2026-09-04-catalog-prompt-audit.md](2026-09-04-catalog-prompt-audit.md).

**Architecture:** Instrument, then free budget, then doctrine, then measure
before removing, then edit. (0) Save today's invocation census — the
transcript store is a rolling 30-day window and the August baseline is
already gone. (1) `## Changes` → `CHANGELOG.md` across the catalog, with a
version bump per skill so every install target can be told apart, and a
`history-in-body` warning so it stays out. (2) ADR-0031 flips the
calibration premise from "Sonnet 5 is the daily driver" to Opus 5 first,
Sonnet 5 second, Fable 5.1 as a guard; adds three shape rules; states the
host scope; snapshots the harness rule the plan relies on. (3) The router
loses its over-trigger boosters and gains the instrument to measure that.
(4) One ablation gate — `verifying-before-done` from its recorded materials
plus an `executing-plans` pair — runs on Opus 5 **before** any verification
rail is touched, because ADR-0030 charges a run for a move toward freedom.
(5–10) The content edits: verification stated once with rails demoted to
bundled files, delegation floors, deliverable length, contract fixes,
register, descriptions. (11) Evals. (12) The remaining ablations, rescoped to
the nine skills the current window can still measure, with a budget and an
owner-approval step. (13) Gate and sync: local dirs per tier, claude.ai twice.

**Stack:** Markdown skills, TypeScript on Bun for one renderer warning,
`bun run build --strict` as the gate, `docs/procedures/skill-ablation.md`.

**Visible slice:** `backend-only: dstack is a CLI + Markdown catalog with no
screen.` The nearest analog: Task 1 ends with `bun run list` printing every
skill's token count lower than today. Behaviour is measured separately — by
the census delta in Task 3 and by Task 4's gate — because a byte drop is not
evidence a skill works better.

Implement task by task. `/test-driven-development` decides each task's risk
tier and test path. A task is done when its Status row carries a commit SHA
and the observed evidence. Request review with `/requesting-code-review`
after Task 1 (the only code) and after Task 6 (the largest behaviour edits).
Steps use `- [ ]` checkboxes.

**Rules that apply to every task:**
- **Anchors are against `799f0b0`.** Locate every edit by the quoted text,
  not the number; within one file apply edits bottom-up.
- **Versioning.** Any commit that changes a skill's rendered `SKILL.md`
  (body or description) or a bundled file bumps `metadata.dstack.version`
  in the same commit — patch for wording, register and relocation; minor for
  a new visible rule — and writes one `CHANGELOG.md` line. `bun run doctor`
  compares version strings only (`src/adapters/cli/doctor.ts:114`), so an
  unbumped change is invisible on every install target.
- **One plain statement per rule.** This plan removes emphasis, repetition
  and Claude-specific scaffolding. It never removes a rule: each keeps one
  plain statement with its reason in the skill that owns it. Codex and
  Gemini CLI consume the same files (live symlinks; 4 `using-dstack`
  invocations in Codex history) and have no harness rules of their own.
- **Commit footer:** the session's attribution lines (`Co-Authored-By:
  Claude Fable 5.1 <noreply@anthropic.com>` and the `Claude-Session:` URL).
- **Priority order** (the user asked for all of it, so the order is stated):
  P0 Tasks 0–3; P1 Tasks 4–8; P2 Tasks 9–11; P3 Task 12. Task 13 closes each
  tier for the local install dirs and runs the claude.ai upload twice, after
  P2 and after P3. `/prioritizing-work` was not run: the order is the
  dependency graph.

---

## Status

**Updated:** 2026-09-04 · **Branch:** `feat/model-aligned-p0` (one per tier; each closed by `/finishing-development-branch`) · **Next:** Task 4

| Task | State | Evidence |
|---|---|---|
| 0 Census + Sonnet set | done | `8af062c` — `docs/ablations/2026-09-invocation-census.md`: 2,752 files, window 2026-08-04→09-04; Opus 5 in 2,347 files / Sonnet 5 111 / Fable 5.1 27; 7 skills at 0; 11 method-only; `cleanupPeriodDays` 90 set; 230 invocation lines archived |
| 1 History out of the body | done | `93495f1` warning + tests + spec rows · `b1e87a3` relocation, 36 patch bumps · `343ef56` five lists declared — 0 `## Changes` headings remain; `bun test` 104/104 (2 new); typecheck clean; `build --strict` exit 0, **zero warnings** (A6: none surfaced); `bun run list`: `verifying-before-done` 1603→1001, `using-dstack` 3858→2896, `auditing-video` 4047→2897 |
| 2 ADR-0031 + governance | done | `8bfcbf7` — `docs/adr/0031-multi-model-calibration.md`; ADR-0030 status + note; three indexes + v3 M45 annotated; `skill-ablation.md` model = Opus 5, `CHANGELOG.md`, owner-approval line; CLAUDE.md four rows + two citations; playbook ×4; `writing-skills` 0.8.0 (rules 5–7, positive discipline method, description rule, checklist) + testing file de-shouted; `validate` 36 OK; `build --strict` exit 0; no live "Sonnet 5 is the daily driver" remains |
| 3 Router boosters + instrument | done | `c6136b1` — `using-dstack` 0.24.0, 2896→2715 tokens; ten eval cases (5 new, 2 negatives); 10 fresh Opus 5 routing probes before and 10 after, reading the frozen rendered router: **10/10 identical** (9 route as intended; case 10 unchanged — the "about to claim done" row, not the boosters, pulls `verifying-before-done` for a rename); the probes surfaced the router's own "Let's build X → /brainstorm" contradiction of its table, fixed in the same commit; ≥14-day census re-run due 2026-09-18 |
| 4 Ablation gate | in progress | 12 detached worktrees under `../mh-worktrees/dstack-ablate/`; ground truths confirmed (1 failing test; TS2322; two fake `done` rows; probe plans e1 type error / e2 test break / e3 missing file); 12 Opus 5 sessions dispatched 2026-09-04 |
| 5–7 | todo | — |
| 8 Contract and stale-reference fixes | done | (SHA in the next row) — `generating-images` 0.5.0 six-row gate + JSON fields + parallel row + ceiling label + `--ref` on codex; `literature-search` → `/researching-facts`; `researching-facts` script path; `learning-from-sessions` lines 8 and 90 + placeholders; `verifying-before-done` 0.7.0 stack-neutral gate; `guarding-destructive-commands` 0.5.0 two sample rows, hook paragraphs replaced; `validate` 36 OK; `build --strict` exit 0 |
| 9–13 | todo | — |

**Deviations from plan:**
- Task 8 ran while Task 4's twelve sessions were in flight: it removes no verification or delegation rail (contract fixes, stale references, two safety additions), so the gate does not cover it and nothing in it depends on the gate's result.
- Branch in place, not a worktree: the native `EnterWorktree` tool restricts itself to an explicit "worktree" request and the skill requires consent for a manual one; CLAUDE.md's "branch first" is satisfied by `feat/model-aligned-p0` in the main checkout. Codex and Gemini symlinks see in-progress edits during the tier.

## Assumptions and risks

| # | The plan assumes | Checked? | If false | Fallback |
|---|---|---|---|---|
| A1 | A root-level `CHANGELOG.md` inside a skill folder is copied by dstack's installer and not counted | yes — `FileSkillRepository.walkBundled` copies every non-reserved root file; `writing-skills` already ships one; `bun run list` excludes it | — | — |
| A2 | Claude Code carries an outcome-honesty rule: "Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging." | yes — quoted from a live session 2026-09-04; **narrower than "run the proving command in this turn"** | Skills would lose the claim-time gate | The one-plain-statement rule above; Task 2 snapshots the quote, dated, into ADR-0031 |
| A3 | Removing the router's "bias toward invoking" text does not reduce skill recall | no | Skills stop firing on real matches | Task 3 saves the census baseline first, runs ten eval cases before/after, and re-runs the census ≥14 days after P0; a drop >30% on a skill with ≥5 baseline calls restores one sentence |
| A4 | The Sonnet 5 ablation pattern (free version matches railed) reproduces on Opus 5 | no | Rails removed in Tasks 5–6 would be load-bearing on the daily model | Task 4 runs before Tasks 5–6; if rails prove load-bearing, Tasks 5–6 shrink to "state once, point once" and demote nothing |
| A5 | claude.ai accepts one updated skill per upload | yes — `docs/procedures/claude-web-skill-sync.md` §3 | — | Two web syncs: after P2 (36 uploads) and after P3 (≤9) |
| A6 | Moving `## Changes` out surfaces no new `closed-enumeration` warnings | yes — replayed the detector over all 36 stripped bodies: none | — | Task 1 Step 5 declares the five known lists unconditionally |
| A7 | Length lines scoped to written deliverables do not suppress Fable 5.1 progress text | no — no Fable run planned | Fable 5.1 sessions go quiet | No line in Task 7 touches progress text; no anti-formatting rule anywhere; the SDD update line states content, not length |
| A8 | Token figures: word counts × 1.3 for the audit; the renderer counts chars/4 × 1.05 | yes — both reproduce the drops (`verifying-before-done` 1603→1001, `auditing-video` 4047→2897, `using-dstack` 3858→2896) | — | — |
| A9 | A `history-in-body` warning kind is within ADR-0028's frozen renderer scope | yes by precedent — ADR-0030 added `closed-enumeration` after ADR-0028; a detector changes no output (ADR-0004) | Reviewer rejects it | Drop the kind; Task 13's grep is the gate |
| A10 | Codex / Gemini sessions that use these skills are rare | yes — 4 `using-dstack` invocations in `~/.codex/history.jsonl` | A rule regresses on a non-Claude model | Restore that rule's one-line form; never a per-host variant (ADR-0029) |
| A11 | The transcript store keeps ~30 days | yes — `cleanupPeriodDays` unset (default 30); oldest file 2026-08-04 | Ablation eligibility computed today is stale next month | Task 12 recomputes eligibility the week each row runs; Task 0 saves the census |
| A12 | Ablation cost ≈ 700k tokens per skill | one datum — `writing-specs` 707,995 tokens / 6 runs | Task 12 overruns | Budget cap in Task 12 with `blocked: budget` as a legitimate end state |

---

## Task 0: Save the census and name the light-work set

**Tier:** `none`.
**Files:**
- Create: `docs/ablations/2026-09-invocation-census.md`
- Modify: `docs/procedures/skill-ablation.md` (one sentence under §1)

Cases: the census names window dates and the 30-day retention; every skill
appears including the four created after 2026-08-14 (`auditing-short-video`
mapped to `auditing-video`); the Sonnet 5 skill set is derived, not guessed;
the keep/merge question is recorded as a later decision, not executed.

- [ ] **Step 1 — count**

```bash
grep -rhoP '"name":"Skill","input":\{"skill":"[^"]+"' ~/.claude/projects --include='*.jsonl' \
  | sed -E 's/.*"skill":"([^"]+)"/\1/' | sort | uniq -c | sort -rn
find ~/.claude/projects -name '*.jsonl' -printf '%TY-%Tm-%Td\n' | sort | sed -n '1p;$p'
grep -c 'using-dstack' ~/.codex/history.jsonl
```

Write the table with the window's first and last date and the sentence:
"The store is a rolling ~30-day window (`cleanupPeriodDays` default 30); a
skill's ablation eligibility is a property of the month, not the skill."

- [ ] **Step 2 — the Sonnet 5 set**

```bash
for f in $(grep -rl '"model":"claude-sonnet' ~/.claude/projects --include='*.jsonl'); do
  grep -hoP '"name":"Skill","input":\{"skill":"[^"]+"' "$f" | sed -E 's/.*"skill":"([^"]+)"/\1/'
done | sort | uniq -c | sort -rn
```

Record the result as "skills invoked in Sonnet 5 sessions this window"; it
becomes ADR-0031 §4's spot-check list.

- [ ] **Step 3 — the keep/merge question, recorded not decided**

Add to the census file: "Skills at 0 invocations this window: <list>.
Method-only skills (no scripts, no references): <list>. Merge candidates
named by the 2026-09-04 review: `executing-plans` + `subagent-driven-development`;
`requesting-code-review` + `responding-to-review`; `dispatching-parallel-agents`
into `subagent-driven-development`; `verifying-before-done` collapsed to its
judgment paragraph and its post-subagent rule. Decision owner: Haris.
Trigger: a skill at 0 invocations across two consecutive windows is a merge
or retire candidate. Not executed by this plan."

- [ ] **Step 4 — the procedure**

Under `skill-ablation.md` §1 add: "The transcript store keeps about 30 days.
Count eligibility the week the run starts; a record from an earlier window
(with its task prompts and free version preserved) may be re-run when the
live store no longer clears the bar."

- [ ] **Step 5 — stop the window from withdrawing the right to measure**

A skill ablated once keeps its record forever; a skill never ablated loses
its three real tasks by waiting. Two owner actions, outside the repo: set
`cleanupPeriodDays` to 90 in `~/.claude/settings.json` (the `update-config`
skill edits it), and archive the invocation lines each month —

```bash
mkdir -p ~/.claude/dstack-census
grep -rhoP '"name":"Skill","input":\{"skill":"[^"]+"[^}]*' ~/.claude/projects --include='*.jsonl' \
  > ~/.claude/dstack-census/$(date +%Y-%m).txt
```

— so a task can be reconstructed after its transcript expires. Record both
in the census file. The archive stays outside the repo: it is the owner's
prompt text.

- [ ] Commit: `docs(ablations): 2026-09 invocation census; 30-day window rule`

---

## Task 1: History out of the body

**Tier:** `none` for the sweep; the detector gets a case list first.
**Files:**
- Create: `skills/<id>/CHANGELOG.md` × 36
- Modify: `skills/<id>/SKILL.md` × 36 (remove `## Changes` to end of file; patch-bump)
- Modify: `src/domain/render/RenderResult.ts:20-28` (add `'history-in-body'`)
- Modify: `src/adapters/claude-code/ClaudeCodeRenderer.ts` (after the `closed-enumeration` block, line 99)
- Modify: `test/unit/adapters/fs/warnings.test.ts` (two tests appended)
- Create: `test/fixtures/skills/warnings-history-in-body/history-in-body/SKILL.md`, `test/fixtures/skills/warnings-history-in-fence/history-in-fence/SKILL.md` (frontmatter copied from `warnings-closed-enum/closed-enum/SKILL.md`; each body carries one "not exhaustive" so it does not also trip `closed-enumeration`)
- Modify: `docs/specs/render-spec.md:254-261` (add rows for `missing-spine`, `closed-enumeration`, `history-in-body` — the first two are already missing), `docs/specs/skill-spec.md:31-40` (layout gains `├── CHANGELOG.md  # Optional. Version history; bundled, never rendered.`) and §Bundled resources, `docs/plans/v1/DONE.md` §Test fixtures (the two fixtures)
- Modify: five skills' lists (Step 5)

Cases: a body with `## Changes` warns; a body without does not; a heading
inside a fenced block does not warn; every skill's rendered body ends
without `## Changes`; every skill's version moved by one patch; the
removed line count equals the `CHANGELOG.md` line count minus its header.

- [ ] **Step 1 — the relocation script** (scratchpad, not committed; run from the repo root)

```ts
// bun run /abs/path/scratchpad/relocate-changes.ts   (cwd = repo root)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
for (const id of readdirSync('skills')) {
  const path = `skills/${id}/SKILL.md`;
  const text = readFileSync(path, 'utf8');
  const at = text.indexOf('\n## Changes');
  if (at < 0) { console.log(`skip ${id}`); continue; }
  const history = text.slice(at + 1).replace(/^## Changes\n*/, '');
  const head = text.slice(0, at).trimEnd() + '\n';
  const bumped = head.replace(/(\n    version: )(\d+)\.(\d+)\.(\d+)/,
    (_m, p, M, m, t) => `${p}${M}.${m}.${Number(t) + 1}`);
  const version = bumped.match(/\n    version: (\S+)/)![1];
  const entry = `- **${version}** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.\n\n`;
  writeFileSync(`skills/${id}/CHANGELOG.md`, `# ${id} — changelog\n\n${entry}${history.trimEnd()}\n`);
  writeFileSync(path, bumped);
  console.log(`moved ${id} → ${version}`);
}
```

Expected: `moved` × 36. Verify: `grep -c '^## Changes' skills/*/SKILL.md`
sums to 0; `git diff --numstat -- 'skills/*/SKILL.md'` removed lines per
file equal `wc -l < skills/<id>/CHANGELOG.md` minus 3 (header, blank, entry).

- [ ] **Step 2 — the detector** (new code; no fence helper exists)

In `src/domain/render/RenderResult.ts` add `| 'history-in-body'` to
`WarningKind`. In `ClaudeCodeRenderer.ts`, after line 99:

```ts
if (HISTORY_HEADING.test(stripFences(skill.prompt))) {
  warnings.push({
    kind: 'history-in-body',
    message: `${skill.spec.id.value}: version history in the body — move it to CHANGELOG.md (ADR-0031 §3).`,
  });
}
```

and beside `OPENNESS_MARKER` (line 173):

```ts
const HISTORY_HEADING = /^## Changes\b/m;
function stripFences(body: string): string {
  return body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, '');
}
```

`stripFences` is local to this detector; the `closed-enumeration` detector
keeps its current raw-body behaviour (changing it would move that warning's
threshold, which ADR-0030 measured).

- [ ] **Step 3 — the tests**, appended to `warnings.test.ts` in its own shape

```ts
test('history-in-body: emitted when the body carries a ## Changes heading outside a fence', async () => {
  const results = await new BuildCatalog(bucket('warnings-history-in-body'), new ClaudeCodeRenderer(), new NoopTelemetry())
    .execute({ host: HOST, now: new Date(0) });
  expect(results.length).toBe(1);
  expect(results[0]!.rendered.warnings.map((w) => w.kind)).toContain('history-in-body');
});
test('history-in-body: suppressed when the heading sits inside a fenced block', async () => {
  const results = await new BuildCatalog(bucket('warnings-history-in-fence'), new ClaudeCodeRenderer(), new NoopTelemetry())
    .execute({ host: HOST, now: new Date(0) });
  expect(results.length).toBe(1);
  expect(results[0]!.rendered.warnings.map((w) => w.kind)).not.toContain('history-in-body');
});
```

Run: `bun test test/unit/adapters/fs/warnings.test.ts` → both pass.

- [ ] **Step 4 — strict build**

Run: `bun run build --strict`. Expected: exit 0, **zero warnings of any
kind** (A6: checked, none surface).

- [ ] **Step 5 — declare the five lists the changelog marker was hiding** (unconditional; each a patch bump)

After `diagramming-architecture:57`, `multi-persona-review:65`,
`running-uat:62` (routing tables): "Not exhaustive — route an unlisted
request by what it must produce." After the Stage 0 input tables in
`modelling-business-processes` and `modelling-system-behaviour`: "Closed by
design — this is the declared input contract." `test-driven-development:70`:
"**Outside** — for example UI layout…". Re-run `bun run build --strict` → exit 0.

- [ ] **Step 6 — the visible slice**

Run: `bun run list`. Expected: every token count lower than the 2026-09-04
baseline; `verifying-before-done` 1603 → ≈1001, `using-dstack` 3858 → ≈2896,
`auditing-video` 4047 → ≈2897. Paste the table into the Status row.

- [ ] **Step 7 — three commits** (precedent `446b587` then the sweep)

`feat(render): history-in-body warning (ADR-0031 §3)` ·
`refactor(skills): move version history to CHANGELOG.md; patch-bump all 36` ·
`fix(skills): declare five lists beside the list`.

---

## Task 2: ADR-0031 and the governance edits

**Tier:** `none`.
**Files:**
- Create: `docs/adr/0031-multi-model-calibration.md`
- Modify: `docs/adr/README.md` (new row; 0030's status cell), `docs/ARCHITECTURE.md` (same two), `docs/README.md:51-75` (same two), `docs/adr/0030-sonnet5-calibrated-skill-shape.md` (status line + note block, the ADR-0025 form), `docs/plans/v3/ROADMAP.md` M45 (status note: `## Changes` body → `CHANGELOG.md` per ADR-0031)
- Modify: `docs/procedures/skill-ablation.md:15-27` (the whole "Model under test" section, heading included), `:83-86`
- Modify: `CLAUDE.md:143-144` and the Code conventions table (four rows)
- Modify: `docs/skill-quality-playbook.md:332, 465, 674, 701`
- Modify: `skills/writing-skills/SKILL.md` (lines 101, 103–104, 109–123, 143–145, 164–185, 191–194, 227–233) → 0.8.0; `CHANGELOG.md` entry
- Modify: `skills/writing-skills/testing-skills-with-subagents.md:13, 148, 180-215, 243, 251-254, 375-382`

Cases: the ADR names three models and each one's failure mode; the
Supersedes clause names every ADR-0030 clause it overturns; the harness rule
is quoted with its date; host scope is stated; every place that said "record
in `## Changes`" now says `CHANGELOG.md`; `writing-skills` no longer mandates
excuse tables; nothing still says Sonnet 5 is the daily driver.

- [ ] **Step 1 — the ADR**

```markdown
# ADR-0031 — Multi-model calibration: Opus 5 daily, Sonnet 5 light, Fable 5.1 occasional

- **Status:** Accepted
- **Date:** 2026-09-04
- **Supersedes:** ADR-0030 §Context (the single-daily-driver premise); §5 (adds the ablation-before-removal clause below); §6 step 2 (model under test) and step 5 (record location); and the YAGNI guard's "one catalog, calibrated for the daily driver" sentence. ADR-0030's four shape rules and four bands carry forward unchanged.
- **Reversibility:** Cheap.

## Context

ADR-0030 calibrated the catalog for Sonnet 5 as the daily driver and parked
two conflicts with Anthropic's Opus 5 guidance because the Sonnet 5 guide
was silent on them. The owner's usage on 2026-09-04: Opus 5 for daily work,
Sonnet 5 for light work, Fable 5.1 by need. The parked conflicts are live on
the primary model.

Anthropic's per-model pages, read 2026-09-04:
- Opus 5 verifies, self-corrects and delegates without being told and
  over-applies any instruction to do more of it; it writes longer files
  than the task needs; visible length is prompt-tuned, not effort-tuned.
- Sonnet 5 follows instructions literally and does not generalize past a
  list; at low effort it under-thinks and the fix is effort, not prose.
- Fable 5.1 under-narrates between tool calls and under-formats; any
  anti-narration or anti-formatting text hurts it.

The harness rule this catalog's verification skills sit beside, quoted from
a Claude Code session on 2026-09-04: "Report outcomes faithfully: if tests
fail, say so with the output; if a step was skipped, say that; when
something is done and verified, state it plainly without hedging." It is an
outcome-honesty rule; it does not say "run the proving command in this
turn". Codex and Gemini CLI consume the same skill files by symlink and
carry no such rule.

The 2026-09-04 audit measured `## Changes` at 15% of the catalog's body
text (6–39% per skill), holding eleven skills at the 88–90% budget line. v3 ROADMAP
M45 introduced that body section; this ADR reverses it.

## Decision

1. **Two targets, one guard, one host scope.** Skills are calibrated for
   Opus 5 first and Sonnet 5 second. Fable 5.1 is a guard: no skill carries
   text that suppresses progress updates or formatting. Behavioural claims
   are made for Claude models in Claude Code; Codex and Gemini CLI consume
   the same files unchanged (ADR-0029), so nothing removed for Opus 5 may
   be a rule — only its emphasis, repetition or Claude-specific scaffolding.
   Every rule keeps one plain statement with its reason in the skill that
   owns it.
2. **Three shape rules join ADR-0030's four** (its "a fifth needs an ADR"
   clause is what this is):
   5. A skill that writes a file says how long it should be — the substance,
      no filler sections, no restated inputs, no closing summary. Scoped to
      the deliverable, never to progress text.
   6. A skill that dispatches agents names its floor (problems that share
      no files and each need more than a handful of tool calls), its
      ceiling (one agent if one suffices; the harness's concurrency limit),
      and sends independent agents in one message.
   7. Verification is stated once, at claim time. Every caller states the
      data form inline in one sentence — a Status row with the commit SHA
      and what was observed — and points to `/verifying-before-done` for the
      method. No skill adds a re-check step or dispatches a subagent to
      re-check the model's own work. Closed by design, outside this rule
      because **independence from the author at a named checkpoint is the
      deliverable**, not a re-run of the author's checks: a judge of a
      running application (`/running-uat`), an independent reviewer at a
      checkpoint a plan or the user names (`/requesting-code-review`, the
      reviewers in `/subagent-driven-development` — whose per-task cadence
      Task 12 row 4 measures), a panel seat or a fact-check of a panel's
      claims (`/multi-persona-review`).
   Where a cross-cutting rule lives: authored once in `/writing-skills`;
   each skill carries one sentence and its own numbers (a measured floor, a
   named artifact's shape). No shared include, no preamble (ADR-0004).
3. **History leaves the body.** Version history lives in
   `skills/<id>/CHANGELOG.md`, a bundled file: copied on install, never
   loaded, never counted. Any commit that changes a rendered `SKILL.md` or
   a bundled file bumps `version` and writes one `CHANGELOG.md` line in the
   same edit — `doctor` compares version strings only. A `## Changes`
   heading in a body is a build warning (`history-in-body`).
4. **Ablations run on Opus 5** at the effort used daily; a skill on the
   Sonnet 5 spot-check list (`docs/ablations/2026-09-invocation-census.md`)
   re-runs one of its three tasks on Sonnet 5. The transcript store keeps
   about 30 days, so eligibility is computed when a run starts; a preserved
   record may be re-run. The two bands moved on Sonnet 5 evidence stand as
   Sonnet 5 results: `verifying-before-done` is confirmed or reversed by the
   gate in the 2026-09-04 plan; `writing-specs` stays provisional until an
   Opus 5 document-shape run agrees, and its record says so.
5. **Removing a rail inside a band is a move toward freedom.** Removing a
   verification or delegation instruction from a body is licensed by an
   ablation row covering that shape (ADR-0030 §5), run before the removal.
   Removed text is demoted to a bundled `references/` file, not deleted, so
   restoring it is one edit.
6. **Discipline skills are written positively.** The rule, its reason, and
   the exit criterion. A counter-excuse is added only after a positive rule
   has measurably failed twice, with the run recorded. Evidence: the
   `verifying-before-done` record (no rail proved load-bearing); the
   anchoring hypothesis comes from the `claude-api` prompt-audit reference
   (Group 1c), not from that record.

## Trade-offs

- `+` Removes the stale premise from six governance documents in one move.
- `+` ~9,600 words leave the prompt surface; eleven skills regain headroom.
- `-` The gate costs 12 Opus 5 sessions before the first behaviour edit;
  the remaining ablations 42 more — 54 in total, ≈ 6.4M tokens at the one
  measured rate. Mitigated: a 6.5M cap, traffic order, `blocked: budget` is
  a legitimate end state.
- `-` A changelog nobody loads is a changelog nobody reads. Mitigated: the
  `writing-skills` checklist still requires the entry; `git log` on the file
  is the audit trail.

## YAGNI guard

No new frontmatter field. One new warning kind, same shape as
`closed-enumeration`. No per-model skill variants — re-derived for three
models: the three pages disagree on emphasis, not on content (all three:
one statement with its reason; length lines scoped to deliverables;
independent agents in one message), so one body written to that shared
subset serves all three; a variant would be the per-host fork ADR-0029
forbids with a model key. Revisit when a measured Sonnet 5 or Fable 5.1
failure traces to an Opus 5 line.

## Reversibility

Cheap: delete the warning kind, move the changelogs back, restore
ADR-0030's model sentence, restore demoted rails from `references/`.
```

- [ ] **Step 2 — supersede and index**

ADR-0030 status line → `- **Status:** Superseded by [ADR-0031](0031-multi-model-calibration.md)`
and, under the header, the ADR-0025-style block:
`> **Superseded in part (2026-09-04).** The four shape rules and the four bands carry forward. ADR-0031 replaces the Context's single-daily-driver premise, adds a clause to §5, and changes §6 steps 2 and 5 and the YAGNI guard's last sentence.`
Add the 0031 row and change 0030's status cell in `docs/adr/README.md`,
`docs/ARCHITECTURE.md`, `docs/README.md`. In `docs/plans/v3/ROADMAP.md` M45
add: "Status 2026-09-04: reversed by ADR-0031 — history lives in
`CHANGELOG.md`, and the renderer warns on a body `## Changes`."

- [ ] **Step 3 — ablation procedure**

Replace `docs/procedures/skill-ablation.md:15-27` (heading through the end
of the section) with:

```markdown
## Model under test

State the model and effort in the record. **An ablation run on one model does
not license a change to a skill used on another**, and that holds in both
directions.

The daily driver is **Opus 5**; run at the effort actually used day to day,
not at `max`. A skill on the Sonnet 5 spot-check list
(`docs/ablations/2026-09-invocation-census.md`) re-runs one of its three
tasks on **Sonnet 5**. The two guides diverge on exactly what this procedure
measures: Opus 5 verifies and self-corrects without being told and
over-verifies when instructed; Sonnet 5 follows instructions literally and
does not generalize past them. A rail that is dead weight on one can be
load-bearing on the other — record both columns per model. At each Claude
Code major release, re-read the harness system prompt and refresh the
snapshot in ADR-0031.
```

Line 85: "add one line to the skill's `## Changes`" → "`CHANGELOG.md`".
Line 87 area (§5 Record it): add "Owner approval is recorded in the file:
'Band move approved by owner: <date>' before the flag changes."

- [ ] **Step 4 — CLAUDE.md**

Line 143: "See ADR-0025 (bands) + ADR-0030 (governance)" → "See ADR-0030
(bands, shape rules) + ADR-0031 (models, rules 5–7, history)". Line 144:
"Sonnet 5 reads a closed list as a ceiling." → "Sonnet 5 reads a closed
list as a ceiling; Opus 5 over-applies any instruction to do more." Add four
rows to the Code conventions table:

```markdown
| A skill that writes a file says how long | "Length follows the evidence: no filler sections, no restated inputs, no closing summary." Scoped to the deliverable, never to progress text (Fable 5.1 guard). ADR-0031 rule 5. |
| A skill that dispatches agents names floor, ceiling, and single-message launch | "Independent problems, each more than a handful of tool calls; one agent if one suffices; independent agents in one message." ADR-0031 rule 6. |
| Verification is stated once | One inline sentence in the data form (Status row: SHA + what was observed), a pointer to `/verifying-before-done` for the method; no re-check step, no subagent to re-check your own work. A judge, an independent reviewer at a named checkpoint, or a panel seat is outside the rule because independence from the author is the deliverable (ADR-0031 rule 7). |
| Version history lives in `skills/<id>/CHANGELOG.md` | Bundled, never loaded. Every commit that changes a rendered body or a bundled file bumps `version` and adds a line. A `## Changes` heading in a body is a build warning. ADR-0031 rule 3. |
```

- [ ] **Step 5 — playbook**

At lines 332, 465, 674, 701 replace "`## Changes`" with "`CHANGELOG.md`". At
line 332 also replace "needs only a rationale" with "needs one ablation run
(ADR-0030 §5)" — the sentence is ADR-0025's superseded asymmetry.

- [ ] **Step 6 — writing-skills** (0.7.0 → 0.8.0; `CHANGELOG.md` entry)

Lines 109–110 → "The catalog runs on two models that fail differently, with
a third as a guard. Opus 5 (daily) verifies, delegates and self-corrects
without being told and over-applies any instruction to do more of it; it
also writes longer files than the task needs. Sonnet 5 (light work) reads
literally and will not generalize past a list. Fable 5.1 (occasional)
under-narrates and under-formats, so nothing here may suppress progress text
or formatting. Codex and Gemini CLI read the same files with no harness
rules, so every rule keeps one plain statement. So:"

After rule 4, replace "These four are closed by design; a fifth needs an
ADR." with:

```markdown
5. **A skill that writes a file says how long it should be** — the
   substance, no filler sections or restated inputs; scoped to the
   deliverable, never to progress text.
6. **A skill that dispatches agents names its floor, its ceiling, and
   launches independent agents in one message.**
7. **Verification is stated once**: one inline sentence in the data form
   (Status row: SHA + observed), a pointer to `/verifying-before-done` for
   the method; never a re-check step or a subagent to re-check your own
   work. A judge, an independent reviewer at a named checkpoint, or a panel
   seat is outside the rule because independence from the author is the
   deliverable.

These seven are closed by design (ADR-0030, ADR-0031); an eighth needs an ADR.
```

Lines 164–185 (the Discipline skills method) →

```markdown
**Discipline skills** — rules that must hold under pressure, like
`/test-driven-development` and `/verifying-before-done`:

1. Run a pressure scenario with a subagent **without** the skill, on the
   model the skill will run on. Record verbatim what it does.
2. Write the rule as the wanted behavior, its reason, and the exit criterion
   that shows it held.
3. Re-run **with** the skill. It should now comply.
4. Still fails? Sharpen the rule or its reason first. Add a named
   counter-excuse only when a positive rule has measurably failed twice, and
   record which run showed it. Evidence for the positive form: the
   `verifying-before-done` ablation found no rail load-bearing; the
   hypothesis that an unmeasured excuse table anchors the model toward the
   excuses is the `claude-api` prompt-audit reference's (Group 1c).
```

Lines 143–145 → "say what the skill does in one clause and when to use it,
with the specific terms the user will type — a few distinctive error
strings, symptoms, tool names — grouped as intents, never as workflow steps.
Under 80 words; under 120 only when a trigger list is the sole discovery
path (old ids, database names), and say which. Indonesian trigger phrases
stay where the owner's own request wording is Indonesian."

Lines 103–104 → "**One example per output shape**, complete, runnable,
commented with WHY. Two or three deliberately varied ones, labelled
illustrative, when the output is format-sensitive. Never the same example in
five languages."

Checklist line 227–228 → "Discipline skill: baseline-tested with a subagent
on the target model; rule stated positively with reason and exit criterion".
Line 233 → "`CHANGELOG.md` entry written and frontmatter `version` bumped in
the same edit". Line 101 → "recorded in `CHANGELOG.md`".

`testing-skills-with-subagents.md`: line 13 "**REQUIRED BACKGROUND:** You
MUST understand" → "Background:"; lines 148 and 243 "your human partner" →
"the user"; lines 180–215 ("### 1. Explicit Negation in Rules" through the
end of that subsection) → "### 1. State the rule positively — the wanted
behavior, its reason, and the exit criterion the agent can check itself.
Re-run the pressure scenario; a rule that still fails gets a sharper reason
before it gets a prohibition."; delete 251–254 ("Violating letter is
violating spirit") and 375–382 (the 2025-10-03 narrative).

- [ ] **Step 7 — verify and commit**

Run: `grep -rn '## Changes' docs/procedures docs/skill-quality-playbook.md CLAUDE.md skills/writing-skills/SKILL.md` → nothing. (`docs/adr/0030-*.md` keeps its four mentions: two are the superseded clauses, two describe the detector false negative; accepted ADRs are not edited.) Run: `grep -rn 'daily driver' docs/procedures docs/adr/0031-*.md skills/writing-skills/SKILL.md` → only ADR-0031's own "daily driver is Opus 5" sentence. `bun run validate` → 36 OK.
Commit: `docs(adr): ADR-0031 — calibrate for Opus 5 daily, Sonnet 5 light; history leaves the body`.

---

## Task 3: Router boosters, with the instrument

**Tier:** `none`.
**Files:**
- Modify: `skills/using-dstack/SKILL.md:27-33, 50-64, 169-174, 179-191`; minor bump (Task 1 left it at 0.23.1 → 0.24.0); `CHANGELOG.md`
- Modify: `skills/using-dstack/eval/cases.jsonl` (5 → 10 cases)

Cases: the false cost sentence and the two boosters are gone; the router
table, chains and cross-cutting paragraphs are untouched; the catalog-moments
list stays open; ten eval cases exist including two negatives; a baseline
census exists before the edit lands.

- [ ] **Step 1 — five more cases** (two are negatives the file lacks)

```jsonl
{"prompt": "Tolong review skema database ini dari beberapa sudut pandang sekaligus.", "anti_pattern": "Reviewing it alone instead of invoking /multi-persona-review."}
{"prompt": "The app is running on localhost:4200 and here are the acceptance criteria — check that every one passes.", "anti_pattern": "Reading code or running unit tests instead of invoking /running-uat."}
{"prompt": "We have yesterday's plan file — continue where we left off.", "anti_pattern": "Re-deriving plan state from the codebase instead of invoking /executing-plans and trusting its Status block."}
{"prompt": "What does `git rebase --onto` do?", "anti_pattern": "Invoking any skill for a pure knowledge question with no catalog row (over-trigger); answer and say no skill applies."}
{"prompt": "Rename this function in three files and run the tests.", "anti_pattern": "Invoking /test-driven-development or /debugging for a mechanical rename (over-trigger); one line saying no skill applies is correct."}
```

- [ ] **Step 2 — baseline**

Run the ten cases as fresh Opus 5 prompts; record which skill fired per
case in the Status row. Task 0's census is the traffic baseline.

- [ ] **Step 3 — the edits**

Lines 27–33 →

```markdown
Invoke the skill whose row matches the situation before you respond,
including before a clarifying question. A borderline match is your call:
open the skill when the situation resembles a row; skip it when the task is
plainly outside the catalog. A loaded skill costs one to five thousand tokens
for the rest of the session, so invoke on a match, not on doubt.
```

Lines 50–64 →

```markdown
## The rule

Before the first response: the router below has been scanned, the matching
skill invoked, and the choice stated in one line ("Using <skill> to
<purpose>"). No row and no catalog match → proceed without a skill and say so
in one line. A skill with a checklist gets one todo per item. A question is a
task; the check comes before clarifying.
```

Lines 179–191 (the "Red flags — you are rationalizing" table) → delete.
After line 174 add: "Not exhaustive — open the catalog whenever the table is
not an obvious match."

- [ ] **Step 4 — after**

Re-run the ten cases; expected: the same eight positives fire, the two
negatives do not. ≥14 days after the P0 release, re-run Task 0 Step 1 and
compare, per skill, calls ÷ active session days in each window; a drop >30%
on any skill with **≥15 baseline calls** (below that the count is Poisson
noise at a 14-day horizon) restores one sentence: "When a row resembles the
situation, open the skill." Lower-traffic skills are observed, not acted on.

- [ ] Commit: `feat(using-dstack): 0.24.0 — invoke on a match, not on doubt; ten eval cases`

---

## Task 4: Ablation gate for the verification rails

**Tier:** `none`. Follows `docs/procedures/skill-ablation.md`. **Tasks 5 and
6 may not remove any verification or delegation instruction until this task's
record exists** (ADR-0031 §5).
**Files:**
- Create: `docs/ablations/2026-09-verifying-before-done-opus5.md`, `docs/ablations/2026-09-executing-plans-opus5.md`

Cases: twelve Opus 5 sessions at daily effort; both columns filled per task;
tool calls and wall-clock recorded; the decision rule applied (restore a
rail only when column one fills in ≥2 of 3); owner approval line present.

- [ ] **Step 1 — `verifying-before-done`, from the preserved record** (6 sessions)

Materials: `docs/ablations/2026-08-verifying-before-done.md` §Stage 1 (T1–T3
prompts, verbatim) and §Stage 2 (the free version). Same planted defects
(a failing test; a plan task marked done with empty evidence; a type error),
each in an isolated worktree. **Railed = the body at `5b23b94`** (the
1,528-word pre-ablation version the August record tested — `git show
5b23b94:skills/verifying-before-done/SKILL.md`), not the already-halved
current body; free = the record's free text. Only that comparison answers A4
("does the Sonnet 5 result reproduce on Opus 5"). Model: Opus 5 at the daily
effort.

- [ ] **Step 2 — `executing-plans`, current vs pointer form** (6 sessions)

Three real tasks from the 11 recorded invocations this window (pick three
different plan shapes). Planted defect: one that makes **the executor's own
task** fail verification — a test the task's required edit breaks, or a type
error the edit triggers — so the measured outcome is what the executor's
Status row and final message *claim* about its own work. (A stale `done`
row from an earlier task is the wrong oracle: `executing-plans:61` tells
both arms "Trust the block. Do not re-derive.") Railed = the current body
(mandatory per-task gate, 47–48 and 148); pointer = Task 5's replacement
text (data form inline, one pointer, no gate step).

- [ ] **Step 3 — decide, per the procedure**

| Result | What it licenses |
|---|---|
| Column one empty in ≥2 of 3 for both pairs | the **inline-pointer removals only**: the per-task gate line in the `writing-plans` header, `executing-plans`' mandatory gate and stop rules, the TDD checklist rows and cross-references, `debugging`'s step 3, `responding-to-review`'s duplicates, `classify-issue`'s line, `prioritizing-work`'s pre-output framing |
| Column one fills in ≥2 of 3 for either pair | those removals shrink to "state the data form once inline, keep the gate step"; the Status row names which pair |
| Either result | the red-flag / excuse lists (`test-driven-development`, `debugging`), SDD's implementer self-review and final pass, and `requesting-code-review`'s per-task cadence **stay in the body** until Task 12 rows 2 and 4 — those are different shapes and this gate does not cover them |

The gate licenses exactly what it measures. A pass here is not a licence for
shapes it never tested.

Record "Band move approved by owner: <date>" only if a band changes
(`verifying-before-done` `judgment-dominant` is confirmed or reversed here).

- [ ] Commit per record: `docs(ablations): <skill> on Opus 5 — <outcome>`

---

## Task 5: Verification stated once

**Tier:** `none`. Gated by Task 4. Rails are **demoted** to
`skills/<id>/references/pressure-cases.md` (or the named file), never
deleted; each body keeps one plain statement.

- [ ] **`skills/writing-plans/SKILL.md`** (0.9.x → 0.10.0) — lines 141–145 →

```markdown
Implement task by task. `/test-driven-development` decides each task's risk
tier and test path. A task is done when its Status row carries a commit SHA
and the observed evidence (`/verifying-before-done` is the method). User-visible
work also needs `/running-uat` before the plan is declared complete — a green
suite is not evidence a screen works. Request review at checkpoints with
`/requesting-code-review`.
```

Lines 272–295 (Self-review) →

```markdown
## A finished plan

Before saving, the plan satisfies all of these: Task 1 puts something on
screen, or the header says backend-only and why (a mis-ordered Task 1 is
reordered, not patched); every spec requirement and every carried
MUST/P0_GATE maps to a task or a named departure; every task names a tier;
every stub is retired by a named later task in the contract's shape; names
and types agree across tasks; the Status block exists with every task `todo`
and a branch; every unchecked assumption has a fallback; no placeholders.
Then name the task most likely to stall first and what it stalls on, and put
that line in Assumptions and risks. The Dreamer / Realist / Critic walk in
`references/plan-review-pass.md` is one way to check these; use it when the
plan is expensive to get wrong.
```

Line 302 → "A plan too large to hold in one context goes to
`/subagent-driven-development`; a small one is executed directly." The
sequential Disney walk stays in the reference.

- [ ] **`skills/executing-plans/SKILL.md`** (0.4.x → 0.5.0) — lines 45–48 →
"Your judgment enters at one place: the plan review in Step 2. After that
you follow the plan. A task is done when its Status row holds the commit SHA
and what you observed (`/verifying-before-done` is the method); the branch
is wrapped up by `/finishing-development-branch`." Line 148 →
"`/verifying-before-done` — the method behind the Status row's Evidence
cell." Lines 114–137 →

```markdown
## When to stop

Stop, and set the task's row to `blocked` with the reason, when the plan's
intent would have to be guessed, when a deviation invalidates later tasks,
or when a dependency the plan assumed does not exist on this host. A failing
test or a build error is fixed, not escalated — unless the fix would change
what a later task expects, which is a deviation. Not exhaustive: anything
that makes you guess at the plan is a stop. Write the block before you
speak: an `in progress` row left behind is retried by the next session.
```

Line 41 → "Executing in the current session with a plan too large to hold in
one context — `/subagent-driven-development`. A small plan in the current
session — execute it directly with Steps 1–3 here." Line 111 → "Then
`/finishing-development-branch` verifies the branch and presents the merge
options."

- [ ] **`skills/test-driven-development/SKILL.md`** (0.8.x → 0.9.0) — lines 246–277 →

```markdown
## Done means

- The tier was named before implementation started.
- The frozen case list predates the first implementation edit; code-derived
  additions are marked; a wrong implementation would fail this set.
- All four classes walked, or a stated reason a class does not apply.
- The diff carries no narration comment, commented-out code, or unowned TODO.
- Inside a tier: each test was watched failing for the expected reason
  before its production code existed.

The completion claim itself carries the command, exit code and output from
this turn; `/verifying-before-done` is the method.
```

Lines 144–182 →

```markdown
## Inside a tier: the cycle, with our three rules

Run red → green → refactor one behavior at a time. Red must fail for the
right reason — a first run that passes means you are testing existing
behavior; one that errors means fix the error first. Green is the minimal
code, comments included: density inherited from the file, never introduced;
a *why* the code cannot show is the only comment that earns its place.
Green's runner output is pristine — no warnings, no stray errors. Mocks only
when the alternative is impossible (network, time, randomness).
```

Lines 35–40 (banner) → "No production code before a failing test inside a
tier; outside a tier the case list is frozen first — the tier decides how
much of what follows applies." Keep 292–298 as the recap. Lines 212–236
(red flags) **stay in the body until Task 12 row 2 reports**; if that row
finds them not load-bearing they move verbatim to
`references/pressure-cases.md` with a one-line body pointer.

- [ ] **`skills/debugging/SKILL.md`** (0.3.x → 0.4.0) — lines 125–229 →

```markdown
## The order that is not negotiable

No fix before a named cause. Everything below is an exit criterion, not a
sequence — reach it by whatever probe yields evidence (a debugger,
`git bisect`, bisecting the input, boundary logs).

| Phase | Done when | Our specifics |
|---|---|---|
| Root cause | You can name what is broken and why | Reproduce on demand; check what changed (`git log`, `git diff`, env diff); instrument the boundaries — the layer whose output ≠ its input is the failing one |
| Pattern | You can point to the difference that matters | Compare against a working example in the same codebase; list the differences before judging which matter |
| Hypothesis | The cause is confirmed or replaced | 3–5 ranked and falsifiable ("if X, changing Y makes it disappear"); one variable per test; a wrong hypothesis is replaced, never patched over |
| Fix | Symptom gone, no other test broke, instrumentation removed | Failing test first (`/test-driven-development`); one change; no fix-announcing comment; three failed fixes → Phase 4.5 |
| Memory / perf regression | The regression test is a measurement against a baseline taken before the fix | Baseline first — keep the block below verbatim |
```

followed by lines 196–201 verbatim (the `node --inspect` / profiler
baseline block). Lines 31–38 (banner) → "No fix before a named cause; the
table below says when each phase is done." Delete 55–60 (third
restatement). Keep 315–320 as the recap. Keep the flake example only from
80–123. Lines 246–282 (red flags and the excuse table) **stay in the body
until Task 12 row 2 reports**; on a not-load-bearing result they move
verbatim to `references/pressure-cases.md` and the four "User signals" lines
(262–267) stay in the body.

- [ ] **`skills/responding-to-review/SKILL.md`** (0.5.x → 0.6.0) — replace
44–52 and 83–103 (keep 105–108) with: "Two rules carry this skill. Check
the reviewer's claim against the code before you change anything, because
unverified agreement is theater and unverified disagreement is defensive.
Reply with the requirement restated, a specific question, a reasoned
push-back, or the fix itself — never with thanks, praise, or apology,
because those perform agreement in place of a fix and the reviewer cannot
act on them." Lines 173–181 → "Clarify anything unclear first. Then blocking
(regressions, security, correctness), simple (typos, imports, formatting),
complex (refactors, logic). Each item lands with its own test run before the
next starts." Delete the duplicate at line 76 ("Test each before moving
on."). Keep 283–284 (a pointer, not a restatement).

- [ ] **`skills/classify-issue/SKILL.md`** (patch bump) — lines 106–108 →
"Downstream tooling parses the object against the schema above; an
out-of-enum kind or an area over 32 characters is rejected, not repaired."

- [ ] **`skills/prioritizing-work/SKILL.md`** (0.1.x → 0.2.0) — line 224
heading → "## Signs of a bad round — not exhaustive"; lead sentence → "S7–S9
are gates: a round that trips one is not shown until it is fixed. Any other
alarm that applies goes in the chat report with its remedy." Remove "run
before showing output". Delete the repeated "Read every run, both lanes." at
288.

- [ ] **`skills/subagent-driven-development`** (patch bump in this commit;
Task 6 bumps it again) — `SKILL.md:79-80` (final whole-implementation pass)
and `references/implementer-prompt.md:114-139` ("Review your work with fresh
eyes") **stay until Task 12 row 4 reports** (the same post-implementation
re-check shape; SDD itself is frozen at 2 invocations, so row 4's
`requesting-code-review` run is the vehicle); on a not-load-bearing result
they move to `references/pressure-cases.md` and `implementer-prompt.md:147`
("Self-review findings (if any)") goes with them. Now: in
`implementer-prompt.md:40-41` keep "run the command and read the output
before reporting success", drop the `/verifying-before-done` invocation
(pointer shape, licensed by Task 4). After `SKILL.md:76` add "Two review
rounds without approval: stop and hand the user both reports; do not loop a
third time." (an addition, not a removal).

- [ ] Commit: `fix(skills): state verification once; demote rails to references (gated by Task 4)`

---

## Task 6: Delegation floors and ceilings

**Tier:** `none`. Gated by Task 4 only for the `requesting-code-review`
cadence removal; the rest are additions.

- [ ] **`skills/multi-persona-review/SKILL.md`** (0.5.x → 0.6.0) — lines 67–68 →
"Each seat is a fresh agent that re-reads the artifact and reports back; a
full review is roughly ten to thirteen dispatches over two iterations. Below
about one screen of artifact, or when one expert concern covers it, review it
yourself in the main loop and say so — a panel on a 50-line config buys
nothing. The roster below is the only delegation this skill authorises;
reading, merging, verifying and the decision stay in your own loop."
Lines 196–197 → "Dispatch one subagent per seat, blind and in parallel — all
seats of an iteration in one message, one tool use per seat, so no seat can
see another's output." After line 217 (end of step 5) add: "Do this in your
own loop with the source open; `reviewer-prompt.md §3` is a template for the
rare check that needs a context you lack, not a required dispatch." After
line 221 (Iteration 2) add: "Continue each seat through the host's
message-to-agent mechanism (Claude Code: `SendMessage` to the seat's agent);
if that is unavailable, paste the seat's iteration-1 report into its prompt
and drop the 'you reviewed this earlier' line." Line 72 → `State in the
record, once: "This panel buys coverage, not accuracy — accuracy comes from
the verification pass; unanimity is not confirmation; no user evidence was
synthesised."` `references/reviewer-prompt.md` rule 7 → "7. Report every
finding you can anchor, including low-severity and uncertain ones, each with
its severity and your confidence; do not filter for importance or confidence
— the arbiter does that. It is better to surface a finding that later gets
filtered out than to silently drop a real one. Padding is a different
failure: no restating, no generic advice." Rule 8 → "8. Answer the objection
field even when the artifact looks fine. The arbiter reads it as your
blind-spot signal, not as dissent — dissent is the Critic's job."

- [ ] **`skills/requesting-code-review`** (0.3.x → 0.4.0) — `SKILL.md:39-50` →

```markdown
## When to request

Before merging to main, and at any checkpoint a plan or the user names. Also
worth it when stuck, before a refactor, or after a subtle bug fix. Never as a
second check on work you just verified — that check belongs in your own
loop; a reviewer earns its cost by independence from the author, not by
re-running the author's checks. One reviewer per request; if other
independent agents are being launched, send them in the same message.
```

Line 29 ("review early, review often"), 41–43 ("Mandatory: After each task")
and 94–99 ("Never skip review because it's simple") **stay until Task 12
row 4 reports** — the cadence shape is what that row measures; the "When to
request" block above is added beside them now, and row 4 decides which
survives. `code-reviewer.md:8` → "Agent tool
(general-purpose):". `code-reviewer.md:66-75` → the Sonnet 5 page's
paragraph in full:

```markdown
## Calibration

Report every issue you find, including ones you are uncertain about or
consider low-severity. Do not filter for importance or confidence at this
stage — the implementer ranks them. Your goal here is coverage: it is better
to surface a finding that later gets filtered out than to silently drop a
real bug. For each finding, include your confidence level and an estimated
severity (Critical / Important / Minor). Flag deviations from the plan
specifically, and say so if the plan itself is the problem.
```

`code-reviewer.md:33-64`: keep plan alignment, narration comments, and
"tests verify real behavior"; prefix the rest with "Starting points, not the
review:". `code-reviewer.md:108-124` ("Critical Rules"): keep the
comment-request rule as one sentence with its reason; delete the rest (they
restate the output format).

- [ ] **`skills/pdf-to-rag/SKILL.md`** (0.6.x → 0.7.0) — description tail
(line 11) → "Runs autonomously end to end; one vision agent per page that
needs vision." Lines 34–42 →

```markdown
Convert PDFs into retrieval-ready Markdown with **Claude vision + parallel
subagent Workflows** as the primary engine. The AI reads the page;
deterministic tools triage, de-wrap clean prose, and assemble.

**The unit of delegation is one vision agent per page, grounded in the same
pass.** That is the whole fan-out: a document with N vision pages costs N
transcribe agents and N ground agents, sent through one Workflow at the
Workflow's own concurrency limit, which the run log names. Do not add agents
beyond it — no reviewer agents, no per-chunk fix agents unless `dewrap.py`
demonstrably mis-structured a region (Phase 4 fallback), and never a pilot
batch before the real one.

## Run autonomously — one overlapped pass (default)
Finish end-to-end in one go. Staging (pilot → ask → phase → wait) is what
makes a doc take an hour — not the compute. Don't pilot, don't ask which
approach, don't ask before running the Workflow; ask only on a real blocker
(missing file, ambiguous target).
```

Delete "Supersedes the deterministic `pdf2md`." Lines 71–74 → "`dewrap.py`
is letter-neutral and word-identical to the AI fix-pass on the benchmark, so
clean prose never earns an agent; de-wrap, triage, assembly and gate are
rails, vision and grounding stay AI." Delete 150–151. Ground profile schema
in `references/vision-prompts.md:152-176`: add `confidence: high|medium|low`
per invented/missing/altered item; `SKILL.md` step 4: "Re-read the PNG for
`high` and `medium` items; treat a `low` single-letter claim as KEEP."

- [ ] **`skills/dispatching-parallel-agents/SKILL.md`** (0.2.x → 0.3.0) —
description "2+ independent tasks" → "independent problems that share no
files and each need more than a handful of tool calls"; after line 31 add
"Dispatch when the problems are independent (no shared files, no shared
cause) and each is more than a handful of tool calls; a single failure, or
two that share a cause, is investigated directly. One agent per domain is
the ceiling, not the goal: if one agent can take two domains that share no
files, send one." Delete 91–97; keep 166–179 as the single post-return
section.

- [ ] **`skills/reverse-engineering-video/references/fanout-protocol.md:38`**
→ "| 400 < total, and sequences are known | One agent per sequence; split any
sequence over the cap. Launch all of them in a single message with one Agent
call each, so they run concurrently. |" (patch bump in this commit; Task 7
bumps it again)

- [ ] **`skills/subagent-driven-development`** — `SKILL.md:251-253` → "If
the reviewer's finding is a fix you can make in a couple of edits, make it
yourself; dispatch a fix subagent only when the fix is itself a task."
`SKILL.md:83-96` → "Mechanical tasks (one or two files, complete spec): the
host's cheaper tier. Integration and judgment tasks, and every review: the
session's default model. Nothing below the cheaper tier for code that
ships." `SKILL.md:30` → "Do not ask the user whether to continue between
tasks; report each task's outcome and its Status row as it lands."
`references/spec-reviewer-prompt.md:21-35` →

```markdown
## Verify against the code

The implementer's report is a claim, not evidence. Read the diff and compare
it to the task text line by line. Report what is missing and what was added
that the task did not ask for, each with `file:line`.
```

`references/implementer-prompt.md:19-27, 48-49, 97-107` → "Before you begin:
if two readings of the task would produce materially different work, report
NEEDS_CONTEXT naming both readings. Otherwise state your assumption in the
report and proceed. Report BLOCKED when the task needs an architectural
decision the plan did not make, or code you cannot locate after a real
search." `SKILL.md:134-208` (the example workflow) → move whole to
`references/example-workflow.md`; leave "A worked run:
`references/example-workflow.md`." `SKILL.md:226-238` (Never list): keep the
four with provenance (main-branch consent, parallel implementers collide, no
plan-file reads, scene-setting); the other eight restate the statuses at
100–114 and are deleted.

- [ ] Commit: `fix(skills): delegation floors, ceilings and single-message launch`

---

## Task 7: Deliverable length (ADR-0031 rule 5)

**Tier:** `none`. Every line is scoped to the file the skill writes; none
touches progress text (A7). Each edit is a minor bump (a new visible rule).

- [ ] `skills/discovering-requirements/SKILL.md` after the Output template
pointer (≈265): "Length follows the depth and the requirement count, not the
template: a Light document is one page, and no section carries filler prose,
restated requirements, or a closing summary." 0.4.x → 0.5.0.
- [ ] `skills/prioritizing-work/SKILL.md` in Output (270–276): "The document
is the tables and the departures list. Explanatory prose is at most one
paragraph per stage, and nothing from the references is restated." (minor
bump in this commit)
- [ ] `skills/writing-specs/SKILL.md` in Output (243–252): "Length is set by
the depth and the component count: cover every gate's evidence, and write no
section that restates the requirements, summarizes another section, or
exists only because the template names it — write `n/a — <why>` instead."
0.7.x → 0.8.0.
- [ ] `skills/writing-plans/SKILL.md` under "Where the plan goes": "A plan's
length is its task count times the code each task needs. It carries no
introduction beyond the header block, no restated spec, and no closing
summary; the Status block is the only summary." (minor bump in this commit)
- [ ] `skills/literature-trends/SKILL.md` step 6: "Length follows the
evidence: one paragraph per topic that changed rank, the caveat once, no
summary of the tables the reader already has." 0.2.x → 0.3.0.
- [ ] `skills/auditing-video/SKILL.md` after line 196: "Length follows the
evidence: each section as long as its findings need and no longer — no
restatement of the tables, no filler between sections. A short video with
few defects gets a short report." 2.0.x → 2.1.0.
- [ ] `skills/reverse-engineering-video/SKILL.md` after line 196: "Length
follows what was recovered: a section is as long as its rows and prompts
need, and a short file gets a short package. Do not restate the CSVs in
prose." 0.2.x → 0.3.0.
- [ ] `skills/running-uat/SKILL.md` after line 171: "The run log is
evidence, not narrative: one row per scenario with the verbatim criterion,
verdict and artifact paths; no prose recap of what the reader can see in the
rows." 0.4.x → 0.5.0.
- [ ] Commit: `feat(skills): calibrate written deliverable length (ADR-0031 rule 5)`

---

## Task 8: Contract and stale-reference fixes

**Tier:** `none`. Each is a repo-verifiable defect. Patch bumps unless noted.

- [ ] **`skills/generating-images/SKILL.md`** (→ 0.5.0) — line 126 → "No
asset is delivered until all six hold." Gate table: insert row 5 "The asset
is a rendered image, not code-drawn — `low_detail: true` (`bytes_per_pixel`
< 0.5) is the signal; nine photographs measured 1.18–1.99, four code-drawn
files 0.005–0.063 — but **look at the image**: one detailed vector drawing
scored 1.90 and passed the signal"; the ceiling row becomes 6. JSON example
gains `"bytes_per_pixel":1.42,"low_detail":false`. Line 218 → "| Running a
chain in parallel | Each call attaches the previous image, so a chain is
serial by construction. For independent images, parallel behaviour is
unmeasured on both engines — run serially until someone measures it. |".
Stage 4 heading (≈162) → "Observed ceilings, 2026-08-29/30 — the size you
may quote is this run's `actual`, never this table:". Lines 104–106 →
`python3 "<skill_dir>/scripts/generate_image.py" --engine codex --prompt-file prompt.txt --out assets/shot-02.png --ref assets/shot-01.png   # codex: 9/9 unique on reference calls; agy returned the reference 3/9`.
Lines 40–43 → the same two sentences, bold, sentence case, outside the code
fence. Note for the owner: the script's `--engine` default is `agy`; the
skill's own evidence argues for `codex` when `--ref` is present.
- [ ] **`skills/literature-search/SKILL.md:66`** → "open-ended web research
(use `/researching-facts`)".
- [ ] **`skills/researching-facts/SKILL.md:73, 140`** → `python3 "<skill_dir>/scripts/brave_search.py" "<variant 1>" "<variant 2>" "<variant 3>" -n 10`.
- [ ] **`skills/learning-from-sessions/SKILL.md`** — line 8 (description)
"The exit condition is a committed change" → "The exit condition is a
written change, committed when the user asks"; line 90 → `| How a task
should be done, reusable across repos | the owning skill's body (`SKILL.md`)
and its `CHANGELOG.md` entry | edit the spine, not the prose around it |`;
`/tmp` → the session scratchpad; the real project name → `<project>`.
- [ ] **`skills/verifying-before-done/SKILL.md:65-84`** →

```markdown
## Default gate when the repo names none

Use the repo's own gate if it has one — a CLAUDE.md verification section,
`make verify`, a `check` script. Otherwise, in this order, stopping at the
first non-zero exit: the compile or typecheck step; the whole test suite,
pass count visible; the lint or validate step; the one check specific to
this change. Runner commands per stack are in `/test-driven-development`'s
runner table — read the repo's own runner first, never assume the stack.

A screen was touched? A green suite is not evidence it renders. Open it, or
run `/running-uat`.

Not exhaustive: infrastructure, data, or a published contract needs its own
proving command, and naming it is the judgment above.
```

Lines 59–63 → one sentence: "(Measured 2026-08-14: a subagent reported the
suite green on this machine and red on CI; it was right by luck of the
machine.)" Swap one row of the claim table (91–96) to a non-Bun stack.
→ 0.7.0.
- [ ] **`skills/guarding-destructive-commands/SKILL.md`** (→ 0.5.0) — after
line 42 add the row "| Visible to others — `git push`, a PR or issue
comment, a message, a change to shared infrastructure | `gh pr comment 42
--body …` | Others act on it; retraction is public |". After line 75: "An
obstacle is not a licence: never bypass a check (`--no-verify`, a forced
push after a refused one) or discard unfamiliar files to get past it — they
may be someone's in-progress work." Replace 26–27 and 77–88 with "This is
advisory text, not an interception: nothing stops the command but you. Where
a hard guarantee is needed (prod, shared systems), also configure the host's
pre-tool hook to block these patterns." Description "Reminds the user to
pause" → "Pauses for confirmation".
- [ ] Commit: `fix(skills): contract drift and stale references`

---

## Task 9: Register and repetition

**Tier:** `none`. One sentence replaces each shouted banner; the reasons that
follow each banner stay untouched. Patch bumps.

- [ ] `discovering-requirements:46-49` → "Every goal carries a metric, every
constraint a primary source, and every gate a written verdict; the stages
below say why each is required."
- [ ] `prioritizing-work:37-40` → "Classify before ranking, falsify before
building, and never print a score without a named source; an unscorable item
is a legitimate answer."
- [ ] `writing-specs:39-42` → "Every decision cites a requirement, every
requirement is covered or explicitly out, and code is evidence for a
decision, never the spec's content — the last rule is explained next."
- [ ] `designing-test-cases:37-40` → "Derive every case from the
specification, never from the implementation, and drop any case that cannot
fail — the next paragraph says why both break by the same shortcut."
- [ ] `pdf-to-rag` body and `references/vision-prompts.md`: sentence case
throughout, every rule and reason kept; bold stays on the two irreversible
rules. `vision-prompts.md:42-43` → "Transcribe what is visible. Do not
invent, summarize, paraphrase or translate — this is a legal corpus and a
corrected law is a wrong law. If the page is blank or only an
emblem/letterhead, return near-empty markdown and set blank=true."
- [ ] `reverse-engineering-video:184-185` → delete the parenthetical; item 1
reads "**What this could and could not recover** — `limitations.txt`, the
threshold chosen and why, and every `unknown` field group."
- [ ] `diagramming-architecture:128-129` → "A mechanical run finds roughly
three times what a visual pass does — 7 findings against 2 on the first real
diagram — which is why the check is mechanical, never a visual once-over."
- [ ] `wireframing-interfaces:135-137` → "The checker catches marker/chrome
collisions and overflowing labels the author's eye passes over — 3 of 3
panels and two labels on the first real run — which is why the check is
mechanical."
- [ ] `modelling-business-processes`: (input-table marker done in Task 1).
- [ ] `brainstorm:209` → "Short enough to confirm at a glance — one line per
decision." Line 45 → "This skill is deliberately judgment-dominant:".
- [ ] *Not done, by decision:* the `finishing-development-branch` Always
list and the `using-git-worktrees` repeated copies stay — no copy disagrees
(keep-list: working redundancy is not cruft); `using-git-worktrees:243` is a
pointer and stays; the three `modelling-system-behaviour` notation rules
stay until someone names them.
- [ ] Commit: `style(skills): plain register; measured reasons kept`

---

## Task 10: Descriptions — what and when, never the workflow

**Tier:** `none`. Rule (from the Anthropic authoring guide the repo
bundles, `anthropic-best-practices.md:187,197`): one clause on what the
skill produces, when to use it, and the specific trigger terms — never the
workflow steps. Under 80 words; under 120 only when a trigger list is the
sole discovery path (old ids, database names), and say which. Quoted user
phrases stay. Indonesian trigger phrases stay. Patch bump per changed
skill; update the matching entry in `skills/using-dstack/references/skill-catalog.md`.

- [ ] `subagent-driven-development` → "Use when executing a written
implementation plan with independent tasks in the current session and the
plan is too large to hold in one context; dispatches one fresh subagent per
task with review between tasks. Not for a one-file change or a plan you can
execute directly. Triggers: 'subagent-driven development', 'execute plan
with subagents', 'dispatch a subagent per task'."
- [ ] `requesting-code-review` → "Use before merging to main, at a
checkpoint a plan names, when stuck, or after a subtle bug fix — a fresh
reviewer with a crafted brief catches what the author cannot. Triggers:
'request review', 'get this reviewed', 'review before merge'."
- [ ] `responding-to-review` → "Use when handling PR comments, inline review
threads, or when asked to 'respond to this review', 'address these
comments', or 'the reviewer said X'; verifies each claim against the code
before acting. Not for a direct instruction from the user."
- [ ] `finishing-development-branch` → "Use when implementation on a branch
is complete and tests pass, and the work must be integrated, handed off, or
dropped — presents merge, PR, keep, or discard with the checks each needs.
Triggers: 'finish the branch', 'wrap up', 'merge or PR', 'complete this
work'."
- [ ] `running-uat` → "Use when a RUNNING application must be accepted or
rejected against enumerated acceptance criteria from a stakeholder's point
of view, through a real browser, with a PASS/FAIL verdict per criterion. Not
for unit or e2e tests, not for testing a dstack skill, and not to find out
whether a build works at all. Triggers: 'run UAT', 'acceptance test', 'test
via browser', 'user acceptance testing', 'smoke test the running app', 'make
sure every acceptance criterion passes'."
- [ ] `multi-persona-review` — keep the first sentence and every quoted
trigger phrase verbatim; delete the "Also use when reviewers are agreeing
too readily…" clause and the mode enumeration (≈92 words; the 120 tier
applies: the quoted phrases are the discovery path for the most-invoked
skill).
- [ ] `diagramming-architecture`, `wireframing-interfaces`,
`modelling-business-processes`, `modelling-system-behaviour`,
`generating-images`: keep one capability clause ("produces editable and
viewable diagram files", "draws one rough panel per state", "produces a
lint-clean `.bpmn`", "produces `.puml` sources plus renders", "generates an
image through an agent CLI with the real size measured"); delete the
workflow narration ("Covers which engine…", "states per output what this
machine could and could not produce").
- [ ] `reverse-engineering-video` sentence 2 → "Handles long files, not
only short form."
- [ ] `auditing-video` → keep as written except "— is it any good, why do
people watch, what to fix first —" is dropped; old ids stay (120 tier).
- [ ] `literature-search` → "Use when citations must be harvested from an
academic database's WEB search for a systematic, scoping, or bibliometric
review; produces a RIS corpus with PRISMA hit counts. Tested adapters:
ScienceDirect, Taylor & Francis (tandfonline), Springer Nature Link,
ProQuest Dissertations & Theses (guest), Neliti / Perpusnas e-resources;
Emerald and others plug in as adapters. Not for a database with a query
API, and not for open-web research. Triggers: 'SLR search', 'literature
search', 'search string', 'boolean query', 'export RIS', 'harvest
citations', 'build a reference corpus', any database name above." (120 tier:
database names)
- [ ] `literature-trends` → "Use when a corpus of exported bibliographic
records (RIS from any academic database or reference manager; convert
BibTeX first) has to become research-topic trends — which topics are
growing, which are mature — with trend diagrams. Database-agnostic. Stage 2
after /literature-search. Triggers: 'research trend analysis',
'bibliometric', 'topic categorization', 'which topics are growing',
'keyword frequency', 'publication trend', 'corpus analysis', 'trend map'."
- [ ] `literature-fulltext` → "Use when full-text PDFs must be fetched for a
citation corpus and only legitimately open-access or institution-licensed
copies may be taken; produces the PDFs plus a license manifest, with
Unpaywall for DOIs and the source's own OA flag for the no-DOI cases
(ProQuest dissertations, Neliti). Stage 3 after /literature-search and
/literature-trends. Triggers: 'download OA PDF', 'fetch full text',
'unpaywall', 'get the PDFs', 'download dissertation PDF', 'ProQuest full
text', 'Neliti PDF'."
- [ ] `classify-issue` → "Use when the user pastes an issue body and asks
to 'triage this', 'classify this issue', or 'what kind of issue is this';
produces a structured triage record (bug / feature / chore / question /
regression)."
- [ ] `using-git-worktrees` → "Use when starting feature work that needs
isolation from the current workspace, or before executing an implementation
plan; ensures an isolated workspace exists, preferring the platform's
native worktree tool. Triggers: 'git worktree', 'isolated workspace', 'set
up a worktree'."
- [ ] `learning-from-sessions` → "Use when turning your own past sessions
into durable improvements — a written rule, a skill edit, or a memory entry
per recurring pattern — by mining the transcript store under
`~/.claude/projects`. Run it weekly or after a session that went badly.
Triggers: 'retrospective', 'weekly retro', 'evaluate Claude usage', 'what
can we improve', 'lessons learned', 'analyze recurring mistakes', 'learn
from past sessions', 'improve week over week'."
- [ ] `researching-facts`, `generating-images`: Indonesian triggers stay.
- [ ] Verify: `bun run list --json | jq -r '.[] | "\(.description | split(" ") | length) \(.id)"' | sort -rn` — every changed description under its tier. Re-run the ten `using-dstack` eval cases once (Task 3's set) as a smoke check that routing still lands.
- [ ] Commit: `fix(skills): descriptions say what and when, never the workflow`

---

## Task 11: Missing evals

**Tier:** `none`. Pattern: `skills/brainstorm/eval/cases.jsonl`. One
complete case per skill below; add two more from real invocations where the
census shows any (`executing-plans` 11, `finishing-development-branch` 5,
`writing-skills` 5, `requesting-code-review` 4), one more authored for the
rest.

```jsonl
classify-issue:               {"prompt": "Users report the export button does nothing since Tuesday; I think we need a new export feature.", "anti_pattern": "Classifying as feature because the reporter said so; the body describes a regression."}
dispatching-parallel-agents:  {"prompt": "Three test files fail: auth.test.ts (token expiry), upload.test.ts (MIME sniffing), report.test.ts (timezone). No shared code.", "anti_pattern": "Investigating them one after another in the main loop instead of dispatching three independent agents in one message."}
executing-plans:              {"prompt": "Resume docs/plans/2026-08-30-x.md — the Status block says Task 4 is in progress.", "anti_pattern": "Re-deriving what was done from the codebase instead of trusting the block and checking its SHAs."}
finishing-development-branch: {"prompt": "Tests pass on feat/y, we're in a worktree. Wrap it up.", "anti_pattern": "Merging without detecting the worktree first, or deleting the branch before removing the worktree."}
managing-version:             {"prompt": "Release 1.4.0", "anti_pattern": "Editing VERSION by hand instead of running scripts/version.sh."}
requesting-code-review:       {"prompt": "I just ran the suite and it is green; request a review to double-check my work before I continue.", "anti_pattern": "Dispatching a reviewer as a second check on work you just verified — the reviewer's value is independence from the author at a checkpoint, not a re-run of the author's checks."}
subagent-driven-development:  {"prompt": "Execute this 14-task plan with subagents; the second reviewer has rejected task 3 twice.", "anti_pattern": "Looping a third review round instead of stopping and handing the user both reports."}
using-git-worktrees:          {"prompt": "Start the feature in an isolated workspace; the host has EnterWorktree.", "anti_pattern": "Running git worktree add beside the native tool, creating phantom state."}
writing-skills:               {"prompt": "Create a skill called 'careful' that reminds me to be careful.", "anti_pattern": "Accepting an adjective as a skill name instead of a ≤3-word activity (ADR-0027)."}
```

- [ ] Verify each file parses: `bun -e 'for (const l of require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n")) JSON.parse(l)' skills/<id>/eval/cases.jsonl`.
- [ ] Commit — `test(skills): eval cases for the nine skills without one`.

---

## Task 12: Opus 5 ablations — the governance track, rescoped

**Tier:** `none`. Follows the procedure as amended in Task 2. **Budget:
6.5M tokens / 54 sessions including Task 4's 12** (rows below sum to 42;
A12's rate is ≈118k tokens per session), set by the owner before row 1;
when reached, the next row's Status cell reads `blocked: budget` and Task 12
is complete.
Eligibility is recomputed the week each row runs (30-day window). Every
record ends with "Band move approved by owner: <date>" before a flag
changes. Order: by traffic in this window, and eligibility-at-risk first.

- [ ] **Step 0** — re-run Task 0 Step 1; drop any row whose skill fell below three invocations and say so.

| # | Skill(s) | Runs | Question | Expected |
|---|---|---|---|---|
| 1 | `designing-test-cases` (3 — exactly at the bar, run first or lose it) | 6 | CONTESTED: is the enumeration order load-bearing? Three requirement sets with one planted structural trap each; oracle = structural correctness, as `2026-08-writing-specs.md` §Method | → `workflow` with the four-class table normative |
| 2 | `test-driven-development` (6) + `debugging` (7) — the red-flag / excuse-table shape | 12 | Do the lists change behaviour under pressure on Opus 5? Railed = the current body with the lists; free = the same body with the lists replaced by a one-line pointer to `references/pressure-cases.md`. Planted pressure: a user pushing to skip the failing test; a bug with a plausible wrong cause | lists move to `references/` unless column one fills 2 of 3 |
| 3 | `discovering-requirements` (9) + `prioritizing-work` (11) — document shape | 12 | Same design as row 1 (planted structural traps; oracle = the trap addressed at the level that matters) | → `workflow`, gates kept |
| 4 | `requesting-code-review` (4) — per-task cadence and post-implementation self-review (the vehicle for SDD's frozen structure too) | 6 | Does one independent reviewer at a named checkpoint catch what per-task review plus an implementer self-review catches, at what tool-call cost? Railed = current bodies ("Mandatory: after each task"; SDD's self-review and final pass); free = the Task 6 "When to request" block alone. Planted: one real defect in task 2 of a three-task run | cadence text and SDD's self-review/final pass set by the result |
| 5 | `diagramming-architecture` (4) — picture shape | 6 | Same design as row 3 | → `workflow` |
| 6 | Documentary, no runs: re-record the narrow-bridge PASS for `guarding-destructive-commands`, `using-git-worktrees`, `finishing-development-branch`, `running-uat` under ADR-0031 (a dated addendum to `2026-08-narrow-bridge-test.md`: the argument is recoverability, not model behaviour) | 0 | — | bands unchanged |
| — | `subagent-driven-development` (2), `wireframing-interfaces` (1), `using-git-worktrees` (2), `modelling-*` (0): frozen until three invocations appear in one window | — | — | unchanged |

`running-uat`'s judge is outside rule 7 (it judges the application); no
ablation is owed. `multi-persona-review`'s step 5 is in-loop after Task 6's
text fix; no ablation is owed.

- [ ] Per row: write the free version (goal + guardrails + exit criteria),
run, fill both columns with tool calls and wall-clock, decide, record, get
the owner's approval line, bump the skill and its `CHANGELOG.md` if the band
moves, update the calibration flag.
- [ ] Commit per record — `docs(ablations): <skill> on Opus 5 — <outcome>`.

---

## Task 13: Gate and sync

**Tier:** `none`.

- [ ] Run: `bun run typecheck` → clean. `bun test` → all green. `bun run
validate` → 36 OK, 0 ERR. `bun run build --strict` → exit 0, zero warnings.
`grep -ln '^## Changes' skills/*/SKILL.md` → nothing. `bun run doctor` →
36/36 OK (version-only; it proves the versions moved, which Task 1
guarantees).
- [ ] After **every tier**: the README copy loop into each Claude config dir
present; Codex and Gemini CLI read the source by symlink and need nothing.
Then: `for D in ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do grep -l '^## Changes' $D/skills/*/SKILL.md 2>/dev/null; done` → nothing.
- [ ] **claude.ai twice**: after P2 (every skill changed since the last
synced SHA — 36 uploads, one at a time per the procedure) and after P3 (the
skills Task 12 changed, ≤9). Record the synced SHA in the sync commit
(`chore(sync): claude.ai ← <sha>`); the next sync diffs from it. Report
which skills reached which target; name any still pending.
- [ ] Merge each tier's branch via `/finishing-development-branch`; write
the Status block back on `main` with SHAs and observed counts.

---

## Self-review

**Dreamer.** Backend-only is declared; the nearest analog (Task 1's token
drop) is real, and behaviour has its own instruments (Task 3's census delta,
Task 4's gate). Dropped from the audit's ambition: the catalog-size question
is recorded in Task 0 as an owner decision with a trigger, not executed here.

**Realist.** Every task names a tier; the one code task is written against
the real test shape and file paths; every skill edit names its bump; the
release model has a number (45 uploads); Task 12 has a budget and an
approval step; the Status block collapses to one range row.

**Critic.** The weakest task is **Task 4**: twelve Opus 5 sessions whose
`executing-plans` oracle (a defect the executor's own required edit
triggers) has to be planted convincingly in three real plans, and whose
result gates the inline-pointer removals. It is acceptable because the
`verifying-before-done` half runs from materials already written against
the `5b23b94` body the August record tested, the gate licenses only the
shape it measures, and the fallback (state once, keep the gate step) is a
real plan, not a hope. The load-bearing unchecked assumption is **A4**; Task
4 is where it stops being unchecked. The panel's own residual: a tired owner
could wave the twelve sessions through — the two records, with both columns
filled, are the only thing that makes the gate more than a formality.
