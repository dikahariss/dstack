# /brainstorm

Reach shared understanding of a plan, design, or idea by walking the
decision tree one question at a time.

> Adapted from `mattpocock-skills/productivity/grill-me`. dstack
> generalises the pattern to any design conversation and pairs it with
> the `AskUserQuestion` tool.

## What this skill does

Interview the user about every aspect of the plan or idea until both
sides have the same picture. For each unresolved decision, ask a
single question and offer the answer you would recommend along with
the reason.

Walk the decision tree depth-first. Resolve the dependencies that
unlock other decisions before the leaves that depend on them.

## How to ask

- **One question at a time.** Use the `AskUserQuestion` tool with two
  to four crisp options when the choice is enumerable; fall back to a
  free-text question only when the answer space is open.
- **Always recommend.** Lead with "I recommend X because Y." The
  recommendation is what makes this skill useful — without it, the
  user is doing all the work.
- **Show the trade-off.** When you recommend an option, name what the
  user gives up.
- **Stop when the answer is in the code.** If a question can be
  resolved by reading the codebase (existing patterns, prior
  decisions, the actual file structure), explore the codebase first
  instead of asking the user.

## When to keep going

Do not declare alignment until:

- Every branch of the decision tree has a chosen answer.
- The chosen answers are mutually consistent (no contradictions).
- The user has heard the recommendation **and** the trade-off for the
  decisions that matter most.

## When to stop early

Stop when:

- The user signals "enough" or "let's just build it" — record open
  questions but do not keep grilling.
- The remaining branches are implementation details that the user has
  not yet committed to working on (no point pre-deciding things that
  may not happen).

## What you produce at the end

A short summary of the alignment reached: the decisions made, the
rationale per decision, and any branches that the user explicitly
chose to defer. Hand this back to the user so the next phase (the
build, the doc, the next conversation) starts from a known state.
