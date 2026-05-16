# dstack v1 — Plan

A living plan that describes how to move dstack from version 0 (v0) to
version 1 (v1).

- v0 means: the architecture works end-to-end on a small example (two
  skills, all tests passing).
- v1 means: dstack is useful day-to-day. The user can replace the most
  important gstack workflows with dstack.

This plan can change. When reality differs from the plan, update the
plan instead of letting the plan become wrong.

## Status as of 2026-05-13

| Surface | State | Notes |
|---|---|---|
| Architecture docs | Done | 10 ADRs + ARCHITECTURE + 2 specs (about 1,500 lines). |
| Domain layer + ports | Done | Every entity type and port interface is defined. |
| Use cases | Done | `BuildSkill`, `BuildCatalog`, `InstallSkills`. |
| Adapters | Done | Claude Code renderer, file system repository, file system installer, CLI. |
| Observability | Done | `Telemetry` port plus the default no-op adapter plus the opt-in file adapter. |
| Skills written | Partial | 2 of N skills exist: `example-greet`, `careful` (ported from gstack). |
| Tests | Done | 14 tests pass (8 unit, 6 contract). 0 fail. Total runtime 75 milliseconds. |
| Type check | Done | `bun run typecheck` runs with no errors. |
| Rendered end-to-end | Done | `bun run build` writes `.claude/skills/<skill-id>/SKILL.md`. |
| Ready for daily use | Not yet | Blocked on milestones M1 through M6. |

**Total project size**: 61 files, about 3,000 lines.

## Documents in this folder

| File | Purpose |
|---|---|
| [DONE.md](DONE.md) | An honest inventory of what shipped in v0. |
| [ROADMAP.md](ROADMAP.md) | The list of work for v1, in priority order. |
| [DEFERRED.md](DEFERRED.md) | What is explicitly NOT in v1, and the conditions under which we would revisit each item. |

## What "v1 done" means

dstack reaches v1 when all of the following are true:

1. Architecture is documented and stable. (Done in v0.)
2. A use case is testable end to end. (Done in v0.)
3. At least 5 skills are ported or written. (Milestone M1.)
4. Token counting uses Anthropic's real tokenizer, not the
   approximation used today. (Milestone M2.)
5. The `includes:` directive in `skill.yaml` actually resolves files.
   (Milestone M3.)
6. The command `dstack validate` catches broken skills before
   rendering them. (Milestone M4.)
7. Renderer warnings appear in the CLI output, not just in objects.
   (Milestone M5.)
8. A `VERSION` file and a `CHANGELOG.md` exist. The CHANGELOG is
   updated whenever a user-visible change ships. (Milestone M6.)

Items M7 through M12 ("should-have") are valuable but not required for
v1. They can ship in v1.1 or later.

## Working rules for this plan

- **One change per ADR.** If a milestone changes a decision that has
  an ADR, the milestone ships with its own new ADR.
- **Effort is measured in "AI-pair time."** This is the time spent by
  one person working with Claude as a coding partner. For a human team
  working without AI, multiply by about 30.
- **The plan is editable.** If reality moves, update this plan. Do not
  let the plan drift quietly out of sync with the code.
- **Mark items done in `ROADMAP.md`** when they land. Move stale items
  to `DEFERRED.md` with a one-line reason.
