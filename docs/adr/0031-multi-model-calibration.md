# ADR-0031 — Multi-model calibration: Opus 5 daily, Sonnet 5 light, Fable 5.1 occasional

- **Status:** Accepted
- **Date:** 2026-09-04
- **Supersedes:** ADR-0030 §Context (the single-daily-driver premise); §5
  (adds the ablation-before-removal clause below); §6 step 2 (model under
  test) and step 5 (record location); and the YAGNI guard's "one catalog,
  calibrated for the daily driver" sentence. ADR-0030's four shape rules and
  four bands carry forward unchanged.
- **Reversibility:** Cheap.

## Context

ADR-0030 calibrated the catalog for Sonnet 5 as the daily driver and parked
two conflicts with Anthropic's Opus 5 guidance because the Sonnet 5 guide
was silent on them. The owner's usage on 2026-09-04, measured in the
transcript store (`docs/ablations/2026-09-invocation-census.md`): Opus 5 in
2,347 transcript files, Sonnet 5 in 111, Fable 5.1 in 27. The parked
conflicts are live on the primary model.

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
text (6–39% per skill), holding eleven skills at the 88–90% budget line.
v3 ROADMAP M45 introduced that body section; this ADR reverses it.

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
      the 2026-09-04 plan's Task 12 row 4 measures), a panel seat or a
      fact-check of a panel's claims (`/multi-persona-review`).

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
