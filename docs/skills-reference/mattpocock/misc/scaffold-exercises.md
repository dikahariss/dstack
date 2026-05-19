# Scaffold Exercises

> **Sumber:** [`skills/misc/scaffold-exercises/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/misc/scaffold-exercises/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** misc

## Mengapa skill ini penting

AI Hero (kursus internal Matt Pocock) menggunakan struktur direktori yang ketat: section `XX-section-name/` berisi exercise `XX.YY-exercise-name/` yang masing-masing punya satu atau lebih subfolder (`problem/`, `solution/`, `explainer/`). Validator `pnpm ai-hero-cli internal lint` memeriksa banyak rule (readme non-empty, no `.gitkeep`, no `speaker-notes.md`, no broken link, `main.ts` per subfolder kecuali readme-only). Skill ini scaffold struktur tersebut secara otomatis dari plan, lalu memastikan lulus lint sebelum commit.

## Kapan menggunakannya

- User ingin scaffold exercises, create exercise stubs, atau setup section baru di kursus AI Hero.
- Hanya berguna di context repo AI Hero (atau setup serupa).
- Frontmatter description: "Create exercise directory structures with sections, problems, solutions, and explainers that pass linting".

## Cara menggunakannya

1. **Parse the plan**: ekstrak section name, exercise name, variant types.
2. **Create directories**: `mkdir -p` untuk tiap path. Format: `exercises/XX-section-name/XX.YY-exercise-name/{problem,solution,explainer}` sesuai kebutuhan. Default ke `explainer/` bila plan tidak spesifik.
3. **Create stub readmes**: satu `readme.md` per variant folder dengan title minimal.
4. **Run lint**: `pnpm ai-hero-cli internal lint` untuk validasi.
5. **Fix errors**: iterate sampai lint pass.
6. **Commit** dengan `git commit`.

Aturan penting:
- Section name & exercise name **dash-case** (lowercase, hyphens).
- Renumbering: pakai `git mv` (bukan `mv`) untuk preserve history.
- Readme non-empty; minimal `# Exercise Title` + deskripsi.
- Bila subfolder punya code, butuh `main.ts` >1 baris. Untuk stub, readme-only OK.

## Contoh / Studi kasus

Plan:

```
Section 05: Memory Skill Building
- 05.01 Introduction to Memory
- 05.02 Short-term Memory (explainer + problem + solution)
- 05.03 Long-term Memory
```

Skill jalankan:

```bash
mkdir -p exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer
mkdir -p exercises/05-memory-skill-building/05.02-short-term-memory/{explainer,problem,solution}
mkdir -p exercises/05-memory-skill-building/05.03-long-term-memory/explainer
```

Tulis stub readme di tiap variant folder (5 file readme.md). Jalankan `pnpm ai-hero-cli internal lint` → pass. Commit. Renumbering: `git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings` lalu re-lint.

## Kesimpulan

Skill yang sangat domain-spesifik untuk struktur kursus AI Hero. Bila Anda menulis kursus dengan struktur exercise similar, polanya (deterministik scaffolding + lint validation + git mv untuk rename) tetap layak ditiru. Aturan paling load-bearing: **dash-case naming**, **readme non-empty**, dan **`git mv` bukan `mv`**.
