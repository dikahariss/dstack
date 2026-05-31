# Design Consultation — Your Design System, Built Together

> **Sumber:** [`design-consultation/SKILL.md`](https://github.com/garrytan/gstack/blob/main/design-consultation/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Kebanyakan tool design bertanya "pilih font", "pilih warna", "pilih spacing scale" — form wizard yang bikin user kelelahan keputusan tanpa context. `/design-consultation` posturnya berbeda: senior product designer yang opinionated tapi tidak dogmatic. Dia listen → research → propose sistem desain lengkap dengan reasoning, lalu invite user untuk adjust. Bukan menu, melainkan percakapan.

Output: file `DESIGN.md` di root repo berisi tokens (fonts, colors, spacing, layout principles) plus rationale di balik tiap pilihan. Dipakai sebagai source of truth untuk `/design-html`, `/design-review`, `/design-shotgun`, dll.

## Kapan menggunakannya

- Project baru tanpa `DESIGN.md`.
- Voice trigger routing: "design system", "set up design".
- Saat user bilang "kayanya UI kita inconsistent" — system review/refresh.
- Saat ada produk pivot dan visual direction perlu re-grounding.
- Mode update: kalau `DESIGN.md` ada, tanya **update** / **start fresh** / **cancel**.
- Skill ini opsional dipakai sebagai prerequisite untuk `/design-shotgun`, `/design-html`, `/design-review` — tapi ketiganya bisa jalan tanpa DESIGN.md (fall back ke universal principles).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buatkan design system untuk project ini dari awal."
- "UI kita inconsistent, perlu design consultation dulu."
- "Set up DESIGN.md — mau ada brand guidelines yang jelas."
- Kata kunci kanonik (EN): `/design-consultation`,
  `design system`, `create a brand`, `design from scratch`.

Contoh task lengkap:

> "/design-consultation untuk MaritimHub — B2B platform maritime
> Indonesia, target ops manager di Surabaya. Research kompetitor
> dulu (Marine Traffic, Vessel Finder), lalu propose design system
> lengkap: typography, color palette, spacing scale, dan DESIGN.md."

Yang terjadi: skill baca README dan office-hours output untuk
pre-fill product context, tanya satu pertanyaan tunggal (termasuk
"memorable thing forcing question"), opsional browse kompetitor
dengan synthesis 3-layer, lalu propose sistem desain lengkap
dengan reasoning — iterasi sampai user setuju, generate AI mockup
jika `$D` tersedia, dan tulis `DESIGN.md` plus update taste profile.

## Cara menggunakannya

1. **Phase 0: Pre-checks** — cek `DESIGN.md` / `design-system.md` di root. Gather product context (README, package.json, src/). Look for office-hours output di `~/.gstack/projects/$SLUG/*office-hours*`. Set up browse binary (`$B`, opsional untuk competitive research) dan design binary (`$D`, opsional untuk AI mockup generation).
2. **Phase 1: Product Context** — single AskUserQuestion yang cover: product confirmation, project type, mau research kompetitor (`$B` browse + WebSearch) atau pakai built-in design knowledge, "memorable thing forcing question" (1 kalimat: apa yang user remember setelah lihat produk pertama kali). Pre-fill dari README/office-hours bila bisa.
3. **Taste profile**: baca `~/.gstack/projects/$SLUG/taste-profile.json` (v1 schema, decay 5%/week). Kalau ada history kuat, factor ke proposal. Conflict handling kalau request user kontradiksi profile.
4. **Phase 2: Research** (kalau user bilang yes) — WebSearch + visual research via browse:
   - WebSearch: "[product category] website design 2025", best [industry] web apps.
   - Browse: visit 3-5 top sites, `$B goto + screenshot + snapshot` per site.
   - 3-layer synthesis: Layer 1 (tried & true / table stakes), Layer 2 (new & popular / trends), Layer 3 (first principles / where to break convention).
   - **Eureka check**: kalau Layer 3 reveal insight, name & log.
5. **Phase 3: Proposal** — present sistem desain lengkap: typography stack, color palette dengan psychology, spacing scale (4/8/12/16 atau 8-point grid), layout principles, aesthetic direction. Reasoning untuk tiap choice.
6. **Phase 4: Iteration** — invite user adjust. Setiap perubahan trigger small explanation cascade ("kalau ganti font ini, perlu sesuaikan spacing ini").
7. **Phase 5: AI mockup preview** (kalau `$D` available) — generate mockup variants applied to real screens, bukan cuma HTML preview page. User lihat what their product could actually look like.
8. **Phase 6: Save** — tulis `DESIGN.md` di root + update taste profile.

Path artifact penting:
- `~/.gstack/projects/$SLUG/designs/` — semua mockup, comparison board, approved.json (CRITICAL: jangan tulis ke `.context/` atau `docs/designs/`).
- `~/.gstack/projects/$SLUG/taste-profile.json` — persistent taste, decay-aware.

## Contoh / Studi kasus

Haris start MaritimHub fresh, belum ada `DESIGN.md`:
- Invoke `/design-consultation`.
- Phase 1 pre-fill dari README: "B2B marketplace untuk maritime industry, Indonesia, target shipping company manager".
- Forcing question: "What's the one thing you want a shipping ops manager to remember?" → "Software ini serius dan akurat untuk pekerjaan serius — bukan playful startup tool."
- Phase 2 research: kompetitor Marine Traffic, Vessel Finder, sailing apps. Layer 3 eureka: "Mostly dark-mode tech aesthetic karena assume audience adalah developer. Tapi audience kita adalah ops manager 40-an di kantor Surabaya yang prefer light & professional. Break convention: light mode default, generous spacing, serif-accent untuk credibility."
- Phase 3 proposal: Inter (UI) + Source Serif (headlines), navy 900 primary, neutral grays, 8-point spacing, sober palette.
- Phase 5 mockup applied ke dashboard fictional pricing card. Haris approve dengan minor tweak warna primary.
- DESIGN.md ditulis di root project (mis. `maritimhub/DESIGN.md`), taste profile diupdate.

## Kesimpulan

`/design-consultation` adalah cara gstack mengubah keputusan visual dari "tebak-tebakan" jadi sistem yang ter-justifikasi dan compounding (taste profile dipakai antar session). Lebih kaya dari design tool generik karena dia integrate produk context (codebase, office-hours), research kompetitor visual, dan AI mockup. Output `DESIGN.md` jadi single source of truth untuk semua skill design downstream. Pakai sekali di awal project; rerun "update mode" tiap quarter atau saat pivot.
