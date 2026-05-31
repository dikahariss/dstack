# Design Shotgun — Visual Design Exploration

> **Sumber:** [`design-shotgun/SKILL.md`](https://github.com/garrytan/gstack/blob/main/design-shotgun/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Saat mulai design baru atau revisi besar, satu mockup tidak cukup — user butuh lihat range opsi side-by-side untuk taste-test sebelum commit ke direction. `/design-shotgun` adalah visual brainstorming partner: generate 3-8 AI design variants dengan style berbeda, bikin comparison board HTML, serve lewat HTTP, dan iterasi sampai user approve. Bukan review process — explorasi.

Output di-feed ke `/design-html` (untuk convert ke HTML reference), `/design-review` (untuk audit live implementation), atau langsung dijadikan referensi visual untuk developer/designer manusia.

## Kapan menggunakannya

- Awal proyek visual baru — pricing page, landing, dashboard layout.
- Saat user bilang "I don't like THIS" tentang screen existing — evolve mode dengan screenshot live site.
- Setelah `/design-consultation` define `DESIGN.md` — explorasi gimana sistem itu apply ke screen spesifik.
- Sebagai sub-step dari `/plan-design-review` (called via `$_DESIGN_BRIEF`).
- Tidak cocok kalau user sudah punya mockup eksternal (Figma file existing) — langsung pakai `/design-html` dengan PNG.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Tunjukkan beberapa opsi desain untuk halaman pricing kita."
- "Visual brainstorm dulu — aku tidak suka tampilan dashboard saat ini."
- "Generate 4 variant desain untuk signup flow, lalu buka side-by-side."
- Kata kunci kanonik (EN): `/design-shotgun`, `explore design variants`,
  `show me design options`, `visual brainstorm`.

Contoh task lengkap:

> "Aku mau explorasi desain untuk signup flow MaritimHub. Persona:
> freight forwarder owner 35-50 tahun. Job: register perusahaan agar
> bisa quote rate. Form punya 12 field panjang. Generate 4 variant —
> satu wizard step-by-step, satu two-column dengan ilustrasi, satu
> compact modal, satu scroll-based — lalu buka comparison board di
> browser."

Yang terjadi: skill mengumpulkan context (persona, job, edge case),
membaca taste profile sebelumnya, generate N variant PNG dengan `$D
variants`, membuat comparison board HTML dan membukanya via `$B`,
kemudian menunggu feedback user untuk iterasi atau approval —
menyimpan `approved.json` dan memperbarui taste profile.

## Cara menggunakannya

1. **Setup**: `$D` (design binary, untuk generate variants) dan `$B` (browse binary, untuk serve & visit comparison board). `$D` mandatory; tanpa itu fallback ke HTML wireframe sketch (limited).
2. **UX Principles section**: skill membawa serta full set of UX laws (Three Laws of Usability, Billboard design, Navigation as Wayfinding, Goodwill Reservoir, Mobile rules) yang diterapkan ke setiap variant.
3. **Step 0: Session Detection** — scan `~/.gstack/projects/$SLUG/designs/*/approved.json` untuk session sebelumnya. Kalau ada, tanya: A) revisit existing board, B) new exploration, C) something else.
4. **Step 1: Context Gathering** — kalau dipanggil dari skill lain dan `$_DESIGN_BRIEF` set, skip ke Step 2. Otherwise gather 5 dimensions:
   - Who (persona, audience)
   - Job to be done
   - What exists (existing components di codebase)
   - User flow (arrival + next step)
   - Edge cases (long names, zero results, error, mobile, first-time vs power user)
   Auto-gather dari `DESIGN.md`, code structure, office-hours output. Lalu AskUserQuestion satu kali isi gap + jumlah variants (default 3, max 8).
   Cek live site (curl localhost:3000) — kalau ada dan user mention "I don't like this", screenshot + pakai `$D evolve` (variant dari existing).
5. **Step 2: Taste Memory** — baca persistent taste profile (v1 schema `~/.gstack/projects/$SLUG/taste-profile.json`) + per-session approved.json (legacy). Bias generation toward approved patterns, hindari rejected. Decay 5%/week. Conflict handling kalau request user kontradiksi profile.
6. **Step 3: Generate Variants** — `$D variants --brief "..." --count N --output-dir $_DESIGN_DIR`. Each variant punya distinct style direction (minimal vs editorial vs playful, dll).
7. **Step 4: Comparison Board** — `$D compare --images "v1.png,v2.png,v3.png" --output board.html --serve`. HTTP server expose board, browse open localnya.
8. **Step 5: Feedback Loop** — user pilih favorite, kasih feedback. `$D iterate --session session.json --feedback "..." --output new-variant.png` untuk refine.
9. **Step 6: Approval** — saat user approve, tulis `approved.json` (path approved + feedback + screen name), update taste profile via `gstack-taste-update`.

Output path: `~/.gstack/projects/$SLUG/designs/<screen-name>-<date>/` (variants, board.html, approved.json).

## Contoh / Studi kasus

Haris bikin signup flow baru di maritimhub:
- Run `/design-shotgun`.
- Phase 0 no previous session.
- Phase 1 context: persona "freight forwarder owner usia 35-50", job "register company supaya bisa quote rate". Edge case: form 12 fields panjang.
- Phase 2 taste profile dari design sebelumnya: prefer minimal, serif accent, navy palette.
- Phase 3 generate 4 variants: A) single-column step-by-step wizard, B) two-column dengan illustration kanan, C) compact modal split, D) onepage scroll-based.
- Phase 4 board.html open di browse. User pilih A (wizard) dengan feedback "step indicator lebih clear, progress di top, optional fields collapsible".
- Phase 5 `$D iterate` → variant A-refined.
- Phase 6 approve, tulis `approved.json`. Taste profile diupdate: signup wizard pattern +1.
- Next: Haris lanjut `/design-html` untuk convert variant A-refined jadi HTML reference.

## Kesimpulan

`/design-shotgun` adalah visual breadth-first search. Bedanya dengan menggambar di Figma manual: lebih cepat (5-8 variants dalam beberapa menit, vs sehari), taste-aware (history user di-factor), dan terhubung ke pipeline gstack (`/design-html`, `/design-review`). Output approved.json dipakai sebagai handoff ke skill berikutnya. Pakai untuk explorasi awal; jangan sebagai produksi UI (itu kerjaan `/design-html` atau dev manual).
