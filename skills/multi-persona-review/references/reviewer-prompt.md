# Dispatch prompts

## One blind reviewer

Send one per point of view, in parallel. Each reviewer sees the artifact and its
own spec — **never a sibling's output, and never your session narrative.**

```
You are reviewing one artifact from a single, specific point of view.

## The artifact
<full text, or exact paths + the range that matters>

## Its purpose
<what it is meant to achieve, and for whom — 2–3 sentences>

## Your point of view: <name>

You check:
<criteria checklist>

You have seen these go wrong before:
<failure catalogue>

You do NOT comment on:
<out-of-scope list> — another reviewer owns each of those. Staying silent
on them is correct behaviour, not an omission.

## Rules

1. Every finding needs a LOCATION (file:line, or a quoted phrase from the
   artifact). A finding you cannot anchor is dropped — do not include it.
2. Every finding needs a SEVERITY: blocking / major / minor / observation.
   Severity is observable impact. Do not assign business priority.
3. Do not restate the artifact back to me. Findings only.
4. Length is not a quality signal here. Six grounded findings beat twenty
   padded ones.
5. You MUST answer the objection field, even if the artifact looks fine.

## Output format

### Findings
- [severity] <location> — <what is wrong> — <why it matters> — <what to do>

### The one thing I would block this for
<the single strongest objection you can construct. If you genuinely believe
nothing is blocking, name the strongest candidate anyway and then say why it
falls short of blocking. "Nothing" alone is not an acceptable answer.>

### What I did not look at
<one line — so the arbiter knows your blind spots>
```

## Arbiter

Runs once, after all reviewers have returned.

```
You are reconciling independent reviews of one artifact. Reviewers worked
blind and in parallel.

## The artifact
<same artifact>

## Reviews
<all reports, IN RANDOMISED ORDER>

## Rules

1. UNION, do not vote. Merge every finding. Dedupe only when two findings
   share the same location AND the same root cause. A finding raised by
   exactly one reviewer is kept at full weight — it is the most valuable
   output of this exercise.
2. Agreement is weak evidence. All reviewers share one base model, so
   correlated errors are expected and unanimity confirms little. Do not
   promote a finding because several reviewers raised it.
3. Arbitrate ONLY genuine contradictions — one reviewer says do X, another
   says do not-X. Two reviewers describing the same issue in different words
   is not a contradiction; merge it.
4. One rebuttal round maximum. If a contradiction survives, escalate it with
   both positions stated in full. Do not silently pick a side.
5. Ignore report length. Ignore report order.
6. If the artifact was authored by the same model reviewing it, add a
   self-review warning to the output.

## Output format

### Blocking
<findings that must be resolved, each with location + why>

### Major / Minor
<grouped, each with location>

### Contradictions — needs a human decision
<position A, position B, what turns on it>

### Coverage diagnostic
| point of view | findings | unique to it | unique % |
Flag any view under ~10–20% unique: its criteria checklist is too close to
another's, or the view is not earning its slot.

### Observations
<noted, not actioned>
```

## Why these prompts look like this

Every rule above maps to a measured failure: ungrounded findings to
confabulation; the mandatory objection to the finding that explicit
devil's-advocate assignment lifts disagreement from ~48% to ~99% while "strong
role framing" does nothing; blind parallel dispatch to conformity measured up to
85.5%; one-round arbitration to debate-to-consensus voting away correct answers;
randomised order to position bias; the length rule to verbosity bias; the
unique-% diagnostic to effective-independence collapse (≈2.18 of 9 judges).
