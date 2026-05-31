# Brand Guidelines

> **Sumber:** [`skills/brand-guidelines/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Skill ini memberi Claude akses langsung ke identitas brand Anthropic — kode warna pasti,
font pairing, dan aturan aplikasi — sehingga artefak apa pun yang dihasilkan (slide,
dokumen, poster, mockup) bisa "terlihat seperti Anthropic" tanpa Claude perlu menebak
atau improvisasi visual. Tanpa skill ini, Claude cenderung memakai warna stock atau
font generik (Arial/Inter) yang membuat output tidak konsisten dengan asset resmi.

Nilai uniknya: spesifikasi terkompresi dan langsung pakai. Bukan PDF style guide yang
harus dibaca puluhan halaman, melainkan tabel warna + tipografi + rules yang siap diterapkan
ke `python-pptx`, CSS, atau library design lainnya.

## Kapan menggunakannya

- User minta artefak yang harus "match brand Anthropic" atau "look-and-feel Anthropic".
- Saat membuat slide, dokumen, atau visual yang akan dipublikasikan atas nama Anthropic.
- Saat post-processing artefak yang sudah jadi untuk diberi identitas brand.
- Kata kunci yang men-trigger: *branding, corporate identity, visual identity,
  post-processing, styling, brand colors, typography, Anthropic brand, visual formatting,
  visual design*.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buat slide ini sesuai brand Anthropic."
- "Styling dokumen ini pakai warna dan font resmi Anthropic."
- "Post-process deck ini supaya look-and-feel-nya Anthropic."
- Kata kunci kanonik (EN): `branding`, `brand colors`,
  `visual identity`, `Anthropic brand`.

Contoh task lengkap:

> "Buatkan pitch deck 4 halaman untuk demo produk kami dalam
> python-pptx. Gunakan brand Anthropic: warna Dark/Light/accent,
> Poppins untuk heading, Lora untuk body, dan accent cycling
> orange → blue → green untuk shape non-teks."

Yang terjadi: agent memuat spesifikasi brand (kode warna eksak,
tipografi Poppins/Lora dengan fallback Arial/Georgia, aturan
accent cycling) lalu mengaplikasikannya ke artefak via
`RGBColor` atau CSS variables — hasilnya konsisten tanpa user
perlu menyebut nilai hex.

## Cara menggunakannya

Skill ini ringan — isi utama adalah referensi yang dimuat ke konteks. Workflow:

1. **Pilih warna sesuai peran** — Main colors (Dark `#141413`, Light `#faf9f5`, Mid Gray
   `#b0aea5`, Light Gray `#e8e6dc`) untuk struktur. Accent colors (Orange `#d97757`,
   Blue `#6a9bcc`, Green `#788c5d`) untuk highlight & shape non-teks.
2. **Aplikasikan tipografi** — Poppins (heading ≥24pt, fallback Arial), Lora (body,
   fallback Georgia). Skill secara otomatis fallback ke font sistem kalau Poppins/Lora
   tidak terinstall.
3. **Smart Font Application** — Heading otomatis pakai Poppins, body otomatis pakai Lora,
   warna teks otomatis disesuaikan kontras dengan latar belakang.
4. **Shape & accent cycling** — Bentuk non-teks merotasi orange → blue → green untuk
   menjaga variasi visual tanpa keluar dari brand.

Implementasi praktis: warna dipakai via `RGBColor` di `python-pptx`, atau dipetakan
langsung ke CSS variables / Tailwind config / Figma tokens.

## Contoh / Studi kasus

User: *"Buatkan slide pitch deck 5 halaman tentang produk baru kami, gaya Anthropic."*

Claude memanggil skill `brand-guidelines` + `pptx`:

- Latar belakang slide title pakai `#141413` (Dark), teks judul Poppins 44pt putih
  `#faf9f5`.
- Slide konten pakai latar `#faf9f5` (Light), heading Poppins 32pt `#141413`,
  body Lora 16pt `#141413`.
- Icon di dalam circle pakai accent — slide 1 orange, slide 2 blue, slide 3 green,
  cycle lagi.
- Footer page number pakai Mid Gray `#b0aea5` 10pt.

Hasil: deck terasa "kelihatan Anthropic" tanpa user harus spesifik tentang warna.

## Kesimpulan

Skill referensi singkat berisi spesifikasi brand Anthropic (warna + tipografi + aturan
aplikasi). Diniatkan sebagai "guardrail" supaya Claude tidak membuat artefak yang
out-of-brand. Cocok dipanggil bareng skill lain (pptx, docx, canvas-design, frontend-design)
saat output ditujukan untuk konteks Anthropic. Bukan toolkit independen — lebih sebagai
lapisan styling yang konsisten.
