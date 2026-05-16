# ADR-0006 — Telemetry opt-in, local-only

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Cheap. The telemetry sink is chosen by dependency
  injection. Changing it is a one-line edit.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Telemetry | Recording structured events about program activity. Used for debugging and usage analysis. |
| Sink | The place where telemetry events are stored. Examples: a local file, a remote server. |
| Opt-in | Off by default. The user must perform some action to enable it. |
| Opt-out | On by default. The user must perform some action to disable it. |
| JSONL | "JSON Lines." A file format where each line is one JSON object. |

## Context

A common pattern in developer tooling is "telemetry on by default,
with a prompt on first run." That default is honest and easy to
implement, but it has two drawbacks for dstack specifically:

1. Opt-out defaults bias toward collection. Users who read the prompt
   quickly often accept it. Users who want privacy must remember to
   disable it.
2. Telemetry that stays on the user's local machine has limited value
   for the maintainer (no aggregate view). The privacy-vs-utility
   trade-off is real but small at dstack's scale.

## Decision

dstack telemetry behaves as follows:

- **Off by default.** No prompt on first run. No JSONL file is created.
  No directory under `~/.dstack/` exists unless the user opts in.
- **Opt-in by environment variable.** The user sets
  `DSTACK_TELEMETRY=local` to enable the `FileTelemetry` adapter. That
  adapter writes JSONL events to `~/.dstack/telemetry/events.jsonl`.
  The file rotates when it reaches 10 megabytes (the current file is
  renamed to `.1` and a new file is started).
- **No network sink.** dstack does not send events anywhere. There is
  no remote endpoint. If a future ADR adds one, that decision is a new
  ADR and a major version bump with explicit user consent.

In code:

- The domain emits structured events through the `Telemetry` port.
- The default adapter wired in `main.ts` is `NoopTelemetry`, which
  discards every event.
- Setting `DSTACK_TELEMETRY=local` switches the wiring to
  `FileTelemetry`. This is a one-line change in `main.ts`, driven by
  reading the environment variable.

## Trade-offs

**Upsides (`+`)**

- Clean default behavior. A new user sees no telemetry files or
  prompts.
- One environment variable to enable telemetry. No configuration file
  needed.
- The domain code path is the same regardless of the sink. Easy to
  reason about.
- The privacy story is simple: "off."

**Downsides (`-`)**

- The maintainer cannot learn from real usage unless each user opts in.
  We accept this. We are not optimizing for a large population.
- Debugging questions like "why did the renderer pick this path" are
  harder without an audit trail. To make this easier, the environment
  variable `DSTACK_LOG=debug` enables stderr logging at any time. That
  is independent of telemetry.

## YAGNI guard

Do not add a network telemetry sink "for when we open-source the
project." Open-sourcing is a separate decision and its design is a new
ADR. Adding a network endpoint before there is a real reason invites
integrations that we later cannot remove.

Do not add an "opt-out" prompt. The default is no prompt. A user who
runs dstack without setting `DSTACK_TELEMETRY` has answered "no" by
their choice.

## Reversibility

Cheap. Sink choice is dependency injection. Adding a new sink is one
new adapter file. The behavior of existing sinks is unchanged.

## References

- The choice this ADR makes is about *defaults*, not implementation.
  An opt-out telemetry pipeline is straightforward to build well;
  what matters here is whether the program collects anything at all
  before the user says yes.
