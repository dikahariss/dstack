# Panduan Adopsi Skill per Peran

> Kurasi dari ~105 skill di `docs/skills-reference/` (superpowers,
> anthropics, gstack, mattpocock) — dipetakan ke peran kerja nyata:
> Software Engineer & Architect, Data (Architect/Analyst/Engineer),
> Manajer & Leader, serta penulisan akademik (tesis & disertasi).
> Tujuannya: tahu **mana yang wajib** dan **kapan/di mana** memakainya,
> bukan mengadopsi semua sekaligus.

**Legend:** ★ = wajib (pondasi) · sisanya = rekomendasi kuat.
**Repo:** **SP** = superpowers · **AN** = anthropics · **GS** = gstack ·
**MP** = mattpocock.

---

## Tier 0 — WAJIB, lintas SEMUA peran (6 disiplin inti)

Fondasi yang berlaku entah sedang jadi arsitek, data engineer, manajer,
atau menulis disertasi. Semua dari **SP** (portabel, bebas bahasa/stack).

| ★ Skill | Repo | Kapan dipakai |
|---|---|---|
| ★ using-superpowers | SP | Selalu aktif — pastikan skill relevan dipanggil sebelum menjawab |
| ★ brainstorming | SP | Sebelum semua kerja kreatif/keputusan (fitur, arsitektur, bahkan keputusan manajemen/riset) |
| ★ writing-plans | SP | Spec → rencana eksekusi langkah kecil sebelum sentuh kode |
| ★ test-driven-development | SP | Implementasi apa pun — termasuk kode pipeline data |
| ★ systematic-debugging | SP | Bug apa pun — termasuk bug data/pipeline (root cause dulu) |
| ★ verification-before-completion | SP | Sebelum bilang "selesai/lulus" — wajib ada bukti fresh |

---

## Peran 1 — Senior SWE & Software Architect

| Skill | Repo | Kapan/di mana |
|---|---|---|
| ★ zoom-out | MP | Masuk ke area kode asing — peta caller & downstream cepat |
| ★ requesting-code-review / receiving-code-review | SP | Review berdisiplin (minta & menanggapi) |
| improve-codebase-architecture | MP | Temukan refactor & konsolidasi struktural |
| subagent-driven-development / executing-plans | SP | Eksekusi plan besar (paralel vs inline) |
| using-git-worktrees + finishing-a-development-branch | SP | Isolasi workspace & penyelesaian branch |
| cso · health · design-review | GS | Audit security · dashboard kualitas · review visual |
| mcp-builder · claude-api | AN | Kalau produk pakai integrasi/fitur LLM |

---

## Peran 2 — Data Architect / Analyst / Engineer

> **Jujur:** katalog ini **engineering-centric**. Tidak ada skill khusus
> SQL/ETL/warehouse/orchestration. Yang relevan + cara menutup gap:

| Skill | Repo | Kapan/di mana |
|---|---|---|
| ★ xlsx | AN | Modeling, cleaning, analisis berbasis formula (analyst) |
| pdf | AN | Ekstrak tabel/teks/OCR dari dokumen (data extraction) |
| scrape | GS | Ekstraksi data web terstruktur (data collection) |
| web-artifacts-builder | AN | Dashboard/tool data cepat (artifact claude.ai) |
| mcp-builder | AN | Bangun tool akses-data untuk LLM/agent (data platform) |
| investigate / diagnose | GS/MP | Debug pipeline (dipadu systematic-debugging) |

**Penutup gap (leverage tinggi):** pakai **skill-creator (AN)** /
**writing-skills (SP)** untuk **membuat skill data standar tim** sendiri —
mis. `dbt-model-review`, `schema-migration-safety`, `sql-style-guard`.
Ini sekaligus menjawab peran leader (lihat Peran 3).

---

## Peran 3 — Manager & Leader (tim besar, software house + product)

| Skill | Repo | Kapan/di mana |
|---|---|---|
| ★★ skill-creator / writing-skills / skillify | AN/SP/GS | Kodifikasi best-practice tim jadi skill → konsisten & otomatis. Leverage tertinggi |
| ★ internal-comms | AN | 3P updates, newsletter, FAQ untuk tim |
| retro | GS | Retrospective engineering (mingguan/global) |
| to-prd + to-issues | MP | Diskusi → PRD → tiket implementasi |
| office-hours | GS | Validasi ide produk sebelum dibangun |
| plan-ceo-review | GS | Review rencana lensa strategi ("think bigger", perluas scope) |
| doc-coauthoring | AN | Decision doc / RFC / PRD bareng |
| triage · devex-review | MP/GS | Kelola backlog · audit DX produk SDK/CLI |
| Governance: setup-pre-commit · git-guardrails-claude-code · careful/guard/freeze | MP/GS | Pagar pengaman banyak engineer di prod (cegah `push --force`, batasi scope edit) |
| pptx | AN | Deck board/investor |

---

## Peran 4 — Akademik: Tesis & Disertasi

| Skill | Repo | Kapan/di mana |
|---|---|---|
| ★ writing-fragments → writing-shape → writing-beats | MP | Pipeline long-form: ideasi (interview) → bentuk thesis/argumen → narasi beat-by-beat |
| ★ grill-me + grill-with-docs + brainstorming | MP/SP | Stress-test hipotesis/argumen (devil's advocate, uji vs literatur) |
| ★ docx | AN | Output Word: TOC, heading bernomor, tabel, tracked changes (format sesuai template kampus) |
| obsidian-vault | MP | Catatan literatur / PKM riset |
| edit-article | MP | Perketat prosa |
| pdf | AN | Ekstrak dari paper/jurnal, gabung referensi |
| make-pdf | GS | Markdown → PDF rapi (cover, TOC, watermark DRAFT) per bab |
| pptx | AN | Slide sidang/defense |

---

## Lintas-peran (produktivitas, opsional tapi berharga)

- **context-save / context-restore** (GS) + **handoff** (MP) — kontinuitas
  sesi panjang.
- **learn** (GS) — simpan & cari pola/learning (tim & riset).
- **caveman** (MP) — mode hemat token saat sesi panjang.

---

## Catatan penting (baca sebelum adopsi)

1. **Kopling & ketersediaan:**
   - **SP + AN + MP** = portabel, langsung pakai di project Claude Code
     mana pun.
   - **GS** = banyak terikat toolchain gstack (gbrain, gstack-browser,
     pipeline ship/land). Pakai sebagai **pola**, atau perlu setup gstack.
     Yang paling infra-coupled: `setup-gbrain`, `sync-gbrain`, `ship`,
     `land-and-deploy`, `open-gstack-browser`, `pair-agent`,
     `landing-report`, `gstack-upgrade`, `plan-tune`.
2. **Gap nyata (data):** tidak ada skill warehouse/SQL/ETL — tutup dengan
   **membuat skill sendiri** (skill-creator / writing-skills).
3. **Bisa diabaikan untuk profil ini:** `slack-gif-creator`,
   `algorithmic-art`, `canvas-design`, `brand-guidelines`, `theme-factory`
   (kecuali butuh aset desain/branding deck perusahaan).

---

## Starter set (adopsi minggu pertama — jangan semua sekaligus)

6 inti + 1–2 per peran:

- **Inti (6):** using-superpowers, brainstorming, writing-plans, TDD,
  systematic-debugging, verification-before-completion.
- **Arsitek:** + zoom-out, requesting-code-review.
- **Data:** + xlsx, lalu **buat 1 skill data sendiri**.
- **Manajer:** + internal-comms, retro, **skill-creator** (kodifikasi).
- **Tesis:** + writing-fragments→shape→beats, docx, grill-me.
