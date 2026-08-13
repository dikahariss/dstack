# Product review framework

One reusable standard, instantiated per product. A twenty-application portfolio
runs this framework twenty times; it does not produce twenty bespoke standards.

Order of operations: **product class → lifecycle gate → evidence check →
coverage selection → seat mapping → findings → score → decision.** The evidence
check comes before coverage selection on purpose: there is no point selecting
ten perspectives when the gate's minimum evidence is absent.

## 1. One run, one packet

A run covers **one product-review packet, at one product class, at one lifecycle
gate.** Anything else is split into separate packets.

Select **one primary class** by the packet's primary task:

| Code | Product class | Primary task signal |
|---|---|---|
| A | Transactional service | submit, apply, pay, request, track |
| B | Internal operational system | process, verify, administer, repeat work |
| C | Public information | find, understand, trust, act on content |
| D | Dashboard / monitoring | detect status, anomaly, SLA, workload |
| E | Analytical report | interpret evidence, compare, explain, decide |
| F | Infographic / data communication | understand a visual message quickly and accessibly |

Add a **secondary class** only for a distinct surface with its own critical task
— not because the product has a page that resembles one. A portal that is a
transactional service, a public information site and an internal dashboard is
three packets at three gates, reviewed one at a time. Forcing it into one class
silently drops the critical tasks of the other two, and that is the failure this
rule exists to prevent.

## 2. Lifecycle gates and their minimum evidence

| Gate | Decides | Minimum evidence |
|---|---|---|
| 1 Problem validation | the need is real and important | user/stakeholder research plus current-process evidence |
| 2 Concept review | the proposed direction fits the need | concept artifact, alternatives, assumptions, domain evidence |
| 3 Prototype usability | target users can understand and attempt critical tasks | task-based participant observation — **no simulated-user substitute** |
| 4 Expert review | disciplinary standards and failure modes are covered | artifact plus relevant expert checks and sources |
| 5 Pre-release validation | end-to-end critical scenarios are releasable | running-system UAT, test, security, accessibility and data evidence |
| 6 Post-launch review | adoption, outcomes and recurring failures are understood | analytics, feedback, support, operational outcomes, research |

**If the requested gate's minimum evidence is absent, output an
evidence-acquisition plan and stop before any verdict or score.** The verdict
field is `no verdict`. This is not a refusal — the evidence plan is the
deliverable, and it is more useful than a score nobody can defend.

Gate 4 is the one an AI panel can execute alone. Gate 3 is the one it can never
substitute for. Expert review may proceed while user evidence is missing, but
only with the gap named and no user-outcome claim attached.

## 3. Coverage selection

**Minimum coverage, every packet:** primary user; an edge perspective
(first-time, low digital literacy, or accessibility as the product warrants);
an operational or business owner; a decision or domain owner; UX or product; and
quality. Add **data** when the product presents metrics, **content** when public
communication is material, and **legal/compliance** when regulation applies.

Values are `required | conditional | omit`. No emoji.

| Perspective | Service | Internal operations | Public information | Infographic | Report | Dashboard |
|---|---|---|---|---|---|---|
| Primary user | required | required | required | required | required | required |
| First-time user | required | conditional | required | conditional | conditional | conditional |
| Low digital literacy | required | conditional | required | conditional | omit | omit |
| Accessibility / assistive technology | required | required | required | required | required | required |
| Operator / verifier / administrator | required | required | omit | omit | conditional | required |
| Supervisor / manager | conditional | required | omit | omit | required | required |
| Executive / decision maker | conditional | conditional | omit | omit | required | required |
| Domain SME | required | required | required | required | required | required |
| UX / service design | required | required | required | conditional | conditional | required |
| Product management | required | required | required | conditional | conditional | required |
| Content / communication | required | conditional | required | required | required | conditional |
| Data / BI | conditional | conditional | conditional | required | required | required |
| Data visualisation | omit | conditional | conditional | required | required | required |
| Security / privacy | required | required | conditional | omit | conditional | required |
| QA / engineering | required | required | required | conditional | conditional | required |
| Helpdesk / support | required | required | conditional | omit | omit | conditional |
| Legal / compliance | conditional | conditional | conditional | conditional | conditional | conditional |

Legal/compliance becomes `required` whenever a law, regulation, policy or
contract constrains the product. Mobile engineering attaches to QA/engineering
when a native or hybrid app is in scope; real device and network combinations
stay in the test-context matrix.

**Target 6-10 coverage rows.** Emit the selection as:

```markdown
| perspective | layer | required/conditional | why selected | evidence available | AI seat or external evidence owner |
```

## 4. Mapping coverage onto seats

The AI panel is three mandatory stances plus **at most two** differentiated
specialists. Five seats, hard cap. Six to ten perspectives therefore do not map
one-to-one, and how they are compressed decides whether the panel works at all.

**At most two perspectives per seat**, and only when their `Checks` lists
genuinely overlap.

Differentiation is the only measured mechanism here. Multiple agents sharing one
role description scored exactly what a single agent scored — 53.8% against 53.8%
— while differentiated ones reached 60.0%, and accuracy peaks at three to four
differentiated roles before declining at five (`evidence-base.md` P-03, P-04).
A seat briefed as "operator plus supervisor plus helpdesk" is a generic seat:
the 53.8% condition, arrived at from the other direction.

So, when a seat carries two perspectives:

- its prompt carries **both checklists intact and separately labelled** — never a
  blended summary;
- every finding is **tagged with the originating perspective**;
- the unique-finding diagnostic is computed **per perspective, not per seat**, so
  a merged seat returning findings for only one of its two shows up as an
  uncovered perspective rather than a healthy seat.

If more than two perspectives remain uncovered after that, **the packet is too
big for one run.** Split it by gate or by surface and say so. Coverage that
cannot be executed is reported as an evidence gap; it is never silently absorbed.

Named human reviewers and research participants are **evidence providers**, not
AI seats, and the five-seat cap does not apply to them. A real panel of nine
people is fine. Nine same-model subagents is not.

## 5. Research method selection

| Question | Primary method | Corroborating evidence |
|---|---|---|
| Why does the need or workaround exist? | interview | support records, policy and process documents |
| How is the work actually performed? | contextual observation | workflow artifacts, operational data |
| Can users complete critical tasks? | moderated task-based usability | UAT evidence, error and abandonment analytics |
| How often and where does behaviour occur? | analytics | survey or operational counts |
| How widespread is a perception? | survey with an appropriate sample | interviews explaining the result |
| What repeatedly fails after launch? | support and helpdesk analysis | analytics, incident records, follow-up research |
| Which standard or discipline is violated? | expert review | source verification and test evidence |

**A survey alone cannot prove task success.** Satisfaction is not completion, and
a post-launch survey does not retrofit the gates that were skipped.

**Round size.** GOV.UK states "you would typically have between 4 and 8
participants for a round of interviews or usability tests" (`evidence-base.md`
E-05). Three constraints travel with that number and must travel with it here:
it is **per round, not per user group** — the source gives no per-group figure;
it is qualitative guidance, **not a statistical sample**; and it is **never a
release threshold**. Prevalence and benchmarking questions need quantitative
sizing instead — more than 30, and 40 or more for narrow confidence intervals
(E-06).

## 6. Finding record and severity

```markdown
### PR-<nnn> — <short title>
Perspective -> Task -> Problem -> Evidence -> Severity -> Recommendation

**Perspective/layer:** ...
**Task and artifact location/state:** ...
**Problem and impact:** ...
**Evidence:** observed / sourced / inferred / missing, with source
**Severity:** S0 observation | S1 minor | S2 major | S3 critical
**Recommendation:** smallest testable change
**Owner / verifier / due condition:** ...
```

Legacy severities map exactly: `observation -> S0`, `minor -> S1`,
`major -> S2`, `blocking -> S3`.

**S3** means critical-task failure, a wrong decision or wrong data, data loss, or
a security or privacy exposure. **S3 blocks release until verified closed**,
regardless of any score, average or weighting. A finding whose evidence tag is
`inferred` may not carry S3 — it becomes a named assumption with an owner, or
the evidence gets gathered.

## 7. The secondary scorecard

Scores rank follow-up and compare like-for-like packets. **They never close a
finding and never override an S3.**

Fifteen stable dimensions: user-need fit, task success, ease of use,
learnability, efficiency, content clarity, information architecture,
accessibility, error prevention and recovery, trust and transparency, visual
hierarchy, cross-device behaviour, perceived performance, data accuracy,
decision and actionability.

Each row is `1-5 | NE | NA`, and each rated row records its evidence and its
weight. `NE` means not evidenced. `NA` needs a stated reason. Publish the weight
profile used. Default emphasis:

- **operator profile** — task success, efficiency, error prevention/recovery `×3`
- **executive profile** — decision/actionability, information hierarchy, data
  accuracy `×3`
- **public user profile** — learnability, content clarity, task success `×3`

**No overall score is emitted when a required dimension is `NE`.** Report the
dimension rows and the gap instead. An average computed over missing evidence is
a fabricated number with a decimal point on it.

## 8. What the gate withholds — and what still ships

Withhold the **verdict and the score**, and emit `no verdict`, when:

- the requested gate's minimum evidence is absent;
- a user-outcome claim is requested and no participant evidence exists;
- a required scorecard dimension is `NE` and an overall score was requested;
- more than two perspectives cannot be covered within five seats and the packet
  has not been split.

**None of these halt the review.** Withholding a verdict is not the same as
declining to work, and a gate table on its own is not an output. In every case
above the run still produces: the coverage table with its seat map, the panel
dispatched over whatever artifact does exist, the expert findings that artifact
supports as `PR-nnn` records, and the evidence plan naming the method per gap.
Each finding carries the tag for what it does **not** establish.

The single case that stops outright is **no artifact and no packet at all** —
there is then nothing to review, and the evidence plan is the whole deliverable.
Emit `STOP — evidence acquisition required` only there. Anywhere else, stopping
at the gate table is the failure mode: it looks rigorous and delivers nothing
the requester can act on.
