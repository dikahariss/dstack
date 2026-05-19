# Finishing a Development Branch

> **Sumber:** [`skills/finishing-a-development-branch/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/finishing-a-development-branch/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Setelah implementasi selesai dan semua test hijau, agent sering
terjebak di pertanyaan ambigu seperti "Apa selanjutnya?" — yang
akhirnya menghasilkan merge prematur, PR tanpa test plan, atau
worktree yang lupa dibersihkan dan menumpuk di disk. Skill ini
memberi struktur jelas: verifikasi test → deteksi environment →
sajikan opsi → eksekusi pilihan → cleanup. Tidak ada open-ended
question, tidak ada commit ke main tanpa konfirmasi, dan worktree
hanya dihapus saat memang sudah tidak diperlukan.

Disiplin utama: **selalu verifikasi test sebelum menyajikan opsi**,
selalu detect environment dulu (worktree vs normal repo vs detached
HEAD), dan selalu butuh konfirmasi terketik "discard" untuk membuang
pekerjaan.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when implementation is complete, all tests pass, and you
> need to decide how to integrate the work — guides completion of
> development work by presenting structured options for merge, PR,
> or cleanup."

Trigger praktis:

- Semua task di plan selesai dan test hijau lokal.
- Skill `executing-plans` atau `subagent-driven-development` selesai
  dan menyerahkan ke skill ini.
- Pengguna meminta "selesaikan branch ini" / "merge ini" / "buat PR".

## Cara menggunakannya

Enam langkah berurutan:

1. **Verifikasi test** — jalankan suite proyek (`npm test`, `cargo
   test`, dst). Gagal → STOP, jangan ke Step 2.
2. **Deteksi environment** — bandingkan `GIT_DIR` dengan `GIT_COMMON`
   untuk membedakan normal repo, named-branch worktree, dan detached
   HEAD. Menentukan menu yang ditampilkan dan strategi cleanup.
3. **Tentukan base branch** — coba `git merge-base HEAD main` /
   `master`. Atau tanya pengguna.
4. **Sajikan opsi** — persis 4 opsi (atau 3 untuk detached HEAD):
   merge lokal, push+PR, keep as-is, discard.
5. **Eksekusi pilihan** — masing-masing opsi punya prosedur spesifik
   (lihat tabel di bawah).
6. **Cleanup workspace** — hanya untuk Opsi 1 & 4, dan hanya untuk
   worktree di lokasi yang dimiliki superpowers (`.worktrees/`,
   `worktrees/`, `~/.config/superpowers/worktrees/`).

Quick reference:

| Opsi | Merge | Push | Keep Worktree | Cleanup Branch |
|---|---|---|---|---|
| 1. Merge locally | ya | – | – | ya |
| 2. Create PR | – | ya | ya | – |
| 3. Keep as-is | – | – | ya | – |
| 4. Discard | – | – | – | ya (force) |

File pendukung: tidak ada — seluruh prosedur ada inline.

## Contoh / Studi kasus

Setelah `subagent-driven-development` menyelesaikan 5 task untuk
fitur "audit logging", skill ini dipanggil.

1. Run `bun test` → 142/142 pass. Lanjut.
2. Deteksi env: `GIT_DIR` di `.worktrees/audit-logging/.git`, beda
   dengan `GIT_COMMON`. Named-branch worktree.
3. Base branch: `git merge-base HEAD main` sukses → base = main.
4. Sajikan 4 opsi standar.
5. Pengguna pilih Opsi 2 (Create PR).
6. Push branch, jalankan `gh pr create` dengan body berisi Summary
   (3 bullet) dan Test Plan (checklist verifikasi). **Worktree
   tidak dibersihkan** karena pengguna butuh untuk iterasi feedback
   PR. Skill ini lapor URL PR dan path worktree, lalu selesai.

Kasus lain — pengguna pilih Opsi 4 (Discard):

```
This will permanently delete:
- Branch audit-logging
- All commits: abc1234, def5678, 9abcdef
- Worktree at /home/haris/proj/.worktrees/audit-logging

Type 'discard' to confirm.
```

Hanya setelah pengguna mengetik tepat "discard", skill akan `cd` ke
main repo root, jalankan `git worktree remove`, `git worktree prune`,
dan `git branch -D audit-logging`.

## Kesimpulan

Finishing a development branch mengubah momen ambigu "apa selanjutnya"
menjadi keputusan terstruktur dengan 4 opsi yang jelas. Aturan kerasnya
melindungi pengguna dari kehilangan kerja (konfirmasi discard),
melindungi tests (verifikasi sebelum menawarkan opsi), dan melindungi
workspace harness (provenance check sebelum cleanup). Ia adalah
terminal-state wajib untuk `executing-plans` maupun
`subagent-driven-development`.
