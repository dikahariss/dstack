# Ablation — `writing-plans`, railed vs free, on Opus 5.5 with a Sonnet 5 spot-check

Task 5 of `docs/plans/2026-09-28-fast-track-and-sdd-recalibration.md`. The question was whether the per-step code rail ("every step carries the actual content") and the rest of the railed body can go, as ADR-0030 §6 requires before a rail is removed.

**Status: RUN — 2026-09-28.** 8 plan-phase runs and 7 execution-phase runs through `claude -p`, each in an isolated replay copy.

**Result: drop.** K1 fails on the conservative reading, and K2 and K3 fail outright. No rail is removed, and `writing-plans` stays at 0.12.1. Column one is filled in 3 of 3 tasks, so the railed body is load-bearing on this evidence.

## Stage 1 — model and tasks

The models under test were `claude-opus-5-5` and `claude-sonnet-5` (T1 only; `writing-plans` is on the Sonnet 5 spot-check list), both at the default effort of `claude -p`. The three tasks are real `writing-plans` invocations from the owner's transcripts, chosen because their input documents are in git. They are labelled by repo kind (privacy rule 1).

| # | Repo kind | Input the original plan was written from | Original plan |
|---|---|---|---|
| T1 | Bun/Elysia API + Nuxt 4 web, in one workspace | spec v1.1 (DRAFT) + discovery v1.1, plus the owner's five decisions | 321k chars, 16 tasks |
| T2 | Greenfield PoC (Angular 22 web, .NET API, Python spike) | a priority order of 13 items plus model docs; the plan must falsify hypotheses | 64k chars, 13 tasks |
| T3 | Tauri app (Rust backend, Svelte 5 frontend) | a priority order of 7 slash-command items | 71k chars, 9 tasks |

Replay method:
- **Checkout.** Each run got `git archive` of the commit that added the input documents, with the original plan deleted. T1's two nested repos were added at their last commit before the spec. T3 is the parent commit plus the two input documents. Each copy became a fresh repo with no history, so the original plan could not be recovered.
- **Planning call.** `claude -p --disable-slash-commands --permission-mode bypassPermissions`. Installed skills were off. The arm body went in through `--append-system-prompt`.
- **Execution call.** A fresh `claude -p` with no skill body, told to execute Tasks 1–2, write the Status back, not ask questions, and not start servers, containers, or live databases.
- **Limits.** Container, database-client, push, kill, and sudo commands were denied. Each run was capped at 45 minutes.

## Stage 2 — the two versions

- **Railed:** the `writing-plans` 0.12.0 body without frontmatter, 2,099 words. This is `2026-09-writing-plans/arm-railed.md`.
- **Free:** goal, inputs, guardrails, exit criteria ("A finished plan"), and hand-off, 614 words. This is `2026-09-writing-plans/arm-free.md`. It keeps the header fields, the tier per task, the Status and Assumptions blocks, and the no-placeholder rule. It drops the step template with test and implementation code and the rule that every step carries its code.

## Stage 3 — measurements

Plan chars are the plan file at the end of the plan phase. Minutes are wall-clock from the runner. Output tokens and cost are as reported by `claude -p`.

| Run | Plan chars | Plan min | Plan out tok | Exec min | Exec turns | Exec out tok | Tasks 1–2 verified by rerun |
|---|---|---|---|---|---|---|---|
| T1 railed Opus | 269,215 (unfinished) | 45.0 (cap) | 294k (transcript) | 21.8 | 42 | 21k | PASS — web 225 tests, typecheck 0 |
| T1 free Opus | 107,517 | 24.1 | 125k | 31.2 | 123 | 88k | PASS — web 216, typecheck 0, API 237 pass |
| T2 railed Opus | 184,576 | 40.3 | 266k | 24.5 | 70 | 48k | PASS — web `ng test` (Node 24.20), spike pytest 9, docs-check 0 |
| T2 free Opus | none | 45.0 (cap) | 226k (transcript) | — | — | — | FAIL — no plan |
| T3 railed Opus | 139,772 | 24.7 | 173k | 30.2 | 65 | 33k | PASS — unit 123, svelte-check 0, cargo test 115 |
| T3 free Opus | 98,894 | 23.0 | 154k | 36.4 | 70 | 46k | PASS — unit 115, svelte-check 0, cargo test 116 |
| T1 railed Sonnet | 106,711 | 17.3 | 79k | 20.4 | 89 | 70k | PASS — web 212, typecheck 0 |
| T1 free Sonnet | 70,583 | 12.6 | 76k | 19.9 | 87 | 40k | PASS — web 213, typecheck 0, API 234 pass |

In every executed run, Tasks 1–2 stopped short of their browser or UAT step. The execution prompt forbade dev servers, and that applied equally to both arms. "Verified" means the rerun of the suites and checks each plan's Tasks 1–2 name, in the subprojects its commits touched.

## Both columns

| Task | Railed run got that free missed | Free run reached that railed never did |
|---|---|---|
| T1 | Execution was faster and cheaper: 21.8 min, 42 turns, 21k output tokens, against 31.2 min, 123 turns, 88k. The executor copied code the plan already held instead of writing it. | The plan finished in 24 min at 108k chars. The railed plan was still being written at the 45-min cap, at 269k chars. Plan plus execution was 55 min for free and at least 67 min for railed. |
| T2 | The railed run stayed on planning. It produced a 185k-char plan in 40 min that recorded at least two source-verified corrections to the research documents. The free run spent 45 min and 226k output tokens running the PAD spike itself (92 Bash calls, a `spike_pad.py`) and never wrote a plan. | Nothing: the free run produced no plan. |
| T3 | Execution was faster: 30.2 min against 36.4, with 33k output tokens against 46k. Plan plus execution was 54.9 min for railed and 59.4 min for free. | The plan was 29% smaller (99k vs 140k chars) and finished 1.7 min sooner. |

Rails that appear in column one in at least 2 of 3 tasks, and so are restored under ADR-0030 §6:
- **Per-step code.** It makes execution faster in T1, and in T3 (30.2 vs 36.4 min).
- **The step template together with "have not touched code yet".** In T2 it kept planning from turning into implementing.

Either one alone keeps the railed body.

## Keep rule, declared before the runs

| | Rule | Measured | Result |
|---|---|---|---|
| K1 | Free plan chars, median over T1–T3 on Opus, ≤ 60% of railed | T1 ≤ 0.40 (railed unfinished), T3 0.71, T2 no free plan. With the missing plan counted as a failure, the median is 0.71. | **FAIL** (it holds at 0.55 only if T2 is dropped, which the rule does not allow) |
| K2 | Free Tasks 1–2 PASS in at least as many tasks as railed, on Opus and on Sonnet T1 | Opus: railed 3 of 3, free 2 of 3 (T2 has no plan). Sonnet T1: 1 = 1. | **FAIL** on Opus |
| K3 | Free plan + execution minutes lower than railed in ≥ 2 of 3 Opus tasks | T1 free lower (55 vs ≥ 67). T2 free never finished. T3 railed lower (54.9 vs 59.4). | **FAIL** |

## Decision

Drop. Task 6 does not run, and `writing-plans` keeps its rails at 0.12.1. G1 was pre-authorized only for the case where K1–K3 all hold, so no owner question arises.

## What the runs say beyond the keep rule

- **The code rail is not where most of the plan size comes from.** Even the free arm wrote plans of 71k–108k chars, 18k–27k tokens, for a first slice. The original sessions' plans for these tasks ran 64k–321k chars. Where both arms finished, dropping the code rail took off 29–41%, and it cost execution time in T1. The larger lever is how much a single plan covers: T1's railed plan held 19 tasks and was still growing at 45 min. That is a question of scope per plan, not of per-step detail, and it is the next candidate. It needs its own ablation.
- **Code in the plan is not written twice in wall-clock terms.** The executor copies it, so railed execution ran faster in T1 (21.8 vs 31.2 min). The saving at plan time and the cost at execution time come out close; they are not a pure loss on one side.
- **Without its rails the free body drifts on an exploratory task.** On T2 it did the spike instead of planning it. The railed body's framing ("You have a spec … and have not touched code yet", the step template) is what holds the planning role.

## Budget

The plan's cap was US$60, summed from `total_cost_usd`. The reported sum is US$64.45 across 13 runs. That excludes the two runs killed at the cap (T1 railed plan, T2 free plan), which returned no cost; their transcripts show 294k and 226k output tokens. **The cap was exceeded.** Costs were not tracked while the runs were live, so the overrun was noticed only after the fact. The last run, T3 free execution, was kept to completion on the owner's "lanjutkan sampai selesai" (2026-09-28). A future run of this kind sums cost after each phase and stops at the cap.
