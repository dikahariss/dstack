# PPTX

> **Sumber:** [`skills/pptx/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Slide deck yang dihasilkan via prompt biasa nyaris selalu jelek: bullet list di atas
latar putih, font Arial, warna biru default. Skill ini memaksa **disiplin design**
(palette content-informed, dominance bukan equality, visual motif berulang, tipografi
yang punya karakter) plus **disiplin QA** (assume there are problems, gunakan subagent
untuk inspect rendered images, fix-and-verify loop wajib).

Nilai uniknya: tabel 10 color palette dengan tema (Midnight Executive, Forest & Moss,
Coral Energy, dst.) dan font pairing siap pakai, plus daftar **anti-patterns** eksplisit
(jangan center body text, jangan default blue, jangan accent line di bawah title — itu
hallmark AI slop). Plus QA script untuk grep leftover placeholder.

## Kapan menggunakannya

Trigger dari frontmatter `description` (ekspansif sengaja):

- File `.pptx` terlibat sebagai input, output, atau keduanya.
- User mention "deck", "slides", "presentation", atau filename `.pptx`.
- Operasi: create new, edit, read/extract, combine/split, work with template/layout,
  speaker notes, comments.

Bahkan kalau user hanya akan pakai konten untuk hal lain (email, summary), skill ini
tetap dipanggil saat membuka file `.pptx`.

## Cara menggunakannya

### Quick reference tabel

| Tugas | Panduan |
|---|---|
| Read/analyze | `python -m markitdown presentation.pptx` |
| Edit / create from template | Baca `editing.md` |
| Create from scratch | Baca `pptxgenjs.md` |

### Reading content

- Text extraction: `python -m markitdown presentation.pptx`.
- Visual overview: `python scripts/thumbnail.py presentation.pptx`.
- Raw XML: `python scripts/office/unpack.py presentation.pptx unpacked/`.

### Editing workflow

1. Analyze template dengan `thumbnail.py`.
2. Unpack → manipulate slide → edit konten → clean → pack.
3. Detail di `editing.md`.

### Creating from scratch

- Pakai `pptxgenjs` (`npm install -g pptxgenjs`). Detail di `pptxgenjs.md`.

### Design ideas (wajib internalisasi)

**Sebelum mulai**:

- Pilih palette content-informed — kalau bisa di-swap ke deck topik beda dan masih
  "work", artinya belum cukup spesifik.
- Dominance over equality — satu warna 60-70% visual weight, 1-2 supporting, satu sharp
  accent.
- Dark/light contrast — title + conclusion dark, content light ("sandwich"); atau
  full-dark untuk premium feel.
- Commit ke visual motif — satu elemen distinctive yang diulang lintas slide (rounded
  image frame, icon dalam colored circle, thick single-side border).

**Color palette** (10 tema siap pakai): Midnight Executive (navy/ice blue), Forest & Moss,
Coral Energy, Warm Terracotta, Ocean Gradient, Charcoal Minimal, Teal Trust, Berry &
Cream, Sage Calm, Cherry Bold.

**Tiap slide butuh visual element** — image, chart, icon, atau shape. Slide text-only
itu forgettable.

**Tipografi**: hindari default Arial. Pasangan header+body yang sudah teruji: Georgia +
Calibri, Cambria + Calibri, Impact + Arial, Palatino + Garamond, dll. Title 36-44pt bold,
section header 20-24pt bold, body 14-16pt, caption 10-12pt muted.

**Spacing**: margin 0.5" minimum, gap 0.3-0.5" antar block, breathing room — jangan isi
tiap inch.

**Anti-patterns** (JANGAN):

- Repeat layout sama di semua slide.
- Center body text (left-align paragraf & list, center hanya title).
- Skimp size contrast (title minimal 36pt vs body 14-16pt).
- Default blue.
- Mix spacing random.
- Style satu slide saja, sisanya plain.
- Slide text-only.
- Forget text box padding (`margin: 0` atau offset shape).
- Low-contrast (icon & text harus contrast dengan background).
- **NEVER pakai accent line di bawah title** — itu hallmark AI-generated.

### QA wajib

**Assume there are problems.** First render hampir tidak pernah benar.

- **Content QA**: `python -m markitdown output.pptx`, grep `xxxx|lorem|ipsum|this.*(page|slide).*layout`.
- **Visual QA**: convert slide ke image (`scripts/office/soffice.py` + `pdftoppm`), pakai
  **subagent** untuk inspeksi (bahkan untuk 2-3 slide — mata Claude sudah bias melihat
  yang diharapkan, bukan yang ada).
- **Verification loop**: generate → inspect → fix → re-verify slide yang fix (satu fix
  sering bikin masalah baru). Repeat sampai full pass bersih. **Jangan declare success
  tanpa minimal satu fix-and-verify cycle.**

Resource pendukung:

- `editing.md` — workflow edit detail.
- `pptxgenjs.md` — create from scratch detail.
- `scripts/thumbnail.py`, `scripts/office/unpack.py`, `scripts/office/soffice.py`.

## Contoh / Studi kasus

User: *"Buatkan deck pitch 8 slide untuk startup fintech."*

1. Palette: pilih Midnight Executive (navy `1E2761` + ice blue `CADCFC` + white) —
   match konteks finansial profesional.
2. Visual motif: tiap section header punya icon dalam colored circle ice-blue.
3. Slide 1 (title): dark navy background, judul Cambria 44pt bold ice blue.
4. Slide 2-7 (content): light cream background, layout bervariasi (two-column, icon+text
   rows, 2x2 grid, half-bleed image, large stat callout).
5. Slide 8 (conclusion): kembali ke dark navy.
6. Generate → `markitdown` cek konten → soffice convert ke PDF → pdftoppm ke JPG →
   spawn subagent inspect. Subagent temukan: slide 4 stat callout 72pt overflow box, slide 6
   icon dark di latar navy (low contrast). Fix → re-verify hanya 2 slide itu → satu round
   lagi → bersih. Declare success.

## Kesimpulan

Skill ini adalah disiplin pembuatan & editing slide PowerPoint dengan dua pilar: design
taste (palette + tipografi + layout + anti-patterns) dan QA empiris (markitdown grep +
subagent visual inspection + fix-and-verify loop). Diniatkan supaya output bukan "deck
yang jadi" tapi "deck yang siap presentasi" — tanpa overlap, leftover placeholder, atau
hallmark AI slop. Sub-file `editing.md` dan `pptxgenjs.md` dibaca on-demand sesuai tugas
(edit existing vs create from scratch).
