# GStack Upgrade

> **Sumber:** [`gstack-upgrade/SKILL.md`](https://github.com/garrytan/gstack/blob/main/gstack-upgrade/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

gstack ter-update sering — skill baru, bug fix, migration. Tanpa upgrade rutin, user ketinggalan fitur dan masih hit bug yang sudah di-resolve. `/gstack-upgrade` handle deteksi install type (global-git, local-git, vendored, vendored-global), upgrade, migration, sync ke local vendored copy bila ada, dan show "what's new" dari CHANGELOG. Semua orchestrated dengan rollback pada failure dan backoff snooze yang escalating (24h → 48h → 1 week) bila user "Not now".

Skill ini juga punya **inline upgrade flow**: setiap skill gstack lain check `UPGRADE_AVAILABLE` di preamble dan trigger `/gstack-upgrade` flow di tempat (auto kalau `auto_upgrade: true`, atau AskUserQuestion).

## Kapan menggunakannya

- Voice trigger: "upgrade gstack", "update gstack", "get latest gstack", "upgrade the tools".
- Saat skill lain print `UPGRADE_AVAILABLE <old> <new>` (auto-trigger inline flow).
- Standalone: `/gstack-upgrade` cek + upgrade kalau ada update.
- Setelah lihat changelog di rilis baru yang relevant.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Upgrade gstack ke versi terbaru."
- "Ada update gstack — install sekarang."
- "Get latest gstack, jalankan migration kalau ada."
- Kata kunci kanonik (EN): `/gstack-upgrade`, `upgrade gstack`,
  `update gstack version`, `get latest gstack`.

Contoh task lengkap:

> "Skill /investigate baru saja print UPGRADE_AVAILABLE 1.26.3
> 1.27.0. Upgrade sekarang — detect install type, backup, fetch
> + reset origin/main, jalankan ./setup, run migration v1.27.0.0.sh,
> lalu lanjut workflow /investigate tadi."

Yang terjadi: skill mendeteksi tipe install (global-git/vendored),
stash local changes, fetch + reset ke origin/main, menjalankan
migration scripts yang belum dijalankan, menulis marker
`just-upgraded-from`, menampilkan "What's New" dari CHANGELOG 5-7
bullets, lalu melanjutkan skill yang memicu upgrade.

## Cara menggunakannya

**Inline upgrade flow** (referenced by all skill preambles when `UPGRADE_AVAILABLE` detected):

1. **Step 1: Ask or auto-upgrade** — cek `GSTACK_AUTO_UPGRADE=1` env atau `gstack-config get auto_upgrade`. Jika true, skip ask. Otherwise AskUserQuestion 4 opsi:
   - Yes, upgrade now → proceed.
   - Always keep me up to date → set `auto_upgrade true`, proceed.
   - Not now → write snooze state (escalating: 24h, 48h, 1 week), continue current skill.
   - Never ask again → set `update_check false`.
2. **Step 2: Detect install type** — check `~/.claude/skills/gstack/.git` (global-git), `~/.gstack/repos/gstack/.git` (alternative global), `.claude/skills/gstack/.git` (local-git), `.agents/skills/gstack/.git`, atau directory tanpa .git (vendored).
3. **Step 3: Save old version** dari `$INSTALL_DIR/VERSION`.
4. **Step 4: Upgrade**:
   - Git installs: `git stash`, `git fetch origin`, `git reset --hard origin/main`, `./setup`. Warn kalau ada stash.
   - Vendored: clone fresh ke tmp, backup old to `.bak`, move tmp ke install dir, `./setup`, cleanup.
5. **Step 4.5: Handle local vendored copy** — kalau ada local vendored (`.claude/skills/gstack/` di repo) DAN `team_mode=true`: remove local, append `.gitignore`. Kalau `team_mode=false`: sync local dari fresh primary. Restore from backup kalau setup fail.
6. **Step 4.75: Run migrations** — find `gstack-upgrade/migrations/v*.sh`, sort -V, jalankan yang version > OLD_VERSION dan <= NEW_VERSION. Idempotent bash scripts.
7. **Step 5: Write marker + clear cache** — `~/.gstack/just-upgraded-from` (untuk JUST_UPGRADED message di next session), hapus `~/.gstack/last-update-check`, `~/.gstack/update-snoozed`.
8. **Step 6: Show What's New** — read CHANGELOG, summarize 5-7 bullets grouped by theme, skip internal refactor unless significant.
9. **Step 7: Continue** original skill.

**Standalone usage** (direct `/gstack-upgrade`):
1. Force fresh check: `gstack-update-check --force`.
2. Kalau UPGRADE_AVAILABLE: ikuti Step 2-6.
3. Kalau no update: detect local vendored. Kalau ada, compare PRIMARY vs LOCAL version, sync kalau berbeda.

File pendukung penting:
- `bin/gstack-update-check` — check remote untuk versi baru.
- `bin/gstack-config` — read/set config (`auto_upgrade`, `team_mode`, `update_check`).
- `gstack-upgrade/migrations/v*.sh` — version-specific migration scripts.

## Contoh / Studi kasus

Haris sedang debug bug. Skill `/investigate` di preamble print:
```
UPGRADE_AVAILABLE 1.26.3 1.27.0
```
`/investigate` baca inline upgrade flow:
- Step 1 AskUserQuestion (auto_upgrade false): pilih "Yes, upgrade now".
- Step 2 detect global-git di `~/.claude/skills/gstack/`.
- Step 4 git stash (clean, no stash), git fetch + reset + ./setup. Success.
- Step 4.5 no local vendored.
- Step 4.75 migration v1.27.0.0.sh: rename `~/.gstack-brain-remote.txt` → `~/.gstack-artifacts-remote.txt` (artifacts rename).
- Step 5 markers written.
- Step 6 print "What's new in v1.27.0": artifacts rename, design-shotgun taste-profile v1 schema, /devex-review hall-of-fame split, dll.
- Step 7 lanjut `/investigate` workflow.

Bulan depan saat ada lagi update, Haris dulu pilih "Always keep me up to date" → tidak ada lagi prompt, auto-upgrade silent + show what's new.

## Kesimpulan

`/gstack-upgrade` orchestrate upgrade yang aman: detect install type, backup, sync local copy, run migration, dan rollback on failure. Inline flow bikin upgrade tidak interrupt workflow — proses di tempat saat skill mendeteksi update available. Snooze escalating menghormati user yang sedang fokus. Aturan: pakai `auto_upgrade=true` kalau lone developer untuk efisiensi; pakai manual mode kalau tim ada review process untuk skill changes.
