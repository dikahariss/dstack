# Skill Creator

> **Sumber:** [`skills/skill-creator/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Skill yang dibuat ad hoc biasanya overfit ke 1-2 contoh, atau punya description yang gagal
men-trigger Claude saat dibutuhkan. Skill ini adalah meta-skill: cara membuat skill baru
dengan disiplin **draft → run test prompts → benchmark → iterate**, plus loop
optimisasi description supaya skill trigger akurat (bukan under-trigger atau over-trigger).

Nilai uniknya: pendekatan **eval-driven**. Bukan "tulis skill lalu vibe", tapi tulis
test prompt, spawn dua run (with-skill vs baseline) paralel, grade dengan assertion
objektif, present hasil ke user via HTML viewer untuk review qualitative + quantitative.
Plus script `run_loop.py` untuk auto-optimize description via Claude calling Claude.

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mau buat skill baru dari nol.
- User mau edit/improve skill yang sudah ada.
- User mau run eval atau benchmark skill.
- User mau optimasi description untuk akurasi triggering.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Bantu saya buat skill baru untuk auto-format SQL."
- "Skill saya masih sering tidak ter-trigger, tolong perbaiki."
- "Mau benchmark skill ini — jalankan eval dan lihat hasilnya."
- Kata kunci kanonik (EN): `create a skill`, `edit skill`,
  `run evals`, `benchmark skill`, `optimize description`.

Contoh task lengkap:

> "Saya mau buat skill untuk mengubah schema JSON API jadi
> dokumentasi Markdown otomatis. Input: file `.json` berisi
> OpenAPI spec. Output: `docs/api-reference.md`. Bantu
> saya dari draft sampai eval, termasuk description yang
> akurat agar skill ini ter-trigger dengan benar."

Yang terjadi: Claude menangkap intent, menulis draft
SKILL.md, membuat 2-3 test prompt realistis, spawn run
paralel (with-skill + baseline), draft assertions, lalu
launch eval viewer HTML untuk review kualitatif +
kuantitatif. Setelah iterasi puas, jalankan description
optimization loop otomatis dan update frontmatter.

## Cara menggunakannya

### Loop utama

1. **Decide** — tentukan apa skill ini lakukan dan kira-kira bagaimana.
2. **Draft** — tulis SKILL.md (frontmatter `name`, `description`, plus body markdown).
3. **Test prompts** — bikin 2-3 prompt realistic yang user beneran akan ketik. Save ke
   `evals/evals.json` (prompt dulu, assertion belakangan).
4. **Spawn runs paralel** — dalam satu turn, spawn with-skill + baseline (no-skill kalau
   bikin baru; old-skill kalau improving). Save output ke
   `<skill-name>-workspace/iteration-N/eval-<ID>/{with_skill,without_skill}/outputs/`.
5. **Saat run jalan, draft assertion** — assertion yang objectively verifiable dengan
   nama deskriptif. Subjective skill (style writing, design) dievaluasi qualitatively saja.
6. **Capture timing** — `total_tokens`, `duration_ms` dari notifikasi subagent → save
   ke `timing.json`.
7. **Grade & aggregate** — spawn grader subagent (baca `agents/grader.md`), aggregate via
   `python -m scripts.aggregate_benchmark`. Field grading wajib: `text`, `passed`,
   `evidence` (viewer expect exact names).
8. **Launch viewer** — `nohup python eval-viewer/generate_review.py <workspace>/iteration-N
   --skill-name "..." --benchmark <...>/benchmark.json &`. User review qualitative
   (Outputs tab) + quantitative (Benchmark tab).
9. **Read feedback** — `feedback.json`, focus ke run yang ada complaint spesifik.
10. **Improve & re-run** — apply improvement, iterate-N+1 dengan `--previous-workspace`.

### Improvement principles

- **Generalize from feedback** — skill ini akan dipakai jutaan kali; jangan fix overfit
  per-example. Coba metafora atau pattern berbeda kalau ada isu stubborn.
- **Keep prompt lean** — buang yang tidak pulling weight. Baca transcript, bukan cuma
  output.
- **Explain the why** — hindari ALWAYS/NEVER caps yang rigid; jelaskan kenapa penting.
  LLM punya theory of mind yang baik.
- **Watch repeated work** — kalau semua test case independent bikin helper script yang
  sama, bundle script itu di `scripts/`.

### Anatomy skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── (optional)
    ├── scripts/    — executable code untuk deterministic/repetitive task
    ├── references/ — docs loaded on demand
    └── assets/     — files dipakai di output (template, icon, font)
```

**Progressive disclosure** — metadata always in context (~100 words), SKILL.md body in
context saat trigger (<500 lines ideal), bundled resources on demand.

### Description optimization

Setelah skill di-iterate sampai puas, jalankan loop optimasi description:

1. Generate 20 trigger eval queries (mix should-trigger 8-10 + should-not-trigger 8-10).
   Query harus realistic — paste filename, konteks pribadi, lower-case OK. Negative case
   harus near-miss tricky, bukan obvious irrelevant.
2. Review dengan user via HTML template di `assets/eval_review.html`.
3. Jalankan `python -m scripts.run_loop --eval-set ... --skill-path ... --model ...
   --max-iterations 5`. Split 60% train / 40% test, propose description baru tiap iterasi,
   pilih `best_description` by test score (avoid overfit train).
4. Update SKILL.md frontmatter dengan `best_description`.

### Mode-spesifik

- **Claude.ai (no subagent)**: jalan test case sequentially manual, skip baseline runs,
  show output inline, skip browser reviewer, skip description optimization.
- **Cowork (no browser)**: `--static <output_path>` untuk standalone HTML, feedback
  download as file, plus reminder GENERATE THE EVAL VIEWER *BEFORE* evaluating yourself.

Resource pendukung:

- `agents/grader.md` — evaluasi assertion.
- `agents/comparator.md` — blind A/B comparison antara dua versi.
- `agents/analyzer.md` — analisis kenapa satu versi menang.
- `references/schemas.md` — JSON structure untuk evals/grading/benchmark.
- `scripts/aggregate_benchmark.py`, `scripts/run_loop.py`, `scripts/package_skill.py`.
- `eval-viewer/generate_review.py` — HTML viewer untuk review qualitative + quantitative.
- `assets/eval_review.html` — template untuk review trigger eval queries.

## Contoh / Studi kasus

User: *"Bantu saya bikin skill untuk auto-format SQL query."*

1. **Capture intent** — Claude tanya: apa input (query mentah?), output (formatted SQL?),
   style preference (uppercase keyword? line breaks?), apakah perlu test cases? User
   bilang ya.
2. **Draft SKILL.md** — frontmatter `name: sql-format`, `description` pushy ("formats SQL
   queries... use this whenever the user pastes SQL or asks to format/clean SQL...").
3. **Test prompts** — 3 prompt realistic disimpan di `evals/evals.json`.
4. **Spawn** — Claude spawn 6 subagent paralel (3 with-skill + 3 without-skill).
5. **Draft assertion** — sambil run jalan: `output_has_keywords_uppercase`,
   `output_has_line_breaks`, `no_changed_semantics`.
6. **Grade & aggregate** — pass rate, time, tokens per config. Launch viewer.
7. User review — bilang test case #2 hasilnya kebanyakan line break. Claude improve skill
   (kurangi instruction tentang aggressive newlines), iterate-2. Pass rate naik.
8. **Description optimization** — 20 trigger eval (positif: "format this SQL", "clean
   up this query", "make this readable: SELECT..."; negatif: "explain this SQL", "fix
   this SQL bug"). Run loop 5 iterasi, pilih `best_description`.
9. **Package** — `python -m scripts.package_skill sql-format/` → `.skill` file.

## Kesimpulan

Meta-skill untuk membuat dan meng-iterate skill lain dengan disiplin eval-driven —
test prompts paralel (with-skill + baseline), grader subagent, HTML viewer untuk review
qualitative + quantitative, description optimization loop auto. Diniatkan untuk skill
yang akan dipakai berkali-kali oleh banyak user (bukan one-off prompt). Output: skill
folder lengkap dengan SKILL.md + scripts/references/assets sesuai kebutuhan, plus
description yang sudah dioptimasi untuk akurasi triggering. Cocok untuk skill author
yang serius bikin skill production-grade, bukan vibe coding.
