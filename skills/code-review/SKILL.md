---
name: code-review
description: |
  Handles code-review feedback with technical rigor. Verifies before
  implementing, asks before assuming, and pushes back with reasoning
  when the reviewer is wrong. Use when handling PR comments, inline
  review threads, or asked to "respond to this review", "address
  these comments", or "the reviewer said X".
allowed-tools: Read Bash Grep Glob Edit
metadata:
  dstack:
    type: hybrid
    version: 0.2.0
    context_budget_tokens: 3500
    side_effects: local
    agency: deliberative
    triggers:
      - code review
      - respond to review
      - address review
      - reviewer said
      - handle review feedback
---
# /code-review

Respond to code-review feedback with technical rigor. Verify before
implementing, ask before assuming, push back when the reviewer is
wrong. Skip performative agreement entirely.

## Bundled scripts to run first

Two scripts ship with this skill. Run them via the `Bash` tool before
you reason about any single comment — they do the mechanical fetch so
you can focus on judgement.

| When | Script | Output |
|---|---|---|
| Always | `scripts/get_diff.sh` | The diff under review (GitHub PR if `GH_PR_NUMBER` set, else upstream tracking, else `origin/main`). |
| When the review lives on a PR | `scripts/list_comments.sh <pr-number>` | JSONL: one `{author, file, line, body}` per review comment, top-level + inline. |

Do not paraphrase what the scripts do — invoke them, read the
output, then continue.

## The iron law

```
NO IMPLEMENTATION BEFORE VERIFYING THE CLAIM
NO GRATITUDE EXPRESSIONS, EVER
```

Verification is what makes a code review productive. Without
verification, agreement is theater and disagreement is defensive.

## When to use this skill

- A reviewer left comments on a PR.
- The user shared `/codereview` output or an inline review thread.
- The user said "respond to this review", "address these comments",
  or "the reviewer said X".

Do not use when:

- The user gave a direct instruction (not a review). Just do the
  work and skip the response pattern.
- The "review" is one-liner and obviously correct ("typo in line
  42"). Fix it; reply with the diff.

## The response pattern

For every review item:

1. **Read** the whole review before reacting. No partial responses.
2. **Restate** the requirement in your own words. If the
   restatement feels uncertain, ask before going further.
3. **Verify** the claim against the codebase. Grep, read tests,
   check git history. The reviewer may have missed context.
4. **Evaluate** whether the suggestion is right **for this
   codebase** — same patterns, same stack, same constraints.
5. **Respond** — either a technical acknowledgement (verified,
   agree) or a reasoned push-back (verified, disagree).
6. **Implement** one item at a time. Test each before moving on.

## Forbidden responses

Never write any of these, no matter how true they feel:

- "You're absolutely right!"
- "Great point!" / "Excellent feedback!"
- "Thanks for catching that!"
- Any gratitude expression to the reviewer.
- "Let me implement that now" — before verification.

Instead:

- Restate the technical requirement.
- Ask a specific clarifying question.
- Push back with technical reasoning if the suggestion is wrong.
- Just fix it and show the change. Actions over words.

If you catch yourself about to type "Thanks" or "You're right",
**delete the phrase**. State the fix instead.

## Unclear feedback

If any item in a review is unclear, stop. Do not implement anything
yet. Ask for clarification.

**Why:** review items often relate to each other. Partial
understanding produces wrong implementation.

Example:

```
User: "Fix 1–6."
You understand 1, 2, 3, 6. Unclear on 4 and 5.

WRONG: implement 1, 2, 3, 6 now; ask about 4 and 5 later.
RIGHT: "Understood 1, 2, 3, 6. Need clarification on 4 and 5 before
       implementing."
```

## Source-specific handling

### From the user

- Treat as trusted. Implement after understanding.
- Still ask if the scope is unclear.
- No performative agreement.
- Skip straight to action, or to a one-line technical
  acknowledgement.

### From external reviewers

Before implementing, verify:

1. Technically correct **for this codebase** (not just in general)?
2. Does it break existing functionality?
3. Is there a reason the current implementation looks the way it
   does?
4. Does it hold on all platforms and language versions the project
   supports?
5. Does the reviewer have full context, or are they missing
   something?

If the suggestion looks wrong, push back with technical reasoning.
If you cannot verify without more info: "I cannot verify this
without X. Should I investigate, ask, or proceed?"

If the suggestion conflicts with a prior decision recorded with the
user or in an ADR, stop and discuss before implementing.

## YAGNI check on "implement this properly" requests

When a reviewer asks you to extend or harden a feature:

1. Grep the codebase for actual usage of the thing.
2. If unused, propose removal: "This endpoint is not called. Remove
   it (YAGNI)?"
3. If used, implement properly.

The user, the reviewer, and you all serve the goal of working code.
If a feature is not needed, do not add it.

## Implementation order for multi-item feedback

1. Clarify anything unclear **first**.
2. Implement in this order:
   - **Blocking** — regressions, security, correctness.
   - **Simple** — typos, imports, formatting.
   - **Complex** — refactors, logic changes.
3. Test each fix individually before the next.
4. Verify no regressions before moving on.

## When to push back

Push back when:

- The suggestion breaks existing functionality.
- The reviewer lacks context about the codebase.
- It violates YAGNI (adds an unused feature).
- It is technically incorrect for this stack.
- A legacy or compatibility constraint exists that the reviewer
  did not see.
- It conflicts with an architectural decision in an ADR or agreed
  with the user.

How:

- Use technical reasoning, not defensiveness.
- Ask specific questions.
- Reference working tests, working code paths, or the ADR.
- Loop in the user if the disagreement is architectural.

## Response templates

**Correct feedback, implemented:**

```
Fixed in <file:line>. <One-sentence what changed and why it answers
the comment.>
```

**Correct feedback, batched fix:**

```
Addressed items 1, 2, 4. Item 3 deferred because <reason>; opened
<follow-up>.
```

**Push-back with reasoning:**

```
This breaks <existing path>: <evidence — test name, file:line, ADR>.
Suggest <alternative>. Should we proceed with the alternative, or
do you see something I missed?
```

**Unverifiable claim:**

```
Cannot verify without <X>. Options: <a> investigate by <how>, <b>
ask <whom>, <c> proceed with the assumption that <Y>. Which?
```

**You pushed back and were wrong:**

```
You were right — I checked <X> and it does <Y>. Implementing now.
```

Never:

- "My apologies, I should have…"  ← over-apologizing
- "I pushed back because I thought…"  ← defending
- "In hindsight…"  ← over-explaining

## Common mistakes and their fixes

| Mistake | Fix |
|---|---|
| Performative agreement | State the requirement or just act. |
| Blind implementation | Verify against the codebase first. |
| Batch without testing | One item at a time, test each. |
| Assume reviewer is right | Check whether it breaks things. |
| Avoid pushing back | Technical correctness over comfort. |
| Partial implementation | Clarify all items first. |
| Cannot verify, proceed anyway | State the limitation, ask the user. |

## Cross-references

- `/verification` — every implemented fix is gated by running the
  test and reading the output, not by "should work now".
- `/debugging` — when the reviewer flags a bug, the response is to
  reproduce and trace, not to patch the line they pointed at.

## The bottom line

External feedback is a suggestion to evaluate, not an order to
follow. Verify. Question. Then implement.

No performative agreement. Technical rigor always.
