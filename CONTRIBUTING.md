# Contributing — adding a skill

This document walks you from "I have an idea for a skill" to "my
skill renders, validates, and a test verifies it." For everything
else (architecture, ADRs, code conventions), see
[CLAUDE.md](CLAUDE.md).

## Prerequisites

- Bun 1.3 or newer (`bun --version`).
- A clone of this repo with `bun install` run once.

## 1. Decide whether a skill is the right shape

A skill is a single directory of YAML + Markdown that the
renderer turns into `SKILL.md`. Reach for one when the workflow:

- Has a clear name the user could invoke (`/test-driven-development`, `/responding-to-review`).
- Repeats often enough that copy-pasting the instructions gets old.
- Stays under 16 000 tokens after rendering.

If you are tempted to add template variables, runtime hooks, or
multi-step orchestration, read
[docs/plans/v1/DEFERRED.md](docs/plans/v1/DEFERRED.md) first — most
of those features are deliberately not built and the listed reason
explains why.

## 2. Scaffold the directory

```bash
bun run new <skill-id>
```

The skill id must be kebab-case, lowercase letters/digits/hyphens,
starting with a letter. Examples: `test-driven-development`, `plan-ceo-review`. The
scaffold creates `skills/<skill-id>/{skill.yaml,prompt.md}` with
placeholder content.

## 3. Edit `skill.yaml`

The full schema lives in
[docs/specs/skill-spec.md](docs/specs/skill-spec.md). The minimum
required fields are `name`, `version`, `description`, and `tools`.
Add `context_budget_tokens` if the default 4 000 is not the right
size for your skill.

Conventions:

- Keep the description tight — one paragraph, written so the LLM
  knows when to invoke the skill. Include trigger phrases ("Use
  when…").
- Declare only tools you actually use. The Claude Code tool registry
  lives at `src/adapters/claude-code/tools.ts`.
- Pick a budget first; size the prompt to fit. Budgets are
  constraints, not measurements.

## 4. Write `prompt.md`

`prompt.md` is plain Markdown. No template variables, no `{{var}}`
substitution. See
[ADR-0003](docs/adr/0003-skill-as-data.md) for the reasoning.

Audience is the LLM, not a human reader. Lead with the rule the
skill enforces, then the procedure, then templates. The existing
M1 skills (`test-driven-development`, `debugging`, `brainstorm`,
`responding-to-review`, `verifying-before-done`) are the reference for shape and tone.

## 5. Validate before building

```bash
bun run validate
```

Greppable per-skill output:

```
brainstorm: OK (1327/2000 tokens)
careful: OK (746/1500 tokens)
new-skill: ERR <message>
```

Exit code is 0 if every skill passes, 1 if any failed. A failed
skill aborts the build later, so fix it now.

## 6. Render and inspect

```bash
bun run render <skill-id>     # print one rendered skill to stdout
bun run build                 # render every skill and install locally
bun run list                  # table of every skill with version + tokens
```

After `build`, the rendered file lives at
`.claude/skills/<skill-id>/SKILL.md`. Read it once to confirm the
frontmatter is correct and the prompt body reads cleanly.

## 7. Add a regression test (if the skill has tricky parsing)

Pure prose skills usually do not need their own test — the
contract suites and existing fixtures cover the parser and
renderer. Add a test when:

- The skill exercises a parsing edge case (new YAML field, unusual
  include shape).
- The skill is a bug fix; the test is the regression guard.

Unit tests live under `test/unit/`. Contract tests live under
`test/contract/`. Integration tests live under `test/integration/`.

## 8. Run the test suite

```bash
bun test          # all tests, < 1 second
bun run typecheck # tsc --noEmit, strict mode
```

Both must pass before committing.

## 9. Commit

```bash
git add skills/<skill-id> CHANGELOG.md docs/plans/v1/DONE.md
git commit
```

Commit message: imperative subject under 72 characters; body
explains the *why*. See `git log` for the existing style.

## When to bump the version

The rule is in
[docs/specs/skill-spec.md#versioning-rule](docs/specs/skill-spec.md).
Short version: bump when the semantics of the prompt change, the
tools list changes, or the budget changes. Do not bump for typo
fixes or whitespace.

## When to write a new ADR

If the change you are about to make contradicts an Accepted ADR,
or introduces a new architectural rule, write a new ADR first.
Numbering and format are in
[docs/adr/README.md](docs/adr/README.md). Do not edit accepted
ADRs in place — supersede them.

## Cross-references

- [CLAUDE.md](CLAUDE.md) — agent instructions, forbidden patterns,
  code conventions.
- [CONTEXT.md](CONTEXT.md) — domain language glossary.
- [docs/specs/skill-spec.md](docs/specs/skill-spec.md) — full
  schema.
- [docs/code-taxonomy.md](docs/code-taxonomy.md) — coding rules.
- [docs/plans/v1/ROADMAP.md](docs/plans/v1/ROADMAP.md) — what is
  planned.
- [docs/plans/v1/DEFERRED.md](docs/plans/v1/DEFERRED.md) — what is
  deliberately not built and why.
