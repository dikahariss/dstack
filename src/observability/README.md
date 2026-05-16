# `src/observability/` — Observability layer

This folder holds the telemetry system. The domain emits structured
events. This layer decides what to do with them.

## Terms

| Term | Definition |
|---|---|
| Telemetry | Recording structured events about program activity. |
| Event | A typed object describing one thing that happened. Example: `{ kind: 'skill_rendered', skillId: 'ship', tokenCount: 1234 }`. |
| Sink | The place where events are stored or sent. Examples: discarded (no-op), local file. |
| JSONL | "JSON Lines." A file format where each line is one JSON object. |
| Rotation | Moving an old log file out of the way when it grows too large, and starting a new one. |
| Opt-in | The feature is off by default. The user must take an action to enable it. |

## Rules for this folder

1. **Default is silent.** The default telemetry adapter,
   `NoopTelemetry`, discards every event. The user opts in by setting
   an environment variable.
2. **No network calls.** Telemetry stays on the user's machine. If a
   future ADR adds a network sink, that decision is a new ADR plus a
   major version bump.
3. **Structured events.** Telemetry takes typed event objects, not
   format strings. Code calls `telemetry.emit({ kind: 'skill_rendered',
   ... })`, not `telemetry.log("skill rendered: %s", id)`.

## Files in this folder

| File | Purpose |
|---|---|
| `Telemetry.ts` | The `Telemetry` interface (port) plus the `TelemetryEvent` union type. |
| `NoopTelemetry.ts` | The default adapter. Discards every event. |
| `FileTelemetry.ts` | The opt-in adapter. Appends each event as a JSON line to `~/.dstack/telemetry/events.jsonl`. Rotates at 10 megabytes. |

## Wiring

In `src/adapters/cli/main.ts`, the CLI chooses the adapter based on the
environment:

```typescript
const telemetry: Telemetry =
  process.env.DSTACK_TELEMETRY === 'local'
    ? new FileTelemetry(path.join(os.homedir(), '.dstack/telemetry/events.jsonl'))
    : new NoopTelemetry();
```

The chosen adapter is passed to every use case that emits events. Use
cases call `telemetry.emit(event)` without knowing or caring which
adapter is wired.

## Event types today

The `TelemetryEvent` union is a closed set. Adding a new event type
requires editing `Telemetry.ts`, which forces the change to appear in
code review.

| Event kind | Emitted by | Carries |
|---|---|---|
| `skill_rendered` | `BuildSkill` use case | skillId, host name, tokenCount, tokenBudget |
| `catalog_built` | `BuildCatalog` use case | host name, skillCount |
| `skills_installed` | `InstallSkills` use case | outputRoot, written count, skipped count, removed count |
| `build_failed` | (caller of any use case that errors) | errorName, optional skillId |

## What NOT to do in this folder

- **Do not call `console.log` inside the domain.** Domain code emits
  structured events. The adapter decides whether to write them.
- **Do not emit per-iteration telemetry.** One event per use case
  invocation is enough. Per-iteration events become noise.
- **Do not put sensitive data in events.** Skill ids, host names,
  counts, and durations are appropriate. User prompts, file contents,
  and secrets are not.
