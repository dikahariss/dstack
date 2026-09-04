# pdf-to-rag — changelog

- **0.6.3** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.6.2** — ADR-0030 catalog review (list openness); panel-verified, see the 2026-08-14 review workflow.
- **0.6.1** — ADR-0030 list openness: common-mistakes table open.
- **0.6.0** — English-only pass (using-dstack 0.7.0's rule): dropped the four
  Indonesian routing phrases from the description and `triggers` — models translate
  intent, so the phrases cost tokens without adding reach; "prepare for RAG" now
  carries that intent in English. PRESERVED as data, not prose: the proper nouns, and
  every Indonesian literal the vision profiles must MATCH on a source page — page
  chrome, structural headings, dictum markers and decision labels. They live in
  `references/` and `eval/`, where the profiles use them; not re-listed here.
- **0.5.0** — Quality pass from two field tests (multi-lens audit). (1) **Verify-before-fix**
  replaces "auto-fix any grounded=false page": a 23-page scanned run flagged 18/23 but
  only 2 were real (rest = omitted chrome or single-letter reviewer misreads); blind
  fixing would have corrupted correct text. (2) Added the canonical **`ground`** profile
  (was a dangling reference) + a SHARED omitted-chrome allow-list so transcribe and ground
  agree. (3) Made the **fully-scanned path** explicit (skip dewrap/gate; vision all +
  assemble). (4) Added **`matrix`** profile + strengthened govdoc dictum/addressee. (5)
  Noted the gate guards the digital fix-pass only, not vision; `garble_ratio`/empty-cell
  caveats. (6) Compressed the body. (7) Review-hardened: per-page-profile one-pass
  Workflow, correct digital `splice`/gate usage (not `assemble`), fm.txt + draft recipes.
- **0.4.0** — Speed pass: `dewrap.py` (deterministic prose, word-identical to AI fix-agents
  at ~10 ms vs ~8.6 min) + one overlapped `pipeline(transcribe, ground)`; ~1h → ~6 min on
  the 279-page benchmark. (ADR-0025, owner-approved.)
- **0.3.0** — `agency: autonomous` + "run autonomously, no checkpoints" directive.
- **0.2.0** — Extracted the deterministic spine into runnable `scripts/`; `type: hybrid`;
  references hold the sandboxed Workflow templates + prompts.
- **0.1.0** — Imported, made self-contained; requires the `Workflow` tool (ADR-0002).
