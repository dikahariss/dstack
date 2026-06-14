---
name: dispatching-parallel-agents
description: |
  Use when facing 2+ independent tasks that can be worked on without
  shared state or sequential dependencies — e.g. several test files
  failing with different root causes, or multiple subsystems broken
  independently. Dispatch one subagent per problem domain and let them
  work concurrently. Triggers: "parallel agents", "fan out", "independent
  failures".
allowed-tools: Agent Bash Read
metadata:
  dstack:
    version: 0.2.0
    type: semantic
    side_effects: local
    agency: deliberative
    context_budget_tokens: 3000
    triggers:
      - dispatch parallel agents
      - parallel agents
      - independent failures
      - fan out agents
---
# /dispatching-parallel-agents

## Overview

You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

When you have multiple unrelated failures (different test files, different subsystems, different bugs), investigating them sequentially wastes time. Each investigation is independent and can happen in parallel.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently.

Deciding the failures are truly independent — no shared state, no
"fixing one may fix another" coupling — is your judgment call. The rails
below only tell you how to dispatch once you have decided.

## When to use

Walk this decision table top to bottom:

| Situation | Action |
|---|---|
| Multiple failures, but related (fixing one may fix others) | One agent investigates all |
| Multiple failures, independent, no shared state | One agent per domain, dispatched in parallel |
| Independent but share state (same files/resources) | Sequential agents, not parallel |
| Single failure, or you don't yet know what's broken | Investigate directly first (no dispatch) |

**Use when:**
- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem can be understood without context from others
- No shared state between investigations

**Don't use when:**
- Failures are related (fix one might fix others)
- Need to understand full system state
- Agents would interfere with each other

## The pattern

### 1. Identify independent domains

Group failures by what's broken:
- File A tests: Tool approval flow
- File B tests: Batch completion behavior
- File C tests: Abort functionality

Each domain is independent - fixing tool approval doesn't affect abort tests.

### 2. Create focused agent tasks

Each agent gets:
- **Specific scope:** One test file or subsystem
- **Clear goal:** Make these tests pass
- **Constraints:** Don't change other code
- **Expected output:** Summary of what you found and fixed

### 3. Dispatch in parallel

```typescript
// In Claude Code: dispatch via the Agent tool, multiple in one message
Agent("Fix agent-tool-abort.test.ts failures")
Agent("Fix batch-completion-behavior.test.ts failures")
Agent("Fix tool-approval-race-conditions.test.ts failures")
// All three run concurrently
```

### 4. Review and integrate

When agents return:
- Read each summary
- Verify fixes don't conflict
- Run full test suite
- Integrate all changes

## Agent prompt structure

Good agent prompts are:
1. **Focused** - One clear problem domain
2. **Self-contained** - All context needed to understand the problem
3. **Specific about output** - What should the agent return?

```markdown
Fix the 3 failing tests in src/agents/agent-tool-abort.test.ts:

1. "should abort tool with partial output capture" - expects 'interrupted at' in message
2. "should handle mixed completed and aborted tools" - fast tool aborted instead of completed
3. "should properly track pendingToolCount" - expects 3 results but gets 0

These are timing/race condition issues. Your task:

1. Read the test file and understand what each test verifies
2. Identify root cause - timing issues or actual bugs?
3. Fix by:
   - Replacing arbitrary timeouts with event-based waiting
   - Fixing bugs in abort implementation if found
   - Adjusting test expectations if testing changed behavior

Do NOT just increase timeouts - find the real issue.

Return: Summary of what you found and what you fixed.
```

## Common mistakes

| Mistake | Instead |
|---|---|
| Too broad: "Fix all the tests" — agent gets lost | Specific: "Fix agent-tool-abort.test.ts" — focused scope |
| No context: "Fix the race condition" — agent doesn't know where | Paste the error messages and test names |
| No constraints: agent might refactor everything | "Do NOT change production code" / "Fix tests only" |
| Vague output: "Fix it" — you don't know what changed | "Return a summary of root cause and changes" |

## When NOT to use

**Related failures:** Fixing one might fix others - investigate together first
**Need full context:** Understanding requires seeing entire system
**Exploratory debugging:** You don't know what's broken yet
**Shared state:** Agents would interfere (editing same files, using same resources)

## Real example

**Scenario:** 6 test failures across 3 files after major refactoring

**Failures:**
- agent-tool-abort.test.ts: 3 failures (timing issues)
- batch-completion-behavior.test.ts: 2 failures (tools not executing)
- tool-approval-race-conditions.test.ts: 1 failure (execution count = 0)

**Decision:** Independent domains - abort logic separate from batch completion separate from race conditions

**Dispatch:**
```
Agent 1 → Fix agent-tool-abort.test.ts
Agent 2 → Fix batch-completion-behavior.test.ts
Agent 3 → Fix tool-approval-race-conditions.test.ts
```

**Results:**
- Agent 1: Replaced timeouts with event-based waiting
- Agent 2: Fixed event structure bug (threadId in wrong place)
- Agent 3: Added wait for async tool execution to complete

**Integration:** All fixes independent, no conflicts, full suite green

**Time saved:** 3 problems solved in parallel vs sequentially

## Key benefits

1. **Parallelization** - Multiple investigations happen simultaneously
2. **Focus** - Each agent has narrow scope, less context to track
3. **Independence** - Agents don't interfere with each other
4. **Speed** - 3 problems solved in time of 1

## Verification

After agents return:
1. **Review each summary** - Understand what changed
2. **Check for conflicts** - Did agents edit same code?
3. **Run full suite** - Verify all fixes work together
4. **Spot check** - Agents can make systematic errors

Run the integrate-time gate in this turn before claiming done:

```bash
<project test command>   # e.g. bun test / pytest — expect 0 failures, exit 0
git diff --stat          # confirm only intended files changed, no overlap
```

## Cross-references

- `/subagent-driven-development` — the sibling dispatch skill for
  plan-driven tasks worked sequentially in one session (this skill is for
  independent, parallel investigations with no plan).
- `/debugging` — run it inside each agent to root-cause its own domain.
- `/verification` — the integrate-time gate above.

## Changes

- **0.2.0** — Named the judgment (deciding failures are truly independent)
  and added an integrate-time verify command. Hardening (v3 plan):
  converted the graphviz when-to-use block and the ❌/✅ mistakes to tables;
  added Cross-references; normalised headings to dstack voice.
- **0.1.0** — Imported from superpowers `dispatching-parallel-agents`.
  Adapted to dstack: added frontmatter/`metadata.dstack`; dispatch
  examples use the Claude Code `Agent` tool instead of `Task`; dropped
  the dated session-narrative footer. Body otherwise verbatim.
