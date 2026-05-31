# Make Pdf

> **Sumber:** [`make-pdf/SKILL.md`](https://github.com/garrytan/gstack/blob/main/make-pdf/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Banyak agent menghasilkan markdown rapi, tetapi ketika user butuh artefak final
untuk dikirim ke investor, klien, atau diarsipkan, markdown saja tidak cukup.
`/make-pdf` mengubah file `.md` menjadi PDF kualitas publikasi: margin 1
inci, page break cerdas, halaman cover opsional, TOC clickable, watermark
diagonal `DRAFT`, dan running header dengan nomor halaman. Output bukan draft
kasar — sudah siap dipakai sebagai surat resmi atau esai.

Skill ini juga konsisten dengan ethos gstack "boil the lake": karena AI
membuat ongkos kelengkapan jadi nyaris nol, default-nya selalu
publication-grade, bukan minimum viable.

## Kapan menggunakannya

Frontmatter `description` menyebut trigger berikut:

- "make this a pdf", "make it a pdf", "export to pdf"
- "turn this into a pdf", "turn this markdown into a pdf"
- "generate a pdf", "make a pdf from", "pdf this markdown"

Trigger lain di field `triggers`: `markdown to pdf`, `generate pdf`, `make
pdf`, `export pdf`. Pakai juga ketika user punya file `.md` terbuka dan minta
"make it look nice" — usulkan `--cover --toc` lalu konfirmasi.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Jadikan file markdown ini PDF yang siap dikirim ke investor."
- "Export proposal.md ke PDF dengan cover page dan TOC."
- "Buat PDF dari essay ini, tambah watermark DRAFT."
- Kata kunci kanonik (EN): `/make-pdf`, `make a pdf`,
  `export to pdf`, `generate pdf`.

Contoh task lengkap:

> "/make-pdf q4-strategy.md — buat PDF dengan cover page
> (author: Haris, title: Q4 Strategy Update), TOC clickable,
> dan watermark DRAFT diagonal. Output simpan sebagai
> q4-strategy-draft.pdf."

Yang terjadi: skill memeriksa binary `make-pdf/dist/pdf`,
lalu menjalankan `$P generate --cover --toc --author "Haris"
--title "Q4 Strategy Update" --watermark DRAFT q4-strategy.md
q4-strategy-draft.pdf`. Output: path PDF satu baris di stdout,
progress di stderr. PDF memiliki halaman cover, TOC clickable,
running header, nomor halaman, dan watermark DRAFT 10% opacity.

## Cara menggunakannya

1. Invoke skill via `/make-pdf` (atau alias `/gstack-make-pdf` jika
   `SKILL_PREFIX` aktif).
2. Skill mengeksekusi blok `MAKE-PDF SETUP` yang mencari binary
   `make-pdf/dist/pdf` dan mengekspor variabel `$P`. Jika
   `MAKE_PDF_NOT_AVAILABLE`, jalankan `./setup` di repo gstack untuk
   compile binary terlebih dahulu.
3. Pilih perintah:
   - `$P generate input.md output.pdf` — kasus 80%, menghasilkan PDF
     dengan header, page number, footer CONFIDENTIAL.
   - `$P generate --cover --toc --author "Nama" --title "Judul" essay.md
     out.pdf` — mode publikasi dengan halaman cover dan TOC clickable.
   - `$P generate --watermark DRAFT memo.md draft.pdf` — overlay diagonal
     `DRAFT` 10% opacity di seluruh halaman.
   - `$P preview essay.md` — render HTML dengan CSS yang sama, dibuka di
     browser untuk iterasi cepat tanpa rebuild PDF.
4. Output `stdout` adalah path PDF (1 baris). `stderr` berisi progress.
   Exit code: 0 sukses, 1 argumen salah, 2 render error, 3 timeout
   Paged.js, 4 browse tidak tersedia.

Flag penting: `--page-size letter|a4|legal`, `--margins 1in|72pt|25mm`,
`--no-chapter-breaks` (jangan page-break tiap H1), `--no-confidential`
(matikan footer CONFIDENTIAL), `--allow-network` (izinkan fetch gambar
remote, off by default untuk blokir tracking pixel).

## Contoh / Studi kasus

User punya `letter.md` berisi pengumuman strategi internal. Workflow:

```
$ /make-pdf letter.md
MAKE_PDF_READY: /home/haris/.claude/skills/gstack/make-pdf/dist/pdf
$ $P generate --cover --toc --author "Haris" --title "Q4 Strategy Update" letter.md letter.pdf
Rendering HTML... Generating PDF... Done in 1.5s. 1240 words · 86KB · letter.pdf
$ open letter.pdf
```

Hasil: 1 halaman cover (judul + nama + tanggal + hairline rule), 1 halaman
TOC clickable, body dengan running header dan footer `N of M`,
copy-paste teks dari PDF menghasilkan kata utuh (bukan `S a i l i n g`).

## Debugging singkat

- Output blank → cek `$B status`, browse daemon harus running.
- Copy-paste tampak `S a i l i n g` → fenced code block + highlight.js
  bug; hapus code block sementara, retry.
- Paged.js timeout (exit 3) → biasanya markdown tanpa heading. Drop
  `--toc`.
- Gambar external missing → `--allow-network` (sadar bahwa ini
  memberi izin file untuk fetch URL gambar; tracking pixel mungkin).
- PDF terlalu tinggi → `--page-size a4` atau `--margins 0.75in`.

Capture path PDF: `PDF=$($P generate letter.md)` lalu gunakan `$PDF` di
script downstream.

## Kesimpulan

`/make-pdf` mengubah pipeline "markdown → presentasi" dari pekerjaan manual
puluhan menit (export ke Word, atur margin, generate TOC) menjadi satu
perintah ~2 detik. Karena binary terkompilasi lokal di
`make-pdf/dist/pdf` dan instalasi font Liberation otomatis di CI/Docker,
hasilnya deterministik di setiap mesin Haris.
