# PDF

> **Sumber:** [`skills/pdf/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/pdf/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

PDF punya ekosistem library yang fragmented — `pypdf` untuk manipulasi struktur,
`pdfplumber` untuk teks/table extraction, `reportlab` untuk pembuatan, plus command-line
tools (`pdftotext`, `qpdf`, `pdftk`). Tanpa skill, Claude sering memakai library yang
salah untuk tugas, atau memakai library yang sama untuk semua (mis. `pypdf` untuk
extract table, hasilnya kacau). Skill ini memetakan tugas → library/tool yang optimal.

Nilai uniknya: tabel "best tool per task" plus code snippet siap pakai untuk operasi umum
(merge, split, extract text/table, watermark, OCR, password). Plus catatan pitfall yang
sering bikin output rusak (mis. unicode subscript di ReportLab render sebagai black box).

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mention file `.pdf`.
- Operasi PDF: read, extract text/table, merge, split, rotate, watermark, create,
  fill form, encrypt/decrypt, extract image, OCR.

## Cara menggunakannya

### Quick reference tabel

| Tugas | Tool optimal |
|---|---|
| Merge PDF | `pypdf` |
| Split PDF | `pypdf` |
| Extract text | `pdfplumber` |
| Extract table | `pdfplumber` |
| Create PDF | `reportlab` (canvas / Platypus) |
| CLI merge | `qpdf --empty --pages ...` |
| OCR scanned | `pytesseract` (convert ke image dulu) |
| Fill form | `pdf-lib` atau `pypdf` (lihat `FORMS.md`) |

### Library Python

- **pypdf** — basic ops: read, merge, split, extract metadata, rotate, encrypt.
  ```python
  from pypdf import PdfReader, PdfWriter
  reader = PdfReader("document.pdf")
  writer = PdfWriter()
  for page in reader.pages: writer.add_page(page)
  ```
- **pdfplumber** — text + table extraction dengan layout preservation:
  ```python
  with pdfplumber.open("doc.pdf") as pdf:
      tables = pdf.pages[0].extract_tables()
  ```
- **reportlab** — buat PDF dari nol. `Canvas` untuk drawing primitive,
  `SimpleDocTemplate` + Platypus untuk dokumen terstruktur.

  **Pitfall ReportLab:** **JANGAN** pakai unicode subscript/superscript (`₀₁₂`, `⁰¹²`).
  Font built-in tidak punya glyph itu — rendered sebagai black box. Pakai tag XML markup
  di Paragraph: `H<sub>2</sub>O`, `x<super>2</super>`.

### Command-line tools

- `pdftotext` (poppler-utils) — text extraction, support layout & page range.
- `qpdf` — merge/split/rotate/decrypt powerful via CLI.
- `pdftk` — alternative merge/split/rotate kalau ada.

### Tugas umum (siap pakai)

- **OCR scanned PDF** — `pdf2image` + `pytesseract`:
  ```python
  images = convert_from_path('scanned.pdf')
  text = "".join(pytesseract.image_to_string(img) for img in images)
  ```
- **Watermark** — `page.merge_page(watermark_page)` via pypdf.
- **Extract images** — `pdfimages -j input.pdf output_prefix` (poppler-utils).
- **Password** — `writer.encrypt("userpass", "ownerpass")`.

Resource pendukung:

- `reference.md` — advanced patterns (`pypdfium2`, JS library `pdf-lib`, troubleshooting).
- `forms.md` — panduan khusus untuk fill PDF form (wajib baca kalau tugas form-filling).
- `scripts/` — utility script tambahan.

## Contoh / Studi kasus

User: *"Ekstrak semua tabel dari quarterly_report.pdf ke Excel."*

```python
import pdfplumber, pandas as pd
with pdfplumber.open("quarterly_report.pdf") as pdf:
    dfs = []
    for page in pdf.pages:
        for table in page.extract_tables():
            if table:
                dfs.append(pd.DataFrame(table[1:], columns=table[0]))
pd.concat(dfs, ignore_index=True).to_excel("extracted.xlsx", index=False)
```

User: *"Merge 12 PDF bulanan jadi satu annual report."*

```bash
qpdf --empty --pages jan.pdf feb.pdf mar.pdf ... dec.pdf -- annual.pdf
```

User: *"PDF ini scan, tolong jadikan searchable."*

```python
from pdf2image import convert_from_path
import pytesseract
text = "".join(pytesseract.image_to_string(img) for img in convert_from_path('scan.pdf'))
```

## Kesimpulan

Skill ini adalah peta tugas-ke-tool untuk operasi PDF, dengan code snippet siap pakai
untuk library Python (`pypdf`, `pdfplumber`, `reportlab`) dan command-line tool
(`pdftotext`, `qpdf`, `pdftk`, `pdfimages`). Diniatkan supaya Claude tidak salah pilih
library (mis. pakai `pypdf` untuk extract table — hasilnya kacau). Output: file PDF
hasil manipulasi, atau data extracted (text/table) yang ready dipakai workflow downstream.
Untuk pembuatan PDF visual artistik (poster, karya seni), pakai `canvas-design` —
bukan skill ini.
