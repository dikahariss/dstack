# Deferred from v2 — YAGNI register

This file extends [v1's DEFERRED.md](../v1/DEFERRED.md). v1 items D1
through D11 are still deferred under the same triggers.

This document lists new items that were considered for v2 and
explicitly deferred. Each entry includes the reason and the condition
that would unlock the item.

## Terms used in this document

| Term | Definition |
|---|---|
| YAGNI | "You Aren't Gonna Need It." A discipline of not building features until they are actually needed. |
| Trigger | A concrete condition that, if it becomes true, makes us reconsider. |

---

## D12 — Multi-host renderer adapters (Gemini CLI, Codex, Cursor, Goose)

- **Why deferred (extends v1 D1).** v2 makes dstack output strict
  agentskills.io-spec-compliant. This means the same `SKILL.md` runs
  in Gemini CLI, Codex, Cursor, Goose, Claude Code, etc. without
  per-host renderer code. The `HostRenderer` port is in place; new
  hosts that need transforms can subclass it. Until a specific host
  needs a transform we cannot do at the spec level, we do not build
  per-host adapters.
- **What is in place.** Strict-spec renderer (M22), `metadata.dstack.*`
  extensions that other hosts ignore, `HostRenderer` port.
- **Trigger to revisit.** A specific host adds a frontmatter field
  outside the agentskills.io spec that materially helps the user's
  workflow (e.g., Cursor adds something Claude Code does not have).
- **Estimated effort when triggered.** 1 to 2 hours per host adapter.

## D13 — Hook engine (PreToolUse, PostToolUse)

- **Why deferred (extends v1 D2).** Same reasoning as v1 D2. v2 adds
  type-aware validation (M27, M29) but does not add a hook runtime.
  `careful` remains advisory text. Anthropic's Claude Code supports
  hooks but the spec at agentskills.io does NOT include them — they
  are a Claude Code extension that other hosts may not accept.
- **What is in place.** `careful` ships as advisory. Renderer copies
  known frontmatter fields only; unknown fields under `metadata` are
  preserved.
- **Trigger to revisit.** Two or more skills need runtime
  interception, AND the hooks field becomes part of the spec OR all
  target hosts agree on the Claude Code hooks format.
- **Estimated effort when triggered.** 3 to 5 hours.

## D14 — Emit MCP tool definitions for Schema-semantic skills

- **Why deferred.** v2 supports `type: schema-semantic` (M34) but
  embeds the schema as a Markdown table in the SKILL.md body. This
  works because Claude Code, Codex, and Gemini CLI all read prose
  schemas reliably. Emitting an MCP tool definition (so the host's
  structured-output feature enforces the schema at the token-grammar
  level) is the more rigorous path but requires:
  1. An MCP server to host the tool definition, OR
  2. A host-specific extension that accepts inline tool defs (none
     exists in the agentskills.io spec yet).
- **What is in place.** Markdown-embedded schema. Validator checks the
  schema is real JSON Schema (M35).
- **Trigger to revisit.** A Schema-semantic skill ships and the
  Markdown-table approach demonstrably produces invalid output more
  than once. Or: agentskills.io spec gains a `tool_definition` field.
- **Estimated effort when triggered.** 4 to 6 hours.

## D15 — Bundled compiled binaries (gstack-style `browse` daemon)

- **Why deferred.** gstack ships a 58MB Bun-compiled binary as part of
  its `browse` skill. dstack v1 explicitly rejected this path in
  [ADR-0005](../../adr/0005-bun-runtime.md) and
  [ADR-0007](../../adr/0007-browse-separate-process.md). v2 does not
  reverse those decisions. Scripts are runtime-executed (Python,
  shell, JavaScript via `uvx`/`npx`/`bunx`), not pre-compiled.
- **What is in place.** Bundled-script support (M25) covers Python +
  shell + Node-via-npx. PEP 723 inline dependencies make Python
  scripts self-contained.
- **Trigger to revisit.** A real skill needs sub-second cold-start
  performance that only a pre-compiled binary can deliver, AND the
  user is willing to maintain a build/release pipeline for it.
- **Estimated effort when triggered.** 1 to 2 weeks. Comparable to the
  v1 `packages/browse/` budget in v1 D4.

## D16 — Comprehensive-skill auto-split

- **Why deferred.** SkillsBench shows 4+ modules hurt performance.
  v2's M29 warns on this but does not auto-split a comprehensive skill
  into focused sub-skills. Auto-splitting requires understanding which
  bundled files are mutually exclusive contexts, which is a judgment
  call best left to the author.
- **What is in place.** `comprehensive-skill` warning from M29.
- **Trigger to revisit.** Five or more comprehensive-skill warnings
  appear across the catalog AND authors consistently struggle to
  split skills manually.
- **Estimated effort when triggered.** 4 to 6 hours. Likely a `dstack
  doctor --suggest-split <id>` subcommand that proposes a partition,
  not an automatic edit.

## D17 — LLM-judge evaluation harness (SkillsBench-style)

- **Why deferred (extends v1 D3).** SkillsBench (arXiv 2602.12670)
  established the reference design for a skill-evaluation harness.
  Building one in dstack would let v2 measure pass-rate delta for
  each skill. But it costs: API key, LLM calls, time, baseline
  curation. v1 deferred this for "no second contributor yet." v2
  inherits that constraint.
- **What is in place.** Manual review by the single user; contract
  tests for ports; spec-compliance tests (M30).
- **Trigger to revisit.** A second contributor lands a skill PR, OR a
  ported skill quietly degrades and we lack a way to detect it.
- **Estimated effort when triggered.** 1 to 2 weeks (unchanged from v1
  D3). SkillsBench's reference design narrows the scope.

## D18 — Migrate `_shared/` includes to `references/` and deprecate

- **Why deferred.** v1's `_shared/` mechanism (M3 in v1) and v2's
  bundled `references/` (M25) cover overlapping use cases.
  `_shared/` does concatenation; `references/` is loaded on-demand by
  Claude. v2 keeps `_shared/` working for backward compatibility.
  Deprecating it would mean migrating any v1 skill that uses it.
  Today only test fixtures use it.
- **What is in place.** Both mechanisms work side by side.
- **Trigger to revisit.** Two or more shipped skills use `_shared/`
  AND the renderer paths diverge meaningfully between the two
  mechanisms.
- **Estimated effort when triggered.** 1 to 2 hours.

## D19 — Cross-skill dependency graph

- **Why deferred (extends v1's rejected list).** Some skills logically
  compose (e.g., `/tdd` and `/code-review` share a verification
  step). v1 explicitly rejected a dependency graph in its
  [rejected items list](../v1/DEFERRED.md). v2 does not reverse that.
- **What is in place.** Skills cross-reference each other in the prose
  body (e.g., `/code-review`'s prompt mentions `/tdd`). Authors keep
  the references in sync by hand.
- **Trigger to revisit.** Three or more skills have circular or
  bidirectional cross-references AND keeping them in sync becomes a
  bug source.
- **Estimated effort when triggered.** 4 to 8 hours, plus a new ADR.

## D20 — Built-in eval-driven skill authoring (Claude-A / Claude-B)

- **Why deferred.** Anthropic's official best-practices guide
  ([anthropic.com/docs/.../agent-skills/best-practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))
  recommends "Claude A creates the skill, Claude B tests it." dstack
  could automate this with a subcommand. But it requires running
  Claude in two roles, an eval harness (D17), and a way to feed
  Claude B's feedback back to Claude A.
- **What is in place.** Manual two-conversation workflow works fine.
- **Trigger to revisit.** Same as D17. They are likely a package.
- **Estimated effort when triggered.** Included in the D17 budget.

## D21 — Runtime output validation for schema-semantic skills

- **Why deferred.** v2 renders the declared `output_schema` both as
  YAML in frontmatter and as a Markdown table in the body (ADR-0015),
  but dstack does not observe Claude's actual response — so the schema
  is *guidance*, not *enforcement*. Closing the loop requires either
  an MCP wrapper that validates Claude's tool-call output (sibling of
  [D14](#d14-emit-mcp-tool-definitions-for-schema-semantic-skills))
  or a post-call validator in the host harness. Both are out of
  scope for a single-user single-host catalog tool.
- **What is in place.** The schema is parsed and validated at build
  time (real JSON Schema, Ajv-compatible — UAT-3 confirms this).
  Author-side test of the schema is straightforward via `ajv` CLI;
  runtime adherence depends on the model.
- **Trigger to revisit.** A user reports that schema-semantic output
  drifted in production, OR D14 is built (the MCP path provides the
  natural enforcement hook).
- **Estimated effort when triggered.** 1 to 2 days if piggybacking
  D14; 1 week for a standalone validator inside a host runtime
  adapter.

---

# How to read this list

Same as v1: each entry is a **promise to revisit when the trigger
fires**, not a "never." Most items here will stay deferred forever,
and that is the correct outcome.

# Items rejected (not deferred)

Items added to v1's rejected list still apply. v2 adds two more:

| Item | Why rejected |
|---|---|
| `metadata.*` namespace registry (claim ownership of keys) | The agentskills.io spec recommends "reasonably unique key names" but no central registry. dstack uses `metadata.dstack.*` and respects whatever other tools choose. A registry is platform-level, not catalog-level. |
| Per-host scripts (gstack-style `bin/check-careful.sh` invoked from a `PreToolUse` hook) | Per [D13](#d13-hook-engine-pretooluse-posttooluse) and [v1 D2](../v1/DEFERRED.md). Without a hook engine the path does not exist; with one it would still be a Claude Code extension, not portable. |
