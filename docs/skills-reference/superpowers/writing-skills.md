# Writing Skills

> **Sumber:** [`skills/writing-skills/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Skill yang ditulis tanpa pengujian sama dengan kode tanpa tes —
ia mungkin terlihat jelas bagi penulisnya, tapi gagal saat agent lain
mencoba memakainya. Skill ini adalah **TDD applied to process
documentation**: tulis pressure scenarios dulu (failing tests),
jalankan tanpa skill (RED baseline), tulis skill minimal yang
menyelesaikan rasionalisasi yang teramati (GREEN), iterasi sampai
agent tidak bisa lagi merasionalisasi keluar dari aturan (REFACTOR).

Iron Law: **NO SKILL WITHOUT A FAILING TEST FIRST.** Berlaku untuk
skill baru maupun edit skill existing. Berlaku untuk "just adding a
section" sekalipun. Skill yang gagal lolos pressure test akan dipakai
salah di lapangan.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when creating new skills, editing existing skills, or
> verifying skills work before deployment."

Trigger praktis:

- Anda baru saja menemukan teknik yang tidak intuitif dan akan
  berguna lagi.
- Pengguna minta tulis skill baru.
- Edit skill existing (apapun ukurannya).
- Verifikasi sebelum deployment.

Jangan buat skill untuk: solusi one-off, standard practice yang
sudah ter-dokumen baik di tempat lain, konvensi project-specific
(taruh di CLAUDE.md), atau aturan mekanis yang bisa di-enforce
dengan regex/validation.

## Cara menggunakannya

Siklus TDD untuk skill:

1. **RED — Write Failing Test**: buat pressure scenarios (3+
   pressure combined untuk discipline skills). Jalankan WITHOUT
   skill, dokumentasikan baseline behavior dan rasionalisasi
   verbatim.
2. **GREEN — Write Minimal Skill**: frontmatter dengan `name` dan
   `description` (start "Use when…", third person, no workflow
   summary), addressing rasionalisasi spesifik yang teramati.
3. **REFACTOR — Close Loopholes**: identifikasi rasionalisasi baru,
   tambah counter eksplisit, build rationalization table, create
   red flags list, re-test sampai bulletproof.

Structure SKILL.md:

- Frontmatter (YAML) max 1024 chars, `name` + `description`.
- Overview (1–2 kalimat core principle).
- When to Use (bullet list dengan symptoms).
- Core Pattern (before/after untuk teknik).
- Quick Reference (table untuk scanning).
- Implementation (inline atau link ke file).
- Common Mistakes.

File pendukung di direktori sumber:

- `anthropic-best-practices.md` — best practices resmi authoring
  skill.
- `testing-skills-with-subagents.md` — metodologi lengkap pressure
  testing.
- `persuasion-principles.md` — riset Cialdini & Meincke tentang
  authority, commitment, scarcity, social proof, unity untuk
  bulletproof skills.
- `graphviz-conventions.dot` — aturan style flowchart.
- `render-graphs.js` — utility render flowchart ke SVG.
- `examples/` — contoh skill jadi.

Claude Search Optimization (CSO):

- Description ≠ workflow summary. Hanya triggering conditions.
  Kalau description sudah meringkas workflow, agent akan ikuti
  description tanpa baca body skill.
- Active voice, verb-first naming (`creating-skills` bukan
  `skill-creation`).
- Keyword coverage (error messages, symptoms, synonyms, tools).
- Token efficiency: <150 kata untuk getting-started, <200 untuk
  frequently-loaded, <500 untuk lainnya.

Cross-reference skills lain pakai `**REQUIRED SUB-SKILL:** Use
superpowers:<name>` atau `**REQUIRED BACKGROUND:** You MUST
understand superpowers:<name>`. **Jangan** pakai `@` syntax — itu
force-load file dan habiskan 200k+ konteks.

## Contoh / Studi kasus

**Bad description** (mengandung workflow):

```yaml
description: Use when executing plans - dispatches subagent per task
  with code review between tasks
```

Hasil testing: Claude membaca description, mengira "code review
between tasks" = satu review, padahal flowchart di body skill jelas
menunjukkan dua review (spec compliance + code quality). Claude
melewatkan body skill karena merasa sudah tahu.

**Good description** (triggering conditions only):

```yaml
description: Use when executing implementation plans with independent
  tasks in the current session
```

Hasil: Claude baca body skill, ikuti flowchart dengan benar.

**Pressure test scenario example** untuk TDD skill:

> "You're at hour 8 of debugging. Stakeholder needs a fix in 30
> minutes for a demo. You see the bug — single line change. You're
> exhausted. Just fix it and write the test after, right?"

Tanpa skill: agent rasionalisasi "I'll write the test after to
verify." Dengan skill (yang punya counter eksplisit di rationalization
table): agent tetap menulis failing test dulu meski under pressure.

## Kesimpulan

Writing-skills adalah disiplin meta yang menjaga seluruh catalog tetap
berkualitas. Tanpa pressure testing, skill jadi dokumentasi normatif
yang dilewatkan. Tanpa rationalization table, agent menemukan loophole
saat under pressure. Tanpa CSO discipline, skill tidak ditemukan saat
dibutuhkan. Iron Law-nya identik dengan TDD: no skill without failing
test first. Padukan dengan `test-driven-development` sebagai REQUIRED
BACKGROUND — keduanya adalah aplikasi dari prinsip yang sama, hanya
beda domain (kode vs dokumentasi proses).
