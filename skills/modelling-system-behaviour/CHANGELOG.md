# modelling-system-behaviour — changelog

- **0.2.4** — 2026-09-04: the Stage 0 input table is declared closed by design (ADR-0031 sweep).
- **0.2.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: the UML element set is closed by design (the notation defines it); the three rules shown are open.
- **0.2.0** — Dropped the Indonesian trigger phrases from the description and
  the trigger list, and put the example ask into English, under the English-only
  rule (`using-dstack` 0.7.0): models translate intent rather than matching
  lexically, so the phrases cost tokens without adding reach. `system actors`,
  `system boundary`, `interaction scenario` and `interaction diagram` were added
  to carry the reach the removed phrases had. `NPWP` stays in
  `references/use-case.md` as a proper noun in a worked example, and the
  Indonesian eval prompts are deliberately untouched — they are the proof that
  an English skill still matches an Indonesian request.
- **0.1.0** — Initial. Built after measuring that **PlantUML exits 0 on a syntax
  error and writes a plausible SVG** — a deliberately broken file produced 1,963
  bytes reading `A A` — which is why rendering is followed by a round-trip check
  rather than trusted. A second measurement shaped the checker: a malformed
  message line is *dropped* and the rest renders intact, so the round-trip alone
  cannot see it and a source-level dangling-arrow check exists too. Use case and
  sequence share one skill because the cross-model actor check — an actor
  driving a sequence but named in no use case model — only exists if they do.
