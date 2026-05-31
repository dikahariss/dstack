# DOCX

> **Sumber:** [`skills/docx/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

`.docx` adalah ZIP archive berisi XML, dan tiap aspek (TOC, tracked changes, table width,
page size, image embedding) punya jebakan tersembunyi — docx-js default ke A4 bukan US
Letter, tabel butuh dua width (di tabel + di tiap cell), unicode bullet bikin output rusak,
PageBreak harus di dalam Paragraph, dst. Tanpa skill ini Claude akan menebak signature
library dan menghasilkan file yang nyaris valid tapi pecah di Google Docs atau Word.

Nilai uniknya: tabel kompak "WRONG vs CORRECT" untuk tiap konstruksi, plus script Python
siap pakai (`unpack.py`, `pack.py`, `validate.py`, `comment.py`, `soffice.py`) yang
menangani konversi `.doc → .docx`, smart-quote preservation, validasi schema, dan
auto-repair RSID/whitespace.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mention Word doc, word document, `.docx`.
- User minta dokumen profesional dengan TOC, heading, page number, letterhead.
- Ekstraksi/reorganisasi konten dari `.docx`, insert/replace image, find-and-replace.
- Bekerja dengan tracked changes atau comments.
- User minta "report", "memo", "letter", "template" sebagai file Word/.docx.

**Jangan** dipakai untuk PDF, spreadsheet, Google Docs, atau coding tugas tidak terkait
dokumen.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buatkan memo Word dengan TOC dan tabel keuangan, format US Letter."
- "Edit kontrak.docx ini — tambahkan tracked changes untuk klausul baru."
- "Konversi laporan.doc lama ke .docx lalu insert logo di header."
- Kata kunci kanonik (EN): `Word doc`, `.docx`, `tracked changes`,
  `table of contents`.

Contoh task lengkap:

> "Buatkan `laporan-q2.docx` US Letter via docx-js: heading
> 'Laporan Keuangan Q2' (Heading1), tabel 3 kolom (Periode /
> Pendapatan / Margin) dengan lebar 9360 DXA, TOC otomatis,
> footer halaman, lalu validasi dengan `validate.py`."

Yang terjadi: agent pakai docx-js, set page size `12240 x 15840`
DXA eksplisit (bukan A4 default), override `Heading1` dengan
`outlineLevel: 0` (wajib untuk TOC), tabel dengan dual width
(`columnWidths` + tiap cell) pakai `WidthType.DXA` dan
`ShadingType.CLEAR`, lalu jalankan `validate.py` — kalau gagal:
unpack XML, fix, repack.

## Cara menggunakannya

Quick reference:

| Tugas | Pendekatan |
|---|---|
| Read/analyze | `pandoc` (text + tracked changes) atau `unpack.py` (raw XML) |
| Create new | `docx-js` (`npm install -g docx`) |
| Edit existing | Unpack → edit XML → repack |

### Creating new documents (docx-js)

- **Set page size eksplisit** — docx-js default A4. Untuk US Letter: `12240 x 15840` DXA.
- **Landscape** — pass portrait dimensions + `orientation: PageOrientation.LANDSCAPE`,
  docx-js swap internal.
- **Lists** — JANGAN pakai unicode bullet (`•`). Pakai `LevelFormat.BULLET` di numbering
  config.
- **Tables** — `WidthType.DXA` (bukan PERCENTAGE — pecah di Google Docs), dual width
  (table + per cell), `ShadingType.CLEAR` (bukan SOLID).
- **Images** — `ImageRun` butuh `type` (png/jpg/jpeg/gif/bmp/svg) + altText (title +
  description + name).
- **PageBreak** — harus di dalam `Paragraph`.
- **TOC** — heading wajib `HeadingLevel`, tidak ada custom style; butuh `outlineLevel`
  di paragraph style.
- **Override built-in headings** — pakai exact IDs (`"Heading1"`, `"Heading2"`).
- **Validasi** — `python scripts/office/validate.py doc.docx` setelah generate.

### Editing existing documents (3 langkah wajib)

1. **Unpack** — `python scripts/office/unpack.py document.docx unpacked/` (pretty-print
   XML, merge adjacent runs, smart quotes → XML entities).
2. **Edit XML** — pakai Edit tool langsung (jangan tulis script Python). Smart quotes
   wajib via entities (`&#x2018;`, `&#x2019;`, `&#x201C;`, `&#x201D;`). Untuk tracked
   changes pakai author `"Claude"` kecuali user minta lain. Untuk comments pakai
   `comment.py`.
3. **Pack** — `python scripts/office/pack.py unpacked/ output.docx --original document.docx`
   (validasi + auto-repair RSID & missing `xml:space="preserve"`).

Resource pendukung (folder `scripts/`):

- `office/unpack.py`, `office/pack.py`, `office/validate.py`, `office/soffice.py`
  (auto-config LibreOffice untuk sandbox).
- `accept_changes.py` (terima semua tracked changes via LibreOffice).
- `comment.py` (handle boilerplate comment + reply).

### Konversi `.doc → .docx`

`python scripts/office/soffice.py --headless --convert-to docx document.doc`

## Contoh / Studi kasus

User: *"Buatkan letterhead memo dengan tabel keuangan dan TOC, US Letter."*

1. Claude pakai docx-js, set page `12240 x 15840` DXA, margin 1 inch.
2. Override Heading1/Heading2 dengan ID exact + `outlineLevel: 0/1` (wajib untuk TOC).
3. Tabel keuangan: `width: 9360 DXA`, `columnWidths: [4680, 4680]`, tiap cell juga
   `width: 4680`, shading pakai `ShadingType.CLEAR`, border single 1pt grey.
4. TOC: `new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })`.
5. Validate via `validate.py`. Kalau gagal: unpack, fix XML, repack.

User: *"Tolong terima semua tracked changes di kontrak.docx."*

`python scripts/accept_changes.py kontrak.docx kontrak_clean.docx`.

## Kesimpulan

Skill ini adalah panduan operasional `.docx`: pembuatan via docx-js (dengan jebakan
spesifik docx-js dijabarkan eksplisit), editing via unpack/edit-XML/repack, dan utility
script untuk konversi, validasi, comment, tracked changes. Diniatkan untuk Claude
menghasilkan file Word yang **render konsisten di Word + Google Docs**, bukan file yang
"jadi" tapi pecah di salah satu platform. Output: file `.docx` yang sudah divalidasi
sesuai schema OOXML, plus tracked changes/comments yang aman saat diterima/ditolak.
