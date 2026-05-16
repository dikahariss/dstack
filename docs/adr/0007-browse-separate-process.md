# ADR-0007 — browse lives in its own process boundary

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Moderate. browse can be moved into `src/` later
  if needed, by rewiring imports.

## Terms used in this ADR

| Term | Definition |
|---|---|
| browse | A separate package in this project that performs browser automation. Used by skills for testing websites, taking screenshots, scraping. |
| Playwright | A library that controls real browsers (Chromium, Firefox, Safari). https://playwright.dev/ |
| Chromium | An open-source web browser. The base of Google Chrome. Downloaded by Playwright at install time (about 600 megabytes). |
| Process boundary | A line between two programs that run in different operating-system processes. They communicate by inter-process channels (child process, HTTP). |
| Bounded context | A group of code with its own vocabulary, separate from other parts of the system. |
| Daemon | A program that runs in the background, accepting requests. |

## Context

A browser-automation surface for skills (snapshot, click, type,
navigate) is a sizable codebase on its own — comfortably tens of
thousands of lines once it includes a daemon, an HTTP/CLI surface,
session management, and Playwright wiring.

dstack must decide: when this surface is built, does it live in `src/`
(one package, one install) or in a separate package
(`packages/browse/`)?

Option 1 (inline into `src/`) looks neat: one directory, one install.
But it makes every dstack install pull in:

- The Playwright npm package.
- The Chromium binary (about 600 megabytes).
- A long-running daemon process when skills use browse.

Many dstack users will never run a browser-automation skill. They
should not pay these costs.

Option 2 (separate package) preserves a process boundary that matches
the bounded-context design described in the architecture overview.

## Decision

`packages/browse/` is a separate package with:

- Its own `package.json`. The Playwright dependency lives there only.
- Its own bounded context. The domain types are `Session`, `Action`,
  `Snapshot`. The domain types are not `Skill` or `RenderResult`.
- Its own lifecycle: the daemon, the port number, authentication.
- Its own ADRs under `packages/browse/docs/adr/`.

Communication between dstack core and browse happens through one of two
channels:

1. Child process invocation: `browse <command>`. Exits when done.
2. HTTP API: `POST /command` to a running browse daemon. Used for
   long-lived sessions.

The two surfaces are documented in `packages/browse/README.md`. As of
v0, that README is the only thing implemented. Building the actual
package is deferred until a real skill needs it (see DEFERRED.md D4).

## Trade-offs

**Upsides (`+`)**

- A dstack install does not require Playwright or Chromium unless the
  user actually runs browse.
- browse can be upgraded, replaced, or even run on a remote machine
  without changing dstack core or any skill.
- Each package has a smaller, more focused test surface.
- The process boundary is a natural security boundary. browse evaluates
  user-supplied URLs; isolating it from skill rendering is wise.

**Downsides (`-`)**

- Two `package.json` files. Two installs. More setup at first use.
- Sharing TypeScript types across the boundary requires either
  duplication or a shared `@types` package. At v0, we accept
  duplication. Revisit if the cost becomes painful.

## YAGNI guard

Do not extract `browse` into its own git repository until it has a
second consumer besides dstack. One package in one repository is enough
isolation for now.

Do not invent a custom protocol for the inter-process boundary. Use
JSON over standard input/output for short-lived calls. Use HTTP for
long-lived sessions. Both are well-trodden patterns.

## Reversibility

Moderate. To inline `browse` into `src/` later:

1. Move `packages/browse/src/` into `src/browse/`.
2. Merge the `package.json` dependencies.
3. Update imports.

The opposite direction (inlining first, extracting later) is harder.
At this expected size — a server file in the 2 000-line range, a
browser-manager file in the 1 000-line range — extraction from the
start is cheaper than retrofit.

## References

- See [ADR-0008](0008-sandbox-detection-at-adapter.md) for one bug
  that this boundary makes easier to fix.
