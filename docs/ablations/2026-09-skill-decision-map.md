# Skill decision-point map — 2026-09

## Model-specific claims

| File:line | Model | Class |
|---|---|---|
| `skills/writing-skills/SKILL.md:111` | Opus 5 | (b) instruction premised on a model trait |
| `skills/writing-skills/SKILL.md:113` | Sonnet 5 | (b) instruction premised on a model trait |
| `skills/writing-skills/SKILL.md:114` | Fable 5.1 | (b) instruction premised on a model trait |
| `skills/writing-skills/SKILL.md:125` | Sonnet 5 | (b) instruction premised on a model trait |
| `CLAUDE.md:144` | Sonnet 5; Opus 5 | (b) instruction premised on model traits |
| `CLAUDE.md:145` | Fable 5.1 | (b) instruction premised on a model trait |
| `docs/skill-quality-playbook.md:659` | Haiku; Sonnet; Opus | (c) models selected for testing |
| `docs/ARCHITECTURE.md:300` | Opus 5; Sonnet 5; Fable 5.1 | (a) architecture index history |
| `docs/adr/0030-sonnet5-calibrated-skill-shape.md:12` | Opus 5; Sonnet 5; Fable 5.1 | (a) superseded ADR context |
| `docs/adr/0030-sonnet5-calibrated-skill-shape.md:14` | Opus 5 | (a) superseded ADR context |
| `docs/adr/0030-sonnet5-calibrated-skill-shape.md:19` | Sonnet 5 | (a) ADR context |
| `docs/adr/0030-sonnet5-calibrated-skill-shape.md:21` | Sonnet 5 | (a) ADR context |
| `docs/adr/0030-sonnet5-calibrated-skill-shape.md:64` | Sonnet 5 | (b) instruction premised on a model trait |
| `docs/adr/0030-sonnet5-calibrated-skill-shape.md:97` | Sonnet 5 | (a) ADR trade-off history |
| `docs/adr/0031-multi-model-calibration.md:1` | Opus 5; Sonnet 5; Fable 5.1 | (a) ADR title/history |
| `docs/adr/0031-multi-model-calibration.md:14` | Sonnet 5 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:15` | Opus 5; Sonnet 5 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:17` | Opus 5 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:18` | Sonnet 5; Fable 5.1 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:23` | Opus 5 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:26` | Sonnet 5 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:28` | Fable 5.1 | (a) ADR context |
| `docs/adr/0031-multi-model-calibration.md:46` | Opus 5; Sonnet 5; Fable 5.1 | (c) calibration targets |
| `docs/adr/0031-multi-model-calibration.md:49` | Opus 5 | (b) instruction premised on a model trait |
| `docs/adr/0031-multi-model-calibration.md:84` | Opus 5 | (c) ablation model selection |
| `docs/adr/0031-multi-model-calibration.md:85` | Sonnet 5 | (c) spot-check model selection |
| `docs/adr/0031-multi-model-calibration.md:86` | Sonnet 5 | (c) spot-check model selection |
| `docs/adr/0031-multi-model-calibration.md:88` | Sonnet 5 | (c) evidence attribution by model |
| `docs/adr/0031-multi-model-calibration.md:89` | Sonnet 5 | (c) evidence attribution by model |
| `docs/adr/0031-multi-model-calibration.md:91` | Opus 5 | (c) model selection for agreement check |
| `docs/adr/0031-multi-model-calibration.md:108` | Opus 5 | (a) ablation cost history |
| `docs/adr/0031-multi-model-calibration.md:124` | Sonnet 5; Fable 5.1 | (c) revisit trigger |
| `docs/adr/0031-multi-model-calibration.md:125` | Opus 5 | (c) revisit trigger |
| `docs/adr/README.md:85` | Opus 5; Sonnet 5; Fable 5.1 | (a) ADR index history |

The only class-(b) hits inside `skills/` are the four `writing-skills` lines above; they are follow-up candidates. No model-claim hit appeared under `skills/*/references`.

## Dev-path decision map

`P1`, `P2`, and `P3` are marked `Yes` or `No` independently. `P4` quotes the exact rule (12 words maximum); `—` means no concise rule applies.

| Skill | Tokens (`bun run list`) | Decision (≤8 words) | P1 answer set listed? | P2 `none`/`unclear` option? | P3 evidence required? | P4 exact rule in prose (quote ≤12 words, or —) |
|---|---:|---|---|---|---|---|
| `using-dstack` | 2755 | Match request to a skill | No | Yes | No | “Match on intent, not wording.” |
| `using-dstack` | 2755 | Open the full catalog? | Yes | No | No | “Open catalog whenever the table is not an obvious match.” |
| `using-dstack` | 2755 | Choose precedence among matching skills | Yes | No | No | “Process skills first.” |
| `discovering-requirements` | 4191 | Run discovery or route elsewhere | Yes | Yes | Yes | “Refusing to run is a valid outcome.” |
| `discovering-requirements` | 4191 | Pick Light or Full depth | Yes | No | Yes | “Pick the depth before Stage 0.” |
| `discovering-requirements` | 4191 | Choose metric baseline path | Yes | Yes | Yes | “Two legal paths, never an invented number” |
| `discovering-requirements` | 4191 | Proceed, do not build, or defer | Yes | Yes | Yes | “DO NOT BUILD and NOT NOW are terminal statuses” |
| `discovering-requirements` | 4191 | Pass or block a stage gate | Yes | Yes | Yes | “Every gate writes one row: stage · PASS or BLOCKED · evidence.” |
| `discovering-requirements` | 4191 | Classify actor evidence | Yes | Yes | Yes | “OBSERVED / REPORTED / INFERRED” |
| `discovering-requirements` | 4191 | Scope regimes and constraint status | Yes | Yes | Yes | “you may not write `VERIFIED`” |
| `discovering-requirements` | 4191 | Set final document status | Yes | No | Yes | “`DRAFT` → `AGREED` requires a named human” |
| `prioritizing-work` | 4262 | Apply the five-item floor | Yes | Yes | Yes | “Floor: ≥5 candidate items” |
| `prioritizing-work` | 4262 | Select a lane from evidence | Yes | No | Yes | “Stop at the first row whose evidence cell can be filled” |
| `prioritizing-work` | 4262 | Split mixed-lane items | Yes | No | Yes | “Never sort two lanes into one list” |
| `prioritizing-work` | 4262 | Admit, route out, or mark unscorable | Yes | Yes | Yes | “One value per item, before any scoring.” |
| `prioritizing-work` | 4262 | Record blockers and falsifier order | Yes | Yes | Yes | “blocked_by (item ids) or clear per item” |
| `prioritizing-work` | 4262 | Assign evidence tier and round status | Yes | Yes | Yes | “A required input absent → `UNSCORABLE`.” |
| `prioritizing-work` | 4262 | Choose class and ranking framework | Yes | Yes | Yes | “Classify, then rank inside the class” |
| `prioritizing-work` | 4262 | Validate score enums and tie bands | Yes | Yes | Yes | “RICE Impact is exactly one of” |
| `prioritizing-work` | 4262 | Decide Must share verdict | Yes | Yes | Yes | “Print the arithmetic, never only the verdict” |
| `prioritizing-work` | 4262 | Order items and record departures | Yes | Yes | Yes | “Score orders within a band only.” |
| `writing-specs` | 4142 | Route to the right design skill | Yes | Yes | Yes | “The problem, goal, or constraints are not written down” |
| `writing-specs` | 4142 | Pick depth and retrospective mode | Yes | No | Yes | “Pick the depth first” |
| `writing-specs` | 4142 | Pass, block, or mark a gate n/a | Yes | Yes | Yes | “subject does not exist in this system” |
| `writing-specs` | 4142 | Resolve discovery contradictions | Yes | Yes | Yes | “never silently overwrite in either direction” |
| `writing-specs` | 4142 | Choose components and boundaries | No | Yes | Yes | “Prefer an existing seam to a new one” |
| `writing-specs` | 4142 | Choose entity and migration shape | No | Yes | Yes | “Absence has three meanings that must stay distinguishable” |
| `writing-specs` | 4142 | Set contract failure and retry rules | No | Yes | Yes | “what it does on each failure” |
| `writing-specs` | 4142 | Select acceptance level and oracle | Yes | Yes | Yes | “can only be checked by reading the code” |
| `writing-specs` | 4142 | Decide whether a decision earns an ADR | Yes | No | Yes | “only when all three hold” |
| `writing-specs` | 4142 | Choose inline or external diagram | Yes | No | Yes | “Diagrams are Mermaid, inline” |
| `writing-specs` | 4142 | Set DRAFT or AGREED status | Yes | No | Yes | “the agent never grants it” |
| `designing-test-cases` | 3878 | Route, stop, or use confirmatory mode | Yes | Yes | Yes | “Any other reason to skip the spec is not a reason” |
| `designing-test-cases` | 3878 | Pick Light or Full depth | Yes | No | Yes | “Pick the depth” |
| `designing-test-cases` | 3878 | Select partition technique by shape | Yes | Yes | Yes | “classify the shape” |
| `designing-test-cases` | 3878 | Cite criterion or derived risk | Yes | Yes | Yes | “Every case cites exactly one criterion or one `R-n`.” |
| `designing-test-cases` | 3878 | Assign level, collaborator, and oracle | Yes | Yes | Yes | “If that thing is a collaborator … then it is real” |
| `designing-test-cases` | 3878 | Choose classes and combinatorial boundary | Yes | Yes | Yes | “Where to stop: pairwise, not full combinatorial.” |
| `designing-test-cases` | 3878 | Rank cases and set release effect | Yes | No | Yes | “Risk is run order; release effect is consequence.” |
| `designing-test-cases` | 3878 | Record gaps and their owner | Yes | Yes | Yes | “Gaps come in four kinds” |
| `designing-test-cases` | 3878 | Name first buildable case and status | Yes | Yes | Yes | “the top-ranked automated-level case whose prerequisites are satisfied” |
| `writing-plans` | 3299 | Route to discovery, spec, or priority | Yes | Yes | Yes | “That order comes from `/prioritizing-work` and is carried here” |
| `writing-plans` | 3299 | Split independent subsystems | Yes | No | Yes | “split it: one plan per subsystem” |
| `writing-plans` | 3299 | Choose visible slice or backend-only | Yes | Yes | Yes | “Task 1 must produce a screen” |
| `writing-plans` | 3299 | Assign task risk tier and test path | Yes | Yes | Yes | “The tier decides how much of what follows applies.” |
| `writing-plans` | 3299 | Choose what belongs in assumptions | No | Yes | Yes | “An unchecked assumption needs a fallback” |
| `writing-plans` | 3299 | Set task states and evidence | Yes | Yes | Yes | “Only `done` carries evidence” |
| `writing-plans` | 3299 | Decide task boundary and commit | No | No | Yes | “Each step is one action (2–5 minutes), ending in a commit.” |
| `executing-plans` | 1497 | Resume, reconcile, or block Status | Yes | Yes | Yes | “Trust the block. Do not re-derive its contents” |
| `executing-plans` | 1497 | Review remaining plan concerns | Yes | Yes | Yes | “If no concerns: proceed from `Next:`” |
| `executing-plans` | 1497 | Continue, fix, deviate, or stop | Yes | Yes | Yes | “If the plan turns out to be wrong” |
| `executing-plans` | 1497 | Mark task blocked on plan defect | Yes | Yes | Yes | “set the task's row to `blocked` with the reason” |
| `subagent-driven-development` | 2355 | Choose manual or subagent workflow | Yes | Yes | Yes | “Tasks run one at a time” |
| `subagent-driven-development` | 2355 | Select model tier per task | Yes | No | Yes | “Mechanical tasks … the host's cheaper tier.” |
| `subagent-driven-development` | 2355 | Handle four implementer statuses | Yes | Yes | Yes | “Handle each appropriately” |
| `subagent-driven-development` | 2355 | Retry, split, or escalate BLOCKED | Yes | Yes | Yes | “Never ignore an escalation” |
| `test-driven-development` | 3266 | Classify risk tier or no-tier path | Yes | Yes | Yes | “One yes puts it inside.” |
| `test-driven-development` | 3266 | Choose no-durable or refactor path | Yes | Yes | Yes | “A behavior-preserving refactor is neither path” |
| `test-driven-development` | 3266 | Choose test-first or frozen-list sequence | Yes | Yes | Yes | “the tier decides how much of what follows applies” |
| `test-driven-development` | 3266 | Select product-level proof | Yes | Yes | Yes | “produce evidence at the level the change lives at” |
| `test-driven-development` | 3266 | Walk four case classes or explain omission | Yes | Yes | Yes | “Walk all four rows before calling a behavior covered.” |
| `test-driven-development` | 3266 | Restart after a failed discipline check | Yes | Yes | Yes | “Stop and redo the case list” |
| `debugging` | 2580 | Choose first probe by failure shape | No | Yes | Yes | “Pick the row that matches before starting Phase 1” |
| `debugging` | 2580 | Continue phases until root cause | Yes | Yes | Yes | “No fix before a named cause” |
| `debugging` | 2580 | Replace hypothesis or investigate fix | Yes | Yes | Yes | “a wrong hypothesis is replaced, never patched over” |
| `debugging` | 2580 | Reconsider architecture after three fixes | Yes | Yes | Yes | “Stop. Surface to the user” |
| `verifying-before-done` | 974 | Choose command that proves the claim | No | Yes | Yes | “Pick the command that would fail if the claim were false” |
| `verifying-before-done` | 974 | Claim only what output supports | Yes | Yes | Yes | “Check the exit code. Count the failures.” |
| `verifying-before-done` | 974 | Require UAT for a changed screen | Yes | Yes | Yes | “A screen was touched? A green suite is not evidence it renders.” |
| `requesting-code-review` | 928 | Request at mandatory or optional checkpoint | Yes | No | Yes | “One reviewer per request” |
| `requesting-code-review` | 928 | Choose reviewer context and SHAs | Yes | No | Yes | “The description and requirements you hand the reviewer set the review's ceiling” |
| `requesting-code-review` | 928 | Fix, note, or push back on findings | Yes | Yes | Yes | “Fix Critical immediately” |
| `multi-persona-review` | 4336 | Select review mode or route elsewhere | Yes | Yes | Yes | “Pick the mode first” |
| `multi-persona-review` | 4336 | Review yourself or seat a panel | Yes | Yes | Yes | “review it yourself in the main loop” |
| `multi-persona-review` | 4336 | Continue panel but withhold verdict | Yes | Yes | Yes | “This gate withholds the verdict, not the review.” |
| `multi-persona-review` | 4336 | Select and assign seats | Yes | Yes | Yes | “Hard cap 5 seats” |
| `multi-persona-review` | 4336 | Run conditional third iteration | Yes | Yes | Yes | “Runs only when iteration 2 surfaced a new blocking finding” |
| `multi-persona-review` | 4336 | Verify claims and classify evidence | Yes | Yes | Yes | “Verify the decisive claims.” |
| `multi-persona-review` | 4336 | Resolve contradiction and assign work | Yes | Yes | Yes | “accept A / accept B / defer with a stated trigger / block” |
| `multi-persona-review` | 4336 | Emit Go, No-Go, or escalate | Yes | Yes | Yes | “No-Go is a legitimate output” |
| `running-uat` | 2674 | Route to UAT or neighboring skill | Yes | Yes | Yes | “route an unlisted request by whether it needs an accept/reject verdict” |
| `running-uat` | 2674 | Pass entry gate or stop | Yes | Yes | Yes | “Refusing is a valid and cheap outcome.” |
| `running-uat` | 2674 | Order risks and plant negative control | Yes | Yes | Yes | “Plant a negative control” |
| `running-uat` | 2674 | Record PASS, FAIL, or BLOCKED | Yes | Yes | Yes | “record PASS / FAIL / BLOCKED with artifact paths” |
| `running-uat` | 2674 | Fix, confirm, regress, or stop | Yes | Yes | Yes | “Cap at 3 attempts per scenario.” |
| `running-uat` | 2674 | Choose stakeholder views and judge | Yes | Yes | Yes | “Keep the judge separate from the driver” |
| `running-uat` | 2674 | Assign severity, escalate priority | Yes | Yes | Yes | “Severity you may assign; priority you may not” |
| `finishing-development-branch` | 2342 | Verify tests and required UAT | Yes | Yes | Yes | “Before presenting options, verify tests pass” |
| `finishing-development-branch` | 2342 | Confirm base branch when ambiguous | Yes | Yes | Yes | “Confirming the base branch … is the one judgment call” |
| `finishing-development-branch` | 2342 | Choose merge, PR, keep, or discard | Yes | No | Yes | “present exactly these 4 options” |
| `finishing-development-branch` | 2342 | Confirm destructive discard | Yes | Yes | Yes | “Get typed confirmation for Option 4” |

## Not in the dev path — not mapped in this plan

| Skill | Tokens (`bun run list`) | Step 1 hits |
|---|---:|---|
| `auditing-video` | 2915 | — |
| `brainstorm` | 2100 | — |
| `classify-issue` | 1169 | — |
| `diagramming-architecture` | 2451 | — |
| `dispatching-parallel-agents` | 1838 | — |
| `generating-images` | 3231 | — |
| `guarding-destructive-commands` | 986 | — |
| `learning-from-sessions` | 1936 | — |
| `literature-fulltext` | 1838 | — |
| `literature-search` | 2963 | — |
| `literature-trends` | 1385 | — |
| `managing-version` | 394 | — |
| `modelling-business-processes` | 2869 | — |
| `modelling-system-behaviour` | 2745 | — |
| `pdf-to-rag` | 2570 | — |
| `researching-facts` | 2349 | — |
| `responding-to-review` | 2267 | — |
| `reverse-engineering-video` | 2720 | — |
| `using-git-worktrees` | 2470 | — |
| `wireframing-interfaces` | 2451 | — |
| `writing-skills` | 3165 | `skills/writing-skills/SKILL.md:111` Opus 5 (b); `:113` Sonnet 5 (b); `:114` Fable 5.1 (b); `:125` Sonnet 5 (b) |

## Known P6 conflict

The `using-dstack` description says “If there is a real chance a skill applies, invoke it to check”; its body says to invoke on a match, not on doubt. This is a P6 conflict and a G3 candidate; no change was made here.
