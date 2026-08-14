---
name: learning-from-sessions
description: >
  Use when turning your own past sessions into durable improvements — mining the
  transcript store under `~/.claude/projects` for recurring corrections, repeated
  tool errors, refused actions, and rework, then converting each recurring pattern
  into a written rule, a skill edit, or a memory entry. Run it on a cadence
  (weekly) or after a session that went badly. The exit condition is a committed
  change, never a report. Triggers: "retrospective", "weekly retro", "evaluate
  Claude usage", "what can we improve", "lessons from yesterday's session",
  "review conversation history", "lessons learned", "analyze recurring mistakes",
  "learn from past sessions", "improve week over week".
allowed-tools: Bash Read Write Edit Grep Glob
metadata:
  dstack:
    version: 0.2.2
    type: hybrid
    side_effects: local
    agency: deliberative
    context_budget_tokens: 3500
    triggers:
      - retrospective
      - weekly retro
      - lessons learned
      - evaluate claude usage
      - analyze recurring mistakes
      - learn from past sessions
---
# /learning-from-sessions

Your past sessions are the only honest record of how this collaboration actually
goes — what got corrected, what kept failing, what had to be redone. This skill
converts that record into changes that survive the session.

```
A RETROSPECTIVE THAT PRODUCES A REPORT HAS FAILED.
THE OUTPUT IS A DIFF.
```

## When to use

Weekly, or after a session that went badly. Also before adding a skill — the
history says which gap is real, and the answer is often "extend an existing
skill", not "add a new one".

Not for: debugging one failure (`/debugging`), or reviewing code (`/requesting-code-review`).

## Never read the transcripts directly

The corpus is gigabytes across thousands of files. Reading it burns context and
biases the result toward whatever you happened to open. Run the miner:

```bash
python3 scripts/mine_sessions.py --since 7 --out /tmp/retro.json
python3 scripts/mine_sessions.py --since 7 --project maritimhub   # one project
python3 scripts/mine_sessions.py --since 0                        # all time
```

It emits a digest: correction pairs (a claim next to the pushback it drew),
tool errors grouped by signature, refused tool calls, rework files, and where
the turns went. `--help` for the rest.

**It excludes `agent-*.jsonl` on purpose.** Those are subagent transcripts whose
"user" turns are prompts an agent wrote to itself. Counting them inflates every
number and has you grading your own homework.

## The procedure

1. **Run the miner** for the window. If the sample is thin (under ~30 human
   turns), widen `--since` rather than draw conclusions from three incidents.
2. **Read the correction pairs first.** They are the richest seam: each one is a
   moment a claim was rejected. Quote the user's words verbatim into your notes —
   paraphrasing is where the flattery creeps in.
3. **Cluster by cause, not by symptom.** Six occurrences of one error signature
   is one lesson, not six. Two different errors with the same root — acting
   before checking — is one lesson, not two.
4. **Apply the recurrence bar.** A pattern earns a durable change if it happened
   **≥2 times**, or **once with high cost** (data loss, a wrong claim that
   shipped, a destroyed artifact). Everything else is noise: name it and move on.
5. **Route each surviving lesson** to exactly one home (next section).
6. **Write the change.** Edit the file. A lesson you only described is a lesson
   you did not learn.
7. **Report what you changed and what you deliberately dropped**, with counts.

## Where a lesson goes

| The lesson is about | Home | Shape |
|---|---|---|
| A rule for one repo — its conventions, its forbidden actions | that repo's `CLAUDE.md` | a row in the rules or forbidden-patterns table |
| How a task should be done, reusable across repos | the owning skill's body + `## Changes` | edit the spine, not the prose around it |
| No skill owns it and it recurs | a new skill (`/writing-skills`) | only after the recurrence bar |
| The user — preference, context, a correction they gave | a memory file | `type: feedback` with **Why** and **How to apply** |
| A fact that will be stale next month | nowhere | say so; do not enshrine it |

**One home per lesson.** The same rule in CLAUDE.md and a skill and a memory
drifts out of sync and the copies start contradicting each other. The homes
above are **not exhaustive** — a lesson a validator, hook, or script could
enforce routes to automation, not prose; name the new home when you use one.

## Guards

You are grading your own past behavior, and models prefer their own output by a
measured margin. The guards below exist because good intentions do not survive
that. They are the failures seen so far, **not exhaustive** — a retro invents
new ways to flatter itself, and a new one gets a row.

| Failure | Guard |
|---|---|
| Self-flattering read — "the user misunderstood" | Work from the mechanical evidence: error signatures, counts, the user's verbatim words |
| A report instead of a change | The exit condition is a written diff. No diff, no retro |
| Over-fitting to one dramatic incident | The recurrence bar (step 4) |
| Rule inflation — every lesson becomes a new rule | Prefer editing an existing rule; a rules table nobody can hold is a rules table nobody follows |
| Blaming the user | Their corrections are data about the system, not about them. If a correction repeats, the instruction was unclear or the guard was missing |
| Counting subagent transcripts | The miner excludes them; do not defeat it by globbing yourself |
| Fixing the symptom | Cluster by cause first (step 3) |

## Judgment

The miner finds patterns; it cannot tell you which ones are *durable*. Yours are
two calls: **whether a recurring pattern reflects a real gap or just a hard
week**, and **where the lesson belongs** — the difference between a repo rule, a
skill edit, and a fact about the user is the difference between a change that
compounds and one that gets in the way.

## Worked example

The miner reports, over 14 days:

```
6x Write: "File has not been read yet. Read it first before writing to it."
48 rework files (>=4 edits to one file in one session)
19 verify demands (10% of human turns)
```

- The `Write` error clears the bar (6×) and is mechanical. Cause: writing before
  reading. Home: a repo rule — it is a harness contract, not a workflow. →
  a row in `CLAUDE.md`'s forbidden-patterns table.
- 48 rework files is a **symptom**, not a lesson. Cluster it: are the repeats
  concentrated in one file type, one project, one kind of task? If it is
  trial-and-error against a failing test, the lesson belongs in the testing
  skill. If it is unclear requirements, it belongs upstream in planning.
- 19 verify demands at 10% of turns is the strongest signal in the set: the user
  keeps having to ask for proof. That is not a new rule — `/verifying-before-done`
  already exists. The lesson is that it is not firing. Home: the skill's routing,
  or its trigger list. Adding a second rule saying the same thing would be rule
  inflation.

## Bundled files

- `scripts/mine_sessions.py` — the extractor. `--help` documents every flag and
  what each signal means.
- `references/lesson-routing.md` — worked routing decisions, the memory-entry
  shape, and how to retire a rule that stopped earning its place.

## Changes

- **0.2.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: the guard table is open — a retro invents new ways to flatter itself.
- **0.2.0** — Indonesian trigger phrases and prose removed under the English-only
  rule (using-dstack 0.7.0: models translate intent, so the phrases cost tokens
  without adding reach). The description and `metadata.dstack.triggers` now carry
  English triggers of the same intent, and the worked routing examples in
  `references/lesson-routing.md` state the user's pushback in English rather than
  quoting it in Indonesian. Preserved as data: the Indonesian correction and
  verify-demand regexes in `scripts/mine_sessions.py`, which exist to match real
  Indonesian transcripts, and the Indonesian prompts in `eval/cases.jsonl`, which
  are the proof that an English skill still matches an Indonesian request.

- **0.1.0** — Initial. Built after mining this user's own corpus: 121 main-session
  transcripts (2,390 of 2,511 files were subagent transcripts and had to be
  excluded), 12% of human turns were corrections, and the top recurring tool
  error was one the agent had committed twice in the same session that proposed
  this skill. The self-flattery guard follows the measured self-preference bias
  in LLM self-evaluation; the "output is a diff" rule follows the standard
  retrospective failure of producing findings nobody acts on.
