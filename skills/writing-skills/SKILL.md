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
    version: 0.6.1
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
  + owner approval, recorded in `## Changes` (ADR-0030 §5). Exemplar:
  `/responding-to-review` (the reference hybrid: deterministic spine + named judgment).
- **One excellent example** — complete, runnable, commented with WHY.
  Not five mediocre ones in five languages.
- **Common mistakes** — what goes wrong and the fix.

## Shape rules (ADR-0030)

Sonnet 5 is the daily driver; it reads lists literally and will not
generalize past them. So:

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

These four are closed by design; a fifth needs an ADR.

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

Write in third person, start with "Use when…", and pack in the words
Claude would search for: error strings, symptoms ("flaky", "race
condition"), tool and library names.

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

1. Run a pressure scenario with a subagent **without** the skill. Record
   the exact rationalizations it uses (verbatim).
2. Write the skill to counter those specific rationalizations.
3. Re-run **with** the skill. It should now comply.
4. New rationalization appears? Add an explicit counter; re-test.

Capture every excuse in a table and a red-flags list so the next agent
self-checks:

```markdown
| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |

## Red flags — STOP
- "I already manually verified it"
- "This case is different because…"
```

**Technique, pattern, and reference skills:** test that a subagent can
*apply* it to a fresh scenario, handles a variation, and that common
cases are covered with no gaps.

See `testing-skills-with-subagents.md` for the full method (pressure
types, plugging holes), `persuasion-principles.md` for why explicit
counters work, and `anthropic-best-practices.md` for Anthropic's
official authoring guidance. Add a behavioral check under the skill's
`eval/` folder — see `/brainstorm`'s bundled `eval/` for the pattern.

## Anti-patterns

Not exhaustive — the recurring ones; flag anything with the same shape.

- **Project bias** — a rule lifted from the repo you happen to be in.
  Encode the technique, not one project's conventions; those belong in
  that repo's CLAUDE.md.
- **Shipping unregistered** — absent from the `/using-dstack` router is
  a skill nobody finds. Register it in the same commit.
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
- [ ] Discipline skill: baseline-tested with a subagent; rationalization
      table + red flags
- [ ] `eval/` behavioral check added
- [ ] Skill is **project-agnostic** — no rule copied from one repo's
      CLAUDE.md, no example only that repo's stack would recognise
- [ ] **Registered in `/using-dstack`**: router row, `references/skill-catalog.md`
      entry, any chain it belongs to, `## Changes` — and its frontmatter
      `version` bumped in the same edit
- [ ] `bun run validate` and `bun run build --strict` pass
- [ ] Commit (see CLAUDE.md commit style)

## Changes

- **0.6.1** — ADR-0030 catalog review (list openness, enumeration-as-product declared, self-contained refs); panel-verified, see the 2026-08-14 review workflow.
- **0.6.0** — `context_budget_tokens` 3000 → 4500. Not headroom for bloat: this
  skill now carries permanent ADR-0030 doctrine every skill author must read,
  and 3000 was mis-tiered against its peers — `/writing-plans`, `/writing-specs`,
  `/discovering-requirements` and `/prioritizing-work` all sit at 5000. The
  0.5.0 section could not fit under 90% of 3000 at any reasonable terseness.
  Owner-approved 2026-08-14 after the alternative (cutting ~297 tokens of
  existing content) was judged to damage the skill to satisfy a threshold.
- **0.5.0** — Carried the ADR-0030 shape rules. Anthropic's Sonnet 5 guide
  says the model "does not silently generalize an instruction from one item
  to another", so with Sonnet 5 as daily driver a closed list caps the
  model's own knowledge; only 2 of 33 skills declared any list open on
  2026-08-14. Band governance corrected too: ADR-0030 charges an ablation
  run in **either** direction, ADR-0025 charged evidence only for freedom.
- **0.4.0** — Two rules from mined session history, both recurring
  corrections: a skill must be project-agnostic (no rule lifted from the
  repo it was written in), and a new skill ships registered in the
  `/using-dstack` router, catalog, and chains, with that skill's version
  bumped in the same edit. Added as checklist rows and anti-patterns.
- **0.3.0** — Encoded the skill-naming convention (ADR-0027): name the
  activity, gerund preferred, no bare abbreviation/adjective/generic noun,
  encode direction for paired skills, and keep the old id as a trigger when
  renaming. Added a checklist row.
- **0.2.1** — Repointed the calibration exemplar to `responding-to-review` (the reference
  hybrid: deterministic spine + named judgment).
- **0.2.0** — Encoded the hybrid-by-default doctrine (ADR-0025): spine +
  named judgment + the four calibration bands and when to set the flag.
  Fixed the `TodoWrite` heading to host-accurate phrasing.
- **0.1.0** — Initial. Authoring path is `bun run new`,
  `docs/specs/skill-spec.md`, `metadata.dstack`, token budgets, `eval/`;
  tables and prose rather than diagram tooling. Keeps the TDD-for-skills
  method and the rationalization-table technique.
