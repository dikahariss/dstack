# Health — Code Quality Dashboard

> **Sumber:** [`health/SKILL.md`](https://github.com/garrytan/gstack/blob/main/health/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Kualitas kode bukan satu metrik — ia komposit dari type safety, lint cleanliness, test pass rate, dead code, shell hygiene, dan (kalau aktif) GBrain index health. Tanpa dashboard, semua sinyal ini tersebar di output tool terpisah dan trend-nya tidak kelihatan. `/health` jalankan semua tool yang tersedia, skor 0-10 per kategori dengan rubric eksplisit, compose ke composite score (weighted), tampilkan dashboard, dan simpan ke `health-history.jsonl` untuk trend analysis. Ia **wraps** project tools — never substitute analysis sendiri.

**HARD GATE**: skill tidak fix issue. Produce dashboard + recommendations only. User decide what to act on.

## Kapan menggunakannya

- Voice trigger: "code health", "quality dashboard", "how healthy is this codebase".
- Sebelum/sesudah refactor besar — bandingkan trend.
- Tiap minggu sebagai habit untuk catch drift early.
- Sebelum onboard developer baru — show baseline quality.
- Tidak cocok untuk fix issue — itu kerjaan developer per kategori.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Cek health codebase MaritimHub — berikan score composite."
- "Quality dashboard sebelum onboard developer baru."
- "Jalankan semua checks — typecheck, lint, test, dead code."
- Kata kunci kanonik (EN): `/health`, `code health check`,
  `quality dashboard`, `how healthy is codebase`.

Contoh task lengkap:

> "Run /health di MaritimHub. Auto-detect tools (tsc, biome, bun
> test, knip, shellcheck), jalankan semua secara sequential, score
> 0-10 per kategori dengan rubric eksplisit, tampilkan dashboard
> tabel, bandingkan dengan run Senin lalu, dan tunjukkan regresi
> kalau ada kategori yang turun."

Yang terjadi: skill mendeteksi atau membaca Health Stack dari
CLAUDE.md, menjalankan setiap tool dan merekam exit code + durasi,
memberi skor composite weighted (typecheck 22%, test 28%, dll),
menampilkan dashboard tabel dengan status CLEAN/WARNING/NEEDS WORK,
menyimpan ke `health-history.jsonl`, dan menampilkan trend + rekomendasi
berurutan by impact — tanpa memperbaiki satu pun issue.

## Cara menggunakannya

1. **Step 1: Detect Health Stack** — baca CLAUDE.md cari `## Health Stack` section. Kalau ada, pakai itu. Kalau tidak, auto-detect:
   - Type check: tsc, mypy, etc. (cek `tsconfig.json`).
   - Lint: biome, eslint, ruff.
   - Test: dari `package.json scripts.test`, pytest, cargo test, go test.
   - Dead code: knip (kalau terinstall).
   - Shell lint: shellcheck untuk `*.sh`.
   - GBrain: kalau `gbrain` di PATH dan `~/.gbrain/config.json` ada.
   AskUserQuestion confirm detection, opsi persist ke CLAUDE.md `## Health Stack` section.
2. **Step 2: Run Tools** — sequential, capture stdout+stderr+exit code+duration. Tail -50 untuk report. Skip tool yang tidak terinstall (SKIPPED, bukan FAILED).
3. **Step 3: Score Each Category** — rubric:
   | Category | Weight | 10 | 7 | 4 | 0 |
   |-----------|--------|------|-----------|------------|-----------|
   | Type check | 22% | exit 0 | <10 errors | <50 errors | >=50 |
   | Lint | 18% | exit 0 | <5 warnings | <20 | >=20 |
   | Tests | 28% | exit 0 | >95% pass | >80% | <=80% |
   | Dead code | 13% | exit 0 | <5 unused | <20 | >=20 |
   | Shell lint | 9% | exit 0 | <5 issues | >=5 | N/A skip |
   | GBrain | 10% | doctor=ok, queue<10, pushed<24h | warnings OR queue<100 OR pushed<72h | broken OR queue>=100 OR >=72h | N/A |
   Composite = weighted sum. Kalau category skipped, redistribute weight proporsional.
4. **Step 4: Present Dashboard** — tabel:
   ```
   CODE HEALTH DASHBOARD
   Category   Tool        Score  Status   Duration  Details
   Typecheck  tsc          10/10 CLEAN    3s        0 errors
   Lint       biome         8/10 WARNING  2s        3 warnings
   Tests      bun test     10/10 CLEAN    12s       47/47 passed
   COMPOSITE: 9.1 / 10
   ```
   Status: 10 CLEAN, 7-9 WARNING, 4-6 NEEDS WORK, 0-3 CRITICAL.
   Show top issues untuk kategori <7.
5. **Step 5: Persist Health History** — append JSONL ke `~/.gstack/projects/$SLUG/health-history.jsonl` dengan ts, branch, score, per-category scores, duration_s.
6. **Step 6: Trend Analysis + Recommendations** — read last 10 entries, show trend table. Kalau drop vs previous: identify declining categories, show delta, correlate dengan tool output. Recommendations ranked by `weight * (10 - score)` descending. Hanya kategori <10.

GBrain sub-score (D6) komputasi gabungan doctor + queue depth + push freshness. `gbrain doctor --json` selalu wrapped dalam `timeout 5s` supaya tidak stall dashboard.

## Contoh / Studi kasus

Haris run `/health` weekly di MaritimHub. Hari Senin baseline:
- Tools detected: tsc, biome, bun test, knip, shellcheck. GBrain not installed (skipped).
- Hasil: Typecheck 10/10, Lint 8/10 (3 warnings), Tests 10/10, Dead code 7/10 (4 unused exports), Shell 10/10. Composite 9.1.
- Saved ke history.

Jumat setelah ship 3 PR:
- Run lagi. Tests 9/10 (2 fail di `auth.test.ts`), Dead code 6/10 (8 unused, naik). Composite 8.5 (-0.6 from Monday).
- REGRESSIONS DETECTED section: "Tests 10→9 (-1) — FAIL src/auth.test.ts > should validate token expiry. Dead code 7→6 (-1) — 4 new unused exports introduced".
- Recommendations: "1. [HIGH] Fix 2 failing tests (Tests: 9/10, weight 28%). Run bun test --verbose. 2. [MED] Remove 8 unused exports. Run knip --fix to auto-remove."
- Haris act on rekomendasi #1 dulu (highest impact).

## Kesimpulan

`/health` adalah dashboard agnostik tool: ia wrap apa yang project sudah pakai (tidak prescriptive). Composite score + trend memberi big picture; per-tool tail output memberi actionable detail. Skipped category tidak menghukum (re-distribute weight). Kombinasi dengan `/benchmark` (web performance) memberi visibility full-stack kualitas. Selalu read-only — fixing itu kerjaan manusia atau skill lain.
