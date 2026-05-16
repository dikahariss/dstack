# `src/adapters/cli/` — CLI entrypoint

This folder holds the command-line entrypoint for dstack. The CLI
receives commands from the user and dispatches them to the right use
case.

## Terms

| Term | Definition |
|---|---|
| CLI | Command Line Interface. The way users run dstack from a terminal. |
| Entrypoint | The first file that runs when a command is invoked. For dstack: `main.ts`. |
| Wiring | The code that creates concrete adapter instances and passes them to use cases. |
| Subcommand | A specific operation invoked by name. Example: `dstack build`. |
| Port | A TypeScript interface defined by the domain. |
| Adapter | A concrete class that implements a port. |

## Files in this folder

| File | Purpose |
|---|---|
| `main.ts` | Single entrypoint. Parses arguments. Wires adapters. Dispatches to use cases. |
| `scaffold.ts` | `scaffoldSkill()` — creates `skills/<id>/{skill.yaml,prompt.md}` from a template. Used by `dstack new`. |
| `warning-formatter.ts` | `formatWarnings()` + `countWarnings()` — turn `RenderResult.warnings` into greppable CLI output. |

## Commands today

| Command | Use case it runs | What happens |
|---|---|---|
| `dstack build` | `BuildCatalog` + `InstallSkills` | Renders every skill and writes the result to `./.claude/skills/`. Prints warnings grouped by skill. |
| `dstack build --global` | Same as `dstack build`, different output root | Writes to `~/.claude/skills/dstack/` instead. |
| `dstack render <skill-id>` | `BuildSkill` | Renders one skill. Prints the output to standard output. |
| `dstack new <skill-id>` | `scaffoldSkill()` | Creates a new skill directory under `skills/<skill-id>/` from a template. Refuses to overwrite. |
| `dstack install` | (not yet implemented) | Will install previously-rendered output. See `docs/plans/v1/ROADMAP.md`. |

## Wiring

This file is the single point where adapters and use cases meet. All
calls to `new ConcreteAdapter()` happen here. The use cases see only
interfaces.

The wiring code looks like this:

```typescript
const skills = new FileSkillRepository(SKILLS_ROOT);
const renderer = new ClaudeCodeRenderer();
const installer = new FsInstaller();
const telemetry = telemetryFromEnv();

const buildCatalog = new BuildCatalog(skills, renderer, telemetry);
const installSkills = new InstallSkills(installer, telemetry);
```

Adding a port adapter (a new host, a new telemetry sink) means adding
one or two lines at this point. The use cases do not change.

## Rules for this file

Do not put these in `main.ts`:

- **Use case logic.** Use cases live in `src/application/`. The CLI
  invokes them; it does not duplicate their logic.
- **Direct construction of domain entities.** Repositories return
  constructed objects. The CLI does not create `Skill` or `SkillSpec`
  instances by hand.

## Selecting telemetry

The CLI chooses the telemetry adapter at startup, based on environment
variables:

| Environment | Telemetry adapter used |
|---|---|
| `DSTACK_TELEMETRY=local` | `FileTelemetry` (writes JSON-lines to `~/.dstack/telemetry/events.jsonl`) |
| (not set) | `NoopTelemetry` (discards all events) |

See [ADR-0006](../../../docs/adr/0006-telemetry-opt-in.md) for the
reason this is opt-in.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. |
| 1 | A run-time error occurred. The error name and message are printed to stderr. |
| 2 | A usage error. The user invoked the CLI incorrectly. |

## Cross-references

- [docs/specs/skill-spec.md](../../../docs/specs/skill-spec.md) — the
  format the CLI's `render` subcommand displays.
- [docs/specs/host-spec.md](../../../docs/specs/host-spec.md) — the
  host selection wired here.
- [docs/specs/render-spec.md](../../../docs/specs/render-spec.md) — the
  pipeline triggered by `dstack build` and `dstack render`.
- [docs/specs/install-spec.md](../../../docs/specs/install-spec.md) —
  the install behavior the CLI dispatches.
