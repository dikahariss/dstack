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
| Token budget | The maximum number of tokens a rendered output may contain. Declared in `skill.yaml`. See [skill-spec.md](skill-spec.md). |
| Deterministic | The same input always produces the same output. |
| Include | A shared Markdown file referenced from `skill.yaml`. See [skill-spec.md](skill-spec.md). |

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

Caching:

- Include resolution is cached across one build run.
- Two skills that share the same include file read it from disk only
  once.

Cycle detection:

- If include file A references include file B, and B references A
  (directly or transitively), the renderer stops following the chain
  at the cycle and emits a warning of kind `include-cycle-broken`.
- Maximum include depth is 4. Going deeper emits the same warning.

### Step 2. Assemble the body

Concatenate, in order:

1. The "includes content" buffer from Step 1.
2. A single newline character.
3. The contents of `prompt.md`.

The result is the body.

### Step 3. Build the frontmatter

Construct a YAML block in the shape Claude Code expects. See
[host-spec.md](host-spec.md) for the full frontmatter contract.

For Claude Code, the block is:

```yaml
---
name: <skill.spec.id>
version: <skill.spec.version>
description: |
  <skill.spec.description, with each line indented by two spaces>
allowed-tools: [<skill.spec.tools, comma-separated>]
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
warning threshold and the budget ceiling. See
[ADR-0010](../adr/0010-context-budget.md) for the budget rules.

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
| `SkillSpecError(skillId, field, problem, source?)` | A field in `skill.yaml` is invalid. `source` carries `{ file, line? }` so the message ends with `at <file>:<line>` when available. |
| `IncludeNotFoundError(skillId, includePath)` | A file listed in `includes` does not exist. |
| `TokenBudgetExceededError(skillId, actual, budget)` | The rendered output is larger than the declared budget. |
| `UnknownToolError(skillId, toolName, knownTools)` | A tool name in `skill.yaml` is not in the host's tool registry. See [host-spec.md](host-spec.md). |

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
| `token-near-budget` | Token count is above 90% of the declared budget. |
| `overlapping-trigger` | Two skills declare the same trigger phrase. |
| `include-cycle-broken` | Include files form a cycle, or include depth exceeded 4. |
| `long-description` | Skill description is over 200 words. |

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

A skill's computation type — Deterministic, Open-ended Semantic, Hybrid,
or Schema-constrained Semantic — does not change the renderer's behavior
today. The renderer treats every skill the same way.

If [skill-taxonomy.md](../skill-taxonomy.md) is later adopted in the
schema, the renderer may gain behavior such as:

- Embedding an output schema as instructions for Schema-constrained
  Semantic skills.
- Refusing to render Open-ended Semantic skills that are also
  External-mutating and Autonomous.

These are open design questions. They will be ADRs when they happen.

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
