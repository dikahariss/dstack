# Qa

> **Sumber:** [`qa/SKILL.md`](https://github.com/garrytan/gstack/blob/main/qa/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

QA manual mahal. Test otomatis tidak menangkap bug visual atau
interaksi. `/qa` menutup gap itu: ia melakukan testing sistematis
seperti user nyata (click, fill form, navigate, screenshot) lewat
browse daemon, lalu **memperbaiki bug yang ditemukan** secara iteratif
— commit per fix, re-verify dengan before/after screenshot, dan tahu
kapan harus berhenti (self-regulation via WTF-likelihood heuristic).

Skill ini memiliki dua tier output: `/qa` (test + fix + verify) dan
`/qa-only` (report saja, no code change). Output mencakup baseline
health score 0-100, before/after pair, fix evidence dengan commit
SHA, dan ship-readiness summary.

## Kapan menggunakannya

Trigger di `description`:

- "qa", "QA", "test this site", "find bugs"
- "test and fix", "fix what's broken"
- Voice: "quality check", "test the app", "run QA"
- Trigger field: `qa test this`, `find bugs on site`, `test the site`

Proactive: ketika user bilang fitur ready for testing atau tanya
"does this work?".

Tiga tier:

- **Quick** — critical + high only, ~3 min.
- **Standard** — + medium severity.
- **Exhaustive** — + cosmetic + low severity.

Versi: `2.0.0`, `preamble-tier: 4`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Coba test fitur checkout ini, temukan dan perbaiki bugnya."
- "QA staging dulu sebelum kita merge ke main."
- "Ada yang aneh di halaman billing — cek dan fix ya."
- Kata kunci kanonik (EN): `/qa`, `qa`, `test and fix`,
  `find bugs`.

Contoh task lengkap:

> "/qa https://staging.maritimhub.com — fokus ke flow
> pendaftaran kapal dan halaman dashboard. Tier standard.
> Perbaiki semua bug critical dan high yang ditemukan."

Yang terjadi: skill menjalankan 11-phase workflow — orient
dengan browse daemon, explore tiap halaman interaktif,
dokumentasi issue dengan screenshot before/after, hitung
health score 0-100, lalu masuk fix loop: locate source,
minimal fix, commit atomik `fix(qa): ISSUE-NNN`, tulis
regression test, re-verify. Selesai dengan report + summary
untuk `/ship`.

## Cara menggunakannya

Workflow 11 phase:

1. **Initialize** — find browse binary, create `.gstack/qa-reports/`
   directory + screenshots, copy report template.
2. **Authenticate** (opsional) — login flow atau cookie-import.
3. **Orient** — `$B goto`, `$B snapshot -i -a`, `$B links`,
   `$B console --errors`. Detect framework (Next.js, Rails,
   WordPress, SPA).
4. **Explore** — per-page checklist: visual scan, interactive
   elements, forms, navigation, states (empty/loading/error/
   overflow), console, responsiveness (`$B viewport`).
5. **Document** — issue dicatat segera saat ditemukan (jangan batch).
   Two evidence tiers: interactive bugs (before/action/after
   screenshot + `snapshot -D` diff), static bugs (single annotated
   screenshot).
6. **Wrap Up** — compute health score (rubric weighted: console 15%,
   links 10%, visual 10%, functional 20%, UX 15%, perf 10%, content
   5%, a11y 15%), save baseline.json untuk regression.
7. **Triage** — sort by severity, pilih based on tier.
8. **Fix Loop** (skill `/qa` saja, `/qa-only` skip ini):
   - 8a Locate source via Grep/Glob.
   - 8b Minimal fix.
   - 8c Commit `fix(qa): ISSUE-NNN — desc`, satu commit per fix.
   - 8d Re-test, before/after screenshot.
   - 8e Classify: verified / best-effort / reverted.
   - 8e.5 **Regression test** — pelajari pola test existing, trace
     codepath bug, tulis regression test dengan attribution comment
     `// Regression: ISSUE-NNN`, jalankan, commit `test(qa):`.
   - 8f Self-regulation: tiap 5 fix atau revert, compute
     WTF-likelihood. `>20%` → STOP & ask user. Hard cap 50 fix.
9. **Final QA** — re-run, warn jika final score < baseline (regression).
10. **Report** — `.gstack/qa-reports/qa-report-<domain>-<date>.md` +
    `~/.gstack/projects/<slug>/<user>-<branch>-test-outcome-<dt>.md`
    untuk cross-session.
11. **TODOS.md Update** — new deferred bugs → TODOs, fixed bugs sudah
    di TODOS → annotate "Fixed by /qa on <branch>, <date>".

## Contoh / Studi kasus

User: "/qa https://staging.myapp.com".

Workflow: orient menemukan 5 nav links, 3 forms. Explore: console
error di `/billing` (TypeError saat user tanpa subscription), broken
link di footer, form signup tidak validate email empty. Health score
baseline: 62/100.

Fix loop:

1. Issue billing: locate `app/views/billing.tsx`, fix null guard,
   commit `fix(qa): ISSUE-001 — null guard pada subscription state`.
   Regression test ditambah. Re-test pass.
2. Broken link: update footer href. Commit + verify.
3. Form validation: tambah `required` + custom error message.
   Regression integration test ditulis untuk submit empty.

Final QA: score 89/100. Report tertulis dengan 5 issues found, 3
fixed (verified), 2 deferred. PR summary line untuk dipakai `/ship`:
"QA found 5 issues, fixed 3, health score 62 → 89."

## Kesimpulan

`/qa` adalah end-to-end QA agent yang menggabungkan testing + fixing
+ regression testing dalam satu skill. Self-regulation mencegah agent
runaway "fix everything", sedangkan output baseline + project-scoped
artifact memungkinkan regression detection silang sesi. Ini salah
satu skill paling kompleks gstack tapi paling tinggi leverage-nya.
