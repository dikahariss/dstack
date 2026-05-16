# ADR-0002 — Single host (Claude Code) at v0

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Cheap. Adding a host is one new adapter file plus
  one line in the host registry.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Host | An AI agent that runs the skills. Examples: Claude Code, Codex, Kiro. Each host expects skills in its own file format. |
| Adapter | Code that turns a `Skill` (domain object) into output that a specific host can read. |
| v0 | "Version zero." The current release. The first numbered version. |

## Context

gstack ships ten host adapters: `claude`, `codex`, `factory`, `kiro`,
`opencode`, `slate`, `cursor`, `openclaw`, `hermes`, `gbrain`. Running
`bun run build` in gstack invokes `gen:skill-docs --host all`. This
command writes one output directory per host:

- `.opencode/skills/gstack/`
- `.kiro/skills/gstack/`
- `.openclaw/skills/gstack/`
- ...and seven more.

The user does not pay attention to seven of these directories. The
generator still produces them. Costs of this default behavior:

1. **Disk usage.** Each host adapter writes its own copy of every
   skill. Ten directories means about 10 times the disk usage compared
   to one directory.
2. **Build time.** The generator loops over all 48 skills, once per
   host. Each loop reads templates, runs resolvers, formats output.
3. **Mental load.** A new user sees nine directories that look like
   waste. The user has to ask "do I need these?"

The current user uses Claude Code only. Every developer we have spoken
to who is not actively building one of the alternative hosts also uses
Claude Code only.

## Decision

Ship one host adapter for v0: Claude Code.

Keep the `HostRenderer` port (interface) in place. The port is defined
in `src/domain/host/ports.ts`. Adding a new host requires:

1. One new adapter file (for example,
   `src/adapters/codex/CodexRenderer.ts`).
2. One line in the registry to wire it.
3. One line at the build command to choose it.

Do not write any of the other host adapters until a real user wants one
of them.

Concrete state today:

- `src/adapters/claude-code/ClaudeCodeRenderer.ts` exists and is wired.
- `src/adapters/codex/`, `src/adapters/kiro/`, and others do not exist.
- The build command renders only registered hosts. There is no `--all`
  flag.

A user who needs multiple hosts adds the adapter, registers it, and gets
multi-host behavior. The cost is one file, not a code restructure.

## Trade-offs

**Upsides (`+`)**

- A clean install creates one output directory, not ten.
- Build time is shorter. The generator loops once, not ten times.
- The codebase shape matches the user's reality. No surprise directories.
- Adding a host later is a small, explicit change.

**Downsides (`-`)**

- A contributor who wants Codex support must write the Codex adapter.
  They cannot pick up an existing adapter from the source tree.
- We give up gstack's "works for everyone" install pitch. dstack is more
  opinionated about its target user.

## YAGNI guard

When a second host arrives, build only that adapter. Do not generalize
to "every host we might ever want." Two real data points (Claude Code
plus one other) are enough to refactor any shared logic if needed. One
data point is not.

If three or more hosts arrive within six months, consider extracting
shared renderer logic into a base class or utility module. Do not
extract this logic before three hosts exist.

## Reversibility

Cheap. To add a host:

1. Create the adapter file under `src/adapters/<host-name>/`.
2. Register it in `src/adapters/cli/main.ts`.
3. Write contract tests against the `HostRenderer` port that both the
   new adapter and `ClaudeCodeRenderer` pass.

The port itself was designed for this case. This ADR only limits which
adapters exist on disk today.

## References

- Direct observation: `ls -la gstack/` shows nine `.<host>/` directories
  that this user has never opened.
- See [ADR-0001](0001-hexagonal-layered.md) for the architecture that
  makes adding a host cheap.
