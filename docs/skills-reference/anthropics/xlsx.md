# XLSX

> **Sumber:** [`skills/xlsx/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/xlsx/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Spreadsheet yang dibuat via prompt biasa sering mengalami problem yang fatal untuk model
keuangan: nilai hardcoded (bukan formula — jadi statis), formula error (#REF!, #DIV/0!),
referensi cross-sheet rusak, color coding tidak match industri-standard, atau template
asal user di-override seenaknya. Skill ini memaksa disiplin **formula-first** (Excel
yang hitung, bukan Python), **zero formula error**, **preserve existing template**
saat update, plus **color coding industri-standard** untuk model finansial.

Nilai uniknya: aturan eksplisit untuk model finansial (blue text untuk hardcoded input,
black untuk formula, green untuk cross-sheet link, red untuk external link, yellow
background untuk key assumption) plus script `recalc.py` yang scan ALL cells untuk error
dan return JSON dengan lokasi spesifik — bukan pesan generic "ada error".

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- File spreadsheet jadi input atau output primary.
- Open, read, edit, fix file `.xlsx`/`.xlsm`/`.csv`/`.tsv` (add column, compute formula,
  format, chart, clean messy data).
- Create spreadsheet baru dari nol atau dari sumber lain.
- Convert antar format tabular.
- Cleaning/restructuring messy tabular data (malformed row, misplaced header, junk data).

**Tidak** dipakai kalau deliverable primary adalah Word doc, HTML report, standalone
Python script, database pipeline, atau Google Sheets API integration.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buatkan DCF model 5-year di Excel untuk startup SaaS kami."
- "Bersihkan file `sales_data.xlsx` — banyak baris malformed dan
  header tidak konsisten."
- "Tambahkan kolom growth rate YoY ke spreadsheet revenue ini,
  pakai formula bukan hardcode."
- Kata kunci kanonik (EN): `xlsx`, `spreadsheet`, `Excel formula`,
  `financial model`, `clean messy data`.

Contoh task lengkap:

> "Buatkan P&L model 3-year di `pl_model.xlsx` — revenue dengan
> asumsi growth rate 25% per tahun (blue text), COGS 60% dari
> revenue (formula hitam), EBITDA margin dihitung otomatis.
> Pakai color coding standar finansial dan pastikan zero error
> setelah recalc."

Yang terjadi: skill membuat workbook via openpyxl dengan sheet
Assumptions (growth rate, COGS ratio di sel terpisah, blue text,
yellow background untuk key assumption) dan sheet Model (formula
`=Previous*(1+Assumptions!$B$2)` hitam, cross-sheet link hijau),
number format `$#,##0;($#,##0);-` untuk currency dan `0.0%`
untuk persentase, save, lalu jalankan `python scripts/recalc.py
pl_model.xlsx` dan verifikasi JSON return `total_errors: 0`.

## Cara menggunakannya

### Requirement universal

- **Professional font** — Arial atau Times New Roman default kecuali user instruksi lain.
- **Zero formula errors** — wajib `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`.
- **Preserve existing template** — saat update template, EXACTLY match format/style/konvensi
  existing. Jangan paksa standardisasi.

### Model finansial — color coding industri-standard

| Warna | Makna |
|---|---|
| Blue text (`RGB 0,0,255`) | Hardcoded input, scenario number yang user akan ubah |
| Black text (`RGB 0,0,0`) | ALL formula & calculation |
| Green text (`RGB 0,128,0`) | Cross-sheet link dalam workbook yang sama |
| Red text (`RGB 255,0,0`) | External link ke file lain |
| Yellow background | Key assumption yang butuh perhatian |

### Number formatting

- Years: text string ("2024", bukan "2,024").
- Currency: `$#,##0` + spec unit di header ("Revenue ($mm)").
- Zeros: `$#,##0;($#,##0);-` (dash bukan 0).
- Percentages: `0.0%` (one decimal).
- Multiples: `0.0x` (valuation multiples).
- Negative: pakai paren `(123)`, bukan `-123`.

### Formula construction

- **Assumption placement** — semua assumption (growth rate, margin, multiple) di sel
  terpisah. Pakai cell reference, bukan hardcode: `=B5*(1+$B$6)` bukan `=B5*1.05`.
- **Error prevention** — verify cell reference, check off-by-one di range, consistent
  formula lintas projection period, test edge case (zero/negative/large), avoid circular.
- **Documentation** — comment atau di sel sebelah. Format: `"Source: [System/Document],
  [Date], [Specific Reference], [URL if applicable]"`.

### Workflow umum

1. **Choose tool** — pandas untuk analisis data; openpyxl untuk formula/formatting.
2. **Create/Load** — workbook baru atau load existing.
3. **Modify** — add/edit data, formula, formatting.
4. **Save** — write ke file.
5. **Recalculate (MANDATORY kalau ada formula)** — `python scripts/recalc.py output.xlsx`.
6. **Verify** — kalau status `errors_found`, baca `error_summary` untuk lokasi spesifik,
   fix, re-run.

### Library selection

| Library | Best for |
|---|---|
| pandas | Data analysis, bulk ops, simple data export |
| openpyxl | Formatting kompleks, formula, Excel-specific feature |

**openpyxl tips**:

- Cell 1-based (`row=1, column=1` = A1).
- Read calculated values: `load_workbook('file.xlsx', data_only=True)`.
- **Warning**: kalau buka dengan `data_only=True` lalu save, formula hilang permanent.
- Large file: `read_only=True` atau `write_only=True`.
- Formula preserved tapi tidak ter-evaluate — pakai `recalc.py` untuk update value.

**pandas tips**:

- Specify dtype: `pd.read_excel(..., dtype={'id': str})`.
- Read specific col: `pd.read_excel(..., usecols=['A', 'C', 'E'])`.
- Parse date: `pd.read_excel(..., parse_dates=['date_col'])`.

### CRITICAL: pakai formula, bukan hardcode

```python
# WRONG
sheet['B10'] = df['Sales'].sum()   # hardcode 5000

# CORRECT
sheet['B10'] = '=SUM(B2:B9)'       # Excel yang hitung
```

Berlaku untuk SEMUA kalkulasi (total, persen, ratio, difference). Spreadsheet harus
bisa recalculate saat source data berubah.

### Formula verification checklist

- Test 2-3 sample reference sebelum bangun model penuh.
- Column mapping (column 64 = BL, bukan BK).
- Row offset (DataFrame row 5 = Excel row 6, 1-indexed).
- NaN handling via `pd.notna()`.
- Far-right columns (FY data sering di kolom 50+).
- Multiple matches (search semua occurrence, bukan first only).
- Division by zero (check denominator).
- Wrong reference (verify pointing intended cell).
- Cross-sheet reference (`Sheet1!A1` format).

Resource pendukung:

- `scripts/recalc.py` — recalculate formula via LibreOffice + scan error, return JSON
  dengan lokasi.
- `scripts/office/soffice.py` — auto-config LibreOffice untuk sandboxed env.

## Contoh / Studi kasus

User: *"Buatkan DCF model 5-year untuk startup SaaS, growth rate dan WACC sebagai
assumption."*

1. Bikin sheet "Assumptions" — sel B2 growth rate 30% (blue), B3 WACC 15% (blue), B4
   terminal multiple 8x (blue). Yellow background untuk B2 & B3 (key assumption).
2. Sheet "Model" — formula projection revenue: `=Previous*(1+Assumptions!$B$2)` (black,
   green untuk cross-sheet link).
3. Sheet "DCF" — Free Cash Flow projection, discount factor `=1/(1+Assumptions!$B$3)^Year`,
   PV calculation, terminal value `=FCF_year5*Assumptions!$B$4/(Assumptions!$B$3-Assumptions!$B$2)`.
4. Number format: currency `$#,##0;($#,##0);-` untuk dollar, `0.0%` untuk growth/WACC,
   `0.0x` untuk multiple, year sebagai text.
5. Comment di setiap hardcoded value: `"Source: Mgmt Plan, 2024, p.12"`.
6. Save → `python scripts/recalc.py output.xlsx`. JSON return `status: success,
   total_formulas: 87, total_errors: 0`.

User: *"Clean up sales_data.xlsx — banyak row malformed dan header tidak konsisten."*

1. Load pakai pandas, inspect dengan `.head()`, `.info()`.
2. Identify malformed row (mis. kolom Date pakai string + datetime mix), drop atau fix.
3. Restructure header — pastikan satu row header konsisten.
4. Save sebagai `sales_data_cleaned.xlsx` dengan formula `=SUM(...)` untuk total row,
   bukan hardcode hasil sum.
5. Recalc, verify zero error.

## Kesimpulan

Skill ini adalah disiplin produksi spreadsheet — formula-first (Excel yang hitung, bukan
Python), zero formula error (wajib, via `recalc.py`), color coding industri-standard
untuk model finansial, preserve existing template saat update, plus best practice library
(pandas vs openpyxl). Diniatkan untuk output `.xlsx` yang bisa dipakai analis finansial
serius — bukan dump CSV atau export pandas standar. Cocok dipanggil untuk financial
model, sales report, data cleaning, atau converter tabular yang deliverable-nya wajib
spreadsheet file.
