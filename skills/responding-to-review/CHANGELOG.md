# responding-to-review — changelog

- **0.6.1** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 40 words; quoted trigger phrases kept.

- **0.6.0** — 2026-09-04: verification stated once (ADR-0031 rule 7, licensed by the 2026-09 Opus 5 ablation): the shouted law, its explanation, the forbidden-phrase list and the "instead" list become one paragraph carrying the two rules with their reasons; the diff-comment rule sits under it; the implementation order is one paragraph and "test each" is said once.

- **0.5.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.5.0** — Comment discipline on both sides of a review, because the owner
  reported generated code arriving padded with comments that narrate it, which
  reads as machine-written and costs credibility at senior level. A request for
  explanatory comments is now a push-back case — right diagnosis, wrong fix —
  and reviewer-addressed comments are named as the code form of the gratitude
  expressions this skill already forbids.
- **0.4.3** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.4.2** — ADR-0030 per-list audit: push-back reasons, the external-reviewer
  verification checklist, and the common-mistakes table declared open; the
  0.4.1 marker covered only the forbidden-responses list.
- **0.4.1** — ADR-0030 list openness: the forbidden-responses list is open — any phrase performing agreement in place of a fix belongs there.
- **0.4.0** — Renamed `code-review` → `responding-to-review`. The old
  name read as "perform a review" while the skill actually handles review
  feedback you *received*, and it collided with `requesting-code-review`.
  The pair now reads request ↔ respond. Trigger keywords unchanged.
- **0.3.0** — Added inline GitHub thread-reply guidance (reply in-thread via
  `gh api .../comments/{id}/replies`, not a top-level comment).
  Evaluated `receiving-code-review` head-to-head and kept this skill as
  the superset; the separate skill was not imported, to avoid duplicate
  discovery triggers.
