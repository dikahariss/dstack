# Benchmark Models — Cross-Model Skill Benchmark

> **Sumber:** [`benchmark-models/SKILL.md`](https://github.com/garrytan/gstack/blob/main/benchmark-models/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Pertanyaan "model mana yang paling cocok untuk skill X?" biasanya dijawab dengan feeling. `/benchmark-models` mengubahnya jadi data: prompt yang sama dijalankan paralel ke Claude, GPT (via Codex CLI), dan Gemini, lalu dibandingkan latency, tokens, cost, dan opsional quality lewat LLM judge (~$0.05/run). Skill performance drift seiring waktu — provider update model, regressi muncul — dan tanpa baseline data, regressi quality sulit dideteksi.

Penting dibedakan: `/benchmark` mengukur performa halaman web (Core Web Vitals); `/benchmark-models` mengukur performa AI model untuk skill atau prompt arbitrary.

## Kapan menggunakannya

- Voice trigger: "compare models", "model shootout", "which model is best", "benchmark skill across models", "cross-model comparison".
- Saat memilih model default untuk skill baru (taste-call yang harus didukung data).
- Untuk regression check setelah provider update (Sonnet 4.5 → 4.6 misalnya — quality berubah?).
- Untuk membenarkan migration cost: kalau Gemini lebih murah 5x dengan quality drop 1 poin, apakah worth?
- Tidak cocok untuk task one-off; selalu ada cost API call nyata.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Model mana yang paling cocok untuk skill /investigate?"
- "Bandingkan Claude vs GPT-5 untuk task code review."
- "Mau model shootout sebelum aku pilih default model skill baru."
- Kata kunci kanonik (EN): `/benchmark-models`, `compare models`,
  `model shootout`, `which model is best`.

Contoh task lengkap:

> "Jalankan `/benchmark-models` — pilih skill `investigate` sebagai
> prompt, sertakan semua provider yang ter-auth, dan aktifkan judge
> supaya kualitas output juga terukur. Simpan hasilnya ke JSON."

Yang terjadi: skill dry-run dulu untuk lihat status auth per
provider, lalu menjalankan prompt yang sama paralel ke Claude,
GPT (via Codex CLI), dan Gemini — membandingkan latency, cost,
tokens, dan opsional quality score dari LLM judge (~$0.05/run),
lalu menyimpan hasil ke `~/.gstack/benchmarks/<date>-<slug>.json`.

## Cara menggunakannya

1. Pastikan `gstack-model-benchmark` binary terinstall (`~/.claude/skills/gstack/bin/gstack-model-benchmark`). Kalau hilang, run `./setup` di gstack install dir.
2. Invoke `/benchmark-models`. Skill jalan interaktif:
   - **Step 1: Choose prompt** — A) salah satu skill gstack, B) inline prompt, C) file di disk.
   - **Step 2: Choose providers** — selalu dry-run dulu untuk lihat auth status. Jika semua provider NOT READY, STOP. User pilih provider mana yang ikut.
   - **Step 3: Decide on judge** — opsional ~$0.05/run, butuh `ANTHROPIC_API_KEY`. Default rekomendasi: enable.
   - **Step 4: Run benchmark** — stream output, 30s-5min tergantung kompleksitas.
   - **Step 5: Interpret results** — fastest / cheapest / highest quality / best overall.
   - **Step 6: Save results** — JSON ke `~/.gstack/benchmarks/<date>-<slug>.json` untuk diff masa depan.

Aturan penting:
- Tidak pernah real-run tanpa dry-run dulu (auth visibility).
- Tidak pernah auto-include `--judge` (cost matter, user opt-in).
- Tidak pernah hardcode model names; selalu pakai pilihan user dari Step 2.

## Contoh / Studi kasus

Haris ingin tahu apakah Sonnet 4.7 atau GPT-5 lebih cocok untuk `/investigate`:
- Run `/benchmark-models`, pilih skill `investigate` sebagai prompt, providers all-authed, judge enabled.
- Output:
  - Claude Sonnet 4.7: latency 42s, $0.18, judge 8.2/10
  - GPT-5 via Codex: latency 38s, $0.21, judge 7.9/10
  - Gemini 2.5 Pro: latency 28s, $0.09, judge 6.5/10
- Best overall: Sonnet 4.7 (judge tertinggi + cost moderat). Cheapest: Gemini, tapi quality drop signifikan untuk task investigasi.
- Hasil disimpan ke `~/.gstack/benchmarks/2026-05-17-investigate.json`.
- Bulan depan rerun untuk catch drift bila Claude 4.8 rilis.

## Kesimpulan

`/benchmark-models` adalah evidence-based model selection. Daripada debat opini, jalankan dan bandingkan angka. Cocok dipakai berkala (tiap kuartal) atau saat ada update model baru. Hemat: dry-run gratis dan menunjukkan auth status; real-run bayar API call sesuai provider.
