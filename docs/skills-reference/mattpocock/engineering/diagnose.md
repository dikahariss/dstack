# Diagnose

> **Sumber:** [`skills/engineering/diagnose/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnose/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Bug sulit jarang terpecahkan dengan menatap kode. Kunci diagnosis adalah **feedback loop**: signal pass/fail yang cepat, deterministik, dan dapat dijalankan oleh agent. Begitu loop ada, bisection, hypothesis-testing, dan instrumentasi tinggal mengkonsumsinya. Tanpa loop, debugging berubah menjadi tebak-tebakan. Skill ini memaksa disiplin enam fase — Build feedback loop → Reproduce → Hypothesise → Instrument → Fix + regression test → Cleanup + post-mortem — yang hanya boleh dilewati dengan justifikasi eksplisit.

Investasi waktu paling besar ada di Fase 1: agresif, kreatif, refuse to give up sampai loop yang reliable berdiri. Sisanya mekanis. Untuk regresi performance, ganti "log" dengan "measurement baseline" (timing harness, profiler) dan bisect.

## Kapan menggunakannya

- User bilang "diagnose this", "debug this", "kenapa ini broken/throwing/failing".
- Regresi performance (lambat tiba-tiba).
- Bug intermiten yang sulit di-reproduce.
- Frontmatter description: "Disciplined diagnosis loop for hard bugs and performance regressions."

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Diagnose bug ini — order kadang dibilling dua kali."
- "Debug ini, kenapa endpoint ini throwing 500 secara random?"
- "Ada regresi performa setelah deploy kemarin, tolong diagnose."
- Kata kunci kanonik (EN): `diagnose this`, `debug this`,
  `broken`, `failing`, `performance regression`.

Contoh task lengkap:

> "Fitur checkout kadang gagal dengan error `idempotency key
> collision` — terjadi sekitar 3% dari request. Diagnose: bangun
> feedback loop, reproduce, buat ranked hypothesis, lalu fix
> dengan regression test."

Yang terjadi: agent membangun feedback loop deterministik (failing
test, replay trace, atau differential loop), mereproduksi bug
persis seperti dilaporkan, mempresentasikan 3–5 hypothesis ranked
ke user sebelum instrumentasi, lalu fix + regression test sebelum
cleanup dan post-mortem.

## Cara menggunakannya

1. **Phase 1 — Build a feedback loop**. Coba (urutkan): failing test, curl script, CLI invocation dengan fixture, headless browser, replay captured trace, throwaway harness, property/fuzz, bisection harness, differential loop, HITL bash script. Iterate loop sampai fast, sharp, deterministic.
2. **Phase 2 — Reproduce**. Pastikan loop reproduce **bug yang sebenarnya** dilaporkan user, bukan bug lain yang kebetulan dekat.
3. **Phase 3 — Hypothesise**. Generate 3–5 hypothesis ranked. Tiap hypothesis harus falsifiable ("if X is the cause, then changing Y makes the bug disappear"). Show ke user sebelum testing.
4. **Phase 4 — Instrument**. Tiap probe map ke prediksi spesifik. Satu variabel sekali. Tag tiap log dengan prefix unik `[DEBUG-a4f2]` agar cleanup cuma satu grep. Untuk perf: measure first, fix second.
5. **Phase 5 — Fix + regression test**. Tulis regression test **sebelum** fix, **tapi** hanya bila ada *correct seam*. Bila tidak, dokumentasikan absennya seam sebagai finding.
6. **Phase 6 — Cleanup + post-mortem**. Repro hilang, regression pass, `[DEBUG-]` dihapus, throwaway dihapus, hypothesis yang benar disebut di commit message. Lalu tanya: apa yang akan mencegah bug ini? Bila jawabannya arsitektur, hand-off ke `improve-codebase-architecture`.

## Contoh / Studi kasus

Bug: order kadang dibilling dua kali, ~5% of requests. Phase 1: tidak ada repro deterministik, tapi differential loop dibangun — replay 1000 captured order events ke old version vs new version dan diff hasilnya. Phase 2: differential loop reproduce double-bill di ~5% kasus, persis seperti user lapor. Phase 3: 4 hypothesis ranked — race condition di webhook handler (#1), retry policy salah konfig (#2), dedup key yang collide (#3), bug di idempotency layer (#4). Show ke user; user bilang "#3 mungkin — kita ganti hash function minggu lalu". Phase 4: tambah log tagged `[DEBUG-b71c]` di hash computation; data menunjukkan beberapa order menghasilkan hash sama. Phase 5: tulis property test yang generate 10k order dan assert hash uniqueness — fails. Fix hash function. Test pass. Differential loop drop ke 0% double-bill. Phase 6: cleanup log, post-mortem ditulis di PR.

## Kesimpulan

`diagnose` adalah skill paling padat dan paling sering relevan untuk pekerjaan teknis. Inti pesannya: bangun feedback loop yang baik, semua yang lain tinggal mekanis. Bila tidak bisa bangun loop, berhenti dan minta artifact / akses environment ke user — jangan teruskan ke hypothesise.
