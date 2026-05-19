# Receiving Code Review

> **Sumber:** [`skills/receiving-code-review/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/receiving-code-review/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Saat agent menerima code review, kecenderungan default-nya adalah
performative agreement: "You're absolutely right!", "Great point!",
lalu langsung mengubah kode tanpa memverifikasi apakah saran itu
benar untuk codebase ini. Hasilnya seringkali kerusakan: implementasi
buta menambah bug, atau menghapus kode yang ternyata masih dipakai di
tempat lain. Skill ini menanamkan disiplin teknis: **verifikasi
sebelum implementasi, tanya sebelum mengasumsikan, push back dengan
penalaran teknis kalau reviewer salah.**

Aturan keras: tidak ada ucapan terima kasih, tidak ada agreement
performatif. Aksi berbicara lebih keras — perbaiki saja dan tunjukkan
di kode.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when receiving code review feedback, before implementing
> suggestions, especially if feedback seems unclear or technically
> questionable — requires technical rigor and verification, not
> performative agreement or blind implementation."

Trigger praktis:

- Reviewer (manusia atau bot) memberi komentar di PR.
- Pengguna minta: "respond to this review" / "address these comments".
- Feedback terlihat ambigu, teknis dipertanyakan, atau konflik dengan
  keputusan arsitektur sebelumnya.

## Cara menggunakannya

Pattern respons 6 langkah:

1. **READ** — feedback lengkap tanpa bereaksi.
2. **UNDERSTAND** — restate requirement dengan kata sendiri, atau
   tanya.
3. **VERIFY** — cek terhadap kenyataan codebase.
4. **EVALUATE** — apakah secara teknis benar untuk codebase INI?
5. **RESPOND** — acknowledge teknis atau push back beralasan.
6. **IMPLEMENT** — satu item per kali, test masing-masing.

Aturan handling per sumber:

- **Dari pengguna (human partner)** — trusted, implementasi setelah
  paham, tetap tanya bila scope kabur.
- **Dari reviewer eksternal** — skeptis, cek 5 hal: technically
  correct untuk codebase ini? breaking? alasan implementasi current?
  works di semua platform? reviewer paham full context?

YAGNI check untuk fitur "professional":

- Reviewer minta implementasi lengkap → grep codebase. Tidak dipakai?
  Usulkan hapus (YAGNI).

Order implementasi: blocking issues dulu (breaks/security), simple
fixes (typos/imports), kemudian complex fixes (refactoring/logic).
Test masing-masing.

Skill ini hanya berisi `SKILL.md` tunggal — tidak ada file pendukung.

## Contoh / Studi kasus

**Pertanyaan reviewer:** "Remove legacy code"

Respons performatif (WRONG):

```
You're absolutely right! Let me remove that...
```

Respons verifikasi teknis (RIGHT):

```
Checking... build target is 10.15+, this API needs 13+. Need legacy
for backward compat. Current impl has wrong bundle ID — fix it or
drop pre-13 support?
```

**Pertanyaan reviewer:** "Implement proper metrics tracking with
database, date filters, CSV export."

Respons YAGNI (RIGHT):

```
Grepped codebase — nothing calls this endpoint. Remove it (YAGNI)?
Or is there usage I'm missing?
```

**Pertanyaan pengguna:** "Fix items 1–6." Agent paham 1, 2, 3, 6
tapi tidak yakin 4, 5.

Salah: implementasi 1, 2, 3, 6 dulu, tanya 4, 5 belakangan (partial
understanding → wrong implementation).

Benar: "Understand 1, 2, 3, 6. Need clarification on 4 and 5 before
implementing."

## Kesimpulan

Receiving code review adalah skill emosional yang dibungkus disiplin
teknis. Default agent — performative agreement, blind implementation,
gratitude expressions — merusak kode dan kepercayaan. Skill ini
mengajarkan menggantinya dengan verifikasi, pertanyaan klarifikasi,
dan push back beralasan. External feedback = saran untuk dievaluasi,
bukan perintah untuk diikuti. Saat sudah diperbaiki, cukup nyatakan
fix-nya — kode sendiri menunjukkan bahwa feedback sudah didengar.
