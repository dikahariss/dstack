# Setup Matt Pocock Skills

> **Sumber:** [`skills/engineering/setup-matt-pocock-skills/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/setup-matt-pocock-skills/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Banyak skill engineering di catalog ini (`to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`, `improve-codebase-architecture`, `zoom-out`, `review`, `qa`) bergantung pada tiga keputusan per-repo:

1. **Issue tracker** — di mana issue tinggal (GitHub default, juga GitLab dan local-markdown supported)?
2. **Triage label** — string label aktual yang dipakai di tracker (mapping ke lima role kanonik)?
3. **Domain docs** — single-context (`CONTEXT.md` di root) atau multi-context (`CONTEXT-MAP.md`)?

Tanpa setup ini, skill akan menebak — bisa salah panggil CLI, salah apply label, atau kehilangan glossarium. Skill ini scaffolding sekali pakai yang menulis blok `## Agent skills` ke `CLAUDE.md`/`AGENTS.md` dan tiga file detail di `docs/agents/`. Setelah itu skill lain "tahu" repo.

`disable-model-invocation: true` — skill ini dipanggil eksplisit, bukan auto-trigger.

## Kapan menggunakannya

- Sebelum first use dari `to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`, `improve-codebase-architecture`, atau `zoom-out`.
- Bila skill lain tampak "missing context" tentang issue tracker, label, atau domain docs.
- Saat berpindah issue tracker atau ingin restart konfigurasi from scratch.

## Cara menggunakannya

1. **Explore**: cek `git remote -v`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/`, `.scratch/`.
2. **Present findings + tanya** tiga section **satu per satu**, masing-masing dengan explainer pendek:
   - **A. Issue tracker** — GitHub / GitLab / Local markdown / Other. Default berdasarkan `git remote`.
   - **B. Triage labels** — lima role kanonik (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Override per nama bila repo punya konvensi sendiri.
   - **C. Domain docs** — single-context vs multi-context.
3. **Confirm + edit**: tampilkan draft blok `## Agent skills` dan tiga file `docs/agents/*.md`. Biarkan user mengedit.
4. **Write**: edit `CLAUDE.md` bila ada, else `AGENTS.md`, else tanya yang mana yang dibuat (jangan pilih sendiri). Bila blok `## Agent skills` sudah ada, update in-place — jangan duplikat.
5. **Done**: kabari bahwa skill engineering kini akan membaca dari file ini; mention bisa edit `docs/agents/*.md` langsung nanti.

## Contoh / Studi kasus

Repo TypeScript baru: `git remote` menunjuk ke github.com. Skill mendeteksi GitHub → propose GitHub Issues sebagai default. Section B: repo belum punya label apa-apa → terima lima default. Section C: hanya ada satu `src/` directory → single-context. Skill menulis blok `## Agent skills` di `CLAUDE.md` (yang sudah ada), plus `docs/agents/issue-tracker.md` (template GitHub), `docs/agents/triage-labels.md` (mapping default), `docs/agents/domain.md` (single-context layout). Setelah itu `/triage`, `/to-issues`, dll. langsung tahu pakai `gh issue create`, label apa, dan baca `CONTEXT.md` dari root.

## Kesimpulan

Skill ini adalah prasyarat untuk hampir semua skill engineering. Jalankan sekali per repo, lalu lupakan. Bila skill lain bertingkah aneh, kemungkinan blok `## Agent skills` belum ada atau out of date.
