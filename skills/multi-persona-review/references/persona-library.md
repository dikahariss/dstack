# Point-of-view library

Each spec is the machinery: a criteria checklist, a failure catalogue, and an
out-of-scope list. The job title is only a label on top. Copy a spec, trim what
does not apply to the artifact, and dispatch.

Pick views whose concerns **barely overlap**. Two views that would flag the same
issue are one view.

---

## Senior data architect

**Checks** — conformance to the target model and naming convention; grain and
cardinality of every entity; keys (natural vs surrogate) and their stability;
normalisation level actually achieved vs claimed; domain boundaries and ownership;
whether the model survives the next obvious source system.

**Has seen go wrong** — a "silver" table that is really a staging copy;
convention drift (`silver.port_call` where the standard says
`silver_<domain>.port_call`); a surrogate key that silently changes on reload;
one wide table standing in for a missing dimension; a design that works for
today's 3 sources and breaks at 43.

**Out of scope** — pipeline runtime and orchestration (data engineer), dashboard
usability (data analyst), UI styling.

---

## Senior data engineer

**Checks** — idempotency and replay safety; incremental vs full-load correctness;
late and out-of-order arrivals; schema-evolution handling; failure and retry
behaviour; throughput and cost at real volume; observability — can you tell when
it silently stopped?

**Has seen go wrong** — a pipeline that double-counts on replay; a load that
appears to succeed while writing zero rows; a source schema change that corrupts
silently rather than failing; timezone drift between source and target;
backfill that locks the table for hours.

**Out of scope** — whether the model is the right shape (architect), whether the
metric definition is right (analyst).

---

## Senior data analyst

**Checks** — can the intended question actually be answered from this? Are metric
definitions unambiguous and consistent? Are joins safe from fan-out? Are nulls,
defaults, and "unknown" distinguishable? Is the grain obvious to someone who did
not design it? Is anything mislabelled in a way that invites a wrong reading?

**Has seen go wrong** — a join that quietly inflates totals; two columns that
look interchangeable and are not; a status field with undocumented values; a
date column that is sometimes event time and sometimes load time; a filter that
must be applied and is not documented anywhere.

**Out of scope** — physical storage and partitioning, pipeline internals.

---

## UI/UX reviewer

**Checks** — is the primary action obvious? Does every state exist (empty,
loading, error, permission-denied, too-much-data)? Is feedback given for every
action? Keyboard and focus order; contrast and hit-target size; does it work at
narrow widths; do light and dark themes both hold up?

**Has seen go wrong** — a password field with `type="text"`; a form that loses
input on error; a table that is unreadable below 1200px; an empty state that
looks like a failure; a theme that was only ever tested in one mode; duplicated
navigation for the same destination.

**Out of scope** — data correctness, API design.

---

## Security reviewer

**Checks** — authentication and authorisation on every entry point, not just the
UI path; input validation and injection surfaces; secrets in code, config, or
logs; what the error messages leak; data exposure in transit and at rest;
dependency and supply-chain risk.

**Has seen go wrong** — an endpoint protected only by a hidden UI button; a
connection string committed in an example file; a stack trace returned to the
client; a 2FA prompt shown before authentication rather than after.

**Out of scope** — visual design, query performance.

---

## Novice user vs. experienced user

Run these as **two separate views** — their findings genuinely differ.

**Novice checks** — can I complete the task without prior knowledge? Is the
jargon explained? Is a destructive action distinguishable from a safe one? Can I
recover from a mistake?

**Experienced checks** — how many clicks for the thing I do fifty times a day?
Are there shortcuts, bulk actions, sensible defaults? Does it fight my muscle
memory?

**Novice out of scope** — efficiency complaints. **Experienced out of scope** —
"needs more explanation".

---

## Thesis supervisor / examiner

**Checks** — is the claim actually supported by the cited evidence? Is the method
appropriate and reproducible? Are limitations stated honestly? Is the
contribution distinguishable from prior work? Does every citation exist and say
what it is claimed to say?

**Has seen go wrong** — a citation that does not support the sentence it is
attached to; a conclusion stronger than the data; a method section that could not
be replicated; a literature gap asserted rather than demonstrated.

**Out of scope** — copy-editing and formatting.

---

## Template for a new point of view

```markdown
## <name>

**Checks** — <6–8 specific things, concrete enough that another reviewer
would not naturally cover them>

**Has seen go wrong** — <4–6 real failures, not generic risks>

**Out of scope** — <what this view must stay silent on, and who owns it>

**Mandatory objection** — every reviewer must answer:
"the one thing I would block this for is ___"
(and may answer "nothing blocking" only after naming the strongest candidate)
```

**Test the spec before trusting it:** if two views' *Checks* lists would flag the
same finding, they are one view. Merge them and add a genuinely different one.
