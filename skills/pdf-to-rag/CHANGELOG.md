# pdf-to-rag — changelog

- **0.7.1** — 2026-09-04: branch review 2026-09-04: the ground schema in `references/workflows.md` now carries the per-item `confidence` the 0.7.0 prompt asks for (three files had disagreed and the runtime enforced the stale one); a single-letter claim is reported at `low` instead of dropped; five sentence-initial "Never" restored in the vision prompts.

- **0.7.0** — 2026-09-04: delegation unit and ceiling stated (ADR-0031 rule 6): one vision agent per page, grounded in the same pass, through one Workflow at its own concurrency limit — no reviewer agents, no pilot batch, no per-chunk fix agents unless `dewrap.py` mis-structured a region. The Max-plan premise, the "supersedes pdf2md" line and the proven-on paragraph are gone; the dewrap justification keeps its measured claim in one sentence. The ground profile returns a confidence per item, and verify-before-fix re-reads only `high` and `medium` items, keeping a `low` single-letter claim.

- **0.6.4** — 2026-09-04: register lowered to sentence case throughout the body and the vision prompts; every rule and reason kept; bold stays on the two irreversible rules (never back-fill a blank cell; never `splice.py splice` a flagged page) and on the scope word "all vision pages".
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
