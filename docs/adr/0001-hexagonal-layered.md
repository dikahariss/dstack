# ADR-0001 — Hexagonal / layered architecture

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Moderate. To reverse, we would merge ports and
  their adapters back into single files in the application layer.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Layer | A group of code with a clear role. |
| Domain | The layer that holds core types. No file system, no network calls. |
| Application | The layer that holds use cases. A use case is one user-visible operation. |
| Adapter | Code that connects the application layer to outside systems (file system, network). |
| Port | A TypeScript `interface` defined in the domain. Adapters implement ports. |
| DI container | "Dependency Injection container." A library that automatically wires concrete classes to interfaces. dstack does not use one. |

## Context

gstack mixes input/output operations directly into business logic. The
code that renders a skill also reads templates from the file system,
processes them through resolvers, and writes the output. Doing all of
this in one function makes three things harder:

1. Adding a new host (such as Codex) requires changes in 12 or more
   files.
2. Tests of skill rendering need a real file system. A test cannot run
   without a temporary directory and fixture files.
3. Reading the code requires understanding the file system layout. The
   logic is mixed with paths.

A clearer separation would help. The pattern "stable core, varying
adapters" is already present in the gstack codebase (eight host targets,
three install modes, two telemetry backends). The pattern is not
documented or enforced.

## Decision

Adopt hexagonal architecture (also called "ports and adapters"). dstack
splits its code into three layers:

- **`domain/`** — Pure types. Value objects, entities, port interfaces.
  No `import` from outside this layer except built-in TypeScript types
  (`string`, `Date`, `URL`, `Map`, etc.). Tests of domain code run with
  no setup.
- **`application/`** — Use cases. Each use case is a class. The
  constructor receives ports (interfaces). The class orchestrates the
  ports. The class has no business rules of its own; the rules live in
  the domain.
- **`adapters/`** — Concrete code that performs input/output. File
  system access, child processes, HTTP calls, writing to Claude Code's
  expected directory format. Adapters may import domain types. The
  domain may not import adapter types.

All concrete instances of adapters are created in one place:
`src/adapters/cli/main.ts`. This file is the "wiring point." A separate
dependency injection container is not used. Manual wiring is shorter and
easier to read for a project of this size.

## Trade-offs

**Upsides (`+`)**

- Adding a new host requires one adapter file. Existing rendering code
  does not change.
- Domain tests run quickly because they have no file system or network
  dependency. They run in milliseconds.
- Ports force explicit contracts. A developer cannot quietly add a file
  system call inside a domain class.
- The LLM provider, the file format, and the install target can be
  replaced without changes to the domain.

**Downsides (`-`)**

- More files for small features. One port plus one adapter where gstack
  would use a single function.
- Stack traces are longer because of the extra interface layer. Reading
  a stack trace requires understanding the port/adapter relationship.
- Risk of creating ports that have only one implementation. Such ports
  are unnecessary complexity.

## YAGNI guard

Create a port only when one of the following is true:

1. Two or more concrete implementations of the port exist, OR
2. One implementation exists, plus one test fake (a fake adapter used
   only in tests).

A port with one implementation and no test fake is unnecessary. Inline
the call. Wait until the second case actually appears before extracting
a port.

Example of this guard catching a problem: gstack defines a `HostConfig`
interface with ten concrete hosts. Five of those hosts have never been
used by anyone we know. Each one adds a row to the rendering loop and a
directory to the output. The interface is fine. The number of unused
implementations is the problem. See [ADR-0002](0002-single-host-v0.md).

## Reversibility

Moderate. If this design turns out to be wrong, we can merge each port
plus its single adapter back into one file in the application layer.
Each deletion of a port removes one layer of indirection. The cost
scales with how many use cases referenced the port.

## References

- Alistair Cockburn, _Hexagonal Architecture_ (2005). The original paper
  on this pattern.
- The deeper reason for this choice: we want the option to swap
  Claude Code's on-disk format for a model context protocol (MCP)
  server-published manifest at some point. With this design, that swap
  is a new adapter, not a rewrite.
