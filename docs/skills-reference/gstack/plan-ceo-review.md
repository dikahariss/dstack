# Plan Ceo Review

> **Sumber:** [`plan-ceo-review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/plan-ceo-review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Banyak plan engineering bagus secara teknis tapi salah secara strategis
— scope terlalu kecil, ambisi terlalu rendah, atau memilih lokal optimum
yang tidak menyelesaikan masalah sebenarnya. `/plan-ceo-review` adalah
mode founder/CEO: ia memaksa user memikirkan ulang problem statement,
mencari 10-star product, menantang premise, dan memperluas scope kalau
itu menghasilkan produk yang lebih baik.

Skill ini bukan rubber stamp. Ia dirancang dengan **4 mode** eksplisit
sehingga user selalu in control: SCOPE EXPANSION (dream big), SELECTIVE
EXPANSION (hold scope + cherry-pick tambahan), HOLD SCOPE (review
maksimal tanpa nambah scope), SCOPE REDUCTION (pangkas yang
overbuilt). Setiap expansion proposal dipresentasikan satu per satu via
AskUserQuestion — tidak pernah batch.

## Kapan menggunakannya

Trigger di `description`:

- "think bigger", "expand scope", "strategy review"
- "rethink this", "is this ambitious enough"

Proactive: skill harus disuggest ketika user menanyakan scope/ambisi
sebuah plan, atau ketika plan terasa bisa lebih besar. Skill
dideklarasikan `benefits-from: [office-hours]` — design doc dari
office-hours menjadi input ideal.

Versi: `1.0.0`, `preamble-tier: 3`, `interactive: true`.

## Cara menggunakannya

1. Invoke `/plan-ceo-review` pada plan file yang sudah ada (Eng review
   biasanya jadi pasangannya).
2. **Step 0** rangkaian sub-step: 0A scope check, 0B-0C derivasi
   architecture/scope baseline, 0D cherry-pick decisions, 0E **Temporal
   Interrogation** (forecasting jam 1, 2-3, 4-5, 6+ implementation —
   selalu pakai dual-scale "human / CC+gstack"), 0F **Mode Selection**.
3. **Section 1-11 review** (anti-skip rule): Architecture, Error &
   Rescue Map, Security & Threat Model, Data Flow & Interaction Edge
   Cases, Code Quality, Test Review, Performance, Observability,
   Deployment & Rollout, Long-Term Trajectory, Design & UX.
4. **Anti-shortcut clause** — semua finding wajib melalui AskUserQuestion
   per issue sebelum disolderkan ke plan. Tidak boleh batch "tulis semua
   ke plan + ExitPlanMode".
5. **Outside Voice** — opsional tapi recommended: dispatch Codex (atau
   Claude subagent jika Codex tidak ada) untuk independent challenge.
   Cross-model tension surface secara eksplisit. User Sovereignty:
   outside voice tidak pernah auto-apply.
6. **Output** — CEO plan file `~/.gstack/projects/<slug>/ceo-plan-<date>.md`
   + spec review loop adversarial (5 dimensi: completeness, consistency,
   clarity, scope, feasibility, quality_score 1-10), maks 3 iterasi.
7. **Persist** — `gstack-review-log` mencatat skill, status, mode,
   scope_proposed/accepted/deferred, critical_gaps, quality_score.

## Contoh / Studi kasus

Plan: "Tambahkan filter ke halaman dashboard."

`/plan-ceo-review` jalan dengan mode default SELECTIVE EXPANSION:

1. 0E temporal: "Hour 6+ user akan minta save filter preset. Sebaiknya
   diputuskan sekarang vs nanti?"
2. Section 1: usul ASCII diagram architecture filter pipeline.
3. Section 11 (Design & UX): "Information architecture filter — user
   lihat apa dulu? Loading state? Empty state ketika 0 hasil?"
4. Setiap finding satu AskUserQuestion. User accept beberapa, defer
   beberapa ke TODOS.md.
5. Outside Voice Codex: "Plan ini menerima 4 expansion tapi luput
   keamanan — filter SQL injection?" → cross-model tension → user
   accept fix.
6. Output CEO plan + REVIEWER CONCERNS section + entry di review log.

## Kesimpulan

`/plan-ceo-review` adalah pintu gerbang strategic gstack. Ia
melengkapi `/plan-eng-review` (yang fokus eksekusi) dengan pertanyaan
"apakah ini yang seharusnya kita bangun, dan apakah ambisinya tepat?".
Dipadukan dengan office-hours di hulu dan autoplan di hilir,
ia menjadi tulang punggung pipeline plan review gstack.
