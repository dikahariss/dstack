# Canvas Design

> **Sumber:** [`skills/canvas-design/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Membuat poster atau karya seni visual via prompt biasa sering berakhir generik:
template berbasis bullet, palette default, tipografi safe. Skill ini memaksa Claude
melalui disiplin **dua tahap eksplisit**: filsafat desain (manifesto gerakan estetika)
dulu, baru kanvas. Tujuannya: hasil akhir terasa seperti karya seni museum/majalah,
bukan dokumen dengan dekorasi.

Nilai uniknya: penekanan berulang pada *meticulously crafted*, *the product of deep
expertise*, *painstaking attention* — dipasang di dalam filosofi sehingga ketika Claude
mengimplementasikan kanvas, mindset-nya sudah tepat. Plus aturan eksplisit: minimal text,
maksimal visual, satu halaman per artefak (kecuali diminta), font dari folder
`./canvas-fonts/` (bukan generik).

## Kapan menggunakannya

- User minta poster, karya seni statis, design forward output.
- Permintaan menyebut PDF visual, PNG art, museum-quality work, magazine-quality work.
- Saat user ingin "abstract", "minimalist", "brutalist", atau gaya seni tertentu sebagai
  PDF/PNG.

Skill ini diniatkan untuk membuat karya **orisinal** — tidak meniru karya seniman yang
ada (untuk menghindari pelanggaran hak cipta).

## Cara menggunakannya

Workflow tiga tahap (mirror dengan `algorithmic-art`, tapi statis bukan algoritmik):

1. **Design Philosophy Creation** — file `.md` berisi 4-6 paragraf manifesto: nama gerakan
   1-2 kata, filosofi visual (space/form/color/composition), penekanan berulang pada
   craftsmanship. Contoh: *Concrete Poetry*, *Chromatic Language*, *Analog Meditation*,
   *Organic Systems*, *Geometric Silence*.
2. **Deducing the Subtle Reference** — referensi konseptual halus dari permintaan user
   yang dijahit invisible ke form/color/composition. Bukan literal.
3. **Canvas Creation** — eksekusi visual:
   - Single page, design-forward PDF atau PNG.
   - Repeating patterns, perfect shapes.
   - Sparse clinical typography (text minimal, sebagai visual accent — bukan paragraf).
   - Limited cohesive color palette.
   - **WAJIB** gunakan font dari folder `./canvas-fonts/` (bukan Arial/Helvetica generik).
     Bisa juga download font lain sesuai kebutuhan.
   - Pastikan tidak ada elemen yang overlap/fall off page, margin proper.

Resource pendukung:

- `canvas-fonts/` — folder berisi font-font yang sudah disiapkan untuk dipakai.

Output:

- File `.md` (filsafat desain).
- File `.pdf` atau `.png` (kanvas final).

## Contoh / Studi kasus

User: *"Buatkan poster untuk workshop keramik minimalis."*

1. Claude menulis `philosophy.md` — gerakan bernama "Analog Meditation" dengan 4-6
   paragraf yang menekankan tekstur kertas, ruang putih luas, tipografi berbisik, dan
   penghormatan pada material.
2. Claude mendeduksi referensi halus — mungkin proporsi *wabi-sabi* atau ritme
   *kintsugi* yang tersembunyi dalam komposisi.
3. Claude membuat PDF 1 halaman:
   - Latar belakang krem dengan noise tekstur halus.
   - Satu fotografi/illustrasi cangkir keramik dominan di salah satu sisi.
   - Tipografi small caps font dari `./canvas-fonts/` — judul workshop kecil di pojok,
     tanggal & lokasi sebagai label diskrit.
   - Sisanya negative space yang generous.

Setelah render pertama, **FINAL STEP** mengingatkan Claude bahwa user (secara default)
sudah bilang "It isn't perfect enough" — Claude harus refine, bukan menambah elemen
baru. Tujuannya: bukan mengganti font atau filter, melainkan membuat komposisi yang
sudah ada makin koheren.

## Kesimpulan

Skill ini adalah disiplin pembuatan poster/karya seni statis ala Anthropic — filsafat
desain dulu (4-6 paragraf manifesto), referensi halus, baru kanvas. Output: PDF/PNG
1 halaman museum-quality dengan font custom dan minimal text. Diniatkan untuk
mengeluarkan Claude dari mode "dokumen dengan dekorasi" menuju "art object". Mendukung
multi-page jika diminta — halaman tambahan jadi twist/variasi dari halaman pertama,
seperti coffee table book.
