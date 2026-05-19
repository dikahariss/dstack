# Executing Plans

> **Sumber:** [`skills/executing-plans/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Plan yang baik (hasil dari skill `writing-plans`) sudah memecah
pekerjaan menjadi langkah-langkah kecil dengan verifikasi yang jelas.
Skill ini mengatur eksekusinya: load plan, review kritis, jalankan
semua tugas berurutan, dan serahkan ke `finishing-a-development-branch`
saat selesai. Bedanya dengan `subagent-driven-development`: skill ini
dipakai saat agent **tidak punya akses subagent** dan menjalankan
plan secara inline di sesi yang sama, atau saat user secara eksplisit
ingin eksekusi sesi paralel dengan checkpoint review.

Disiplin utama: ikuti plan persis seperti yang ditulis, jangan
menebak saat ada blocker, dan **jangan pernah mulai implementasi di
branch main/master tanpa persetujuan eksplisit pengguna**.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when you have a written implementation plan to execute in
> a separate session with review checkpoints."

Trigger praktis:

- Sudah ada plan tertulis (dari `writing-plans`) yang siap
  dieksekusi.
- Platform tidak mendukung subagent — atau user memilih sesi
  inline dibanding subagent-driven.
- User menginginkan checkpoint manual antar fase.

## Cara menggunakannya

Tiga langkah utama:

1. **Load dan review plan**: baca file plan, identifikasi pertanyaan
   atau kekhawatiran. Jika ada concern → angkat ke pengguna dulu.
   Jika tidak → buat TodoWrite untuk semua task dan lanjut.
2. **Eksekusi task per task**: mark `in_progress`, ikuti tiap step
   plan persis, jalankan verifikasi yang ditentukan, mark `completed`.
3. **Selesaikan development**: setelah semua task verified, invoke
   skill `superpowers:finishing-a-development-branch` untuk merge,
   PR, atau cleanup.

Skill ini hanya berisi `SKILL.md` tunggal — tidak ada file pendukung,
karena seluruh panduan teknis ada di skill-skill yang dirujuk.

Aturan stop:

- Hit blocker (missing dependency, test fails, instruksi tidak
  jelas) → ASK, jangan menebak.
- Plan punya gap kritis yang mencegah memulai → stop.
- Verifikasi gagal berulang → stop.
- Approach fundamental perlu dipikir ulang → kembali ke Step 1
  (review plan).

Integrasi wajib:

- `superpowers:using-git-worktrees` — memastikan workspace terisolasi.
- `superpowers:writing-plans` — sumber plan yang dieksekusi.
- `superpowers:finishing-a-development-branch` — terminal state setelah
  semua task selesai.

## Contoh / Studi kasus

Plan `docs/superpowers/plans/2026-05-10-add-rate-limiter.md` punya
6 task: (1) RED test untuk RateLimiter class, (2) GREEN minimal impl,
(3) RED test untuk token bucket algorithm, (4) GREEN refactor ke token
bucket, (5) integrasi middleware, (6) commit + dokumentasi.

Eksekusi inline:

1. Read plan. Tidak ada concern → TodoWrite dengan 6 item.
2. Task 1 in_progress: ikuti tiap step (tulis test, jalankan,
   verifikasi RED), commit, mark completed.
3. Lanjut Task 2 dengan cara yang sama.
4. Saat Task 4, refactor menyebabkan 2 test lain gagal. Stop. Tidak
   menebak — laporkan ke pengguna dengan output failure-nya.
5. Pengguna update plan, kembali ke Step 1 review, lanjut.
6. Semua 6 task hijau → invoke `finishing-a-development-branch`.

## Kesimpulan

Executing-plans adalah jembatan disiplin antara plan tertulis dan
implementasi. Tugasnya bukan kreatif — tugasnya adalah mengikuti
plan dengan ketat, berhenti saat blocker, dan menyerahkan ke skill
finalisasi saat selesai. Untuk environment dengan subagent, gunakan
`subagent-driven-development` sebagai gantinya — kualitas hasilnya
lebih tinggi karena tiap task dieksekusi di konteks bersih dan
direview dua tahap.
