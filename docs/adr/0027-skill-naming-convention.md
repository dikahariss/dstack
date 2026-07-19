# ADR-0027 — Skill names state the activity; no bare abbreviations or adjectives

- **Status:** Accepted
- **Date:** 2026-07-19
- **Reversibility:** Cheap for the convention; a rename itself is a
  breaking change for anyone who typed the old id.

## Context

The catalog's names had drifted into three different shapes. Most were
descriptive gerunds (`writing-plans`, `executing-plans`, `using-git-worktrees`,
`dispatching-parallel-agents`), but five were not:

| Id | Problem |
|---|---|
| `tdd` | Abbreviation. Opaque to anyone who does not already know the practice. |
| `code-review` | **Wrong meaning.** It handles review feedback you *received*, but the name reads as "perform a review" — and it sat next to `requesting-code-review`, so the pair gave no clue which was which. |
| `careful` | A bare adjective. Careful about what? |
| `verification` | A bare noun. Says nothing about *when* to reach for it. |
| `version` | Generic. Collides with the frontmatter `version` field in docs and in search. |

Anthropic's first-party authoring guidance is explicit here — it recommends
**gerund form** (verb + -ing), lists noun phrases as an acceptable alternative,
and names three things to avoid: *vague names*, *overly generic names*, and
*inconsistent patterns within your skill collection*
(`skills/writing-skills/anthropic-best-practices.md`, §"Naming conventions";
also tabulated in `docs/skill-quality-playbook.md` §"At-a-glance evidence base").
All five failed at least one of those.

The name is not cosmetic. It is what the router table, the catalog, and the
user's own typing refer to, and — with the description — it is the first thing
an agent reads when deciding whether a skill applies.

## Decision

**A skill id names the activity it performs, in enough words to be unambiguous
on its own.** Concretely:

1. Prefer the gerund form: `verifying-before-done`, not `verification`.
2. No bare abbreviations (`tdd`), bare adjectives (`careful`), or single
   generic nouns (`version`).
3. When two skills operate on the same object, the ids must distinguish the
   *direction*: `requesting-code-review` ↔ `responding-to-review`.
4. **Hard ceiling: three hyphen-separated words.** This is the binding
   constraint — it forces the name to carry only what disambiguates it, and
   it caps the token cost of every table that lists the catalog. Drop
   articles first (`finishing-a-development-branch` →
   `finishing-development-branch`), then the least load-bearing noun
   (`pdf-to-rag-markdown` → `pdf-to-rag`; the output format lives in the
   description). If three words still cannot disambiguate it, the skill is
   doing too much — split it.
5. Stop at the point of ambiguity. Descriptive, not verbose — a beginner
   should read it once and know when to reach for it. Names that are already
   clear (`brainstorm`, `debugging`, the `literature-*` family) are **left
   alone**; this is not a sweep.
6. **The old name survives as a trigger keyword.** Renaming the id must not
   cost discovery: `tdd`, `be careful`, and `code review` all still route.

Applied: `tdd` → `test-driven-development`, `code-review` →
`responding-to-review`, `careful` → `guarding-destructive-commands`,
`verification` → `verifying-before-done`, `version` → `managing-version`,
`pdf-to-rag-markdown` → `pdf-to-rag`, `finishing-a-development-branch` →
`finishing-development-branch`. Every id in the catalog is now ≤3 words.

## Consequences

- The catalog reads consistently, and `requesting-` / `responding-to-` now
  disambiguate a pair that previously misled.
- Longer ids cost tokens where every skill is listed. `using-dstack`'s body
  budget went 2000 → 2500 as a direct result. That is the price of the
  convention and is accepted.
- **Renames leave orphan folders in installed config dirs**
  (`~/.claude/skills/<old-id>/`). An orphan is a live, stale skill that still
  loads, so it must be removed at install time. The install procedure in
  `README.md` is deliberately additive (no `rm -rf`, no `rsync --delete`),
  so orphan removal is a separate, deliberate step — see that section.
- Historical records are **not** rewritten. ADRs, `docs/plans/*`, benchmark
  reports, and `CHANGELOG.md` keep the ids that were true when written; only
  live/operational files (skills, specs, root docs, tests, live guidance) were
  repointed. Editing an accepted ADR in place is forbidden by CLAUDE.md.
- Third-party copies under `docs/skills-reference/` and vendored reference docs
  (`skills/writing-skills/anthropic-best-practices.md`) are never rewritten —
  they document someone else's catalog.
