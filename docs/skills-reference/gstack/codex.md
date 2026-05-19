# Codex — Multi-AI Second Opinion

> **Sumber:** [`codex/SKILL.md`](https://github.com/garrytan/gstack/blob/main/codex/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Claude review punya blind spot yang sistematik — beberapa kelas bug selalu dia missed. OpenAI Codex CLI (yang membungkus GPT-5 high-reasoning) punya distribusi blind spot berbeda: lebih ketat di security, lebih terus terang di "your code is over-engineered", lebih jago menangkap race condition. `/codex` membungkus Codex CLI sebagai "200 IQ autistic developer" yang memberi independent second opinion — direct, terse, technically precise, dan tidak segan menantang asumsi.

Output Codex disampaikan **verbatim** (tidak diparafrase atau diringkas), supaya user lihat persis cara Codex berpikir, bukan filter Claude.

## Kapan menggunakannya

- Voice trigger: invoke `/codex` atau `/codex review`, `/codex challenge`, `/codex <prompt>`.
- Sebelum merge PR penting — second opinion code review.
- Saat butuh adversarial review ("try to break this").
- Saat ada keputusan arsitektur sulit dan ingin tahu pandangan model lain.
- Mode `--xhigh` untuk maximum reasoning effort (lambat tapi paling teliti).
- Tidak cocok untuk task trivial — Codex call cost API real.

## Cara menggunakannya

1. Pastikan Codex CLI terinstall: `npm install -g @openai/codex`.
2. Pastikan auth aktif: `codex login` atau set `$CODEX_API_KEY` / `$OPENAI_API_KEY`.
3. Skill jalankan preflight di Step 0.4-0.5: cek binary, auth probe multi-signal (lewat `bin/gstack-codex-probe`), warn versi CLI known-bad.
4. Step 1 deteksi mode:
   - `/codex review` atau `/codex review <instructions>` → **Review Mode** (Step 2A): jalankan `codex review` dengan diff branch, parse `[P1]` markers untuk PASS/FAIL gate.
   - `/codex challenge` atau `/codex challenge <focus>` → **Challenge Mode** (Step 2B): adversarial review.
   - `/codex` tanpa args → auto-detect (diff ada? plan file ada?).
   - `/codex <anything else>` → **Consult Mode** (Step 2C): prompt sebagai input.
5. Reasoning effort default: `high` (review/challenge), `medium` (consult). `--xhigh` override untuk maximum.
6. **Filesystem Boundary**: setiap prompt ke Codex selalu prefix dengan instruksi "Do NOT read ~/.claude/, .claude/skills/, agents/openai.yaml" — supaya Codex tidak ke-distract baca skill files yang bukan untuk dia.
7. Output Codex ditampilkan verbatim dalam blok `CODEX SAYS:`.
8. **Synthesis recommendation** (REQUIRED): satu baris `Recommendation: <action> because <reason referensi finding spesifik>`.
9. **Cross-model comparison**: kalau `/review` Claude sudah jalan di session yang sama, bandingkan finding overlap.
10. Hasil review di-persist via `bin/gstack-review-log` ke JSONL.

File pendukung penting:
- `bin/gstack-codex-probe` — preflight auth + version check.
- `bin/gstack-paths` — resolve `$PLAN_ROOT` dan `$TMP_ROOT` portable.
- `bin/gstack-review-log` — log review result untuk Review Readiness Dashboard.

## Contoh / Studi kasus

Haris baru ship refactor auth flow di maritimhub:
- Run `/codex review`.
- Codex output: 1 P1 finding (`auth-middleware.ts:67 — session token comparison uses string equality, vulnerable to timing attack — use crypto.timingSafeEqual`), 2 P2 findings.
- Gate: FAIL (ada P1).
- Recommendation line: "Fix the timing-attack vulnerability at auth-middleware.ts:67 first because exploit gives session hijack, and the fix is 2 lines — vs the P2 finding about code style which doesn't change runtime behavior."
- Cross-model analysis: Claude `/review` sebelumnya tidak menangkap timing attack (focused di logic flow). Agreement rate 33% (1 of 3 findings overlap).
- Haris fix timing attack lebih dulu, rerun /codex review → GATE: PASS, lanjut ship.

## Kesimpulan

`/codex` adalah second opinion yang reliable: independent model, verbatim output, dan synthesis recommendation yang mengikat ke finding spesifik (bukan "looks good"). Cocok dipakai di Phase 3 `/autoplan` (otomatis terpanggil) atau standalone sebelum merge. Cost ada (API call), jadi prioritaskan untuk PR berisiko. Pasangkan dengan `/review` Claude untuk cross-model comparison — overlap finding adalah sinyal kuat untuk fix duluan.
