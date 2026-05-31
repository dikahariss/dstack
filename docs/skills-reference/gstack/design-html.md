# Design HTML — Pretext-Native HTML Engine

> **Sumber:** [`design-html/SKILL.md`](https://github.com/garrytan/gstack/blob/main/design-html/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

HTML yang dihasilkan AI biasanya cuma CSS approximation: card heights di-hardcode, text tidak reflow proper, chat bubbles tidak shrinkwrap, editorial spreads tidak flow ke obstacles. `/design-html` adalah engine yang menghasilkan **production-quality HTML lewat Pretext** — layout actually computed, text reflow on resize, heights adjust ke content, dan semua basic Web UX principles diterapkan (Don't Make Me Think, billboard design, navigation as wayfinding, mobile-first).

Skill ini dipakai sebagai finishing layer setelah `/design-shotgun` (variant explorer) atau `/design-consultation` (system definition) — convert mockup PNG atau plan ke HTML yang ready dipakai sebagai reference implementation.

## Kapan menggunakannya

- Setelah `/design-shotgun` approve variant — convert PNG approved ke HTML.
- Saat ada `DESIGN.md` + CEO plan tapi belum ada visual reference — generate HTML directly dari plan.
- Saat user describe layout "I want a landing page with hero + feature grid + pricing" — freeform mode.
- Saat ada `finalized.html` dari session sebelumnya yang mau di-iterate (evolve mode).
- Tidak cocok untuk implementasi production code — output adalah HTML reference, bukan React/Vue/Svelte component (itu kerjaan developer).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Finalize design ini jadi HTML yang beneran, bukan mockup statis."
- "Convert approved variant ke HTML, text harus reflow beneran."
- "Build the design — pakai Pretext supaya layout-nya computed."
- Kata kunci kanonik (EN): `/design-html`, `build the design`,
  `finalize this design`, `turn this into HTML`.

Contoh task lengkap:

> "/design-html — approved variant `variant-3.png` dari
> `/design-shotgun` landing page MaritimHub. Extract color dan
> typography via `$D`, generate HTML dengan Pretext layout:
> hero, sticky nav, feature grid 3-kolom, pricing table
> yang reflow di mobile."

Yang terjadi: skill detect input (approved.json, CEO plan, atau
freeform), extract implementation spec via `$D prompt --image`
atau Read tool, routing ke Pretext tier yang sesuai (simple
layout vs card/grid vs editorial), lalu generate HTML di mana
text benar-benar reflow, heights computed dari content, dan UX
principles (billboard design, 44px touch target) diterapkan.
Output disimpan ke `~/.gstack/projects/$SLUG/designs/`.

## Cara menggunakannya

1. **Setup**: `$D` (design binary) dan `$B` (browse binary) dicek availability. `$D` opsional — fallback ke HTML wireframe approach.
2. **Step 0: Input Detection** — scan project untuk:
   - `~/.gstack/projects/$SLUG/ceo-plans/*.md` (CEO plan)
   - `~/.gstack/projects/$SLUG/designs/*/approved.json` (output design-shotgun)
   - `~/.gstack/projects/$SLUG/designs/*/variant-*.png` (variant PNG)
   - `~/.gstack/projects/$SLUG/designs/*/finalized.html` (prior HTML)
   - `DESIGN.md` di root
3. Routing berdasarkan apa yang ditemukan:
   - **Case A** (approved.json ada): baca PNG approved + feedback + DESIGN.md. Kalau finalized.html juga ada → tanya evolve atau fresh.
   - **Case B** (CEO plan / variants tapi tidak approved): user pilih `/design-shotgun` dulu, atau skip mockup design-from-plan, atau provide PNG sendiri.
   - **Case C** (clean slate): user pilih `/plan-ceo-review` dulu, atau `/plan-design-review`, atau `/design-shotgun`, atau freeform "describe what you want".
4. **Step 1: Design Analysis** — kalau `$D` ada, jalankan `$D prompt --image <variant.png> --output json` untuk extract colors, typography, layout via GPT-4o vision. Kalau tidak ada `$D`, baca PNG inline via Read tool dan describe sendiri.
5. **Step 2-N: Generate HTML** — pakai Pretext-native layout (bukan static CSS approximation). Apply UX Principles:
   - **Three Laws of Usability**: Don't make me think, clicks don't matter thinking does, omit then omit again.
   - **Users actually behave**: scan not read, satisfice, muddle through, don't read instructions.
   - **Billboard design**: conventions (logo top-left, nav top/left), visual hierarchy, obvious clickability, eliminate noise, clarity > consistency.
   - **Navigation as wayfinding**: trunk test, breadcrumbs, current section indicated.
   - **Goodwill reservoir**: don't hide info, don't punish users, save steps.
   - **Mobile**: 44px touch targets minimum, no hover-to-discover.
6. Realistic content (jangan lorem ipsum); generate dari plan context atau user description.

Path penting: artifact selalu ke `~/.gstack/projects/$SLUG/designs/`, NEVER `.context/`, `docs/designs/`, `/tmp/`.

## Contoh / Studi kasus

Haris selesai run `/design-shotgun` untuk landing page maritimhub. Approved variant: `variant-3.png` (navy + serif accent, generous spacing).
- Invoke `/design-html`.
- Step 0 detect Case A (approved.json + DESIGN.md ada).
- Step 1 `$D prompt --image variant-3.png --output json` extract: primary `#0a2540`, font stack "Source Serif / Inter", 8-point spacing scale, 3-column feature grid.
- Step 2 generate HTML dengan Pretext: hero dengan typography hierarchy, navigation top sticky, feature cards yang shrinkwrap konten, pricing table reflow di mobile.
- Output `~/.gstack/projects/maritimhub/designs/landing-20260517/finalized.html`.
- Haris buka di browser → text reflow benar pada resize, mobile view tetap usable.

## Kesimpulan

`/design-html` mengisi jurang antara mockup statis (PNG) dan implementasi nyata (component framework). Output-nya bukan production code, melainkan reference implementation yang behave properly (Pretext layout, basic UX). Pasangkan dengan `/design-shotgun` untuk visual exploration dan `/design-review` untuk audit live implementation. Skill ini opinionated tentang UX laws — kalau request user kontradiksi (misal "hover-only navigation"), skill akan push back dengan reasoning.
