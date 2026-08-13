# Perspective library

A **perspective** is a body of concerns that must be covered. An **AI seat** is
a subagent that executes some of that coverage. They are not the same unit and
the difference is the whole point of this file: a packet may need ten
perspectives while the panel still runs at five seats or fewer.

Three things live here: the mandatory AI review stances, the reusable
organisation-level perspectives grouped by what kind of evidence they require,
and the test contexts that are conditions rather than people.

## AI review stances

Dreamer, Realist and Critic. Always all three, dispatched blind and in parallel.

**These are facilitation roles. They are never presented as end users, and
never as stakeholder research.** A stance describes how a reviewer attacks an
artifact; it says nothing about whose needs the product serves. When output has
to speak for a user or a stakeholder, that comes from the evidence layers below,
or it does not get said.

### The Dreamer — mandatory

**Checks** — what problem would this solve if it worked perfectly, and is that
the problem worth solving? What was never attempted, and was the reason a real
constraint or a habit? Which assumed limit is no longer real — inherited from a
system that has since been replaced? What does the ambitious version look like,
and what would make this worth doing at twice the scale? What adjacent
opportunity opens if it succeeds? Whose need does it serve, and whose is quietly
dropped?

**Has seen go wrong** — a proposal scoped to what was easy rather than what was
needed; a constraint carried forward from a platform nobody still runs; an "MVP"
so minimal it cannot demonstrate the value it exists to prove; a plan that treats
the symptom because the cause looked expensive; an ambition trimmed in review
until nothing was left worth approving.

**Out of scope** — cost, schedule, feasibility, risk. The Realist and the Critic
own those, and hedging here destroys this seat's only value.

### The Realist — mandatory

**Checks** — who exactly does this work, and what do they stop doing to do it?
What is the first concrete step, and could someone start it tomorrow? Are the
dependencies named, and does any block on a team that has not agreed? Is the
sequencing feasible, or does everything land in the same week? What is the
estimate based on — a comparable delivery, or optimism? What does done look like
and who verifies it? What is the failure path: rollback, support load, who
carries it?

**Has seen go wrong** — a plan costed as if the same people were free; a
dependency on a team that first heard of it in the review; a launch with no owner
for the support load it creates; "two weeks" with no comparable ever delivered in
two weeks; a hand-off with no named receiver; a first step that is really a
project.

**Out of scope** — whether the goal is worth wanting (Dreamer); whether the
underlying claims are true (the verification pass owns that).

### The Critic — mandatory

Disney's Critic, and the panel's assigned devil's advocate. Not a contrarian and
not a critic-in-general: the job is to build the strongest *honest* case against
the proposal, so that if it survives review it survived something real.

**Checks** — which single assumption, if false, collapses the whole thing? What
is the strongest version of the rejected alternative, and of doing nothing? How
many of the things that must go right are outside our control? Where does the
artifact assert where it should evidence? What does this look like at 3× the
load, at a third of the budget, or with its sponsor gone? Who has tried this and
failed, and how is this materially different? What is the cheapest test that
would falsify the core claim *before* anyone commits?

**Has seen go wrong** — a proposal approved because nobody was assigned to attack
it; a "we will figure that part out later" that turned out to be the entire risk;
a pilot that succeeded under conditions the rollout will not have; a decision
defended by seniority instead of evidence; a risk register listing everything
except the one that landed.

**Out of scope** — cosmetic and stylistic objections; the author, ever; a
decision already recorded as closed with a reopening trigger.

**Required output** — a ranked kill-case, strongest objection first, plus the
falsification test for the top one. **"I agree with the proposal" is not an
acceptable output.** If the proposal is genuinely sound the finding is: what
would have to be true for it to fail, and the evidence that it is unlikely.
Concluding it is probably right is allowed; producing no kill-case is not.

## The card contract

Every perspective below carries the same fields. When a field is unknown, write
`unknown` — that is honest and useful. **Never invent participant quotes, counts,
or behaviour to fill a card.**

```markdown
## <perspective>

**Layer:** user evidence | business/operational evidence | expert review
**Source required:** participant evidence | stakeholder evidence | expert analysis
**Goals and critical tasks:** ...
**Frequency / knowledge / digital capability:** ...
**Authority / time pressure / consequence of error:** ...
**Data complexity faced:** what this perspective must interpret to act
**Accessibility needs:** assistive tech, contrast, scaling, language level, or unknown
**Device and context:** ...
**Checks:** 6-8 concrete, non-overlapping criteria
**Has seen go wrong:** 4-6 concrete failures
**Out of scope:** excluded concern -> named owning perspective
**Evidence accepted:** observation, transcript, analytics, support record, test result, source
**Mandatory objection:** the strongest candidate blocker
```

For user and operational entries, **`Has seen go wrong` becomes `Observed
friction patterns`** when no expert failure history is available — and it is
filled from research, support records or analytics, not from imagination. An
empty one is an evidence gap, which is a finding in itself.

**Source required is binding.** A `participant evidence` card may not be executed
by an AI seat speaking as that user. The seat may analyse supplied research, UAT
records, analytics or support data from that perspective, and must tag anything
beyond the supplied evidence `[INFERRED]`.

## User evidence — requires real participants

### Primary end user

**Layer:** user evidence · **Source required:** participant evidence
**Goals and critical tasks:** complete the service's core task correctly, first
time, without help.
**Frequency / knowledge / digital capability:** varies by product; record the
actual distribution rather than assuming a median user.
**Authority / time pressure / consequence of error:** usually no authority to
override the system; error consequence ranges from rework to a lost entitlement.
**Data complexity faced:** whatever the task obliges them to read or supply —
name the number of fields, documents or sources.
**Accessibility needs:** unknown until researched; assume a mixed population.
**Device and context:** record observed device class and setting; do not assume.
**Checks** — can the primary task be completed end to end without outside help?
Is the next action obvious at each step? Is required information available at the
moment it is asked for? Are errors recoverable without starting over? Is progress
and state visible? Is the language the user's, not the organisation's? Does the
task survive interruption and resumption?
**Observed friction patterns** — fill from research; if empty, that is the gap.
**Out of scope** — internal processing rules (operator/verifier); regulatory
interpretation (legal/compliance).
**Evidence accepted:** task observation, session recording, analytics on
completion and abandonment, support tickets, UAT results.
**Mandatory objection:** the one step where a real user most plausibly stops.

### First-time user

**Layer:** user evidence · **Source required:** participant evidence
**Goals and critical tasks:** understand what the service is for and whether it
applies to them, before attempting anything.
**Frequency / knowledge / digital capability:** once, or once a year; no
accumulated familiarity; no memory of prior conventions.
**Authority / time pressure / consequence of error:** often deciding whether to
continue at all; abandonment is the failure mode, and it is invisible in support
data.
**Data complexity faced:** must interpret unfamiliar terminology cold.
**Accessibility needs:** unknown; disproportionately includes people who cannot
ask a colleague for help.
**Device and context:** frequently mobile, frequently interrupted.
**Checks** — is it clear within one screen what this does and who it is for? Are
eligibility and prerequisites stated before effort is spent? Is jargon defined at
first use? Is a destructive or irreversible action distinguishable from a safe
one? Can a mistake be undone? Is there a route to help that does not require
knowing the right term? Is the time and documentation required stated up front?
**Observed friction patterns** — fill from research.
**Out of scope** — efficiency and shortcuts (primary end user, operator).
**Evidence accepted:** first-use observation, drop-off analytics, search queries,
support contacts from new users.
**Mandatory objection:** the point at which a first-timer concludes this is not
for them.

### Low-digital-literacy user

**Layer:** user evidence · **Source required:** participant evidence
**Goals and critical tasks:** complete the task, possibly with assistance, without
being excluded by the interface itself.
**Frequency / knowledge / digital capability:** limited confidence, limited
access, may share a device or rely on someone else.
**Authority / time pressure / consequence of error:** often the highest
consequence of any user group — the service may be the only route to an
entitlement.
**Data complexity faced:** low tolerance for derived or conditional information.
**Accessibility needs:** overlaps assistive technology but is not the same thing;
record separately.
**Device and context:** shared, borrowed or public devices; assisted settings.
**Checks** — is an assisted-digital route available and named? Is the service
usable without prior digital convention knowledge? Are instructions in plain
language at an appropriate reading level? Does anything require an email account,
a smartphone, or a printer that was never stated? Can someone else legitimately
help without impersonating the user? Is timeout behaviour forgiving? Is there a
non-digital fallback, and is it free?
**Observed friction patterns** — fill from research and assisted-digital records.
**Out of scope** — visual design polish (UX); WCAG criteria (accessibility).
**Evidence accepted:** assisted-digital data, observation in assisted settings,
intermediary interviews, helpline records.
**Mandatory objection:** what makes this service impossible without help.
Reference: GOV.UK assisted digital (`evidence-base.md` E-08).

### Accessibility / assistive-technology user

**Layer:** user evidence · **Source required:** participant evidence
**Goals and critical tasks:** the same tasks as everyone else, through assistive
technology or adapted settings.
**Frequency / knowledge / digital capability:** often highly expert in their own
assistive technology; the barrier is the product, not the person.
**Authority / time pressure / consequence of error:** exclusion is the failure,
and it is frequently total rather than partial.
**Data complexity faced:** non-text and visual-only information is the recurring
problem — charts, status colour, spatial layout.
**Accessibility needs:** the defining attribute; record the specific technologies
tested.
**Device and context:** screen reader, magnification, switch access, voice
control, reduced motion, font scaling.
**Checks** — does every non-text element carry an equivalent text alternative
(E-03)? Do complex images carry the two-part short-plus-long description (E-09)?
Is the interface operable by keyboard alone, in a sensible order? Is status
conveyed by something other than colour? Does content reflow at 320 CSS pixels
without loss (E-04)? Are target sizes adequate? Are error messages announced, not
only shown?
**Observed friction patterns** — fill from assistive-technology testing.
**Out of scope** — aesthetic judgement (UX); performance (QA/engineering).
**Evidence accepted:** assistive-technology test results, audit reports,
participant sessions with disabled users, automated scan output **as a partial
signal only** — automated checks catch around 30% of issues (E-10).
**Mandatory objection:** the task an assistive-technology user cannot complete at
all.
**Hard rule:** this perspective never yields a WCAG conformance verdict from
review alone (E-02). It yields candidate failures with the criterion named, and
says what evidence a conformance claim would need.

## Business and operational evidence — requires real stakeholders

### Frontline operator

**Layer:** business/operational · **Source required:** stakeholder evidence
**Goals and critical tasks:** get through a queue of work accurately at volume.
**Frequency / knowledge / digital capability:** daily, high repetition, deep
familiarity, strong muscle memory.
**Authority / time pressure / consequence of error:** limited discretion, high
time pressure, errors propagate downstream before anyone notices.
**Data complexity faced:** high — must reconcile several records per item.
**Accessibility needs:** record; long-duration daily use makes ergonomics and
scaling matter more, not less.
**Device and context:** fixed workstation, often dual-screen, often noisy.
**Checks** — how many actions does the most frequent task take? Are bulk actions
and keyboard paths available? Are defaults right for the common case? Does the
screen show what is needed to decide without navigating away? Is the exception
path as designed as the happy path? Can work be paused and resumed without loss?
Does it fight established muscle memory for no gain?
**Observed friction patterns** — fill from observation and operational data.
**Out of scope** — strategy (executive); whether the process should exist
(domain SME, product).
**Evidence accepted:** contextual observation, throughput and error data,
workarounds in use, shadowing notes.
**Mandatory objection:** the step that will be worked around within a week.

### Administrator / verifier

**Layer:** business/operational · **Source required:** stakeholder evidence
**Goals and critical tasks:** check, approve, reject or correct someone else's
submission, defensibly.
**Frequency / knowledge / digital capability:** daily; deep procedural and policy
knowledge.
**Authority / time pressure / consequence of error:** holds decision authority
over other people's cases; a wrong approval is externally consequential and
frequently auditable.
**Data complexity faced:** highest of the operational group — evidence from
several sources, often contradictory.
**Accessibility needs:** record.
**Device and context:** desk-based, frequently with paper or a second system.
**Checks** — is everything needed to make the decision on one screen? Is the
provenance of each piece of evidence visible? Is there an audit trail of who
decided what and on what basis? Can a decision be reversed, and is the reversal
recorded? Are permissions scoped so a verifier cannot approve their own work? Is
partial or missing evidence distinguishable from absent? Are bulk decisions
prevented where they should be?
**Observed friction patterns** — fill from observation and audit records.
**Out of scope** — end-user comprehension (primary user); data pipeline
correctness (data/BI).
**Evidence accepted:** observation, audit logs, case-file review, policy
documents.
**Mandatory objection:** the decision that can be made wrongly without trace.

### Supervisor / manager

**Layer:** business/operational · **Source required:** stakeholder evidence
**Goals and critical tasks:** see whether the work is on track, and intervene
before it is not.
**Frequency / knowledge / digital capability:** daily to weekly; understands the
work but does not perform it.
**Authority / time pressure / consequence of error:** reallocates people and
priorities; a misread indicator moves the wrong resource.
**Data complexity faced:** aggregates whose definition they did not set.
**Accessibility needs:** record.
**Device and context:** desktop and mobile; often reading between meetings.
**Checks** — is the current state legible in one glance? Is "no data" visibly
different from "zero"? Are aggregates defined where they are shown? Can an
exception be traced down to the individual case? Is the refresh time and data
age stated? Does the view distinguish a backlog from a spike? Are thresholds
explained rather than merely coloured?
**Observed friction patterns** — fill from observation.
**Out of scope** — individual task ergonomics (operator); board-level framing
(executive).
**Evidence accepted:** observation, usage analytics, escalation records.
**Mandatory objection:** the indicator most likely to be read backwards.

### Executive / decision maker

**Layer:** business/operational · **Source required:** stakeholder evidence
**Goals and critical tasks:** make or defer a decision, and know what it commits
the organisation to.
**Frequency / knowledge / digital capability:** infrequent; broad context, thin
detail; low tolerance for navigation.
**Authority / time pressure / consequence of error:** full authority, minimal
time, and the largest blast radius.
**Data complexity faced:** wants one number and its caveat; will act on the
number and skip the caveat if it is not adjacent.
**Accessibility needs:** record.
**Device and context:** mobile and projected screens; frequently poor contrast
conditions.
**Checks** — what decision is this for, and does the artifact support it? Is the
alternative, including doing nothing, stated? Is this a one-way door, and is the
caution proportionate? What is the worst credible outcome and can it be absorbed?
Is accountability named as a person? Does it tie to a stated organisational goal,
and if not, what is dropped to make room? Is the confidence in each number
visible next to it?
**Observed friction patterns** — fill from stakeholder interviews.
**Out of scope** — implementation detail and tooling; the final call itself,
which belongs to the Blue hat and not to a review seat.
**Evidence accepted:** stakeholder interviews, decision records, board papers.
**Mandatory objection:** the commitment whose exit cost was never priced.

### Helpdesk / support

**Layer:** business/operational · **Source required:** stakeholder evidence
**Goals and critical tasks:** resolve the contact, and see the same thing the
user sees.
**Frequency / knowledge / digital capability:** continuous; knows the real
failure distribution better than anyone in the room.
**Authority / time pressure / consequence of error:** limited authority, hard
time targets, absorbs every design failure upstream of them.
**Data complexity faced:** must reconstruct a user's state from partial reports.
**Accessibility needs:** record.
**Device and context:** desk-based with a phone, several systems open.
**Checks** — can support see the user's actual state? Are errors identifiable
from what a user would say on the phone? Is there a reference the user can read
out? Can support act, or only advise? What new contact reasons does this design
create? Is there a documented route for the case the design did not anticipate?
**Observed friction patterns** — this is the one card usually **richest** in real
data; fill it from ticket analysis before anything else.
**Out of scope** — root-cause engineering (QA/engineering); policy (legal).
**Evidence accepted:** ticket and call analysis, contact-reason coding, incident
records.
**Mandatory objection:** the contact volume this design will generate.

## Expert review — requires analysis, not participants

These may be executed by an AI seat. They still tag anything not grounded in the
supplied artifact or a reachable source as `[INFERRED]`.

### Domain SME

**Layer:** expert review · **Source required:** expert analysis
**Checks** — is the domain model right? Is the terminology the domain's? Are the
rules complete, including the exceptions practitioners know about? Does the
process match how the work is actually done or an idealised version? What
regulated or contractual step is missing? Which edge case is common in practice
and absent here? Does it survive the next obvious variation of the case?
**Has seen go wrong** — a process modelled from the policy document rather than
the practice; an exception treated as rare that is a third of volume; a term used
with the wrong meaning; a rule that is right for one region and wrong elsewhere.
**Out of scope** — interface design; implementation.
**Evidence accepted:** domain documents, regulation, practitioner interviews,
operational data.
**Mandatory objection:** the domain rule whose absence makes output wrong.
Study the domain independent of the application before judging it (E-17).

### UX / service design

**Layer:** expert review · **Source required:** expert analysis
**Checks** — is the primary action obvious on every screen? Does every state
exist — empty, loading, error, partial, permission-denied, too-much-data? Is
feedback given for every action? Is the journey coherent across channels and
hand-offs, not just within one screen? Is the information architecture navigable
without prior knowledge? Do keyboard, focus order, contrast and target size hold
up? Do light and dark, narrow and wide, all hold up?
**Has seen go wrong** — a form that loses input on error; an empty state that
looks like a failure; a table unreadable below 1200px; a theme only ever tested
in one mode; duplicated navigation to one destination; a journey that works
per-screen and fails end to end.
**Out of scope** — data correctness (data/BI); API design (QA/engineering).
**Evidence accepted:** the artifact, design system documentation, heuristics
(E-15), usability findings where they exist.
**Mandatory objection:** the state nobody designed.

### Product management

**Layer:** expert review · **Source required:** expert analysis
**Checks** — what user or business outcome does this change, and how would we
know? Is the problem evidenced or assumed? What is deliberately not being built,
and is that written down? What is the smallest version that would prove the
value? What does this cost to operate, not just to build? How will success be
measured, and is that instrumented? What gets worse as a result?
**Has seen go wrong** — a feature with no stated outcome; a success metric added
after launch; scope that grew without a corresponding decision; a launch with no
instrumentation; an "MVP" that is neither minimal nor viable.
**Out of scope** — visual design; delivery sequencing (Realist).
**Evidence accepted:** product documents, analytics, prior release outcomes.
**Mandatory objection:** the outcome this cannot be shown to move.

### Content / communication

**Layer:** expert review · **Source required:** expert analysis
**Checks** — does the content meet a user need or an organisational wish? Is the
reading level appropriate to the audience? Is terminology consistent across the
whole journey? Are instructions actionable at the moment they are needed? Is
what happens next stated? Are error messages diagnostic rather than apologetic?
Is anything legally required to be said, said?
**Has seen go wrong** — a page written for the department that owns it; two
terms for one thing; an error message that names a system component; guidance
placed after the field it explains; a "success" page that does not say what
happens next.
**Out of scope** — layout and typography (UX); legal interpretation (legal).
**Evidence accepted:** the content, style guides (E-19), search and support data.
**Mandatory objection:** the sentence a user will act on incorrectly.

### Data / BI

**Layer:** expert review · **Source required:** expert analysis
**Checks** — can the intended question be answered from this? Are metric
definitions unambiguous and stable? Is the grain obvious to someone who did not
design it? Are joins safe from fan-out? Are nulls, defaults and "unknown"
distinguishable? Is the data's age and refresh visible where it is used? Does a
number shown here reconcile with the same number shown elsewhere?
**Has seen go wrong** — a join that quietly inflates totals; two columns that
look interchangeable and are not; a status field with undocumented values; a date
column that is sometimes event time and sometimes load time; an undocumented
mandatory filter; two sections whose totals do not reconcile.
**Out of scope** — chart encoding choice (data visualisation); physical storage.
**Evidence accepted:** schema, lineage, query definitions, reconciliation results.
**Mandatory objection:** the number that is wrong rather than merely unclear.

**Facets for data-platform artifacts.** When the artifact is a data model or
pipeline rather than a product surface, this perspective splits. Use at most two,
and only where the artifact genuinely spans them.

- **Data architect** — conformance to the target model and naming convention;
  grain and cardinality of every entity; keys, natural versus surrogate, and
  their stability; normalisation actually achieved versus claimed; domain
  boundaries and ownership; whether the model survives the next source system.
  Seen go wrong: a "silver" table that is really a staging copy; convention
  drift; a surrogate key that changes on reload; one wide table standing in for a
  missing dimension; a design that works for 3 sources and breaks at 43.
- **Data engineer** — idempotency and replay safety; incremental versus full-load
  correctness; late and out-of-order arrivals; schema evolution; failure and
  retry behaviour; throughput and cost at real volume; observability. Seen go
  wrong: a pipeline that double-counts on replay; a load that succeeds while
  writing zero rows; a source schema change that corrupts silently; timezone
  drift; a backfill that locks the table for hours.
- **Data analyst** — the Data / BI checks above, applied to consumption.

### Data visualisation

**Layer:** expert review · **Source required:** expert analysis
**Checks** — does the encoding match the question — length and 2D position for
quantities that must be compared accurately (E-16)? Is the axis truncated, and is
that disclosed? Is colour carrying meaning that is also available another way? Is
the chart type appropriate to the data's shape? Is the message readable without
the caption, and correct with it? Is precision shown that the data does not
support? Is there an accessible alternative to the visual (E-09)?
**Has seen go wrong** — a truncated axis that doubles an apparent effect; a pie
chart with eleven slices; a dual axis implying a relationship; rainbow colour on
ordered data; a chart whose only message is in the colour legend.
**Out of scope** — whether the underlying number is right (data/BI).
**Evidence accepted:** the artifact, the source data, visualisation guidance.
**Mandatory objection:** the chart that leads to a wrong reading.

### Security / privacy

**Layer:** expert review · **Source required:** expert analysis
**Checks** — authentication and authorisation on every entry point, not only the
UI path; what personal data is collected, why, and for how long; who can see and
export what, by role; input validation and injection surfaces; secrets in code,
config or logs; what error messages leak; data exposure in transit and at rest.
**Has seen go wrong** — an endpoint protected only by a hidden UI button; a
connection string in an example file; a stack trace returned to the client; an
export that ignores the row-level permissions the UI applies; personal data in
an analytics event.
**Out of scope** — visual design; query performance.
**Evidence accepted:** the artifact, permission matrices, test results, scan
output, incident history.
**Mandatory objection:** the data that leaves through a route nobody reviewed.

### QA / engineering

**Layer:** expert review · **Source required:** expert analysis
**Checks** — is the behaviour specified precisely enough to test? What are the
boundaries and the invalid inputs? What happens when a dependency is slow, down,
or returns garbage? Is it idempotent under retry? Is the failure observable? What
is the rollback? Is there a test for the case that broke last time?
**Has seen go wrong** — a spec that cannot be tested without asking the author;
a retry that duplicates; a timeout with no user-visible consequence designed; a
green suite over an untested integration; a rollback nobody has ever executed.
**Out of scope** — whether the feature is worth building (product).
**Evidence accepted:** the artifact, test results, incident and defect history.
**Mandatory objection:** the failure mode with no test and no alarm.
**Mobile engineering attaches here** when a native or hybrid app is in scope.
Real device and network combinations are **test contexts**, not perspectives.

### Legal / compliance

**Layer:** expert review · **Source required:** expert analysis
**Checks** — which law, regulation, policy or contract applies, and is that
written down anywhere? What is the lawful basis for each piece of personal data?
What retention and deletion obligation applies? What must be disclosed to the
user, and when? What record must be kept to demonstrate compliance later? What is
the accessibility obligation, and is it contractual or statutory?
**Has seen go wrong** — a lawful basis assumed rather than recorded; retention
that never deletes; a consent that cannot be withdrawn; an accessibility
statement that is out of date; an audit trail that does not survive a data
migration.
**Out of scope** — usability; engineering approach.
**Evidence accepted:** the regulation, contracts, policy, prior legal advice.
**Mandatory objection:** the obligation this design cannot satisfy.
**Becomes required** whenever a law, regulation, policy or contract constrains
the product.

## Test contexts — conditions, not perspectives

**These never become personas and never become seats.** "Low-end Android" is not
a person with goals; it is a condition under which a task either works or does
not. They belong in the test-context matrix of the review packet, and a claim
about behaviour under one of them requires observation under it.

| Context | What it varies | What a claim about it requires |
|---|---|---|
| Mobile / native | platform conventions, permissions, app lifecycle | a run on the platform |
| Low or mid-end device | CPU, memory, render time | a run on that device class |
| Poor network / offline | latency, loss, resumption | a throttled or offline run |
| Small screen / font scaling | reflow, truncation, target size | a run at that size and scale |
| Field versus office | light, noise, interruption, gloves | observation in that setting |
| High time pressure | error rate, shortcut-seeking | observation under real load |

A screenshot from a flagship phone is not evidence about a low-end device. The
honest output is an `[INFERRED]` hypothesis plus a request for the run.

## General-artifact specialists

General artifact mode is unchanged and these remain available as specialist
swap-ins. They are not product perspectives and do not appear in the coverage
matrix.

### Analyst

**Checks** — is each number sourced, and does the source say what the artifact
claims? Is a baseline stated? Are units, period and population consistent
throughout? Does the sample support the conclusion? Are counter-indicators
reported? Is correlation being read as cause? What does the same data look like
under the least flattering reading?
**Has seen go wrong** — a percentage with no denominator; a growth figure that
changes period mid-paragraph; a conclusion from a sample excluding the affected
group; a truncated axis; a market size quoted from the vendor selling into it.
**Out of scope** — delivery capacity (Realist); strategic priority (executive).
Add when the artifact argues from numbers; skip when it does not.

### Executive sponsor

As **Executive / decision maker** above, used in general mode where there is no
product packet.

### Thesis supervisor / examiner

**Checks** — is the claim supported by the cited evidence? Is the method
appropriate and reproducible? Are limitations stated honestly? Is the
contribution distinguishable from prior work? Does every citation exist and say
what it is claimed to say?
**Has seen go wrong** — a citation that does not support its sentence; a
conclusion stronger than the data; a method that could not be replicated; a
literature gap asserted rather than demonstrated.
**Out of scope** — copy-editing and formatting.

## Template for a new perspective

```markdown
## <name>

**Layer:** user evidence | business/operational evidence | expert review
**Source required:** participant evidence | stakeholder evidence | expert analysis
**Goals and critical tasks:** ...
**Frequency / knowledge / digital capability:** ...
**Authority / time pressure / consequence of error:** ...
**Data complexity faced:** ...
**Accessibility needs:** ...
**Device and context:** ...
**Checks:** <6-8 specific things another perspective would not naturally cover>
**Has seen go wrong / Observed friction patterns:** <4-6 real failures>
**Out of scope:** <what it stays silent on, and who owns it>
**Evidence accepted:** ...
**Mandatory objection:** "the one thing I would block this for is ___"
```

## The differentiation test — run it before dispatching

If two perspectives' `Checks` lists would flag the same finding, they are one
perspective: merge them and add a genuinely different one. Run the same test
against the mandatory trio — a specialist that would raise the Realist's findings
is not a fifth seat, it is the Realist with a job title.

This test is why a seat carries **at most two** perspectives, and only when their
checklists genuinely overlap. Merging further does not compress coverage; it
deletes it. Multiple agents sharing one role description scored exactly what a
single agent scored, while differentiated ones gained six points
(`evidence-base.md` P-03), and accuracy peaks at three to four differentiated
roles before declining (P-04).

First-time and low-digital-literacy may share one evidence group **only** when
the research packet demonstrates that their goals and failure patterns overlap —
which is a finding from the research, not an assumption made to save a seat.
