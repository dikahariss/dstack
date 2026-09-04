# test-driven-development — changelog

- **0.8.2** — 2026-09-04: the "Outside" list is marked as examples (ADR-0031 sweep).
- **0.8.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.8.0** — Comment discipline attached to the cycle and to the final
  checklist. The owner reported generated code arriving padded with comments
  that narrate it; narration reads as machine-written and costs credibility
  with every reader of the diff. GREEN already said minimal code; nobody read
  that as covering narration.
- **0.7.0–0.7.2** — English-only pass; the trigger became `does this need tdd`.
  ADR-0030 sweep + panel review (2026-08-14): the six risk tiers are closed by
  design — a contract other skills name tasks by.
- **0.6.0** — **The cycle is no longer the default for every change.** Owner's
  transcripts across three CLI installs made this the catalog's most expensive
  skill — median 90 min to the next human turn, p90 460 min (n=6, an upper
  bound: the metric includes user idle time) — against 27 min for
  `designing-test-cases`, and the owner still reported heavy manual testing
  afterwards. The research splits the same way; both papers are cited in the
  body above. The derivation carries the value, not the ceremony. Hence the six
  risk tiers, the freeze-list-then-implement path outside them, the named-tier
  decision, and the "green tests are not a working product" gate — the
  archetypal correction being 78 green server tests answered with the owner
  still seeing no result.
- **0.5.0** — Reciprocated the `designing-test-cases` boundary: a case set is
  consumed one row at a time, because a batch of simultaneous red tests defeats
  the watched-failing step this skill exists to protect.
- **0.4.0** — Added the four test classes (happy / edge / invalid / **chaos**)
  with the derive-from-the-contract bias rule, and a stack-agnostic runner
  table: the skill had named only TypeScript tooling while the owner's repos
  are majority .NET, Node, and Python.
- **0.1.0–0.3.0** — Initial port from the v1 catalog; the habit-fix drill and
  the honest-test diagnostic; renamed `tdd` → `test-driven-development`
  (ADR-0027), with `tdd` kept as a trigger so "do TDD" still routes here.
