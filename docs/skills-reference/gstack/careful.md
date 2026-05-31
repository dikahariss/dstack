# Careful — Destructive Command Guardrails

> **Sumber:** [`careful/SKILL.md`](https://github.com/garrytan/gstack/blob/main/careful/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Claude Code menjalankan banyak bash command otomatis. Sebagian besar aman: `ls`, `git status`, `npm test`. Tapi ada kelas command yang bisa menghancurkan kerjaan dalam satu detik tanpa konfirmasi: `rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, `kubectl delete`. Saat agent salah konteks (mengira di staging padahal di prod), satu command bisa menghilangkan data berjam-jam atau bahkan berhari-hari.

`/careful` adalah PreToolUse hook ringan yang mencegat command sebelum dijalankan, mencocokkan dengan daftar pola destructive, dan minta konfirmasi via `permissionDecision: "ask"`. User bisa override tiap warning, tapi minimal ada pause sebelum kejadian yang tidak bisa dibatalkan.

## Kapan menggunakannya

- Voice trigger: "be careful", "safety mode", "prod mode", "careful mode", "warn before destructive".
- Saat menyentuh sistem production atau shared environment.
- Debugging live system di mana satu typo bisa fatal.
- Saat menjalankan migration script atau database maintenance.
- Default disarankan aktif setiap kali bekerja dengan kredensial produksi.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Aktifkan safety mode — aku mau debug di production."
- "Be careful, kita lagi di shared database."
- "Masuk prod mode sebelum jalankan migration script."
- Kata kunci kanonik (EN): `/careful`, `be careful`, `safety mode`,
  `prod mode`, `warn before destructive`.

Contoh task lengkap:

> "Aku mau debug schema migration di Postgres production. Aktifkan
> `/careful` dulu supaya setiap command destructive seperti DROP
> TABLE atau git reset --hard ditahan dan minta konfirmasi dariku
> sebelum dijalankan."

Yang terjadi: skill mengaktifkan hook PreToolUse yang mencegat
setiap Bash command, mencocokkan dengan pola destructive (rm -rf,
DROP TABLE, git push --force, kubectl delete, dll.), dan mengembalikan
`permissionDecision: "ask"` plus peringatan — user bisa override
per warning. Hook bersifat session-scoped.

## Cara menggunakannya

Invoke `/careful`. Skill ini sangat ringan — hanya 63 baris — dan langsung mengaktifkan hook PreToolUse untuk session ini:

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "bash ${CLAUDE_SKILL_DIR}/bin/check-careful.sh"
          statusMessage: "Checking for destructive commands..."
```

Pola yang diproteksi (tabel di SKILL.md):
| Pattern | Contoh | Risk |
|---------|---------|------|
| `rm -rf` / `rm -r` / `rm --recursive` | `rm -rf /var/data` | Recursive delete |
| `DROP TABLE` / `DROP DATABASE` | `DROP TABLE users;` | Data loss |
| `TRUNCATE` | `TRUNCATE orders;` | Data loss |
| `git push --force` / `-f` | `git push -f origin main` | History rewrite |
| `git reset --hard` | `git reset --hard HEAD~3` | Uncommitted work loss |
| `git checkout .` / `git restore .` | `git checkout .` | Uncommitted work loss |
| `kubectl delete` | `kubectl delete pod` | Production impact |
| `docker rm -f` / `docker system prune` | `docker system prune -a` | Container/image loss |

Pengecualian aman (allowed tanpa warning): `rm -rf node_modules`, `.next`, `dist`, `__pycache__`, `.cache`, `build`, `.turbo`, `coverage`.

Cara kerja: hook baca command dari tool input JSON, cocokkan dengan pola di atas, lalu balikan `permissionDecision: "ask"` plus warning. User bisa override per warning. Untuk deactivate, akhiri session atau mulai conversation baru — hooks bersifat session-scoped.

File pendukung: `bin/check-careful.sh` (logic pencocokan pattern).

## Contoh / Studi kasus

Haris debugging masalah migrasi schema di Postgres production:
- Sesi mulai dengan `/careful` aktif.
- Claude mau jalankan `DROP TABLE staging_users;` — diintercept oleh hook, muncul prompt: "Destructive: DROP TABLE. Proceed?"
- Haris baca, sadar bahwa "staging_users" itu nama yang dipakai juga di production (typo migrasi). Cancel.
- Skill ini barusan menyelamatkan tabel production senilai sebulan data.

Skill saudara `/freeze` (restrict edit ke direktori) dan `/guard` (kombinasi careful + freeze) memberi lapisan proteksi tambahan untuk skenario yang lebih kritis.

## Kesimpulan

`/careful` adalah seatbelt: tidak mencegah semua kecelakaan, tapi memberi pause untuk berpikir sebelum tindakan yang tidak bisa di-undo. Ringan, session-scoped, dan tidak meng-block — hanya minta konfirmasi. Pasangkan dengan `/freeze` ketika debug perlu juga membatasi scope edit, atau pakai `/guard` untuk dapatkan keduanya sekaligus.
