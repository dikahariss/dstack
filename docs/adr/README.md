# Architecture Decision Records

An Architecture Decision Record (ADR) is one Markdown file that documents
one design choice. ADRs explain why dstack is built the way it is. They
are not a changelog of code changes.

## When to write an ADR

Write an ADR when the choice is:

- Non-obvious. A reader would not guess this choice from the code alone.
- Hard to reverse. Undoing the choice would require changes across
  multiple files or layers.
- A constraint on future code. The choice limits what later changes can
  do.

Trivial choices (variable names, file ordering, single-function bug
fixes) do not need ADRs.

## Format

Each ADR has six sections. Aim for under 80 lines per ADR.

| Section | Purpose |
|---|---|
| **Context** | What is true today. Why the question came up. What problem prompted this decision. |
| **Decision** | What we chose. Written in imperative voice (for example, "Adopt X" instead of "We will adopt X"). |
| **Trade-offs** | Both directions. List the upsides (marked `+`) and the downsides (marked `-`). |
| **YAGNI guard** | YAGNI stands for "You Aren't Gonna Need It." This section says when this pattern stops being correct, and when not to apply it. |
| **Reversibility** | How hard it is to undo this decision later. See the scale below. |
| **Status** | One of: Proposed, Accepted, Superseded by ADR-XXXX. |

## Reversibility scale

| Value | Meaning |
|---|---|
| **Cheap** | Can be reversed in one or two files. Less than one day of work. |
| **Moderate** | Can be reversed in less than one week of work. Touches multiple files but no public contracts change. |
| **Expensive** | Reversal would require a rewrite. Tooling, language, runtime choices. More than one week of work. |

## Status values

| Value | Meaning |
|---|---|
| **Proposed** | Draft. Under discussion. Not yet in force. |
| **Accepted** | In force. The codebase follows this decision. |
| **Superseded by ADR-XXXX** | No longer in force. Replaced by a newer ADR. The number after "by" points to the replacement. |

## Numbering rules

- ADRs are numbered in the order they are written.
- Once an ADR is accepted, do not edit it. Write a new ADR that
  supersedes it.
- Do not renumber ADRs. Renumbering breaks cross-references and is not
  useful to readers.

## Index

| Number | Title | Status | Reversibility |
|---|---|---|---|
| [0001](0001-hexagonal-layered.md) | Hexagonal/layered architecture | Accepted | Moderate |
| [0002](0002-single-host-v0.md) | Single host (Claude Code) at v0 | Accepted | Cheap |
| [0003](0003-skill-as-data.md) | Skills are YAML+Markdown, not templates | Accepted | Moderate |
| [0004](0004-no-template-engine-v0.md) | No template engine, no resolvers | Accepted | Cheap |
| [0005](0005-bun-runtime.md) | Bun + TypeScript everywhere | Accepted | Expensive |
| [0006](0006-telemetry-opt-in.md) | Telemetry opt-in, local-only | Accepted | Cheap |
| [0007](0007-browse-separate-process.md) | browse in its own process | Accepted | Moderate |
| [0008](0008-sandbox-detection-at-adapter.md) | Sandbox detection in adapter | Accepted | Cheap |
| [0009](0009-spec-driven-skills.md) | Skills ship a contract | Accepted | Cheap |
| [0010](0010-context-budget.md) | Hard token budget per skill | Superseded by [0016](0016-per-tier-token-budget.md) | Cheap |
| [0011](0011-import-path-aliases.md) | Import path aliases for cross-layer references | Accepted | Cheap |
| [0012](0012-frontmatter-align-official.md) | Frontmatter alignment with official Agent Skills schema | Accepted | Cheap |
| [0013](0013-single-file-skill-md.md) | Single-file `SKILL.md` source format | Accepted | Cheap |
| [0014](0014-metadata-namespace.md) | `metadata.dstack.*` namespace for non-standard fields | Accepted | Cheap |
| [0015](0015-type-taxonomy-adoption.md) | Adopt four-type computation taxonomy in skill schema | Accepted | Moderate |
| [0016](0016-per-tier-token-budget.md) | Per-tier token budget (body ≤ 5000, bundled unlimited) | Accepted | Cheap |
| [0017](0017-bundled-resources.md) | Bundled resources support (scripts/, references/, assets/) | Accepted | Moderate |
| [0024](0024-catalog-breadth-over-yagni.md) | Catalog breadth over strict YAGNI for proven reference skills | Accepted | Cheap |
| [0025](0025-hybrid-by-default-doctrine.md) | Hybrid by default: spine + judgment + calibration flag | Accepted | Cheap |
| [0026](0026-broaden-project-purpose.md) | Broaden project purpose: skills + non-skill content | Accepted | Cheap |
| [0027](0027-skill-naming-convention.md) | Skill names state the activity; no bare abbreviations or adjectives | Accepted | Cheap |

*Numbers 0018–0023 are reserved for v3 milestones (see
[v3 ROADMAP](../plans/v3/ROADMAP.md), M41–M48/M59) and are not yet
written. 0024 skips ahead to avoid colliding with those reservations,
per the "do not renumber" rule above.*

## How to add a new ADR

1. Copy `0001-hexagonal-layered.md` to `NNNN-short-slug.md` where `NNNN`
   is the next number.
2. Fill in the six sections.
3. Add a row to the index above.
4. If the decision changes the system shape, also reference it from
   `docs/ARCHITECTURE.md`.

## How to reverse an ADR

To reverse or change an accepted ADR:

1. Write a new ADR with a higher number.
2. In the Context section, explain what changed in reality (not what
   changed in your opinion).
3. In the Decision section, state the new choice.
4. Set the old ADR's Status to "Superseded by ADR-XXXX" by writing a
   new replacement file. Do not delete the old ADR.

If an ADR is reversed, both the old and the new ADR are kept. Readers
following an old link should see why the choice changed.
