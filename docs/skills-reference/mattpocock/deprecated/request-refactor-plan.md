# Request Refactor Plan

> **Sumber:** [`skills/deprecated/request-refactor-plan/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/deprecated/request-refactor-plan/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** deprecated

## Mengapa skill ini penting

Refactor sering gagal bukan karena ide buruk, tapi karena scope tidak terkunci dan langkah-langkahnya terlalu besar untuk dirollback. Skill ini menerjemahkan keinginan refactor menjadi *plan of tiny commits* — mengikuti nasihat Martin Fowler bahwa setiap langkah refactor harus sekecil mungkin sehingga program selalu dalam keadaan working — dan menyimpan rencana itu sebagai GitHub issue yang dapat ditindaklanjuti atau didelegasikan.

Skill di-deprecate karena fungsinya sekarang lebih baik dibagi: `improve-codebase-architecture` untuk menemukan kandidat refactor, lalu `to-prd` (untuk plan besar) atau `to-issues` (untuk pecah ke vertical slice) untuk publikasi ke issue tracker. Template "Problem Statement / Solution / Commits / Decision Document / Testing Decisions / Out of Scope" tetap kuat sebagai struktur RFC refactor.

## Kapan menggunakannya

- Untuk pekerjaan baru, gunakan `improve-codebase-architecture` + `to-prd`/`to-issues` sebagai pengganti.
- Bila Anda tetap ingin alur "interview → plan → issue" tunggal yang spesifik untuk refactor RFC.
- Frontmatter description menyebut "refactor plan with tiny commits via user interview".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buatkan refactor plan untuk modul billing yang tersebar ini."
- "Mau refactor, tapi butuh rencana tiny commits dulu."
- "Interview aku soal refactor ini, terus file ke GitHub."
- Kata kunci kanonik (EN): `refactor plan`, `refactoring RFC`,
  `tiny commits`, `plan a refactor`.

Contoh task lengkap:

> "Mau refactor `OrderService` — logicnya tersebar di tiga file
> controller. Tolong interview aku, lock scope-nya, cek test
> coverage, lalu pecah jadi tiny commits dan file sebagai GitHub
> issue pakai template RFC yang ada."

Yang terjadi: agent menginterview user soal problem, scope, dan
opsi alternatif; mengeksplorasi repo untuk verifikasi asumsi dan
cek test coverage; mengunci "out of scope" secara eksplisit; lalu
memecah implementasi menjadi commit-commit kecil yang masing-masing
meninggalkan codebase dalam keadaan working, dan mem-file GitHub
issue dengan template lengkap (Problem Statement → Commits →
Decision Document → Testing Decisions → Out of Scope).

## Cara menggunakannya

1. Minta user mendeskripsikan masalah panjang lebar + ide solusi awal.
2. Eksplorasi repo untuk memverifikasi asumsi user dan memahami state codebase.
3. Tanyakan apakah ada opsi lain yang sudah dipertimbangkan; tawarkan opsi tambahan.
4. Interview detail tentang implementasi.
5. Kunci scope: apa yang akan diubah dan **apa yang tidak** akan diubah.
6. Cek coverage test di area target; bila kurang, diskusikan rencana testing.
7. Pecah implementasi menjadi *tiny commits* — tiap commit meninggalkan codebase dalam keadaan working.
8. Create GitHub issue dengan template: Problem Statement → Solution → Commits → Decision Document → Testing Decisions → Out of Scope → Further Notes.

## Contoh / Studi kasus

User ingin merefactor logic billing yang tersebar di tiga modul ke satu modul `BillingService` yang dalam. Skill memandu interview: cakupan persis (apakah perhitungan pajak ikut? tidak), opsi alternatif (extract façade dulu vs langsung pindah), state test coverage (tidak ada — user setuju menulis test integrasi dulu). Plan dipecah jadi 12 commit kecil: (1) tambah test integrasi billing existing, (2) extract `calculateLineTotal`, (3) extract `applyDiscount`, ..., (12) hapus dead code. Issue dibuat dengan semua bagian template terisi, termasuk "Out of Scope: refactor pajak akan dilakukan terpisah."

## Kesimpulan

Sebagai skill tunggal sudah tergantikan, tapi template + ritme "interview → scope lock → tiny commits → issue" tetap pola refactor yang aman. Bila Anda perlu RFC refactor cepat tanpa membuka jalur `improve-codebase-architecture`, template di sini layak disalin.
