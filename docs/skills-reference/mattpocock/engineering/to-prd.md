# To PRD

> **Sumber:** [`skills/engineering/to-prd/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-prd/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Setelah sesi diskusi panjang (brainstorm, grilling, exploration), konteks kaya yang ada di percakapan sering hilang begitu sesi berakhir. Skill ini mengubah konteks tersebut menjadi PRD (Product Requirements Document) dan langsung mempublishnya sebagai issue ber-label `ready-for-agent` — tanpa interview ulang. Logikanya: jangan tanya hal yang sudah tahu; kondensasi yang sudah ada menjadi artifact durable.

Kunci PRD yang baik di sini: user stories yang ekstensif (1..N), implementation decisions tanpa file path / snippet (kecuali snippet dari prototype yang encode keputusan penting), dan section Out of Scope yang eksplisit.

## Kapan menggunakannya

- Konteks percakapan sudah cukup matang untuk dikondensasi.
- User bilang "create PRD dari yang barusan kita bahas" atau "to PRD".
- Setelah `grill-me` / `grill-with-docs` selesai.
- Prasyarat: `setup-matt-pocock-skills` agar issue tracker terkonfigurasi.

## Cara menggunakannya

1. **Explore repo** bila belum, untuk pakai glossarium domain di PRD dan respect ADR.
2. **Sketch major modules** yang perlu dibuat/dimodifikasi. Cari opportunity extract deep modules yang dapat di-test isolasi. Cek dengan user apakah module set ini cocok, dan module mana yang ingin dia tulis testnya.
3. **Tulis PRD** pakai template:
   - **Problem Statement** — dari perspektif user.
   - **Solution** — dari perspektif user.
   - **User Stories** — long numbered list, format `As an <actor>, I want a <feature>, so that <benefit>`.
   - **Implementation Decisions** — module list, interface, klarifikasi teknis, decision arsitektur, schema, API contract, interaksi. No file path / snippet kecuali dari prototype.
   - **Testing Decisions** — apa yang membuat test baik (external behavior, not implementation detail), module mana di-test, prior art di codebase.
   - **Out of Scope** — eksplisit.
   - **Further Notes** — opsional.
4. **Publish** ke issue tracker, apply label `ready-for-agent` (no additional triage).

## Contoh / Studi kasus

Setelah satu jam grilling tentang fitur "Pengguna dapat mengelola subscription", agent menulis PRD: Problem (user butuh visibility + control subscription tanpa kontak support), Solution (dashboard section dengan view + cancel actions), User Stories (12 stories: "as a paying customer, I want to see my next billing date, so that…", dst.), Implementation Decisions (module `SubscriptionView` baru sebagai deep module dengan interface tunggal `getSubscriptionState(userId)`; modifikasi `BillingService` untuk emit cancellation event; tidak ada perubahan database schema), Testing Decisions (integration test untuk `SubscriptionView`, prior art di `OrderViewService.test.ts`), Out of Scope (pause/resume — akan PRD terpisah). PRD dipublish ke GitHub Issues dengan label `ready-for-agent`. Issue siap dipecah lewat `to-issues`.

## Kesimpulan

Pasangan natural `to-prd` adalah `to-issues`: PRD jadi single source of truth, lalu dipecah ke vertical slice. Aturan paling penting: jangan interview ulang — kondensasi konteks yang sudah ada. Dan **no file paths / no code snippets** di PRD (kecuali dari prototype) supaya artifact tidak stale begitu kode bergerak.
