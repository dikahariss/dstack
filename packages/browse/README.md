# `packages/browse/` — Browser automation (planned)

This folder is reserved for a future browser-automation package. The
package is not implemented in v0. Only this README exists.

See [ADR-0007](../../docs/adr/0007-browse-separate-process.md) for the
reasoning behind keeping browse as a separate package.

## Terms

| Term | Definition |
|---|---|
| Browser automation | Software that controls a real web browser. Used to load pages, click elements, type text, take screenshots. |
| Playwright | A library that performs browser automation by controlling Chromium, Firefox, or Safari. https://playwright.dev/ |
| Chromium | An open-source web browser. Downloaded by Playwright at install time (about 600 megabytes). |
| Bounded context | A group of code with its own vocabulary, separate from the rest of the system. |
| Process boundary | A line between two programs that run in separate operating-system processes. They communicate by inter-process channels. |

## What this package will do

When implemented, `packages/browse/` will provide a tool that skills
can call to:

- Load a URL.
- Click an element on the page.
- Fill in form fields.
- Take a screenshot.
- Extract text from the page.
- Run JavaScript on the page.
- Check console logs and network requests.

A full implementation runs on the order of 20 000 to 25 000 lines of
TypeScript (a daemon, an HTTP/CLI surface, session management, and
Playwright wiring).

## Why this package is separate

If browser automation lived inside `src/`, every dstack install would
download:

- The Playwright npm package.
- The Chromium binary (about 600 megabytes).
- A long-running daemon process when skills use the browser.

Many dstack users will never run browser automation. They should not
pay these costs. By keeping browse in a separate package, dstack's
core install is small. Users opt into browser automation by installing
this package separately.

## How dstack core and browse will communicate

Two communication channels:

| Channel | Use case |
|---|---|
| Child process | Short, one-shot calls. Example: `browse goto https://example.com`. The process exits after the command finishes. |
| HTTP API | Long-lived sessions. The browse daemon runs in the background. Other programs send `POST /command` requests to it. |

Both styles are standard for Playwright-based browser tools.

## Planned directory layout

When implemented, `packages/browse/` will contain:

```
packages/browse/
├── README.md            # This file.
├── package.json         # Playwright dependency lives here, not in dstack core.
├── docs/
│   └── adr/             # browse-specific ADRs.
├── src/
│   ├── domain/          # browse types: Session, Action, Snapshot.
│   ├── application/     # use cases: Goto, Click, Snapshot.
│   └── adapters/
│       ├── playwright/  # Playwright adapter, including sandbox detection (see ADR-0008).
│       └── http/        # HTTP daemon.
└── test/
```

## Bounded context

browse has its own vocabulary, separate from dstack core.

| Concept | Owner |
|---|---|
| `Skill`, `RenderResult` | dstack core (`src/domain/`) |
| `Session`, `Action`, `Snapshot` | browse (will live in `packages/browse/src/domain/`) |

browse does not know what a Skill is. Skills that use browse invoke
its CLI; the skill knows how to call browse, but the skill does not
know how browse works internally.

## v0 deliverable

This README is the v0 deliverable.

The actual implementation is deferred. It will happen when a real v1
skill needs browser automation.

See [`docs/plans/v1/DEFERRED.md`](../../docs/plans/v1/DEFERRED.md) entry D4.

## Type sharing across the boundary

The two packages may need to share TypeScript types. The chosen
approach for v0:

- Duplicate types between packages.
- Accept the small maintenance cost.

A shared `@types` package is overhead until a second consumer (other
than dstack and browse) exists.
