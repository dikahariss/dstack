# Guard — Full Safety Mode

> **Sumber:** [`guard/SKILL.md`](https://github.com/garrytan/gstack/blob/main/guard/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Saat kerja di production atau debug live system, dua resiko utama: (1) destructive command yang tidak bisa di-undo, (2) edit ke file di luar scope yang bikin blast radius luas. `/careful` cover (1), `/freeze` cover (2). `/guard` adalah kombinasi keduanya dalam satu invokasi: hook PreToolUse aktif untuk Bash (cek destructive pattern), Edit, dan Write (cek freeze boundary). Pakai ini saat ingin maximum safety net tanpa harus invoke dua skill terpisah.

## Kapan menggunakannya

- Voice trigger: "guard mode", "full safety", "lock it down", "maximum safety".
- Touch production database atau prod environment.
- Debugging live system di shared env.
- Saat session yang melibatkan migration script + edit kode terbatas.
- Pair-programming dengan junior developer atau handoff session.

## Cara menggunakannya

Invoke `/guard`. Skill ini ringan (87 baris) — reference hook scripts dari sibling `/careful` dan `/freeze` skill directories. Kedua skill harus terinstall (install bareng oleh gstack setup script).

1. AskUserQuestion text input: "Guard mode: which directory should edits be restricted to? Destructive command warnings are always on. Files outside the chosen path will be blocked from editing."
2. User input path.
3. Skill resolve absolute path, ensure trailing slash, tulis ke `$GSTACK_STATE_ROOT/freeze-dir.txt`.
4. Hook aktif:
   ```yaml
   hooks:
     PreToolUse:
       - matcher: "Bash"
         hooks: [bash ${CLAUDE_SKILL_DIR}/../careful/bin/check-careful.sh]
       - matcher: "Edit"
         hooks: [bash ${CLAUDE_SKILL_DIR}/../freeze/bin/check-freeze.sh]
       - matcher: "Write"
         hooks: [bash ${CLAUDE_SKILL_DIR}/../freeze/bin/check-freeze.sh]
   ```
5. Tell user:
   - "**Guard mode active.** Two protections are now running:"
   - "1. Destructive command warnings — rm -rf, DROP TABLE, force-push, etc. will warn (you can override)"
   - "2. Edit boundary — file edits restricted to `<path>/`. Outside blocked."
   - "To remove edit boundary: `/unfreeze`. To deactivate everything: end session."

Apa yang diproteksi: lihat `/careful` (full daftar destructive pattern dengan safe exceptions) dan `/freeze` (cara kerja edit boundary enforcement).

## Contoh / Studi kasus

Haris diminta partner untuk fix data inconsistency di production DB MaritimHub:
- Invoke `/guard`, set boundary ke `scripts/data-fix/`.
- Selama session:
  - Haris write fix script di `scripts/data-fix/fix-orphan-orders.ts` ✓ (allowed).
  - Claude propose edit `src/orders/handler.ts` untuk "improve while we're at it" → **BLOCKED** (outside freeze dir).
  - Run `psql -c "TRUNCATE orphan_orders;"` → **WARN** (destructive pattern detected). Haris baca, sadar harusnya DELETE WHERE bukan TRUNCATE → cancel.
  - Run `DELETE FROM orphan_orders WHERE created_at < '2026-01-01' AND status='abandoned';` → tidak match destructive pattern, lanjut.
- Dua kali safety net mencegah: production schema edit yang scope-creep + accidental TRUNCATE.

## Kesimpulan

`/guard` adalah single-invoke max-safety untuk session berisiko. Bukan security boundary (bash `sed` masih bisa bypass freeze; user bisa override careful warning), tapi friction layer yang bikin "thinking pause" sebelum tindakan irreversible. Cocok untuk debugging prod, migration script, atau pair-programming dengan tim yang ingin pastikan diskon scope tidak terlanggar. Dependency: `/careful` dan `/freeze` harus ada — keduanya by default ter-install bareng gstack.
