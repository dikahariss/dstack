# Decision — model-aligned skill catalog plan, 2026-09-04

Panel review of `docs/plans/2026-09-04-model-aligned-skill-catalog.md` (v1)
under `/multi-persona-review`, general artifact mode. The v2 that resulted
now stands in that file. v1 was never committed; it survives only in the
session scratchpad, and its content is summarised by the register below.

**Owner:** Haris.
**Seats:** Dreamer (Green), Realist (White), Critic (assigned devil's
advocate, Black), model-guidance fidelity specialist, dstack governance
specialist — five fresh-context agents, dispatched blind and in parallel.
**Self-review warning:** the plan was written by the same model family that
seated the panel, and the arbiter is the plan's author. Every decisive claim
was checked against the repository or the Anthropic pages, never against
another seat. **Zero-blocking warning does not apply:** the panel raised one
blocking finding and a ranked kill-case.

What this review does not do, stated because the evidence is one-sided: role
personas do not improve factual accuracy; this panel bought coverage, and
accuracy came from the verification pass. No user research exists; the
owner's stated model usage is stakeholder evidence. Unanimity among five
seats sharing one base model is not confirmation — see the dissent register.

## Iteration 1 — what the seats found

| seat | findings | unique to it | strongest objection |
|---|---|---|---|
| Dreamer | 15 | ≈10 (67%) | the plan polishes method prose across 36 skills before asking which skills should exist, and defers the delete-and-observe step to last |
| Realist | 25 | ≈18 (72%) | ≈100 claude.ai uploads under the four-tier release model while the header says "paid once"; the only code task written against helpers that do not exist |
| Critic | 12 | ≈6 (50%) | rails are deleted before the ablation ADR-0030 requires, and the plan lets the ablation be skipped |
| Fidelity | 24 | ≈20 (83%) | Task 9's "WHEN, not WHAT" rule is stricter than the Anthropic authoring guide the repo bundles, and strips quoted user phrases from the most-invoked skill |
| Governance | 25 | ≈17 (68%) | the version and changelog policy is stated once, wrongly, and applied four ways; `doctor` cannot see the omission |

No perspective fell under the 10–20% uniqueness line; the Critic's lower
share is expected (its kill-case is meant to converge on the decisive risks
others touch).

## Verification pass — decisive claims

Checked 23 · verified 19 · partially verified 1 · refuted 2 · not decisive 1.

| claim | raised by | status | what the source says |
|---|---|---|---|
| The audit's changelog quote "stopped routing every behavior change…" was invented | Critic | **REFUTED** | `using-dstack/SKILL.md:249` carries it |
| The vbd ablation record supports "an excuse table anchors the model toward the excuses" | plan v1 (author) | **REFUTED as cited** | the record says "no rail proved load-bearing"; the anchoring hypothesis is the claude-api prompt-audit reference's |
| `using-dstack/eval/cases.jsonl` has 5 cases, not ten | Critic | verified | `wc -l` → 5 |
| Codex and Gemini CLI installs are live and used | Critic | verified | symlinks in `~/.codex/skills`, `~/.gemini/skills`; 4 `using-dstack` invocations in Codex history |
| `multi-persona-review` step 5 is orchestrator work, not a verifier subagent | Critic | partially | the body never dispatches; `reviewer-prompt.md §3` carries a dispatch prompt — an ambiguity, not a conflict |
| Claude Code's system prompt carries an evidence-before-claim rule | plan A2 | verified, narrower | "Report outcomes faithfully…" is outcome honesty; it does not say "run the proving command in this turn" |
| `bun run doctor` is version-only | Realist | verified | `doctor.ts:114` |
| Task 2's code steps reference non-existent helpers and paths | Realist | verified | `RenderResult.ts:20`, `warnings.test.ts` shape, nested fixtures, no fence helper |
| `learning-from-sessions:90` carries an unedited `## Changes` mention | Realist | verified | Task 12's grep gate would have failed |
| Replaying the openness detector on stripped bodies surfaces 0 warnings | Realist | verified (replication) | A6 becomes checked |
| Per-tier claude.ai sync ≈ 100 uploads | Realist | verified (arithmetic) | header claim reversed |
| Three v1 descriptions exceed the 80-word rule v1 writes | Realist | verified | 137 / 95 / 90 words |
| The bundled Anthropic guide says a description includes what AND when | Fidelity | verified | `anthropic-best-practices.md:150,187,197,1108` |
| `responding-to-review` "81" is the open-list marker; the duplicate is 76 | Fidelity | verified | `sed -n '74,82p'` |
| Deleting the implementer self-review leaves a dangling report field | Fidelity | verified | `implementer-prompt.md:147` |
| The debugging replacement swallows the memory/perf baseline block | Fidelity | verified | lines 196–201 inside 125–229 |
| SDD's replacement "one line per task" is a progress cap | Fidelity | verified | vs A7 and the Fable 5.1 page |
| The transcript store is a rolling 30-day window and today's census differs from August's | Realist (it2) | verified | `cleanupPeriodDays` unset; oldest file 2026-08-04; vbd 7→1, SDD 4→2, wireframing 4→1, worktrees 6→2 |
| skill-spec bump rule; ADR status values; `docs/README.md` ADR list; v3 M45 | Governance | verified | `skill-spec.md:248-251`; `adr/README.md:41-47`; `docs/README.md:51-75`; `ROADMAP.md:480-495` |

Refuted claims withdrew what rested on them: the Critic's #11 (nothing else
rested on it); the plan's rule-5 citation (re-cited to the prompt-audit
reference; the rule's content unchanged).

## Risk register — status after iteration 2

| item | mitigation in v2 | status (Critic) |
|---|---|---|
| B1 versioning policy | header rule; Task 1 script patch-bumps all 36 with an entry; every edit names minor/patch; Task 1 before Task 2 | CLOSED |
| M1 rails before ablation | Task 4 gate before Tasks 5–6 (vbd railed = `5b23b94` body; executing-plans oracle = the executor's own claim); ADR-0031 §5; the gate licenses only the inline-pointer shape; red-flag lists, SDD self-review/final pass and the review cadence stay until Task 12 rows 2 and 4 | CLOSED after the Critic's repair (was STILL OPEN / MADE WORSE in the first v2 draft) |
| M2 rule-7 hub | inline data form in every caller + pointer for the method; exception rests on independence at a named checkpoint | CLOSED |
| M3 A2 unsnapshotted | quoted, dated, narrowed in ADR-0031 Context; one-plain-statement rule | CLOSED |
| M4 non-Claude hosts | host scope in ADR-0031 D1; A10; one-plain-statement rule | CLOSED |
| M5 router instrument | ten cases (two negatives); saved census; ≥14-day re-run, ≥15-call floor | CLOSED |
| M6 row 2 phantom | dissolved; multi-persona step 5 made in-loop by text; running-uat judge exempt | CLOSED |
| M7 ablation cost | 54 sessions incl. the gate, 6.5M cap, owner-approval line, documentary row, frozen list | CLOSED (numbers reconciled) |
| M8 ADR defects | Supersedes enumerated; status + note; three indexes + M45; §4 provisional; citation; YAGNI re-derived; rule home decided | CLOSED |
| M9 Task 2 code | real shapes; local `stripFences`; spec rows; A6 checked; Step 5 unconditional; three commits | CLOSED |
| M10 Task 12 gate/sync | both learning-from-sessions lines; local dirs per tier; claude.ai after P2 and P3 (36 + ≤9); synced SHA; doctor's limit | CLOSED |
| M11 Task 9 | what + when + triggers; 80/120 tiers; quoted phrases and Indonesian triggers kept; `list --json` | CLOSED |
| M12 replacement texts | every listed item corrected | CLOSED |
| M13 placeholders / anchors | written or dropped; footer, checkpoints, cwd | CLOSED |
| M14 ambition / instrumentation | Task 0 (census, Sonnet 5 set, size question recorded with a trigger, retention fix) | CLOSED for its content |

Residual risks the Critic named after the mitigations, and what v2 does
with each:

1. *The gate was designed so that it passes.* Repaired in v2: railed arm =
   `5b23b94`; oracle = the executor's own claim; decision table restricted to
   the measured shape. This was the Critic's condition for approval.
2. *Demotion changes recovery cost, not runtime behaviour.* Accepted as
   true; v2's Task 12 row 2 names both arms (body with lists vs body with a
   pointer) so the comparison is honest.
3. *The 30-day window is a ratchet.* v2 Task 0 Step 5: raise
   `cleanupPeriodDays` to 90 and archive invocation lines monthly outside
   the repo.
4. *Rule 7 exempted `requesting-code-review` by a wrong description.* v2
   rests the exemption on independence at a named checkpoint and points at
   row 4.
5. *Three session counts.* Reconciled: 12 + 42 = 54, cap 6.5M.
6. *Bookkeeping:* same-commit bump breaches, the stale `using-dstack`
   number, "15% of every body", the ≥5-call trigger — all fixed.

**Iteration 3 did not fire.** The Critic's answer to "new class of blocking
risk" was NO: nothing legal, no safety exposure, no unobtainable dependency;
cost is under the stated cap and pending the owner's setting of it.

## Verdicts on genuine contradictions (Blue)

| open question | verdict | basis |
|---|---|---|
| Bump per commit (Realist, spec) vs bump at release from `git diff` (Dreamer) | accept Realist | `skill-spec.md:248-251` is the contract; per-commit bumps are auditable by `git log` |
| Demote rails now and run ablations before the first release (Dreamer) vs a gate before any removal, and contested lists stay until their row (Realist, Critic, Governance) | accept the gate; accept demotion as the *form* once licensed | ADR-0030 §5 charges a run for a move toward freedom; the procedure's honesty guard forbids a pre-stripped railed arm; demotion keeps restoration to one edit |
| One home for cross-cutting rules in `using-dstack` (Dreamer) vs one sentence per skill (Realist) | accept Realist | `using-dstack` is invoked in ~18–23 sessions per window, not always-on; Codex/Gemini never see CLAUDE.md; rules 5–6 are per-skill numbers anyway |
| Fold Task 3 into Task 8 and drop the recall gate (Dreamer) vs keep Task 3 with an instrument (Realist) | accept Realist | A3 is the load-bearing unchecked assumption; the instrument costs ~100 minutes |
| `running-uat` judge: no ablation owed (Dreamer) vs run it across three apps (Realist) | accept Dreamer | the judge verifies the application; rule 7's exception names it |
| Drop the `history-in-body` warning (Dreamer) vs keep it (Realist, Governance) | accept Realist | ADR-0030 precedent; `build --strict` is the single gate; ~15 lines |
| One web sync after P2 (Dreamer) vs after P2 and P3 (Realist) | accept Realist | 36 + ≤9 = 45, stated |
| Cut long descriptions to ≤80 (Dreamer) vs an 80/120 tier (Realist) | accept Realist | quoted phrases and database names are the discovery path |
| pdf-to-rag concurrency cap: UNMITIGATED (Realist) vs "at the Workflow's own limit, which the run log names" (Dreamer) | accept Dreamer's phrasing | no measured number exists; naming the mechanism without inventing one satisfies rule 6 |
| Move the SDD example to `references/` (Dreamer) vs drop the placeholder bullets (Realist) | split | example → `references/example-workflow.md`; worktrees collapse and modelling notation rules → not done |
| Task 0 with a census script and classification (Dreamer) vs save the census and record the size question (Realist) | accept Realist's scope with the Dreamer's Sonnet-set derivation | one documented command is the instrument; merges are a separate plan |
| Indonesian triggers: drop (v1) vs keep (three seats) | keep | the "models translate intent" rationale is unsourced; the owner prompts in Indonesian |
| Descriptions: "WHEN, not WHAT" (v1) vs "what + when + triggers, never the workflow" (three seats) | accept the panel | `anthropic-best-practices.md:187,197` |

Deferred with a trigger: the catalog-size question — "a skill at 0
invocations across two consecutive 30-day windows is a merge or retire
candidate" — recorded in Task 0, decided by the owner, not this plan.

## Assumptions we are proceeding on

| assumption | owner | check by |
|---|---|---|
| A3 router recall holds after the booster cut | Haris | ≥14 days after the P0 release (Task 3 Step 4) |
| A4 the free-version result reproduces on Opus 5 | Haris | Task 4, before Tasks 5–6 |
| A7 no length line reaches Fable 5.1 progress text | Haris | first Fable 5.1 session after P1: quote its between-tool-call output |
| A10 Codex/Gemini usage is rare enough that one plain statement per rule suffices | Haris | next census with the Codex count |
| A12 ≈118k tokens per ablation session | Haris | after Task 4's first record |

## Work assignment

| what | who | by when | who verifies |
|---|---|---|---|
| Task 0 census, Sonnet 5 set, size question, retention fix | Haris | before any P0 commit | `docs/ablations/2026-09-invocation-census.md` exists with window dates |
| Task 1 relocation + warning + five markers (3 commits) | Haris | P0 | `bun run build --strict` exit 0; `bun run list` lower on all 36; `grep -c '^## Changes' skills/*/SKILL.md` = 0; `/requesting-code-review` after |
| Task 2 ADR-0031 + governance edits + writing-skills 0.8.0 | Haris | P0 | the Step 7 greps |
| Task 3 router + ten cases + before/after | Haris | P0 | Status row lists per-case fires before and after |
| Task 4 ablation gate (12 sessions) | Haris | before P1 | two records with both columns filled and the decision table applied |
| Tasks 5–8 | Haris | P1 | `build --strict` exit 0; every touched skill bumped; `/requesting-code-review` after Task 6 |
| Tasks 9–11 | Haris | P2 | `bun run list --json` word counts; JSONL parse check |
| Task 12 rows in order, within 6.5M / 54 sessions | Haris | P3, month by month | one record per row with the owner-approval line |
| Task 13 per tier; claude.ai after P2 and after P3 | Haris | end of each tier | the per-target report; synced SHA in the sync commit |

## Commitment

| seat | committed | dissent preserved below? |
|---|---|---|
| Dreamer | yes | yes |
| Realist | yes | yes |
| Critic | yes, conditional on the Task 4 repair (applied) | yes |
| Fidelity | yes | yes (splinter fixed) |
| Governance | yes | yes |

Commitment is to the action, not agreement that every objection was wrong.

## Dissent register — verbatim

- **Dreamer (Red):** "Relieved and a little suspicious: v2 took almost every mitigation, so my analysis says go — but my gut notices the one question I cared about most (is the catalog too big) got the politest possible 'recorded, not decided', and I would still proceed." *Reopens when:* the second consecutive census shows the same skills at zero.
- **Realist (Red):** "Go, tonight, from Task 0 — and I notice I trust v2 slightly less for having agreed with every one of us, which is the mismatch I am reporting." *Reopens when:* any Task 12 record shows a rail load-bearing that a v2 edit already removed.
- **Critic (Red):** "Approve v2 conditional on the two-line Task 4 repair (railed = `5b23b94`, oracle = the executor's own claim) and the red-flag/cadence removals moved back behind their rows; without that, the gate is a formality and I am where I was on v1." *Applied.* *Reopens when:* Task 4's records show an empty column one with the `5b23b94` arm — that is the result the Critic predicts the gate will not produce honestly if the owner waves it through.
- **Fidelity (Red):** "Go — v2 reads like the pages now, and the one thing that still nags me (Task 11's `requesting-code-review` eval case re-plants the 'handful of tool calls' floor Task 6 just removed) is a splinter, not a reason to wait." *Fixed in v2.*
- **Governance (Red):** "Go — v2 reads like a plan that was held to the rules; my only unease is that Task 4's twelve sessions now gate everything and a tired owner will be tempted to wave them through." *Reopens when:* a Task 4 record is written without both columns filled.

Two seats reported the same mismatch — trusting v2 less for having agreed
with all of them. That is the correlated-agreement warning this method
carries by design, and it is why the Task 4 gate, not the panel's consensus,
is what licenses the behaviour edits.

## Escalated

Nothing. The owner's open decisions are inside the plan as owner steps: set
the Task 12 budget before row 1; approve each band move in its record;
decide the catalog-size question when its trigger fires.

## Diagnostics

Claims: checked 23 · refuted 2 · partially verified 1 · not decisive 1.
Blocking objections raised: 1 (Governance, versioning) plus the Critic's
ranked kill-case of 12; the Critic's #1 survived to iteration 2 and was
closed by repair, not by argument.
Findings tagged [INFERRED]: 9; none carried blocking severity.
Iterations: 2 of a maximum 3; iteration 3 not triggered.
