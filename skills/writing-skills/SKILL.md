---
name: writing-skills
description: |
  Use when creating, editing, or verifying a dstack skill. Covers the
  SKILL.md format, the description rules that decide whether a skill gets
  found, staying within the token budget, and testing a skill with
  subagents before trusting it. Use when the user says "write a skill",
  "create a skill", "improve this skill", or "is this skill any good".
allowed-tools: Read Write Edit Bash Grep Glob Agent
metadata:
  dstack:
    version: 0.8.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - write a skill
      - create a skill
      - improve this skill
      - test this skill
---
# /writing-skills

A skill is a reference guide for a proven technique, pattern, or rule
that a future Claude instance finds and applies. Writing one well is
test-driven: watch an agent behave *without* the skill, write the skill
to fix what you saw, then verify the behavior changed.

Core principle: if you did not watch an agent struggle without the
skill, you do not know whether the skill teaches the right thing.

## Scaffold first

```bash
bun run new <skill-id>     # creates skills/<skill-id>/ from the template
# edit skills/<skill-id>/SKILL.md
bun run validate           # check schema + token budget
bun run build --strict     # render; fail on any warning
```

**Name it for the activity, in at most three words** (ADR-0027): prefer a
gerund — `verifying-before-done`, not `verification`. No bare abbreviation
(`tdd`), adjective (`careful`), or generic noun (`version`). Three
hyphen-separated words is a hard ceiling: drop articles first
(`finishing-a-development-branch` → `finishing-development-branch`), then the
least load-bearing noun (`pdf-to-rag-markdown` → `pdf-to-rag` — the output
format belongs in the description). **Still ambiguous at three words? The skill
does too much — split it.** When two skills act on the same object, encode the
direction (`requesting-` ↔ `responding-to-`). Renaming an existing skill? Keep
the old id as a trigger keyword so discovery survives.

`<skill-id>` is kebab-case and starts with a letter. The `name` in
frontmatter must equal the directory name.

## When to create a skill

Create when the technique was not obvious, you would reuse it across
tasks, and it needs judgment.

Do not create for: one-off solutions; things already well-documented;
project conventions (those go in CLAUDE.md); or anything a validator or
regex could enforce — automate those instead of documenting them.

## SKILL.md shape

Frontmatter — see `docs/specs/skill-spec.md` for the full schema:

```yaml
---
name: <kebab-id>                  # equals the directory name
description: <when to use, not what it does>
allowed-tools: Read Bash Edit     # only tools the skill actually uses
metadata:
  dstack:
    version: 0.1.0
    type: semantic                # or deterministic | hybrid | schema-semantic
    context_budget_tokens: 2500   # body-only ceiling, hard max 5000
    side_effects: readonly        # readonly | local | external
    agency: reactive              # reactive | deliberative | autonomous
    triggers: [ ... ]
---
```

Body, scaled to the skill — a starting point, not a limit; add or drop
sections as the skill needs:

- **Overview** — what it is, core principle in 1–2 sentences.
- **When to use** — symptoms and triggers, and when NOT to use.
- **The pattern / steps** — tables and prose. Reserve a tiny inline
  flowchart for a genuinely non-obvious decision; dstack skills favor
  tables and numbered lists over diagrams.
- **Spine + named judgment, then pick a band** (ADR-0025 bands, ADR-0030 governance, playbook §1.15)
  — the body needs a deterministic spine (steps + a gate + a
  table/checklist; exact commands where applicable) AND one sentence
  naming where the agent's judgment takes over. Then pick a calibration
  band: `workflow` (~30% det, the default — omit the flag),
  `judgment-dominant` (10–20%), `deterministic-dominant` (60–80%+), or
  `schema-meta`. Set `metadata.dstack.calibration` only when NOT
  `workflow`. Moving off it in **either** direction costs one ablation run
  + owner approval, recorded in `CHANGELOG.md` (ADR-0030 §5). Exemplar:
  `/responding-to-review` (the reference hybrid: deterministic spine + named judgment).
- **One example per output shape** — complete, runnable, commented with WHY.
  Two or three deliberately varied ones, labelled illustrative, when the
  output is format-sensitive. Never the same example in five languages.
- **Common mistakes** — what goes wrong and the fix.

## Shape rules (ADR-0030, ADR-0031)

The catalog runs on two models that fail differently, with a third as a
guard. Opus 5 (daily) verifies, delegates and self-corrects without being
told and over-applies any instruction to do more of it; it also writes
longer files than the task needs. Sonnet 5 (light work) reads literally and
will not generalize past a list. Fable 5.1 (occasional) under-narrates and
under-formats, so nothing here may suppress progress text or formatting.
Codex and Gemini CLI read the same files with no harness rules, so every
rule keeps one plain statement. So:

1. **Every list of 3+ declares itself** — "not exhaustive, extend it" or
   "closed by design because <reason>". Neither trips the
   `closed-enumeration` build warning.
2. **Exit criteria over step order.** Fix the order only on a narrow
   bridge: destructive commands, migrations, deploys.
3. **Never restate what the model knows.** Write our conventions, commands
   and definition of good — not the general technique. On Sonnet 5 our
   shorter version replaces the model's fuller one.
4. **Enumeration-as-product** is exempt from rule 1's *open* marker, not
   from declaring. Say it is the deliverable, and why.
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

## The description decides discovery

Claude reads the `description` to decide whether to load the skill. Make
it answer "should I open this right now?"

**Describe WHEN to use, never WHAT the skill does.** A description that
summarizes the workflow becomes a shortcut Claude follows *instead of*
reading the body — so a two-step process documented in the body gets run
as the one step named in the description.

```yaml
# BAD — summarizes workflow; Claude follows this and skips the body
description: dispatches a subagent per task with review between tasks

# GOOD — triggering conditions only
description: Use when executing an implementation plan with independent tasks
```

Write in third person, start with "Use when…", say what the skill does in
one clause and when to use it, with the specific terms the user will type —
a few distinctive error strings, symptoms ("flaky", "race condition"), tool
and library names — grouped as intents, never as workflow steps. Under 80
words; under 120 only when a trigger list is the sole discovery path (old
ids, database names), and say which. Indonesian trigger phrases stay where
the owner's own request wording is Indonesian.

## Stay within budget

The body has a token ceiling (`context_budget_tokens`, hard max 5000).
Bundled files under the skill folder do not count and load on demand.

- Move heavy reference (API dumps, long tables) into a sibling file and
  point to it in prose: "See `pptxgenjs.md` for the full API."
- Reference other skills by name (`/test-driven-development`); do not paste their content.
- Cut redundant examples; one pattern, shown once.

`bun run validate` reports `<tokens>/<budget>` per skill; `bun run list`
shows the whole catalog.

## Test the skill before trusting it

A skill you only read is a skill you have not tested.

**Discipline skills** — rules that must hold under pressure, like `/test-driven-development`
and `/verifying-before-done`:

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

**Technique, pattern, and reference skills:** test that a subagent can
*apply* it to a fresh scenario, handles a variation, and that common
cases are covered with no gaps.

See `testing-skills-with-subagents.md` for the full method (pressure
types, plugging holes), `persuasion-principles.md` for why pressure
scenarios are valid tests, and `anthropic-best-practices.md` for Anthropic's
official authoring guidance. Add a behavioral check under the skill's
`eval/` folder — see `/brainstorm`'s bundled `eval/` for the pattern.

## Anti-patterns

Not exhaustive — the recurring ones; flag anything with the same shape.

- **Project bias** — a rule lifted from the repo you happen to be in.
  Encode the technique, not one project's conventions; those belong in
  that repo's CLAUDE.md.
- **Shipping unregistered** — absent from the `/using-dstack` router is
  a skill nobody finds. Register it in the same commit.
- **A currency sign before a digit** — invoking a skill with arguments
  substitutes `$N` in the body with the Nth word of those arguments, so a price
  silently arrives as a word lifted from the user's question. Write `USD 5`.
- **Narrative** — "In session 2025-10-03 we found…". Not reusable.
- **Multi-language dilution** — the same example in JS, Py, Go. Pick one.
- **Workflow in the description** — see the discovery section above.
- **Documenting a mechanical rule** — automate it instead.

## Checklist (track one todo per item)

Closed by design: this checklist is the shipping gate — every row becomes a
todo, and rows enter or leave only by editing this skill.

- [ ] `bun run new <id>`; `name` equals the directory
- [ ] Name states the activity, **≤3 words** (gerund; no abbreviation/adjective/generic noun)
- [ ] Description: third person, "Use when…", triggers/symptoms, no workflow
- [ ] `allowed-tools` lists only what the skill uses
- [ ] `metadata.dstack` complete; body under budget
- [ ] One excellent example; heavy reference moved to a sibling file
- [ ] Spine present (steps + gate + table/checklist) AND judgment named in
      one sentence; `calibration` band chosen (flag set if not `workflow`)
- [ ] Discipline skill: baseline-tested with a subagent on the target model;
      rule stated positively with reason and exit criterion
- [ ] `eval/` behavioral check added
- [ ] Skill is **project-agnostic** — no rule copied from one repo's
      CLAUDE.md, no example only that repo's stack would recognise
- [ ] **Registered in `/using-dstack`**: router row, `references/skill-catalog.md`
      entry, any chain it belongs to — and its `CHANGELOG.md` entry written
      and frontmatter `version` bumped in the same edit
- [ ] `bun run validate` and `bun run build --strict` pass
- [ ] Commit (see CLAUDE.md commit style)
