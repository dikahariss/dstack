# Subagent-Driven Development

> **Sumber:** [`skills/subagent-driven-development/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Mengeksekusi plan implementasi secara inline di sesi yang sama
menyebabkan **context pollution**: konteks Task 1 mencemari Task 2,
keputusan lama mempengaruhi keputusan baru, dan agent mulai kehilangan
fokus. Skill ini memecah pekerjaan: satu subagent segar per task,
kemudian dua tahap review (spec compliance dulu, baru code quality),
loop sampai bersih. Controller utama hanya berperan sebagai koordinator
yang menyiapkan konteks dan mendispatch.

Hasilnya: kualitas tinggi karena tiap task dieksekusi di konteks
bersih dan direview dua kali, iterasi cepat karena tidak ada human-in-loop
antar task, dan biaya konteks lebih hemat karena subagent hanya
mendapat informasi yang relevan saja.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when executing implementation plans with independent tasks
> in the current session."

Pakai saat:

- Sudah ada implementation plan (dari `writing-plans`).
- Task di plan sebagian besar independen.
- Tetap di sesi ini (bukan parallel session).

Lebih cocok daripada `executing-plans` saat platform mendukung
subagent (Claude Code, Codex). Untuk parallel session yang berbeda,
gunakan `executing-plans` sebagai gantinya.

## Cara menggunakannya

Alur per task:

1. **Dispatch implementer subagent** dengan `implementer-prompt.md`
   — beri full task text dan konteks scene-setting.
2. Jika subagent ajukan pertanyaan → jawab, re-dispatch.
3. Subagent implementasi, test, commit, self-review.
4. **Dispatch spec reviewer subagent** dengan `spec-reviewer-prompt.md`
   — apakah kode match dengan spec?
5. Jika ada gap → implementer fix → re-review.
6. Setelah spec compliant: **dispatch code quality reviewer** dengan
   `code-quality-reviewer-prompt.md`.
7. Jika ada issue quality → implementer fix → re-review.
8. Mark task complete di TodoWrite. Lanjut task berikutnya.

Setelah semua task: dispatch final code reviewer untuk seluruh
implementasi, lalu invoke `superpowers:finishing-a-development-branch`.

Model selection — pakai model termurah yang sanggup:

- Task mekanis 1–2 file → model cepat dan murah.
- Multi-file integration → model standard.
- Architecture / review → model paling capable.

File pendukung di direktori sumber:

- `implementer-prompt.md` — template implementer.
- `spec-reviewer-prompt.md` — template spec compliance review.
- `code-quality-reviewer-prompt.md` — template quality review.

**Continuous execution**: jangan pause minta konfirmasi antar task.
Pengguna sudah meminta eksekusi plan — eksekusi sampai selesai. Stop
hanya untuk BLOCKED yang tidak bisa diresolve atau ambiguitas serius.

## Contoh / Studi kasus

Plan 5 task: hook installation, recovery modes, index verification,
CLI command, dokumentasi.

Task 1 — Hook installation script:

1. Dispatch implementer dengan full text Task 1.
2. Implementer tanya: "Hook di user atau system level?" Controller
   jawab: "User level (~/.config/superpowers/hooks/)".
3. Implementer implementasi, 5/5 test pass, commit, self-review menemukan
   missing `--force` flag, ditambahkan.
4. Spec reviewer: compliant. Code quality reviewer: approved.
5. Mark complete.

Task 2 — Recovery modes:

1. Dispatch implementer (no questions, lanjut).
2. Implementer: verify/repair modes, 8/8 test pass, committed.
3. Spec reviewer: **❌** missing progress reporting (spec minta
   "report every 100 items"), extra `--json` flag (tidak diminta).
4. Implementer hapus `--json`, tambah progress reporting.
5. Spec reviewer: compliant. Code quality reviewer: magic number
   (100). Implementer extract `PROGRESS_INTERVAL` constant.
6. Re-review: approved. Mark complete.

Setelah semua task: final review → invoke
`finishing-a-development-branch`.

## Kesimpulan

Subagent-driven development adalah formula untuk implementasi kualitas
tinggi dengan iterasi cepat. Kuncinya tiga: konteks bersih per task,
dua tahap review berurutan (spec dulu, quality kemudian), dan
continuous execution tanpa pause yang membuang waktu. Lebih mahal
secara invocation, tapi lebih murah daripada debugging bug yang
muncul kemudian. Wajib dipadukan dengan `using-git-worktrees` di awal
dan `finishing-a-development-branch` di akhir.
