# Qa Only

> **Sumber:** [`qa-only/SKILL.md`](https://github.com/garrytan/gstack/blob/main/qa-only/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Kadang user butuh bug report dengan evidence (screenshot, repro
steps, severity, health score) tanpa modifikasi kode — misalnya
sebelum estimasi sprint, sebelum handoff ke team developer, atau
sebelum memutuskan apakah project layak dilanjutkan. `/qa-only` adalah
versi `/qa` yang berhenti di Phase 7 (Triage). Tidak ada fix loop,
tidak ada commit, tidak ada regression test.

Skill ini lebih ringan (`preamble-tier: 4` sama dengan `/qa`, tapi
allowed-tools hanya Bash, Read, Write, AskUserQuestion, WebSearch —
no Edit) dan menghasilkan artifact yang sama-sama bisa dipakai
sebagai baseline.json untuk regression comparison nanti.

## Kapan menggunakannya

Trigger di `description`:

- "just report bugs", "qa report only", "test but don't fix"
- Voice: "bug report", "just check for bugs"
- Trigger field: `qa report only`, `just report bugs`,
  `test but dont fix`

Proactive: ketika user ingin bug report tanpa code change. Untuk full
test-fix-verify loop, gunakan `/qa`.

Versi: `1.0.0`, `preamble-tier: 4`.

## Cara menggunakannya

Workflow 6 phase (subset dari `/qa`):

1. **Setup** — find browse binary, create `.gstack/qa-reports/`
   directory + screenshots subfolder, copy report template.
2. **Mode detection**:
   - **Diff-aware** (default jika di feature branch tanpa URL) —
     analyze `git diff main...HEAD --name-only`, identify affected
     pages/routes dari controller/view/component files. Detect
     running app di port umum (3000, 4000, 8080). Test tiap
     affected page. Cross-reference commit messages + PR description.
     Check TODOS.md untuk known bugs.
   - **Full** (URL diberikan) — sistematis: visit setiap reachable
     page, 5-10 well-evidenced issues, health score.
   - **Quick** (`--quick`) — 30 detik smoke test, homepage + top 5
     nav targets.
   - **Regression** (`--regression baseline.json`) — diff vs
     baseline previous: which fixed, which new, score delta.
3. **Test Plan Context** — cek `~/.gstack/projects/<slug>/
   *-test-plan-*.md` (output dari `/plan-eng-review`). Fall back ke
   git diff heuristic kalau tidak ada.
4. **Prior Learnings** — `gstack-learnings-search --limit 10`,
   optional cross-project (config `cross_project_learnings`).
5. **Authenticate** (opsional) — login atau cookie import, dengan
   instruksi "NEVER include real passwords in report" → tulis
   `[REDACTED]`.
6. **Orient + Explore + Document** sama dengan `/qa` (lihat dokumen
   `/qa`).
7. **Wrap Up + Report** — health score weighted rubric, baseline.json,
   PR summary line, "Top 3 Things to Fix", console health summary.

Skill berhenti di sini. Tidak ada Phase 7 Triage / 8 Fix Loop / 9
Final QA / 11 TODOS update yang bersifat code-changing.

## Contoh / Studi kasus

User: "/qa-only sebelum merge — saya cuma butuh report buat handoff".

Skill diff-aware mode: branch `feature/billing-update`. Diff
menyentuh `app/views/billing.tsx`, `app/api/subscription.ts`.
Affected pages: `/billing`, `/account/subscription`. Local app di
`localhost:3000`.

Test:

1. `/billing` — visual scan OK, click "Upgrade plan" → console
   error TypeError. Screenshot before+after.
2. `/account/subscription` — 0 active state hilang. Annotated
   screenshot.
3. Form save → success message tidak dismiss otomatis. Repro 3x.

Report: 3 issues (1 critical, 1 medium, 1 low). Health score 73/100.
Baseline.json disimpan. PR summary: "QA-only found 3 issues; nothing
fixed (report-only mode)."

User kemudian assign ke team developer atau jalankan `/qa` di sesi
terpisah untuk fix loop.

## Kesimpulan

`/qa-only` adalah versi read-only `/qa` yang berguna saat kontekstual
"saya cuma butuh tahu kondisinya, jangan ubah apa-apa". Dengan
output structured (baseline.json + report.md), data tetap reusable
untuk regression atau handoff downstream tanpa risiko skill
"membantu lebih dari yang diminta".
