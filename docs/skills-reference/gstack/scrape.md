# Scrape

> **Sumber:** [`scrape/SKILL.md`](https://github.com/garrytan/gstack/blob/main/scrape/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Pull data dari web page adalah workflow harian Haris (riset competitor,
ambil pricing, monitor backlog). Tools mentah seperti `curl` +
parsing lambat dan rapuh; Selenium overkill. `/scrape` menyatukan
dua mode jadi satu entry point: **match path** (~200ms via
browser-skill yang sudah dikodifikasi) dan **prototype path** (~30s
drive page dengan `$B` primitives). Read-only by contract — untuk
mutating flow, ada `/automate` (belum shipped).

Kunci skill ini adalah pasangannya dengan `/skillify`. Pertama kali
user `/scrape` situs baru, ia prototype dengan primitif. Setelah
sukses, satu line nudge: "Say /skillify to make this permanent
(200ms next call)". Sesi berikutnya pada intent yang sama → match
path, instant.

## Kapan menggunakannya

Trigger di `description`:

- "scrape", "get data from", "pull", "extract from"
- "what's on" (a page)
- Trigger field: `scrape this page`, `get data from`, `pull from`,
  `extract from`, `what is on`

Pakai untuk: pull data terstruktur dari single page (HN top stories,
product list dari e-commerce, GitHub PR list). Multi-page crawl
out-of-scope (tulis skill terpisah atau parametrize via `args:`).

Versi: `1.0.0`.

## Cara menggunakannya

1. **Step 1 Intent** — user request setelah `/scrape` jadi intent.
   Jika kosong, tanya sekali: "What do you want to scrape?
   Describe in one line, e.g. 'top stories on HN'".
2. **Step 2 Refuse mutating** — jika intent mengandung verb tulis
   (submit, post, send, log in, click X, fill form, delete, create,
   order, book), refuse + route ke `/automate`. STOP.
3. **Step 3 Match phase** — `$B skill list` + `$B skill show
   <name>` untuk setiap skill yang mungkin cocok. Confident match
   butuh **3 syarat**: domain match host, triggers/description cover
   data yang diminta, intent tidak butuh args yang skill tidak
   declare. Jika ambiguous, pilih tier lebih sempit (project >
   global > bundled). Jika masih ambiguous, fall through ke
   prototype.
4. **Match success** — `$B skill run <name> [--arg key=value]`,
   emit JSON ke stdout. STOP.
5. **Step 4 Prototype phase**:
   - `$B goto <url>` — navigate.
   - `$B snapshot --text` (atau `$B text`) — clean text view untuk
     cari selector.
   - `$B html` — raw HTML untuk parse list/table.
   - `$B links` — gather URLs.
   - Iterate selector → check output → refine.
6. **Output** — JSON document satu baris di stdout, shape stabil
   `{"items": [...], "count": N}`. Stderr/chat untuk log + skillify
   nudge.
7. **Step 5 Skillify nudge** — append satu line: "Say /skillify to
   make this a permanent skill (200ms on next call)." Tidak nag.
8. **Failure** — jika 3-4 selector attempt gagal: report apa yang
   dicoba + apa yang blocking (lazy-load, JS-render, paywall). NO
   partial result. NO skillify nudge on broken prototype. Ask: try
   different selector / different page / stop.

## Contoh / Studi kasus

```
/scrape top 10 stories on Hacker News with score and comment count
```

Match phase: `$B skill list` → ada `hn-top-stories` skill, host
`news.ycombinator.com`, triggers include "top stories on hn". Match.

`$B skill run hn-top-stories --arg limit=10` →

```json
{"items":[{"title":"...","score":342,"comments":127,"url":"..."},...],"count":10}
```

Done in ~200ms.

Sesi kedua: `/scrape product prices on store.example.com/laptops`.
Match phase miss. Prototype:

1. `$B goto store.example.com/laptops`
2. `$B snapshot --text` → terlihat `.product-card` dengan `.name`,
   `.price`.
3. `$B html | grep product-card` → confirm structure.
4. Generate JSON:

```json
{"items":[{"name":"...","price":12999000,"currency":"IDR"},...],"count":24}
```

Append: "Say /skillify to make this a permanent skill (200ms on
next call)."

## Kesimpulan

`/scrape` adalah primitif data extraction gstack dengan strategi
"first run cheap to write, repeat runs cheap to run". Match-vs-
prototype split memungkinkan gradual codification — user tidak harus
menulis skill formal, cukup pakai `/scrape` lalu opt-in
`/skillify` ketika intent terbukti reusable.
