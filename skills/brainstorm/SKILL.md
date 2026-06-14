---
name: brainstorm
description: |
  Interviews the user about a plan, design, or idea until reaching
  shared understanding. Walks every branch of the decision tree,
  asks one question at a time, and recommends an answer with each
  question. Use when the user asks to "brainstorm", "grill me",
  "stress test this plan", "interview me", or "what do you think
  about this idea".
allowed-tools: AskUserQuestion Read Grep Glob
metadata:
  dstack:
    version: 0.3.0
    type: semantic
    side_effects: readonly
    agency: deliberative
    calibration: judgment-dominant
    context_budget_tokens: 2500
    triggers:
      - brainstorm
      - grill me
      - stress test
      - interview me
      - what do you think about this idea
---
# /brainstorm

Reach shared understanding of a plan, design, or idea by walking its
decision tree one question at a time. For every question, **lead with
the answer you would recommend and the reason**, then ask the user to
confirm or override.

## Core rule

```
RECOMMENDATION FIRST → ONE QUESTION SECOND
```

Every turn opens with the answer you would pick **and a one-line
reason**. Only then does the question follow. A turn that asks
without recommending is failing the skill. If you cannot recommend,
you do not yet understand the question well enough to ask it — read
more of the codebase, the ADRs, the recent commits first.

This skill is intentionally judgment-dominant (ADR-0025): the spine is
only recommendation-first + the keep/stop gates; which branch to walk and
what to recommend is your judgment — research the code and latest context
freely.

### What this looks like in one sentence

> "I'd recommend [option] because [reason]. **[One question to
> confirm or override.]**"

If the response opens with "Could you tell me…" or "What do you
mean by…" without first naming a recommendation, the skill is being
violated. The user gets the value of a recommendation to push back
on; an open question without a stake makes the user do all the
thinking.

## When to use this skill

- The user wants to stress-test a plan or design before building it.
- The user says "brainstorm", "grill me", "interview me", or "stress
  test this idea".
- You are about to start an ambiguous task and want explicit
  alignment before any file changes.

Do not use when:

- The user has already given a clear, unambiguous instruction — just
  do the work.
- The decision is reversible in seconds (a variable name, a colour).
  Make the call, mention what you picked, move on.

## How to ask

1. **One question per turn.** Use the `AskUserQuestion` tool with two
   to four crisp options when the choice space is enumerable. Fall
   back to a free-text question only when the answer space is open.
2. **Always recommend.** Lead with "I recommend X because Y." The
   recommendation is the value this skill provides — without it the
   user does all the thinking.
3. **Name the trade-off.** When you recommend an option, state what
   the user gives up. "Recommend X (faster to ship) over Y (more
   flexible later)." A recommendation without a trade-off is a
   guess.
4. **Read the code before asking.** If the answer is in the codebase
   (existing pattern, prior decision in an ADR, the actual file
   structure), read it instead of asking the user.
5. **Walk depth-first.** Resolve the decisions that unlock other
   decisions before the leaves that depend on them. Do not ask leaf
   questions when the root is still open.

## Example exchange — stress-test of an ambiguous proposal

User: "Should I rewrite the monolith in microservices?
Stress-test this idea with me."

**Recommendation-first response (correct):**

> "I'd recommend **not rewriting** in 95% of cases — the typical
> driver (team friction, deploy pain, scaling fear) is rarely fixed
> by service boundaries and almost always introduces new failure
> modes (distributed tracing, network partitions, schema drift)
> that the monolith does not have. The question that decides it:
> **what specifically hurts right now — slow deploys, conflicting
> code ownership, one component crashing the whole app, or
> something else?** Pick one; that answer changes the
> recommendation."

Notice: the recommendation comes first **with a reason**. The
question that follows is sharp and decision-relevant. The user can
either confirm ("you're right, it's mostly conflicting ownership")
or override ("actually, one component takes down everything and
deploy gates the rest"). Either way, the next question is unlocked.

**Anti-pattern (wrong):**

> "Could you tell me what's motivating this? Things that would help
> me branch correctly: what broke recently, how many engineers
> touch it, what 'monolith' means here…"

This is open enumeration without a stake. The user does the work
the skill was meant to do.

## Example exchange — decision-tree walk

The user wants to add caching to an existing function. You walk the
tree:

```
Q1 (root): Where should the cache live?
  Recommend: in-process Map. Reason: function is hot but bounded; no
  cross-request invalidation problem; one less moving part.
  Trade-off: cache resets on every process restart.
  Alternatives: Redis (durable, network hop), Bun.serve cache (tied
  to HTTP path, not useful for this function).

User picks: in-process Map.

Q2: What eviction policy?
  Recommend: none (bounded by input cardinality of ~200).
  Reason: with that small a key space the size never grows.
  Trade-off: if cardinality grows past 1k, memory creeps.
  Alternative: LRU with size 256.

User picks: LRU 256 — they expect cardinality to grow next quarter.

Q3 (leaf): What key serialization?
  Recommend: JSON.stringify on the arg tuple.
  Reason: simplest; args are plain objects already.
  Trade-off: slow for large objects (not the case here).

User picks: confirmed.
```

Notice: each question stands on a decision the previous answer
unlocked. Q3 did not get asked before Q1 was settled.

## When to keep going

Do not declare alignment until:

- Every branch of the decision tree has a chosen answer or an
  explicit "defer to later".
- The chosen answers are mutually consistent (no contradictions
  between Q1 and Q5).
- The user has heard the recommendation **and** the trade-off on the
  decisions that matter most (the root and the high-leverage forks).

## When to stop early

Stop when:

- The user signals "enough", "let's just build it", or "you decide
  the rest". Record any open questions and move on; do not keep
  grilling.
- The remaining branches are implementation details the user has not
  yet committed to working on. There is no point pre-deciding things
  that may not happen.
- A blocking dependency is missing (a file you cannot read, a
  decision that needs a third party). Surface the block; stop.

## Output at end of session

Hand back a short alignment summary so the next phase starts from a
known state. Template:

```
## Decisions

- <topic>: <choice> — <one-line why>
- <topic>: <choice> — <one-line why>

## Deferred

- <topic>: <why deferred, what would unlock it>

## Open / blocked

- <topic>: <what is blocking>
```

Keep it under 15 lines. The user reads this once to confirm and then
uses it as the brief for the implementation.

## Cross-references

- After alignment lands, the build itself usually wants `/tdd` for
  the implementation cycle.
- For the "is this idea worth building at all" question (one level
  above this skill), the conversation is closer to a product
  discussion than a design walk — this skill is the wrong tool.

## Changes

- **0.3.0** — calibration: judgment-dominant (ADR-0025). Evidence: v3
  benchmark — /brainstorm loses to mattpocock/grill-me when over-structured
  (docs/v3-benchmark-report.md). Owner-approved 2026-06-04.
- **0.2.0** — Reframed the core rule from "ONE QUESTION AT A TIME"
  to "RECOMMENDATION FIRST → ONE QUESTION SECOND" because earlier
  benchmark losses against mattpocock/grill-me showed Claude
  defaulting to open enumeration when faced with ambiguous prompts.
  Added a stress-test worked example with the correct
  recommendation-first response and its anti-pattern. Added v2
  schema fields (`type: semantic`, `side_effects: readonly`,
  `agency: deliberative`). Driven by v3 Track C benchmark.
- **0.1.0** — Initial port from v1 skill catalog.
