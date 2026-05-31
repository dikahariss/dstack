# Learn — Project Learnings Manager

> **Sumber:** [`learn/SKILL.md`](https://github.com/garrytan/gstack/blob/main/learn/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Skill gstack lain (`/investigate`, `/cso`, `/design-review`, dll) menulis "learnings" — observasi durable yang akan menghemat 5+ menit di session berikutnya. Tapi tanpa cara untuk melihat, mencari, dan membersihkan learnings ini, mereka jadi noise: stale, kontradiktif, atau tertimbun di file JSONL panjang. `/learn` adalah staff engineer yang maintain team wiki — show recent, search, prune, export, dan stats.

**HARD GATE**: skill ini tidak implement code changes. Hanya manage learnings.

## Kapan menggunakannya

- Awal session: `/learn` (no args) untuk lihat recent learnings yang mungkin relevant.
- Saat onboard baru ke project: `/learn export` untuk shareable summary.
- Saat learnings sudah banyak dan ada kontradiksi: `/learn prune` untuk cleanup.
- Untuk search insight spesifik: `/learn search <query>`.
- Stats: `/learn stats` untuk lihat distribusi (per skill, per type).
- Manual add: `/learn add` (jarang dipakai — biasanya skill lain auto-write).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Tampilkan learnings terbaru project ini."
- "Cari pattern yang pernah kita temukan soal rate limiting."
- "Bersihkan learnings yang file referensinya sudah dihapus."
- Kata kunci kanonik (EN): `/learn`, `show learnings`,
  `what have we learned`, `prune stale learnings`.

Contoh task lengkap:

> "/learn search rate-limit — aku mau tahu apakah ada insight
> dari session sebelumnya tentang implementasi rate limiting
> di project maritimhub sebelum mulai kode baru."

Yang terjadi: skill memanggil `gstack-learnings-search` dengan
query yang diberikan, menampilkan hasil match (key, insight,
confidence, age, source) dalam format tabel. Kalau ada entry
yang relevan dari `/investigate` atau `/review` sebelumnya,
ditampilkan dengan label "Prior learning applied". Read-only
kecuali untuk `prune` dan `add`.

## Cara menggunakannya

1. **Detect command** — parse user input:
   - `/learn` (no args) → **Show recent** (default)
   - `/learn search <query>` → **Search**
   - `/learn prune` → **Prune**
   - `/learn export` → **Export**
   - `/learn stats` → **Stats**
   - `/learn add` → **Manual add**
2. **Show recent (default)** — tampilkan N learnings terbaru dengan tabel: skill, type, key, confidence, age. Per default 10-15 entry.
3. **Search** — pakai `bin/gstack-learnings-search --query <q>`. Bisa cross-project (kalau `cross_project_learnings: true`) atau project-scoped. Match key, insight text, files.
4. **Prune** — identifikasi entry stale:
   - File references tidak ada lagi (file deleted).
   - Kontradiksi (2 entry key sama, insight berbeda).
   - Confidence rendah + age tua.
   - User confirm per-entry sebelum delete.
5. **Export** — produce markdown shareable dengan grouping per type / per skill. Cocok di-paste ke wiki atau CONTRIBUTING.md.
6. **Stats** — distribusi: count per `type` (pattern/pitfall/preference/architecture/tool/operational/investigation), per `source` (observed/user-stated/inferred/cross-model), per `skill`, average confidence.
7. **Project Learnings** location: `${GSTACK_HOME:-~/.gstack}/projects/${SLUG}/learnings.jsonl`.
8. **Manual add** — AskUserQuestion untuk type, key, insight, confidence, source. Append ke JSONL.

Schema entry:
```json
{
  "skill": "investigate",
  "type": "investigation",
  "key": "session-rotation-race",
  "insight": "Session rotation can race with concurrent validation; need mutex per user-id",
  "confidence": 9,
  "source": "observed",
  "files": ["src/auth/middleware.ts", "src/auth/session-store.ts"],
  "timestamp": "2026-05-15T14:32:00Z",
  "ts_added": 1715783520
}
```

Types:
- `pattern` — reusable approach
- `pitfall` — what NOT to do
- `preference` — user stated
- `architecture` — structural decision
- `tool` — library/framework insight
- `operational` — project quirk / CLI / workflow
- `investigation` — root cause finding

Sources: `observed`, `user-stated`, `inferred`, `cross-model`.

## Contoh / Studi kasus

Haris pertama kali kembali ke MaritimHub setelah 2 minggu cuti:
- Run `/learn` → 12 recent entries. Tiga relevan:
  - `[investigation] session-rotation-race` (confidence 9, 3 minggu lalu) — explain bug auth yang baru-baru ini fix.
  - `[operational] postgres-vacuum-window` (confidence 8) — VACUUM FULL harus weekend, lock table 4+ jam.
  - `[architecture] no-redis-rate-limit` (confidence 10, user-stated) — rate limit pakai in-memory + sticky session, bukan Redis (cost reason).
- Refresh memory, lalu lanjut kerjaan.

Beberapa minggu kemudian, file `src/auth/session-store.ts` di-refactor heavily. Run `/learn prune`:
- Skill detect entry `session-rotation-race` reference 2 file, 1 sudah hilang.
- AskUserQuestion: "Entry stale (file refactored). Keep / Update / Delete?"
- Haris pilih Update, baca insight ulang, confirm masih valid → update file paths.

Untuk handoff ke developer baru: `/learn export` → markdown dengan section per type, paste ke `docs/PROJECT-LEARNINGS.md`.

## Kesimpulan

`/learn` adalah hygiene tool untuk knowledge compound gstack. Tanpa prune dan visibility, learnings hanya numpuk dan akhirnya tidak dipakai. Search dan stats memunculkan pola: "skill X paling banyak generate `pitfall` entry — mungkin perlu refactor area itu". Read-only kecuali prune dan manual add. Pakai sebagai awal-session check (lihat recent) dan weekly maintenance (search, prune). Cross-project mode bantu apply insight dari project lain ke project sekarang — tapi opt-in karena kadang cross-contamination tidak diinginkan.
