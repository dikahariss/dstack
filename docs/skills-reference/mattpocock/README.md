# mattpocock-skills — Referensi Bahasa Indonesia

Dokumentasi referensi untuk 28 skill di repo
[`mattpocock-skills`](https://github.com/mattpocock/mattpocock-skills),
sebuah catalog skill Claude Code yang menggabungkan pola engineering
(diagnose / TDD / triage / improve-codebase-architecture), workflow
penulisan eksperimental (fragments → shape/beats), dan setup utility
(pre-commit, git guardrails). Struktur bucket di sini mengikuti
struktur sumber: `deprecated/`, `engineering/`, `in-progress/`,
`misc/`, `personal/`, `productivity/`.

Sumber utama: [`mattpocock/skills` (folder `skills/`)](https://github.com/mattpocock/skills/tree/main/skills) di GitHub. Tiap halaman di folder ini punya link langsung ke `SKILL.md` aslinya pada baris **Sumber** di header.

## Bagaimana membaca dokumen ini

Tiap file membahas satu skill dengan struktur seragam: mengapa skill
penting, kapan dipakai, cara dipakai, contoh konkret, kesimpulan.
Path sumber SKILL.md asli dicantumkan di header tiap file agar mudah
dilacak balik. Penjelasan ditulis dalam Bahasa Indonesia teknis-netral.

## Daftar skill per bucket

### deprecated/ (4 skill)

Skill yang ditandai usang. Fungsinya umumnya tergantikan oleh skill di
bucket `engineering/`, tetapi pola dan template di dalamnya tetap kuat
sebagai referensi.

- [design-an-interface](deprecated/design-an-interface.md) — Generate
  beberapa desain interface radikal berbeda via paralel sub-agent
  ("Design It Twice"); fungsinya diserap `improve-codebase-architecture`.
- [qa](deprecated/qa.md) — Sesi QA interaktif yang langsung file GitHub
  issue durable; tergantikan oleh kombinasi `triage` + `to-issues`.
- [request-refactor-plan](deprecated/request-refactor-plan.md) —
  Interview user untuk membuat refactor plan tiny commits dan publish
  sebagai issue; tergantikan oleh `improve-codebase-architecture` +
  `to-prd`/`to-issues`.
- [ubiquitous-language](deprecated/ubiquitous-language.md) — Ekstrak
  glossarium domain DDD dari percakapan ke `UBIQUITOUS_LANGUAGE.md`;
  tergantikan oleh `grill-with-docs` yang melakukan update inline.

### engineering/ (10 skill)

Inti catalog: workflow engineering disiplin yang saling melengkapi.
Banyak skill di bucket ini menganggap `setup-matt-pocock-skills` sudah
dijalankan agar issue tracker, label vocabulary, dan domain docs
terkonfigurasi.

- [diagnose](engineering/diagnose.md) — Disiplin enam-fase diagnosis bug
  sulit dan regresi performance; bangun feedback loop dulu, sisanya
  mekanis.
- [grill-with-docs](engineering/grill-with-docs.md) — Sesi grilling
  plan yang sekaligus mengupdate `CONTEXT.md` dan menawarkan ADR
  inline.
- [improve-codebase-architecture](engineering/improve-codebase-architecture.md)
  — Cari deepening opportunity (modul shallow → deep) demi testability
  dan AI-navigability.
- [prototype](engineering/prototype.md) — Bangun throwaway prototype
  untuk menjawab satu pertanyaan; pilih branch logic atau UI.
- [setup-matt-pocock-skills](engineering/setup-matt-pocock-skills.md) —
  Scaffolding sekali pakai yang mengisi blok `## Agent skills` di
  CLAUDE.md/AGENTS.md + `docs/agents/*.md`.
- [tdd](engineering/tdd.md) — Test-driven development dengan vertical
  slices (tracer bullets), bukan horizontal slicing.
- [to-issues](engineering/to-issues.md) — Pecah plan/PRD menjadi
  vertical-slice issue yang grabbable (HITL/AFK).
- [to-prd](engineering/to-prd.md) — Kondensasi konteks percakapan jadi
  PRD ready-for-agent tanpa interview ulang.
- [triage](engineering/triage.md) — State machine issue (bug/enhancement
  × needs-triage/needs-info/ready-for-agent/ready-for-human/wontfix)
  dengan disclaimer AI di tiap komentar.
- [zoom-out](engineering/zoom-out.md) — Naik satu lapisan abstraksi;
  hasilkan map modul + caller pakai glossarium domain.

### in-progress/ (4 skill)

Skill yang masih eksperimen — struktur belum stabil. Pakai dengan
verifikasi manual.

- [review](in-progress/review.md) — Review diff dengan dua axis paralel
  (Standards + Spec) lewat sub-agent terpisah.
- [writing-beats](in-progress/writing-beats.md) — Rakit artikel sebagai
  journey of beats, choose-your-own-adventure style.
- [writing-fragments](in-progress/writing-fragments.md) — Tambang
  fragmen tanpa struktur ke satu markdown file, hulu pipeline penulisan.
- [writing-shape](in-progress/writing-shape.md) — Hilir
  `writing-fragments`: bentuk pile jadi artikel argumentatif via
  shaping conversational.

### misc/ (4 skill)

Setup utility dan migrasi spesifik.

- [git-guardrails-claude-code](misc/git-guardrails-claude-code.md) —
  Pasang PreToolUse hook untuk blokir command git destruktif sebelum
  dieksekusi Claude.
- [migrate-to-shoehorn](misc/migrate-to-shoehorn.md) — Migrasi test
  file dari `as` assertion ke `@total-typescript/shoehorn`
  (`fromPartial` / `fromAny` / `fromExact`).
- [scaffold-exercises](misc/scaffold-exercises.md) — Scaffold struktur
  direktori exercise untuk kursus AI Hero, lulus
  `pnpm ai-hero-cli internal lint`.
- [setup-pre-commit](misc/setup-pre-commit.md) — Setup Husky +
  lint-staged + Prettier + typecheck + test di pre-commit hook.

### personal/ (2 skill)

Skill personal Matt Pocock — preferensi style/setup pribadi yang
dijadikan workflow. Anggap sebagai contoh, bukan portable utility.

- [edit-article](personal/edit-article.md) — Edit artikel dengan
  section dependency-aware (DAG) dan paragraph ≤240 karakter.
- [obsidian-vault](personal/obsidian-vault.md) — Manage Obsidian vault
  hard-coded di `/mnt/d/Obsidian Vault/AI Research/` dengan flat
  structure + wikilinks + index notes.

### productivity/ (4 skill)

Skill produktivitas umum yang mengubah register komunikasi atau
membantu mengelola sesi.

- [caveman](productivity/caveman.md) — Mode komunikasi
  ultra-compressed, ~75% token reduction, persistent sampai user
  matikan.
- [grill-me](productivity/grill-me.md) — Versi minimal pattern
  grilling: satu pertanyaan per turn, selalu kasih rekomendasi,
  eksplor kode dulu.
- [handoff](productivity/handoff.md) — Compact percakapan jadi handoff
  document via `mktemp`; jangan duplikasi artifact lain.
- [write-a-skill](productivity/write-a-skill.md) — Template + checklist
  untuk menulis skill baru (struktur folder, description requirement,
  kapan add scripts, kapan split files).

## Total

28 skill, dibagi: 4 deprecated, 10 engineering, 4 in-progress, 4 misc,
2 personal, 4 productivity.
