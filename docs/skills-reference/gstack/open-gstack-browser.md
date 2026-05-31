# Open Gstack Browser

> **Sumber:** [`open-gstack-browser/SKILL.md`](https://github.com/garrytan/gstack/blob/main/open-gstack-browser/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Sebagian besar workflow gstack berkaitan dengan browser otomatis (`/qa`,
`/design-review`, `/benchmark`, `/scrape`). Defaultnya headless — cepat
tapi user tidak melihat apa yang sedang terjadi. `/open-gstack-browser`
menukar mode itu dengan headed Chromium yang terlihat di layar, dilengkapi
sidebar extension yang menampilkan activity feed live + tab chat agar
user bisa mengetik perintah natural ke sidebar agent.

Browser ini bukan Chrome biasa: ia adalah Playwright Chromium dengan
rebrand "GStack Browser" (Dock icon, menu bar, user-agent custom),
anti-bot stealth patches (Google dan NYTimes lewat tanpa CAPTCHA), dan
profil persisten di `~/.gstack/chromium-profile`. Cocok untuk sesi
debugging visual, demo ke stakeholder, atau handoff ke agent lain via
`/pair-agent`.

## Kapan menggunakannya

Trigger di frontmatter `description`:

- "open gstack browser", "launch browser", "connect chrome"
- "open chrome", "real browser", "launch chrome"
- "side panel", "control my browser"
- Voice trigger: "show me the browser"

Trigger di `triggers`: `open gstack browser`, `launch chromium`, `show
me the browser`.

Pakai ketika user ingin menonton agent bekerja real-time (presentasi,
debugging UI bug yang sulit reproduce, atau hand-off ke remote agent).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buka browser biar aku bisa lihat agent bekerja langsung."
- "Launch gstack browser untuk demo ke klien."
- "Tampilkan browser real — aku mau pantau QA secara visual."
- Kata kunci kanonik (EN): `/open-gstack-browser`,
  `open gstack browser`, `launch browser`, `show me the browser`.

Contoh task lengkap:

> "/open-gstack-browser — aku mau demo /qa ke klien sambil
> mereka melihat langsung setiap step yang dijalankan di
> browser, termasuk klik, screenshot, dan console error."

Yang terjadi: skill membuild binary browse jika belum ada,
membersihkan stale server dan Chromium lock, lalu menjalankan
`$B connect` dalam headed mode di port 34567. Chromium terbuka
dengan branding GStack Browser, sidebar extension auto-load,
dan activity feed live tampil di panel kanan. Setiap command
agent (`$B goto`, `$B snapshot`, dll) terlihat real-time di
window tersebut.

## Cara menggunakannya

Skill berjalan 6 langkah:

1. **SETUP** — cari binary `browse/dist/browse`, build via `./setup`
   jika belum ada.
2. **Pre-flight cleanup** — bunuh stale browse server, hapus
   `SingletonLock` Chromium yang mungkin nyangkut dari crash sebelumnya.
3. **Step 1 connect** — jalankan `$B connect`. Skill memastikan mode
   `headed` dan port `34567` (fixed agar extension auto-connect).
4. **Step 2 verify** — `$B status`; baca port dari
   `.gstack/browse.json`; cari `EXTENSION_PATH` untuk manual loading.
5. **Step 3 guide ke Side Panel** — instruksikan user klik puzzle piece
   → pin "gstack browse" → klik icon untuk membuka panel. Fallback:
   `chrome://extensions` → Load unpacked dari `EXTENSION_PATH`.
6. **Step 4 demo** — `$B goto news.ycombinator.com` lalu `$B snapshot
   -i`. User harus melihat command muncul di activity feed.
7. **Step 5 sidebar chat** — beritahu user bisa ketik bebas; sidebar
   agent (child Claude instance) akan eksekusi di browser.

Step 6 (penutup) menyebut kemampuan: `$B focus`, `$B disconnect`, dan
fakta bahwa setiap skill gstack (qa, design-review, benchmark) sekarang
berjalan visible di window itu.

## Contoh / Studi kasus

Haris ingin demo `/qa` ke klien.

```
/open-gstack-browser
```

Skill membuka Chromium dengan golden shimmer line di atas, sidebar
panel muncul. Lalu Haris jalankan `/qa https://staging.myapp.com`. Klien
melihat di window kanan: page load → screenshot → snapshot interactive
→ click form fields → console errors. Setiap command juga muncul di
sidebar activity feed dengan timestamp.

Selesai demo: `$B disconnect` mengembalikan ke headless mode tanpa
mengganggu profile Chromium user.

## Kesimpulan

`/open-gstack-browser` mengubah headless automation menjadi observable
automation. Bagi user yang baru menggunakan gstack, ini juga jadi cara
paling efektif untuk membangun trust — melihat agent klik dan navigate
nyata jauh lebih meyakinkan daripada baca log JSON.
