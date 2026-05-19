# Claude API

> **Sumber:** [`skills/claude-api/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/claude-api/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Menulis aplikasi Anthropic SDK dari memori biasanya berakhir dengan kode yang nyaris
benar tapi salah di detail kritis: model ID dengan suffix tanggal yang tidak ada,
`budget_tokens` di model yang sudah deprecate, prompt cache yang silently invalidated,
struktur tool use yang setengah-OpenAI. Skill ini adalah pengetahuan terkini soal SDK
Claude (Opus 4.7, Sonnet 4.6, Haiku 4.5), praktik adaptive thinking, prompt caching,
streaming, batches, files, dan Managed Agents — semua diorganisasi per-bahasa.

Nilai uniknya: **disiplin migrasi & default yang aman**. Default ke Opus 4.7 dengan
adaptive thinking, default streaming untuk request panjang, default `cache_control` di
prompt cache, plus aturan eksplisit untuk tidak menebak signature SDK (selalu baca file
bahasa terkait atau WebFetch ke repo SDK resmi).

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- Kode mengimport `anthropic` atau `@anthropic-ai/sdk`.
- User minta Claude API / Anthropic SDK / Managed Agents.
- User menambah/memodifikasi feature Claude (caching, thinking, compaction, tool use,
  batch, files, citations, memory) atau model (Opus/Sonnet/Haiku) di file.
- Pertanyaan tentang prompt caching / cache hit rate dalam proyek Anthropic SDK.

Skill **TIDAK** dipakai bila: file import `openai`/SDK provider lain, filename seperti
`*-openai.py` / `*-generic.py`, kode provider-neutral, atau pertanyaan general
programming/ML.

## Cara menggunakannya

Workflow tinggi-level:

1. **Pre-check** — scan file target untuk marker non-Anthropic (import openai, gpt-4,
   gpt-5, `langchain_openai`, dll). Kalau ditemukan, stop dan tanya user.
2. **Language detection** — deteksi bahasa proyek (Python / TypeScript / Java / Go /
   Ruby / C# / PHP / cURL) lewat file marker (`*.py`, `package.json`, `pom.xml`, dst).
3. **Surface selection** — pakai decision tree:
   - Single LLM call → Claude API biasa.
   - Workflow multi-step → Claude API + tool use.
   - Open-ended agent dengan workspace + state → Managed Agents (1P only, bukan Bedrock/Vertex).
4. **Reading guide** — baca file yang relevan dari `{lang}/claude-api/` (README,
   tool-use, streaming, batches, files-api) plus `shared/` untuk topik lintas-bahasa
   (prompt-caching, tool-use-concepts, agent-design, error-codes, model-migration).

Resource pendukung (sub-folder bahasa & shared):

- `python/`, `typescript/`, `java/`, `go/`, `ruby/`, `csharp/`, `php/`, `curl/` — file
  bahasa-spesifik untuk Claude API dan Managed Agents.
- `shared/` — `tool-use-concepts.md`, `agent-design.md`, `prompt-caching.md`,
  `error-codes.md`, `model-migration.md`, `live-sources.md`, plus `managed-agents-*.md`
  (overview, core, environments, tools, events, outcomes, multiagent, webhooks, memory,
  client-patterns, onboarding, api-reference).

Defaults yang **wajib** diikuti:

- Model: `claude-opus-4-7` (jangan downgrade tanpa user minta eksplisit).
- Thinking: `thinking: {type: "adaptive"}` (Opus 4.7 menolak `budget_tokens` & sampling
  params dengan 400).
- Streaming untuk request long input / long output / high `max_tokens`.
- Prompt caching pakai `cache_control: {type: "ephemeral"}` — verifikasi via
  `usage.cache_read_input_tokens`.
- Tidak truncate input — kalau melebihi context, bicarakan opsi (chunking, summarization)
  bukan diam-diam dipotong.

Subcommand:

- `managed-agents-onboard` — walkthrough interview untuk setup Managed Agent dari nol.

## Contoh / Studi kasus

User: *"Tolong tambahkan prompt caching ke aplikasi RAG Python saya."*

1. Claude membaca `python/claude-api/README.md` (section Prompt Caching) +
   `shared/prompt-caching.md` (prinsip prefix-stability, breakpoint placement,
   silent invalidator audit).
2. Claude memeriksa apakah model di proyek user sudah Opus 4.7. Kalau belum, sarankan
   migrasi (sambil tunjukkan path migration via `shared/model-migration.md`).
3. Claude menempatkan `cache_control` di akhir prefix stabil (tools → system → frozen
   context), bukan di tail per-request. Memastikan render order `tools → system →
   messages`.
4. Setelah implementasi, Claude menambah assert pada `usage.cache_read_input_tokens > 0`
   untuk verifikasi cache benar-benar nge-hit, bukan silently invalidated.

Untuk migrasi (mis. *"upgrade my codebase to Sonnet 4.6"*), Claude **wajib tanya scope
dulu** (whole working dir / subdir / file list) — karena imperative phrasing seperti
"migrate my codebase" tetap ambigu soal lokasi.

## Kesimpulan

Skill ini adalah pengetahuan lengkap tentang Anthropic SDK terkini — model IDs, surface
selection (Claude API vs tool use vs Managed Agents), prompt caching, adaptive thinking,
prompt cache, streaming, batches, files, error codes, dan migrasi model. Diorganisasi
per-bahasa supaya Claude tidak menebak signature SDK. Diniatkan untuk developer yang
sedang membangun atau memelihara aplikasi LLM dengan Claude — bukan untuk pertanyaan
general LLM atau proyek provider-neutral. Output: kode Anthropic SDK yang idiomatik,
aman untuk produksi, dan tidak terjebak deprecated patterns.
