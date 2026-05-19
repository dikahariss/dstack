# Review

> **Sumber:** [`review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

`/plan-eng-review` review **plan**; `/review` review **diff** sebelum
landing. Skill ini analyze branch diff melawan base branch untuk
struktur masalah yang sulit terlihat saat menulis: SQL safety (mass
update tanpa where, missing index), LLM trust boundary violation
(unfiltered user input ke prompt), conditional side effects yang
silent fail, dead code, hardcoded secrets, dan ribuan pattern
lainnya. Output: structured findings dengan severity, file:line,
recommendation.

Skill ini berbasis **multi-pass adversarial**:

- **Claude structured pass** (primer) — checklist methodical.
- **Claude adversarial subagent** (always-on) — fresh context,
  attacker mindset, recommendation line wajib.
- **Codex adversarial challenge** (always-on jika Codex available)
  — cross-model coverage.
- **Codex structured review** (large diff ≥200 lines) — gate dengan
  P1 marker, fail → AskUserQuestion fix-now atau continue.
- **Synthesis** — high-confidence findings (multi-source agreement)
  diprioritaskan.

## Kapan menggunakannya

Trigger di `description`:

- "review this PR", "code review", "pre-landing review",
  "check my diff"
- Trigger field: `review this pr`, `code review`, `check my diff`,
  `pre-landing review`

Proactive: ketika user akan merge atau land code changes.

Versi: `1.0.0`, `preamble-tier: 4`.

## Cara menggunakannya

1. **Detect base branch** + diff scope (`git diff origin/<base>`).
2. **Step 5.0** — suppression: cek prior review log, jika finding
   yang sama sudah dianggap "wontfix" oleh user, skip.
3. **Claude structured pass** — review pattern, hasil dengan severity
   CRITICAL/INFORMATIONAL + fingerprint `path:line:category`.
4. **Fix-First pipeline**:
   - **AUTO-FIX items** (typo, lint, dead import) — apply langsung,
     tidak butuh konfirmasi. Output "auto-fixed".
   - **ASK items** — AskUserQuestion per finding (atau group serupa
     dengan ringkas). Action: "fixed" jika user approve, "skipped"
     jika user decline.
5. **Claude adversarial subagent** dispatched via Agent tool dengan
   fresh context. Output bercabang FIXABLE (flow ke Fix-First) atau
   INVESTIGATE (informational). Mandatory final line: `Recommendation:
   <action> because <one-line reason naming most exploitable
   finding>`.
6. **Codex adversarial challenge** (always when Codex available,
   non-blocking) — similar prompt, filesystem boundary instruction
   (skip `~/.claude/`, `.claude/skills/`, `agents/`).
7. **Codex structured review** (diff ≥200 lines) — `codex review
   --base <base>`. Cek `[P1]` markers → GATE PASS/FAIL. FAIL →
   AskUserQuestion fix-now (recommended) vs continue.
8. **Persist via gstack-review-log**:
   - `adversarial-review` entry (always-on tier).
   - `review` entry (skill-level), dengan
     `quality_score`, `specialists` (per-specialist dispatched/
     findings), `findings` array (fingerprint + severity + action),
     `commit`.
9. **Cross-model synthesis** — high confidence (multi-source agree),
   unique per source.
10. **Greptile reply templates** dari `greptile-triage.md` — setiap
    reply ke PR comment include evidence (inline diff, code ref,
    re-rank suggestion).

Skill TIDAK pernah commit, push, atau create PR — itu job `/ship`.

## Contoh / Studi kasus

Branch dengan diff 350 lines.

`/review`:

1. Structured pass: 4 finding (1 CRITICAL: SQL injection di
   `app/api/users.ts:47`, 2 INFORMATIONAL: dead variable, missing
   JSDoc, 1 CRITICAL: hardcoded API key).
2. AUTO-FIX dead variable + JSDoc. ASK untuk 2 critical.
3. User approve SQL fix (prepared statement). Hardcoded key →
   migrate to env var.
4. Adversarial subagent menemukan race condition di queue worker
   yang structured pass lewat → user fix.
5. Codex adversarial: confirm semua + 1 finding baru (timezone bug).
6. Diff 350 → Codex structured review trigger. `[P1]` markers: 0.
   GATE PASS.
7. Persist `review` entry: status `clean`, quality_score 7.5, 4
   findings logged dengan action "auto-fixed"/"fixed".
8. Dashboard `/ship` lihat entry CLEAR (DIFF) terbaru → verdict
   CLEARED.

## Kesimpulan

`/review` adalah final gate engineering sebelum `/ship`. Multi-pass
adversarial (Claude + Codex) memberi cross-model coverage yang
mustahil dicapai single review. Fix-first (bukan read-only)
menghemat ronde manual: AUTO-FIX langsung jalan, ASK menyaring
keputusan. Karena hasil dipersist ke review log, `/ship` tahu
kapan diff sudah cleared dan kapan masih pending.
