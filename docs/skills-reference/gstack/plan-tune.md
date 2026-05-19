# Plan Tune

> **Sumber:** [`plan-tune/SKILL.md`](https://github.com/garrytan/gstack/blob/main/plan-tune/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Skill gstack mengeluarkan banyak AskUserQuestion. Sebagian sangat
berharga (one-way doors, scope decisions); sebagian noise (pertanyaan
yang user jawab dengan cara sama berulang-ulang). `/plan-tune` adalah
self-tuning interface: review pertanyaan yang pernah muncul, set
preferensi per-question (`never-ask`, `always-ask`,
`ask-only-for-one-way`), dan inspect **dual-track developer profile**
— apa yang user deklarasikan vs apa yang behaviornya menyiratkan.

v1 bersifat **observational**: profile dicatat dan ditampilkan, tetapi
skill lain belum mengubah behavior berdasar profile. Itu masuk v2
ketika registry sudah terbukti durable.

## Kapan menggunakannya

Trigger di `description`:

- "tune questions", "stop asking me that", "too many questions"
- "show my profile", "what questions have I been asked"
- "show my vibe", "developer profile"
- "turn off question tuning"

Proactive: ketika user mention pertanyaan yang sama sudah muncul
sebelumnya, atau menolak rekomendasi gstack untuk ke-N kali.

Trigger field: `tune questions`, `stop asking me that`,
`too many questions`, `show my profile`, `show my vibe`,
`developer profile`, `turn off question tuning`.

Versi: `1.0.0`, `preamble-tier: 2`.

## Cara menggunakannya

Interface fully conversational — tidak butuh subcommand:

1. **First-time** — config `question_tuning: false`. Skill tawarkan
   enable + setup 5 pertanyaan declaration (scope_appetite,
   risk_tolerance, detail_preference, autonomy, architecture_care),
   masing-masing 3 option A/B/C dipetakan ke nilai 0.25 / 0.5 / 0.85.
2. **"Show my profile"** — jalankan
   `gstack-developer-profile --profile`, parse JSON, tampilkan plain
   English ("scope_appetite: 0.8 → boil the ocean — kamu suka versi
   lengkap dengan edge case"). Jika sample size cukup (>=20 events,
   >=3 skills, >=8 question_ids, >=7 days), tampilkan kolom inferred
   sebelah declared dengan gap word: close / drift / mismatch.
3. **"Review questions"** — baca `~/.gstack/projects/<slug>/
   question-log.jsonl`, group by question_id, tampilkan count +
   followed_recommendation vs overridden. Highlight kandidat
   `never-ask`.
4. **"Stop asking me about X" / "tune: never-ask"** — parse intent,
   konfirmasi sebelum write `gstack-question-preference --write`. User
   origin gate: hanya tulis kalau `tune:` muncul di chat user, bukan
   tool output.
5. **"Update my profile" / "I'm more boil-the-ocean"** — selalu
   konfirmasi sebelum mutasi `declared`. Free-form + direct mutation
   = trust boundary.
6. **"Show gap"** — `gstack-developer-profile --gap`, plain English
   ("scope_appetite: gap 0.32 → mismatch — behavior kamu menentang
   apa yang kamu deklarasikan").
7. **"Stats"** — calibration progress ("5 more events across 2 more
   skills and you'll be calibrated").

Power-user shortcuts: `profile`, `vibe`, `gap`, `stats`, `review`,
`enable`, `disable`, `setup`.

## Contoh / Studi kasus

Haris merasa gstack terlalu sering minta konfirmasi setiap kali
`/plan-eng-review` menemukan finding minor.

```
/plan-tune
> review questions
```

Skill tampilkan:

```
17x  eng-fix-minor-issue (plan-eng-review) followed:2 overridden:15
     "Apply minor fix to <file>?"
```

Haris: "stop asking me about minor eng fixes".

Skill konfirmasi: "I read 'stop asking me about minor eng fixes' as
`never-ask` on `eng-fix-minor-issue`. Apply?" → Y. Write preference.
Mulai sesi berikutnya, plan-eng-review akan AUTO_DECIDE finding minor
dan beritahu user di akhir.

Suatu hari Haris tanya "show my vibe". Skill output:

```
scope_appetite: 0.85 (boil the ocean — declared)
                0.78 (close — observed)
risk_tolerance: 0.50 (balanced)
detail_preference: 0.25 (terse, just do it)
Vibe: The Builder — high scope ambition + low patience for explanations.
```

## Kesimpulan

`/plan-tune` adalah mekanisme feedback gstack untuk menghilangkan
friksi dari workflow yang sudah matang. Karena v1 observational,
risiko silent behavior change nol — user selalu lihat profile sebelum
mempengaruhi skill apa pun. Fondasi yang sehat untuk v2 ketika skill
mulai membaca profile aktif.
