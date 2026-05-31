# Freeze — Restrict Edits to a Directory

> **Sumber:** [`freeze/SKILL.md`](https://github.com/garrytan/gstack/blob/main/freeze/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Saat debug bug di module spesifik, agent kadang "tergoda" untuk juga "fix" hal lain yang dia notice di file lain — refactor di luar scope, perubahan formatting, dll. Hasilnya: PR yang seharusnya 10 baris jadi 300 baris dengan blast radius luas. `/freeze` adalah PreToolUse hook yang **memblokir** (bukan cuma warn) operasi Edit dan Write di luar direktori yang user tentukan. Bedanya dengan `/careful`: careful warn + ask; freeze deny hard.

Cocok dipakai saat skill `/investigate` lock scope post-hypothesis, atau saat user explicit ingin batasi blast radius.

## Kapan menggunakannya

- Voice trigger: "freeze", "restrict edits", "only edit this folder", "lock down edits".
- Bug fix yang harus tetap di satu module.
- Refactor terkontrol — limit ke folder spesifik supaya jangan creep.
- Saat call dari `/investigate` Phase 1.5 "Scope Lock" — lock ke narrowest containing dir.
- Tidak untuk session general — terlalu restrictive untuk exploration.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Freeze — jangan edit file di luar src/auth/."
- "Batasi perubahan hanya ke folder ini saja."
- "Lock down edits ke src/payments/ selama debug ini."
- Kata kunci kanonik (EN): `/freeze`, `freeze edits to directory`,
  `restrict file changes`, `lock editing scope`.

Contoh task lengkap:

> "Aku debug bug session expiry di MaritimHub. Freeze edits ke
> `src/auth/` — aku tidak mau Claude edit file lain di luar folder
> itu, apapun yang dia notice."

Yang terjadi: skill menanya path direktori via AskUserQuestion,
meresolusi ke absolute path, menyimpan ke state file, lalu hook
PreToolUse aktif — setiap Edit/Write ke file di luar `src/auth/`
langsung di-deny (bukan cuma warn), sementara Read, Bash, Glob
tidak terpengaruh.

## Cara menggunakannya

Invoke `/freeze`. Skill (87 baris saja) trigger AskUserQuestion text input:

> "Which directory should I restrict edits to? Files outside this path will be blocked from editing."

User ketik path. Skill resolve ke absolute path, ensure trailing slash, dan tulis ke state file:

```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
FREEZE_DIR="${FREEZE_DIR%/}/"
eval "$(~/.claude/skills/gstack/bin/gstack-paths)"
echo "$FREEZE_DIR" > "$GSTACK_STATE_ROOT/freeze-dir.txt"
```

Hook PreToolUse aktif untuk Edit + Write:

```yaml
hooks:
  PreToolUse:
    - matcher: "Edit"
      hooks: [bash ${CLAUDE_SKILL_DIR}/bin/check-freeze.sh]
    - matcher: "Write"
      hooks: [bash ${CLAUDE_SKILL_DIR}/bin/check-freeze.sh]
```

Cara kerja:
- Hook baca `file_path` dari Edit/Write input JSON.
- Cek apakah path mulai dengan freeze directory.
- Kalau tidak: return `permissionDecision: "deny"` → operasi diblokir.
- Trailing `/` di freeze dir prevent `/src` match `/src-old`.

Catatan:
- Apply ke Edit & Write only. Read, Bash, Glob, Grep unaffected.
- **Bukan security boundary** — bash command (`sed`, `awk`) masih bisa modifikasi file di luar.
- Persist via state file di `$GSTACK_STATE_ROOT/freeze-dir.txt`.
- Deactivate: run `/unfreeze` atau akhiri session.

File pendukung: `bin/check-freeze.sh`.

## Contoh / Studi kasus

Haris debug bug auth di MaritimHub. Run `/investigate`, skill identify root cause di `src/auth/session.ts:42`. Phase 1.5 Scope Lock otomatis trigger `/freeze`:
- AskUserQuestion: "Which directory?" → user accept default `src/auth/`.
- State file ditulis: scope path relatif `src/auth/` (resolve dari root project, mis. `maritimhub/src/auth/`).
- Claude propose fix yang touch `src/auth/session.ts` ✓ (allowed).
- Claude juga notice typo di `src/api/orders.ts` dan coba Edit → **BLOCKED** dengan deny message.
- Haris acknowledge: "ya itu di luar scope, jangan dulu". Tetap fokus auth fix.
- Selesai fix + test, Haris run `/unfreeze` (atau end session). State file cleared.
- Typo `orders.ts` masuk TODOS sebagai item terpisah.

## Kesimpulan

`/freeze` adalah scope discipline yang dipaksakan oleh tool, bukan hanya disuruh ke agent. Hard-deny mode bikin sulit untuk "lupa". Cocok untuk debugging fokus, dipakai otomatis oleh `/investigate`. Selalu pasangkan dengan `/unfreeze` untuk release saat task selesai. Untuk kombinasi careful + freeze sekaligus (max safety), pakai `/guard`.
