# Internal Comms

> **Sumber:** [`skills/internal-comms/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/internal-comms/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Komunikasi internal punya format & tone spesifik per-perusahaan: 3P updates beda dengan
company newsletter beda dengan FAQ. Tanpa skill, Claude menulis dengan tone marketing
atau verbose yang tidak cocok dengan konvensi internal. Skill ini memuat panduan format
per-tipe komunikasi sehingga output langsung match dengan ekspektasi pembaca.

Nilai uniknya: sederhana dan langsung — file panduan per format di `examples/`,
SKILL.md sebagai router. Cocok untuk diadaptasi tiap perusahaan dengan menambah file
`examples/<format>.md` baru.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User minta tulis komunikasi internal: status report, leadership update, 3P update,
  company newsletter, FAQ, incident report, project update.
- Mention keyword: 3P updates, company newsletter, company comms, weekly update, faqs,
  common questions, updates, internal comms.

## Cara menggunakannya

Workflow tiga langkah:

1. **Identifikasi tipe komunikasi** dari permintaan user (3P? newsletter? FAQ?).
2. **Load file panduan** yang sesuai dari folder `examples/`:
   - `examples/3p-updates.md` — Progress / Plans / Problems team update.
   - `examples/company-newsletter.md` — newsletter company-wide.
   - `examples/faq-answers.md` — jawaban FAQ.
   - `examples/general-comms.md` — fallback untuk format yang tidak match di atas.
3. **Ikuti instruksi spesifik** di file tersebut untuk formatting, tone, dan
   content-gathering.

Kalau tipe tidak match panduan yang ada, **tanya klarifikasi** dulu sebelum menulis —
jangan asumsi format.

Resource pendukung:

- `examples/` — folder berisi panduan format per-jenis komunikasi internal.

## Contoh / Studi kasus

User: *"Tulis 3P update untuk tim infra minggu ini. Progress: migrasi DB selesai. Plans:
rollout v2. Problems: latency masih 200ms."*

Claude:

1. Identifikasi tipe = 3P update.
2. Load `examples/3p-updates.md`.
3. Ikuti format & tone yang ada di file itu — biasanya: bullet di bawah heading
   Progress/Plans/Problems, kalimat ringkas dengan owner/timeline, link ke ticket/doc.

User: *"Bikin FAQ tentang policy WFH baru."*

Claude:

1. Identifikasi tipe = FAQ.
2. Load `examples/faq-answers.md`.
3. Mengikuti format Q&A — pertanyaan dalam bentuk natural language user (bukan formal
   HR-speak), jawaban ringkas dengan kondisi/exception eksplisit.

## Kesimpulan

Skill router ringan yang mendelegasikan format-spesifik ke file `examples/`. Diniatkan
untuk perusahaan yang punya konvensi komunikasi internal spesifik — tambah file `examples/`
baru untuk format custom. Output: dokumen internal (3P / newsletter / FAQ / status report)
yang match ekspektasi pembaca, dengan tone & struktur yang sudah ditetapkan tim
komunikasi. Bukan untuk komunikasi eksternal (marketing, PR, customer comms).
