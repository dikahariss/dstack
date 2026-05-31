# Context Save — Save Working Context

> **Sumber:** [`context-save/SKILL.md`](https://github.com/garrytan/gstack/blob/main/context-save/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Saat session Claude akan compaction, atau user mau switch task / workspace, ada momen krusial: capture state dulu supaya bisa lanjut nanti tanpa kehilangan keputusan. Tanpa skill ini, user harus copy-paste scrollback ke note tool eksternal atau mengandalkan memory. `/context-save` adalah "session notes by a staff engineer" — ia kumpulkan git state, summarize percakapan jadi 4 bagian terstruktur (Summary / Decisions / Remaining Work / Notes), dan tulis ke file markdown yang bisa di-restore lintas branch / workspace.

Filename pakai prefix `YYYYMMDD-HHMMSS-<slug>.md` untuk canonical ordering yang stabil terhadap copy/rsync (mtime drifts, filename tidak).

## Kapan menggunakannya

- Sebelum kompaksi session memori panjang.
- Sebelum switch ke task lain (saved context bisa di-restore minggu depan).
- Sebelum tutup laptop di akhir hari.
- Saat memang ada milestone logis (selesai satu sub-task, lanjut yang lain).
- Variasi:
  - `/context-save` — infer title dari pekerjaan, save.
  - `/context-save <title>` — title eksplisit dari user.
  - `/context-save list` — tampilkan saved contexts (default current branch, `--all` untuk lintas branch).
- `/context-save resume` atau `restore` → diarahkan ke `/context-restore`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Save progress dulu sebelum aku tutup laptop."
- "Simpan state sekarang, mau ganti task."
- "Context save — catat keputusan dan sisa kerja yang belum selesai."
- Kata kunci kanonik (EN): `/context-save`, `save progress`,
  `save state`, `save my work`.

Contoh task lengkap:

> "/context-save auth refactor — session store layer done.
> Catat bahwa handler `/login` belum diintegrasikan, middleware
> belum dipasang, dan ada catatan kenapa JWT approach di-rollback."

Yang terjadi: skill kumpulkan git state (branch, status, diff stat,
log), generate 4-bagian summary (goal, decisions, remaining work,
notes) dari conversation context, hitung durasi sesi, tulis file
`YYYYMMDD-HHMMSS-<slug>.md` ke direktori `checkpoints/` — lalu
konfirmasi path file ke user. Tidak menyentuh kode sama sekali.

## Cara menggunakannya

1. Invoke `/context-save` atau `/context-save <title>`.
2. **HARD GATE**: skill hanya capture state, **tidak modifikasi kode**.
3. **Step 1: Gather state** — `git rev-parse --abbrev-ref HEAD`, `git status --short`, `git diff --stat`, `git diff --cached --stat`, `git log --oneline -10`.
4. **Step 2: Summarize context** — produce 4 bagian:
   - **What's being worked on** — high-level goal.
   - **Decisions made** — pilihan arsitektur, trade-off, why.
   - **Remaining work** — concrete next steps, prioritas.
   - **Notes** — gotchas, blocked items, open questions, attempts yang failed.
5. Infer title kalau tidak diberi user (3-6 kata).
6. **Step 3: Compute session duration** — dari `$_TEL_START` atau `$PPID` lstart.
7. **Step 4: Write saved-context file** — path computed di bash (NOT di LLM prompt) supaya user-title tidak bisa shell-inject. Sanitizer allowlist: hanya `a-z 0-9 - .` survive. Filename collision-safe (append random suffix kalau tubrukan):
   ```
   $GSTACK_STATE_ROOT/projects/$SLUG/checkpoints/YYYYMMDD-HHMMSS-<slug>.md
   ```
   Direktori on-disk pakai nama legacy `checkpoints/` supaya file lama tetap loadable.
8. File format:
   ```markdown
   ---
   status: in-progress
   branch: feat/auth
   timestamp: 2026-04-18T14:30:00-07:00
   session_duration_s: 1842
   files_modified:
     - src/auth/session.ts
   ---
   ## Working on: <title>
   ### Summary ... ### Decisions Made ... ### Remaining Work ... ### Notes
   ```
9. Confirm ke user dengan box `CONTEXT SAVED` + path file.

**List flow** (`/context-save list`):
1. Gather files via `find + sort -r`.
2. Default: filter ke current branch (frontmatter check). Flag `--all` skip filter.
3. Tampilkan tabel: `#  Date  Title  Status` (+ Branch column kalau `--all`).

Aturan penting:
- **Saved files append-only.** Never overwrite atau delete. Tiap save = file baru.
- **Always include branch name di frontmatter** — kritikal untuk cross-branch `/context-restore`.
- **Infer, don't interrogate.** Pakai git state + conversation context untuk fill. AskUserQuestion hanya kalau title genuinely tidak bisa di-infer.
- **Ini gstack skill, bukan Claude Code built-in.** `/checkpoint` lama deprecated.

## Contoh / Studi kasus

Haris kerjakan refactor auth selama 2 jam, baru selesai design store layer tapi belum implementasi handler:
- Ketik `/context-save auth refactor — session layer done`.
- Skill collect git state: 5 file modified di `src/auth/`, branch `feat/auth-refactor`.
- Summary di-generate: "Refactoring auth from JWT → cookie-based session. Session store layer (Redis-backed) implemented & tested. Handler integration belum dimulai."
- Decisions: "Pilih httpOnly cookie + SameSite=Lax untuk CSRF protection; rotation per 1h; signed via HMAC-SHA256 dengan key dari env."
- Remaining: "1) Integrate store ke /login handler; 2) Add session middleware; 3) Update /logout; 4) Integration test full flow."
- Notes: "Sempat coba JWT refresh token approach (commit a3f2d) tapi rollback — kompleksitas tidak worth untuk single-tenant kita."
- File ditulis ke `~/.gstack/projects/maritimhub/checkpoints/20260517-153200-auth-refactor-session-layer-done.md`.
- Haris matikan laptop. Besok `/context-restore` langsung tahu lanjut dari mana.

## Kesimpulan

`/context-save` adalah salah satu skill paling sering dipakai dalam workflow gstack: setiap pause logis, save. Filename canonical (timestamp prefix) bikin restore reliable lintas filesystem/rsync. Read-only kecuali file save itu sendiri — tidak menyentuh kode. Kombinasi `/context-save` + `/context-restore` membentuk continuity layer di atas session ephemera Claude Code, bahkan lintas Conductor workspaces.
