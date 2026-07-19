# Architecture

This document describes how dstack is organized. dstack uses a layered
design also known as "hexagonal" or "ports and adapters." The rules of
this design are described below.

## Terms used in this document

| Term | Definition |
|---|---|
| Layer | A group of code with a clear role. Layers depend on each other in one direction only. |
| Domain | The layer that holds core types and business rules. No file system, no network. |
| Application | The layer that contains use cases. A use case is one user-visible operation. |
| Adapter | Code that connects the application layer to outside systems (file system, network, Claude Code). |
| Port | An interface (a TypeScript `interface`) that the domain defines. Adapters implement ports. |
| Dependency direction | Which layer is allowed to import code from which other layer. |
| Entity | A domain type that has identity and may have invariants (rules that must always hold). |
| Value object | A domain type without identity. Equal-by-value. Immutable. |
| Aggregate | An entity plus the data it owns. Treated as one unit. |
| Use case | One operation a user runs. Example: "build all skills." |
| Frontmatter | The YAML block at the top of a Markdown file, between `---` fences. |
| Wiring | The code that creates concrete adapter instances and passes them to use cases. Wiring lives in `src/adapters/cli/main.ts`. |

## Layers and dependency direction

dstack has four layers. Each layer is a group of folders under `src/`.
The arrow shows what each layer is allowed to depend on.

```
+--------------------------------------------------------------+
|  Driving adapters (input)                                    |
|    src/adapters/cli/main.ts — the command-line entrypoint    |
|    (Future: HTTP server, MCP server)                         |
+----------------------+---------------------------------------+
                       | depends on
                       v
+--------------------------------------------------------------+
|  Application layer (use cases)                               |
|    src/application/BuildCatalog.ts                           |
|    src/application/BuildSkill.ts                             |
|    src/application/InstallSkills.ts                          |
|                                                              |
|  Each use case is one class. The class receives ports        |
|  through its constructor. The class has no file system       |
|  calls, no network calls, no process spawning.               |
+----------------------+---------------------------------------+
                       | depends on
                       v
+--------------------------------------------------------------+
|  Domain layer (entities, value objects, ports)               |
|    src/domain/skill/Skill.ts                                 |
|    src/domain/skill/SkillSpec.ts                             |
|    src/domain/skill/SkillId.ts                               |
|    src/domain/host/Host.ts                                   |
|    src/domain/render/RenderContext.ts                        |
|    src/domain/render/RenderResult.ts                         |
|                                                              |
|  Ports defined here:                                         |
|    SkillRepository, HostRenderer, Installer, Telemetry       |
|                                                              |
|  No imports outside this layer except standard types         |
|  (string, Date, URL, Map, etc.). No fs, no fetch.            |
+----------------------^---------------------------------------+
                       | implemented by
                       |
+--------------------------------------------------------------+
|  Driven adapters (output)                                    |
|    src/adapters/fs/FileSkillRepository.ts                    |
|    src/adapters/fs/FsInstaller.ts                            |
|    src/adapters/claude-code/ClaudeCodeRenderer.ts            |
|    src/observability/FileTelemetry.ts                        |
|    src/observability/NoopTelemetry.ts                        |
+--------------------------------------------------------------+
```

The rule is: **arrows point inward, toward the domain.** The domain layer
does not know that adapters exist. The application layer only knows
ports (interfaces). Concrete adapter classes are created at one point
in the code, called `main.ts` (the wiring point).

## Bounded contexts

A "bounded context" is a group of types that belong together and share a
vocabulary. dstack has two bounded contexts.

| Context | Where the code lives | How it communicates with dstack core |
|---|---|---|
| dstack core (skill catalog) | `src/` | Direct file system writes |
| browse (browser automation) | `packages/browse/` (planned, not yet implemented) | Child process or HTTP request |

Reason for the split: the browse package will depend on the Playwright
library and will download a Chromium browser (about 600 megabytes). If
browse were inside `src/`, every install of dstack would pull in Playwright
and Chromium, even when the user does not run browser automation. The
split keeps these dependencies isolated. See
[ADR-0007](adr/0007-browse-separate-process.md).

## Domain types in detail

```
                    Skill (aggregate)
                    -----------------
                    + spec: SkillSpec
                    + prompt: string


SkillSpec (value object)        Host (entity)
-----------------------         -------------
+ id: SkillId                   + name: HostName
+ version: string               + outputRoot: string (file path)
+ description: string           + tools: ToolRegistry
+ tools: string[]
+ contextBudgetTokens: number
+ triggers: string[]
+ includes: string[]


RenderContext (input to renderer)        produces       RenderResult (output)
---------------------------------       ---------->     ----------------------
+ host: Host                                            + path: string
+ skill: Skill                                          + content: string
+ tokenBudget: number                                   + tokenCount: number
+ now: Date                                             + warnings: Warning[]
```

- `Skill` is the aggregate: a complete skill in memory, ready to render.
- `SkillSpec` is the parsed contents of `skill.yaml`.
- `Host` is the target AI agent that will consume the rendered skill.
  Currently only one Host exists: `claude-code`.
- `RenderContext` is the input to the renderer. It includes the current
  date so that rendering is fully deterministic — the same input always
  produces the same output.
- `RenderResult` is the output. It does not perform any file write. The
  Installer adapter does that.

## Ports

A port is a TypeScript `interface`. The domain defines ports. Adapters
implement them. Each port has one clear job.

| Port | Defined in | Implementations today |
|---|---|---|
| `SkillRepository` | `src/domain/skill/ports.ts` | `FileSkillRepository` |
| `HostRenderer` | `src/domain/host/ports.ts` | `ClaudeCodeRenderer` |
| `Installer` | `src/domain/host/ports.ts` | `FsInstaller` |
| `Telemetry` | `src/observability/Telemetry.ts` | `NoopTelemetry`, `FileTelemetry` |

**Rule for creating new ports**: do not add a port until either two
concrete implementations exist, or one implementation plus one test fake
exists. A port with one implementation and no test fake is unnecessary
complexity. Inline the call. Extract a port only when you actually need
to replace the concrete code. See [ADR-0001](adr/0001-hexagonal-layered.md).

## Use cases (application layer)

Each use case is one class. The constructor takes its required ports.
The class has one public method named `execute`.

```typescript
class BuildSkill {
  constructor(
    private readonly skills: SkillRepository,
    private readonly renderer: HostRenderer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: { skillId: SkillId; host: Host; now: Date }):
      Promise<RenderResult> {
    // Load the skill from the repository.
    // Check that all tools the skill declares are known to the host.
    // Call the renderer.
    // Check that the result fits the token budget.
    // Return the result.
  }
}
```

This pattern keeps two things explicit:

1. Which ports each use case needs (the constructor lists them).
2. What information the operation takes as input (the method parameter).

Tests of use cases create fake ports and pass them into the constructor.
No real file system, no real Claude Code installation needed for the test.

## Specifications

The contracts of dstack live in four specification documents under
`docs/specs/`. Each spec covers one bounded concern.

| Specification | Scope |
|---|---|
| [specs/skill-spec.md](specs/skill-spec.md) | The input format. What a skill is on disk: directory layout, `skill.yaml` schema, `prompt.md` rules, validation. |
| [specs/host-spec.md](specs/host-spec.md) | The target. What defines an AI host: tool registry, frontmatter contract, output root, how to add a host. |
| [specs/render-spec.md](specs/render-spec.md) | The transform. How a skill becomes output for a host: the five-step pipeline, errors, warnings, determinism guarantee. |
| [specs/install-spec.md](specs/install-spec.md) | The output. How rendered output reaches disk: atomic write, idempotency, orphan removal, path policy. |

These four specs map to the four domain concerns of dstack. Read them
in the order above to understand the full pipeline:

```
skill-spec      host-spec       render-spec     install-spec
  (input)   ->   (target)   ->  (transform)  ->  (output)
```

## Code taxonomy reference

For decisions at the function and file level — function vs class,
inline vs constant, helper extraction, error handling, comments,
imports — see [code-taxonomy.md](code-taxonomy.md). That document
captures the project's defaults and the exceptions ADR-0001,
ADR-0006, and ADR-0011 justify.

## Skill taxonomy reference

When deciding **how** to design a new skill (not just **what** it does),
read [skill-taxonomy.md](skill-taxonomy.md). That document describes:

- Four computation types: Deterministic, Open-ended Semantic, Hybrid,
  Schema-constrained Semantic.
- Six independent design axes: knowledge source, temporal pattern,
  coordination, statefulness, agency level, side-effect profile.

The taxonomy is a reference for design thinking. It is not enforced by
the `skill.yaml` schema today. Adding taxonomy fields to the schema
would require a new ADR. The four specs listed above describe possible
adoption points:

- `skill-spec.md` Section "Computation type" — the schema field that
  would carry the taxonomy choice.
- `render-spec.md` Section "Computation type and the renderer" — how
  rendering would change per type.
- `host-spec.md` — how host capabilities (such as tool use for
  schema-constrained output) relate to taxonomy types.

## Cross-cutting concerns

Three concerns appear in many parts of the code. Each is handled in one
specific place.

### Observability

The domain emits typed events (for example,
`{ kind: 'skill_rendered', skillId: '...', tokenCount: 1234 }`). The
`Telemetry` port receives these events. The default implementation is
`NoopTelemetry`, which discards every event. Setting the environment
variable `DSTACK_TELEMETRY=local` switches to `FileTelemetry`, which
appends events to `~/.dstack/telemetry/events.jsonl`. See
[ADR-0006](adr/0006-telemetry-opt-in.md).

### Security

Adapters that touch the file system check paths against an allowed list.
The domain never sees absolute paths. See `src/adapters/fs/paths.ts` and
the function `assertAllowed`.

### Versioning

Each `skill.yaml` carries a `version` field. The renderer copies this
into the output frontmatter. A future cache or rollback feature can use
the version to detect changes.

### LLM integration

The body of `prompt.md` is plain Markdown. The renderer does not
substitute variables, does not call an LLM at render time, and does not
inject hidden instructions. The output file is the body, prefixed with
host-specific frontmatter.

## ADR index

Every non-obvious design choice has an Architecture Decision Record (ADR).
Read in number order if you want the full reasoning.

| Number | Title | Status |
|---|---|---|
| [0001](adr/0001-hexagonal-layered.md) | Hexagonal/layered architecture | Accepted |
| [0002](adr/0002-single-host-v0.md) | Single host (Claude Code) at v0 | Accepted |
| [0003](adr/0003-skill-as-data.md) | Skills are YAML+Markdown, not templates | Accepted |
| [0004](adr/0004-no-template-engine-v0.md) | No template engine, no resolvers at v0 | Accepted |
| [0005](adr/0005-bun-runtime.md) | Bun + TypeScript everywhere; no bash orchestrator | Accepted |
| [0006](adr/0006-telemetry-opt-in.md) | Telemetry opt-in, local-only | Accepted |
| [0007](adr/0007-browse-separate-process.md) | browse lives in its own process boundary | Accepted |
| [0008](adr/0008-sandbox-detection-at-adapter.md) | Sandbox detection in adapter, not domain | Accepted |
| [0009](adr/0009-spec-driven-skills.md) | Each skill ships a contract (inputs/outputs/tools) | Accepted |
| [0010](adr/0010-context-budget.md) | Hard token budget per rendered skill | Superseded by [0016](adr/0016-per-tier-token-budget.md) |
| [0011](adr/0011-import-path-aliases.md) | Import path aliases for cross-layer references | Accepted |
| [0012](adr/0012-frontmatter-align-official.md) | Frontmatter alignment with official Agent Skills schema | Accepted |
| [0013](adr/0013-single-file-skill-md.md) | Single-file `SKILL.md` source format | Accepted |
| [0014](adr/0014-metadata-namespace.md) | `metadata.dstack.*` namespace for non-standard fields | Accepted |
| [0015](adr/0015-type-taxonomy-adoption.md) | Adopt four-type computation taxonomy in skill schema | Accepted |
| [0016](adr/0016-per-tier-token-budget.md) | Per-tier token budget (body ≤ 5000, bundled unlimited) | Accepted |
| [0017](adr/0017-bundled-resources.md) | Bundled resources support (scripts/, references/, assets/) | Accepted |
| [0024](adr/0024-catalog-breadth-over-yagni.md) | Catalog breadth over strict YAGNI for proven reference skills | Accepted |
| [0025](adr/0025-hybrid-by-default-doctrine.md) | Hybrid by default: spine + judgment + calibration flag | Accepted |
| [0026](adr/0026-broaden-project-purpose.md) | Broaden project purpose: skills + non-skill content | Accepted |
| [0027](adr/0027-skill-naming-convention.md) | Skill names state the activity; no bare abbreviations or adjectives | Accepted |

"Accepted" means the decision is in force. If we change our minds, we
write a new ADR that supersedes the old one. We do not edit accepted
ADRs.

## Testing strategy (summary)

Three test tiers:

1. **Unit tests.** Cover domain entities and value objects. No file
   system, no network. All unit tests run in under 50 milliseconds total.
2. **Contract tests.** Every adapter that implements a port must pass
   the same shared test suite for that port. This catches differences
   between two implementations of the same port.
3. **Integration tests.** One full use case wired with real adapters,
   running against a temporary directory. Slowest tier; still under 2
   seconds.

LLM-judge evaluations (where a separate LLM scores the output of a skill)
are not part of v0 testing. See ADR-0009 and `docs/plans/v1/DEFERRED.md`.
