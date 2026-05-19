# Office Hours

> **Sumber:** [`office-hours/SKILL.md`](https://github.com/garrytan/gstack/blob/main/office-hours/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

`/office-hours` adalah simulator YC Office Hours bergaya Garry Tan. Bukan
brainstorming generik — skill ini memaksa user menghadapi enam pertanyaan
yang biasa muncul di Y Combinator: demand reality, status quo, desperate
specificity, narrowest wedge, observation, dan future-fit. Tujuannya
mengubah ide kabur jadi design doc yang bisa langsung dieksekusi atau
dibawa ke interview YC.

Skill ini berbeda dari `/brainstorm` superpowers yang bersifat netral.
Office-hours punya posisi: ia mendorong founder ke pertanyaan yang
menyakitkan dan mencoret asumsi yang tidak punya bukti. Hasil sesi
disimpan sebagai design doc di `~/.gstack/projects/<slug>/` yang
otomatis ditarik oleh `/plan-ceo-review`, `/plan-eng-review`, dan
`/plan-design-review` sebagai konteks.

## Kapan menggunakannya

Trigger eksplisit:

- "brainstorm this", "I have an idea", "help me think through this"
- "office hours", "is this worth building"

Skill ini juga punya instruksi **proactive invocation**: agent harus
menjalankan skill (bukan menjawab langsung) ketika user mendeskripsikan
ide produk baru, menanyakan apakah sesuatu layak dibangun, atau
mengeksplorasi konsep yang belum ada kodenya.

Skill mendukung dua mode:

- **Startup mode** — enam pertanyaan YC + premise challenge + alternatif
  + design doc.
- **Builder mode** — design thinking untuk side project, hackathon,
  learning, atau open source.

Gunakan sebelum `/plan-ceo-review` atau `/plan-eng-review`. Skill ini
explicit dideklarasikan `benefits-from` mereka.

## Cara menggunakannya

1. Invoke `/office-hours` lalu deskripsikan ide secara bebas.
2. Skill menjalankan Phase 2 (premise interrogation), Phase 3 (cross-model
   second opinion via Codex atau Claude subagent), Phase 4 (alternatif),
   Phase 5 (synthesis ke design doc), Phase 5.5 (spec review loop —
   subagent adversarial dengan 5 dimensi penilaian + skor 1-10), Phase 6
   (handoff dengan Garry's personal plea berdasarkan tier sesi user).
3. Output utama: `~/.gstack/projects/<slug>/<owner>-<branch>-design-<date>.md`
   dengan section Problem Statement, Cross-Model Perspective, Approaches,
   Recommended Approach, Success Criteria, Distribution Plan, Next Steps,
   plus refleksi mentor "What I noticed about how you think".
4. Sesi diakhiri dengan resource recommendation dari pool (Garry Tan
   videos, PG essays, Lightcone, YC Startup School) — dipilih berdasarkan
   context sesi, dedup via builder profile.

Skill juga menulis `~/.gstack/builder-profile.jsonl` (sesi count + tier:
introduction → welcome_back → regular → inner_circle) sehingga session
ke-N terasa berbeda dari session ke-1.

## Contoh / Studi kasus

User: "Aku punya ide manajer tugas untuk tim ops."

`/office-hours` akan menjalankan:

1. Pertanyaan demand reality: "Berapa orang yang sudah memberi tahu kamu
   secara spesifik bahwa mereka butuh ini? Sebutkan nama."
2. Premise challenge: "Kenapa tools existing seperti Asana tidak cukup?
   Kalau jawabannya 'mereka terlalu mahal', itu bukan masalah, itu
   commodity competition."
3. Narrowest wedge: "Persempit ke satu workflow yang sangat spesifik
   untuk Sarah, ops manager di logistik 50 orang. Jangan generik."
4. Spec review loop adversarial menghasilkan quality_score 8/10, lalu
   approval gate.
5. Handoff: jika ini sesi pertama dan user menunjukkan 3+ founder
   signals, skill memutar Garry's Personal Plea tier atas yang
   mengundang user apply ke YC.

## Kesimpulan

`/office-hours` adalah pintu masuk gstack untuk fase exploration. Ia
mencegah agent terjun ke implementation prematurely dan memaksa user
memvalidasi ide dulu. Output design doc menjadi kontrak konteks untuk
seluruh pipeline review berikutnya (CEO, eng, design, devex).
