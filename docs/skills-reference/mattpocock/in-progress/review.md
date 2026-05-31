# Review

> **Sumber:** [`skills/in-progress/review/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/in-progress/review/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** in-progress

**Status:** in-progress — masih eksperimen, struktur dua sub-agent paralel belum stabil di semua kondisi.

## Mengapa skill ini penting

Code review yang dilakukan agent monolitik sering mencampuradukkan dua axis berbeda: "apakah kode mengikuti coding standard?" dan "apakah kode benar-benar mengimplementasi spec yang diminta?". Bila salah satu axis menemukan masalah besar, axis lain bisa terkontaminasi atau diabaikan. Skill ini memaksa keduanya **dijalankan oleh dua sub-agent paralel** sehingga tidak saling polusi konteks, lalu menyajikan dua report side-by-side. Maintainer dapat memutuskan tindakan tanpa salah satu axis menutupi yang lain.

## Kapan menggunakannya

- User minta review branch, PR, work-in-progress changes, atau "review since X".
- Sebelum merge: dua axis dijalankan paralel agar tidak overlap.
- Frontmatter description: "Review the changes since a fixed point ... along two axes — Standards and Spec".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Review perubahan di branch ini terhadap main."
- "Cek apakah PR ini sudah sesuai spec dan coding standard."
- "Review since commit abc123 — dua axis, standards dan spec."
- Kata kunci kanonik (EN): `review branch`, `review since`,
  `Standards and Spec`, `review PR`.

Contoh task lengkap:

> "Review semua perubahan sejak `main` di branch
> `feat/cancel-subscription`. Spec ada di issue #142.
> Standards dari `CLAUDE.md` dan `docs/adr/`. Jalankan
> dua sub-agent paralel, laporkan side-by-side."

Yang terjadi: skill menjalankan dua sub-agent paralel —
satu membaca standar coding dan melaporkan pelanggaran
per file/hunk, satu membaca spec issue dan melaporkan
requirement yang hilang atau scope creep — lalu
mengaggregasi dua report di bawah heading `## Standards`
dan `## Spec` tanpa mencampurnya.

## Cara menggunakannya

1. **Pin the fixed point**: apa pun yang user sebut — commit SHA, branch, tag, `main`, `HEAD~5`. Pass through, jangan opinionated. Bila user tidak sebut, tanya. Capture command: `git diff <fixed-point>...HEAD` (three-dot, comparison terhadap merge-base) + `git log <fixed-point>..HEAD --oneline`.
2. **Identify spec source**: cek issue reference di commit message → fetch via `docs/agents/issue-tracker.md`; path yang dipass user; PRD di `docs/`, `specs/`, atau `.scratch/`. Bila tidak ada, tanya; bila user bilang tidak ada, Spec sub-agent skip dan lapor "no spec available".
3. **Identify standards sources**: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CONTEXT.md`, ADRs, machine config files (eslint, biome, prettier, tsconfig — note tapi jangan re-check apa yang tooling sudah cek), `STYLE.md`/`STANDARDS.md`/`STYLEGUIDE.md`.
4. **Spawn dua sub-agent paralel** (general-purpose):
   - **Standards prompt**: read standards docs + diff; report per file/hunk yang melanggar standar terdokumentasi; cite standard; bedakan hard violation vs judgement call; skip yang tooling enforced; under 400 words.
   - **Spec prompt**: read spec + diff; report (a) requirement spec yang missing/partial, (b) behavior yang tidak diminta (scope creep), (c) requirement yang look implemented tapi salah; quote spec line per finding; under 400 words.
5. **Aggregate**: present dua report di bawah `## Standards` dan `## Spec`, verbatim atau lightly cleaned. **Jangan merge atau rerank** — dua axis sengaja terpisah. End dengan one-liner summary: total findings per axis, worst issue (bila ada).

## Contoh / Studi kasus

PR diff vs `main`. Spec sub-agent baca issue #142 ("Add cancel-at-period-end button") dan menemukan: tombol ada (✓), endpoint backend dibuat (✓), tapi spec minta tombol disabled untuk subscription yang sudah scheduled cancel (✗ missing), dan diff juga menambah email confirmation yang tidak diminta spec (scope creep). Standards sub-agent baca `CLAUDE.md` dan menemukan: dua pelanggaran naming convention (file PascalCase di src/), satu komentar yang mengandung TODO tanpa issue reference. Final report:

```
## Standards
- src/SubscriptionView.tsx: filename should be kebab-case (subscription-view.tsx). Hard.
- src/api/CancelEndpoint.ts: same. Hard.
- src/api/CancelEndpoint.ts:42: TODO without issue reference. Judgement.

## Spec
- Missing: button should be disabled when subscription is already scheduled cancel (#142 line 18).
- Scope creep: email confirmation not requested by #142.

Summary: 3 standards findings, 2 spec findings. Worst: missing disabled state on already-scheduled cancel.
```

## Kesimpulan

Status in-progress: konsep dua-axis kuat, tapi orkestrasi paralel sub-agent dan format aggregator masih iterasi. Bila Anda eksperimen, perlakukan output sebagai draft yang diperiksa manual.
