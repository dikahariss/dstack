# Connect Chrome — Launch GStack Browser

> **Sumber:** [`connect-chrome/SKILL.md`](https://github.com/garrytan/gstack/blob/main/connect-chrome/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Headless browse cukup untuk QA, tapi ada dua kekurangan: (1) user tidak bisa melihat agent bekerja realtime, dan (2) ada situs (Google, NYT, anti-bot) yang menolak headless. `/connect-chrome` (yang exposed sebagai `/open-gstack-browser` di SKILL.md) menyelesaikan keduanya: launch headed Chromium (rebranded "GStack Browser") dengan extension sidebar yang menampilkan activity feed live, plus stealth patches anti-bot.

Cocok untuk pair-programming session di mana user ingin lihat "Claude sekarang klik tombol apa", atau untuk akses situs yang fingerprint Playwright defaults.

## Kapan menggunakannya

- Sebelum jalankan skill QA (`/qa`, `/design-review`, `/benchmark`) yang ingin user pantau langsung.
- Saat scraping atau testing situs anti-bot (Cloudflare, captcha, fingerprinting).
- Untuk demo flow ke stakeholder — mereka lihat Chrome window asli dengan sidebar feed.
- Saat butuh sidebar chat (child Claude instance yang execute natural-language commands di browser).
- Tidak perlu untuk QA headless biasa — pakai `/browse` langsung saja.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buka GStack Browser supaya aku bisa lihat Chrome-nya langsung."
- "Connect ke Chrome headed, mau demo QA ke partner sekarang."
- "Launch browser yang bisa keliatan, ada situs anti-bot yang perlu dicek."
- Kata kunci kanonik (EN): `/connect-chrome`, `open gstack browser`,
  `launch chrome`, `real browser`.

Contoh task lengkap:

> "/connect-chrome — mau pair session review fitur `ShipmentTracker`
> di MaritimHub bersama partner. Pastikan Side Panel terbuka dan
> aktifitas agent kelihatan di feed, lalu jalankan `/qa` supaya
> partner bisa lihat setiap klik di Chrome window."

Yang terjadi: skill kill proses browse lama, bersihkan Chromium
lock, launch headed Chromium di port 34567 dengan extension sidebar,
konfirmasi `Mode: headed`, minta user pin extension di toolbar, demo
navigasi ke satu URL sambil memperlihatkan feed di Side Panel — lalu
siap dipakai bersama skill QA lain dalam sesi yang sama.

## Cara menggunakannya

1. Pastikan browse binary ter-build.
2. Invoke `/connect-chrome` (atau `/open-gstack-browser`).
3. **Step 0: Pre-flight cleanup** — kill stale browse server dari `.gstack/browse.json`, hapus SingletonLock/Socket/Cookie di profile dir untuk avoid lock conflict.
4. **Step 1: Connect** — `$B connect`. Launch GStack Browser (rebranded Chromium headed) di port **34567** dengan:
   - Window visible (terpisah dari Chrome user biasa)
   - Extension sidebar auto-loaded via `launchPersistentContext`
   - Anti-bot stealth patches (Google, NYT, dll. lewat tanpa captcha)
   - Custom user agent + GStack Browser branding
5. **Step 2: Verify** — `$B status` confirm `Mode: headed`. Cari path extension untuk troubleshoot jika perlu.
6. **Step 3: Guide ke Side Panel** — instruksi user untuk pin extension via puzzle-piece icon, klik gstack icon, open Side Panel di kanan.
7. **Step 4: Demo** — `$B goto https://news.ycombinator.com` lalu `$B snapshot -i`. User lihat command muncul di activity feed.
8. **Step 5: Sidebar chat** — explanation ke user bahwa chat tab di Side Panel = child agent yang bisa execute "fill login form and submit" lalu run di browser.
9. **Step 6: What's next** — user bisa run skill apa saja (`/qa`, `/design-review`, dll) dan agent action akan tampil di Chrome window + Side Panel feed realtime.

Window management commands: `$B focus` (bring to foreground macOS), `$B disconnect` (close headed, return ke headless).

## Contoh / Studi kasus

Haris pair dengan partner via video call untuk QA fitur baru di MaritimHub:
- Invoke `/connect-chrome`. Pre-flight clean, Chrome headed launch, Side Panel ter-pin.
- Demo: `$B goto https://maritimhub.com/admin`. Partner lihat browser nyata bergerak.
- Haris run `/qa` → setiap action (`goto`, `click`, `snapshot`, `is visible`) tampil sebagai bullet di activity feed sidebar.
- Pas ada error, partner langsung lihat console error tanpa share-screen tambahan.
- Sebelum tutup session, `$B disconnect` untuk kembali ke headless mode.

## Kesimpulan

`/connect-chrome` adalah upgrade visibility untuk session yang melibatkan observasi (demo, debugging interactive, anti-bot test). Tidak menggantikan `/browse` headless — ia memperkaya dengan window visible + sidebar feed. Setelah connect, semua skill QA gstack otomatis pakai headed mode tanpa konfigurasi tambahan. Aturan praktis: pakai untuk demo dan situs anti-bot; pakai headless untuk CI atau batch testing.
