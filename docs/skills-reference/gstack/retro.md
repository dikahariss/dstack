# Retro

> **Sumber:** [`retro/SKILL.md`](https://github.com/garrytan/gstack/blob/main/retro/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Retrospective sering jadi ritual basa-basi karena data harus
dikumpulkan manual. `/retro` mengotomatiskan itu: analyze commit
history, work patterns, code quality metrics dari git log + session
data + test ratios + plan completion logs `/ship`. Output terstruktur
dengan persistent history dan trend tracking — jadi minggu ini bisa
dibandingkan dengan minggu lalu.

Skill ini juga **team-aware**: per-person breakdown dengan praise +
opportunity for growth yang berbasis actual commits, bukan generic
optimism. Output utama dibuat sebagai shareable personal card
(format ASCII box untuk screenshot ke X/Twitter) + deep dive lengkap
untuk review internal.

Mode global (`/retro global 7d|14d|30d`) cross-project: discover
semua repo yang user kerjakan minggu ini via
`gstack-global-discover`, aggregate per-tool sessions (Claude Code,
Codex, Gemini), context switching metric.

## Kapan menggunakannya

Trigger di `description`:

- "weekly retro", "what did we ship", "engineering retrospective"
- Trigger field: `weekly retro`, `what did we ship`,
  `engineering retrospective`

Proactive: di akhir minggu kerja atau sprint.

Versi: `2.0.0`, `preamble-tier: 2`. Punya `gbrain:` context_queries
yang otomatis load prior retros + recent timeline ketika gbrain
aktif.

## Cara menggunakannya

### Mode repo-scoped (default)

1. Compute time window (default 7d, midnight-aligned).
2. Per-author commits, LOC, type mix (feat/fix/refactor/chore/docs),
   PR sizes, fix-chain detection.
3. Test health: total test files, tests added period ini, regression
   test commits (`test(qa):`, `test(design):`, `test: coverage`).
   Compare ratio dengan prior retro.
4. Plan completion — baca
   `~/.gstack/projects/<slug>/*-reviews.jsonl` cari entry `/ship`
   dengan `plan_items_total > 0`. Compute completion rate.
5. Focus & highlights: focus score, ship of the week (highest-impact
   PR), 3 team wins, 3 things to improve, 3 habits for next week.
6. Per-person breakdown dengan praise + growth area + AI
   collaboration note (% commits dengan Co-Authored-By trailer).
7. Trends vs last retro (jika ada).
8. Save snapshot `~/.gstack/retros/repo-<date>-N.json` untuk
   comparison berikutnya.

### Mode global (`/retro global [window]`)

1. `gstack-global-discover --since <window> --format json` —
   discover semua repo + per-tool sessions.
2. Per repo: `git fetch origin`, ambil commits dengan stats,
   timestamps, shortlog per author, PR numbers.
3. Compute global shipping streak (consecutive days dengan commit ke
   ANY repo, cap 365 jadi "365+").
4. Context switching metric — repos/day average + max.
5. Per-tool productivity patterns (Codex exclusive untuk repo X,
   Claude shared untuk semua).
6. **Shareable Personal Card** ASCII box (LEFT border only, padding
   adapt content) berisi: commits across N projects, LOC added/
   deleted/net, AI coding sessions (CC, Codex, Gemini), shipping
   streak, projects list (full repo names, never truncated), ship of
   the week, top 3 work themes.
7. **Global Engineering Retro** deep dive: all projects overview,
   per-project breakdown dengan "Your contributions" sub-section,
   cross-project patterns, tool usage analysis, 3 cross-project
   insights, 3 habits.
8. Tweetable summary first line: "Week of Mar 14: 5 projects, 138
   commits, 250k LOC across 5 repos | 48 AI sessions | Streak: 52d".
9. Save `~/.gstack/retros/global-<date>-N.json`.

## Contoh / Studi kasus

```
/retro global 7d
```

Output:

```
Week of Mar 14: 5 projects, 138 commits, 250k LOC | 48 AI sessions | Streak: 52d 🔥

╔═══════════════════════════════════════════════════════════════
║  Haris Dwi K. — Week of Mar 14
╠═══════════════════════════════════════════════════════════════
║
║  138 commits across 5 projects
║  +64.0k LOC added · 12.3k LOC deleted · 51.7k net
║  48 AI coding sessions (CC: 31, Codex: 12, Gemini: 5)
║  52-day shipping streak 🔥
║
║  PROJECTS
║  ───────────────────────────────────────
║  maritimhub        62 commits  +28k LOC   team
║  dikahariss-blog   34 commits  +18k LOC   solo
║  gstack             22 commits  +10k LOC   solo
║  ...
║
║  SHIP OF THE WEEK
║  PR #605 — Writer Chat eats the admin bar (2,457 ins, 46 files)
║
║  TOP WORK
║  • Built /retro global cross-project retrospective
║  • Migrated maritimhub dashboard to React Server Components
║  • Shipped email blocking + security hardening
║
║  Powered by gstack
╚═══════════════════════════════════════════════════════════════
```

Plus deep dive di bawahnya.

## Kesimpulan

`/retro` mengubah retrospective dari ritual ke data product. Personal
card siap dibagi (tanpa edit) memotivasi shipping consistency; mode
global memberi gambaran cross-project yang tidak mungkin didapat
single-repo retro. Persistent history mendukung tracking trend long
term tanpa setup pipeline analytics terpisah.
