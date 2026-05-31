# gstack — Referensi Skill (Bahasa Indonesia)

Repositori internal Haris berisi 46 skill untuk Claude Code yang
mencakup seluruh workflow product development: brainstorm → plan →
implement → review → ship → deploy → monitor → retro. Skill ditulis
dengan ethos "Boil the Lake" — gunakan kelengkapan default karena AI
membuat ongkos completeness nyaris nol.

Setiap file di folder ini meringkas satu skill: mengapa penting, kapan
dipakai (trigger dari frontmatter), cara menggunakannya, contoh
skenario, dan kesimpulan. Sumber asli setiap skill tersedia di repo
publik [`garrytan/gstack`](https://github.com/garrytan/gstack) — tiap
halaman di folder ini punya link langsung ke `SKILL.md` aslinya pada
baris **Sumber** di header.

## Daftar skill (A-Z)

| Skill | Deskripsi singkat |
|-------|-------------------|
| [autoplan](autoplan.md) | Auto-review pipeline yang menjalankan CEO, design, eng, dan DX review sekaligus dengan 6 prinsip auto-decision. |
| [benchmark](benchmark.md) | Deteksi regresi performa lewat browse daemon — baseline page load, Core Web Vitals, perbandingan PR. |
| [benchmark-models](benchmark-models.md) | Cross-model benchmark skill gstack lewat Claude, GPT (Codex), Gemini — banding latency, tokens, cost, kualitas. |
| [browse](browse.md) | Browser headless cepat untuk QA dan dogfood — navigate, interact, diff before/after, screenshot annotated. |
| [canary](canary.md) | Monitoring canary post-deploy — pantau console error, regresi performa, screenshot periodik vs baseline. |
| [careful](careful.md) | Safety guardrail untuk perintah destruktif (rm -rf, DROP TABLE, force-push, kubectl delete). |
| [codex](codex.md) | Wrapper OpenAI Codex CLI — review independen, mode challenge adversarial, consult sesi continuity. |
| [connect-chrome](connect-chrome.md) | Launch GStack Browser dengan sidebar extension + activity feed + chat. Anti-bot stealth built-in. |
| [context-restore](context-restore.md) | Restore working context dari `/context-save` — pulihkan git state + decisions lintas Conductor workspace. |
| [context-save](context-save.md) | Save working context (git state, decisions, remaining work) supaya sesi berikutnya melanjutkan tanpa loss. |
| [cso](cso.md) | Chief Security Officer mode — secrets archaeology, dependency supply chain, OWASP/STRIDE, active verification. |
| [design-consultation](design-consultation.md) | Konsultasi desain end-to-end — riset, propose design system, generate preview, tulis DESIGN.md. |
| [design-html](design-html.md) | Generate HTML/CSS production-quality dari approved mockup + CEO plan + design context. |
| [design-review](design-review.md) | Designer's eye QA live site — inkonsistensi visual, slop pattern, slow interactions — sekaligus fix. |
| [design-shotgun](design-shotgun.md) | Generate banyak design variant AI, comparison board, structured feedback, iterate. |
| [devex-review](devex-review.md) | Audit DX live: navigate docs, time TTHW, screenshot error, evaluate CLI help text. |
| [document-release](document-release.md) | Post-ship docs update — README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md disinkronkan dengan diff yang shipped. |
| [freeze](freeze.md) | Batasi edit ke satu direktori untuk sesi — cegah agent "memperbaiki" kode tidak terkait. |
| [gstack-upgrade](gstack-upgrade.md) | Upgrade gstack ke versi terbaru — deteksi global vs vendored install + tampilkan changelog. |
| [guard](guard.md) | Full safety mode = `/careful` + `/freeze` digabung — peringatan destruktif + scoped edit. |
| [health](health.md) | Code quality dashboard — wraps type checker, linter, test runner, dead code; skor 0-10 + trend. |
| [investigate](investigate.md) | Debug sistematis dengan root cause investigation — Iron Law: no fixes without root cause. |
| [land-and-deploy](land-and-deploy.md) | Workflow merge PR + tunggu CI + deploy + verify produksi via canary check. |
| [landing-report](landing-report.md) | Dashboard read-only ship queue — VERSION slots klaim, sibling Conductor workspaces, slot berikut. |
| [learn](learn.md) | Manage project learnings — review, search, prune, export apa yang sudah dipelajari gstack lintas sesi. |
| [make-pdf](make-pdf.md) | Convert markdown ke PDF kualitas publikasi (margin 1in, cover, TOC, watermark DRAFT, page numbers). |
| [office-hours](office-hours.md) | YC Office Hours — enam pertanyaan forcing untuk founder/builder mode, output design doc. |
| [open-gstack-browser](open-gstack-browser.md) | Launch GStack Browser AI-controlled Chromium dengan sidebar extension + activity feed. |
| [pair-agent](pair-agent.md) | Pair remote AI agent dengan browser via setup key sekali pakai — scope read+write atau admin. |
| [plan-ceo-review](plan-ceo-review.md) | CEO/founder mode plan review — 10-star product, 4 mode (EXPANSION/SELECTIVE/HOLD/REDUCTION). |
| [plan-design-review](plan-design-review.md) | Designer's eye review plan — mockup AI default, comparison board, 7 dimensi review. |
| [plan-devex-review](plan-devex-review.md) | DX plan review — persona interrogation, empathy narrative, competitive TTHW benchmark. |
| [plan-eng-review](plan-eng-review.md) | Eng manager plan review — arsitektur, edge case, test, performance, outside voice cross-model. |
| [plan-tune](plan-tune.md) | Self-tuning question sensitivity + developer profile dual-track (declared vs inferred). |
| [qa](qa.md) | QA browser sistematis + fix bug otomatis dengan regression test + WTF-likelihood self-regulation. |
| [qa-only](qa-only.md) | Versi report-only `/qa` — produces health score + screenshots + repro tanpa modifikasi kode. |
| [retro](retro.md) | Engineering retro mingguan — commit history, team breakdown, shareable card, mode global cross-project. |
| [review](review.md) | Pre-landing diff review — multi-pass adversarial Claude + Codex, fix-first, GATE P1. |
| [scrape](scrape.md) | Pull data web — match path skill terkodifikasi (~200ms) atau prototype path (~30s) read-only. |
| [setup-browser-cookies](setup-browser-cookies.md) | Import cookie dari Chromium asli ke sesi headless — picker UI interactive. |
| [setup-deploy](setup-deploy.md) | Konfigurasi deploy untuk `/land-and-deploy` — auto-detect Fly/Render/Vercel/Netlify, tulis ke CLAUDE.md. |
| [setup-gbrain](setup-gbrain.md) | Setup gbrain end-to-end — install CLI, init PGLite/Supabase, register MCP, per-repo trust policy. |
| [ship](ship.md) | Workflow ship — base branch, tests, review gate, VERSION bump, CHANGELOG, commit bisectable, push, PR. |
| [skillify](skillify.md) | Kodifikasi prototype `/scrape` terakhir jadi browser-skill permanen (script.ts + test + fixture). |
| [sync-gbrain](sync-gbrain.md) | Sinkronisasi gbrain dengan state repo + refresh CLAUDE.md guidance — incremental atau --full. |
| [unfreeze](unfreeze.md) | Hapus freeze boundary `/freeze` — buka kembali edit ke semua direktori tanpa restart sesi. |

## Konvensi dokumen

Setiap file skill ikut template ketat:

1. Judul Title Case + sumber path + label repo.
2. **Mengapa skill ini penting** — 1-2 paragraf narasi.
3. **Kapan menggunakannya** — bullet trigger dari frontmatter
   `description` / `triggers`.
4. **Contoh prompt** — frasa pemicu singkat (BID + kata kunci
   kanonik EN) + satu contoh task lengkap, dengan catatan "Yang
   terjadi".
5. **Cara menggunakannya** — langkah invokasi + flag + file
   pendukung.
6. **Contoh / Studi kasus** — skenario konkret minimal satu.
7. **Kesimpulan** — paragraf padat penutup.

Panjang 80-180 baris per file, Bahasa Indonesia natural-teknis,
netral, no marketing voice.
