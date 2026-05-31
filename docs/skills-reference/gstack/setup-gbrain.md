# Setup Gbrain

> **Sumber:** [`setup-gbrain/SKILL.md`](https://github.com/garrytan/gstack/blob/main/setup-gbrain/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

GBrain adalah brain semantik gstack: indexing kode + artefak (CEO
plans, designs, retros, learnings) ke vector DB sehingga agent bisa
search by meaning bukan by string match. Tapi setup-nya melibatkan
4 path berbeda (local PGLite, Supabase existing, Supabase
auto-provision, remote MCP), CLI install, MCP registration, per-repo
trust policy, dan secret handling yang harus aman. `/setup-gbrain`
adalah orchestrator zero-to-running: satu command dari "belum ada
apa-apa" sampai "gbrain running, agent ini bisa memanggilnya".

Skill ini juga doctor path: re-jalankan pada Mac yang sudah
configured akan detect existing state, repair hanya yang missing,
dan output GREEN/YELLOW/RED verdict.

## Kapan menggunakannya

Trigger di `description`:

- "setup gbrain", "connect gbrain", "start gbrain"
- "install gbrain", "configure gbrain for this machine"
- Trigger field: `setup gbrain`, `install gbrain`, `connect gbrain`,
  `start gbrain`, `configure gbrain`

Pakai pada Mac baru, atau ketika ingin reconfigure engine (PGLite ↔
Supabase), atau setelah upgrade gstack yang butuh re-register MCP.

Versi: `1.0.0`, `preamble-tier: 2`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Setup gbrain di Mac ini dari nol."
- "Install dan konfigurasi gbrain untuk project ini."
- "Hubungkan gbrain ke Supabase yang sudah ada."
- Kata kunci kanonik (EN): `/setup-gbrain`, `setup gbrain`,
  `install gbrain`, `connect gbrain`, `configure gbrain`.

Contoh task lengkap:

> "Mac baru, belum ada gbrain sama sekali. Jalankan /setup-gbrain
> pilih PGLite local dulu, register MCP ke Claude Code, dan set
> policy read-write untuk repo ~/KODING/maritimhub."

Yang terjadi: skill menjalankan deteksi state, menawarkan pilihan
engine (PGLite/Supabase/Remote MCP) via AskUserQuestion, install
CLI, init brain, register MCP via `claude mcp add gbrain`, set
per-repo trust policy, smoke test round-trip, lalu cetak verdict
GREEN/YELLOW/RED per komponen.

## Cara menggunakannya

Step utama (idempotent):

1. **Concurrent-run lock** — `mkdir ~/.gstack/.setup-gbrain.lock.d`,
   abort jika sudah ada.
2. **Detect existing** — `gstack-gbrain-detect` cek gbrain CLI,
   config, MCP registration, current path, version.
3. **Path selection** AskUserQuestion (jika belum ditentukan):
   - **Path 1** — PGLite local, zero-config.
   - **Path 2a** — Supabase existing project (user paste pooler URL).
   - **Path 2b** — Supabase auto-provision (skill collect PAT
     ephemerally, create project via Supabase API).
   - **Path 3** — Switch engine (PGLite ↔ Supabase).
   - **Path 4** — Remote MCP (server admin lain yang punya brain,
     user hanya consume).
4. **Install CLI** — `gbrain` belum ada → fetch + install. Sub-D5
   reuse jika sudah present.
5. **Init brain** — `gbrain init` dengan target engine. Doctor check.
   D19 PATH shadow check (pastikan `gbrain` resolve ke binary yang
   benar).
6. **MCP registration** — `claude mcp add gbrain` dengan command/URL
   sesuai path. Verify dengan tools/list (Path 4 dengan curl).
7. **Per-repo trust policy** — di dalam git repo, AskUserQuestion
   read-write / read-only / deny / skip. Tulis via
   `gstack-gbrain-repo-policy set`.
8. **Update CLAUDE.md** — append section `## GBrain Configuration`
   dengan engine, last setup date, repo policy. Idempotent (find &
   replace block).
9. **Smoke test**:
   - Path 4: print curl-equivalent untuk dijalankan user setelah
     restart Claude Code.
   - Path 1/2/3: `gbrain put <slug>` + `gbrain search <slug>` round
     trip. STOP NEEDS_CONTEXT jika gagal.
10. **GREEN/YELLOW/RED verdict block** — ringkasan per komponen
    (CLI, Engine, doctor, MCP, Repo policy, Code import, Artifacts
    sync, Transcripts, CLAUDE.md, Smoke test). YELLOW/RED row
    surface one-line next action.

**Secret handling rules**:

- PAT, DB_PASS, pooler URL → env-var only, never argv, never log.
- File yang persist pooler URL hanya `~/.gbrain/config.json` (mode
  0600, ditulis oleh gbrain `init`).
- Telemetry payload pakai enumerated categorical (`scenario`,
  `install_performed`, `mcp_registered`, `trust_tier_set`) — tidak
  ada free-form secrets.
- CI grep test `test/skill-validation.test.ts` enforce ini.

Sub-command:

- `/setup-gbrain --cleanup-orphans` — list project Supabase user,
  konfirmasi per orphan delete (one-way door — never batch).

## Contoh / Studi kasus

Mac baru Haris.

```
/setup-gbrain
```

Detect: tidak ada. Path selection → "1 PGLite local recommended for
solo dev". Install gbrain CLI. Init brain di
`~/.gbrain/db.pglite`. Doctor green. Register MCP via `claude mcp
add gbrain stdio gbrain mcp`. Per-repo policy untuk
`~/KODING/maritimhub`: read-write. Update CLAUDE.md. Smoke test
round-trip pass. Verdict GREEN.

Beberapa minggu kemudian, ingin pindah ke Supabase remote:

```
/setup-gbrain
```

Detect: existing PGLite. AskUserQuestion → "Switch engine to
Supabase?" → Y. Path 3. Collect PAT ephemerally, list user projects,
pilih atau auto-provision. Init brain ke Supabase. Migrate via
`gbrain migrate --from pglite --to supabase`. MCP re-register.
Verdict GREEN.

## Kesimpulan

`/setup-gbrain` adalah onboarding orchestrator gbrain dengan
discipline keamanan yang ketat (secret handling rules, CI grep
enforcement, concurrent-run lock). Idempotent dan re-runnable
sebagai doctor — sehingga user tidak perlu menulis ulang setup atau
ingat path mana yang dipilih dulu.
