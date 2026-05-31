# Zoom Out

> **Sumber:** [`skills/engineering/zoom-out/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/zoom-out/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Saat agent sudah "deep" di satu file/modul, mudah kehilangan konteks bagaimana modul itu terhubung dengan dunia di sekitarnya. Skill ini memaksa pergantian lensa: berhenti melihat detail, naikkan satu lapisan abstraksi, dan hasilkan **map** semua modul relevan beserta caller — menggunakan vocabulary glossarium domain proyek.

Pendek tapi load-bearing: skill ini adalah satu-baris prompt. Kekuatannya terletak pada *kapan* dipakai, bukan kompleksitas instruksi.

`disable-model-invocation: true` — skill ini dipanggil eksplisit, biasanya dengan slash command `/zoom-out`, bukan auto-trigger.

## Kapan menggunakannya

- Anda (atau agent) tidak familiar dengan section kode dan butuh bigger picture.
- Sebelum memutuskan refactor lokal — pastikan paham caller dan downstream.
- Frontmatter description: "Tell the agent to zoom out and give broader context or a higher-level perspective."
- Prasyarat: `setup-matt-pocock-skills` agar tahu di mana `CONTEXT.md` dibaca.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Aku tidak familiar dengan area kode ini, beri gambaran besar."
- "Sebelum refactor, tunjukkan semua caller dan downstream modul ini."
- "/zoom-out"
- Kata kunci kanonik (EN): `/zoom-out`, `zoom out`, `bigger picture`,
  `higher-level perspective`.

Contoh task lengkap:

> "Aku sedang debug di `src/billing/refund.ts` tapi mulai kehilangan
> gambaran. /zoom-out — tunjukkan siapa saja yang memanggil Refund
> module ini dan apa yang ia panggil ke bawah, pakai term domain dari
> CONTEXT.md."

Yang terjadi: agent membaca CONTEXT.md untuk mendapat vocabulary
domain proyek, mengidentifikasi modul yang sedang difokuskan, men-
trace semua caller dan downstream dependency-nya, lalu menyajikan
map singkat (satu level, bukan deep dive) menggunakan term domain —
bukan nama class mentah.

## Cara menggunakannya

Invoke skill dengan slash command. Konten skill itu sendiri:

> "I don't know this area of code well. Go up a layer of abstraction. Give me a map of all the relevant modules and callers, using the project's domain glossary vocabulary."

Yang harus agent lakukan:

1. Baca `CONTEXT.md` (atau `CONTEXT-MAP.md` + per-context `CONTEXT.md`) untuk vocabulary domain.
2. Identifikasi modul yang sedang difokuskan.
3. Trace caller (siapa import / panggil modul ini).
4. Trace downstream (apa yang modul ini panggil).
5. Sajikan **map** singkat (tidak deep dive) memakai term domain — bukan `FooBarHandler` mentah, melainkan misalnya "the Order intake module".

## Contoh / Studi kasus

Anda sedang debug di `src/billing/refund.ts`, tiba-tiba kehilangan gambaran. Jalankan `/zoom-out`. Agent baca `CONTEXT.md` (mendapat term: Order, Invoice, Refund, Payment), lalu:

> Refund module dipanggil oleh dua tempat:
> - `CancellationService` saat user cancel subscription immediate
> - `DisputeHandler` saat ada chargeback dari payment processor
>
> Refund downstream:
> - Memanggil `PaymentGateway.refund()` untuk eksekusi
> - Emit event `RefundProcessed` yang dikonsumsi `AccountingLedger` dan `EmailNotifier`
>
> Constraint penting:
> - ADR-0005 menetapkan no-refund-after-7-days kecuali dispute
> - Refund parsial belum di-support (out of scope untuk v1)

Dengan map ini Anda kembali ke `refund.ts` dengan konteks utuh.

## Kesimpulan

Skill super pendek tapi sangat berguna ketika konteks mulai kabur. Pasangkan dengan `diagnose` (sebelum hypothesise) atau `improve-codebase-architecture` (sebelum mengidentifikasi seam).
