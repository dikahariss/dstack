# dstack

dstack is a skill catalog renderer for Claude Code: it reads skill
definitions from `skills/<id>/`, validates them, and writes
Claude-Code-compatible `SKILL.md` files to `.claude/skills/<id>/`.
Single user, single host.

## Language

**Skill**:
A folder under `skills/<id>/` containing a single `SKILL.md` (YAML
frontmatter + Markdown body) plus optional bundled resources
(`scripts/`, `references/`, `assets/`, free-form). One skill becomes
one slash command in Claude Code. The built-in parser no longer
accepts the legacy v1 layout (`skill.yaml + prompt.md`); use
`bun run dstack migrate-v2` to convert a third-party catalog.
_Avoid_: command, capability, plugin, action.

**Skill spec**:
The parsed, validated form of `SKILL.md`'s frontmatter. Always reaches
the domain already validated — no half-parsed shapes exist downstream
of `FileSkillRepository`. dstack-specific fields live under
`metadata.dstack.*` (type, version, context_budget_tokens, side_effects,
agency, triggers, includes, output_schema); see
[ADR-0014](docs/adr/0014-metadata-namespace.md).
_Avoid_: skill config, metadata, manifest.

**Skill id**:
The short kebab-case identifier of a skill (for example, `guarding-destructive-commands`,
`plan-ceo-review`). Validated by the `SkillId` value object: lowercase
letters, digits, and hyphens; 1 to 64 characters; must start with a
letter.
_Avoid_: skill name, slug.

**Port**:
A TypeScript `interface` defined inside `src/domain/`. Adapters
implement ports. Domain code only references ports, never concrete
adapter classes.
_Avoid_: gateway, abstraction, interface (use "interface" only for the
TypeScript keyword).

**Adapter**:
A concrete class in `src/adapters/` that performs input/output on
behalf of the application. Each adapter implements exactly one port.
Today: `FileSkillRepository`, `FsInstaller`, `ClaudeCodeRenderer`,
`FileTelemetry`, `NoopTelemetry`.
_Avoid_: driver, plugin, backend.

**Renderer**:
An adapter that converts a `Skill` into the file format a specific
host expects. Today only `ClaudeCodeRenderer` exists. Adding a renderer
is how dstack would gain a second host (Codex, Kiro, etc.) — see
[ADR-0002](docs/adr/0002-single-host-v0.md).
_Avoid_: generator, builder, formatter, transformer.

**Installer**:
The adapter responsible for taking render results and placing them on
disk. Today: `FsInstaller`. Idempotent: re-running install with no
skill changes reports "skipped".
_Avoid_: writer, deployer, publisher.

**Host**:
The AI runtime that loads the rendered skills. Today only Claude Code.
Represented in the domain by the `Host` entity, which carries an output
root path and a `ToolRegistry`.
_Avoid_: target, agent, environment.

**Use case**:
A class in `src/application/` that orchestrates ports to fulfill one
user-visible operation. Today: `BuildCatalog`, `BuildSkill`,
`InstallSkills`. Use cases hold no business rules — those live in the
domain.
_Avoid_: service, controller, handler.

**Wiring point**:
`src/adapters/cli/main.ts` — the one file where concrete adapter
instances are constructed and passed to use cases. No other file
imports concrete adapter classes alongside ports. This rule is what
keeps the dependency direction inward.
_Avoid_: bootstrap, composition root, DI container, factory.

**Token budget**:
The hard maximum token count for a skill's *body* at render time.
Declared per-skill under `metadata.dstack.context_budget_tokens`. The
default is 4 000, the ceiling is 5 000 ([ADR-0016](docs/adr/0016-per-tier-token-budget.md)
supersedes ADR-0010's 16 000 total-output limit). Bundled resources
(`scripts/`, `references/`, `assets/`, free-form subfolders) load on
demand and are not counted. Enforced at build time via
`TokenBudgetExceededError`.
_Avoid_: token limit, context limit, prompt size cap.

**Token counter**:
The offline approximation `approximateTokenCount` in
`src/adapters/claude-code/tokens.ts`. Counts as `chars / 4` plus a
5% safety margin, rounded up. Within ±10% of Anthropic's exact
tokenizer, which is well inside the warning margin. Used by the
renderer directly — no port, no factory. See
[`docs/plans/v1/DEFERRED.md`](docs/plans/v1/DEFERRED.md) D11 for the
deferred "exact count on demand" path.
_Avoid_: tokenizer, token measurer.

**Frontmatter**:
The YAML block fenced by `---` at the top of a rendered `SKILL.md`
file. The renderer writes it; the host reads it. Today the renderer
emits four fields: `name`, `version`, `description`, `allowed-tools`.
_Avoid_: header, metadata block.

**Build**:
The `dstack build` command. Renders every skill and writes the result
to `.claude/skills/<id>/SKILL.md`. NOT a TypeScript compile step — the
TypeScript compiler is `bun run typecheck`.
_Avoid_: compile, generate.

**Install**:
The step where the `Installer` adapter writes rendered files to disk.
Local install goes to `<cwd>/.claude/skills/`; global install goes to
`~/.claude/skills/dstack/`. NOT `npm install` — package dependency
installation is `bun install`.
_Avoid_: deploy, publish.

**Render**:
Converting one `Skill` (domain object) into a `RenderResult` (path,
content, token count, warnings). Pure and deterministic: same input
gives the same output. Performed by the `HostRenderer` adapter.
_Avoid_: compile, transform, output.

**Warning**:
A non-fatal observation a renderer emits alongside the render result.
Today's warning kinds: `long-description`, `overlapping-trigger`,
`include-cycle-broken`, `token-near-budget`. Warnings do not fail the
build (see [ROADMAP M5](docs/plans/v1/ROADMAP.md) for surfacing them in
CLI output, and M14 for `--strict` mode that would).
_Avoid_: alert, notice, lint.

**Telemetry**:
A typed event stream emitted by use cases. The default adapter
(`NoopTelemetry`) discards everything. Opt-in via `DSTACK_TELEMETRY=local`
writes JSON lines to `~/.dstack/telemetry/events.jsonl`. Local-only by
design; remote sinks are explicitly out of scope. See
[ADR-0006](docs/adr/0006-telemetry-opt-in.md).
_Avoid_: logging, metrics, analytics.

**Includes**:
A skill's `metadata.dstack.includes` directive in `SKILL.md`, pointing
at shared snippets under `skills/_shared/*.md`. Parsed today but not resolved
yet — see [ROADMAP M3](docs/plans/v1/ROADMAP.md).
_Avoid_: imports, partials, fragments.

## Layers

```
adapter (driving: CLI, future HTTP)
   │
   ▼
application (use cases — orchestration)
   │
   ▼
domain (entities, value objects, ports)
   ▲
   │
adapter (driven: filesystem, Claude Code, telemetry)
```

- **domain** depends on nothing except standard TypeScript types.
- **application** depends only on domain ports.
- **adapter** may depend on domain types, never the other way.
- The **wiring point** (`src/adapters/cli/main.ts`) is the only place
  that imports concrete adapter classes alongside use cases.

## Relationships

- A **Skill** has exactly one **Skill spec** and one prompt body.
- A **Renderer** implements one **Host**'s output format.
- A **Use case** receives **Ports** through its constructor; it never
  constructs adapters itself.
- The **Wiring point** is the only file that knows about both concrete
  adapter classes and the use cases that consume them.
- One **Build** invocation runs `BuildCatalog`, which runs `BuildSkill`
  per skill, then runs `InstallSkills` once.

## Flagged ambiguities

- **"build"** in dstack means "render all skills and write to
  `.claude/skills/`". It is NOT a TypeScript compile step. For type
  checking, run `bun run typecheck`. For building a compiled binary,
  there is no current target (Bun runs TypeScript directly).

- **"install"** in dstack means writing rendered `SKILL.md` files into
  the host's expected location. It is NOT `bun install` (dependency
  install) or `npm install`.

- **"interface"** prefer "port" when referring to a TypeScript
  interface declared in `src/domain/`. Reserve "interface" for
  off-the-shelf TypeScript concepts or external APIs.

- **"ADR"** stands for Architecture Decision Record. Files live in
  `docs/adr/`. Cross-references use the ADR number (for example,
  `ADR-0004`) plus a link into `docs/adr/`.

- **"plan"** as a folder is `docs/plans/`. The word "plan" in prose
  still means roadmap document. The phrase "in the plan" means
  "in `docs/plans/v1/ROADMAP.md`".

- **"warning"** is a structured, typed event with a `WarningKind`. It
  is NOT a `console.warn()` call. Free-form warnings are not in the
  domain vocabulary.

- **"telemetry"** is local-only event recording. It is NOT remote
  analytics or product metrics. Crossing that line requires a new ADR
  per ADR-0006.

## Environment variables

dstack reads one optional environment variable. Defaults work offline
with no setup. Bun auto-loads `.env` if present; `.env` is gitignored
so any local secrets you add later stay local. See
[`.env.example`](.env.example) for the canonical template.

| Variable | Effect |
|---|---|
| `DSTACK_TELEMETRY=local` | Switch from `NoopTelemetry` to `FileTelemetry`. Writes JSONL to `~/.dstack/telemetry/events.jsonl`. See [ADR-0006](docs/adr/0006-telemetry-opt-in.md). |

## How to use this file

If you are an AI agent (Claude, Codex, etc.) starting work in this
repo: read [`CLAUDE.md`](CLAUDE.md) FIRST (rules and forbidden
patterns), then this file (vocabulary), then `docs/ARCHITECTURE.md`
(structure), then the ADR most relevant to your task. Most session
vocabulary lives here; new terms should be added here when they
appear in code review.

If you are a human contributor: skim this once to ground your
vocabulary, then refer back when a term feels overloaded.
