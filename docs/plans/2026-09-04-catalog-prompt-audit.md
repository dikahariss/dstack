# Catalog prompt audit — Opus 5 daily, Sonnet 5 light, Fable 5.1 occasional

> Date: 2026-09-04. Scope: all 36 skills under `skills/`, their frontmatter
> descriptions, and every bundled file that is itself prompt text (subagent
> and reviewer prompts). Read-only; no skill was edited. The actions live in
> [2026-09-04-model-aligned-skill-catalog.md](2026-09-04-model-aligned-skill-catalog.md).

## Why this audit exists

The catalog was last calibrated on 2026-08-14 (ADR-0030) with one premise:
**Sonnet 5 is the daily driver.** Two conflicts with Anthropic's Opus 5
guidance were found then and parked because "the Sonnet 5 guide is silent".
The owner's actual usage is now: **Opus 5 for daily work, Sonnet 5 for light
work, Fable 5.1 occasionally.** That flips the premise, so the parked
conflicts are live on the primary model, and every skill was re-read against
the three current Anthropic pages plus the general best-practices page.

## References audited against

- Prompting best practices (general, all current models) —
  platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Prompting Claude Opus 5 — response length, progress narration, written
  deliverable length, **task scope and over-verification** ("remove explicit
  verification instructions… 'use a subagent to verify'"), **controlling
  subagent spawning**, self-correction.
- Prompting Claude Sonnet 5 — effort calibration, **literal instruction
  following** ("does not silently generalize an instruction from one item to
  another"), progress updates, code-review harness recall.
- Prompting Claude Fable 5.1 — the opposite pull: it **under-narrates** and
  **under-formats**, so anti-narration and anti-formatting text hurts it.
- The `claude-api` skill's `prompt-audit` reference (dated-pattern groups,
  the keep list) for the classification of each finding.
- This repo's own doctrine: ADR-0030 shape rules, the ablation procedure,
  and the four ablation records under `docs/ablations/`.

## Method

Four parallel reviewers, nine skills each, one shared rubric (below), one
file per skill; every High finding was then checked against the source line
by the coordinating agent. Confidence: **High** = stated on an Anthropic page
or measured in this repo; **Medium** = a documented prompt-audit pattern;
**Low** = idiom or heuristic, flagged only.

Rubric IDs used in the findings:

| ID | Check | Source |
|---|---|---|
| O1 | Verification scaffolding: "double-check", "re-verify", "use a subagent to verify", mandatory re-check steps. Evidence-before-claim gates and "distrust a subagent's report" are **not** this | Opus 5 page |
| O2 | Delegation pushes without a floor or cap | Opus 5 page |
| O3 | Skills that write files carry no length calibration | Opus 5 page |
| O5 | Narration choreography ("every N tool calls", "hold findings") | Opus 5 + Sonnet 5 + Fable 5.1 pages |
| O6 | Severity floors at the finding stage of a review | Opus 5 + Sonnet 5 pages |
| S1 | Lists without an open/closed marker **near the list**; scope words missing | Sonnet 5 page, ADR-0030 |
| S2 | Depth-compensation prose ("think carefully") | Sonnet 5 page |
| G1 | Pressure register in body text (caps, no adjacent reason) | best practices, prompt-audit 1a |
| G2 | Over-trigger boosters ("if in doubt", "bias toward") | best practices |
| G3 | Feature-replaced scaffolds (numeric caps, step-by-step) | prompt-audit 1b |
| G4 | Over-specification: step choreography for judgment work, prohibition runs, padding | prompt-audit 1c |
| G5 | Fossils: history narrative, migration-relative phrasing, pinned models, stale refs | prompt-audit 1d, Group 2 |
| G6 | Restating what the model already knows | ADR-0030 rule 3 |
| G7 | Description says WHAT (a workflow) instead of WHEN; synonym bloat | writing-skills, prompt-audit Group 2 |
| G10 | Dispatch skills must send independent agents in one message | best practices |
| G11 | Autonomy and safety: confirm before irreversible; no shortcut around a check | best practices |
| D1–D6 | House rules: spine + judgment, band consistent, ≤90% budget, project-agnostic, `eval/` present, registered | writing-skills |

The keep list was applied before flagging: context is never cruft; cruft is
not length; fragile operations keep exact scripts; tool contracts stay;
prohibitions against failures that still reproduce stay; trigger text may
carry urgency; format-pinning examples stay; working redundancy stays unless
copies disagree.

## Catalog-wide findings

**X1 — The calibration premise is stale (High).** "Sonnet 5 is the daily
driver" is written in ADR-0030 (lines 11–14, 75, 111), the ablation procedure
(line 21), the 2026-08-14 plan, both ablation records, and
`writing-skills` (line 109). Both ablations that moved a band ran on Sonnet 5
only, and the procedure itself says a run on one model does not license a
change on another. So the two skills already moved (`verifying-before-done`,
`writing-specs`) are unconfirmed on the daily model, and the six ablations
recorded as owed must run on Opus 5.

**X2 — `## Changes` is loaded on every invocation (High, measured).** The
renderer emits the whole body; the rendered `using-dstack` ends with its
0.1.0 changelog. Across the catalog, 9,605 of 60,532 body words (15%) are
version history. Worst: `verifying-before-done` 39%, `auditing-video` 29%,
`requesting-code-review` 26%, `using-dstack` 24% (and it loads every
session). Nine skills sit at 88–90% of budget because of it, which is why no
Opus 5 line can be added to them today. History in the prompt body is the
"drop the archaeology" pattern on all three models, and a changelog entry
like "stopped routing every behavior change into the full cycle" reads to a
literal model as an instruction. Fix: `skills/<id>/CHANGELOG.md` — a bundled
file is copied on install, never loaded, never counted (verified:
`writing-skills` already ships a root-level bundled file). Side effect: ADR-0030
records that a marker sitting only in `## Changes` silences the
`closed-enumeration` warning; moving the section removes that false negative.

**X3 — Descriptions ride in every session (Medium).** 36 descriptions total
3,212 words, about 4.2k tokens loaded before any skill fires. Nineteen of
them narrate the workflow ("designing a boolean query, applying filters,
exporting to RIS…"), which `writing-skills` itself says becomes a shortcut
the model follows instead of the body. Longest: `writing-skills` 297 words,
`multi-persona-review` 163, `auditing-video` 141.

**X4 — Verification is stacked along the plan→execute chain (High).** The
`writing-plans` header template writes "then `/verifying-before-done` before
marking it done" into every plan; `executing-plans` calls it a "mandatory
completion gate after each task"; `test-driven-development` mandates the same
gate three times; `requesting-code-review` makes a reviewer subagent
"mandatory after each task"; `subagent-driven-development` runs an
implementer self-review, a spec reviewer, a quality reviewer, and a final
pass. The Opus 5 page names this shape for removal. What survives every
ablation is the *data* form — a Status row with a SHA and observed evidence,
"the report is a claim, read the code" — not the instruction to verify.

**X5 — Delegation pushes without floors (High).** `pdf-to-rag` says "fan out
subagents freely" in its description and body; `multi-persona-review`
authorises 10–13 dispatches per review with a one-sentence floor and never
states the cost; `requesting-code-review` and `subagent-driven-development`
dispatch per task. `reverse-engineering-video` is the model to copy: a
measured 400-frame floor and "One pass. No agents." below it.

**X6 — Fable 5.1 guard (High).** Any conciseness line added for Opus 5 must be
scoped to final deliverables and answers, never to between-tool-call progress
text, and no skill may carry anti-formatting rules. Grep found zero narration
suppressors and zero anti-formatting rules in the catalog today; the guard is
for the edits.

**X7 — Nine skills have no `eval/cases.jsonl`** although the `writing-skills`
checklist requires one: `classify-issue`, `dispatching-parallel-agents`,
`executing-plans`, `finishing-development-branch`, `managing-version`,
`requesting-code-review`, `subagent-driven-development`,
`using-git-worktrees`, `writing-skills`.

**What already matches the guidance and needs no change:** no skill sets
thinking parameters or says "think step by step"; no "every N tool calls"
scaffolds; no severity floors in reviewer seat prompts; every list passes the
openness detector; `guarding-destructive-commands` has the shape of the doc's
own safety sample; `researching-facts` fans out both engines in one message
exactly as the parallel-tool-call guidance asks and is the exemplar for cost
text and list markers.

## Verdicts

| Verdict | Count | Skills |
|---|---|---|
| **Fix — behaviour** (text that changes what Opus 5 or Sonnet 5 does) | 13 | using-dstack, test-driven-development, debugging, requesting-code-review, writing-skills, prioritizing-work, writing-plans, executing-plans, subagent-driven-development, multi-persona-review, running-uat, pdf-to-rag, generating-images |
| **Fix — governance** (body sound; band re-justification on Opus 5 owed) | 5 | verifying-before-done, discovering-requirements, designing-test-cases, diagramming-architecture, wireframing-interfaces |
| **Fix — housekeeping** (history relocation, description, length line, stale reference, eval) | 17 | guarding-destructive-commands, responding-to-review, brainstorm, writing-specs, dispatching-parallel-agents, finishing-development-branch, modelling-business-processes, modelling-system-behaviour, using-git-worktrees, learning-from-sessions, classify-issue, literature-search, literature-trends, literature-fulltext, researching-facts, auditing-video, reverse-engineering-video |
| **Keep** | 1 | managing-version |

Every skill takes the `## Changes` relocation (X2); it is not repeated below.

## Per-skill record

Each entry: what needs fixing and why, or why it does not; the load-bearing
text a naive trim would delete. Line numbers are against `main` at `799f0b0`.

### using-dstack (0.23.0) — Fix: behaviour

**Why.** This router loads in every session, so its errors are paid on every
task. Lines 27–33 tell the model to invoke a skill on "even a real-but-small
chance", to "bias toward invoking", and line 59 says "Over-invoking is cheap;
skipping a skill is not". The best-practices page names this exact shape —
"If in doubt, use [tool]" — as the instruction that now causes
over-triggering, and Opus 5 reaches for tools more readily than 4.8. The cost
claim is also false: a loaded skill costs 1.5–5k tokens for the rest of the
session. A quarter of the loaded text is version history.
**Findings.** G2 lines 27–33, 59–60 (High); G5 `## Changes` 528 words (High);
G1/G4 the "Red flags — you are rationalizing" table, six restatements of
"check first" (Medium); G4 the six-step choreography for a routing judgment
(Medium).
**Keep.** The router table with its "not exhaustive" marker, the three
cross-cutting paragraphs, the chains, instruction priority, "use the Skill
tool, never Read a skill file", match-on-intent.

### verifying-before-done (0.6.1) — Fix: governance

**Why.** This is the skill the Opus 5 page names by shape, and the repo
already tested it on Sonnet 5 and cut it in half; what survived (an
evidence-before-claim gate and "a subagent's success message is a claim, not
evidence") is the kind of text the Opus 5 page says to keep in the main
loop. So the body is the keep case. But the ablation record says the result
is Sonnet-5-specific and must be re-run at the next model change; that run
is owed now. Two smaller defects: the default gate is written for dstack's
Bun toolchain (`bun run typecheck / bun test / bun run validate --strict`)
although the skill installs into .NET, Node and Python repos, and
`validate --strict` is a no-op flag; and 39% of the loaded text is history.
**Findings.** Governance: Opus 5 re-run owed (High); D4 Bun-only gate at
65–84 and 91–96 (Medium); G5 the 2026-08-14 anecdote at 59–63 inside a rule
(Medium); G5 `## Changes` 341 words, 39% (High).
**Keep.** 27–50 (the gate, "which command actually proves this claim"),
52–59 (post-subagent rule), "screen touched → open it or `/running-uat`".

### test-driven-development (0.8.0) — Fix: behaviour

**Why.** The tier table and "freeze the case list before implementing" are
the real content and are well argued. Around them the file mandates the same
verification gate three times (the "Verification checklist before declaring
done", the "Verify green" step that points at `/verifying-before-done`, and
the cross-reference that repeats it), which on Opus 5 is the documented
over-verification shape. The red→green→refactor walkthrough and "what a good
test looks like" re-teach TDD; on Sonnet 5 our shorter version replaces the
model's fuller one. It opens and closes with shouted rule blocks and carries
two rationalization lists that the sibling ablation found did no work. At
89.6% of budget nothing can change until history moves out.
**Findings.** O1 lines 155–157, 246–277, 287–288 (High); G6 144–182
(Medium); G1/G4 35–40 and 292–298 (Medium); G4 red flags 212–236 (Medium,
ablate); G5 `## Changes` 12% (High); S1 line 70 three-item list (Low).
**Keep.** Tier table with its closed-by-design reason, named-tier rule, the
outside path with the freeze rule, the four test classes with the bias check,
comment discipline (load-bearing on Codex/Gemini/claude.ai installs), the
arXiv-cited reasons.

### debugging (0.3.0) — Fix: behaviour

**Why.** One real rule — no fix before a named cause — plus good specifics:
the triage table, 3–5 falsifiable hypotheses, one variable at a time, three
failed fixes means question the architecture. Around that it scripts twenty
numbered sub-steps across four phases that re-teach ordinary debugging; the
best-practices page says a hand-written step plan usually produces worse
reasoning than stating goal and constraints, and Sonnet 5 follows the script
literally. Two steps are thoroughness boosters ("every difference, no matter
how small… do not pre-filter"). The Quick reference table at 284–291 already
states each phase's exit criterion and could be the spine.
**Findings.** G4/G6 125–229 (High); S2 169–171 (Medium); G1 31–38 and 315–320
(Medium); G4 red flags and excuse table 246–282 (Medium, ablate); O1 224–226
(Medium); G12/D4 two long stack-specific examples 80–123 (Low).
**Keep.** Triage table, falsifiable-hypothesis rule, "instrumentation comes
out with the fix", Phase 4.5, the memory/perf baseline block, "when
investigation finds no root cause", Quick reference.

### guarding-destructive-commands (0.4.2) — Fix: housekeeping (two additions)

**Why.** This is the one skill where a fixed order is right (restate, name the
failure, ask, then run), and Anthropic's own autonomy-and-safety sample has
the same shape. Two gaps against that sample: the table has no row for
operations merely visible to others (pushing, a PR comment, a message, shared
infrastructure), and it lacks "do not use a destructive action as a shortcut
around an obstacle" (`--no-verify`, discarding unfamiliar files). Claude Code
carries both, but the same file installs into Codex, Gemini CLI and
claude.ai. Two paragraphs about dstack's hook deferral (D2) are project bias
in a portable skill.
**Findings.** G11 missing "visible to others" row (High, add); G11 missing
no-shortcut sentence (High, add); D4/G5 lines 26–27, 77–88 (Medium); G5
`## Changes` 15% (Medium).
**Keep.** The pattern table with both "not exhaustive" markers, the safe
exceptions, the three-step pause protocol with "quote verbatim, do not run
before the answer".

### responding-to-review (0.5.0) — Fix: housekeeping

**Why.** The core — check the reviewer's claim against the code before
acting, push back with evidence, reply in the thread — is the
"investigate before answering" behaviour Anthropic recommends, and the two
scripts are a real deterministic spine. What accumulated is repetition:
"verify, then test each fix" appears five times, and "no thanks, no praise"
appears as a shouted law, a banned-phrase list, a Never list and a recap.
Current guidance is one positive statement with its reason.
**Findings.** G8 banned-phrase lists 83–103, 247–251, 288–293 (Medium); G1
44–52 (Medium); O1 the five copies of test-each-fix (Medium); G7 description
summarises the workflow (Medium); G5 `## Changes` 13% (Medium).
**Keep.** Scripts, "unclear feedback → stop, ask", source-specific handling,
the YAGNI check, "when to push back", the five reply templates, the thread
reply command.

### requesting-code-review (0.3.0) — Fix: behaviour

**Why.** Line 41–43 makes a reviewer subagent "Mandatory: after each task in a
multi-task plan", the core principle is "review early, review often", and
"never skip review because it's simple". The Opus 5 page says the opposite
for this model: do not use subagents to verify your own work, do not delegate
work finishable in a handful of tool calls, keep spawn counts low. The
reviewer template still names the "Task tool" (line 8 of
`code-reviewer.md`) while the body says Agent — two copies that disagree. The
template lacks the coverage-first instruction both model pages give for
review prompts, so Sonnet 5 self-filters and recall drops. No eval.
**Findings.** O1/O2 lines 29, 39–45, 94–99 (High, ablate cadence); G5 stale
tool name (High); O6 coverage-first missing (High, add); G6/S1 the 24-question
generic checklist with no marker (Medium); G1/G8 "Critical Rules" DON'T list
(Medium); G7 description (Medium); D5 no eval; G5 `## Changes` 26%.
**Keep.** Why the reviewer gets a crafted brief, the SHA commands, the
placeholder contract, severity-ordered action, the output skeleton.

### brainstorm (0.5.2) — Fix: housekeeping

**Why.** Already the shape the guidance asks for: one positive rule
(recommend first, then one question) with its reason, a right-versus-wrong
example pair, and a blanket "every list is a starting point". Its single
emphasis has recorded provenance. The only dated line is a numeric cap on the
closing summary ("Keep it under 15 lines", line 209), which the audit
reference says to replace with qualitative length wording.
**Findings.** G3 line 209 (Medium); G5 `## Changes` 14% (Medium); D4 an ADR
number in the body (Low).
**Keep.** Everything from 27 to 207 except the cap.

### writing-skills (0.7.0) — Fix: behaviour (doctrine)

**Why.** This skill shapes every other skill, so its errors are inherited.
Line 109 states "Sonnet 5 is the daily driver" as the premise. The testing
method then mandates the shape Anthropic warns against: for every discipline
skill, "capture every excuse in a table and a red-flags list", and the bundled
testing file teaches "explicit negation" and "add 'Violating letter is
violating spirit'". The guidance is to describe the wanted behaviour with its
reason; the repo's own ablation found red-flag and excuse lists did no work.
The bundled file also says "your human partner" twice, which CLAUDE.md's
voice rule forbids. The naming rule, description rule, budget rule and the
checklist are sound. The three Opus 5 tunables (deliverable length, dispatch
floor, verification stated once) are absent from the shape rules, so new
skills keep shipping without them.
**Findings.** G5 line 109 premise (High); G4/O1 160–185, 227–228 mandated
excuse tables (High); G4 `testing-skills-with-subagents.md` 180–197, 251–254
(High); voice 148, 243 (High); G1/G5 dated 2025 narrative 375–383 (Medium);
G7 line 143–145 drives description bloat (Medium); G12 "one excellent
example" vs the doc's 3–5 varied (Medium); missing shape rules 5–7 (Medium);
G5 `## Changes` 20% plus two instructions saying "record in `## Changes`"
(High); D5 no eval.
**Keep.** Scaffold commands, naming rule, when to create, frontmatter schema,
band rules, the WHEN-not-WHAT rule and example, budget rules, anti-patterns,
the checklist, the baseline-test principle.

### discovering-requirements (0.4.2) — Fix: governance

**Why.** The substance is right: it names when to stop, gives every rule a
reason, and its output is a document a human reviews. It still sits in
`deterministic-dominant` although the narrow-bridge test marked it FAIL and
the same-shape ablation of `writing-specs` measured 2.1× tokens and 4.9× tool
calls for that band; the ablation has never run and must now run on Opus 5
(8 invocations clear the bar). Opus 5 writes longer documents and nothing in
Output calibrates length. The shouted banner at 46–49 restates rules already
explained with their reasons later.
**Findings.** D2 band (High, ablate); O3 Output 256–265 (High, add one
sentence); G1 46–49 (Medium); G5 `## Changes` 7% with a "cheap models"
rationale (Medium); G7 124-word description (Low).
**Keep.** "You may not write VERIFIED" and its BLOCKING gate, the never-block
carve-outs, "recommend, do not interrogate", the Judgment section (a budget
proportional to the build — the anti-over-verification clause Opus 5 needs),
the evidence statuses, the bad/good example.

### prioritizing-work (0.1.2) — Fix: behaviour + governance

**Why.** The evidence discipline (tiers E1–E4, "UNSCORABLE is a legal
answer", the tie band) is the best in the catalog and stays. But it is the
most rule-dense skill (10.6% imperative density) on an output a human accepts
or overrides; the narrow-bridge test marked it FAIL and it has never been
ablated. Its "Self-check — run before showing output" section (line 224) is a
mandatory self-verification pass of exactly the kind the Opus 5 page says to
remove; the thirteen alarms are valuable as our definition of a bad round,
the run-before-output framing is the scaffold. The RICE arithmetic is done in
prose, and the changelog says a scorer script was deferred because "cheap
models fail on fabricated inputs" — a reason pinned to models no longer used.
**Findings.** D2 band (High, ablate); O1 line 224 (High); O3 Output 270–276
(High, add); G1 37–40 (Medium); G4/G5 repetition at 288 (Medium); G3/G5 inline
arithmetic + deferral rationale (Medium, owner decision on a scorer script);
G5 `## Changes` 6% (Medium); S1 Stage 1 values unmarked (Low).
**Keep.** R2–R6 and the E-tier table, "never medium", the tie band, Stage 5's
forbidden cure, Stage 6 order (riskiest assumption first — the one place order
is load-bearing), the Refusals table, the Judgment section.

### writing-specs (0.7.1) — Fix: housekeeping

**Why.** The catalog's reference for document-shaped skills; already measured
on Sonnet 5, demoted to `workflow` with the gates kept, and reads as exit
criteria with reasons. Two Opus 5 gaps: no length calibration in Output, and
the shouted banner at 39–42 whose reasons already follow.
**Findings.** O3 243–252 (High, add one sentence); G1 39–42 (Medium); G5
`## Changes` 8% (Medium).
**Keep.** The two-audiences rule (itself a length control), Stage 1's
evidence rule, gate semantics, the reversibility column, the bad/good
decision example.

### designing-test-cases (0.5.1) — Fix: governance only

**Why.** The body is close to clean on both models: every list declares
itself, the four classes are normative with the reason, "where to stop" and
the pairwise rule already bound the set size (so no length line is needed),
and the example shows four varied cases. What is owed is governance: the
narrow-bridge test marked the band CONTESTED ("the enumeration is the
deliverable, but the order of enumeration is free") and no ablation has run;
13 invocations clear the bar.
**Findings.** D2 band (High, ablate); G1 37–40 banner (Medium); G5
`## Changes` 11% of forensic statistics (Medium).
**Keep.** The reading rule, the freeze-before-implementation reason,
falsification target, "one case, one verdict", "criteria with ≥1 case, never
coverage", the four-case example.

### writing-plans (0.9.2) — Fix: behaviour

**Why.** The plan format is strong and stays: visible slice first, Status
block, assumptions with fallbacks, no placeholders. The problems are the two
places the skill adds scaffolding. The header template (141–145) writes "then
`/verifying-before-done` before marking it done" into every plan it
produces, so every downstream executor is told to run a separate verification
step per task — the legacy harness scaffolding the Opus 5 page says to
remove. The self-review's "The Critic must return something. A pass that
finds nothing has not been run" (287–289) is a forced finding: on Opus 5 it
compounds with the model's own checking; on Sonnet 5, literal, it manufactures
one. Opus 5 writes longer files and this skill deliberately pushes length up
("repeat the code"), so it needs a sentence saying what may not grow. At
exactly 90% of budget nothing fits until the 539-word history moves out.
**Findings.** O1 141–145 (High); O1/S1 272–295 (High); O3 no length line
(High, add); O2/O1 line 302 "dispatch a fresh subagent per task and review
between tasks" (Medium); G5 `## Changes` 20%, the largest in the catalog
(Medium).
**Keep.** The visible-slice rule and gate, Status-block rules ("only `done`
carries evidence"), Assumptions and risks, the task template, the
no-placeholders list, `references/plan-review-pass.md` as the optional
method. The Disney sequence here is deliberate and is not swapped for the
parallel form in `multi-persona-review`.

### executing-plans (0.4.0) — Fix: behaviour

**Why.** "Trust the block. Do not re-derive its contents from the codebase"
is exactly the anti-over-verification rule Opus 5 wants and is the best thing
here. Around it: `/verifying-before-done` is named as a "Mandatory completion
gate after each task and at the end" (47–48, 148); "STOP executing
immediately when… test fails" (116–125) halts the executor on the one thing
it should fix and contradicts the harness's autonomy default; "Ask for
clarification rather than guessing" is broader than "check in only when
readings differ materially"; same-session execution is routed to a
subagent-per-task skill with no direct option. No eval.
**Findings.** O1 47–48, 148 (High); G1 + harness contradiction 116–125
(High); G4 137, 139 "Remember" (Medium); G1 111 "REQUIRED SUB-SKILL"
(Medium); O2 41–42 (Medium); G5 `## Changes` 20% (Medium); D5 no eval.
**Keep.** Step 1 in full, write-back in the same commit as the code,
deviations appended never rewritten, never start on main without consent.

### subagent-driven-development (0.6.0) — Fix: behaviour

**Why.** The skill most directly at odds with the Opus 5 page, which says to
remove "use a subagent to verify" instructions. Per task it runs an
implementer self-review ("Review your work with fresh eyes"), a spec-review
subagent, a code-quality subagent — each in a loop with no cap — then a final
whole-implementation reviewer, plus a `/verifying-before-done` invocation
inside the implementer prompt: up to five verification layers. The repo's
subagent-trio record already named this ablation as owed. Its description
summarises the workflow ("dispatch a fresh subagent per task, then run a
two-stage review"), which loads in every session and puts a
delegate-and-review instruction in front of Opus 5 even when the skill never
fires. The spec-reviewer prompt tells the reviewer the implementer "finished
suspiciously quickly" as a fixed premise, anchoring a literal model toward
fault. Model tiers are unnamed ("cheap / standard / most capable"). No eval.
**Findings.** O1 lines 24, 28, 66–80; `implementer-prompt.md` 114–139 (High,
ablate); G7 description 3–8 (High); O2 251–253 "don't try to fix manually"
(High); G1/G4 `spec-reviewer-prompt.md` 21–35 (Medium); harness contradiction
`implementer-prompt.md` 27, 48–49, 102–107 (Medium); G5 unnamed model tiers
83–96 (Medium); G12 75-line fake dialogue 134–208 (Medium); G4 twelve-item
Never list 226–238 (Medium); O5 line 30 update suppressor (Medium); G5
`## Changes` 15%; D5 no eval.
**Keep.** Fresh context per task with the reason; sequential execution
("parallel implementers collide"); orchestrator-owned status write-back; the
four statuses; the comment table in the implementer prompt (a fresh subagent
does not receive the router's rule); "verify by reading code, not by trusting
the report"; the existing floor "one small change — do it yourself".

### dispatching-parallel-agents (0.2.2) — Fix: housekeeping

**Why.** Zero recorded invocations, so no measured harm, and the body already
has the two things Opus 5 needs: a floor ("single failure → investigate
directly first, no dispatch") and "multiple in one message". The description
says "2+ independent tasks" while the body says "3+ test files failing", so
the routing text invites delegation one step earlier than the skill allows;
there is no spawn ceiling; the same three files are walked three times. No
eval.
**Findings.** G5/O2 description vs body threshold (Medium); O2 no ceiling
(Medium); G4 duplicated example and verification blocks (Medium); G5
`## Changes` 8%; D5 no eval.
**Keep.** The decision table and its floor row, the example prompt's
constraints, the integrate-time `git diff --stat` gate.

### finishing-development-branch (0.4.0) — Fix: housekeeping

**Why.** A narrow bridge — merge, discard, worktree removal — and the
narrow-bridge test passed it, so its exact scripts and step order stay. The
two test runs are gates against merging broken code, not Opus-style
re-verification. What needs fixing is repetition (the Always list at 286–293
restates Steps 1–6 word for word; Common mistakes and the Never list carry the
same rules) and a description that narrates the workflow. No eval.
**Findings.** G7 description (Medium); G4 Always list (Medium); G5
`## Changes` 14% with "no longer qualifies" phrasing (Medium); D5 no eval.
**Keep.** Steps 2–6 in full (`pwd -P` detection, `cd "$MAIN_ROOT"`, the
merge→remove worktree→delete branch order, the typed `discard`
confirmation), the diff-read gate, the `/running-uat` requirement.

### diagramming-architecture (0.4.2) — Fix: governance

**Why.** The body is sound: probe before render, a mechanical legibility
check, a manifest of observed results, "no file claimed that is not on
disk". The action is governance: still `deterministic-dominant` after a
narrow-bridge FAIL, with exactly 3 invocations (the minimum) for an Opus 5
run. The "When to use" routing table (50–57) has no open marker, so a literal
reader treats it as the full list — the detector is silenced by a marker
elsewhere in the body. 23% of the loaded body is history, and one rule is
justified by a past-tense anecdote ("The first real run… seven findings",
128–129).
**Findings.** D2 band (High, ablate); S1 50–57 (High); G5 `## Changes` 23%
(Medium); G7 the "Produces…" sentence in the description (Medium); G5
128–129 (Medium); G1 caps banner (Low).
**Keep.** The probe and "any failure resolves to `no-render`", the measured
tool facts (draw.io converts sequence/state/ER; `.bpmn` fails on that path;
byte-identity impossible), the geometry checker gate, the Judgment section.

### modelling-business-processes (0.2.2) — Fix: housekeeping

**Why.** Frozen: zero recorded invocations, so under ADR-0030 its band can
move in neither direction until it has been used three times. The body's
BPMN vocabulary is externally fixed, which is a legitimate closed set. Small
items: the Stage 0 input table has no marker, the description lists what the
skill "covers", and 13% of the body is history.
**Findings.** S1 input table (Medium); G7 description (Medium); G5
`## Changes` (Medium); D2 frozen — re-test at first three real uses on Opus 5.
**Keep.** Pool and lane discipline, the lint gate, the measured
`bpmn-auto-layout` quirk (drops every lane), the `.bpmn`-is-mandatory rule.

### modelling-system-behaviour (0.2.2) — Fix: housekeeping

**Why.** Same frozen status as its sibling. Three body rules re-teach UML
notation the references already carry and the model already knows (ADR-0030
rule 3). Description says what it covers; 13% history.
**Findings.** G6 three notation rules (Medium); S1 input table (Medium); G7
description (Medium); G5 `## Changes` (Medium); D2 frozen.
**Keep.** The include/extend traps, the actor cross-check against the agreed
actor table, the PlantUML exit-0-on-broken-file quirk, the `.puml` contract.

### wireframing-interfaces (0.3.2) — Fix: governance

**Why.** The discipline is good: draw every state the spec names or record why
not, rough on purpose, mechanical legibility check, never claim a file not on
disk. Still `deterministic-dominant` after a narrow-bridge FAIL; 4
invocations allow the Opus 5 run. One rule is justified by an anecdote
(135–137), the description narrates the workflow, 19% history.
**Findings.** D2 band (High, ablate); G5 135–137 (Medium); G7 the "Draws…"
sentence (Medium); G5 `## Changes` 19% (Medium); G1 caps banner (Low).
**Keep.** Stage 0's declared input contract, "a state the spec does not name
is skipped and recorded, never silently absent", the fidelity cap with its
reason, "an absence scan passes against an artifact that draws nothing",
"fix the spec and regenerate — never patch the picture".

### multi-persona-review (0.5.2) — Fix: behaviour

**Why.** The most-invoked skill (30 calls) and the one that authorises the
most delegation: three to five reviewer agents, a separate verifier, then a
second round — roughly ten to thirteen launches per review. Opus 5 already
delegates more readily, so the skill needs an explicit floor, a stated cost,
and the rule that all seats of one round go out in a single message. Today
the floor is "a small single-concern artifact" (67–68), the cost is never
stated, and "in parallel" never says how. In the seat prompt, rule 7 ("Six
grounded findings beat twenty padded ones") reads to a literal model as a
count target against the skill's own coverage-first goal, and rule 8 shouts
"You MUST answer the objection field" while the body records that field as
measuring at baseline. The verifier subagent collides with "do not use
subagents to verify"; it has provenance (personas do not buy accuracy), so it
goes to ablation, not deletion. Iteration-2 prompts presuppose seat
continuity that Claude Code only provides via `SendMessage`. At exactly 90%
of budget, history must move before any line is added.
**Findings.** O2 67–68 floor and cost (High); O1/O2 verifier pass 207–217
(High, ablate); G10 124–125, 196–197 (Medium); O6/S1 `reviewer-prompt.md`
129–130 (Medium); G1 rule 8 (Medium); contract accuracy `reviewer-prompt.md`
279, 315 (Medium); O3/S1 the 22-line evidence section to be "said in output"
(Medium); S1 mode table 58–65 unmarked (Medium); G7 163-word description
(Medium); G5 `## Changes` 8% (Medium).
**Keep.** Blind parallel dispatch with the 85.5% conformity reason and
"Disney runs these sequentially in one head. Do not."; the five-seat cap with
its reason; union not vote; the Critic as assigned devil's advocate; "never
present unanimity as confirmation"; the three-iteration cap; every dispatch
template; the evidence gate withholding the verdict, not the review.

### running-uat (0.4.3) — Fix: behaviour + governance

**Why.** Most of the skill is verification the Opus 5 page does not target:
acceptance testing is the deliverable, the evidence rules exist because LLM
judges mark about 30% of failed browser runs as successes, and the
collector-arming order is a real one-way bridge (narrow-bridge PASS, and the
argument does not depend on the model). One instruction collides directly:
"Keep the judge separate from the driver: a fresh subagent…" (163–166). It
has provenance, so it is measured on Opus 5 with planted false-PASS traps,
not deleted. The description narrates the whole loop and omits the entry
gate; the routing table has no marker; the run log has no length rule; 18%
history.
**Findings.** O1/O2 163–166 (High, ablate); G7 description (Medium); S1 55–62
(Medium); O3 run log (Medium); G5 `## Changes` 18% (Medium); D2 band stays,
re-record the PASS under Opus 5 (argument holds).
**Keep.** The entry gate, arm collectors before the first interaction, the
negative control, the PASS floor "closed by design because the judge relies on
it", the stale-screenshot rule, the run-unique token, "FAIL → PASS must pass
twice from clean state", severity-not-priority, the 3-attempt cap.

### using-git-worktrees (0.3.2) — Fix: housekeeping

**Why.** Narrow-bridge PASS; scripts and band stay. The same rules are stated
four times, the description narrates the procedure, and there is a
cross-reference to `verifying-before-done` that restates the gate. No eval (6
invocations to mine for cases).
**Findings.** G4 repetition (Medium); G7 description (Medium); G5
`## Changes` 9% (Medium); D5 no eval.
**Keep.** Detect existing isolation first; prefer the native tool; the
phantom-state warning for `git worktree add` beside a native tool.

### learning-from-sessions (0.2.2) — Fix: housekeeping

**Why.** Sound method, two harness conflicts: the description promises "the
exit condition is a committed change" although CLAUDE.md says commit only
when the user asks; the body hard-codes `/tmp` where the harness names a
scratchpad, and carries a real project name. 16% history.
**Findings.** harness conflict in description and line 90 (Medium); D4
`/tmp` and project name (Medium); G7 description narrates the method
(Medium); G5 `## Changes` (Medium).
**Keep.** The transcript-store mining commands, "mentions are not
invocations", the rule that a pattern must recur before it becomes a rule.

### classify-issue (0.2.2) — Fix: housekeeping (one behaviour line)

**Why.** A small schema skill that does its job: the shape is fixed, the enum
is closed with the reason, the traps table is open, the judgment is named.
One sentence works against Opus 5: "Triple-check enum values and `area`
length before returning" (106–108) is the "double-check your answer"
instruction the Opus 5 page says to remove; the contract sentence before it
stays. Description leads with WHAT; no eval; 88% of a 1500 budget with 16%
history.
**Findings.** O1 106–108 (High, one-line rewrite); G7 (Medium); D5 no eval;
G5/D3 (Medium).
**Keep.** The output schema and "emit a single JSON object", the closed enum
with reason, the example JSON, the traps table, "the format is fixed, the
classification is yours".

### literature-search (0.4.2) — Fix: housekeeping

**Why.** Body in good shape: every shouting rule has its reason beside it,
the robots.txt and never-spoof rules are policy and stay, lists declare
themselves. Three fixes, none about model behaviour: line 66 points at
`/deep-research`, a skill that does not exist (the target is
`/researching-facts`); the description narrates the seven-step method; 23% of
the body is history and the body sits at 88%.
**Findings.** stale reference line 66 (High); G7 description (Medium); G5
`## Changes` 23% (Medium); G6 steps 1–2 re-teach boolean construction
(Medium); G5 undated vendor robots facts (Low); S1 harvest checklist unmarked
(Low).
**Keep.** robots/403 rule, the adapter contract, the sharding identity,
per-year population counts for `/literature-trends`.

### literature-trends (0.2.2) — Fix: housekeeping

**Why.** Short, every list declared, its one emphatic rule ("the corpus's own
year distribution is NOT the trend") sits beside its reason. Step 6 asks for
a written report with no length guidance, and the description is a complete
recipe a model could run without reading the population-vs-corpus rule.
**Findings.** O3 76–77 (High, add one line); G7 description (Medium); G5
`## Changes` 17% (Medium).
**Keep.** Lines 39–48 population vs corpus, exclude the partial current year,
the `/dataviz` delegation, the double-counting row.

### literature-fulltext (0.4.2) — Fix: housekeeping

**Why.** Nothing misaligns with either model: the legal/ethical gate is policy
with reasons, "verify the response is a PDF" is a tool contract. Housekeeping
only: description narrates the method; 23% history on a body at 89%.
**Findings.** G5/D3 `## Changes` (Medium); G7 description (Medium); G5
undated vendor facts (Low); S1 pre-fetch checklist unmarked (Low).
**Keep.** The whole legal gate including ask-before-bulk-fetch, both no-DOI
paths, the Content-Type check.

### researching-facts (0.1.1) — Fix: housekeeping (the exemplar)

**Why.** The best-aligned skill in the catalog: fans both engines out in one
message exactly as the parallel-tool-call guidance says, every list declares
itself, every rule has its reason, the metered cost carries a retrieval date,
and the answer already has a length discipline. Three small fixes: the Bash
examples call `scripts/brave_search.py` relative to the working directory
(fails from any other repo; every other skill writes `"<skill_dir>/scripts/…"`);
three Indonesian trigger phrases re-open an exception the catalog closed with
a recorded reason; history in the body.
**Findings.** tool contract path 73, 140 (Medium); G7 triggers (Medium); G5
`## Changes` 9% (Medium).
**Keep.** Fan-out in one message with the contamination reason, the evidence
bar, the cost paragraph with `USD 5` spelling and the 12-request cap, the
degradation table.

### auditing-video (2.0.0) — Fix: housekeeping

**Why.** The method matches both models: scores all 36 items first and filters
only when ranking fixes (coverage-first), closed lists say why, the machine
validator is an evidence gate, and the Scope section already carries the
Opus 5 scope discipline. Step 7 asks for a seven-section prose report with
no length calibration; the body is at 90% while 29% of it is history (the
next one-sentence edit trips the build warning); the description is the
longest in the catalog.
**Findings.** O3 182–196 (High, add one line); G5/D3 `## Changes` 29% at
4047/4500 (Medium); G7 141-word description (Medium).
**Keep.** "never present a metric before you have watched the contact
sheets", the format gate, the rights gate, `validate_audit.py`, the Scope
paragraph, "view every image", "score all 36 items"; the old ids stay in the
description (that is the only discovery path for them).

### reverse-engineering-video (0.2.1) — Fix: housekeeping

**Why.** Its fan-out is the model of what Opus 5 asks for: delegates only past
a measured 400-frame budget, "One pass. No agents." below it, self-contained
briefs, named merge checks. Three fixes: the nine-section delivery package has
no length calibration; the fan-out protocol never says to launch the sequence
agents in one message; item 1 of the delivery list carries a stray editorial
note ("the count changed with the five-stage production order…") that reads
as a diff against an older version.
**Findings.** O3 177–196 (High, add one line); G10 `fanout-protocol.md`
33–45 (Medium); G5 184–185 (Medium); G5 `## Changes` 22% (Medium); G7 the
"fanned out across parallel agents" sentence in the description (Medium).
**Keep.** Per-shot sampling and evidence tiers, the gate with rights and the
four up-front questions, the 400-frame floor and exit-2 contract, "VIEW EVERY
ONE", the merge checks, `validate_package.py`, "every motion prompt asks for
silence".

### generating-images (0.4.0) — Fix: behaviour (contract drift)

**Why.** The core — measure the file, never trust the engine's self-report,
hash against the references — is a set of prohibitions against observed
failures and stays. But the body has drifted from its own changelog and
script, and a literal reader follows the body. Line 126 says "No asset is
delivered until all four hold" above a five-row table; the 0.4.0 changelog
says a sixth row was added ("look at the image", backed by the script's
`bytes_per_pixel` / `low_detail`), but neither the row nor the fields appear
in the body or the JSON example — the script emits them (verified). The
common-mistakes table forbids parallel generation while `engines.md` lists
parallel behaviour as unmeasured; the ceiling table states fixed sizes that
`engines.md` says are not invariant; the `--ref` example uses `agy`, the
engine the skill's own measurements say returns the reference a third of the
time.
**Findings.** contract 126 vs 129–135 (High); missing row 6 and JSON fields
(High); prohibition without provenance 218 (Medium); ceiling copies disagree
162–169 (Medium); `--ref` example 104–106 (Medium); G1 caps laws in a code
block 40–43 (Medium); G7 "Covers…" sentence plus two Indonesian triggers
(Medium); G5 `## Changes` 19% (Medium); S1 routing table (Low).
**Keep.** Probe before running, the engine-on-intent table with measurements,
the script as spine and the JSON contract, "never run a generator in a
directory holding earlier generations", the prompt block that goes to the
external engine, the ceiling disclosure, `references/engines.md` in full.

### managing-version (0.2.0) — Keep

**Why not.** A thin wrapper around `scripts/version.sh`: a five-row
intent-to-command table, run it, print the result. No verification loops, no
subagents, no emphasis, one prohibition ("Do not edit `VERSION` directly")
with its reason, guarding a narrow bridge — exactly where a prescriptive
script is correct. The only gap is a house rule: no `eval/`, and it has never
been invoked through the Skill tool. Its 25-word history moves with the
sweep for consistency only.

## Reconciliation note

The four reviewers applied "any High finding → FIX-MAJOR" literally, which
labelled a one-line length addition (`literature-trends`, `auditing-video`,
`reverse-engineering-video`, `writing-specs`) the same as a five-layer
verification stack. The verdict table above re-tiers those by what the fix
changes, not by the confidence of the finding. The per-skill review files
with full finding tables and replacement text are in the session scratchpad
and were consumed into the plan's tasks.
