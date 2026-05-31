# Plan Eng Review

> **Sumber:** [`plan-eng-review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/plan-eng-review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Sebagian besar bug produksi lahir di plan, bukan di kode: edge case
yang lupa, error path yang silent, N+1 query yang ketinggalan, migration
yang locks table di prod. `/plan-eng-review` adalah mode engineering
manager: review plan secara interaktif sebelum koding dimulai. Ia
mengunci execution plan — architecture, data flow, diagrams, edge
cases, test coverage, performance — dengan rekomendasi opinionated.

Skill ini juga merupakan satu-satunya review yang **required by
default** untuk lulus `/ship` (kecuali user set `skip_eng_review:
true`). Output-nya disimpan di review log dan dibaca oleh review
readiness dashboard.

## Kapan menggunakannya

Trigger di `description`:

- "review the architecture", "engineering review", "lock in the plan"
- Voice: "tech review", "technical review", "plan engineering review"
- Trigger field: `review architecture`, `eng plan review`,
  `check the implementation plan`

Proactive: jalankan ketika user punya plan atau design doc dan akan
mulai koding — untuk menangkap masalah arsitektur sebelum
implementasi.

Versi: `1.0.0`, `preamble-tier: 3`, `interactive: true`,
`benefits-from: [office-hours]`.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Review arsitektur plan webhook receiver ini sebelum aku koding."
- "Lock in plan implementasi — cek edge case dan failure mode-nya."
- "Engineering review dulu sebelum mulai, cari landmine di plan ini."
- Kata kunci kanonik (EN): `/plan-eng-review`, `engineering review`,
  `review architecture`, `lock in the plan`.

Contoh task lengkap:

> "/plan-eng-review — plan: implement webhook receiver untuk Stripe
> events di service Node.js. Cek idempotency, error handling, dan
> N+1 query. Buat test plan untuk dipakai /qa nanti."

Yang terjadi: skill jalan 4 section review (Architecture, Code
Quality, Tests, Performance) — setiap finding satu AskUserQuestion
dengan opsi labeled `(human: ~Xh / CC: ~Ymin)`. Output wajib: NOT
in scope section, failure modes per codepath, worktree parallelization
strategy, test plan file, dan entry di review log untuk dashboard
`/ship`.

## Cara menggunakannya

1. Skill jalan dengan 4 section review utama: Architecture, Code
   Quality, Test Review, Performance.
2. **CRITICAL RULE** — satu finding = satu AskUserQuestion. Tidak
   pernah batch. Setiap option label `(human: ~X / CC: ~Y)` untuk
   menampilkan kompresi AI.
3. **Required outputs**:
   - **"NOT in scope" section** — kerja yang dipertimbangkan tapi
     defer + rationale.
   - **"What already exists" section** — kode existing yang sudah
     partial solve.
   - **TODOS.md updates** — setiap calon TODO satu AskUserQuestion,
     format dari `.claude/skills/review/TODOS-format.md` (What, Why,
     Pros, Cons, Context, Depends on).
   - **Diagrams** — ASCII untuk data flow, state machine, processing
     pipeline non-trivial. Identifikasi file yang perlu inline diagram
     comments.
   - **Failure modes** — untuk tiap codepath baru, satu realistic
     production failure + apakah ada test + error handling + user
     visibility. "Silent + no test + no handling" = **critical gap**.
   - **Worktree parallelization strategy** — dependency table, parallel
     lanes, execution order, conflict flags.
   - **Completion summary** + Lake Score.
4. **Outside Voice** — opsional, Codex atau Claude subagent, dengan
   filesystem boundary instruction ("Do NOT read agents/", "Do NOT
   read .claude/skills/"). Cross-model tension surface eksplisit.
5. **Test Plan output** — file terpisah `~/.gstack/projects/<slug>/
   <branch>-test-plan-<date>.md` dengan affected pages, key
   interactions, edge cases, critical paths. Dibaca oleh `/qa` dan
   `/qa-only`.
6. **Persist via gstack-review-log** — skill, status, unresolved,
   critical_gaps, issues_found, mode, commit. Dipakai oleh dashboard
   `/ship` untuk verdict CLEARED/NOT CLEARED.
7. **Plan File Review Report** — append `## GSTACK REVIEW REPORT`
   markdown table ke plan file aktif.

## Contoh / Studi kasus

Plan: implement webhook receiver untuk Stripe events.

`/plan-eng-review`:

1. Section 1 (Architecture): ASCII diagram request flow.
   Finding: tidak ada idempotency key handling → AskUserQuestion
   "Stripe bisa retry webhook. Tanpa idempotency, akan double-charge
   user. Pakai event.id sebagai dedup key?" → A) Add now (human: ~2h
   / CC: ~10min) → user accept.
2. Section 2 (Code Quality): finding: catch-all `except Exception` di
   handler → fix dengan exception classes spesifik.
3. Section 3 (Test): diagram codepaths baru. Critical gap: invalid
   signature → no test + silent failure. Flagged.
4. Section 4 (Performance): N+1 ketika lookup Customer dari event →
   prefetch.
5. NOT in scope: webhook deduplication via Redis (defer to TODOS).
6. Failure modes: 5 codepaths, 2 critical gaps.
7. Outside voice Codex: confirm + add bonus finding tentang
   timezone-aware timestamps. User accept via AskUserQuestion.
8. Test plan file ditulis untuk dipakai `/qa` nanti.
9. Review log: status "issues_open" dengan 0 unresolved + 2 critical
   gaps → dashboard `/ship` menampilkan NOT CLEARED sampai user
   resolve.

## Kesimpulan

`/plan-eng-review` adalah gate engineering wajib gstack. Kombinasi
"one issue one question", required outputs (NOT in scope, failure
modes, worktree lanes), dan outside voice cross-model menjamin plan
yang lulus skill ini punya peluang jauh lebih tinggi shipping tanpa
regression. Ia juga jadi sumber kebenaran untuk test plan `/qa` di
hilir.
