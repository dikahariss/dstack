# Fast-track and SDD recalibration implementation plan

**Goal:** Cut agent time in development sessions by cutting the process documents agents write, measured on the owner's own sessions, and close the spec → plan → code drift gap the SDD course names.
**Architecture:** Measure, then change one rail. `scripts/session-metrics.ts` gains output-volume metrics and a date filter, so the baseline and the after-picture come from one tool. Small positive rules link plans to specs and stop silent spec drift. The one speed lever — `writing-plans` requiring full code in every step — changes only if an ADR-0030 §6 ablation licenses it, and stays only if the re-measure two weeks after merge agrees.
**Stack:** Bun scripts, `claude -p` runs, Markdown skills; `bun run typecheck`, `bun test`, `bun run validate`, `bun run build --strict`, `bun run doctor`.
**Implements:** `none: no spec — inputs are the 2026-09-28 review of the first draft and the measurements under Evidence`
**Visible slice:** `backend-only: dstack is a CLI and Markdown catalog with no product screen.` The nearest analog is Task 1, which prints the output-volume table from the owner's transcripts.

Implement task by task. `/test-driven-development` decides each task's risk tier and test path; every task here is `Tier: none`. A task is done when its Status row carries a commit SHA and the observed evidence (`/verifying-before-done` is the method). Request review with `/requesting-code-review` in Task 7. Steps use `- [ ]` checkboxes.

## Status

**Updated:** 2026-09-28 · **Branch:** `feat/fast-track-sdd` (worktree `../dstack-fast-track`) · **Next:** Task 1

| Task | State | Evidence |
|---|---|---|
| 0 Workspace and baseline | done | SHA in Task 1's commit; typecheck clean; 105 pass, 0 fail; validate 36/36; build --strict exit 0, 36 skills, no warnings; doctor 36/36 |
| 1–8 | todo | — |

**Deviations from plan:**
- 2026-09-28 — First draft (same path, never committed) rewritten after review. Dropped: draft Task 1, because the same "small task → no chain" router paragraph already failed K2 on all three models (`docs/ablations/2026-09-using-dstack-size-gate.md`); its host-portability half is not a speed cause and belongs in its own plan if wanted. Also dropped: draft Task 2, because subagent waits are 6% of agent time in long sessions and `subagent-driven-development` ran in 3 of 31. Draft Task 3 is dropped because its premise is false: the persona prompts already live in `multi-persona-review/references/`, and the five seats are evidence-based. Draft Task 4's triad is dropped because it duplicates `writing-plans` and `discovering-requirements`. Draft Task 6 is dropped because it is not a speed cause. Kept and reshaped: anti-drift (Tasks 2–4) and the replanning hand-off (Task 4).
- 2026-09-28 — Departure: no project-constitution skill (mission / tech-stack / roadmap). CLAUDE.md, CONTEXT.md, ADRs, and `/init` already carry most of it. It is built only if `/learning-from-sessions` shows project context being re-explained at feature starts.
- 2026-09-28 — Owner: "langsung lakukan perbaikan dan merge ke main dan deploy". G1 is pre-authorized (apply Task 6 without asking if K1–K3 hold). Task 7 Step 4 deploys to local targets on this laptop only; claude.ai and anything off this machine are excluded for now.
- 2026-09-28 — A task's own commit cannot contain its SHA; each `done` row's SHA is written in the next task's commit, with one status-only commit at the end.

## Assumptions and risks

| # | The plan assumes | Checked? | If false | Fallback |
|---|---|---|---|---|
| A1 | Agent time follows generated output and step count, not waiting on tools, tests, subagents, or the user | yes — 2026-09-28 mining, see Evidence | the lever is elsewhere | Task 8 reports agent_min; a miss routes to `/learning-from-sessions` |
| A2 | Long sessions write more because of process documents, not because the task is bigger | partly — files edited are equal (median 11 vs 11); still a correlation | cutting documents saves little time | Task 8's before/after on the same metric decides; revert Task 6 |
| A3 | Three real `writing-plans` invocations exist whose request, input document, and build environment can still be replayed | no — 23 invocations in the census, inputs not checked | Task 5 cannot run | ADR-0030 §6: record "not enough real tasks", drop Tasks 5–6, keep Tasks 1–4 |
| A4 | A plan without per-step code is still executable by Sonnet 5 | no — this is what K2 measures | free arm fails execution | the rail is restored; Task 6 applies only what survived |
| A5 | `claude -p --output-format json` returns `duration_ms`, `num_turns`, `usage`, `total_cost_usd`; `--permission-mode bypassPermissions` runs unattended | partly — json fields smoke-tested 2026-09-24 (A7 of the 2026-09-23 plan); permission flag not | runs hang or lack metrics | use `--dangerously-skip-permissions`; take wall-clock from `date +%s` around the call |
| A6 | Replayed repos build and test in a fresh worktree | no | execution phase cannot verify | run the repo's install command in the worktree (`bun install`, `npm ci`); if that fails, pick another task |
| A7 | The task most likely to stall is Task 5 Step 1, on finding three invocations whose input document and environment still exist | — | — | A3's fallback |

## Evidence (2026-09-28, aggregate only)

55 development sessions, 2026-08-04 → 2026-09-28, four Claude config dirs, via `scripts/session-metrics.ts` plus one-off scripts that Task 1 folds into it.

| Median | 0–1 dstack skills (n=16) | 3+ dstack skills (n=31) |
|---|---|---|
| Agent minutes | 63 | 191 |
| Files edited | 11 | 11 |
| Output tokens, main thread | 160k | 367k |
| Tool calls | 190 | 364 |
| Test runs | 2.5 | 15 |
| Share of written characters going to plan/spec/review documents | 12% | 50% (code 35%) |

The share of time spent inside tool executions is 13–18%. Subagent waits are 6% of agent time in 3+ sessions. Short confirmation prompts ("ok", "lanjut") are 6% of prompts. Agent minutes correlate with output tokens at r = 0.71, with tool calls at r = 0.77, and with files edited at r = 0.46. The rate is about 59 output tokens per API second. In 3+ sessions, `writing-plans` appears in 23 of 31, `multi-persona-review` in 12, `prioritizing-work` in 11, and `running-uat` in 10. The largest single rail on document size is `writing-plans`' "Every step carries the actual content": code gets written once in the plan and again in the repo.

## Rules that apply to every task

1. **Privacy.** The repo gets aggregate numbers, model ids, and skill ids only. Never write prompt text, transcript excerpts, project names other than dstack, or session ids into the repo. Raw material stays under `~/.claude/dstack-census/2026-09-writing-plans/`.
2. **Anchors** are quoted text against `d739530`, never line numbers.
3. **Versioning.** A commit that changes a rendered `SKILL.md` or a bundled file bumps `metadata.dstack.version` in the same commit — patch for wording, minor for a new visible rule — and adds one line at the top of that skill's `CHANGELOG.md` (ADR-0031 §3).
4. **Checks.** After any skill edit: `bun run validate` and `bun run build --strict`. Before any commit: `bun run typecheck` and `bun test`.
5. **Commits.** One per task, imperative subject ≤72 chars, a body that says why, the attribution footer the session gives. Never force-push. No ADR edits.
6. **If an Expected line does not match, stop.** Record what you saw under Deviations and ask. Do not edit the plan text to fit the result.
7. **Two stops only:** gate G1 at the end of Task 5 and the verdict in Task 8. Everything else runs without asking.

---

### Task 0: Workspace and baseline

**Tier:** `none`
**Covers:** `none: setup`
**Files:** none changed; this plan file moves into the branch.

- [ ] **Step 1 — create the worktree**

```bash
cd /home/haris/KODING/WORKSPACE-MH/dstack
git worktree add -b feat/fast-track-sdd ../dstack-fast-track main
mv docs/plans/2026-09-28-fast-track-and-sdd-recalibration.md ../dstack-fast-track/docs/plans/
cd ../dstack-fast-track && bun install
```

- [ ] **Step 2 — baseline gates**

Run: `bun run typecheck && bun test && bun run validate && bun run build --strict && bun run doctor`
Expected: typecheck clean; 0 test failures; validate 36/36; build exit 0 with zero warnings; doctor 36/36.

- [ ] **Step 3 — commit the plan**

`git add docs/plans/2026-09-28-fast-track-and-sdd-recalibration.md && git commit` — subject `docs(plans): add fast-track and SDD recalibration plan`.

### Task 1: Output-volume metrics in `session-metrics.ts`

**Tier:** `none`
**Covers:** `none: measurement tooling for Tasks 5 and 8`
**Files:**
- Modify: `scripts/session-metrics.ts`
- Create: `docs/ablations/2026-09-process-output-baseline.md`

Case list, written before the code:
1. Two assistant lines with the same `message.id` and `output_tokens` 5 then 120 count 120, once.
2. An `Edit` to `…/docs/plans/x.md` adds `new_string.length` to `doc_chars`.
3. A `Write` to `…/src/a.ts` adds `content.length` to `code_chars`.
4. A `Write` to `README.md` adds to `md_chars`.
5. `--since=2026-09-01` drops a session that started 2026-08-01 from both the jsonl and the summary.
6. With no flags, every field the old script emitted is unchanged for every session that started before today.

- [ ] **Step 1 — constants and per-session counters**

Under the `INVENTED_REF` block add:

```ts
const DOC_PATH = /\/docs\/(plans|specs|discovery|tests|reviews|uat|ablations)\/|\/plans?\/|(^|\/)[^/]*plan[^/]*\.md$/i
```

After the line `let lastTurnEnd = 0, cost: Row | null = null, cwd = '', branch = ''` add:

```ts
  const outByMsg: Record<string, number> = {}
  let docChars = 0, mdChars = 0, codeChars = 0
```

After the line starting `if (typeof msg.model === 'string'` add:

```ts
      if (typeof msg.id === 'string') {
        const out = Number((msg.usage as Row | undefined)?.output_tokens) || 0
        outByMsg[msg.id] = Math.max(outByMsg[msg.id] ?? 0, out)
      }
```

Inside the `if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(name) …)` block, after `turnEdited = true; verifiedAfterEdit = false`, add:

```ts
          const written = String((name === 'Write' ? input.content : input.new_string) ?? '').length
          if (!d.isSidechain) {
            if (DOC_PATH.test(input.file_path)) docChars += written
            else if (input.file_path.endsWith('.md')) mdChars += written
            else codeChars += written
          }
```

In the returned object, after `tool_calls: …,` add:

```ts
    output_tokens: Object.values(outByMsg).reduce((a, b) => a + b, 0),
    doc_chars: docChars,
    md_chars: mdChars,
    code_chars: codeChars,
```

- [ ] **Step 2 — date filter**

Replace `const [out, ...dirs] = process.argv.slice(2)` with:

```ts
const argv = process.argv.slice(2)
const since = argv.find((a) => a.startsWith('--since='))?.slice(8)
const until = argv.find((a) => a.startsWith('--until='))?.slice(8)
const [out, ...dirs] = argv.filter((a) => !a.startsWith('--'))
```

In both usage strings (the header comment and the `console.error`), append ` [--since=YYYY-MM-DD] [--until=YYYY-MM-DD]`.

Replace `if (row) rows.push(row)` with:

```ts
      const day = row ? String(row.start).slice(0, 10) : ''
      if (row && (!since || day >= since) && (!until || day <= until)) rows.push(row)
```

- [ ] **Step 3 — shared buckets and the new summary**

After the `dstackSkills` definition add:

```ts
const BUCKETS = [['0-1', (n: number) => n <= 1], ['2', (n: number) => n === 2], ['3+', (n: number) => n >= 3]] as const
```

In the "Agent minutes by dstack skills" loop, replace the inline array with `BUCKETS`. At the end of the file add:

```ts
console.log('\n## Output volume by dstack skills invoked per dev session')
for (const [label, test] of BUCKETS) {
  const b = dev.filter((r) => test(dstackSkills(r)))
  const doc = sum(num(b, 'doc_chars'))
  const all = doc + sum(num(b, 'md_chars')) + sum(num(b, 'code_chars'))
  console.log(`${label}\tn=${b.length}\tmedian output_tokens=${median(num(b, 'output_tokens'))}\tdoc_share=${all ? (doc / all).toFixed(2) : 'n/a'}`)
}
const planned = dev.filter((r) => (r.skills as string[]).some((s) => s.split(':').pop() === 'writing-plans'))
console.log(`\n## Dev sessions that invoked writing-plans: n=${planned.length}`)
for (const k of ['agent_min', 'output_tokens', 'doc_chars']) {
  console.log(`${k}\tmedian=${median(num(planned, k))}\tp75=${p75(num(planned, k))}`)
}
```

- [ ] **Step 4 — cases 1–5 on a fixture**

```bash
S=<session scratchpad>; F=$S/fixture-config/projects/p; mkdir -p $F
cat > $F/s1.jsonl <<'EOF'
{"type":"user","timestamp":"2026-09-10T10:00:00Z","message":{"content":"go"}}
{"type":"assistant","timestamp":"2026-09-10T10:00:05Z","message":{"id":"m1","model":"claude-opus-5-5","usage":{"output_tokens":5},"content":[{"type":"tool_use","id":"t1","name":"Edit","input":{"file_path":"/r/docs/plans/x.md","new_string":"abcd"}}]}}
{"type":"assistant","timestamp":"2026-09-10T10:00:06Z","message":{"id":"m1","model":"claude-opus-5-5","usage":{"output_tokens":120},"content":[{"type":"tool_use","id":"t2","name":"Write","input":{"file_path":"/r/src/a.ts","content":"123456"}}]}}
{"type":"assistant","timestamp":"2026-09-10T10:00:07Z","message":{"id":"m2","model":"claude-opus-5-5","usage":{"output_tokens":30},"content":[{"type":"tool_use","id":"t3","name":"Write","input":{"file_path":"/r/README.md","content":"xy"}}]}}
{"type":"system","subtype":"turn_duration","durationMs":60000,"timestamp":"2026-09-10T10:01:00Z"}
EOF
cat > $F/s2.jsonl <<'EOF'
{"type":"user","timestamp":"2026-08-01T10:00:00Z","message":{"content":"old"}}
{"type":"system","subtype":"turn_duration","durationMs":1000,"timestamp":"2026-08-01T10:00:01Z"}
EOF
bun scripts/session-metrics.ts $S/fx.jsonl $S/fixture-config --since=2026-09-01 > /dev/null
python3 -c "import json;r=[json.loads(l) for l in open('$S/fx.jsonl')];print(len(r),[(x['session'],x['output_tokens'],x['doc_chars'],x['code_chars'],x['md_chars']) for x in r])"
```

Expected: `1 [('s1', 150, 4, 6, 2)]`

- [ ] **Step 5 — case 6 against the old script**

```bash
D="$HOME/.claude $HOME/.claude-zai $HOME/.claude-helium $HOME/.claude-kimi"
git show main:scripts/session-metrics.ts > $S/old-metrics.ts
bun $S/old-metrics.ts $S/old.jsonl $D > /dev/null
bun scripts/session-metrics.ts $S/new.jsonl $D > $S/new-summary.txt
python3 - $S/old.jsonl $S/new.jsonl <<'EOF'
import json, sys, datetime
today = datetime.date.today().isoformat()
load = lambda p: {r['session']: r for r in map(json.loads, open(p)) if r['start'][:10] < today}
old, new = load(sys.argv[1]), load(sys.argv[2])
bad = [s for s in old if s not in new or any(new[s][k] != v for k, v in old[s].items())]
print('compared', len(old), 'mismatched', len(bad))
EOF
```

Expected: `mismatched 0`. A mismatch is acceptable only for a session whose file was still being written during the run; check its last timestamp before accepting it.

- [ ] **Step 6 — record the baseline**

Check that `$S/new-summary.txt` falls in range of the 2026-09-28 mining: 3+ bucket median `output_tokens` between 330000 and 420000, `doc_share` between 0.40 and 0.60. If it does not, stop (rule 6). Then write `docs/ablations/2026-09-process-output-baseline.md`:

```markdown
# Process-output baseline — 2026-09

Command: `bun scripts/session-metrics.ts <out> ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi` at <SHA>, run <date>.

<paste the "Dev sessions", "Agent minutes by dstack skills", "Output volume", and "Dev sessions that invoked writing-plans" sections verbatim>

Output volume and agent minutes are correlated (r ≈ 0.7). Files edited are equal across buckets, but this is still a correlation, not a cause. Task 8 of `docs/plans/2026-09-28-fast-track-and-sdd-recalibration.md` compares against these numbers.
```

- [ ] **Step 7 — commit** — `feat(scripts): measure output volume and filter sessions by date`

### Task 2: Link plans to the spec they implement

**Tier:** `none`
**Covers:** `none: review findings — plans never cite their spec, test-case sets are rewritten instead of cited, small plans run in the planning session`
**Files:**
- Modify: `skills/writing-plans/SKILL.md`, `skills/writing-plans/CHANGELOG.md`

Case list: a plan written after this change has an `Implements:` line; every task has a `Covers:` line; the finished-plan check names `AC-n` coverage; the handoff prefers a fresh session after a long planning conversation.

- [ ] **Step 1 — header template.** After `**Stack:** <key technologies>` insert:

```markdown
**Implements:** <spec or requirements path, and its status> — or `none: <why>`
```

- [ ] **Step 2 — task template.** After the line `(\`authz\` covers authentication, sessions, and tenancy too)` insert:

```markdown
**Covers:** the `AC-n` and `TC-n` this task satisfies — or `none: <why>`
```

- [ ] **Step 3 — A finished plan.** Replace `every spec requirement and every carried
MUST/P0_GATE maps to a task or a named departure;` with:

```markdown
every `AC-n` of the `Implements:` document and every carried MUST/P0_GATE
appears in a task's `Covers:` line or a named departure, and a case set from
`/designing-test-cases`, when one exists, is cited by `TC-n` instead of rewritten;
```

- [ ] **Step 4 — Handoff.** After `a small one is executed
directly.` insert:

```markdown
After a long planning conversation, prefer a fresh session even for a small
plan: whatever the executor then lacks is missing from the spec or the plan, and
it is cheaper found now than after the code.
```

- [ ] **Step 5 — version and changelog.** `version: 0.11.0` → `0.12.0`. Top line of `CHANGELOG.md`:

```markdown
- **0.12.0** — <date>: plans link to what they implement (SDD review 2026-09-28): an `Implements:` header line, a `Covers:` line per task, `AC-n` coverage in **A finished plan** with `TC-n` cited rather than rewritten, and a fresh-session hand-off after a long planning conversation.
```

- [ ] **Step 6 — checks and commit.** `bun run validate && bun run build --strict && bun run typecheck && bun test` → all exit 0, zero warnings. Commit `feat(writing-plans): link plans to the spec they implement`.

### Task 3: Spec drift rule in the two executors

**Tier:** `none`
**Covers:** `none: review finding — execution deviations update the plan but never the spec`
**Files:**
- Modify: `skills/executing-plans/SKILL.md`, `skills/executing-plans/CHANGELOG.md`
- Modify: `skills/subagent-driven-development/SKILL.md`, `skills/subagent-driven-development/references/spec-reviewer-prompt.md`, `skills/subagent-driven-development/CHANGELOG.md`

Case list: a deviation that touches something the spec fixed names the spec amendment or the code fix, never neither; the spec reviewer sees the covered `AC-n` text.

- [ ] **Step 1 — executing-plans.** After `big enough to invalidate later tasks, stop and raise it.` insert:

```markdown
A deviation that changes what the `Implements:` spec fixed — a decision, a
contract shape, a schema row, or an acceptance criterion — also lands in that
spec's change log in the same commit. If the spec is right, the code is what
gets fixed. Leaving both as they are is how a spec becomes fiction.
```

- [ ] **Step 2 — subagent-driven-development.** After `never folded silently into the
task text.` insert:

```markdown
A deviation that changes what the plan's `Implements:` spec fixed — a decision,
a contract shape, a schema row, or an acceptance criterion — also lands in that
spec's change log in the same commit, or the implementer fixes the code instead.
```

- [ ] **Step 3 — spec reviewer prompt.** After the block

```
    ## What Was Requested

    [FULL TEXT of task requirements]
```

insert:

```
    ## Acceptance criteria this task covers

    [Full text of every `AC-n` in the task's `Covers:` line, from the spec — or "none"]
```

Then replace `compare
    it to the task text line by line` with `compare
    it to the task text and those acceptance criteria line by line`.

- [ ] **Step 4 — versions and changelogs.** executing-plans `0.5.2` → `0.6.0`; subagent-driven-development `0.7.3` → `0.8.0`. Top lines:

```markdown
- **0.6.0** — <date>: a deviation that changes what the `Implements:` spec fixed amends the spec's change log in the same commit, or the code is fixed (SDD review 2026-09-28).
```

```markdown
- **0.8.0** — <date>: spec drift rule for deviations; the spec reviewer receives the full text of the task's covered `AC-n` rows (SDD review 2026-09-28).
```

- [ ] **Step 5 — checks and commit.** Same checks as Task 2 Step 6. Commit `feat(executing-plans): amend the spec when a deviation changes it`.

### Task 4: Drift gate and replanning check in `finishing-development-branch`

**Tier:** `none`
**Covers:** `none: review findings — no merge-time drift backstop, no replanning step between features`
**Files:**
- Modify: `skills/finishing-development-branch/SKILL.md`, `skills/finishing-development-branch/CHANGELOG.md`

Case list: a branch whose diff changes an `AGREED` spec's decision without a change-log row is not offered; after Options 1 and 2, three one-line answers appear in the report; Options 3 and 4 skip the check.

- [ ] **Step 1 — drift gate.** After `recurring shapes, **not exhaustive**. Clean them first, then offer options.` insert:

```markdown
If the plan names an `Implements:` spec whose status is `AGREED`, read its change
log too. The branch is not offered while the diff changes a decision, a contract
shape, a schema row, or an acceptance criterion that spec fixed and its change log
does not record — amend the spec (the amend rule is `/writing-specs`') or fix the
code first.
```

- [ ] **Step 2 — core principle.** Replace `Verify tests → Detect environment → Present options → Execute choice → Clean up.` with `Verify tests → Detect environment → Present options → Execute choice → Clean up → Replanning check.`

- [ ] **Step 3 — Step 7.** Directly before `## Quick reference` insert:

```markdown
### Step 7: Replanning check — Options 1 and 2 only

A merge can leave three things stale — closed by design, because these are the
three records a finished branch can make wrong: the spec, the order of what
comes next, and the standing rules. Answer each in one line in the final report,
and act only on a yes:

1. Did the build expose a gap or a wrong decision in the spec? → amend it
   through its change log (`/writing-specs`).
2. Is the next item on the plan or roadmap still the right one? → if not,
   `/prioritizing-work`.
3. Did this branch teach a rule every later session needs? → one line in the
   project's CLAUDE.md, or leave it for `/learning-from-sessions`.

Three "no" answers are the common case and cost three lines.
```

- [ ] **Step 4 — version and changelog.** `0.4.3` → `0.5.0`. Top line:

```markdown
- **0.5.0** — <date>: merge-time spec drift gate for an `AGREED` `Implements:` spec, and a three-line replanning check after merge or PR (SDD review 2026-09-28).
```

- [ ] **Step 5 — checks and commit.** Same checks as Task 2 Step 6. Commit `feat(finishing-development-branch): drift gate and replanning check`.

### Task 5: Ablation of `writing-plans` (ADR-0030 §6) → gate G1

**Tier:** `none`
**Covers:** `none: the speed lever; licenses or refuses Task 6`
**Files:**
- Create: `docs/ablations/2026-09-writing-plans/arm-railed.md`, `docs/ablations/2026-09-writing-plans/arm-free.md`, `docs/ablations/2026-09-writing-plans-opus5.md`

Model under test: `claude-opus-5-5` at the owner's default effort, recorded as reported. `writing-plans` is on the Sonnet 5 spot-check list (`docs/ablations/2026-09-invocation-census.md`), so task T1 also runs on `claude-sonnet-5`. Budget: 16 runs (3 tasks × 2 arms × 2 phases on Opus, plus T1 × 2 arms × 2 phases on Sonnet). Cap: US$60 summed from `total_cost_usd`. Reaching the cap stops the run, and the record states what was measured.

- [ ] **Step 1 — pick three real tasks.**

```bash
python3 - $S/new.jsonl <<'EOF'
import json, sys
for r in map(json.loads, open(sys.argv[1])):
    if r['dev_session'] and any(s.split(':')[-1] == 'writing-plans' for s in r['skills']):
        print(r['start'][:10], r['config'], r['project'], r['session'], r['agent_min'])
EOF
```

Choose three where the verbatim request and the input document (spec, discovery document, or decision record) are recoverable from the transcript and the repo's git history, and where the repo builds and tests at the commit before the original plan. Prefer different repos or task shapes, with at most one from dstack. Save each request as `~/.claude/dstack-census/2026-09-writing-plans/T<n>.request.txt` and the commit id as `T<n>.commit`, outside the repo. If three do not exist, write that finding in the record, set Tasks 5–6 `dropped`, and go to Task 7 (A3).

- [ ] **Step 2 — the two arms.** The railed arm is the current body without frontmatter:

```bash
awk '/^---$/ && n<2 {n++; next} n>=2' skills/writing-plans/SKILL.md > docs/ablations/2026-09-writing-plans/arm-railed.md
```

The free arm is goal, guardrails, and exit criteria only. Write this text to `docs/ablations/2026-09-writing-plans/arm-free.md`:

````markdown
# /writing-plans

Write an implementation plan that a skilled engineer with no context for this
codebase can execute task by task, and that a later session can resume from.
Save it to `docs/plans/YYYY-MM-DD-<feature>.md` unless the user or the repo
names another place.

## Inputs

A spec or agreed requirements for a multi-step change. No written problem →
`/discovering-requirements`. Design undecided (boundaries, schema, contracts) →
`/writing-specs`. Several candidates and no agreed order → `/prioritizing-work`,
whose order is carried, not re-derived. A recorded decision is carried the same
way: each of its work rows becomes a task, and each risk it left open lands in
Assumptions and risks. A single-file, single-step change needs no plan.

## Guardrails

- A product with a screen: Task 1 leaves the user something to open and click;
  stubbed data is fine, and a later named task retires the stub in the
  contract's shape. Otherwise the header says `backend-only: <why>`.
- The header carries Goal, Architecture, Stack, `Implements:` (the spec path and
  status, or `none: <why>`), and Visible slice.
- Each task names the files it creates or modifies, its risk tier from
  `/test-driven-development` (`money`, `authz`, `data-loss`, `core`, `bug-fix`,
  `contract`, or `none` — closed by design, that skill's tier list), the `AC-n`
  and `TC-n` it covers, how its result is verified, and ends in a commit.
- A `## Status` block sits under the header from the start: `Updated`, `Branch`,
  `Next`, one row per task. States are `todo`, `in progress`, `done`, `blocked`,
  `dropped`. Only `done` carries evidence: a commit SHA plus what was observed.
  Deviations are appended, never folded into task text.
- An `## Assumptions and risks` table follows it: what is assumed, whether it
  was checked, what breaks if false, and the fallback.
- Nothing defers content out of the plan: no TBD, no "add appropriate error
  handling", no reference to a type or function that no task defines.
- Length is the task count times what each task needs. No restated spec, no
  closing summary.

## A finished plan

<the "A finished plan" paragraph from arm-railed.md, verbatim>

## Handoff

<the "Handoff" section from arm-railed.md, verbatim>
````

Replace the two `<…>` lines with the verbatim text from `arm-railed.md` before any run.

- [ ] **Step 3 — plan phase, all runs started together.** For each task `T`, arm `A` (`railed`, `free`), and model `M` (Opus for T1–T3, Sonnet for T1):

```bash
W=$HOME/.claude/dstack-census/2026-09-writing-plans
git -C <repo of T> worktree add --detach $W/wt-$T-$A-$M $(cat $W/$T.commit)
cd $W/wt-$T-$A-$M && <repo install command>
claude -p --model $M --output-format json --disable-slash-commands \
  --permission-mode bypassPermissions \
  --append-system-prompt "$(cat <dstack worktree>/docs/ablations/2026-09-writing-plans/arm-$A.md)" \
  "$(cat $W/$T.request.txt) — Write the plan now. Do not ask questions; record open points as assumptions." \
  > $W/$T-$A-$M.plan.json
```

The eight runs are independent, so start them as background jobs in one go. Per run, record `duration_ms`, `num_turns`, `usage.output_tokens`, `total_cost_usd`, and the new plan file's `wc -c`.

- [ ] **Step 4 — execution phase, all runs started together.** In each worktree:

```bash
claude -p --model $M --output-format json --disable-slash-commands \
  --permission-mode bypassPermissions \
  "Execute Tasks 1 and 2 of the newest plan under docs/plans/ in this checkout. Follow it, write its Status block back, and do not ask questions: record anything unclear as a deviation." \
  > $W/$T-$A-$M.exec.json
```

Afterwards, run the verification commands that the plan's Tasks 1–2 name, yourself, and record PASS or FAIL per task. Also record `duration_ms`, `num_turns`, and the number of `Deviations` lines and `blocked` rows. Remove each worktree with `git -C <repo> worktree remove`.

- [ ] **Step 5 — write the record** `docs/ablations/2026-09-writing-plans-opus5.md`. Tasks are labelled T1–T3 by repo kind, never by project name (rule 1). Include:
  - one metrics row per run: task, model, arm, plan chars, plan minutes, plan output tokens, execution minutes, execution turns, Tasks 1–2 verify result, deviations;
  - ADR-0030's two-column table per task: what the railed run got that free missed, and what free reached that railed never did. Both columns get filled; an empty second column means the free arm was thin — investigate before believing it;
  - which rails appear in column one in at least 2 of 3 tasks. Those are restored;
  - the keep rule below, evaluated.

Keep rule, declared before the runs:
- **K1:** free plan chars, median over T1–T3 on Opus, ≤ 60% of railed.
- **K2:** free Tasks 1–2 verify PASS in at least as many tasks as railed, on Opus and on the Sonnet T1 run.
- **K3:** free plan minutes plus execution minutes are lower than railed in ≥ 2 of 3 Opus tasks.

- [ ] **Step 6 — gate G1.** If K1–K3 all hold, Task 6 applies the free arm plus the restored rails. If the owner authorized that in advance, proceed without asking. Otherwise show the record and ask: "Apply the writing-plans change as recorded? (yes / no)". Write "Change approved by owner: <date>" or the refusal into the record. If any of K1–K3 fails: set Task 6 to `dropped` with the failing criterion, and `writing-plans` keeps only Task 2's edits.

- [ ] **Step 7 — commit** — `docs(ablations): writing-plans railed vs free on Opus 5.5` (arms and record only, no raw output).

### Task 6: Apply the licensed `writing-plans` change

**Tier:** `none`
**Covers:** `none: carries the G1 decision`
**Files:**
- Modify: `skills/writing-plans/SKILL.md`, `skills/writing-plans/CHANGELOG.md`
- Create: `skills/writing-plans/references/detailed-task-template.md`

Runs only if G1 approved.

- [ ] **Step 1 — body.** Replace the body under the frontmatter with `arm-free.md`, plus each rail the record restored, quoted verbatim from `arm-railed.md` and placed where it sat in the railed body.
- [ ] **Step 2 — demote, never delete (ADR-0031 §5).** Every railed section not restored goes verbatim into `references/detailed-task-template.md`, whose first line is `Demoted from SKILL.md on <date> by docs/ablations/2026-09-writing-plans-opus5.md (ADR-0031 §5).` End the body with:

```markdown
## Bundled files

- `references/plan-review-pass.md` — the Dreamer / Realist / Critic walk.
- `references/detailed-task-template.md` — the per-step template with full code;
  load it when <the condition the ablation record's decision names>.
```

- [ ] **Step 3 — calibration.** If the record sets a band other than `workflow`, add `calibration: <band>` under `metadata.dstack`, with the owner-approval line from G1 in the record (ADR-0030 §5). Otherwise leave the flag absent.
- [ ] **Step 4 — version and changelog.** `0.12.0` → `0.13.0`. Top line: `- **0.13.0** — <date>: <rails removed, rails restored>; band <band>; licensed by docs/ablations/2026-09-writing-plans-opus5.md on claude-opus-5-5 (Sonnet 5 spot-check <result>); removed text demoted to references/detailed-task-template.md.`
- [ ] **Step 5 — checks and commit.** Same checks as Task 2 Step 6, and `bun run list` shows `writing-plans` below its previous 3299 tokens. Commit `feat(writing-plans): drop per-step code where the ablation licenses it`.

### Task 7: Gates, review, merge, sync

**Tier:** `none`
**Covers:** `none: release`
**Files:** none new.

- [ ] **Step 1 — full gate.** `bun run typecheck && bun test && bun run validate && bun run build --strict && bun run doctor` → clean, 0 failures, 36/36, exit 0 with zero warnings, 36/36.
- [ ] **Step 2 — review.** `/requesting-code-review` on `main...feat/fast-track-sdd`; fix confirmed findings in one commit.
- [ ] **Step 3 — finish.** `/finishing-development-branch`. Its new Step 7 applies to this branch too. Record the merge date in the Status block: Task 8's earliest date is merge date + 14 days.
- [ ] **Step 4 — sync every install target** for the changed skills (`writing-plans`, `executing-plans`, `subagent-driven-development`, `finishing-development-branch`): the Claude config dirs and Codex/Gemini per README; claude.ai per `docs/procedures/claude-web-skill-sync.md`, one skill per upload, which needs a visible Chrome tab. Report what was uploaded. If the browser is unavailable, name the skills still pending.

### Task 8: Re-measure → keep or revert

**Tier:** `none`
**Covers:** `none: the verdict on Goal`
**Files:**
- Modify: `docs/ablations/2026-09-process-output-baseline.md` (append the after-picture)

Earliest date: merge date + 14. If Task 6 was dropped, run it anyway for Tasks 2–4 and report without a verdict.

- [ ] **Step 1 —** `bun scripts/session-metrics.ts $S/after.jsonl $D --since=<merge date>`
- [ ] **Step 2 — keep rule, declared now.** Among dev sessions that invoked `writing-plans`: n ≥ 8, otherwise report "insufficient" and re-run 14 days later. Median `doc_chars` falls ≥ 30% against the baseline. Median `output_tokens` falls ≥ 20%. Unverified done-claims per done-claim and `invented_ref` per session rise by no more than 10% relative. Agent minutes are reported but do not gate the verdict, because they are confounded by task size.
- [ ] **Step 3 — verdict.** Pass: append the after-picture and set Task 8 `done`. Fail: append it, then propose `git revert <Task 6 SHA>` to the owner. The demoted text in `references/` makes the restore one edit.
- [ ] **Step 4 — commit** — `docs(ablations): process-output after-picture`
