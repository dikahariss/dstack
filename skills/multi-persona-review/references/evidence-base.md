# Evidence base

Every factual claim this skill makes, traced to a source that was actually
reached and read. Read this before repeating a number or a justification in
output.

**The rule:** an exact figure may be used only if it has a row here with status
`verified`. A `qualified` row may be used only in the wording its "allowed
wording" column gives. A `removed` row may not be used at all — use the
directional statement instead.

Audited 2026-08-13. Where a row says the source was unreachable, that is a fact
about the audit, not a licence to assume the claim is true.

Status values: `verified` (source reached and it says this), `qualified`
(source reached, says something narrower than the claim did), `removed` (source
not reachable, or does not support the claim).

## Panel mechanics

These are the claims the skill's own design rests on. Three of them were being
stated with more precision than their sources support; those rows say so.

| id | claim | source | authority | status | allowed wording |
|---|---|---|---|---|---|
| P-01 | Role personas do not improve factual accuracy | [arXiv:2311.10054](https://arxiv.org/abs/2311.10054) | research | verified | "A study of 162 personas across 2,410 factual questions and 4 LLM families found that adding personas to system prompts does not improve performance against a no-persona control." Exact figures usable. |
| P-02 | Independent replication finds the same | [arXiv:2512.05858](https://arxiv.org/abs/2512.05858) (Wharton GAIL, Prompting Science Report 4) | research | qualified | Six models on GPQA Diamond and MMLU-Pro; **five of six showed no statistically significant improvement from any expert persona, and nine statistically significant negative differences were observed.** Do **not** write "low-knowledge personas actively hurt" — the reached source attributes the negative differences to expert personas generally, not to a low-knowledge subset. Gemini 2.0 Flash was the exception. |
| P-03 | Differentiation, not multiplicity, is what buys coverage | [arXiv:2308.07201](https://arxiv.org/abs/2308.07201) ChatEval, Table 3 | research | qualified | Table 3, FairEval benchmark, ChatGPT: Single-Agent 53.8%, Multi-Agent **same** role prompt 53.8%, Multi-Agent **diverse** role prompt 60.0%. **The ablation used 2 agents over 2 discussion turns, not three.** Any wording that says "three reviewers with the same role description" misreports the configuration. Say "multiple agents". |
| P-04 | Accuracy peaks at 3-4 differentiated roles and declines at 5 | [arXiv:2308.07201](https://arxiv.org/abs/2308.07201) §4.3 | research | verified | "This pattern reaches an apex with an Acc. of 62.5% at role numbers 3 and 4 before declining at role number 5." This is the direct support for the mandatory trio plus at most two specialists — the cap is not an arbitrary budget. |
| P-05 | More discussion turns do not help | [arXiv:2308.07201](https://arxiv.org/abs/2308.07201) §4.3 | research | verified | "no significant upward trend is detected with respect to the increase in discussion turns"; continual discussion "often leads to stagnation or even degradation of performance". Supports the three-iteration cap. |
| P-06 | A same-family panel has far less independence than its seat count | [arXiv:2605.29800](https://arxiv.org/abs/2605.29800) "Nine Judges, Two Effective Votes" | research | verified | 9 frontier LLMs from 7 model families over three NLI datasets yielded **2.18 effective independent votes**; roughly three-quarters of nominal independence is lost to shared errors; panel accuracy falls **8-22 percentage points** short of what independent voting would give; the best single judge matches or beats the full panel; established aggregation methods close at most 11% of the gap. |
| P-07 | "Judges 6-9 added +0.22 effective votes for linear cost" | — | — | removed | Not found in the reached source. Replace with P-06's verified framing: adding seats to a same-model panel buys far less independence than the seat count implies, and the bottleneck is correlated judges rather than the aggregation rule. |
| P-08 | Agents that see each other's answers conform to the modal answer | [arXiv:2605.00914](https://arxiv.org/abs/2605.00914) "The Cost of Consensus" | research | verified | Peer communication induces sycophantic conformity, with models adopting the modal peer answer **up to 85.5%** of the time; the highest observed was **95.4%** at 32B. This is why dispatch is blind and parallel — the figure describes agents exposed to peers, which this skill's iteration 1 never does. |
| P-09 | Debate can vote away an answer the panel already had | [arXiv:2605.00914](https://arxiv.org/abs/2605.00914) | research | qualified | Scope the claim: on **GSM-Hard with Ministral-3-8B**, at least one agent independently produced the correct answer in 53.0% of cases while the team converged to 20.7% final accuracy — an oracle gap of **32.3 percentage points**. It is the largest gap reported, in one model-dataset pair, not a general constant. Write "up to 32.3 points, in the worst model-dataset pair measured". |
| P-10 | An assigned devil's advocate is the only reliable way to induce dissent | [OpenReview mxBmj5LYU2](https://openreview.net/forum?id=mxBmj5LYU2) "Inducing Disagreement in Multi-Agent LLM Executive Teams" | research | verified | 20 business scenarios, four-agent executive teams, **480 team decisions and 1,920 individual responses**. Baseline disagreement **48.3%**; explicit dissent instructions **55.0%**; strong role framing **61.7%**; both combined **63.3%** — all statistically indistinguishable from baseline. Assigned devil's advocate **99.2%**. All figures usable as stated. |
| P-11 | Disney Creativity Strategy and Six Thinking Hats work | — | — | removed | They are facilitation structures, not measured interventions. **Never cite either framework as evidence.** What carries weight is P-03 (sharply different criteria per seat) and P-10 (the Critic is an assigned advocate). |

## Product and service guidance

| id | claim | source | authority | status | allowed wording |
|---|---|---|---|---|---|
| E-01 | Human-centred design is based on users, their needs and context of use across the lifecycle | [ISO 9241-210](https://www.iso.org/standard/77520.html) | standard | removed | **The source returned HTTP 403 and could not be read.** Do not quote or paraphrase its text, and do not present the skill's process as ISO-conformant. Cite the reachable first-party equivalents instead — E-11 and E-18. Name ISO 9241-210 only as a pointer, never as support for a specific wording. |
| E-02 | WCAG conformance requires evaluation evidence | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | standard | verified | Success criteria are written "to be testable with a combination of automated testing and human evaluation". Automated testing alone does not establish conformance. Levels are A, AA, AAA. **An LLM review is neither a conformance audit nor a disabled participant** — the skill may flag candidate failures, never declare conformance. |
| E-03 | Non-text content needs a text alternative | [WCAG 2.2 SC 1.1.1](https://www.w3.org/TR/WCAG22/) | standard | verified | "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose", subject to the listed exceptions (controls, time-based media, tests, sensory, CAPTCHA, decoration). |
| E-04 | Mobile-specific accessibility guidance | [WCAG2Mobile 2.2](https://www.w3.org/TR/wcag2mobile-22/) | standard (non-normative) | qualified | **W3C Group Draft Note, 6 May 2025 — explicitly "informative guidance … that is not normative and does not set requirements".** Cite for reflow at 320 CSS px (SC 1.4.10), target size (2.5.8), orientation (1.3.4), pointer alternatives (2.5.1). Never present it as a requirement. |
| E-05 | Qualitative round size | [GOV.UK — find user research participants](https://www.gov.uk/service-manual/user-research/find-user-research-participants) | first-party guidance | qualified | Exact source wording: "you would typically have between 4 and 8 participants for a round of interviews or usability tests." **This is per round, not per user group** — the source states no per-group figures. Do not write "4-8 per important group". Recruiting disabled participants "might take more time"; allow up to a month. |
| E-06 | Five users find most issues — qualitative only | [NN/g](https://www.nngroup.com/articles/5-test-users-qual-quant/) | secondary | verified | "By doing a qualitative test with 5 participants, you will identify 85% of the issues in an interface", and "the 5-user guideline only applies to qualitative, not to quantitative studies". Quantitative work needs "usually more than 30", and 40 or more for narrow confidence intervals. Never use 5 users as a release threshold or a prevalence estimate. |
| E-07 | What moderated usability testing establishes | [GOV.UK](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing) | first-party guidance | verified | "Moderated usability testing is where you watch participants try to complete specific tasks using your service." It shows whether users understand what to do and can complete tasks, and surfaces specific usability issues. The page states no participant count; it caps sessions at "no more than 6 one-hour sessions a day". |
| E-08 | Assisted digital support | [GOV.UK](https://www.gov.uk/service-manual/helping-people-to-use-your-service/how-your-assisted-digital-support-will-be-assessed) | first-party guidance | verified | "Assisted digital support is help for people who cannot use digital government services on their own." Assessment requires research with users having "the lowest level of digital skills, confidence and access", a named assisted-digital lead, support free to the user, end-to-end journey testing across all routes, and performance measurement. |
| E-09 | Complex images need a two-part text alternative | [W3C WAI — complex images](https://www.w3.org/WAI/tutorials/images/complex/) | standard (tutorial) | verified | "a short description to identify the image and, where appropriate, indicate the location of the long description. The second part is the long description – a textual representation of the essential information conveyed by the image." Applies directly to charts and infographics. |
| E-10 | Dashboards need manual accessibility testing with real users and experts | [Analysis Function](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-testing-dashboards-for-design-and-accessibility/) | first-party guidance | verified | **"automated checks only catch around 30% of accessibility issues"** — usable as stated. The manual process is: understand the audience and its accessibility needs, run task-based sessions with target users, collect feedback, engage accessibility experts, implement findings. No tester count is given. |
| E-11 | Measure with more than analytics | [GOV.UK — measuring success](https://www.gov.uk/service-manual/measuring-success/measuring-the-success-of-your-service) | first-party guidance | verified | "You can usually see how well a transaction is working for users by using performance metrics combined with user research methods like usability testing", and "Do not just rely on digital analytics. Use a range of data sources – for example user feedback, call centre data or financial information." The page mandates no specific KPI set. |
| E-12 | Government design principles | [GOV.UK](https://www.gov.uk/guidance/government-design-principles) | first-party guidance | verified | Eleven principles, in order: start with user needs; do less; design with data; do the hard work to make it simple; iterate, then iterate again; this is for everyone; understand context; build digital services, not websites; be consistent, not uniform; make things open: it makes things better; minimise environmental impact. |
| E-13 | Empathy maps must be built from research, not assumption | [NN/g](https://www.nngroup.com/articles/empathy-mapping/) | secondary | verified | Quadrants are Says, Thinks, Does, Feels. Practitioners are told to "gather the research you will be using to fuel your empathy map", and "a sparse empathy map indicates that more research needs to be done". Directly supports refusing to complete a card from imagination. |
| E-14 | Method inventory | [Defra — research methods](https://digital.defra.gov.uk/user-research/research-methods) | first-party guidance | verified | Desk research, in-depth interviews, usability testing, contextual enquiry, diary studies, focus groups, co-design workshops, guerrilla/pop-up, card sorting and tree testing, surveys, support-ticket analysis. **No participant numbers are given** — do not source a sample size to this page. |
| E-15 | Complex applications differ from consumer apps | [NN/g](https://www.nngroup.com/articles/usability-heuristics-complex-applications/) | secondary | verified | Complex applications serve "highly trained users in specialized domains" with "broad, unstructured goals or nonlinear workflows". Supports separating the operator/expert perspectives from the first-time-user perspective. |
| E-16 | Dashboards rely on preattentive attributes | [NN/g](https://www.nngroup.com/articles/dashboards-preattentive/) | secondary | verified | Length and 2D position are the most accurately estimated attributes; others are area, angle, colour. The article states **no time threshold** — do not write "a dashboard must be readable in N seconds". |
| E-17 | Studying a complex domain precedes designing for it | [NN/g](https://www.nngroup.com/articles/strategies-complex-application-design/) | secondary | verified | "Study the domain independent of the application or tasks" and "Conduct studies in the work environment"; evaluate with scenario-based interviews and contextual observation, not task completion alone. |
| E-18 | Research method varies by service phase | [GOV.UK — user research](https://www.gov.uk/service-manual/user-research) | first-party guidance | verified | Guidance is organised by discovery, alpha, beta and live, with methods including contextual observation, experience mapping, in-depth interviews, moderated usability testing, pop-up and remote research, plus specific guidance on users who do not use digital services and on disabled participants. |
| E-19 | Content design is part of the product | [Defra — content](https://digital.defra.gov.uk/content) | first-party guidance | verified | "Content design makes services easy to understand and use. It involves planning, writing and managing content so that it meets user needs." Detailed style rules live in the GDS style guide and the GOV.UK design system, not here. |

## Numerical claims — the standing constraints

1. **`4-8 participants`** is a qualitative round size for interviews or usability
   tests (E-05). It is not per user group, not a statistical sample, and never a
   release threshold. Any prevalence or benchmarking question needs E-06's
   quantitative sizing instead.
2. **`5 users find 85% of issues`** applies to qualitative studies only (E-06).
   Quoting it to justify a launch, a percentage of users affected, or a
   comparison between products is a misuse of the source.
3. **A `95% task success` figure on any card is a product-specific example**, not
   a threshold this skill sets. Cards carry the number only when a named study
   measured it for that product.
4. **WCAG conformance is never asserted from a review** (E-02). The skill reports
   candidate failures with the criterion referenced, and says what evidence a
   conformance claim would require.
5. **Panel figures are about panels, not about products.** P-01 through P-10
   justify how this skill runs its own reviewers. They are not findings about the
   artifact under review and must never appear in a decision record as though
   they were.
6. **Structural counts are the skill's own definitions** and need no source:
   three stances, at most five AI seats, at most two perspectives per seat, three
   iterations, six product classes, six lifecycle gates, fifteen scorecard
   dimensions, four severity levels.

## What changed in this audit

Three claims the skill was already making were being stated too precisely, and
one could not be traced at all:

- **P-03** — the ChatEval ablation used two agents, not three. The percentages
  were right; the configuration was not.
- **P-09** — the 32.3-point oracle gap is one model on one dataset, the worst
  case measured, not a general property of debate.
- **P-02** — "low-knowledge personas actively hurt" is not what the reached
  source says.
- **P-07** — "+0.22 effective votes" could not be found in the source and is
  withdrawn.

Two claims were found that the skill was **not** yet using and should:
**P-04** (accuracy peaks at 3-4 roles, declines at 5 — the cap has direct
support) and **P-05** (more turns do not help — so does the iteration cap).
