# The three-position review pass

The full question sets behind the self-review table in `SKILL.md`. Take the
positions in order — Dreamer, Realist, Critic — and finish one before starting
the next. Answer in writing; a position you only thought about is a position you
skipped.

## Why sequential here and parallel in `/multi-persona-review`

`/multi-persona-review` dispatches its Dreamer, Realist and Critic as separate
blind subagents, because personas run in sequence inside one context anchor on
each other — modal-answer conformity has been measured up to 85.5%. There is
independence there worth protecting.

Here there is not. One author wrote one plan; there is no second opinion to
contaminate. Disney's original form is one person occupying three positions in
turn, and the sequence is the whole mechanism — it exists to get the author out
of the position they drafted in. Running these three "in parallel" in one head
means running none of them.

**When the plan matters enough to want real independence, that is the other
skill.** Write the plan, then send it through `/multi-persona-review`. This pass
is what you owe every plan; that one is what you spend on the expensive ones.

## Dreamer

Ambition and user value. Costs, risks and feasibility are explicitly not this
position's business — hedging here destroys what it is for.

- Read Task 1 and nothing else. Does finishing it put something on screen the
  user can open and click? If not, does the plan declare `backend-only` and say
  why? **This is the only check that rejects a plan outright** — reorder, do not
  patch.
- What did the plan quietly drop from the spec's ambition because it was awkward
  to write as a task?
- Which task was scoped to what was easy rather than what was asked for?
- Is there a cheaper path to the same user-visible outcome that the plan never
  considered? Name it even if the plan stays as it is.
- If this plan succeeds completely, is the result actually worth the tasks in
  it? A plan can be perfectly executable and not worth executing.

## Realist

Execution. Every check here is mechanical — either the plan has the thing or it
does not.

- **Coverage** — point each spec requirement at a task. List gaps and add tasks.
  Every `MUST` or `P0_GATE` from an incoming priority order lands somewhere, and
  every departure from that order is named in one line with its reason.
- **Assignment carried** — if a decision record came in, every row of its
  work-assignment table maps onto a task, and departures are named.
- **Tiers** — every task names a risk tier. No task silently inherits the full
  red-green cycle, and none silently escapes one it needed.
- **Stubs retired** — every stub the visible slice introduced has a named later
  task that replaces it, returning the spec's contract shape rather than an
  invented one.
- **Consistency** — types, signatures and names defined in early tasks are the
  ones used in later tasks. Tasks get read out of order; a mismatch surfaces as
  a compile error three days in.
- **Status block** — present, under the header, every task `todo`, branch named.
  A plan without one cannot be resumed by a fresh session.
- **Fallbacks** — every unchecked row in Assumptions and risks has a fallback.
  A blank response column is a worry, not a plan.
- **Estimates** — is any task actually two? A step that cannot be finished and
  committed in one sitting is not bite-sized, whatever the plan calls it.

## Critic

The assigned adversary. **This position must return a finding.** A pass that
concludes "looks good" has not been run — if the plan is genuinely sound, name
the weakest task and state why it is still acceptable. That is the finding.

- **Placeholders** — "TBD", "implement later", "add appropriate error handling",
  "write tests for the above" with no test code, "similar to Task N", a type or
  function no task defines. Each of these is a hole with a lid on it.
- **First stall** — which task stalls first, and on what? Name the task number
  and the specific thing: a credential nobody has, a service that is not running
  locally, a dataset that has to be requested from another team.
- **Load-bearing assumption** — which single row in Assumptions and risks, if
  false, invalidates the rest of the plan? Is it checked? If it is unchecked and
  load-bearing, the plan should probably check it in Task 1.
- **Irreversibility** — what does this plan commit to that cannot be undone
  later: a schema migration, a published contract, a deleted column, a vendor.
  Is that commitment made earlier in the plan than it needs to be?
- **Ordering trap** — is any task's test able to pass while the feature is
  broken, because the task before it stubbed the thing under test?
- **Silent scope** — is any task doing something the spec never asked for?

## What this pass does not do

It does not make the plan *correct*. It is one author checking their own work,
and the same mind wrote both the plan and the review — correlated blind spots
are expected, not surprising. It catches structural defects: missing coverage,
unretired stubs, placeholders, an invisible Task 1, an unchecked assumption
holding up everything else.

For a plan where being wrong is expensive, this pass is the floor, not the
ceiling. Send it through `/multi-persona-review` afterwards.
