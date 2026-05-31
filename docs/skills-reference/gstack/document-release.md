# Document Release — Post-Ship Documentation Update

> **Sumber:** [`document-release/SKILL.md`](https://github.com/garrytan/gstack/blob/main/document-release/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Setelah ship code, dokumentasi tertinggal: README masih sebut versi lama, CHANGELOG belum di-polish, CLAUDE.md sebut perintah yang sudah berubah, TODOS.md punya item yang sebenarnya sudah selesai. Manual update semua doc files = tedious dan rawan miss. `/document-release` adalah pass otomatis post-ship: read tiap `.md` file, cross-reference dengan diff branch, update fakta sederhana langsung, stop hanya untuk keputusan risky atau subjektif.

Kuncinya **NEVER clobber CHANGELOG**: ada precedent agent yang replace existing entries (yang ditulis `/ship` dari diff + commit history) saat seharusnya preserve. Skill ini ketat: hanya polish wording dalam existing entry, never delete/reorder/regenerate. Tool wajib `Edit` dengan exact `old_string` matches — never `Write` ke CHANGELOG.md.

## Kapan menggunakannya

- Setelah `/ship` (code committed, PR ada atau akan ada) tapi **sebelum** PR merge.
- Tidak untuk dokumentasi awal — pakai writer/editor manual.
- Tidak untuk update CHANGELOG entry awal — itu `/ship` yang handle dari diff.
- Voice trigger: "update docs", "document release", "doc audit pre-merge".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Update docs setelah ship fitur rate limiting ini."
- "Sync dokumentasi — README, CLAUDE.md, CHANGELOG sudah ketinggalan."
- "Document release sebelum PR merge."
- Kata kunci kanonik (EN): `/document-release`, `update docs after ship`,
  `post-ship docs`, `sync documentation`.

Contoh task lengkap:

> "Jalankan /document-release setelah /ship untuk fitur API rate
> limiting di MaritimHub. Branch: feat/rate-limit. Diff menambah
> `src/middleware/rate-limit.ts`, env var `RATE_LIMIT_MAX_REQUESTS`,
> dan satu test baru. Update README features, CLAUDE.md env table,
> ARCHITECTURE middleware section, polish CHANGELOG voice, dan
> tandai TODOS item 'Add rate limiting' sebagai completed."

Yang terjadi: skill membaca diff branch, mengaudit setiap file .md,
langsung mengedit fakta sederhana (path, count, env var) tanpa tanya,
polish wording CHANGELOG entry tanpa replace isinya, menandai TODOS
selesai, dan membuat satu commit docs dengan summary per file.

## Cara menggunakannya

1. **Step 1: Pre-flight & Diff Analysis** — abort kalau on base branch. Gather `git diff <base>...HEAD --stat`, `git log <base>..HEAD --oneline`, file changes. Discover doc files: `find . -maxdepth 2 -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.gstack/*" -not -path "./.context/*"`. Classify changes (new features / changed behavior / removed / infrastructure).
2. **Step 2: Per-File Documentation Audit** — pakai generic heuristics adaptif (bukan gstack-specific):
   - **README.md** — describe semua fitur dari diff? install instructions konsisten? examples valid? troubleshooting akurat?
   - **ARCHITECTURE.md** — ASCII diagrams match code? Be conservative — hanya update kalau clearly contradicted by diff.
   - **CONTRIBUTING.md** — new contributor smoke test: walk setup as if first-time, would each step succeed?
   - **CLAUDE.md / project instructions** — project structure match file tree? listed commands match package.json?
   - **Other .md** — read, determine purpose, cross-reference diff.
   Classify update sebagai:
   - **Auto-update** — factual correction clear dari diff (path, count, version).
   - **Ask user** — narrative changes, section removal, security model, large rewrites (>10 lines).
3. **Step 3: Apply Auto-Updates** — Edit tool langsung. Output one-line summary per file change. Never auto-update: README intro, ARCHITECTURE philosophy, security model descriptions, atau remove entire section.
4. **Step 4: Ask About Risky/Questionable** — AskUserQuestion per risky change dengan recommendation + Skip option.
5. **Step 5: CHANGELOG Voice Polish** — kritis:
   - Read entire CHANGELOG first.
   - Hanya modify wording dalam existing entry; never delete/reorder/replace.
   - Sell test: "Would a user reading this bullet think 'oh nice, I want to try that'?"
   - Lead with what user can now **do** ("You can now..." not "Refactored the...").
   - Rewrite entry yang baca seperti commit message.
   - Internal/contributor changes ke `### For contributors` subsection.
   - Use Edit dengan exact old_string match, never Write.
6. **Step 6: Cross-Doc Consistency** — README feature list match CLAUDE.md? Component list match ARCHITECTURE? CHANGELOG version match VERSION file? **Discoverability**: setiap doc reachable dari README/CLAUDE.md? Flag jika ARCHITECTURE.md tidak di-link.
7. **Step 7: TODOS.md Cleanup** — completed items not yet marked → move ke Completed section dengan `**Completed:** vX.Y.Z.W (YYYY-MM-DD)`. Be conservative — hanya clear evidence di diff. Description updates jika stale → AskUserQuestion.
8. **Step 8: VERSION Bump Question** — kalau belum bump, AskUserQuestion (never auto).
9. **Step 9: Commit & Output** — atomic commit per logical doc change.

## Contoh / Studi kasus

Haris ship fitur API rate limiting untuk MaritimHub:
- Run `/document-release` setelah `/ship`.
- Step 1: diff shows new file `src/middleware/rate-limit.ts`, modified `src/api.ts`, added test, new env var `RATE_LIMIT_MAX_REQUESTS`.
- Step 2: 
  - README.md: features list need add "rate limiting".
  - CLAUDE.md: env vars table missing `RATE_LIMIT_MAX_REQUESTS`. Project structure tree out of date.
  - ARCHITECTURE.md: middleware section need new component.
  - CHANGELOG.md: entry exists from /ship.
- Step 3: Auto-update README features, CLAUDE.md env table + structure, ARCHITECTURE middleware section.
- Step 4: ARCHITECTURE philosophy unchanged → no ask needed.
- Step 5: CHANGELOG entry "Refactored middleware layer to support rate limiting" → fails sell test. Edit to "You can now configure per-IP request limits via the new RATE_LIMIT_MAX_REQUESTS env var".
- Step 6: cross-check OK, VERSION bumped at /ship.
- Step 7: TODOS.md had "Add rate limiting" → move to Completed.
- Output: 5 file edits, commit `docs: post-ship update for rate limiting feature`.

## Kesimpulan

`/document-release` mengisi gap antara "code shipped" dan "docs match reality". Otomatis untuk fakta, stop untuk subjektif. Aturan emas: **CHANGELOG entry never replaced, only polished**. Cocok sebagai mandatory step antara `/ship` dan PR merge. Output deterministic: kalau doc tidak butuh update, skill keluar cepat tanpa fabricate changes.
