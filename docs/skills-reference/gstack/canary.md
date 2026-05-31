# Canary — Post-Deploy Visual Monitor

> **Sumber:** [`canary/SKILL.md`](https://github.com/garrytan/gstack/blob/main/canary/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Deploy bisa lulus CI tapi pecah di produksi: env variable hilang, CDN serve aset stale, migrasi DB lebih lambat di data nyata. Window 10 menit pertama setelah deploy adalah waktu paling berbahaya — semua user "early adopter" yang load app paling sering kena. `/canary` jadi safety net antara "shipped" dan "verified": monitor halaman produksi setiap 60 detik, bandingkan dengan baseline (yang dicapture sebelum deploy), dan alert kalau ada console error baru, regresi performa, atau page load failure.

Kuncinya adalah relative comparison: 3 console error di baseline = oke; 1 error BARU = alert. Jadi tidak cry wolf untuk hal yang memang sudah broken sebelum deploy.

## Kapan menggunakannya

- Voice trigger: "monitor deploy", "canary", "post-deploy check", "watch production", "verify deploy", "monitor after deploy".
- Setelah `/land-and-deploy` atau merge ke main yang trigger deploy.
- Mode `--baseline` dijalankan **sebelum** deploy (capture state baseline).
- Mode default dijalankan **setelah** deploy (continuous monitor 10 menit, default).
- Mode `--quick` untuk single-pass health check tanpa loop monitoring.
- Mode `--duration 5m` untuk customize window (1m sampai 30m).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Monitor produksi 10 menit setelah deploy ini."
- "Capture baseline sebelum aku push ke prod."
- "Verify deploy — pastikan tidak ada error baru di /checkout."
- Kata kunci kanonik (EN): `/canary`, `monitor deploy`, `post-deploy
  check`, `watch production`, `verify deploy`.

Contoh task lengkap:

> "Sebelum merge PR pricing-v2: `/canary https://api.maritimhub.com
> --baseline --pages /,/pricing,/checkout`. Setelah deploy selesai,
> jalankan `/canary https://api.maritimhub.com --duration 10m` untuk
> monitor dan alert kalau ada console error baru atau load time >2x."

Yang terjadi: mode `--baseline` capture screenshot + console errors
+ perf tiap halaman lalu berhenti; mode monitoring loop tiap 60
detik bandingkan terhadap baseline, alert CRITICAL/HIGH/MEDIUM/LOW
hanya bila pola muncul 2+ check berurutan (anti-transient), dan
laporan akhir mengeluarkan verdict HEALTHY/DEGRADED/BROKEN.

## Cara menggunakannya

1. Browse daemon harus ter-build (SETUP check di skill).
2. **Pre-deploy**: `/canary https://prod.maritimhub.com --baseline`
   - Untuk setiap halaman: `$B goto`, `$B snapshot -i -a -o baseline.png`, `$B console --errors`, `$B perf`, `$B text`.
   - Simpan ke `.gstack/canary-reports/baseline.json` dan baseline screenshots.
   - STOP dengan pesan "Baseline captured. Deploy your changes, then run `/canary <url>`".
3. **Deploy** lewat workflow biasanya.
4. **Post-deploy**: `/canary https://prod.maritimhub.com`
   - Phase 3 auto-discover halaman atau pakai `--pages`.
   - Phase 4 ambil snapshot pre-monitoring (kalau baseline tidak ada).
   - Phase 5 loop monitor: tiap 60s, screenshot + console + perf, bandingkan vs baseline.
   - Alert types:
     - **CRITICAL**: page load failure
     - **HIGH**: console error baru (tidak ada di baseline)
     - **MEDIUM**: load time >2x baseline
     - **LOW**: link 404 baru
   - Hanya alert kalau pola persist 2+ consecutive checks (anti-transient).
6. Phase 6 health report final + verdict HEALTHY / DEGRADED / BROKEN.
7. Phase 7 opsi update baseline kalau deploy healthy.

Output: `.gstack/canary-reports/{date}-canary.md` + `.json`, plus screenshots di `.gstack/canary-reports/screenshots/`.

## Contoh / Studi kasus

Haris deploy refactor API endpoint pricing di maritimhub:
- Pre-deploy: `/canary https://api.maritimhub.com/pricing --baseline --pages /,/pricing,/checkout` → baseline captured.
- Deploy via `/land-and-deploy`.
- Post-deploy: `/canary https://api.maritimhub.com/pricing --duration 10m`.
- Check #2 (120s): `/checkout` menunjukkan 1 console error baru: `Failed to fetch /api/v2/pricing/calculate`.
- Check #3 (180s): error masih ada → CRITICAL alert dengan screenshot evidence.
- AskUserQuestion: A) Investigate, B) Continue (mungkin transient), C) Rollback, D) Dismiss.
- Haris pilih C → rollback. Root cause: env var `PRICING_V2_URL` tidak diset di prod.

## Kesimpulan

`/canary` mengubah deploy dari "hope and pray" jadi "ship and verify". Read-only — ia observe dan report, tidak modifikasi kode kecuali user explicit minta. Kombinasi dengan `/land-and-deploy` (yang opsional jalankan canary verification otomatis) bikin pipeline ship → deploy → verify jadi satu alur tanpa harus stare ke dashboard manual. Aturan emas: selalu capture baseline sebelum deploy — tanpa baseline, canary cuma health check biasa.
