# Unfreeze

> **Sumber:** [`unfreeze/SKILL.md`](https://github.com/garrytan/gstack/blob/main/unfreeze/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

`/freeze` membatasi edit ke satu direktori untuk sesi (Edit/Write
di luar path itu di-block oleh hook). Berguna saat debugging untuk
mencegah agent "memperbaiki" kode tidak terkait, atau ketika user
ingin scope perubahan ke satu modul. `/unfreeze` adalah counterpart:
membuka kembali edit ke semua direktori tanpa harus mengakhiri
sesi.

Skill ini ringan (`allowed-tools: Bash, Read`) dan deterministic —
hanya menghapus state file di `~/.gstack/freeze-dir.txt`. Hook
`/freeze` masih terdaftar untuk sesi, tetapi karena state file
hilang, hook membolehkan semua edit.

## Kapan menggunakannya

Trigger di `description`:

- "unfreeze", "unlock edits", "remove freeze", "allow all edits"
- Trigger field: `unfreeze edits`, `unlock all directories`,
  `remove edit restrictions`

Pakai ketika user ingin melebarkan scope edit di tengah sesi tanpa
restart Claude Code.

Versi: `0.1.0`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Unfreeze sekarang, mau edit file di luar scope billing."
- "Hapus freeze boundary, perlu ubah logger juga."
- "Buka kembali semua direktori untuk edit."
- Kata kunci kanonik (EN): `/unfreeze`, `unfreeze edits`,
  `unlock all directories`, `remove edit restrictions`.

Contoh task lengkap:

> "Tadi jalankan /freeze app/billing untuk debug. Sekarang mau
> update juga app/utils/logger.ts yang related. Jalankan /unfreeze
> supaya Edit ke luar app/billing tidak diblok."

Yang terjadi: skill menghapus `~/.gstack/freeze-dir.txt` (state
file yang dibaca hook `/freeze`), lalu mencetak konfirmasi direktori
mana yang sebelumnya difreeze. Hook tetap terdaftar di sesi tapi
sekarang membolehkan semua edit karena state file sudah hilang.

## Cara menggunakannya

Eksekusi sangat singkat:

1. Skill jalankan blok analytics opsional (log usage ke
   `~/.gstack/analytics/skill-usage.jsonl`).
2. Eval `gstack-paths` untuk dapat `GSTACK_STATE_ROOT`.
3. Cek `~/.gstack/freeze-dir.txt`:
   - Ada: baca direktori sebelumnya ke variable `PREV`, hapus file,
     print "Freeze boundary cleared (was: $PREV). Edits are now
     allowed everywhere."
   - Tidak ada: print "No freeze boundary was set."
4. Beritahu user hasilnya. Note bahwa hook `/freeze` masih terdaftar
   untuk sesi — tapi karena state file hilang, semuanya allowed.
   Untuk re-freeze, run `/freeze` lagi.

## Contoh / Studi kasus

Haris jalankan `/freeze app/billing` untuk debugging bug billing.
Hook block edit di luar `app/billing/` selama sesi. Setelah 30
menit, ia ingin juga update `app/utils/logger.ts` yang related
tapi di luar scope.

```
/unfreeze
```

Output:

```
Freeze boundary cleared (was: app/billing). Edits are now allowed everywhere.
```

Sekarang Edit ke `app/utils/logger.ts` jalan tanpa block. Setelah
selesai, ia bisa `/freeze app/utils` lagi untuk session berikutnya
jika perlu.

## Catatan teknis

- State file: `~/.gstack/freeze-dir.txt` (path direktori boundary).
- Hook `/freeze` dipasang via mekanisme `update-config` settings.json
  PostToolUse/PreToolUse. `/unfreeze` tidak menyentuh hook
  registration — ia hanya menghapus state yang dibaca hook.
- Tidak ada AskUserQuestion, tidak ada confirmation prompt. Skill
  exit segera setelah hapus file (atau report "no boundary").
- Per-sesi: kalau Claude Code restart, hook hilang otomatis dan
  freeze tidak aktif sampai user `/freeze` lagi.
- Tidak ada logging selain analytics opsional.

## Kesimpulan

`/unfreeze` adalah pasangan minimal `/freeze` untuk membuka kembali
edit scope tanpa restart sesi. Implementasinya cukup hapus state
file — desain sederhana yang sesuai dengan principle gstack: state
explicit di filesystem, skill jadi tipis dan deterministic.
