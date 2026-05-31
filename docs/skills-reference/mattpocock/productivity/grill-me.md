# Grill Me

> **Sumber:** [`skills/productivity/grill-me/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** productivity

## Mengapa skill ini penting

Plan yang belum di-stress-test cenderung memiliki blind spot. Skill ini memaksa agent menjadi interviewer relentless: walk down each branch of the design tree, satu pertanyaan pada satu waktu, dengan rekomendasi jawaban di tiap pertanyaan. Bila pertanyaan dapat dijawab dengan eksplorasi kode, eksplor kode dulu — jangan tanya manusia hal yang dapat agent jawab sendiri.

Ini versi paling minimal dari pola grilling. Versi engineering yang lebih kaya (cross-reference dengan `CONTEXT.md` + ADR) ada di `engineering/grill-with-docs`.

## Kapan menggunakannya

- User ingin stress-test plan atau di-grill tentang design.
- User bilang "grill me", "interview me", "stress test this plan".
- Untuk repo yang belum punya `CONTEXT.md`/ADR, atau bila Anda hanya butuh grilling cepat tanpa dokumentasi side effect.
- Frontmatter description: "Interview the user relentlessly about a plan or design until reaching shared understanding".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Grill me tentang desain arsitektur ini."
- "Stress test plan saya — interview saya habis-habisan."
- "Interview saya soal rencana fitur ini, satu pertanyaan dulu."
- Kata kunci kanonik (EN): `grill me`, `interview me`,
  `stress test this plan`.

Contoh task lengkap:

> "Grill me. Saya mau tambah fitur multi-tenant ke aplikasi SaaS
> yang sekarang single-tenant — database shared schema, belum
> ada row-level security. Plan saya: tambah `tenant_id` ke semua
> tabel dan filter di service layer."

Yang terjadi: agent menjadi interviewer relentless — satu
pertanyaan per turn, tiap pertanyaan disertai rekomendasi jawaban,
dan bila jawabannya bisa ditemukan dari eksplorasi kode maka agent
eksplor kode dulu, tidak menunggu jawaban user.

## Cara menggunakannya

Konten skill itu sendiri sangat pendek:

> "Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.
>
> Ask the questions one at a time.
>
> If a question can be answered by exploring the codebase, explore the codebase instead."

Apa yang agent harus lakukan:

1. **Satu pertanyaan pada satu waktu** — tunggu jawaban user sebelum lanjut.
2. **Untuk tiap pertanyaan, sajikan rekomendasi jawaban** — bukan "what do you think?", melainkan "saya rekomendasikan X karena Y. Setuju?".
3. **Walk dependency tree**: keputusan A buka pertanyaan B; B buka C; resolve secara berurutan.
4. **Eksplor kode dulu** bila pertanyaan dapat dijawab dari kode (mis. "apa nama function existing untuk ini?" — cari, jangan tanya).

## Contoh / Studi kasus

User: "Saya mau tambah fitur invite teammate ke workspace." Agent: "Pertanyaan 1: siapa boleh invite — owner saja atau admin juga? Rekomendasi: admin juga, karena owner sering single point of failure. Setuju?" User: "Setuju". Agent: "Pertanyaan 2: invite via email atau juga via link sharable? Rekomendasi: email saja untuk v1, link sharable v2 — link butuh expiry handling, dst. Setuju?" User: "Email saja". Agent (eksplor kode): "Saya cek — existing email service di `src/email/SendGridEmailService.ts` punya method `sendTemplate`. Kita pakai itu. Pertanyaan 3: apa yang terjadi bila invitee sudah punya account di workspace lain? Rekomendasi: tetap kirim invite, accept menambahkan workspace baru ke account mereka. Setuju?" Lanjut sampai semua branch resolved.

## Kesimpulan

Versi paling singkat dari pattern grilling. Aturan paling load-bearing: **satu pertanyaan saja per turn**, **selalu kasih rekomendasi**, **eksplor kode dulu** sebelum tanya. Bila repo Anda sudah punya CONTEXT.md/ADR, upgrade ke `grill-with-docs` untuk side effect dokumentasi inline.
