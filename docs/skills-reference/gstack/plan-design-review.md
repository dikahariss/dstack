# Plan Design Review

> **Sumber:** [`plan-design-review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/plan-design-review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Plan dengan UI sering ditulis dalam istilah backend ("user submit form,
data tersimpan, redirect ke dashboard") tanpa pernah mendefinisikan apa
yang user lihat, dalam urutan apa, dengan empty state seperti apa.
`/plan-design-review` bekerja sebagai senior product designer di tahap
PLAN — bukan situs live. Tujuannya menemukan keputusan desain yang
hilang dan **menambahkannya ke plan** sebelum implementasi.

Skill ini menggunakan **gstack designer** (binary lokal di
`design/dist/design`) untuk membuat mockup visual nyata via AI image
generation, lalu komparasi via comparison board berbasis HTTP. User
tidak melihat deskripsi teks tentang "homepage bisa terlihat seperti
ini" — mereka melihat 3 variant aktual + rate + remix lewat browser.

## Kapan menggunakannya

Trigger di `description`:

- "review the design plan", "design critique"
- Trigger field: `design plan review`, `review ux plan`,
  `check design decisions`

Proactive: skill harus disuggest ketika user punya plan dengan
komponen UI/UX yang harus direview sebelum implementasi. Untuk audit
visual live site, gunakan `/design-review` (bukan plan-design-review).

Versi: `2.0.0`, `preamble-tier: 3`, `interactive: true`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Review desain di plan ini sebelum aku mulai koding."
- "Cek keputusan UX di plan settings page — ada yang hilang?"
- "Buat mockup untuk halaman notifikasi yang ada di plan."
- Kata kunci kanonik (EN): `/plan-design-review`,
  `design plan review`, `review ux plan`, `check design decisions`.

Contoh task lengkap:

> "/plan-design-review — plan-ku: settings page untuk user mengubah
> preferensi notifikasi. Generate 3 variant mockup (minimal Linear-
> style, dark mode), tampilkan comparison board, lalu update plan
> dengan keputusan empty state, error state, dan mobile layout."

Yang terjadi: skill generate 3 PNG via `$D variants`, jalankan quality
check cross-model via `$D check`, serve comparison board di browser
untuk user rating dan remix. Setelah iterasi, plan diupdate dengan
keputusan desain yang sebelumnya hilang; mockup final disimpan di
`~/.gstack/projects/<slug>/designs/`.

## Cara menggunakannya

1. **PRE-REVIEW SYSTEM AUDIT** — baca plan file, CLAUDE.md, DESIGN.md
   (jika ada), TODOS.md. Map UI scope. Jika tidak ada UI scope, exit
   gracefully ("design review tidak applicable").
2. **DESIGN SETUP** — cek `design/dist/design` (`$D`) dan
   `browse/dist/browse` (`$B`). Jika DESIGN_NOT_AVAILABLE, fall back
   ke HTML wireframe sederhana.
3. **Step 0** Scope Assessment: 0A initial design rating (0-10), 0B
   DESIGN.md status, 0C existing leverage, 0D focus areas.
4. **Step 0.5 Visual Mockups (DEFAULT)** — DEFAULT-nya generate
   mockup, bukan tanya izin. Skip hanya kalau zero UI scope atau user
   minta "skip mockups". Generate 3 variant via `$D variants`, quality
   check via `$D check` (cross-model vision gate GPT-4o), serve
   comparison board via `$D compare --serve`.
5. **Comparison Board + Feedback Loop** — user buka board di browser,
   rate, komentar, klik Submit atau Regenerate/Remix. Skill membaca
   `feedback.json` atau `feedback-pending.json` dan iterate. Polling
   fallback hanya kalau `$D serve` gagal.
6. **Review pass** (7 dimensi tergantung mode): information
   architecture, interaction state coverage (loading/empty/error/
   success/partial), AI slop risk, DESIGN.md alignment, responsive,
   accessibility, content & microcopy.
7. **Output**: artefak di `~/.gstack/projects/<slug>/designs/` (NEVER
   di project-local — design adalah user data), plan file diupdate
   dengan keputusan desain yang sebelumnya hilang.

Prinsip yang dipakai sebagai rubric: 10 Principles Dieter Rams, 3
Levels Don Norman, Nielsen 10 Heuristics, Gestalt Principles, Steve
Krug ("Don't make me think", trunk test, satisficing), Joe Gebbia
(designing for trust). Cognitive patterns built in: seeing system not
screen, empathy as simulation, hierarchy as service, constraint
worship, edge case paranoia.

## Contoh / Studi kasus

Plan baru: "Settings page untuk user mengubah notifikasi."

`/plan-design-review`:

1. Rating awal: 4/10 — backend jelas tapi UI hanya disebut "form
   dengan checkbox".
2. `$D variants --brief "settings page for notification preferences,
   minimal Linear-style, dark mode"` → 3 PNG.
3. `$D check` lulus semua. `$D compare --serve` membuka board di
   `http://127.0.0.1:54321/`.
4. User rate A=5, B=3, C=2; comments "Love spacing A, but icons B
   better". Klik Remix dengan `{"layout":"A","icons":"B"}`.
5. Iterate 2 ronde. Final pilihan: hybrid A+B.
6. Plan diupdate: empty state (no notifications enabled), error state
   (save fail), responsive mobile collapse, keyboard nav untuk
   checkbox. Rating final: 9/10.

## Kesimpulan

`/plan-design-review` mengubah desain dari "wishful prose" jadi
artefak visual yang sudah disetujui sebelum koding dimulai. Karena
mockup di-cache dan board punya feedback loop terstruktur, biaya
iterasi 10x lebih murah daripada implementasi → demo → review →
rework.
