# Benchmark — Performance Regression Detection

> **Sumber:** [`benchmark/SKILL.md`](https://github.com/garrytan/gstack/blob/main/benchmark/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Performa web jarang turun karena satu regresi besar — dia mati pelan-pelan, +50ms di sini, +20KB di sana. Setelah beberapa PR, page load yang tadinya 800ms tiba-tiba jadi 3 detik dan tidak ada yang tahu kapan persisnya berubah. `/benchmark` membangun baseline yang reproducible dari Core Web Vitals (FCP, LCP), TTFB, bundle size, dan jumlah request, lalu membandingkan PR sekarang dengan baseline tersebut. Setiap PR jadi punya "before/after numbers" yang bisa di-cite di review.

Skill ini juga melacak tren historis — kalau bundle JS naik 50KB/minggu selama 8 minggu, dia akan menampilkannya sebagai "TREND: performance degrading" sehingga tim bisa intervensi sebelum jadi krisis.

## Kapan menggunakannya

- Sebelum dan sesudah perubahan yang berpotensi mempengaruhi performa (refactor, dependency baru, perubahan SSR/CSR).
- Voice trigger: "performance", "benchmark", "page speed", "lighthouse", "web vitals", "bundle size", "load time", "speed test".
- Saat user bilang "kok loading-nya lebih lama ya?" — `/benchmark <url> --quick` untuk single-pass check.
- Mode `--baseline` dijalankan **sebelum** perubahan; mode default dijalankan **sesudah** untuk komparasi.
- Mode `--diff` membatasi audit hanya ke halaman yang terpengaruh oleh diff branch.
- Mode `--trend` menampilkan grafik historis 5 benchmark terakhir.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Cek performa halaman setelah aku tambah library chart baru."
- "Kok loading-nya lebih lama? Quick check dulu."
- "Capture baseline sebelum aku mulai refactor SSR-nya."
- Kata kunci kanonik (EN): `/benchmark`, `performance`, `web
  vitals`, `bundle size`, `page speed`, `lighthouse`.

Contoh task lengkap:

> "Sebelum aku merge branch `feat/chart-integration`, capture
> baseline dulu: `/benchmark https://app.staging.local --baseline`.
> Nanti setelah merge jalankan `/benchmark https://app.staging.local`
> untuk lihat apakah LCP atau JS bundle naik lebih dari 25%."

Yang terjadi: skill mengumpulkan metrik nyata (TTFB, FCP, LCP,
ukuran bundle JS/CSS) via `$B perf` dan `performance.getEntries()`,
membandingkan dengan baseline, lalu melaporkan REGRESSION / WARNING /
OK per metrik dengan threshold 50%/>500ms untuk timing dan 25%
untuk bundle.

## Cara menggunakannya

1. Pastikan browse daemon sudah ter-build (`$B` resolved via SETUP check).
2. Invoke `/benchmark <url>` (atau pakai flag sesuai kebutuhan).
3. Phase 1-2 setup direktori `.gstack/benchmark-reports/` dan discover halaman (auto dari nav atau `--pages /,/dashboard`).
4. Phase 3 collect metrik per halaman via `$B perf` dan JavaScript eval terhadap `performance.getEntriesByType('navigation' | 'resource')`:
   - TTFB, FCP, LCP, DOM Interactive/Complete, Full Load
   - Resource analysis (top 15 by duration, by type)
   - Bundle size (script + css)
5. Phase 4: `--baseline` mode menulis `.gstack/benchmark-reports/baselines/baseline.json` dan stop.
6. Phase 5 compare current vs baseline. Threshold regresi: timing >50% atau >500ms = REGRESSION; bundle >25% = REGRESSION.
7. Phase 6-7 tampilkan top 10 slowest resources, performance budget check (FCP <1.8s, LCP <2.5s, JS <500KB, dll).
8. Phase 8 trend (mode `--trend`) baca historical baseline.
9. Phase 9 simpan report ke `.gstack/benchmark-reports/{date}-benchmark.md` dan `.json`.

Dependency utama: skill `browse` (daemon headless Chromium).

## Contoh / Studi kasus

Haris menambah library chart baru. Sebelum merge:
- `/benchmark https://app.staging.local --baseline` capture: LCP 800ms, JS bundle 450KB, Grade A.
- Selesai develop, jalankan `/benchmark https://app.staging.local`.
- Output menunjukkan: LCP 1600ms (+800ms, REGRESSION), JS bundle 720KB (+270KB / +60%, REGRESSION).
- Top slowest resources mengidentifikasi `chart-vendor.js` 320KB sebagai biang kerok.
- Rekomendasi: code-split chart, lazy load jika di-render di bawah fold.
- Haris terapkan saran, rerun benchmark → kembali ke Grade A.

## Kesimpulan

`/benchmark` mengubah opini ("ini terasa lambat") menjadi data ("FCP +30ms, LCP +800ms, JS +60%"). Sifatnya read-only: ia mengukur dan melapor, tidak mengubah kode. Pasangkan dengan `/canary` untuk monitoring pasca-deploy dan `/health` untuk dashboard kualitas kode — tiga skill ini bersama membentuk safety net kualitas produksi gstack.
