# Pair Agent

> **Sumber:** [`pair-agent/SKILL.md`](https://github.com/garrytan/gstack/blob/main/pair-agent/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Multi-agent workflow makin umum: Claude Code menulis kode, OpenClaw
research, Codex review. Tapi setiap agent biasanya punya browser
sendiri-sendiri — dan session login, cookie, atau state browser tidak
share. `/pair-agent` menyelesaikan itu dengan membagi GStack Browser
yang sudah dilaunch user ke agent lain via setup key sekali pakai.
Setiap agent dapat tab sendiri dengan scope read+write (atau admin
dengan flag eksplisit) dan tidak bisa mengganggu tab agent lain.

Setup key kedaluwarsa dalam 5 menit dan hanya bisa dipakai sekali —
jika bocor, ia sudah mati sebelum disalahgunakan. Session token aktif
24 jam. Untuk machine yang sama, skill bisa skip copy-paste ceremony
dengan menulis credentials langsung ke config directory agent target.

## Kapan menggunakannya

Trigger di `description`:

- "pair agent", "connect agent", "share browser"
- "remote browser", "let another agent use my browser"
- "give browser access"
- Voice: "pair agent", "connect agent", "share my browser",
  "remote browser access"

Trigger di `triggers`: `pair with agent`, `connect remote agent`,
`share my browser`.

Pakai ketika user butuh OpenClaw, Hermes, Codex, atau Cursor untuk
mengoperasikan browser yang sama (misalnya: agent B harus melanjutkan
QA di tab tertentu setelah agent A login).

## Cara menggunakannya

1. **Step 1** — `$B status` cek browse server, atau `$B goto about:blank`
   untuk start-up.
2. **Step 2** — AskUserQuestion pilih target host: OpenClaw, Codex,
   Cursor, Claude Code lain, atau generic (Hermes).
3. **Step 3** — pilih local (same machine) vs remote (different
   machine). Local: skip copy-paste, tulis langsung ke
   `~/.openclaw/skills/gstack/browse-remote.json` (atau equivalent).
   Remote: butuh ngrok tunnel.
4. **Step 4 eksekusi**:
   - Local: `$B pair-agent --local <host>`.
   - Remote dengan ngrok ready: `$B pair-agent --client <host>`
     (tambahkan `--admin` jika perlu JS execution, cookies, storage).
   - Skill memvalidasi ngrok installation + auth status; jika belum,
     panduin user install via `brew install ngrok` + `ngrok config
     add-authtoken`.
5. **Skill WAJIB print full instruction block** (antara garis ═══) ke
   user agar bisa di-copy ke agent lain. Tidak boleh diringkas.
6. **Step 5 verify** — `$B status` cek agent baru sudah connected.

Scope default (read+write): navigate, click, fill, screenshot, snapshot,
read content, create tabs. Scope admin (`--admin`): tambah JS execution,
cookie access, storage access — pakai hanya untuk agent yang fully
trusted.

Revoke akses: `$B tunnel revoke <agent>` atau `$B tunnel rotate` (kill
semua scoped token).

## Contoh / Studi kasus

Haris sedang debugging staging dengan Claude Code (headed browser
sudah running). Ia ingin OpenClaw membantu jalankan smoke test di tab
terpisah.

```
/pair-agent
```

Skill: tanya target → OpenClaw. Lokasi → same machine. Eksekusi
`$B pair-agent --local openclaw`. Credentials ditulis ke
`~/.openclaw/skills/gstack/browse-remote.json`. Haris pindah ke
OpenClaw, ketik "navigate to staging dashboard". OpenClaw otomatis
membaca credentials, membuka tab baru di browser yang sama, eksekusi
navigasi. Tab Claude Code tidak terganggu.

## Kesimpulan

`/pair-agent` adalah primitif kolaborasi multi-agent gstack. Ia
memberi user kontrol granular (scope, masa berlaku, host tujuan)
tanpa harus berbagi cookie real browser. Cocok untuk workflow "agent
A login → agent B testing → agent C reporting" yang makin sering
muncul saat orchestrator seperti OpenClaw matang.
