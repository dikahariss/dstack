# Algorithmic Art

> **Sumber:** [`skills/algorithmic-art/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/algorithmic-art/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Generative art dari prompt biasanya berakhir sebagai gambar statis yang dangkal — Claude
mengulang resep yang sama, palette dan komposisi terasa generik. Skill ini memisahkan
proses menjadi dua langkah eksplisit: **filsafat algoritmik** dulu (manifesto tentang
gerakan estetika komputasional), baru ekspresi kode p5.js. Filsafat berperan sebagai
"DNA" yang memandu setiap keputusan implementasi, sehingga hasilnya terasa dibuat oleh
seseorang yang sudah jam terbang tinggi, bukan tempel-tempel.

Nilai uniknya ada pada disiplin proses: setiap karya memiliki seed reproducible, parameter
yang bisa di-tweak, dan UI yang konsisten dengan branding Anthropic. Daripada satu PNG,
yang dihasilkan adalah artefak HTML interaktif self-contained — bisa langsung dijalankan
di claude.ai atau browser tanpa server.

## Kapan menggunakannya

- User minta "buatkan generative art" / "algorithmic art" / "flow field" / "particle system".
- Permintaan menyebut p5.js, Art Blocks, seeded randomness, atau noise field.
- User ingin karya seni komputasional yang bisa di-explore (regenerate, jump seed).
- User minta variasi dari ide visual yang sama dengan parameter berbeda.

Skill ini diniatkan untuk membuat karya **orisinal** — tidak meniru karya seniman yang
ada (untuk menghindari pelanggaran hak cipta).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buatkan generative art dari ide vortex matematis."
- "Bikin algorithmic art flow field dengan seed reproducible."
- "Saya mau particle system p5.js yang bisa di-explore."
- Kata kunci kanonik (EN): `generative art`, `algorithmic art`,
  `flow field`, `particle system`.

Contoh task lengkap:

> "Buatkan generative art bertema 'pertumbuhan akar tanaman' —
> philosophy dulu, lalu HTML interaktif p5.js dengan seed navigation,
> slider untuk particleCount dan noiseScale, tombol Regenerate dan
> Download PNG."

Yang terjadi: agent menulis manifesto algoritmik 4-6 paragraf
(filosofi komputasional + nama gerakan), mendeduksi referensi
konseptual halus dari tema, lalu membaca `templates/viewer.html`
sebagai titik awal literal dan mengganti hanya bagian variabel
(algoritma p5.js, parameter, kontrol sidebar) — output: satu
HTML self-contained dengan seed navigation dan UI branding
Anthropic (Poppins/Lora).

## Cara menggunakannya

Workflow tiga tahap:

1. **Algorithmic Philosophy Creation** — tulis file `.md` berisi 4-6 paragraf manifesto:
   nama gerakan (1-2 kata), filosofi komputasional, penekanan berulang pada
   "meticulously crafted algorithm". Contoh nama: *Organic Turbulence*, *Quantum Harmonics*,
   *Recursive Whispers*.
2. **Deducing the Conceptual Seed** — identifikasi referensi halus dari permintaan user
   yang dijahit ke parameter & perilaku algoritma. Bukan literal, tapi cukup terasa bagi
   yang tahu.
3. **p5.js Implementation** — **WAJIB** baca `templates/viewer.html` dulu sebagai titik
   awal literal. Template menyediakan struktur HTML, branding Anthropic
   (Poppins/Lora, warna terang, gradient backdrop), sidebar (Seed → Parameters →
   Colors? → Actions), dan kontrol seed (prev/next/random/jump). Yang divariasikan:
   algoritma p5.js itu sendiri, parameter, dan kontrol UI parameter.

Resource pendukung:

- `templates/viewer.html` — starting point HTML yang **harus dipakai apa adanya** untuk
  struktur dan branding.
- `templates/generator_template.js` — referensi prinsip p5.js (seeded randomness, struktur
  class, organisasi parameter). Bukan menu pattern — inline saja ke dalam HTML.

Output:

- File `.md` berisi filsafat algoritmik.
- File `.html` self-contained dengan p5.js dari CDN, parameter controls, dan UI inline.

## Contoh / Studi kasus

User: *"Buatkan generative art tentang gelombang air laut yang tenang."*

1. Claude menulis filosofi `wave-meditation.md` — gerakan bernama "Coastal Hush" dengan
   4-6 paragraf yang menekankan flow field berlapis, noise oktaf rendah, dan akumulasi
   trail partikel yang fade perlahan.
2. Claude mendeduksi referensi halus — misalnya rasio damping yang meniru gelombang
   pantai Bali kalau request user menyiratkannya.
3. Claude membaca `templates/viewer.html`, lalu mengisi:
   - Algoritma p5.js (flow field Perlin noise, particle accumulation).
   - Parameter: `seed`, `particleCount`, `noiseScale`, `damping`, `fadeAlpha`.
   - Sidebar controls untuk tiap parameter, plus tombol Regenerate/Reset/Download PNG.
4. Hasil akhir: satu file HTML interaktif yang bisa user explore lewat seed navigation.

## Kesimpulan

Skill ini adalah disiplin produksi generative art ala Anthropic — filsafat dulu,
implementasi belakangan, dengan template HTML yang seragam supaya semua karya punya
UX yang sama (seed navigation, parameter sliders, download). Cocok untuk user yang ingin
karya seni komputasional yang dapat di-explore, bukan sekadar PNG sekali pakai. Output
akhir: satu HTML self-contained plus filosofi `.md` yang menjelaskan mengapa algoritmanya
seperti itu.
