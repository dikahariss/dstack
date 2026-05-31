# Grill with Docs

> **Sumber:** [`skills/engineering/grill-with-docs/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

`grill-me` versi vanilla mengasah plan dengan pertanyaan satu per satu. `grill-with-docs` menambah satu lapisan kuat: sesi grilling juga *cross-reference* dengan `CONTEXT.md` (glossarium domain) dan `docs/adr/` (architectural decisions) yang sudah ada di repo. Setiap kali user memakai istilah yang konflik dengan glossarium, agent langsung menantang. Setiap kali sebuah keputusan kristalisasi, glossarium di-update inline dan — bila keputusan memenuhi kriteria — ditawarkan ADR baru.

Hasilnya: plan yang sudah pre-checked terhadap bahasa dan keputusan terdokumentasi, dan dokumentasi yang ikut tumbuh seiring percakapan, bukan menumpuk untuk di-update belakangan.

## Kapan menggunakannya

- User bilang "grill me with docs", "stress test plan ini terhadap CONTEXT.md kita".
- Sebelum mulai implementasi besar yang menyentuh domain yang sudah punya glossarium dan ADR.
- Frontmatter description: "stress-test a plan against their project's language and documented decisions".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Grill me with docs sebelum aku mulai implementasi fitur ini."
- "Stress test plan ini terhadap CONTEXT.md dan ADR kita."
- "Review plan saya dan tantang dengan glossarium domain."
- Kata kunci kanonik (EN): `grill me with docs`,
  `stress-test plan`, `challenge against CONTEXT.md`.

Contoh task lengkap:

> "Aku mau tambah fitur 'suspend subscription' — grill me with
> docs. Cek dulu CONTEXT.md kita, lalu tanya satu per satu
> sampai semua keputusan kristalisasi. Update CONTEXT.md inline
> kalau ada term baru yang settled."

Yang terjadi: agent membaca `CONTEXT.md` dan `docs/adr/` repo,
lalu wawancarai user satu pertanyaan per giliran — setiap istilah
yang ambigu langsung ditantang terhadap glossarium, term yang
selesai ditulis ke `CONTEXT.md` saat itu juga, dan ADR ditawarkan
hanya bila keputusan hard-to-reverse dan hasil real tradeoff.

## Cara menggunakannya

1. **Wawancarai user tanpa henti** tentang plan; satu pertanyaan pada satu waktu; untuk tiap pertanyaan sajikan rekomendasi jawaban. Bila pertanyaan dapat dijawab dengan eksplorasi kode, eksplor kode dulu.
2. **Cek struktur file**: `CONTEXT.md` di root (single context) atau `CONTEXT-MAP.md` (multi context); cek `docs/adr/` (root) atau per-context ADR di `src/<ctx>/docs/adr/`.
3. **Challenge against glossary**: bila user pakai term yang konflik dengan `CONTEXT.md`, panggil out: "Glossarium menyebut 'cancellation' sebagai X, Anda tampak memaksudkan Y — mana yang benar?"
4. **Sharpen fuzzy language**: usulkan term kanonik. "Anda bilang 'account' — maksudnya Customer atau User?"
5. **Discuss concrete scenarios**: stress test dengan edge case.
6. **Cross-reference dengan kode**: jika kode tak setuju, surface kontradiksi.
7. **Update `CONTEXT.md` inline** saat term terselesaikan. `CONTEXT.md` hanya glossarium — bukan spec, bukan scratch pad.
8. **Tawarkan ADR sparingly** — hanya bila ketiganya: hard to reverse, surprising without context, hasil real tradeoff.

## Contoh / Studi kasus

User: "Kita perlu fitur untuk cancel subscription dan auto-refund." Agent cek `CONTEXT.md`: "Subscription" terdefinisi tapi "cancellation" tidak. Agent: "Glossarium menyebut Subscription tapi tidak menjelaskan cancellation. Apakah 'cancel' berarti immediate termination + refund proporsional, atau hanya disable auto-renewal sampai akhir periode? Rekomendasi saya: keduanya, dan kita beri nama berbeda — `cancel` untuk segera, `cancelAtPeriodEnd` untuk akhir periode." User setuju. Agent update `CONTEXT.md` menambahkan dua term + relationship. Selanjutnya muncul pertanyaan refund policy. User mengusulkan refund 100% selalu. Agent menemukan ADR-0005 yang menetapkan no-refund-after-7-days. Agent surface kontradiksi, user akhirnya setuju keep ADR, plan disesuaikan. Karena keputusan refund-policy ini hard to reverse dan hasil real tradeoff, agent tawarkan ADR baru yang memperluas ADR-0005 untuk kasus cancellation.

## Kesimpulan

Versi terkuat dari pola grilling: plan diasah sambil dokumentasi domain tumbuh dengannya. Bila repo Anda sudah punya `CONTEXT.md` dan `docs/adr/`, gunakan ini alih-alih `grill-me` generic agar dokumentasi tidak tertinggal di belakang.
