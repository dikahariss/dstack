# Ship

> **Sumber:** [`ship/SKILL.md`](https://github.com/garrytan/gstack/blob/main/ship/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Setiap pengembang melakukan urutan release yang sama: detect base
branch, run tests, review diff, bump VERSION, update CHANGELOG, commit
bisectable, push, buat PR. Salah satu langkah skip = bug shipped atau
release dengan changelog kosong. `/ship` mengotomatiskan seluruh
sequence sekali commands sehingga "/ship" → next thing user lihat
adalah PR URL + review summary + auto-synced docs.

Skill ini juga jadi **gate akhir** yang membaca review readiness
dashboard. Jika `/plan-eng-review` atau `/review` belum cleared,
`/ship` STOP dan beritahu apa yang missing. Tidak ada force push,
tidak ada skip tests, tidak ada konfirmasi trivial — kecuali version
bump major dan finding P1 dari Codex structured review.

## Kapan menggunakannya

Trigger di `description`:

- "ship", "deploy", "push to main"
- "create a PR", "merge and push", "get it deployed"
- Trigger field: `ship it`, `create a pr`, `push to main`,
  `deploy this`

Proactive: ketika user bilang kode ready, tanya soal deploy, ingin
push code, atau minta PR. **Do NOT push/PR langsung — selalu lewat
skill.**

Versi: `1.0.0`, `preamble-tier: 4`.

## Cara menggunakannya

Workflow 20 step:

1. **Detect base branch** — dari git config, fallback main/master.
2. **Workspace-aware queue check** — landing-report queue cek sibling
   Conductor workspaces, pilih slot VERSION yang aman.
3. **Sync base branch** — fetch, merge fast-forward kalau bisa.
4. **Run tests** — detect test command dari package.json/Makefile.
   STOP kalau gagal.
5. **Review readiness dashboard** — baca review log, verdict CLEARED
   atau NOT CLEARED. NOT CLEARED → STOP, beritahu run
   `/plan-eng-review` atau `/review`.
6. **Pre-landing review** — kalau ada `.claude/skills/review/
   checklist.md`, gate. Unreadable → STOP.
7. **Coverage tests** — Step 7 generate coverage tests untuk codepaths
   baru, harus pass sebelum commit.
8. **Verification** — re-run setelah modifikasi (jangan push tanpa
   fresh evidence).
9. **TODOS.md cross-reference** — Step 14 detect completed TODOs dari
   diff, move to `## Completed` section dengan
   `**Completed:** vX.Y.Z (YYYY-MM-DD)`. Conservative.
10. **VERSION bump** — 4-digit MAJOR.MINOR.PATCH.MICRO. Auto pilih
    increment dari type (feat/fix/chore). AskUserQuestion untuk MINOR
    atau MAJOR (one-way doors). Idempotency check (DRIFT_STALE_PKG
    repair path) sinkronisasi package.json.
11. **CHANGELOG auto-generate** — enumerate semua commit di branch,
    baca full diff, group by theme (Added / Changed / Fixed /
    Removed), tulis entry `## [X.Y.Z.W] - YYYY-MM-DD`. Cross-check
    every commit map ke minimal satu bullet. Voice: lead with what
    user can now do, plain language, no internal details.
12. **Commit bisectable** — Step 15 split per logical change. Step
    15.0 squash WIP commits (kalau checkpoint_mode continuous).
13. **Push** — `git push` (NEVER force).
14. **PR/MR create** — `gh pr create` atau `glab mr create` dengan
    title `v$NEW_VERSION <type>: <summary>`, body include changelog
    entry + TODOS summary + review log link. Output URL.
15. **Step 20 Persist ship metrics** — append ke
    `~/.gstack/projects/<slug>/<branch>-reviews.jsonl`:
    `coverage_pct`, `plan_items_total`/`done`, `verification_result`,
    `version`, `branch`. Dipakai `/retro` untuk plan completion stats.

**Important rules**:

- Never skip tests, never skip pre-landing review, never force push.
- Don't ask trivial confirmations ("ready to push?"). DO stop for:
  MINOR/MAJOR bumps, pre-landing review ASK items, Codex P1
  findings (large diff only).
- 4-digit version format wajib.
- Date format CHANGELOG: `YYYY-MM-DD`.
- Split commits for bisectability.

## Contoh / Studi kasus

```
/ship
```

1. Base: main. Workspace queue: 3.4.7 free.
2. Tests pass (124/124).
3. Review dashboard: Eng Review CLEAR (PLAN), CEO Review CLEAR,
   Adversarial CLEAR. Verdict CLEARED.
4. Coverage tests generated untuk 2 new functions, pass.
5. TODOS detect: 2 items completed (P0 "user auth refactor", P2
   "API rate limiting"). Move to Completed.
6. Bump MICRO → 3.4.7. (PATCH skip karena commit sebelumnya sudah
   PATCH bump.)
7. CHANGELOG generate dengan 3 themes: Added (auth refactor), Fixed
   (rate limit bug), Changed (logging format). 8 commits all
   mapped.
8. Commit 4 logical groups bisectable. Push. PR created:
   `v3.4.7.0 feat: auth refactor + rate limiting`. URL dicetak.
9. Ship metrics persisted: coverage 87%, plan_items 5/5,
   verification pass.

## Kesimpulan

`/ship` adalah orkestrator release gstack. Ia mengompresi 30+ menit
release manual jadi 1 command, sambil menjamin tests pass, review
cleared, version bumped correctly, CHANGELOG mencerminkan SETIAP
commit, dan TODOS auto-cleaned. Karena hasilnya dipersist ke review
log, downstream skill (`/land-and-deploy`, `/canary`, `/retro`) tahu
exactly apa yang shipped dan kapan.
