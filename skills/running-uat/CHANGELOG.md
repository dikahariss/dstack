# running-uat — changelog

- **0.4.5** — 2026-09-04: the routing table is declared open (ADR-0031 sweep).
- **0.4.4** — 2026-09-04: version history moved from the body to this file (ADR-0031 §3); no body semantics changed.

- **0.4.3** — ADR-0030 catalog review (list openness, consistency); panel-verified, see the 2026-08-14 review workflow.
- **0.4.2** — ADR-0030 per-list audit: the entry gate declared an open floor;
  the evidence section split into open kinds plus a closed-by-design PASS
  floor. The 0.4.1 marker covered only the false-PASS table.
- **0.4.1** — ADR-0030 list openness: the false-PASS guard table is open — a UAT run invents new ways to pass without evidence.
- **0.4.0** — The priority refusal now names a destination. "Propose it, then
  escalate" left an escalation with nowhere to go; it routes to the owner, or to
  `/prioritizing-work` when the question is where the defect sits against other
  work. The refusal itself is unchanged — a UAT run still does not set business
  priority. Same edit in `references/uat-report.md`.
- **0.3.0** — Removed the Indonesian trigger phrases and prose under the
  English-only rule (using-dstack 0.7.0: models translate intent, so the phrases
  cost tokens without adding reach). "Run UAT" and "acceptance test" already
  covered two of them; the third gained the English trigger "make sure every
  acceptance criterion passes". The 0.1.0 entry's mixed-language quote of the entry gate now reads as
  English. Nothing was preserved as data — this skill matches no Indonesian
  literal.
- **0.2.0** — Named `/designing-test-cases` as the producer of the enumerated
  criteria the entry gate demands; the gate had no upstream and refused often.
- **0.1.0** — Initial. Derived from 70 real UAT requests in this user's history
  (the "unit testing before UAT" entry gate, the 3-iteration cap, browser-driven
  execution, per-persona points of view) and cross-checked against ISTQB's
  definitions of acceptance testing, test oracle, entry/exit criteria and
  confirmation testing; Playwright's auto-waiting and web-first assertion
  guidance; and the 2025–2026 agent-honesty literature (AgentRewardBench's ~30%
  judge false-positive rate and 6–14% side-effect precision; "Upward Deceivers" on
  fabricated results and the limited reach of prompt-based mitigation). The
  stale-screenshot rule encodes a measured false regression from an earlier
  session in this workspace.
