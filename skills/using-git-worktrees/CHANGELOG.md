# using-git-worktrees — changelog

- **0.3.4** — 2026-09-04: `eval/cases.jsonl` added — 2 behavioural cases, each a prompt plus the anti-pattern it must not produce.

- **0.3.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.3.2** — ADR-0030 catalog review (list openness, cut restated general knowledge, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.3.1** — ADR-0030 list openness: the common-mistakes list is open.
- **0.3.0** — Replaced an inherited hard-coded global worktree path with generic
  external-directory detection (`../*worktrees*`). That path does not exist on
  this machine and never did; it was import residue presented as live
  back-compat, and a detection step that can never fire is still a tool call a
  model spends.

- **0.2.0** — calibration: deterministic-dominant (ADR-0025; deterministic
  by design — detection + exact bash). Named the bounded judgment (the
  native-vs-`git worktree` fallback choice). Hardening (v3 plan): added
  "When NOT to use" + Cross-references; normalised headings to dstack
  voice; consolidated the external-directory detection note.
- **0.1.0** — Initial. The native-tool guidance matches Claude Code's
  `EnterWorktree`/`ExitWorktree`; detection prefers an isolation the
  workspace already has over creating a new one.
