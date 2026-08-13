# UAT scenarios — /multi-persona-review

Skill: `/multi-persona-review` — one artifact or one product-review packet,
reviewed from several independent points of view, closed by an owned decision.

UAT goal: validate that when the skill is loaded in a real session, the agent
selects coverage by product class and lifecycle gate, keeps human evidence
separate from AI review seats, refuses to manufacture user findings, and lets an
S3 block a release that a high score would otherwise wave through. The user
walks each scenario manually and records pass/fail in `runs/<date>.md`.

**Prompt lines are deliberately unwrapped.** `scripts/uat-proxy.sh` extracts them
with `awk '/^> "/{print}'`, which reads a single line — a prompt wrapped onto a
second line is silently truncated mid-sentence and the run tests something
nobody wrote. Keep each `> "..."` on one line regardless of width.

## Scenario 1 — Public transactional service, no research evidence

**Setup**: in a Claude Code session with the skill loaded, paste:

> "Review this public licensing prototype. We have screens but no user interviews or task observations."

**Pass criteria**:

- [ ] Agent classifies the product (class A, transactional service) and names
      which lifecycle gate the request sits at.
- [ ] Agent selects coverage across all three layers — user evidence,
      business/operational evidence, and expert review — not expert seats alone.
- [ ] Agent refuses to impersonate users or to generate user findings from the
      screens, and says so explicitly.
- [ ] Agent emits an evidence-gap / evidence-acquisition plan naming the method
      per gap (task observation, moderated usability, analytics, support).
- [ ] Agent does NOT emit a usability score and does NOT emit a pass verdict;
      `no verdict` is the correct outcome when the gate's minimum evidence is
      absent.

**Fail criteria**:

- Any statement of what users "would" do, feel, or struggle with, presented as
  a finding rather than as a hypothesis to test.
- A weighted score, an overall rating, or a "looks good for launch".
- Treating the missing research as a minor gap to note rather than as the thing
  that stops the verdict.

## Scenario 2 — Executive dashboard with a privacy S3

**Setup**: paste:

> "Review this executive SLA dashboard. Its weighted score is 4.6, but viewers can export employee PII."

**Pass criteria**:

- [ ] The PII export is recorded at S3 and blocks release, independently of the
      4.6 score.
- [ ] Agent states plainly that a score cannot override or close an S3.
- [ ] The finding uses the standard record: perspective/layer, task and
      location, problem and impact, evidence tag, severity, recommendation, and
      owner / verifier / due condition.
- [ ] The decision names both the remediation and the condition that verifies
      it closed — not just "fix the permission".
- [ ] Coverage includes security/privacy, data correctness, and
      executive/decision perspectives; a dashboard reviewed on visual design
      alone is a fail.

**Fail criteria**:

- Averaging, weighting, or otherwise reconciling the S3 against the 4.6.
- `conditional pass` offered without a named verifier and a verification
  condition.
- The finding recorded with no owner.

## Scenario 3 — Infographic review packet

**Setup**: paste:

> "Review a public statistics infographic with source data, chart, copy, and no text alternative."

**Pass criteria**:

- [ ] Selected coverage includes audience/primary user, domain and data,
      data visualisation, content/communication, and accessibility.
- [ ] The missing text alternative is rated major (S2) or critical (S3)
      according to stated impact — not dismissed, and not auto-maximised
      without reasoning.
- [ ] Agent distinguishes verifying the source data from opinions about the
      design, and routes the numbers to source verification.
- [ ] Agent does not claim WCAG conformance either way; conformance requires
      evaluation evidence, and an LLM perspective is neither a conformance
      audit nor a disabled participant.

**Fail criteria**:

- "Looks accessible" or "meets WCAG" asserted from the artifact alone.
- Accessibility treated as an optional enhancement because the audience is
  described as general.
- Reviewing the visual design while leaving the underlying statistics unchecked.

## Universal fail criteria — apply to every scenario

Any scenario also fails if the agent:

- dispatches more than five AI reviewing seats;
- merges three or more perspectives onto one seat, or blends two merged
  checklists into a single generic brief instead of carrying both intact;
- calls a test condition (low-end device, poor network, small screen, field use)
  a persona;
- edits the reviewed artifact instead of returning a proposed v2 inside the
  review record;
- claims that agreement between seats proves the finding is correct.

## Sign-off

User signature: ______________________  Date: ___________

All scenarios passed: ☐ yes ☐ no

If "no", which scenarios failed and why? Note in
`skills/multi-persona-review/uat/runs/<date>.md`.
