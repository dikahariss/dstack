# Theme Factory

> **Sumber:** [`skills/theme-factory/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/theme-factory/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Kalau user butuh styling konsisten untuk berbagai artefak (slide, dokumen, laporan,
landing HTML), pilihan warna/font ad hoc bikin tiap output beda. Skill ini ngasih
**10 tema pre-set** yang sudah teruji (palette + font pairing yang harmonis), plus
mekanisme untuk **bikin tema custom** kalau tidak ada yang cocok. Diniatkan untuk
dekorasi rapid — bukan untuk design from scratch.

Nilai uniknya: ada showcase visual (`theme-showcase.pdf`) yang bisa ditampilkan ke user
untuk pilih dengan mata, bukan dari nama tema saja. Plus mekanisme custom-theme yang
fallback kalau 10 preset tidak cukup.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mau styling artefak (slide, doc, report, HTML landing) dengan tema konsisten.
- User butuh "skin" cepat untuk artefak yang sudah jadi.
- User sebut palette/tema (mis. "yang professional", "ocean themed", "cosmic").

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Terapkan tema yang konsisten ke presentasi annual report ini."
- "Saya mau tema 'ocean' untuk slide deck-nya — pakai yang ada."
- "Bikin tema custom untuk brand healthcare kami, warna warm tapi
  profesional."
- Kata kunci kanonik (EN): `apply theme`, `styling artifact`,
  `color palette`, `font pairing`.

Contoh task lengkap:

> "Saya punya deck 12 slide untuk pitch investor — tolong
> tampilkan semua pilihan tema, lalu terapkan tema yang paling
> cocok untuk fintech startup (modern, trustworthy)."

Yang terjadi: skill menampilkan `theme-showcase.pdf` supaya user
bisa lihat semua 10 preset secara visual, menunggu konfirmasi
pilihan, lalu membaca file tema terpilih dari folder `themes/`
dan mengaplikasikan palette + font pairing secara konsisten ke
seluruh slide (background, heading, body, accent, cover).

## Cara menggunakannya

### Workflow

1. **Show theme showcase** — tampilkan `theme-showcase.pdf` ke user supaya bisa lihat
   semua tema secara visual. **Jangan modifikasi file** — tampilkan saja untuk viewing.
2. **Ask for their choice** — tanya tema mana yang dipilih.
3. **Wait for selection** — explicit confirmation sebelum apply.
4. **Apply the theme** — baca file di `themes/<theme-name>.md`, ambil palette + font,
   apply ke artefak (slide/doc/HTML/dst).

### Themes available (10)

| Tema | Karakter |
|---|---|
| **Ocean Depths** | Maritime, professional & calming |
| **Sunset Boulevard** | Sunset hangat & vibrant |
| **Forest Canopy** | Earth tones, natural & grounded |
| **Modern Minimalist** | Grayscale clean & contemporary |
| **Golden Hour** | Autumnal rich & warm |
| **Arctic Frost** | Winter cool & crisp |
| **Desert Rose** | Dusty soft & sophisticated |
| **Tech Innovation** | Bold modern tech |
| **Botanical Garden** | Garden fresh & organic |
| **Midnight Galaxy** | Cosmic dramatic & deep |

### Per-theme detail

Tiap tema didefinisikan di `themes/<name>.md` dengan:

- Cohesive color palette (hex codes).
- Font pairing untuk header + body.
- Identitas visual yang sesuai konteks/audience tertentu.

### Application process

Setelah tema dipilih:

1. Read file tema dari `themes/`.
2. Apply warna & font konsisten ke seluruh deck/artefak.
3. Pastikan contrast & readability proper.
4. Maintain identitas visual lintas slide/halaman.

### Custom theme

Kalau tidak ada tema yang cocok:

1. Bikin tema baru berdasarkan input user (deskripsi singkat).
2. Beri nama yang menggambarkan font/color (similar pattern ke 10 preset).
3. Show ke user untuk review & verify sebelum apply.
4. Lanjut apply seperti workflow di atas.

Resource pendukung:

- `theme-showcase.pdf` — file showcase semua tema secara visual (read-only, untuk
  ditampilkan ke user).
- `themes/` — folder berisi 10 file tema dengan spesifikasi palette + font.

## Contoh / Studi kasus

User: *"Tolong stylish-kan presentasi sustainability report saya."*

1. Claude tampilkan `theme-showcase.pdf` ke user.
2. User pilih *Forest Canopy* (sesuai topik).
3. Claude baca `themes/forest-canopy.md` — ambil palette (mis. forest green, moss, cream)
   dan font pairing (mis. Cambria + Calibri).
4. Apply ke deck:
   - Background slide content: cream.
   - Heading: Cambria forest green.
   - Body: Calibri dark gray.
   - Accent (chart, icon): moss green.
   - Slide cover & conclusion: forest green background, cream text.

User: *"Saya butuh tema yang fit untuk brand healthcare startup kami — warm tapi
trustworthy."*

Claude bikin custom theme: mis. *"Warm Trust"* dengan teal-warm (`#3D7B8C`) sebagai
primary, krem hangat sebagai secondary, accent coral muted. Font: Source Sans Pro
heading + Source Serif body. Show preview, user approve, Claude apply.

## Kesimpulan

Skill ringan untuk apply theme (palette + tipografi) ke artefak yang sudah dibuat skill
lain. 10 preset tema siap pakai dengan showcase visual untuk pilihan cepat, plus
mekanisme custom-theme untuk kasus di luar preset. Diniatkan sebagai layer styling
final — bukan toolkit untuk design dari nol. Cocok dipanggil setelah `pptx`/`docx`/
`frontend-design`/`canvas-design` saat user butuh konsistensi visual. Output: artefak
yang sama tapi dengan palette & font sesuai tema yang dipilih.
