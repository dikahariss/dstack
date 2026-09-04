# learning-from-sessions — changelog

- **0.2.6** — 2026-09-04: branch review 2026-09-04: the three miner invocations use `"<skill_dir>/scripts/…"`, since an installed skill is read from its own folder, not the cwd.

- **0.2.5** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 66 words; quoted trigger phrases kept.

- **0.2.4** — 2026-09-04: the exit condition is a written change, committed when the user asks (CLAUDE.md commit rule); the scratch path and the project example are placeholders, not `/tmp` and a real project; the record location is `CHANGELOG.md`.
- **0.2.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.2.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.2.1** — ADR-0030 list openness: the guard table is open — a retro invents new ways to flatter itself.
- **0.2.0** — Indonesian trigger phrases and prose removed under the English-only
  rule (using-dstack 0.7.0: models translate intent, so the phrases cost tokens
  without adding reach). The description and `metadata.dstack.triggers` now carry
  English triggers of the same intent, and the worked routing examples in
  `references/lesson-routing.md` state the user's pushback in English rather than
  quoting it in Indonesian. Preserved as data: the Indonesian correction and
  verify-demand regexes in `scripts/mine_sessions.py`, which exist to match real
  Indonesian transcripts, and the Indonesian prompts in `eval/cases.jsonl`, which
  are the proof that an English skill still matches an Indonesian request.

- **0.1.0** — Initial. Built after mining this user's own corpus: 121 main-session
  transcripts (2,390 of 2,511 files were subagent transcripts and had to be
  excluded), 12% of human turns were corrections, and the top recurring tool
  error was one the agent had committed twice in the same session that proposed
  this skill. The self-flattery guard follows the measured self-preference bias
  in LLM self-evaluation; the "output is a diff" rule follows the standard
  retrospective failure of producing findings nobody acts on.
