# researching-facts — changelog

- **0.1.4** — 2026-09-04: description says what the skill produces and when to open it, never the workflow (ADR-0031, plan Task 10): 117 words (120-word tier: the trigger list is the discovery path); quoted trigger phrases kept.

- **0.1.3** — 2026-09-04: the Bash examples call the bundled script as `python3 "<skill_dir>/scripts/brave_search.py"` instead of a cwd-relative path that fails outside this repo.
- **0.1.2** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.1.1** — Wrote every money figure as `USD 5`, never with a currency sign
  before a digit. Invoking a skill with arguments substitutes `$N` in the body
  with the Nth word of those arguments, so the metered-cost figures reached the
  model as words lifted out of the user's question — corrupting the one section
  that exists to bound unattended spend. Caught by invoking this skill with an
  argument string.
- **0.1.0** — Initial. Written when the catalog had no general web-research skill:
  research meant one built-in `WebSearch` call and whatever it happened to rank.
  Adds a second independent index (Brave), the same-message parallel rule, RRF
  merge across query variants, the independence definition, and mandatory
  disclosure when the fan-out degrades to one engine.
