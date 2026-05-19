# Plan Devex Review

> **Sumber:** [`plan-devex-review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/plan-devex-review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

API, CLI, SDK, library, framework, dan documentation site adalah
produk dengan user khusus: developer. Mereka punya tolerance pendek (2
menit hello world atau bye), ekspektasi tinggi (error messages harus
self-contained), dan jurnal panjang (discover → evaluate → install →
hello world → integrate → debug → upgrade → scale → migrate). Setiap
gap di journey = lost dev. `/plan-devex-review` menjadi "developer
advocate yang sudah onboard 100 developer tool" untuk menemukan gap
sebelum produk shipped.

Skill ini bukan sekadar checklist. Ia memaksa investigasi: persona
interrogation, empathy narrative dalam first person, competitive
benchmarking dengan WebSearch real TTHW data, magical moment design.
Score (0-10 per dimensi) baru muncul SETELAH evidence terkumpul —
bukan dari vibe.

## Kapan menggunakannya

Trigger di `description`:

- "DX review", "developer experience audit", "devex review"
- "API design review"
- Voice: "dx review", "developer experience review", "devex audit",
  "API design review", "onboarding review"
- Trigger field: `developer experience review`, `dx plan review`,
  `check developer onboarding`

Proactive: ketika user punya plan untuk produk developer-facing (API,
CLI, SDK, library, platform, docs, Claude Code skill).

Versi: `2.0.0`, `preamble-tier: 3`, `interactive: true`,
`benefits-from: [office-hours]`.

## Cara menggunakannya

1. **PRE-REVIEW SYSTEM AUDIT** — git log, diff stat, baca plan file,
   CLAUDE.md, README.md, package.json, CHANGELOG, docs/ structure.
   Scan getting started guides, CLI help text, error patterns.
2. **Auto-Detect Product Type** — API/Service, CLI Tool, Library/SDK,
   Platform, Documentation, atau Claude Code Skill. Jika tidak ada
   surface developer-facing, exit gracefully → suggest
   `/plan-eng-review` atau `/plan-design-review`.
3. **Prerequisite skill offer** — jika tidak ada design doc dari
   `/office-hours`, tawarkan menjalankan inline.
4. **Step 0 Investigation** (sebelum scoring):
   - 0A **Developer Persona Interrogation** — pilih persona konkret
     (YC founder MVP, platform engineer Series C, frontend dev,
     dst.). Produce persona card. STOP wait user.
   - 0B **Empathy Narrative** — 150-250 word first-person dari
     persona tracing actual README/docs. Show ke user, dapatkan
     koreksi.
   - 0C **Competitive Benchmarking** — 3 WebSearch query untuk
     competitor TTHW. Produce benchmark table. Tanya target tier
     (Champion <2min, Competitive 2-5min, Current).
   - 0D **Magical Moment Design** — interactive playground vs
     copy-paste demo vs video walkthrough vs guided tutorial. Dual
     scale effort (human days / CC hours).
   - 0E Mode Selection: DX EXPANSION / DX POLISH (recommended) /
     DX TRIAGE.
   - 0F-0G additional evidence steps.
5. **Review passes 1-8** (Getting Started, API/CLI ergonomics, Error
   quality, Documentation, Discoverability, Reliability, Migration
   path, Community/support) — load `dx-hall-of-fame.md` section per
   pass untuk gold standard examples.
6. **Output** — plan file diupdate, score 0-10 per dimensi dengan
   penjelasan "what a 10 looks like for THIS product", review log
   entry dengan `initial_score`, `overall_score`, `tthw_current`,
   `tthw_target`, `persona`, `competitive_tier`.

## Contoh / Studi kasus

Plan: rilis SDK Node.js untuk API payment internal.

`/plan-devex-review`:

1. Persona terpilih: "Backend dev integrating an API" (cURL examples,
   auth flow clarity, rate limit docs).
2. Empathy narrative: "I open README. Heading pertama install. Lalu
   ada section Authentication tapi belum jelas dari mana ambil API
   key — saya scroll ke bawah cari, tidak ketemu..." → user koreksi
   "key dari dashboard, kita lupa link".
3. Benchmark: Stripe 30s, Plaid 2min, current SDK 8min (terlalu
   lama). Target: Competitive (2-5min).
4. Magical moment: copy-paste `curl` demo yang bisa langsung
   menampilkan transaksi sandbox.
5. Pass 3 (Error quality): error 401 hanya bilang "Unauthorized" —
   harus jadi "Missing API key. Get yours at dashboard.example.com/
   keys".
6. Final score: 6.5/10, ditarget 8/10 dengan 4 fix di plan.

## Kesimpulan

`/plan-devex-review` adalah parallel `/plan-design-review` untuk
produk developer-facing. Ia menjamin bahwa SDK/CLI/API yang Haris
rilis tidak diabaikan dengan kalimat "docs nanti" — DX adalah feature
P0 yang dirancang dari awal, bukan polish post-launch.
