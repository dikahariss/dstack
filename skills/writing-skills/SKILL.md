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
    version: 0.1.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 2500
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

Body, scaled to the skill:

- **Overview** — what it is, core principle in 1–2 sentences.
- **When to use** — symptoms and triggers, and when NOT to use.
- **The pattern / steps** — tables and prose. Reserve a tiny inline
  flowchart for a genuinely non-obvious decision; dstack skills favor
  tables and numbered lists over diagrams.
- **One excellent example** — complete, runnable, commented with WHY.
  Not five mediocre ones in five languages.
- **Common mistakes** — what goes wrong and the fix.

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
- Reference other skills by name (`/tdd`); do not paste their content.
- Cut redundant examples; one pattern, shown once.

`bun run validate` reports `<tokens>/<budget>` per skill; `bun run list`
shows the whole catalog.

## Test the skill before trusting it

A skill you only read is a skill you have not tested.

**Discipline skills** — rules that must hold under pressure, like `/tdd`
and `/verification`:

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
`eval/` folder — see `skills/brainstorm/eval/` for the pattern.

## Anti-patterns

- **Narrative** — "In session 2025-10-03 we found…". Not reusable.
- **Multi-language dilution** — the same example in JS, Py, Go. Pick one.
- **Workflow in the description** — see the discovery section above.
- **Documenting a mechanical rule** — automate it instead.

## Checklist (use TodoWrite)

- [ ] `bun run new <id>`; `name` equals the directory
- [ ] Description: third person, "Use when…", triggers/symptoms, no workflow
- [ ] `allowed-tools` lists only what the skill uses
- [ ] `metadata.dstack` complete; body under budget
- [ ] One excellent example; heavy reference moved to a sibling file
- [ ] Discipline skill: baseline-tested with a subagent; rationalization
      table + red flags
- [ ] `eval/` behavioral check added
- [ ] `bun run validate` and `bun run build --strict` pass
- [ ] Commit (see CLAUDE.md commit style)

## Changes

- **0.1.0** — Ported from superpowers `writing-skills`. Re-pointed at
  dstack's authoring path (`bun run new`, `docs/specs/skill-spec.md`,
  `metadata.dstack`, token budgets, `eval/`); replaced the graphviz
  tooling with dstack's tables-and-prose convention; cross-references
  `/tdd`. Kept the TDD-for-skills method and the rationalization-table
  technique.
