# Using Git Worktrees

> **Sumber:** [`skills/using-git-worktrees/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/using-git-worktrees/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Bekerja langsung di branch utama berisiko: file work-in-progress
tertinggal, baseline tes ter-pollute, dan switch branch jadi mahal.
Git worktree memungkinkan beberapa branch hidup di direktori berbeda
secara simultan, menjaga workspace utama tetap bersih. Skill ini
mengatur agar agent **selalu** bekerja di workspace terisolasi —
mendeteksi worktree yang sudah ada, memilih native tool platform
duluan, dan jatuh ke `git worktree add` hanya jika tidak ada
alternatif.

Prinsip inti: **Detect existing isolation first. Then use native
tools. Then fall back to git. Never fight the harness.**

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when starting feature work that needs isolation from current
> workspace or before executing implementation plans — ensures an
> isolated workspace exists via native tools or git worktree fallback."

Trigger praktis:

- Mulai mengerjakan fitur baru di codebase yang aktif berkembang.
- Sebelum invoke `executing-plans` atau `subagent-driven-development`.
- Pengguna meminta isolation eksplisit.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Bikin worktree terisolasi buat fitur baru ini."
- "Aku mau kerja di branch lain tanpa ganggu workspace sekarang."
- "Siapkan workspace terpisah sebelum eksekusi plan."
- Kata kunci kanonik (EN): `use a worktree`, `isolated workspace`.

Contoh task lengkap:

> "Sebelum aku mulai garap fitur 'bulk import', siapkan workspace
> terisolasi dulu biar gak nyampur dengan perubahan yang lagi jalan
> di main. Pakai worktree."

Yang terjadi: agent mendeteksi apakah Anda sudah di workspace
terisolasi, memilih native worktree tool harness kalau tersedia, dan
jatuh ke `git worktree add` hanya sebagai fallback terakhir — never
fight the harness.

## Cara menggunakannya

Empat langkah berurutan:

1. **Step 0: Detect Existing Isolation** — bandingkan `GIT_DIR` dan
   `GIT_COMMON`. Jika beda dan bukan submodule → sudah di worktree,
   skip ke Step 3. Submodule guard: `git rev-parse
   --show-superproject-working-tree`.
2. **Step 1: Create Isolated Workspace**:
   - **1a (preferred)**: Native worktree tool harness (mis.
     `EnterWorktree`, `WorktreeCreate`, `/worktree` command, atau
     `--worktree` flag). Pakai itu kalau ada — `git worktree add`
     manual menciptakan phantom state yang harness tidak bisa lihat.
   - **1b (fallback)**: `git worktree add` manual. Prioritas direktori:
     instruksi pengguna > `.worktrees/` (hidden) > `worktrees/` >
     global legacy `~/.config/superpowers/worktrees/$project/` >
     default `.worktrees/`. Wajib verifikasi directory di-ignore
     (`git check-ignore`) sebelum create.
3. **Step 3: Project Setup** — auto-detect dan jalankan: `npm
   install` (Node), `cargo build` (Rust), `pip install` (Python),
   `go mod download` (Go).
4. **Step 4: Verify Clean Baseline** — jalankan test suite proyek.
   Gagal → laporkan dan tanya apakah lanjut atau investigate.

File pendukung: tidak ada — seluruh prosedur ada inline.

Sandbox fallback: jika `git worktree add` gagal karena permission
error, beri tahu pengguna sandbox menolak dan kerja di direktori
saat ini sebagai gantinya.

## Contoh / Studi kasus

Pengguna meminta mengerjakan fitur "audit logging". Skill dipanggil.

**Step 0:** `GIT_DIR == GIT_COMMON`. Bukan submodule. Normal repo
checkout.

**Step 1a:** Cek tool harness — ada `EnterWorktree`. Pakai itu.

```
EnterWorktree branch=audit-logging
```

Native tool buat worktree di lokasi terkelola harness, switch ke
sana, dan setup branch. Skip ke Step 3.

**Step 3:** Cek `package.json`, jalankan `npm install`.

**Step 4:** `npm test` → 142/142 pass.

**Report:**

```
Worktree ready at /home/haris/.harness/worktrees/audit-logging
Tests passing (142 tests, 0 failures)
Ready to implement audit-logging
```

Kasus alternative — harness tidak punya native tool:

1. Cek `.worktrees/` di project root → ada.
2. Cek `git check-ignore .worktrees` → ignored.
3. `git worktree add .worktrees/audit-logging -b audit-logging`
4. `cd .worktrees/audit-logging`
5. Setup project + verify baseline tests.

## Kesimpulan

Using-git-worktrees melindungi workspace utama dari kontaminasi
work-in-progress, dan memastikan tiap fitur dikerjakan di environment
terisolasi. Aturan kerasnya: deteksi dulu, native tool kedua, git
fallback terakhir. **Tidak boleh** pakai `git worktree add` manual
saat harness punya tool sendiri — itu menciptakan state yang tidak
bisa di-cleanup. Skill ini wajib dipanggil sebelum `executing-plans`
maupun `subagent-driven-development`.
