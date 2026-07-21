# ADR-0028 — Narrow the project scope back to the renderer; remove non-skill content

- **Status:** Accepted
- **Date:** 2026-07-21
- **Reversibility:** Moderate. The removed content lives in a separate
  private location; re-merging it is possible but reverses the public
  split below.

## Context

[ADR-0026](0026-broaden-project-purpose.md) broadened the stated purpose
to two tracks — the skill catalog renderer, and non-skill personal
content (`docs/hpi-riset/`, draft chapters of an unpublished personal
book; title and contents kept private). That framing was correct while
the repository was private and single-owner: the book and the tool shared
one home.

The owner has decided to publish the renderer as a standalone
open-source project. The book drafts are unpublished personal work and
must not ship in a public repository — not in the working tree and not
in history. Keeping both tracks in one public repo is therefore no longer
viable.

## Decision

Split the two tracks. The renderer stays in this repository; the
non-skill content leaves it.

- **`docs/hpi-riset/` is removed from this repository**, including from
  git history (via `git filter-repo`). The book drafts are preserved in a
  separate private location outside this repo.
- **The project purpose narrows back to renderer-only.** dstack is a
  skill catalog renderer for Claude Code — nothing else. CLAUDE.md,
  README.md, CONTEXT.md, and `docs/README.md` lead with the renderer and
  no longer describe a second, non-skill track.
- **[ADR-0026](0026-broaden-project-purpose.md) is superseded**, not
  reversed in spirit: its "no feature license" clause was always about
  keeping the tool scope frozen, and that constraint still holds. What
  changes is only that the non-skill track is no longer part of *this*
  repository.

## Trade-offs

- `+` The public repository is coherent: one project, one purpose, no
  dangling references to content that is not present.
- `+` Unpublished personal work stays private, in history as well as at
  the tip.
- `-` The owner's wider intent (raise individual performance by skills
  *and* other means) is no longer recorded in this repo. It now lives
  wherever the book does.
- `-` A history rewrite changes every commit hash and requires a
  force-push. Acceptable: the repo is single-owner and was private at the
  time of the rewrite.

## YAGNI guard

Removal only. Do NOT add tooling, ports, or build steps to "manage" the
external book location from here; this repo does not know that location
exists. The renderer's scope is unchanged by this ADR — it was, and
remains, renderer-only.

## Reversibility

Moderate. The content and its history are preserved in a backup outside
this repo, so the book is not lost. But undoing the public split (merging
the book back in) would re-expose it and is not the intent.

## References

- [ADR-0026](0026-broaden-project-purpose.md) — the broadening this ADR
  supersedes.
- [ADR-0002](0002-single-host-v0.md) — tool/host scope, unchanged.
- [docs/plans/v1/DEFERRED.md](../plans/v1/DEFERRED.md) — D8 "not a product
  surface", still in force.
