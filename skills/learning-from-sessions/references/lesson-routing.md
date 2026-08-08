# Routing a lesson to its one home

The routing call is the whole skill. Put a lesson in the wrong home and it either
never fires (a repo rule that should have been a skill edit) or fires everywhere
(a project quirk enshrined as a universal rule).

## The decision, in order

1. **Is it mechanical?** A harness contract, a tool that refuses a call, a command
   that must be run a certain way → a **repo rule**. These are checkable and
   belong where an agent reads rules before acting.
2. **Is it a way of working?** Ordering, gates, what evidence counts → the
   **owning skill**. If two or more skills would each need the same sentence, it
   belongs in the one that runs earliest.
3. **Is it about the person?** A preference, a standing correction, domain context
   the repo does not record → a **memory entry**.
4. **Will it be false in a month?** A version number, a temporary workaround, a
   sprint deadline → **nowhere**. Say so out loud so it is not re-proposed next
   retro.

## Worked routings

| Observation | Routes to | Why not elsewhere |
|---|---|---|
| 6× "File has not been read yet" | repo rule | Mechanical harness contract. Not a workflow, so no skill owns it |
| User keeps demanding the claim be verified first, before believing it | the verification skill's triggers/routing | A *new* rule would duplicate what the skill already says; the problem is it is not firing |
| User's standing instruction: never discredit our own work | memory (`feedback`) | Context about the user's position and stakes. No repo owns it |
| Agent proposed 3 categories; user pushed back by asking whether it would have said 4 had they claimed 4 | memory (`feedback`) | A standing instruction about sycophancy — hold the position or show the evidence for changing it |
| Same test file edited 11× in one session | the testing skill | Trial-and-error against a failing test is a workflow gap, not a rule |
| A library's API changed | nowhere | Stale next month. Look it up when needed |
| Deploy needs a specific tag format in one repo | that repo's `CLAUDE.md` | Project-specific and mechanical |

## Memory entry shape

Only for lessons about the user or their context. One fact per file.

```markdown
---
name: <short-kebab-slug>
description: <one line — this is what gets matched during recall>
metadata:
  type: feedback
---

<the standing instruction, in one or two sentences>

**Why:** <the incident that produced it — with the date and what it cost>

**How to apply:** <what to do differently, concretely enough to act on>
```

Two rules that keep the memory useful:

- **Cite the incident.** A rule without its origin gets argued with later, or
  quietly dropped because nobody remembers why it exists.
- **Check for an existing file first.** Update it rather than adding a near
  duplicate; two memories that half-agree are worse than one that is stale.

## Retiring a rule

Rules accumulate and eventually nobody can hold them all in mind. Each retro,
spend one pass going the other way:

- **Has it fired?** If a rule has not been relevant in the last several retros
  and the behavior it guarded has not recurred, delete it. The miner tells you:
  if that error signature is gone from the digest, the rule worked or the problem
  did.
- **Is it contradicted?** If a rule and current practice disagree, one of them is
  wrong. Resolve it now — a rule that is routinely ignored teaches that rules are
  optional.
- **Is it duplicated?** Same instruction in two homes → keep the one closest to
  where the decision gets made, delete the other.

A retro that only ever adds is a retro that will be abandoned within a quarter.

## Reading the digest honestly

| Number | What it does *not* mean |
|---|---|
| High correction rate | The agent got worse. It may mean the work got harder, or the user got more engaged |
| Many tool errors | Something is broken. Some errors are cheap probes (checking whether a file exists) |
| Many rework edits | Sloppiness. Iterating on a hard problem looks identical to flailing from the outside |
| Zero corrections | Everything went well. It may mean the user stopped bothering to correct — the worst signal in the set |

Every number here is a prompt to go read the underlying pairs, not a verdict on
its own.
