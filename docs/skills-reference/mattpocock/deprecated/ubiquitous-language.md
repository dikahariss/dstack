# Ubiquitous Language

> **Sumber:** [`skills/deprecated/ubiquitous-language/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/deprecated/ubiquitous-language/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** deprecated

## Mengapa skill ini penting

Domain Driven Design memperkenalkan istilah *ubiquitous language*: glossarium konsisten yang dipakai oleh developer, domain expert, dan kode itu sendiri. Tanpa glossarium ini, satu kata dipakai untuk konsep berbeda ("account" = Customer? User?), atau beberapa kata dipakai untuk konsep sama (Customer/Client/Buyer). Skill ini mengekstrak terminologi dari percakapan saat ini, menandai ambiguitas, dan menulis hasilnya ke `UBIQUITOUS_LANGUAGE.md` dalam working directory.

Skill di-deprecate karena fungsinya dilanjutkan oleh `engineering/grill-with-docs`, yang menjalankan glossary update *inline* selama grilling session — alih-alih satu ekstraksi batch di akhir. Format glossarium (tabel Term / Definition / Aliases to avoid + Relationships + Example dialogue + Flagged ambiguities) tetap menjadi standar yang dipakai oleh skill engineering lain.

## Kapan menggunakannya

- Untuk pekerjaan baru, jalankan `grill-with-docs` yang melakukan update glossary inline.
- Bila Anda ingin sekali jalan mengekstrak glossarium dari sesi diskusi panjang.
- `disable-model-invocation: true` — skill ini dipanggil eksplisit, bukan otomatis.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Ekstrak ubiquitous language dari diskusi kita tadi."
- "Buatkan glossarium domain dari percakapan ini."
- "Terminologi kita ambiguous — bantu definisikan yang kanonik."
- Kata kunci kanonik (EN): `ubiquitous language`, `domain model`,
  `DDD`, `build a glossary`, `harden terminology`.

Contoh task lengkap:

> "Kita sudah diskusi panjang soal sistem shipping. Sekarang
> ekstrak ubiquitous language-nya: scan percakapan, identifikasi
> term ambigu (terutama 'shipment' vs 'delivery' vs 'order'),
> pilih yang kanonik, dan tulis ke `UBIQUITOUS_LANGUAGE.md`
> beserta tabel per grup, relationships, dan example dialogue."

Yang terjadi: agent menscan percakapan untuk noun dan verb domain,
memilih term kanonik secara opinionated, mencatat aliases to avoid,
menulis `UBIQUITOUS_LANGUAGE.md` dengan format tabel per subdomain
+ Relationships + Example dialogue + Flagged ambiguities, lalu
menampilkan summary inline.

## Cara menggunakannya

1. **Scan percakapan** untuk noun, verb, konsep yang relevan ke domain.
2. **Identifikasi masalah**: ambiguity (kata sama, konsep berbeda), synonym (kata berbeda, konsep sama), vague/overloaded terms.
3. **Propose glossary**: opinionated — pilih term kanonik terbaik, list yang lain sebagai aliases to avoid.
4. **Tulis ke `UBIQUITOUS_LANGUAGE.md`** dengan format tabel per group + Relationships + Example dialogue + Flagged ambiguities.
5. **Output summary inline** di percakapan.

Aturan: definisi pendek (1 kalimat), hanya term domain (skip array/function/endpoint kecuali punya makna domain), kelompokkan ke tabel per subdomain bila natural, tulis example dialogue 3–5 exchange antara dev dan domain expert.

## Contoh / Studi kasus

Sesi membahas billing system. Glossarium dihasilkan:

| Term | Definition | Aliases to avoid |
|------|------------|------------------|
| **Order** | A customer's request to purchase one or more items | Purchase, transaction |
| **Invoice** | A request for payment sent after delivery | Bill, payment request |
| **Customer** | A person or organization that places orders | Client, buyer, account |
| **User** | An authentication identity in the system | Login, account |

Relationships: An Invoice belongs to exactly one Customer. An Order produces one or more Invoices.

Flagged ambiguity: "account" digunakan untuk Customer dan User — ini konsep berbeda; Customer melakukan order, User adalah authentication identity yang bisa saja merepresentasikan Customer atau tidak.

## Kesimpulan

Format glossarium dari skill ini menjadi standar de facto di seluruh mattpocock-skills. Sebagai alur tunggal sudah tergantikan oleh `grill-with-docs` yang melakukannya inline. Bila Anda ingin ekstrak sekali jalan tanpa grilling, polanya tetap valid — tinggal gunakan template tabelnya.
