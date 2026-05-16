# Code taxonomy

A reference for writing dstack code. Not an Architecture Decision
Record (ADR). ADRs make architectural choices; this document
operationalises those choices at the function and file level so a
contributor knows which constructs to reach for and which to avoid.

The rules here are the project's default. When an accepted ADR
justifies an exception (for example, ADR-0001 keeps ports as TS
`interface`), that ADR overrides the default; exceptions are listed in
Part 3.

## How to read this document

- **Part 1** defines the primary axis: the kind of code unit. Eight
  parallel kinds live on this axis.
- **Part 2** describes orthogonal axes that apply to every unit:
  signature, error handling, logging, comments, imports, size.
- **Part 3** lists the exceptions to Part 1 + Part 2 that the
  project's accepted ADRs justify.
- **Part 4** is the decision framework. Ordered questions that lead
  to the right unit.
- **Part 5** lists anti-patterns to avoid.
- **Part 6** gives per-layer guidance (domain, application, adapter,
  observability, CLI, test).
- **Part 7** is the pre-commit review checklist.

## Glossary

| Term | Definition |
|---|---|
| Function | A free-standing callable with no persistent state between calls. |
| Class | An object with state and one or more methods. In dstack, classes carry constructor-checked invariants (aggregates) or constructor-injected ports (use cases). |
| Aggregate | A domain class whose constructor enforces an invariant the type system cannot encode. Example: `Skill` rejects an empty prompt. |
| Use case | A class in `src/application/` whose constructor takes ports and whose single public method (`execute`) runs one user-visible operation. |
| Port | A TypeScript `interface` defined by the domain (or by observability for `Telemetry`) that an adapter implements. The interface name lives in the layer that depends on the abstraction, not in the implementation. |
| Adapter | A class (or function) that implements one or more ports. Lives in `src/adapters/...` or `src/observability/...`. |
| Helper | A function used by exactly one caller. By default, inline it instead. |
| Constant | A named value at module scope. Used only when the name carries meaning the literal does not. |
| Public function | A function exported from its module. Its signature is the contract callers depend on. |
| Boundary | The place where code touches the outside world: filesystem, network, subprocess, terminal. |
| Wiring point | `src/adapters/cli/main.ts` — the only file allowed to construct concrete adapters. |

---

## Part 1 — Unit-type axis

The kind of code unit you are writing. Pick one consciously.

### Function

The default. A free-standing callable with no persistent state.

Use a function when:

- The work is one-shot.
- Inputs and outputs fully describe the contract.
- No setup needs to be done once and reused across method calls.

Examples in dstack: `approximateTokenCount`, `formatWarnings`,
`countWarnings`, `scaffoldSkill`, `assertAllowed`,
`formatValidationResults`.

### Stateful class

A class is justified only if state persists across three or more
method calls on the same instance.

dstack has no instance of this case. `FileTelemetry` is borderline:
the constructor opens a directory once, but `emit` is the only public
method. Borderline cases default to function-plus-closure or
module-level cache, not a class.

### Aggregate

A domain class whose constructor rejects invalid state. The class
exists because the type system alone cannot encode the invariant.

Examples:

- `Skill` rejects an empty `prompt`.
- `SkillId.parse(raw)` rejects strings outside the kebab-case format.

The point is the invariant. The class may have one method or none.

### Use case

An application-layer class with one public method (`execute`). The
constructor receives the ports the use case needs. ADR-0001 justifies
the form even though Part 1's default would prefer a function.

Examples: `BuildSkill`, `BuildCatalog`, `ValidateCatalog`,
`InstallSkills`.

See Part 3.

### Port (TypeScript interface)

An interface defined by the layer that depends on the abstraction.
Implementations live in adapters.

Examples: `SkillRepository`, `HostRenderer`, `Installer`, `Telemetry`.

A port is justified only when ADR-0001's rule fires: either two
implementations exist, or one implementation plus one test fake.

### Adapter

A class (or function) that implements one or more ports. Adapters
touch the outside world.

Examples: `FileSkillRepository`, `FsInstaller`, `ClaudeCodeRenderer`,
`FileTelemetry`.

The class form is preferred so `implements PortName` documents the
port the file fulfils.

### Constant

A named value at module scope. Use it only when the name adds meaning
the literal does not, and the literal is used twice or more in the
file.

A literal used three or more times across files becomes a constant
once.

### Helper

A function used by exactly one caller. Do not write one by default;
inline the body into the caller.

Extract a helper only when (a) two or more callers exist, or (b)
extracting drops the caller below 30–40 lines and the helper has a
clear noun/verb name.

---

## Part 2 — Orthogonal axes

Apply to every unit, regardless of its Part 1 type.

### Axis A — Signatures

| Choice | When |
|---|---|
| Type hint on every parameter and return | Public functions (exported from the module). |
| No type hint | Internal helpers called only within one file. Let inference do the work. |

### Axis B — Docstring

| Choice | When |
|---|---|
| One-line docstring | Public functions. State what it returns and what it raises. |
| No docstring | Internal helpers. The name and signature are the contract. |
| Multi-line block comment | Only when WHY is non-obvious and one line is not enough. Multi-line WHAT comments are forbidden. |

### Axis C — Error handling

| Failure mode | Action |
|---|---|
| Network I/O, file I/O, parsing external or user input | Throw a typed domain error. |
| Logic error (wrong type, null where object expected) | Let it propagate. Do not swallow with try/catch. |
| Recoverable, unusual condition (include cycle, near-budget tokens) | Emit a `Warning` on the result, not an error. |

Typed domain errors live in `src/domain/errors.ts`. Each carries
structured fields so callers do not parse the message.

### Axis D — Logging

| Layer | Allowed |
|---|---|
| Domain, application | `telemetry.emit(...)` only. Never `console.log`. (ADR-0006.) |
| Adapters (CLI) | `console.log` / `console.error` for user-facing output. |
| Adapters (FS, claude-code, observability) | `telemetry.emit(...)` only. |

One structured emission per boundary action: a write, a render, a
build. Include the relevant ID (skill id, host, output path).

### Axis E — Comments

| Comment kind | Allowed? |
|---|---|
| Multi-line WHAT comment ("This function parses...") | No. Rename the identifier so the code says what. |
| WHY comment ("Empty buffer skips the separator because…") | Yes. Tight; one or two lines. |
| TODO without owner or date | No. If you would not fix it within a week, do not write it. |
| Section banner (`// === Section ===`) | No. Move the section to its own file. |

### Axis F — Imports

ADR-0011 governs this axis.

| Import target | Form |
|---|---|
| Same directory (`./X`) | Relative. |
| Anywhere else | Alias: `@domain/*`, `@app/*`, `@adapters/*`, `@obs/*`. |

### Axis G — Size

| Threshold | Action |
|---|---|
| Function body up to 30 lines | No action. |
| 30–50 lines | Review: can a Part-1 unit be split out? Most stays as-is. |
| 50–100 lines | Split required unless the body is a flat switch or sequence with no extractable sub-task. |
| Over 100 lines | Stop. Justify in a WHY comment or a new ADR before continuing. |

---

## Part 3 — ADR overrides

The defaults in Part 1 + Part 2 yield to these ADR-documented
exceptions.

### Use-case classes (overrides "function over class")

ADR-0001 establishes constructor-injected ports as the mechanism for
swapping IO across implementations. Refactoring use cases to free
functions would require curried closures or argument bags; both read
worse than the class form.

Use a class for every new use case. One public method, `execute`.

### Ports as TS interfaces (overrides "no interfaces")

Hexagonal architecture (ADR-0001) requires an abstraction that the
domain defines and adapters implement. TypeScript's `interface`
keyword is the lightest form in this language.

Use `interface` for ports. Do not use `interface` for adapter
input/output data shapes — use `type` or inline object literals for
those. `Warning` is `type`, `RenderResult` is `interface` because it
is consumed by both halves of the renderer port; both choices are
acceptable for data shapes, but consistency inside one folder helps.

### Path aliases (refines "default to small")

Aliases (ADR-0011) read shorter than `../../../../src/...`. They are
not extra abstraction; they are a one-line `tsconfig.json` entry that
makes layer boundaries visible at the import site.

### Aggregates as classes (refines "no class without state across 3 calls")

`Skill`, `SkillId`, and `SkillSpec` are classes because their
constructor enforces an invariant the type system cannot encode (a
non-empty prompt, a kebab-case id, a budget in range). The pattern is
"invariant in constructor", not "state across method calls". Aggregates
that have no invariant should be `type` aliases or inline shapes.

### Telemetry port (overrides "one structured log line")

Domain and application code never call `console.log` (ADR-0006).
They emit a typed event through the `Telemetry` port. The default
adapter (`NoopTelemetry`) discards everything; opt-in adapters
persist or forward.

---

## Part 4 — Decision framework

Answer in order. Stop at the first matching question.

### Question 1: Function or class?

- If the work is one-shot → **function**.
- If a constructor must check an invariant the type system cannot
  encode → **aggregate class** (Part 1).
- If this is an application use case wired with ports → **use-case
  class** (Part 3 override).
- Otherwise → **function**.

### Question 2: Inline literal or named constant?

- Used once → **inline**.
- Used twice in one file → **borderline; inline unless the name adds
  meaning a literal would not** (example: `INCLUDE_DEPTH_LIMIT = 4`
  reads better than two stray `4`s).
- Used three or more times, or across files → **constant**.

### Question 3: Extract a helper or inline?

- Helper would be called once → **inline**.
- Helper would be called twice → **extract only if the caller drops
  below 30 lines or the helper has a clear name**.
- Helper would be called three or more times → **extract**.

### Question 4: Introduce a port?

ADR-0001's rule fires. Introduce a port only when:

- A second implementation will exist within the next change, OR
- A test fake is required to keep a use case unit-testable.

Otherwise, inline the concrete call.

### Question 5: Add error handling here?

- Boundary IO (filesystem, network, subprocess) → **throw a typed
  domain error**.
- Parsing external input (YAML, user CLI args) → **throw a typed
  domain error with `SourceLocation` when a file is involved**.
- Internal call that cannot fail → **no handler**. Let exceptions
  propagate.
- Recoverable, unusual condition → **`Warning` on the result**.

### Question 6: Add a docstring?

- Public function (exported) → **one-line, what it returns and what
  it raises**.
- Internal helper → **no docstring**.

### Question 7: Add a comment?

- The code says what but not why → **WHY comment, one or two lines**.
- The code says what and the name explains why → **no comment**.

---

## Part 5 — Anti-patterns

### Anti-pattern 1: Class with one method and no invariant

```typescript
class Greeter {
  greet(name: string): string { return `hi ${name}`; }
}
```

Use a function. The class adds a noun and no behaviour.

Exception: use-case classes per Part 3.

### Anti-pattern 2: Default values on parameters with one call site

```typescript
function build(input: string, depth: number = 4): ... { ... }
```

If there is one caller, the default is dead code. Make `depth`
required; the literal then lives at the call site, which is where it
can be reviewed.

### Anti-pattern 3: Helper extracted "for clarity" with one caller

The reader jumps twice (to the helper, then back). Inline.

### Anti-pattern 4: Port with one implementation and no test fake

ADR-0001 forbids this. Inline the concrete call. Re-introduce the port
when the second implementation or test fake arrives.

### Anti-pattern 5: WHAT comment in front of obvious code

```typescript
// Increment counter
counter++;
```

Rename the variable so the line reads itself, or delete the comment.

### Anti-pattern 6: Try/catch around logic errors

```typescript
try {
  obj.method();
} catch (e) {
  // swallow
}
```

Logic errors should crash with a stack trace. Wrap only at boundaries
(Axis C).

### Anti-pattern 7: Generic type with one concrete usage

```typescript
function first<T>(arr: T[]): T | undefined { return arr[0]; }
```

If `first<string>` is the only call site, write `firstString` or just
`arr[0]`. Re-introduce the generic when a second concrete type
appears.

### Anti-pattern 8: Structure for hypothetical future flexibility

A recursive include resolver "in case nesting is added later" carries
cost today (more code, more tests, more cognitive load) for a benefit
that may never arrive. Build the flat case. Let the recursive case
arrive with its concrete requirement.

### Anti-pattern 9: Validating what the type system already guarantees

```typescript
function f(x: string): void {
  if (typeof x !== 'string') throw new Error('not a string');
  ...
}
```

The signature says `string`. The check is dead code. Validate only at
boundaries where the type comes from outside (YAML parser output,
user input).

### Anti-pattern 10: `throw new Error("...")` in domain or application

The CLI catches typed errors to render them with structured context
(skill id, file, line). A bare `Error` loses that context. Use a
typed subclass from `src/domain/errors.ts` or extend it.

---

## Part 6 — Layer-specific guidance

### Domain (`src/domain/`)

- Aggregates may be classes; everything else is a function or `type`.
- No filesystem, no network, no subprocess. No `node:*` imports.
- Errors are typed `DomainError` subclasses with structured fields.
- Imports: sibling stays relative; cross-folder uses `@domain/*`.

### Application (`src/application/`)

- Each use case is one class with one `execute` method.
- Constructor takes ports as parameters; stores references; no work.
- `execute` orchestrates ports. Never imports a concrete adapter.
- `telemetry.emit(...)` is the only observability call.

### Adapter (`src/adapters/`)

- Implements one or more ports. The `implements` clause documents
  which.
- IO is allowed and expected.
- Cross-adapter imports forbidden except in `src/adapters/cli/main.ts`
  (the wiring point).
- Imports: `@adapters/*` for cross-adapter inside the wiring file;
  `@domain/*` for ports; `@app/*` for use cases; `./X` for siblings.

### Observability (`src/observability/`)

- `Telemetry.ts` defines the port and the closed `TelemetryEvent`
  union.
- `NoopTelemetry` and `FileTelemetry` are adapters.
- Adding a new event kind is a one-line addition to the union;
  reviewer catches it.

### CLI (`src/adapters/cli/`)

- The only place concrete adapters are constructed.
- Allowed to use `console.log` and `console.error`.
- Reads environment variables (e.g. `DSTACK_TELEMETRY`) here and
  passes values down through constructors.

### Test (`test/`)

- Imports use the alias paths (`@domain/...`, `@app/...`, etc.).
- Unit tests are pure: no filesystem, no setup, under 10 ms each.
- Contract tests live under `test/contract/`. One shared suite per
  port; every adapter runs it.
- Integration tests use `mkdtempSync` and clean up after themselves.

---

## Part 7 — Review checklist

Walk the diff before opening a pull request:

- [ ] Every helper function has at least two callers, or is inlined.
- [ ] Every default parameter value has at least two call sites that
  benefit from the default.
- [ ] Every named constant is used twice in one file, three times
  across files, or carries meaning a literal would not.
- [ ] Every new class is either an aggregate (constructor invariant)
  or a use case (constructor-injected ports). Other classes are
  refactored to functions.
- [ ] Every new TS `interface` is a port (domain → adapter contract).
  Data shapes use `type` or inline literals.
- [ ] Every public function has a one-line docstring with what it
  returns and what it raises.
- [ ] Every multi-line comment block explains WHY, not WHAT.
- [ ] Every cross-folder import uses an alias (ADR-0011).
- [ ] No `console.log` in domain or application code (ADR-0006).
- [ ] No try/catch around logic errors. Try/catch only at boundaries.
- [ ] No `throw new Error("...")` in domain or application. Typed
  errors only.
- [ ] No structure built "for future nesting", "for future hosts", or
  "for future N skills".
- [ ] Function bodies are under 50 lines of executable code; bodies
  over 100 lines carry a WHY justification.

---

## Cross-references

### Architecture Decision Records

- [ADR-0001](adr/0001-hexagonal-layered.md) — the layer rule that
  justifies use-case classes and ports as interfaces.
- [ADR-0006](adr/0006-telemetry-opt-in.md) — why domain and
  application never call `console.log`.
- [ADR-0011](adr/0011-import-path-aliases.md) — the alias convention
  for non-sibling imports.

### Other references

- [CLAUDE.md](../CLAUDE.md) — agent instructions: read-order pointer,
  forbidden patterns, code conventions. Read first if you are an AI.
- [ARCHITECTURE.md](ARCHITECTURE.md) — the layer diagram and port
  inventory.
- [skill-taxonomy.md](skill-taxonomy.md) — the sibling reference doc
  for designing skills (not code).
- [docs/specs/](specs/) — the four contracts the code must satisfy:
  skill, host, render, install.

## One-paragraph summary

Default to small: functions over classes, inline single-use values,
inline helpers called once, no defaults on one-call-site parameters,
no comments that say WHAT. ADR-0001 justifies a small set of classes
(aggregates with constructor invariants, use cases with
constructor-injected ports) and one form of interface (ports between
layers). ADR-0006 routes observability through `Telemetry`, not
`console.log`. ADR-0011 uses path aliases for any non-sibling import.
Error handling lives at boundaries and at parse points; logic errors
crash with stack traces. The review checklist in Part 7 is the
operational form of these rules.
