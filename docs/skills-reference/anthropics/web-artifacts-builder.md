# Web Artifacts Builder

> **Sumber:** [`skills/web-artifacts-builder/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Claude.ai artifact biasa cocok untuk single-file HTML/JSX, tapi pecah saat butuh
state management kompleks, routing, atau komponen shadcn/ui modern. Skill ini ngasih
**suite tooling** (Vite + React + TypeScript + Tailwind + shadcn/ui + 40+ components
pre-installed) supaya Claude bisa develop aplikasi React beneran lalu **bundle ke
single HTML file** lewat Parcel yang aman untuk di-paste sebagai artifact.

Nilai uniknya: workflow lima langkah eksplisit — initialize → develop → bundle →
display → (optional) test — plus aturan anti-AI-slop yang spesifik untuk web artifact
(jangan center-layout berlebihan, jangan purple gradient, jangan rounded-corner uniform,
jangan font Inter).

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User butuh complex artifact dengan state management, routing, atau shadcn/ui components.
- Multi-component React/TS app yang akan jadi single HTML artifact di claude.ai.
- **BUKAN** untuk simple single-file HTML/JSX artifact (terlalu over-engineered).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Bikin artifact claude.ai — kanban board multi-kolom dengan
  drag-and-drop dan filter status."
- "Saya butuh React app dengan routing dan shadcn/ui, bundle
  jadi satu HTML artifact."
- "Buat artifact kompleks: to-do app dengan state global,
  kategori, dan animasi transisi."
- Kata kunci kanonik (EN): `complex artifact`, `React artifact`,
  `shadcn/ui`, `single HTML artifact`, `state management`.

Contoh task lengkap:

> "Bikin artifact claude.ai — expense tracker dengan tiga
> halaman (Dashboard, Tambah Transaksi, Laporan), pakai
> shadcn/ui Table dan Chart, state dikelola Zustand. Bundle
> ke `bundle.html` dan tampilkan."

Yang terjadi: skill menjalankan `bash scripts/init-artifact.sh
expense-tracker`, mengembangkan komponen React + TypeScript
dengan routing `react-router-dom`, shadcn/ui components, dan
Zustand store, lalu menjalankan `bash scripts/bundle-artifact.sh`
untuk menghasilkan `bundle.html` self-contained yang siap
di-paste sebagai artifact di claude.ai — tanpa purple gradient
atau Inter font.

## Cara menggunakannya

### Stack

React 18 + TypeScript + Vite + Parcel (bundling) + Tailwind CSS + shadcn/ui.

### Step 1: Initialize Project

```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

Yang ter-config otomatis:

- React + TypeScript via Vite.
- Tailwind CSS 3.4.1 dengan shadcn/ui theming system.
- Path aliases (`@/`).
- 40+ shadcn/ui components pre-installed.
- All Radix UI dependencies included.
- Parcel via `.parcelrc`.
- Node 18+ compatibility (auto-detect & pin Vite version).

### Step 2: Develop

Edit file di project yang ter-generate. Lihat "Common Development Tasks" di SKILL.md
asli untuk panduan.

### Step 3: Bundle ke Single HTML

```bash
bash scripts/bundle-artifact.sh
```

Output: `bundle.html` — self-contained dengan semua JavaScript, CSS, dependencies inlined.
File ini bisa langsung di-share di Claude conversation sebagai artifact.

**Requirement**: project harus punya `index.html` di root.

Yang dilakukan script:

- Install bundling deps (parcel, @parcel/config-default, parcel-resolver-tspaths,
  html-inline).
- Buat `.parcelrc` dengan path alias support.
- Build dengan Parcel (no source maps).
- Inline semua asset jadi single HTML via `html-inline`.

### Step 4: Share

Share `bundle.html` ke user untuk view sebagai artifact.

### Step 5: Testing (optional)

Hanya kalau diperlukan/diminta. Hindari test upfront karena tambah latency. Test setelah
artifact dipresentasikan, kalau ada issue.

### Design & Style Guidelines

**VERY IMPORTANT** — hindari "AI slop":

- Jangan center-layout berlebihan.
- Jangan purple gradient.
- Jangan rounded corner uniform di semua tempat.
- Jangan font Inter.

(Untuk panduan design lebih lengkap, pakai bareng skill `frontend-design`.)

Resource pendukung:

- `scripts/init-artifact.sh` — bootstrap project React+TS+Tailwind+shadcn.
- `scripts/bundle-artifact.sh` — bundle ke single HTML.
- Reference: https://ui.shadcn.com/docs/components (shadcn/ui components).

## Contoh / Studi kasus

User: *"Bikin dashboard analytics multi-page dengan filter dan chart yang bisa di-state
share antar component."*

1. `bash scripts/init-artifact.sh dashboard-analytics`
2. `cd dashboard-analytics`
3. Edit `src/`:
   - Tambah routing via `react-router-dom`.
   - Komponen filter pakai shadcn `Select`, `DatePicker`, `Checkbox`.
   - Chart pakai `recharts` (install via npm).
   - State global lewat Zustand atau React Context.
   - Apply design taste — bukan center-everything-Inter, melainkan dashboard editorial
     (display font distinctive, sidebar asymmetric, color dominant non-purple).
4. `bash scripts/bundle-artifact.sh` → `bundle.html`.
5. Share `bundle.html` ke user.

User: *"Bikin tombol HTML simple."* → **Skip skill ini** — terlalu over-engineered untuk
single-file artifact. Pakai React/HTML artifact biasa.

## Kesimpulan

Skill ini adalah tooling untuk membangun elaborate multi-component claude.ai artifact —
React + TypeScript + Tailwind + shadcn/ui di-bundle ke single HTML lewat Parcel.
Diniatkan khusus untuk artifact yang butuh state management, routing, atau komponen
shadcn — bukan untuk artifact sederhana (over-engineered). Output: file `bundle.html`
self-contained yang siap di-paste sebagai artifact di claude.ai. Dipasangkan dengan
`frontend-design` untuk design taste, dan dengan `webapp-testing` kalau butuh verifikasi
sebelum share.
