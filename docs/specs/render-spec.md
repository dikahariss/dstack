# Render specification

This document defines the render pipeline: the algorithm that turns a
loaded skill into an in-memory `RenderResult`. The renderer does not
write to disk. Writing is the installer's job. See
[install-spec.md](install-spec.md).

This spec is one of four. The others are:

- [skill-spec.md](skill-spec.md) — the input format for the renderer.
- [host-spec.md](host-spec.md) — the host whose format the renderer must produce.
- [install-spec.md](install-spec.md) — how the renderer's output is written to disk.

## Terms used in this document

| Term | Definition |
|---|---|
| Render | The act of producing a `RenderResult` from a `Skill` and a `Host`. |
| Renderer | A component that implements the `HostRenderer` port. The Claude Code renderer is at `src/adapters/claude-code/ClaudeCodeRenderer.ts`. |
| HostRenderer | A TypeScript interface (port) in the domain layer. Each concrete renderer implements this port. See [host-spec.md](host-spec.md). |
| Port | An interface defined by the domain. Adapters implement ports. |
| Adapter | Concrete code that implements one or more ports. |
| Frontmatter | A YAML block at the top of a Markdown file, between `---` fences. |
| Token | The unit of text size LLMs use. About 1 token per 4 characters of English. |
| Token budget | The maximum number of tokens the rendered body may contain. Declared via `metadata.dstack.context_budget_tokens`. Body-only — bundled resources are excluded. See [skill-spec.md](skill-spec.md) and [ADR-0016](../adr/0016-per-tier-token-budget.md). |
| Deterministic | The same input always produces the same output. |
| Include | A shared Markdown file referenced from `metadata.dstack.includes`. See [skill-spec.md](skill-spec.md). |

## Inputs

The renderer receives a `RenderContext` object:

```typescript
interface RenderContext {
  host: Host;             // The target AI host. See host-spec.md.
  skill: Skill;           // The loaded skill: spec plus prompt body.
  tokenBudget: number;    // Copied from skill.spec.context_budget_tokens.
  now: Date;              // The current time. Injected for deterministic output.
}
```

The skill is already loaded when it reaches the renderer. The renderer
does not read the file system. A separate component
(`SkillRepository`) handles loading.

## Outputs

The renderer returns a `RenderResult` object:

```typescript
interface RenderResult {
  path: string;           // Relative path under host.outputRoot. Example: "ship/SKILL.md".
  content: string;        // The full file content (frontmatter + body).
  tokenCount: number;     // Token count of `content`. Compared to tokenBudget.
  warnings: Warning[];    // Any warnings collected during rendering. May be empty.
}
```

The renderer does not write anything to disk. The installer takes
`RenderResult` objects and writes them. See
[install-spec.md](install-spec.md).

## Pipeline overview (5 steps)

The renderer performs five steps for each skill. Every step is short,
deterministic, and produces output that the next step can consume.

```
Step 1: Resolve includes (read files referenced by skill.spec.includes)
Step 2: Assemble the body (includes + prompt.md)
Step 3: Build the frontmatter (host-specific YAML header)
Step 4: Combine (frontmatter + body)
Step 5: Measure tokens (against the budget)
```

The five steps are a deliberate contrast to a typical 14-step
template-driven pipeline. See
[ADR-0004](../adr/0004-no-template-engine-v0.md) for the reasoning.

## Algorithm for the Claude Code renderer

### Step 1. Resolve includes

For each path in `skill.spec.includes`:

1. Treat the path as relative to `skills/`.
2. Read the file at that path.
3. Append the contents to an "includes content" buffer in declaration
   order.

If a file does not exist, raise `IncludeNotFoundError`. The build fails.

Resolution location:

- `FileSkillRepository` performs include resolution at load time. The
  renderer receives the already-concatenated text on
  `Skill.includesContent` plus any warnings on `Skill.includeWarnings`.

Caching:

- Not implemented today. Two skills that share the same include file
  read it from disk twice. The OS file cache keeps the cost
  negligible for catalogs in the hundreds. Add per-build memoization
  to the repository if profiling later shows it matters.

Cycle detection:

- If a path appears more than once while resolving a single skill's
  `includes:` list, the resolver emits a warning of kind
  `include-cycle-broken` and skips the repeat. Nesting (an include
  file that references other files) is not supported today, so the
  only way a repeat can occur is a duplicate entry in the list.

### Step 2. Assemble the body

Concatenate, in order:

1. The "includes content" buffer from Step 1.
2. A single newline character.
3. The contents of `prompt.md`.

If the includes content buffer is empty (no `includes:` field, or an
empty list), the body is just `prompt.md` — the separator newline is
not added.

The result is the body.

### Step 3. Build the frontmatter

Construct a YAML block in the shape Claude Code expects. dstack-specific
fields live under `metadata.dstack.*` so the agentskills.io top-level
schema stays intact ([ADR-0014](../adr/0014-metadata-namespace.md)).

For Claude Code, the block is:

```yaml
---
name: <skill.spec.id>
description: |
  <skill.spec.description, indented two spaces per line>
license: <skill.spec.license>            # only when present
compatibility: <skill.spec.compatibility> # only when present
metadata:
  dstack:
    type: <skill.spec.type>
    version: <skill.spec.version>
    triggers:                             # only when non-empty
      - <trigger>
    context_budget_tokens: <number>
    side_effects: <readonly | local | external>
    agency: <reactive | deliberative | autonomous>
    output_schema: <inline JSON or path>  # only for schema-semantic
allowed-tools: <space-separated string>
---
```

### Step 4. Combine

The full content is:

```
<frontmatter>
<newline>
<body>
```

### Step 5. Measure tokens

Count tokens in the full content using `approximateTokenCount` (see
the paragraph below for the algorithm).

Compare to `tokenBudget`:

| Condition | Action |
|---|---|
| `tokenCount > tokenBudget` | Raise `TokenBudgetExceededError`. Build fails. |
| `tokenCount > tokenBudget * 0.9` | Add a warning of kind `token-near-budget`. Build continues. |
| `tokenCount ≤ tokenBudget * 0.9` | No warning. |

Token counting uses an offline approximation
(`approximateTokenCount` in
`src/adapters/claude-code/tokens.ts`): characters divided by 4, plus a
5% safety margin, rounded up. Empirically within ±10% of Anthropic's
exact tokenizer, which is well inside the 10% margin between the
warning threshold and the budget ceiling. The budget covers the body
only — bundled resources under `scripts/`, `references/`, `assets/`,
or any free-form subfolder are not counted (load on demand). See
[ADR-0016](../adr/0016-per-tier-token-budget.md) and
[ADR-0017](../adr/0017-bundled-resources.md).

### Final: return the result

Return a `RenderResult` with:

- `path` = `<skill.spec.id>/SKILL.md`
- `content` = the full content from Step 4
- `tokenCount` = the count from Step 5
- `warnings` = the collected warnings (may be empty)

## Algorithm for a future second host (hypothetical Codex renderer)

The `HostRenderer` port is host-agnostic. A second host's renderer
would have the same shape but with three host-specific differences:

| Step | Claude Code today | Hypothetical Codex |
|---|---|---|
| Step 3. Frontmatter | Claude Code shape | Codex shape (different fields) |
| Extra step 3b. Tool name rewriting | Not needed | Codex tool names may differ. Example: `AskUserQuestion` might map to a different tool. |
| Extra step 3c. Path rewriting | Output is `<id>/SKILL.md` | Codex may use a different file layout. |

Steps 3b and 3c do not exist in the Claude Code renderer because the
body is already in Claude Code's expected shape. They are
adapter-local concerns. See [host-spec.md](host-spec.md) for how
hosts differ.

## Determinism guarantee

The renderer is deterministic. Given the same inputs, it always
produces the same output.

The only source of non-determinism is the current time. Time is
provided to the renderer through `RenderContext.now`. Tests pass a
fixed time. The renderer does not call `new Date()` directly.

## Errors raised by the renderer

The renderer raises typed errors (TypeScript classes), not generic
`Error` instances. Each error carries the context needed to display a
useful message.

| Error class | When raised |
|---|---|
| `SkillSpecError(skillId, field, problem, source?)` | A frontmatter field in `SKILL.md` is invalid. `source` carries `{ file, line? }` so the message ends with `at <file>:<line>` when available. |
| `IncludeNotFoundError(skillId, includePath)` | A file listed in `metadata.dstack.includes` does not exist. |
| `TokenBudgetExceededError(skillId, actual, budget)` | The rendered body exceeds the declared body-only budget. |
| `UnknownToolError(skillId, toolName, knownTools)` | A tool name in `allowed-tools` is not in the host's tool registry. See [host-spec.md](host-spec.md). |
| `MissingOutputSchemaError(skillId)` | `type: schema-semantic` declared without `metadata.dstack.output_schema`. |
| `DangerousCombinationError(skillId)` | `type: semantic` + `side_effects: external` + `agency: autonomous` is rejected outright. |
| `BundledResourceError(skillId, relativePath, reason)` | A bundled file is a symlink, contains `..`, or otherwise violates the bundled-resource policy in [ADR-0017](../adr/0017-bundled-resources.md). |

Errors are caught at the application layer. The application layer
aggregates errors and reports them with file and line context. A build
that produces any error does not write any output. See
[install-spec.md](install-spec.md) for atomicity.

## Warnings raised by the renderer

Warnings are non-fatal. The build continues. The CLI prints them at
the end of the run, grouped by skill, via
`src/adapters/cli/warning-formatter.ts` (M5, shipped in v0.1.0).

| Warning kind | When raised |
|---|---|
| `token-near-budget` | Token count is above 90% of the declared body budget. |
| `overlapping-trigger` | Two skills declare the same trigger phrase. |
| `include-cycle-broken` | A path appears more than once in one skill's `includes:` list. |
| `long-description` | Skill description is over 200 words. |
| `type-structure-mismatch` | Declared `type` does not match the actual structure (e.g. `type: semantic` with a `scripts/` folder). |
| `comprehensive-skill` | Skill ships four or more module folders. SkillsBench reports a ~2.9pp pass-rate hit at this size; consider splitting. |

## Determinism testing

The contract suite at `test/contract/HostRenderer.contract.ts` (planned
milestone M8) will assert that:

1. Rendering the same skill twice with the same `now` produces
   byte-identical output.
2. The reported `tokenCount` matches `approximateTokenCount(content)`.
3. The frontmatter is parseable YAML.
4. Every collected warning has a known kind.

## Determinism and time

The renderer is fed `now` through `RenderContext.now`. The CLI passes
`new Date()` at invocation time. Tests pass a fixed date such as
`new Date('2026-01-01T00:00:00Z')`. The renderer must never call
`new Date()` directly.

## How includes interact with the token budget

The token budget applies to the full rendered output. Included content
counts against the budget. A skill with large includes will measure as
larger than the same skill without them.

## Computation type and the renderer

A skill's computation type — `deterministic`, `semantic`, `hybrid`, or
`schema-semantic` — is carried into the rendered frontmatter under
`metadata.dstack.type`. The renderer treats every type the same way at
the assembly layer; type-driven behavior lives in two earlier passes:

- The parser ([ADR-0015](../adr/0015-type-taxonomy-adoption.md)) infers
  a type from structure when one is not declared, and emits a
  `type-structure-mismatch` warning when the declaration disagrees with
  the folder layout.
- `BuildSkill` rejects two combinations outright: `type: schema-semantic`
  without an `output_schema`, and the dangerous trio `type: semantic` +
  `side_effects: external` + `agency: autonomous`.

Bundled resources for `hybrid` and `deterministic` skills are installed
alongside `SKILL.md` by the Installer; the renderer itself does not see
them and they are not counted against the body token budget.

## Cross-references

- [skill-spec.md](skill-spec.md) — the input format the renderer reads.
- [host-spec.md](host-spec.md) — the host whose format the renderer
  must produce.
- [install-spec.md](install-spec.md) — how the renderer's output
  reaches disk.
- [skill-taxonomy.md](../skill-taxonomy.md) — the design framework that
  may eventually influence renderer behavior.
- [ADR-0004](../adr/0004-no-template-engine-v0.md) — why the pipeline
  has 5 steps, not 14.
- [ADR-0010](../adr/0010-context-budget.md) — the token budget rule.
