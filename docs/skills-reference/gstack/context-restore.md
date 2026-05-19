# Context Restore — Restore Saved Working Context

> **Sumber:** [`context-restore/SKILL.md`](https://github.com/garrytan/gstack/blob/main/context-restore/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Sesi Claude Code rentan terhadap context loss: kompaksi, restart, ganti workspace (Conductor), atau pindah branch. Kalau pengganti session harus baca scrollback panjang untuk paham "lagi ngerjain apa", produktivitas hilang. `/context-restore` adalah pasangan baca-saja dari `/context-save`: ia muat saved context terbaru (lintas branch by default — untuk Conductor workspace handoff), tampilkan summary terstruktur (apa yang dikerjakan, keputusan, sisa kerja, catatan), dan tawarkan untuk lanjut item pertama.

Defaultnya **lintas branch** — beda dengan `/context-save list` yang default ke current branch. Filosofi: context yang disave di workspace A harus bisa di-restore dari workspace B.

## Kapan menggunakannya

- Awal session baru setelah long break.
- Pindah workspace di Conductor — load context dari workspace sebelumnya.
- Setelah compaction memori session.
- Saat Claude bilang "I don't have context for this" — tanya: ada saved context terbaru?
- Variasi:
  - `/context-restore` — load yang terbaru, lintas branch.
  - `/context-restore <title-fragment>` — load context spesifik by title atau number.
  - `/context-restore list` — diarahkan ke `/context-save list`.

## Cara menggunakannya

1. Invoke `/context-restore`.
2. **HARD GATE**: skill hanya baca, **tidak modifikasi kode**.
3. **Step 1: Find saved contexts** — scan `~/.gstack/projects/$SLUG/checkpoints/*.md` (legacy nama `checkpoints/`, isi adalah saved contexts):
   - Pakai `find + sort -r` untuk urutan canonical (filename `YYYYMMDD-HHMMSS` prefix), **bukan** `ls -1t` (filesystem mtime drifts).
   - Cap 20 file terbaru untuk hemat context window.
   - Semua `.md` jadi kandidat, regardless of branch — branch ada di frontmatter, bukan untuk filter.
4. **Step 2: Load right file**:
   - Kalau user kasih title fragment / number → find match.
   - Otherwise → file paling baru dari `sort -r`.
   - Baca file, tampilkan summary:
     ```
     RESUMING CONTEXT
     Title: {title}
     Branch: {branch frontmatter}
     Saved: {timestamp}
     Duration: Last session {formatted}
     Status: {status}
     ### Summary ... ### Remaining Work ... ### Notes
     ```
5. Kalau current branch ≠ saved branch, beritahu user "You may want to switch branches".
6. **Step 3: Offer next steps** via AskUserQuestion:
   - A) Continue working on remaining items
   - B) Show full saved file
   - C) Just needed the context, thanks

Jika tidak ada saved context, prompt: "No saved contexts yet. Run `/context-save` first."

## Contoh / Studi kasus

Haris pindah dari workspace Conductor `feat/auth-refactor` ke `feat/db-migration`:
- Saat masuk workspace baru, sesi Claude fresh, no context.
- Haris ketik `/context-restore`.
- Skill scan `~/.gstack/projects/maritimhub/checkpoints/`, ambil paling baru: `20260517-093200-auth-refactor.md` (dari workspace sebelumnya).
- Summary tampil: "Working on auth refactor — replacing JWT with cookie-based session. Decided: use httpOnly + SameSite=Lax. Remaining: 1) implement session store, 2) write integration test, 3) update docs."
- Notice: "This context was saved on branch `feat/auth-refactor`. You're on `feat/db-migration`."
- Haris pilih C ("just needed context") → sekarang dia ingat, lanjut switch branch dulu sebelum lanjut.

## Kesimpulan

`/context-restore` adalah "wake up brief" yang lengkap dan terstruktur. Cross-branch default bikin Conductor workspace handoff jadi seamless. Sifat read-only ketat: tidak pernah modify kode, hanya tampilkan saved state. Kuncinya pasangan dengan `/context-save` yang disiplin — kualitas restore = kualitas save. Saved context berbentuk markdown manusiawi, bukan binary, jadi user bisa baca/edit manual juga.
