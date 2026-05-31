# Sync Gbrain

> **Sumber:** [`sync-gbrain/SKILL.md`](https://github.com/garrytan/gstack/blob/main/sync-gbrain/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

`/setup-gbrain` install gbrain sekali per Mac. `/sync-gbrain` adalah
verb canonical "keep this brain up to date": setiap kali user ingin
brain refresh terhadap state repo saat ini, dan refresh agent-side
guidance di CLAUDE.md sehingga coding agent tahu kapan prefer
`gbrain search` di atas Grep.

Skill ini menjalankan **native code surfaces** gbrain v0.20.0+
(`sources add`, `sync --strategy code`, `reindex-code`, `code-def`,
`code-refs`, `code-callers`, `code-callees`). Tidak pakai `gbrain
import` (path itu untuk markdown directory). Tidak menyentuh
`~/.gstack/` indexing (`gstack-gbrain-source-wireup` own itu) — no
double-store.

## Kapan menggunakannya

Trigger di `description`:

- "sync gbrain", "refresh gbrain", "re-index this repo"
- "gbrain search isn't finding things"
- Trigger field: `sync gbrain`, `refresh gbrain`, `reindex repo`,
  `update gbrain`

Pakai setelah perubahan kode bermakna (refactor besar, file baru,
penghapusan modul). Untuk auto-sync, ada `gbrain autopilot --install`
(sekali per machine, daemon handle incremental refresh).

Versi: `1.0.0`, `preamble-tier: 2`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Sync gbrain setelah refactor besar tadi."
- "Gbrain search tidak menemukan modul auth yang baru, re-index dulu."
- "Refresh gbrain untuk repo ini."
- Kata kunci kanonik (EN): `/sync-gbrain`, `sync gbrain`,
  `refresh gbrain`, `reindex repo`, `update gbrain`.

Contoh task lengkap:

> "Baru selesai tambah modul auth di `dikahariss-blog`. Jalankan
> /sync-gbrain supaya `gbrain search 'auth handler'` return hasil
> yang akurat, dan update CLAUDE.md guidance block."

Yang terjadi: skill probe state gbrain, jalankan orchestrator
3-stage (code → memory → brain-sync), cek page_count hasil index,
lakukan capability round-trip write+search, lalu tulis atau hapus
block `## GBrain Search Guidance` di CLAUDE.md sesuai hasil
capability check, diakhiri verdict GREEN/YELLOW/RED.

## Cara menggunakannya

Argument modes (parsed oleh skill, bukan dispatcher):

- `/sync-gbrain` — incremental sync default (mtime fast-path, ~50ms
  steady-state).
- `/sync-gbrain --full` — full code reindex via `gbrain reindex-code`
  (~25-35 min big repo).
- `/sync-gbrain --code-only` — only code stage.
- `/sync-gbrain --dry-run` — preview, no writes.
- `/sync-gbrain --no-memory` / `--no-brain-sync` — skip stages.
- `/sync-gbrain --quiet` — suppress per-stage output.

Step:

1. **State probe** — `gstack-gbrain-detect`. Split-engine model: code
   stage always local PGLite + per-worktree source; artifacts/memory
   route ke konfigurasi setup-gbrain (termasuk Path 4 remote MCP).
   `gbrain_on_path=false` atau `gbrain_config_exists=false` → STOP
   "Run /setup-gbrain first". Per-repo policy `deny` → STOP.
2. **Run orchestrator** — `bun run ~/.claude/skills/gstack/bin/
   gstack-gbrain-sync.ts <user-args>`. 3 stage: code → memory →
   brain-sync. Tiap stage failure non-fatal; subsequent stages
   tetap jalan. State persist ke `~/.gstack/.gbrain-sync-state.json`
   atomic. Concurrent runs blocked by `~/.gstack/.sync-gbrain.lock`
   (5-min stale-takeover).
3. **Code-index health check** — query page_count source. Jika 0 dan
   user tidak pass `--no-code` dan mode bukan `--full`,
   AskUserQuestion D1: "0 indexed pages. Run /sync-gbrain --full
   now?" → A re-invoke orchestrator dengan `--full --code-only` / B
   skip.
4. **Refresh `## GBrain Search Guidance` block** di CLAUDE.md.
   Capability check: write+search round-trip dengan SLUG ephemeral.
   `CAPABILITY_OK=1` → tulis/update block (idempotent, find by
   HTML-comment markers `gstack-gbrain-search-guidance:start/end`).
   `CAPABILITY_OK=0` → REMOVE block (agent jangan disuruh pakai tool
   yang tidak ada). Atomic write via tmp file + mv.
5. **Verdict block** GREEN/YELLOW/RED — rows: CLI, Engine,
   Capability, CWD source (page_count), `~/.gstack` source, Memory
   sync, CLAUDE.md, Last sync. YELLOW/RED row surface one-line next
   action.

**Cross-machine note**: Block CLAUDE.md committed dan travels via
git push. Di mesin lain tanpa local gbrain, /sync-gbrain detect
mismatch via capability check → REMOVE block.

## Contoh / Studi kasus

Haris menambahkan modul auth baru ke `dikahariss-blog`.

```
/sync-gbrain
```

State probe: gbrain configured, repo policy read-write.

Orchestrator jalan: code stage detect 47 file modified, incremental
sync 12 detik. Memory stage skip (no new artifacts). Brain-sync
stage push 3 baru ke artifacts repo.

Health check: page_count 1247 (naik dari 1200). OK.

Capability OK. CLAUDE.md block update (timestamp baru).

Verdict GREEN.

Sehari kemudian Haris baru sadar `gbrain search "auth handler"`
tidak return hit. Ia jalankan `/sync-gbrain --full`. Full reindex 28
menit. Setelah selesai, search return 6 hit relevan.

## Kesimpulan

`/sync-gbrain` adalah verb canonical maintenance gbrain. Idempotent,
safe untuk re-run, dan auto-update CLAUDE.md guidance sesuai
kapabilitas aktual. Bersama `/setup-gbrain` (install) dan
`gstack-brain-sync` (daemon background), ia menjaga semantic search
tetap akurat tanpa user harus ingat schedule rebuild manual.
