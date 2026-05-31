# Writing Shape

> **Sumber:** [`skills/in-progress/writing-shape/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/in-progress/writing-shape/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** in-progress

**Status:** in-progress — hilir dari `writing-fragments`, untuk artikel argumentatif.

## Mengapa skill ini penting

`writing-fragments` mengumpulkan raw material tanpa struktur. `writing-shape` mengambil pile itu dan **membentuknya jadi artikel** melalui sesi conversational — drafting beberapa kandidat opening, lalu tumbuh paragraf-demi-paragraf, dengan argumen eksplisit di tiap step tentang format (lists, tables, callouts, quotes). Pile diperlakukan sebagai *quarry* (tambang), bukan script — fragmen boleh dipecah, digabung, diparafrasakan, agar artikel terbaca sebagai satu suara.

Berbeda dengan `writing-beats` yang lebih naratif/journey-style, `writing-shape` cocok untuk artikel argumentatif: thesis jelas, urutan logis dependency-aware, pembelaan format setiap blok.

## Kapan menggunakannya

- User punya pile markdown (fragmen, notes, rough draft, transcript) dan ingin membentuk publishable.
- Artikel akan argumentatif (thesis → support → kesimpulan), bukan narasi.
- Frontmatter description: "Take a markdown file of raw material and shape it into an article through a conversational session".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Shape pile fragments ini jadi artikel yang bisa dipublish."
- "Bantu saya rakit notes ini jadi tulisan argumentatif."
- "Saya punya raw material, tolong bentuk jadi artikel dengan thesis jelas."
- Kata kunci kanonik (EN): `writing shape`, `shape article`,
  `raw material`, `shaping session`.

Contoh task lengkap:

> "File `writing/microservices-fragments.md` berisi 22
> fragmen. Bentuk jadi artikel argumentatif di
> `articles/microservices-final.md` — tawari 3 candidate
> opening dulu, saya pilih, lalu kita tumbuhkan paragraf
> demi paragraf. Argue format di setiap step."

Yang terjadi: skill membaca pile end-to-end, menawarkan
2–3 opening dengan thesis berbeda, setelah user memilih
menumbuhkan artikel paragraf demi paragraf dari material
pile — tiap format (prose, list, table, quote) diargue
out loud — append ke file artikel per blok yang disepakati.

## Cara menggunakannya

1. **Baca pile end-to-end** sebelum apa pun. Format pile tidak masalah.
2. **Treat pile sebagai read-only** — jangan edit. Artikel ditulis ke file terpisah.
3. **Konfirmasi path artikel**: bila user belum sebut, tanya sekali. User akan edit file artikel selama sesi — selalu re-read sebelum write untuk preserve.
4. **Loop**:
   - **Draft 2–3 candidate openings**: tiap opening menyiratkan thesis/angle berbeda. Show semua. Paksa user pilih atau kompos hybrid. Opening yang dipilih menentukan apa yang harus dilakukan artikel sisa.
   - **Grow paragraf demi paragraf**: setelah opening landed, tanya "given this opening, what does the reader need to hear next?" Pull dari pile. Argue tentang format berikutnya: paragraph, list, table, callout, quote, code block. Setiap pilihan format harus deliberate dan defendable.
   - **Append ke article file as you go**: jangan batch.
   - **Loop sampai user bilang done.**
5. **Conversational moves**: "Apa yang paragraf ini lakukan untuk pembaca yang sebelumnya tidak?", "Kalau ini di-cut, apa yang patah?", "Ini prose atau seharusnya list?", "Kalimat ini dua tugas — split atau pilih satu.", "Opening janji X, kita drift ke Y — re-thread atau ganti opening."
6. **Argue format trade-offs out loud**: prose vs list, inline vs callout, table vs repeated structure, quote vs paraphrase, code block vs inline code.
7. **Bila pile kurang sesuatu yang artikel butuh**: name the gap eksplisit — "kita butuh contoh di sini, pile tidak punya. Kasih sekarang atau kita cut section ini."

Out of scope: menambang fragmen baru yang tidak ada di pile, edit raw material file, publishing, formatting platform-specific, atau frontmatter yang user tidak minta.

## Contoh / Studi kasus

Pile dari `writing-fragments` punya 22 fragmen tentang microservices. Agent baca semua, tawarkan 3 opening:

A. *Thesis declarative* — "Microservices bukan keputusan teknis, tapi keputusan organisasi." Implies argumentative essay tentang Conway's Law.
B. *Vignette opening* — "Senin pagi sistem down 3 jam." Implies story-driven dengan thesis muncul belakangan.
C. *Hybrid contra-thesis* — "Anda mungkin baca bahwa Conway's Law adalah penjelasan. Itu salah — Conway's Law adalah ramalan." Implies argumen yang langsung melawan misreading umum.

User pilih C. Tulis opening ke file. Agent: "Reader sekarang penasaran kenapa itu ramalan. Apa yang harus mereka dengar dulu — definisi 'ramalan' di konteks ini, atau langsung contoh konkret?" User pilih contoh. Pull vignette dua tim split service dari pile, parafrase. Tulis. Re-read. Lanjut: "Sekarang reader siap lihat counter-example?" User bilang ya. Pull, format, tulis. Setelah 8 paragraf user puas → done. Pile masih punya 9 fragmen tak terpakai — itu point.

## Kesimpulan

Status in-progress: pasangan natural dengan `writing-fragments` (hulu). Aturan paling load-bearing: **pile read-only**, **argue format trade-offs out loud**, **re-read article file sebelum tiap write**, **name the gap bila pile kurang**.
