# Git Guardrails for Claude Code

> **Sumber:** [`skills/misc/git-guardrails-claude-code/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/misc/git-guardrails-claude-code/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** misc

## Mengapa skill ini penting

Claude Code dapat menjalankan command shell, dan beberapa command git bersifat destruktif (`push --force`, `reset --hard`, `clean -fd`, `branch -D`, `checkout .`, `restore .`). Kesalahan satu kali dapat menghilangkan jam-jam pekerjaan. Skill ini scaffolding sekali pakai yang memasang **PreToolUse hook** sehingga Claude diblokir sebelum mengeksekusi command tersebut. Bila Claude mencoba, hook keluar dengan exit code 2 dan menampilkan pesan ke stderr menjelaskan bahwa Claude tidak punya authority.

## Kapan menggunakannya

- User ingin mencegah Claude menjalankan operasi git destruktif.
- Setelah accident "tertimpa" git push --force atau reset --hard.
- Frontmatter description: "Set up Claude Code hooks to block dangerous git commands ... before they execute".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Pasang hook biar Claude tidak bisa git push --force."
- "Blokir perintah git berbahaya di Claude Code."
- "Setup guardrails supaya Claude tidak bisa reset --hard."
- Kata kunci kanonik (EN): `block dangerous git`, `git push`,
  `PreToolUse hook`, `git safety`.

Contoh task lengkap:

> "Setup git guardrails di project ini — scope project saja,
> bukan global. Blokir `git push`, `git reset --hard`, dan
> `git clean -fd`. Verifikasi dengan smoke test setelah
> terpasang."

Yang terjadi: skill menyalin script hook ke
`.claude/hooks/block-dangerous-git.sh`, menambah konfigurasi
`PreToolUse` ke `.claude/settings.json`, lalu menjalankan
smoke test untuk memastikan command yang diblokir keluar
dengan exit code 2 dan pesan BLOCKED ke stderr.

## Cara menggunakannya

1. **Ask scope**: install untuk project saja (`.claude/settings.json`) atau semua project (`~/.claude/settings.json`)?
2. **Copy hook script** dari `scripts/block-dangerous-git.sh` di skill folder ke:
   - Project: `.claude/hooks/block-dangerous-git.sh`
   - Global: `~/.claude/hooks/block-dangerous-git.sh`

   Make executable: `chmod +x`.
3. **Add hook ke settings** (project atau global). Konfigurasi `PreToolUse` matcher `Bash` dengan command path absolut ke hook. Bila settings file sudah ada, merge ke `hooks.PreToolUse` array — jangan timpa setting lain.
4. **Ask customization**: apakah user ingin tambah/hapus pattern dari blocked list. Edit hook sesuai.
5. **Verify**: jalankan smoke test:

   ```bash
   echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>
   ```

   Harus exit code 2 + pesan BLOCKED ke stderr.

## Contoh / Studi kasus

Tim setuju Claude tidak boleh push langsung ke remote. Install scope = global. Skill copy hook ke `~/.claude/hooks/block-dangerous-git.sh` dan tambah konfigurasi ke `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/block-dangerous-git.sh" }
        ]
      }
    ]
  }
}
```

User custom: tambah blocking untuk `git rebase --abort` (mereka pernah accident kehilangan WIP). Edit hook menambahkan pattern. Verify dengan `echo '{"tool_input":{"command":"git push origin main"}}' | ~/.claude/hooks/block-dangerous-git.sh` → exit code 2 + pesan "BLOCKED: git push is not permitted". Setelah itu Claude di sesi mana pun tidak bisa eksekusi command tersebut tanpa intervensi manual.

## Kesimpulan

Skill sangat fokus dan deterministik. Pasangkan dengan disiplin user untuk explicit override (jalankan command manual di terminal sendiri). Bila Anda jalan di banyak repo, scope global lebih aman; bila eksperimen per-project, scope project memberi fleksibilitas.
