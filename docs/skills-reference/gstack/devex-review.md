# DevEx Review — Live Developer Experience Audit

> **Sumber:** [`devex-review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/devex-review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

DX audit yang cuma baca docs sering luput dari friction nyata: typo di getting started yang bikin install gagal, error message generic, search docs yang tidak nemu apa yang user cari, time-to-hello-world > 10 menit (yang menurut data adoption = 50-70% abandon). `/devex-review` adalah live audit: tidak review plan, tidak baca cerita — **testing** dengan browse navigate docs, bash run CLI commands, screenshot apa yang dev actually lihat. Measure, don't guess.

Skill ini diperuntukkan untuk produk developer (CLI tool, SDK, API, dev platform), bukan untuk produk consumer.

## Kapan menggunakannya

- Produk yang sedang launch ke developer audience.
- Periodik audit (quarterly) untuk catch DX drift.
- Sebelum announce major version.
- Saat metric adoption / TTHW menurun dan tidak tahu kenapa.
- Tidak cocok untuk produk consumer biasa.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Audit developer experience dstack sebelum kita announce ke publik."
- "Test onboarding flow SDK kita — ukur berapa menit sampai hello world."
- "DX review produk ini, pakai browse dan bash, bukan cuma baca docs."
- Kata kunci kanonik (EN): `/devex-review`, `live dx audit`,
  `test developer experience`, `measure onboarding time`.

Contoh task lengkap:

> "Audit DX dstack sebagai developer product. Navigasi ke README,
> jalankan `bun install` + `bun run build`, ukur TTHW, screenshot
> error message kalau ada, score setiap dimensi (Usable, Findable,
> dll), dan bandingkan dengan skor plan-devex-review sebelumnya."

Yang terjadi: skill navigate docs via browse, menjalankan CLI command
via bash, mengukur Time to Hello World aktual, meng-screenshot apa
yang developer lihat, memberi skor 0-10 per dimensi DX berdasarkan
evidence TESTED/INFERRED, lalu menyimpan hasil ke `gstack-review-log`
dengan delta boomerang dari prior plan review.

## Cara menggunakannya

Skill ini punya prinsip ketat: **DX First Principles** (8 laws termasuk "Zero friction at T0", "Show code in context", "Create magical moments") dan **Seven DX Characteristics** (Usable / Credible / Findable / Useful / Valuable / Accessible / Desirable) sebagai rubric scoring 0-10 dengan gold-standard examples (Stripe, Vercel, TypeScript, dll).

**TTHW benchmarks**:
| Tier | Time | Adoption Impact |
|------|------|-----------------|
| Champion | < 2 min | 3-4x higher adoption |
| Competitive | 2-5 min | Baseline |
| Needs Work | 5-10 min | Significant drop-off |
| Red Flag | > 10 min | 50-70% abandon |

Flow:
1. **Setup**: browse binary check. Hall of Fame reference loaded per-pass dari `~/.claude/skills/gstack/plan-devex-review/dx-hall-of-fame.md` (load section relevant, jangan seluruh file).
2. **Scope Declaration**: browse can test web-accessible (docs, API playgrounds, signup, tutorials, error pages). Browse CANNOT test (CLI install friction, terminal output quality, MFA, real auth, offline). Untuk untestable dimension, pakai bash (CLI `--help`, README, CHANGELOG) atau mark sebagai INFERRED. **Never guess; state evidence source.**
3. **Step 0: Target Discovery** — baca CLAUDE.md (docs URL, install command), README.md, package.json.
4. **Boomerang Baseline**: cek prior `/plan-devex-review` scores via `gstack-review-read` untuk baseline comparison.
5. **Step 1-8 audit passes**:
   - **1. Getting Started** — navigate docs/landing, screenshot, step-by-step friction table, total TTHW. Score 0-10 (calibrasi "Pass 1" dari hall of fame).
   - **2. API/CLI/SDK Ergonomics** — `--help` quality, flag design, naming consistency, playground experience.
   - **3. Error Messages** — trigger 404, invalid form, missing args. Score against Elm/Rust/Stripe three-tier model (problem + cause + fix).
   - **4. Documentation** — search functionality (try 3 common queries), code examples copy-paste-complete, language switcher, info architecture (find in <2 min?).
   - **5. Upgrade Path** — CHANGELOG quality, migration guides, deprecation warnings.
   - **6. Developer Environment** — README setup steps, CI/CD config, TypeScript types, test utilities.
   - **7. Community & Ecosystem** — GitHub Discussions/Discord, issue templates, response time.
   - **8. DX Measurement** — feedback widgets, bug templates, analytics on docs.
6. **DX Scorecard with Evidence** — table per characteristic dengan score + evidence (TESTED / INFERRED).
7. **Gap method**: untuk tiap score, explain apa yang 10 looks like for THIS product. Fix toward 10.

Output: persist via `gstack-review-log` skill `devex-review` dengan `status`, `overall_score`, `product_type`, `tthw_measured`, `dimensions_tested`, `dimensions_inferred`, `boomerang` (delta from prior).

## Contoh / Studi kasus

Haris audit dstack (skill catalog renderer) sebagai dev product:
- Step 0: docs URL = README.md, install = `bun install + bun run build`.
- Pass 1 Getting Started: bash test `bun install` → succeed in 8s. `bun run build` → succeed in 2s. TTHW = 12s ≈ Champion tier. Score 9/10 (gap: missing `bun run new <skill>` example di README first paragraph).
- Pass 2 CLI: `bun run --help` → list commands, semua terdokumentasi. Score 8/10 (could add `--example` flag untuk preview output).
- Pass 3 Error: bash `bun run render nonexistent-skill` → error message clear: "Skill 'nonexistent-skill' not found in skills/". Has problem + cause, missing fix suggestion. Score 7/10.
- Pass 4 Docs: README + docs/ARCHITECTURE.md + docs/specs/. Search via grep works, code examples runnable. Score 8/10.
- Boomerang: prior plan-devex-review skor 7.5; live audit 7.8 → +0.3 improvement.
- Recommendation: tambah "fix suggestion" di error messages, expand README quickstart dengan `bun run new <skill>` example.

## Kesimpulan

`/devex-review` adalah live audit dengan evidence (screenshots, bash output, INFERRED tag). Beda dengan `/plan-devex-review` yang review plan; ini test produk yang sudah running. Output skor 0-10 per dimensi + boomerang dari prior plan review = visibility apakah implementation deliver pada janji plan. Cocok untuk produk dev yang sudah ship MVP dan butuh continuous DX improvement.
