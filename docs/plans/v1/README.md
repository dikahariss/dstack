# dstack v1 — Plan

A living plan that describes how to move dstack from the v0 baseline
toward v1.

- **v0 baseline** means: the architecture works end-to-end on a small
  example (one skill, all tests passing). Initial commit `a730e96`.
- **v0.1.0** is the first tagged release. It adds CLI warning
  surfacing, error `file:line` context, `dstack new`, `CONTEXT.md`,
  and the `VERSION`/`CHANGELOG.md` discipline. The real-tokenizer
  milestone (M2) was explored end-to-end and removed; the offline
  approximate counter is now the only counter.
- **v1** means: dstack is useful day-to-day. The user runs the most
  important workflows through dstack.

This plan can change. When reality differs from the plan, update the
plan instead of letting the plan become wrong.

## Status as of 2026-05-16

| Surface | State | Notes |
|---|---|---|
| Architecture docs | Done | 10 ADRs + ARCHITECTURE + 4 specs + CONTEXT.md. |
| Domain layer + ports | Done | Stable since v0 baseline. |
| Use cases | Done | `BuildSkill`, `BuildCatalog`, `InstallSkills`. |
| Adapters | Done | Claude Code renderer, file system repository, file system installer, CLI. |
| Observability | Done | `Telemetry` port plus the default no-op adapter plus the opt-in file adapter. |
| Skills written | Partial | 1 of N skills exists: `careful`. |
| Tests | Done for current surface | 40 pass, 0 fail. About 100 ms total. 6 files. |
| Type check | Done | `bun run typecheck` runs with no errors under strict mode. |
| Rendered end-to-end | Done | `bun run build` writes `.claude/skills/<skill-id>/SKILL.md` and surfaces renderer warnings. |
| Ready for daily use | Not yet | Blocked on milestones M1, M3, M4 (M5, M6, M15 shipped in v0.1.0). |

**Total project size**: about 80 files, about 7,200 lines.

## Documents in this folder

| File | Purpose |
|---|---|
| [DONE.md](DONE.md) | An honest inventory of what exists today (v0 baseline plus v0.1.0). |
| [ROADMAP.md](ROADMAP.md) | The list of work remaining for v1, in priority order. |
| [DEFERRED.md](DEFERRED.md) | What is explicitly NOT in v1, and the conditions under which we would revisit each item. |

## What "v1 done" means

dstack reaches v1 when all of the following are true:

1. Architecture is documented and stable. (Done in v0 baseline.)
2. A use case is testable end to end. (Done in v0 baseline.)
3. At least 5 skills are ported or written. (Milestone M1.)
4. The `includes:` directive in `skill.yaml` actually resolves files.
   (Milestone M3.)
5. The command `dstack validate` catches broken skills before
   rendering them. (Milestone M4.)
6. Renderer warnings appear in the CLI output, not just in objects.
   (Milestone M5 — **shipped in v0.1.0**.)
7. A `VERSION` file and a `CHANGELOG.md` exist. The CHANGELOG is
   updated whenever a user-visible change ships. (Milestone M6 —
   **shipped in v0.1.0**.)
8. Errors carry `file[:line]` source location so a user can click into
   the offending file. (Milestone M15 — **shipped in v0.1.0**.)

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
- **Move shipped items to `DONE.md`** when they land. Move stale items
  to `DEFERRED.md` with a one-line reason.
