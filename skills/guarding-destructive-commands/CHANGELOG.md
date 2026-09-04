# guarding-destructive-commands — changelog

- **0.5.1** — 2026-09-04: branch review 2026-09-04: the description says "asks", matching the advisory body; the visible-to-others row names a push to a shared branch or a new remote, not every push; the DEFERRED D2 note is back in one sentence.

- **0.5.0** — 2026-09-04: two rows from the Anthropic autonomy-and-safety sample: operations visible to others (push, PR comment, message, shared infrastructure) and "an obstacle is not a licence" (no `--no-verify`, no discarding unfamiliar files); the dstack hook-deferral paragraphs are replaced by one host-neutral sentence; the description says the agent pauses, not the user.
- **0.4.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.2** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.4.1** — ADR-0030 list openness: the command table is explicitly a floor, now marked not exhaustive.
- **0.4.0** — Renamed `careful` → `guarding-destructive-commands`. A bare
  adjective is exactly the "vague name" Anthropic's naming guidance warns
  against; the new name states the action. The "be careful"/"careful mode"
  triggers are kept.
- **0.3.0** — Declared type/side_effects/agency + calibration:
  deterministic-dominant (ADR-0025; safety guardrail, high failure cost).
  Named the bounded judgment (the table is a floor, not a whitelist).
