# using-dstack — changelog

- **0.23.1** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.23.0** — Registered `/reverse-engineering-video`; renamed
  `/auditing-short-video` to `/auditing-video`. One row could not carry both
  jobs: the audit answers "is this any good", while rebuilding a video needs a
  shot bible, an edit list and prompts — routing the second into the first gave
  a retention critique nobody asked for. The rename is gated, not cosmetic: ten
  of the audit's 36 items are feed mechanics and `format_class` now turns them
  off elsewhere. Old ids stay triggers per ADR-0027.

- **0.22.0** — Registered `/generating-images`. Asking for a picture routed to
  nothing: the catalog covers charts, diagrams and screens, but an image that
  has to be *created* fell through to whatever the model improvised. Measurement
  on both CLI routes showed why that is expensive — neither honours a requested
  size, both self-report dimensions they never measured, and shipped code was
  found recording `1080×1920` for files that were 768×1376.
- **0.21.0** — Registered `/researching-facts`: the catalog had no general
  web-research skill, so a question about the world's current state got one
  built-in search call and whatever that engine happened to rank.
- **0.20.0** — Added the comment-discipline rule as a third cross-cutting
  paragraph: the owner reported generated code arriving padded with narration,
  which reads as machine-written and costs credibility at senior level. It sits
  in the always-on router because no implementation skill fires in every session.
- **0.19.x** — ADR-0030 catalog review; the router table is open by
  construction, since a situation with no row is a routing gap, never a licence
  to skip the check. Registered `multi-persona-review` 0.5.0's product-review
  expansion, with human evidence kept separate from AI seats.
- **0.16.0–0.18.0** — Registered `/prioritizing-work` and made the
  `writing-plans` ↔ `multi-persona-review` chain run both ways. The router row
  alone would not have fired — users type "do all of it", never "which comes
  first" — so the do-everything paragraph keys on the **omission** of an order.
  Repointed at `multi-persona-review` 0.4.0 (Dreamer / Realist / Critic), whose
  row keys on the symptom users actually report: reviewers agreeing too readily.
- **0.14.0–0.15.0** — Stopped routing every behavior change into the full
  red-green cycle and put the visible slice first. Transcript mining measured
  `/test-driven-development` as the catalog's most expensive skill (median 90
  min to the next human turn, p90 460) while the owner still tested manually
  afterwards, and 12+ pushback turns were about the product arriving late — the
  archetype being 78 green server tests answered with "I still cannot see any
  result". "Rigid" now names the gate, not the whole cycle. English-only sweep
  of the catalog, preserving the Indonesian document types as data.
- **0.7.0–0.13.0** — Registered the specification chain, the diagramming and
  modelling skills, and video auditing. Reverted a bilingual trigger table: it
  rested on an unverified claim that cheap models match lexically rather than
  translating, and cost 500 tokens for a capability every model already has.
  Skills stay English; one line says match on intent, reply in the user's
  language.
- **0.1.0–0.6.0** — Initial, reduced to dstack's single host (Claude Code);
  inline router and chains plus the bundled `references/skill-catalog.md` and
  `eval/cases.jsonl` (ADR-0016/0017); `calibration: schema-meta` (ADR-0025);
  registered the literature pipeline, `running-uat`, `multi-persona-review` and
  `learning-from-sessions`; repointed at the five renamed skills (ADR-0027).
