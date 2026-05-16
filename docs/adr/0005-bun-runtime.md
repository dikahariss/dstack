# ADR-0005 — Bun + TypeScript everywhere; no bash orchestrator

- **Status:** Accepted
- **Date:** 2026-05-13
- **Reversibility:** Expensive. Switching runtime or language would
  require a rewrite.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Bun | A JavaScript runtime, package manager, test runner, and bundler. Like Node.js but newer and faster. https://bun.sh/ |
| Runtime | The program that executes our TypeScript code. dstack uses Bun. |
| Orchestrator | A script that combines several separate steps into one user-facing command. |
| CLI | "Command Line Interface." The way users invoke dstack from a terminal. |

## Context

The gstack install script `setup` is 1044 lines of bash. It performs
nine separate jobs in one file:

1. Validating required programs are installed (Bun, git).
2. Parsing command-line flags (`--host`, `--local`, `--prefix`).
3. Building binaries (`browse`, `find-browse`, `design`, `pdf`).
4. Detecting whether the script is running inside a Conductor
   workspace (a git-related tool gstack supports).
5. Migrating skills that were installed in an older location.
6. Creating symbolic links from one skill directory to another.
7. Installing Playwright Chromium (a browser used by gstack tools).
8. Saving configuration values to disk.
9. Cleaning up old symbolic links from earlier installs.

Each job is reasonable on its own. The cost of putting them all in one
bash script:

- Hard to read. A reader must scroll through 1044 lines to find one
  topic.
- Hard to test. Bash testing tools exist but the code is not structured
  for them.
- Hard to extend. Adding a new step risks breaking adjacent steps,
  because there are few interfaces between them.

## Decision

dstack has no bash scripts. The CLI is one TypeScript file:
`src/adapters/cli/main.ts`. This file dispatches subcommands to use
cases.

Bun is the runtime, for these reasons:

- Bun runs TypeScript files directly. No separate compile step.
- Bun includes a test runner (`bun test`). No separate test framework
  installation.
- Bun includes a compile-to-binary command (when we need a single-file
  binary, which is not in v0).
- Bun is already used by gstack. The user is familiar with its tooling.

Subcommands today:

```bash
bun run dstack build              # Render all skills, install to default location
bun run dstack render <skill-id>  # Render one skill and print to stdout
bun run dstack install --local    # Install rendered output to ./.claude/skills/
bun run dstack install --global   # Install rendered output to ~/.claude/skills/dstack/
```

The install path is:

```bash
bun install
bun run dstack install --local
```

Two commands. No bash script.

## Trade-offs

**Upsides (`+`)**

- One language across the project. Less context-switching between bash,
  TypeScript, and other tools.
- Static type checking from the CLI all the way down to the renderer.
  TypeScript catches errors at compile time that bash would not catch.
- Tests are written and run with `bun test`. No `bats` (bash test
  framework) or separate test installation.
- Refactoring is safer. `tsc --noEmit` catches breakage that bash would
  let through silently.

**Downsides (`-`)**

- Bun is younger than Node.js. Some Bun-specific APIs may have rough
  edges that Node.js APIs would not have.
- Users without Bun must install it. Installation is one shell command,
  but it is one extra step.
- TypeScript startup time is slower than bash for very small commands.
  This is not relevant for skill rendering (which already takes time
  for I/O), and we can compile to a binary later if startup ever
  becomes a real cost.

## YAGNI guard

Do not introduce a separate build pipeline. Bun runs `.ts` files
directly. If we need to ship a single binary to a machine without Bun,
use `bun build --compile`. That is one command, not a pipeline.

Do not introduce a dependency injection container. Manual wiring in
`main.ts` is shorter and easier to grep. See ADR-0001 for details.

## Reversibility

Expensive. Switching languages or runtimes is effectively a rewrite. To
reduce future cost:

- The domain layer is pure TypeScript with no Bun-specific APIs. The
  domain would survive a move to Node.js.
- The adapters use some Bun-specific or Node-specific APIs (file
  system, `process`, paths). These would need rewriting if we left Bun.

## References

- The gstack `setup` script is 1044 lines. Read it once to feel the
  weight of nine concerns in one file.
- Bun version 1.0 was released in September 2023. By now (May 2026) it
  is stable enough for production use in the surrounding gstack tools.
