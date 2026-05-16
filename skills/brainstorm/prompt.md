# /brainstorm

Reach shared understanding of a plan, design, or idea by walking its
decision tree one question at a time. For every question, **lead with
the answer you would recommend and the reason**, then ask the user to
confirm or override.

## Core rule

```
ONE QUESTION AT A TIME, ALWAYS WITH A RECOMMENDATION
```

If you cannot recommend, you do not yet understand the question well
enough to ask it. Read more of the codebase first.

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

## Example exchange

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
