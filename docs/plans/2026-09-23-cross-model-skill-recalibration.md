# Cross-model skill catalog recalibration plan

**Goal:** Reduce time and hallucination in development sessions, measured on the user's own sessions, by changing only the skill text that a paired evaluation shows helps on the models the user actually runs.
**Architecture:** Measure first. Two tested scripts mine the transcript stores into aggregate numbers: model and host census, time split, skill-chain length, and hallucination proxies. A fixed rule turns those numbers into one pilot. The pilot compares the current router body with one candidate edit through a deterministic routing probe on each selected model. The edit is kept only if the owner approves a pre-declared keep rule. Work that needs judgment beyond these rules goes to a follow-up plan at gate G3.
**Stack:** Bun scripts (`scripts/session-metrics.ts`, `scripts/route-probe.ts`), `claude -p` probes, Markdown skills, and `bun run validate` / `build --strict`.
**Visible slice:** `backend-only: dstack is a CLI and Markdown catalog with no product screen.` The nearest analog is Task 1, which prints the model and host census table from the user's own transcripts.

Implement task by task. `/test-driven-development` decides each task's risk tier and test path. Every task here is `Tier: none`. The frozen case list for the one behaviour change is `docs/ablations/2026-09-router-size-gate/cases.jsonl`, written before the candidate edit. A task is done when its Status row carries a commit SHA and the observed evidence (`/verifying-before-done` is the method). Request review with `/requesting-code-review` after Task 4. Steps use `- [ ]` checkboxes.

## Status

**Updated:** 2026-09-24 · **Branch:** `feat/cross-model-recalibration` (created in Task 0) · **Next:** Task 2

| Task | State | Evidence |
|---|---|---|
| 0 Branch and tooling commit | done | `2239919`; `bun run typecheck` and `bun test`: 105 pass, 0 fail; frozen cases: 20. |
| 1 Census, retention, predecessor → gate G1 | done | 590 sessions; host counts `.claude` 452, `.claude-zai` 25, `.claude-helium` 111, `.claude-kimi` 2; 378 skill calls; G1 defaults recorded. |
| 2 Development baseline and bottleneck rule | in progress | — |
| 3 Decision-point map | todo | — |
| 4 Router size-gate pilot → gate G2 | todo | — |
| 5 Gate, sync, and handoff → gate G3 | todo | — |

**Deviations from plan:**
- 2026-09-24 — Task 1 Step 4 returned Codex model `gpt-6-luna` instead of expected `gpt-6-sol`; Claude settings returned `.claude=opus[1m]`, `.claude-zai=cc/claude-sonnet-5`, `.claude-helium=opus[1m]`, `.claude-kimi=unset`. The owner directed recording observed values and continuing without further confirmation prompts.
- 2026-09-24 — G1 defaults accepted by the owner: pilot models `claude-opus-5-5`, `claude-sonnet-5`, and `claude-haiku-4-5-20251001`; no gateway or cheap-execution model added; budget ≤160 calls and ≤US$40 including one rerun allowance; predecessor Task 12 is superseded with rows reopening only through G3; the 32 pending claude.ai uploads remain a separate request.
- 2026-09-24 — The owner instructed the executor to apply the router edit automatically only if the plan's K1–K3 keep criteria all pass, with no further confirmation prompt.
- 2026-09-24 — Task 1 Step 2 initially appeared to produce no count list because the command outlasted the tool's 10-second wait and its session handle was not polled. Recovered the output file: 378 invocations; `using-dstack` (35), `writing-plans` (30), and `multi-persona-review` (25) are all in the top five. No command deviation was needed.
- 2026-09-24 — Owner approved recording each task commit SHA in the following task commit, with one final status-only commit for Task 5. This resolves the self-referential Status-row SHA requirement.
- 2026-09-24 — Created `feat/cross-model-recalibration` in the existing sibling worktree directory with `git worktree add -b`, rather than switching the main checkout, to follow the isolated-workspace workflow.
- 2026-09-24 — Revised from the 2026-09-23 draft after review. The owner clarified that TypeSafe Jev contributes **concepts only**, not its library, API, or model. That removes the Jev router arm and API metrics; the concepts are now **Design principles** P1–P6. "Minimal hallucination" joins the goal, defined as H1–H4. The 36-skill re-audit is replaced by a decision-point map of the 15 dev-path skills plus a model-claim grep, because the whole catalog was already audited on 2026-09-04. Draft Tasks 5–6 (other skill families, ADR review) move to a follow-up plan written at G3: they need judgment and inputs that do not exist yet. Measurement scripts and the frozen pilot cases were written and tested on 2026-09-24 so that the executor runs them rather than designs them.

## Rules that apply to every task

1. **Gates stop the work.** At G1, G2, and G3, ask the owner the listed questions verbatim, show the proposed default, and wait. Never pick an answer for the owner. Record each answer with its date under Deviations.
2. **If an Expected line does not match, stop.** Record what you saw under Deviations and ask the owner. Do not improvise a different command or edit the plan text to fit the result.
3. **Privacy.** The repository gets aggregate numbers, model ids, and skill ids only. Never write prompt text, transcript excerpts, project names, session ids, or secrets into the repo. Raw per-session output stays under `~/.claude/dstack-census/`.
4. **Jev is a concept source only.** Do not call the TypeSafe API, install its skill, or add any LLM SDK (DEFERRED D11).
5. **Anchors are against `78ded23`.** Locate edits by the quoted text, never by line number.
6. **Versioning.** A commit that changes a rendered `SKILL.md` or a bundled file bumps `metadata.dstack.version` in the same commit: patch for wording, minor for a new visible rule. It also adds one line at the top of that skill's `CHANGELOG.md`.
7. **Do not edit accepted ADRs, and do not write a new ADR in this plan.** ADR proposals are G3 output.
8. **Checks.** After any skill edit, run `bun run validate` and `bun run build --strict`. Before any commit, run `bun run typecheck` and `bun test`.
9. **Commits.** One per task, imperative subject ≤72 chars, a body that says why, and the attribution footer your session is given. Never force-push.

## Assumptions and risks

| # | The plan assumes | Checked? | If false | Fallback |
|---|---|---|---|---|
| A1 | Predecessor `2026-09-04-model-aligned-skill-catalog.md` finished Tasks 0–11. Task 12 is open, waiting on a 6.5M-token budget; its Step 0 census re-run was due 2026-09-18. Task 13 left claude.ai 4 of 36 current. | yes — its Status rows 12–13 | — | Task 1 records a disposition; G1 decides |
| A2 | Transcripts carry per-turn `turn_duration`, per-message `model`, and, for some sessions, `cost-state` API and tool times | yes — preview run 2026-09-24: 590 sessions (2026-08-04 → 2026-09-24); `cost-state` in 14 of 53 dev sessions | Metrics silently empty | The script prints n for every figure; a figure with n < 8 is reported as "insufficient" |
| A3 | The reported 2–4 h is mostly agent time, not user time | preview only: dev sessions n=53, median agent 156 min, user 39. Idle (gaps > 30 min, a session left open) is 139 and excluded as not agent-caused. | Task 2 shows user time dominates | The bottleneck rule sends the result to G3 instead of a skill pilot |
| A4 | Long agent time correlates with skill-chain length | preview only: ≥3 dstack skills n=30, median agent 206 min; 0–1 skills n=15, 68 min. **Confounded by task size.** | Correlation only, no cause | Task 4's paired probe tests routing with task size held fixed; that, not A4, licenses any edit |
| A5 | Waiting on tools and tests is not the bottleneck | preview only: median tool share 0.15, n=14 | Task 2 finds share ≥ 0.40 | Task 4 is dropped; G3 targets verification frequency |
| A6 | The model label in a transcript is the model that answered | no — the `~/.claude-kimi` sessions report `claude-sonnet-5`, so the gateway may relabel | Census misattributes gateway traffic | Census rows from gateway configs are labelled "as reported by gateway" |
| A7 | `claude -p --disable-slash-commands --tools "" --output-format json` returns `result`, `usage`, `total_cost_usd` | yes — smoke run on Haiku 2026-09-24, 3 cases, ≈48k tokens and $0.06 per call | CLI changes flags | Task 4 Step 1 re-checks; on mismatch, stop (rule 2) |
| A8 | Hallucination proxies H1 and H3 are heuristics with unmeasured precision | known | Proxy counts mislead a later before/after comparison | Report them as proxies. Calibrating them is a G3 item. |
| A9 | The task most likely to stall is Task 4, on the G1 budget or matrix answer, or on gateway models refusing `--model` ids | — | — | Run the Anthropic models only and record the others as "not tested" |

## Design principles (concepts taken from TypeSafe Jev)

Background: `/home/haris/KODING/RISET/typesafe-jev/` (research note, outside this repo). Jev's typed decisions answer from a fixed answer space and never generate prose. The transferable idea: a skill is faster and hallucinates less when every judgment it asks for is a small, typed, evidence-backed decision, and exact work lives in code.

| # | Principle | In a skill body | Serves |
|---|---|---|---|
| P1 | Typed decision | Each choice lists its complete answer set; the answer is one line naming one option | speed, H4 |
| P2 | Explicit abstain | Every answer set includes `none` or `unclear → ask`, so the model is never forced to guess | H4 |
| P3 | Evidence before prose | The one-line answer names its evidence (`file:line`, command output) before any explanation | H1, H2 |
| P4 | Exact work in code | Counting, dates, arithmetic, and fixed rules go to `scripts/`, not prose | H1, speed |
| P5 | Minimal context | The body carries the spine; detail sits in `references/`, loaded on a named condition | speed, H1 |
| P6 | Literal criteria | Decision criteria are observable ("one module", "the user stated the result"), not adjectives | cross-model consistency |

**Hallucination, as this plan measures it:**

| Code | Definition | Measured by |
|---|---|---|
| H1 | Invented reference: a path, module, command, or edit anchor that does not exist | `invented_ref` in `session-metrics.ts` (tool errors by pattern). Proxy. |
| H2 | Claim without evidence in the final answer | Not automated in this plan; G3 item |
| H3 | "Done" claimed after an edit with no test, build, or typecheck run in that turn | `unverified_done` in `session-metrics.ts`. Proxy. |
| H4 | Wrong decision from a closed set: wrong skill, missed risk skill, needless skill | `route-probe.ts` pass/fail against frozen cases |

---

## Task 0: Branch and tooling commit

**Tier:** `none`.
**Files:** commit the five files already present in the working tree:
- `docs/plans/2026-09-23-cross-model-skill-recalibration.md` (this plan)
- `scripts/session-metrics.ts`
- `scripts/route-probe.ts`
- `docs/ablations/2026-09-router-size-gate/cases.jsonl` (20 frozen cases)
- `docs/ablations/2026-09-router-size-gate/size-gate.md` (the frozen candidate paragraph; trial-inserted 2026-09-24: `validate` 36 OK, `build --strict` exit 0)

- [ ] Run `git switch -c feat/cross-model-recalibration`. Expected: `Switched to a new branch`.
- [ ] Run `bun run typecheck && bun test`. Expected: typecheck prints nothing; the tests all pass. `scripts/` is outside `tsconfig` `include`, so this checks that the repo is unchanged, not the scripts.
- [ ] Run `jq -c . docs/ablations/2026-09-router-size-gate/cases.jsonl | wc -l`. Expected: `20`.
- [ ] Commit: `docs(plans): add cross-model recalibration plan and its probes`.

## Task 1: Census, retention, and predecessor reconciliation

**Tier:** `none`.
**Files:**
- Create: `docs/ablations/2026-09-model-host-census.md`
- Modify: this plan's Status and Deviations

- [ ] **Step 1 — stop transcripts expiring.** Only `~/.claude` has `cleanupPeriodDays: 90`; the other three use the 30-day default.

```bash
for D in ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do
  f="$D/settings.json"; [ -f "$f" ] || continue
  jq '.cleanupPeriodDays = 90' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
for D in ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do
  echo "$D $(jq -r '.cleanupPeriodDays' "$D/settings.json")"
done
```

Expected: four lines, each ending in `90`.

- [ ] **Step 2 — skill invocation census.** This is the predecessor's monthly re-run, overdue since 2026-09-18.

```bash
mkdir -p ~/.claude/dstack-census
grep -rhoP '"name":"Skill","input":\{"skill":"[^"]+"' ~/.claude/projects --include='*.jsonl' \
  > ~/.claude/dstack-census/2026-09-24.txt
sed -E 's/.*"skill":"([^"]+)"/\1/; s/^anthropic-skills://' ~/.claude/dstack-census/2026-09-24.txt \
  | sort | uniq -c | sort -rn
```

Expected: a count list. `using-dstack`, `writing-plans`, and `multi-persona-review` are among the top five. This command covers `~/.claude` only, the same scope as `2026-09-invocation-census.md`, so the columns compare.

- [ ] **Step 3 — session metrics.** Run from the repo root.

```bash
bun scripts/session-metrics.ts ~/.claude/dstack-census/2026-09-24-sessions.jsonl \
  ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi | tee ~/.claude/dstack-census/2026-09-24-summary.txt
```

Expected: a `sessions:` line, then the sections `Sessions per config and model`, `Dev sessions`, `Agent minutes by dstack skills`, `Tool share`, and `Hallucination proxies`. The preview on 2026-09-24 printed 590 sessions.

- [ ] **Step 4 — other hosts.**

```bash
grep -E '^model' ~/.codex/config.toml
grep -c . ~/.codex/history.jsonl
grep -c 'using-dstack' ~/.codex/history.jsonl
ls -l ~/.codex/skills | grep -c 'dstack/skills'
jq -r '.model // "unset"' ~/.claude/settings.json ~/.claude-zai/settings.json ~/.claude-helium/settings.json ~/.claude-kimi/settings.json
```

Expected: Codex model `gpt-6-sol`; Codex skills symlinked to `dstack/skills`; one default-model line per Claude config dir.

- [ ] **Step 5 — write `docs/ablations/2026-09-model-host-census.md`** from Steps 2–4, in exactly these sections:
  1. `# Model and host census — 2026-09-24`, then one line on method: the two commands and the window dates.
  2. `## Hosts`: a table with columns host · config dir · default model · how it loads skills (rendered copy / symlink to source) · sessions in window.
  3. `## Models observed`: the `Sessions per config and model` table copied as-is. Mark every row from `~/.claude-zai` and `~/.claude-kimi` "as reported by gateway" (A6). Then list each current model in [Anthropic's model overview](https://platform.claude.com/docs/en/models/overview) that has no row as **not observed**. Do not write "unsupported".
  4. `## Skill invocations`: the Step 2 list next to the 2026-09-04 column from `2026-09-invocation-census.md`.
  5. `## Predecessor open items`: three lines. Task 12 (budget unset; Step 0 re-run done here, date). Task 13's claude.ai partial (4 of 36, SHA `3863c91`). The ADR-0031 premise ("Opus 5 daily"), set against the default model the census now shows.

  Length follows the evidence: no filler sections, no restated inputs, no closing summary.

- [ ] **Step 6 — gate G1.** Ask the owner these four questions verbatim and wait:
  1. *Pilot model matrix.* Proposed default: `claude-opus-5-5` (the new daily default), `claude-sonnet-5`, and `claude-haiku-4-5-20251001` (a lower bound for instruction-following). Add gateway models from `~/.claude-zai` or Kimi? Add the model you will use for cheap plan execution?
  2. *Pilot budget.* Proposed default: at most 160 probe calls and at most US$40 of reported `total_cost_usd`, including one rerun allowance. The smoke run measured about 48k tokens and $0.06 per Haiku call; Opus and Sonnet cost more per call.
  3. *Predecessor Task 12.* Proposed default: close it as superseded by this plan. Its rows reopen only through the G3 follow-up plan.
  4. *claude.ai.* The 32 pending uploads from the predecessor. Proposed default: a separate request, not part of this plan.
- [ ] Record the answers under Deviations, dated, with the owner named as "owner". Commit: `docs(ablations): model and host census 2026-09-24`.

## Task 2: Development baseline and bottleneck rule

**Tier:** `none`. No skill edits.
**Files:**
- Create: `docs/ablations/2026-09-development-baseline.md`

- [ ] **Step 1** — reuse `~/.claude/dstack-census/2026-09-24-summary.txt` from Task 1 Step 3. Do not re-run unless Task 1 was more than 7 days ago; if you re-run, use today's date in both file names.
- [ ] **Step 2 — apply the bottleneck rule.** Apply it exactly and in order; the first matching line wins:
  - **B-user:** median `user_min` > median `agent_min` → the bottleneck is the user's own time, not the agent. Task 4 → `dropped`. Carry to G3. `idle_min` is ignored: a gap over 30 minutes means the session was left open.
  - **B-tool:** `Tool share` n ≥ 8 and median `tool_share` ≥ 0.40 → waiting on tests or tools. Task 4 → `dropped`. G3 targets verification frequency.
  - **B-chain:** the `3+` bucket n ≥ 8, the `0-1` bucket n ≥ 8, and the `3+` median `agent_min` ≥ 2 × the `0-1` median → skill-chain candidate. **Task 4 runs.**
  - **B-model:** otherwise → model time with no chain signal. Task 4 → `dropped`. G3 targets body length and context (P5).

  Preview on 2026-09-24, for orientation only: user 39 < agent 156; tool share 0.15 (n=14); 3+ bucket 206 (n=30) vs 0-1 bucket 68 (n=15) → B-chain. Apply the rule to your own numbers literally. If another line fires, say so; do not reinterpret.
- [ ] **Step 3 — write `docs/ablations/2026-09-development-baseline.md`** with:
  - the `Dev sessions`, `Agent minutes by dstack skills`, `Tool share`, and `Hallucination proxies` blocks copied as-is;
  - one line naming the rule that fired, with its numbers;
  - one line stating that A4 is correlation confounded by task size;
  - one line stating that H1 and H3 are proxies of unmeasured precision.

  Length follows the evidence: no filler sections, no restated inputs, no closing summary.
- [ ] Update the Status row for Task 4 if the rule dropped it. Commit: `docs(ablations): development baseline 2026-09`.

## Task 3: Decision-point map

**Tier:** `none`. Read-only; no skill edits.
**Files:**
- Create: `docs/ablations/2026-09-skill-decision-map.md`

- [ ] **Step 1 — model-specific claims.**

```bash
grep -rnE 'Opus ?[45]|Sonnet ?[45]|Fable ?5|Haiku|claude-(opus|sonnet|fable|haiku)' \
  skills/*/SKILL.md skills/*/references CLAUDE.md AGENTS.md docs/skill-quality-playbook.md docs/ARCHITECTURE.md docs/adr/*.md
```

For each hit, record `file:line`, the model named, and one class:
- **(a) history**: an ADR context or an ablation record;
- **(b) instruction premised on a model trait**: text telling the running model to act a certain way because of how some model behaves;
- **(c) config or routing**: names a model to select.

Only class (b) inside `skills/` is a follow-up candidate.

- [ ] **Step 2 — dev-path skills.** These 15, a list closed by design because they are the skills a development session chains through: `using-dstack`, `discovering-requirements`, `prioritizing-work`, `writing-specs`, `designing-test-cases`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, `debugging`, `verifying-before-done`, `requesting-code-review`, `multi-persona-review`, `running-uat`, `finishing-development-branch`. Read each `skills/<id>/SKILL.md` and fill one row per decision the skill asks the model to make:

| Skill | Tokens (`bun run list`) | Decision (≤8 words) | P1 answer set listed? | P2 `none`/`unclear` option? | P3 evidence required? | P4 exact rule in prose (quote ≤12 words, or —) |
|---|---|---|---|---|---|---|

A "decision" is a point where the text makes the model choose between named options or decide whether a step applies. A skill with no such point gets one row reading "no decision point".

- [ ] **Step 3 — known finding to record.** The `using-dstack` description says "If there is a real chance a skill applies, invoke it to check", while the body (0.24.0) says "invoke on a match, not on doubt". Record this as a P6 conflict. Do not fix it here: Task 4 tests one change at a time, and this one is a G3 candidate.
- [ ] **Step 4** — the remaining 21 skills: token count from `bun run list` and their Step 1 hits only, under the heading "Not in the dev path — not mapped in this plan".
- [ ] Commit: `docs(ablations): skill decision-point map 2026-09`. Length follows the evidence: no filler sections, no restated inputs, no closing summary.

## Task 4: Router size-gate pilot

**Tier:** `none`. Test path: the frozen 20-case list, `docs/ablations/2026-09-router-size-gate/cases.jsonl` (8 small, 2 question, 5 risk, 5 multi-step), exists before the candidate edit.
**Runs only if** Task 2's rule fired B-chain. Otherwise mark it `dropped` with the rule's numbers.
**Files:**
- Create: `docs/ablations/2026-09-router-size-gate/arm-a.md`, `arm-b.md`, `results.jsonl`
- Create: `docs/ablations/2026-09-using-dstack-size-gate.md` (the record)
- Modify, only after G2: `skills/using-dstack/SKILL.md`, `skills/using-dstack/CHANGELOG.md`, `skills/using-dstack/eval/cases.jsonl`

Hypothesis: the router's Feature chain fires on one-module changes whose result the user already stated. A typed size decision (P1, P3, P6) removes needless skills without losing risk skills (H4).

- [ ] **Step 1 — check the CLI.** Run `claude --help | grep -cE 'disable-slash-commands|--tools <tools'`. Expected: `2`. On any other value, stop (rule 2).
- [ ] **Step 2 — freeze both arms.**

```bash
D=docs/ablations/2026-09-router-size-gate
cp skills/using-dstack/SKILL.md $D/arm-a.md
cp skills/using-dstack/SKILL.md $D/arm-b.md
```

Insert the frozen paragraph `$D/size-gate.md` into `arm-b.md` only, directly above `**Common chains**`, with this exact command. Do not edit by hand.

```bash
python3 - docs/ablations/2026-09-router-size-gate/arm-b.md docs/ablations/2026-09-router-size-gate/size-gate.md <<'EOF'
import sys
p, g = sys.argv[1], sys.argv[2]
s = open(p).read(); para = open(g).read()
anchor = '**Common chains**'
assert s.count(anchor) == 1, 'anchor not unique'
open(p, 'w').write(s.replace(anchor, para + '\n' + anchor))
print('inserted')
EOF
diff $D/arm-a.md $D/arm-b.md | grep -c '^>'
```

Expected: `inserted`, then `12`. On anything else, stop (rule 2).
- [ ] **Step 3 — run the matrix from G1.** For each model id the owner approved (for example `claude-sonnet-5`), run arm A, then arm B, from the repo root, with `M` replaced by that id:

```bash
D=docs/ablations/2026-09-router-size-gate
C=skills/using-dstack/references/skill-catalog.md
bun scripts/route-probe.ts run --arm A --body $D/arm-a.md --catalog $C --cases $D/cases.jsonl --model M --out $D/results.jsonl
bun scripts/route-probe.ts run --arm B --body $D/arm-b.md --catalog $C --cases $D/cases.jsonl --model M --out $D/results.jsonl
```

For a gateway model, add `--config-dir ~/.claude-zai` (or `~/.claude-kimi`). Each run ends with `total: 20 calls, <tokens> tokens, $<x> reported`; keep a running sum of calls and dollars. **When the next run would exceed the G1 budget, stop.** Set this task's Status to `blocked: budget` and go to Step 5 with what you have. If a model errors on every case (`no CHAIN line` 20/20), record it as "not tested: <error>" and continue with the next model.
- [ ] **Step 4 — score and decide.** Run `bun scripts/route-probe.ts score docs/ablations/2026-09-router-size-gate/results.jsonl`. For each model, compare its B row with its A row:
  - **K1, no risk loss:** B's `risk+multi pass` ≥ A's.
  - **K2, lighter:** B's `small+question skills` ≤ 0.75 × A's, **or** B's `small+question pass` ≥ A's + 3.
  - **K3, format holds:** B's `no CHAIN` ≤ 1.

  **Keep B only if K1, K2, and K3 hold on every tested model.** If K1 fails by exactly one case on a model and budget remains, rerun both arms on that model once, then judge K1 on the summed counts. If A already scores `small+question skills` = 0 on a model, K2 cannot hold: record "no routing ceremony to remove on <model>". This is a valid result, not a failure.
- [ ] **Step 5 — write `docs/ablations/2026-09-using-dstack-size-gate.md`:**
  - model ids, date, and CLI version (`claude --version`);
  - the score table as printed;
  - K1, K2, and K3 per model;
  - the failing cases per arm: case id and the reasons column from `results.jsonl`, never the raw text;
  - total calls and dollars;
  - the decision: keep or drop.
- [ ] **Step 6 — gate G2.** Show the owner the record's table and decision. Ask verbatim: *"Apply the size gate to `skills/using-dstack/SKILL.md` as 0.25.0? (yes / no)"* Proceed only on "yes"; record the answer and date in the record file as `Router change approved by owner: <date>`.
- [ ] **Step 7 — only on yes.**
  - Run the Step 2 Python command again with the first argument `skills/using-dstack/SKILL.md` instead of `arm-b.md`. Expected: `inserted`.
  - In `skills/using-dstack/SKILL.md`, change `version: 0.24.2` to `version: 0.25.0`.
  - Add this line, followed by a blank line, directly above the current first entry (`- **0.24.2** …`) in `skills/using-dstack/CHANGELOG.md`, with `<date>` replaced by today's date:

```text
- **0.25.0** — <date>: size the task before any chain (a typed `Size:` line); a small change routes to /test-driven-development → /verifying-before-done only. Evidence: docs/ablations/2026-09-using-dstack-size-gate.md.
```

  - Append this line to `skills/using-dstack/eval/cases.jsonl`, then confirm with `jq -c . skills/using-dstack/eval/cases.jsonl | wc -l`. Expected: `11`.

```json
{"prompt": "Add a --json flag to the list command that prints the same table as JSON.", "anti_pattern": "Running /discovering-requirements, /writing-specs or /writing-plans for a one-module change whose result the user already stated, instead of stating Size: small and routing /test-driven-development then /verifying-before-done."}
```

  - Run `bun run validate` (expected `36 skills checked: 36 OK, 0 ERR`), then `bun run build --strict` (expected exit 0 with no warning lines), then `bun run typecheck && bun test` (expected clean and green).
- [ ] Commit, on yes: `feat(skills): using-dstack sizes the task before any chain`. On no or drop: `docs(ablations): using-dstack size gate — <kept|dropped> on <models>`. Commit the arms, results, and record in either case.
- [ ] Request review with `/requesting-code-review` on this task's diff.

## Task 5: Gate, sync, and handoff

**Tier:** `none`.
**Files:**
- Modify: this plan's Status and Deviations

- [ ] Run `bun run typecheck`, `bun test`, `bun run validate`, `bun run build --strict`, and `bun run doctor`. Expected: clean, all green, `36 OK`, exit 0 with zero warnings, 36/36. Record the numbers in the Status row.
- [ ] **If Task 4 changed `using-dstack`:**
  - Run the README loop under *Installing skills into Claude config dirs* for `~/.claude`, `~/.claude-zai`, `~/.claude-helium`, and `~/.claude-kimi`. Codex and Gemini read `skills/` by symlink and need nothing.
  - Upload `using-dstack` to claude.ai: one upload, following `docs/procedures/claude-web-skill-sync.md`. The browser tab must be visible. If the browser or login is unavailable, write "claude.ai pending: using-dstack" in the Status row instead of claiming the sync.
- [ ] **Gate G3.** Give the owner these inputs for a follow-up plan, written by the owner or a stronger model, not by the executor of this plan:
  - the bottleneck rule that fired, with its numbers;
  - the pilot result per model;
  - the class-(b) model claims from Task 3;
  - the P1–P4 gaps from Task 3;
  - the description/body conflict in `using-dstack`;
  - the predecessor Task 12 disposition;
  - calibrating the H1 and H3 proxies (A8) and automating H2.

  Then set Status `Next:` to "follow-up plan (G3)".
- [ ] Commit: `docs(plans): close cross-model recalibration at G3`.
