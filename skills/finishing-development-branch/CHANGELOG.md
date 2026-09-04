# finishing-development-branch — changelog

- **0.4.2** — 2026-09-04: `eval/cases.jsonl` added — 3 behavioural cases, each a prompt plus the anti-pattern it must not produce.

- **0.4.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.0** — Step 1 gains a second gate: read the branch diff before offering
  any option. The owner reported generated code arriving padded with comments
  that narrate it, which reads as machine-written and costs credibility at
  senior level; the last gate before merge is where that has to stop.
- **0.3.2** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.3.1** — ADR-0030 list openness: the common-mistakes list is open; the four end-of-branch options are closed by design.
- **0.3.0** — Managed-worktree cleanup is scoped to `.worktrees/`, `worktrees/`,
  or whatever directory `/using-git-worktrees` selected this session, replacing
  a hard-coded inherited global path that does not exist here. The guard against
  removing a harness-owned worktree is unchanged. Same release reciprocated
  `/test-driven-development` 0.6.0: Step 1 requires `/running-uat` PASS
  evidence for user-visible work before the merge/PR menu — tests green alone
  no longer qualifies the branch.
- **0.2.0** — calibration: deterministic-dominant (ADR-0025; side_effects
  external, the exact bash is the value). Named the bounded judgment
  (confirm the base branch when `merge-base` is ambiguous). Hardening
  (v3 plan): added Cross-references; normalised headings to dstack voice.
- **0.1.0** — Initial. Cleanup is scoped to worktrees this catalog's own
  worktree skill created, so a harness-owned worktree is never removed.
