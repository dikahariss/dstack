# `docs/` — Documentation index

This folder contains the design and reference documentation for dstack.

## Entry points by audience

| If you are... | Start here |
|---|---|
| New to the project | The root [README.md](../README.md) for a project overview, then [ARCHITECTURE.md](ARCHITECTURE.md) for the layered design. |
| Designing a new skill | [skill-taxonomy.md](skill-taxonomy.md) for the design framework, then [specs/skill-spec.md](specs/skill-spec.md) for the file format. |
| Adding a new AI host | [specs/host-spec.md](specs/host-spec.md), then [ADR-0002](adr/0002-single-host-v0.md) for context. |
| Modifying the renderer | [specs/render-spec.md](specs/render-spec.md). |
| Modifying the installer | [specs/install-spec.md](specs/install-spec.md). |
| Understanding a design choice | [adr/](adr/) — read in number order. |
| Planning v1 work | [`plans/v1/`](plans/v1/). |

## Top-level documents

| File | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | The layered design overview. Layer diagrams, dependency rules, port and adapter list. |
| [skill-taxonomy.md](skill-taxonomy.md) | A reference for choosing how a skill works: four computation types plus six orthogonal design axes. |

## Subdirectories

### `specs/` — Contract specifications

Four documents that define the data shapes and behaviors of dstack.
Each spec covers one bounded concern. The four together describe the
full pipeline.

| Spec | Scope |
|---|---|
| [specs/skill-spec.md](specs/skill-spec.md) | The input format. What a skill is on disk. |
| [specs/host-spec.md](specs/host-spec.md) | The target. What defines an AI host. |
| [specs/render-spec.md](specs/render-spec.md) | The transform. How a skill becomes host-ready output. |
| [specs/install-spec.md](specs/install-spec.md) | The output. How rendered files are written to disk. |

Pipeline reading order:

```
specs/skill-spec.md  ->  specs/host-spec.md  ->
specs/render-spec.md  ->  specs/install-spec.md
```

### `adr/` — Architecture Decision Records

Records documenting non-obvious design choices. Each ADR explains
the context, the decision, the trade-offs, and the reversibility.

| ADR | Topic |
|---|---|
| [0001](adr/0001-hexagonal-layered.md) | Hexagonal / layered architecture |
| [0002](adr/0002-single-host-v0.md) | Single host (Claude Code) at v0 — superseded by [0029](adr/0029-portable-source-consumption.md) |
| [0003](adr/0003-skill-as-data.md) | Skills are YAML + Markdown, not templates |
| [0004](adr/0004-no-template-engine-v0.md) | No template engine, no resolvers |
| [0005](adr/0005-bun-runtime.md) | Bun + TypeScript everywhere |
| [0006](adr/0006-telemetry-opt-in.md) | Telemetry opt-in, local-only |
| [0007](adr/0007-browse-separate-process.md) | browse in its own process boundary |
| [0008](adr/0008-sandbox-detection-at-adapter.md) | Sandbox detection in the adapter |
| [0009](adr/0009-spec-driven-skills.md) | Each skill ships a contract |
| [0010](adr/0010-context-budget.md) | Hard token budget per skill |
| [0011](adr/0011-import-path-aliases.md) | Import path aliases for cross-layer references |
| [0012](adr/0012-frontmatter-align-official.md) | Frontmatter alignment with the official Agent Skills schema |
| [0013](adr/0013-single-file-skill-md.md) | Single-file `SKILL.md` source format |
| [0014](adr/0014-metadata-namespace.md) | `metadata.dstack.*` namespace for extensions |
| [0015](adr/0015-type-taxonomy-adoption.md) | Four-type computation taxonomy in the skill schema |
| [0016](adr/0016-per-tier-token-budget.md) | Per-tier token budgets |
| [0017](adr/0017-bundled-resources.md) | Bundled resource support |
| [0024](adr/0024-catalog-breadth-over-yagni.md) | Catalog breadth for proven reference skills |
| [0025](adr/0025-hybrid-by-default-doctrine.md) | Hybrid-by-default doctrine, governance superseded by 0030 |
| [0026](adr/0026-broaden-project-purpose.md) | Broadened project purpose, later superseded by 0028 |
| [0027](adr/0027-skill-naming-convention.md) | Activity-based skill naming |
| [0028](adr/0028-renderer-only-scope.md) | Renderer-only scope |
| [0029](adr/0029-portable-source-consumption.md) | One renderer, portable source consumption |
| [0030](adr/0030-sonnet5-calibrated-skill-shape.md) | Sonnet-5 calibrated skill shape; ablation replaces the 0025 ratchet |

See [adr/README.md](adr/README.md) for ADR format, status definitions,
and how to add a new ADR.

### `procedures/` — Repeatable operations

Step-by-step operations that produce evidence, or that change state outside
this repo. Read one when you are about to perform it, not before.

| Procedure | Scope |
|---|---|
| [procedures/skill-ablation.md](procedures/skill-ablation.md) | The evidence run a skill must pass before it changes calibration band, in either direction. Required by [ADR-0030](adr/0030-sonnet5-calibrated-skill-shape.md). |
| [procedures/claude-web-skill-sync.md](procedures/claude-web-skill-sync.md) | Getting a changed skill into the claude.ai web account — the one install target that holds a copy this repo cannot reach. |

## How specs, ADRs, and taxonomy relate

These document types serve different purposes and link to each other.

| Type | What it answers | When you read it |
|---|---|---|
| **Spec** | "What is the contract for X?" | When writing or modifying code that produces or consumes X. |
| **ADR** | "Why did we choose this approach instead of another?" | When you disagree with a choice, or when you propose changing it. |
| **Taxonomy** | "How should I think about classifying X when designing it?" | Before writing a new skill. |

A typical reading path for a new contributor:

1. Root [README.md](../README.md) — what is this project.
2. [ARCHITECTURE.md](ARCHITECTURE.md) — how it is organized.
3. [skill-taxonomy.md](skill-taxonomy.md) — how to think about skills.
4. [specs/skill-spec.md](specs/skill-spec.md) — how to write one.
5. The remaining specs as needed.
6. [adr/](adr/) for any choice that surprises you.

## Other documents in dstack outside `docs/`

| Location | Purpose |
|---|---|
| `../README.md` | Project overview. The first file a new reader sees. |
| `plans/v1/` | Status, roadmap, deferred items for the next version. |
| `../src/<layer>/README.md` | Per-layer rules and conventions. |
| `../test/README.md` | Test strategy. |
| `../packages/browse/README.md` | Planned browser-automation package (not yet implemented). |
