# Setup Browser Cookies

> **Sumber:** [`setup-browser-cookies/SKILL.md`](https://github.com/garrytan/gstack/blob/main/setup-browser-cookies/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Banyak QA, scrape, atau benchmark workflow butuh sesi authenticated.
Login manual via Playwright headless setiap kali tidak praktis;
2FA/OTP berkali-kali bikin frustrasi. `/setup-browser-cookies`
mengimpor cookie dari Chromium asli user (Chrome, Brave, Edge, Comet,
dst.) ke sesi browse headless gstack — domain dipilih sendiri lewat
UI picker interactive.

Skill ini juga aware **CDP mode**: jika browse sudah terhubung ke
real browser via Chrome DevTools Protocol (misalnya via
`/open-gstack-browser` headed), cookies sudah tersedia dan skill
exit dengan pesan informatif tanpa import ulang.

## Kapan menggunakannya

Trigger di `description`:

- "import cookies", "login to the site", "authenticate the browser"
- Trigger field: `import browser cookies`, `login to test site`,
  `setup authenticated session`

Pakai sebelum QA halaman authenticated, sebelum scrape area
membership-only, atau ketika perlu test admin dashboard yang butuh
session existing.

Versi: `1.0.0`, `preamble-tier: 1` (preamble minimal).

## Cara menggunakannya

1. **CDP mode check** — `$B status | grep "Mode: cdp"`. Jika true,
   skill bilang: "Not needed — you're connected to your real browser
   via CDP. Your cookies and sessions are already available." STOP.
2. **Find browse binary** — SETUP block standar (`browse/dist/browse`).
   Build via `./setup` jika perlu.
3. **Buka cookie picker** — `$B cookie-import-browser`. Auto-detect
   Chromium installed (macOS/Linux), buka UI picker di default
   browser. User bisa:
   - Switch antara browser installed.
   - Search domain.
   - Klik "+" untuk import cookie domain.
   - Klik trash untuk remove imported cookies.
4. Beritahu user: "Cookie picker opened — select domains, tell me
   when done."
5. **Direct import (alternatif)** — jika user spesifik domain
   (`/setup-browser-cookies github.com`), skip UI:
   `$B cookie-import-browser comet --domain github.com`.
6. **Verify** — setelah user confirm done, jalankan `$B cookies` dan
   tampilkan ringkasan (domain counts, no cookie values exposed).

## Contoh / Studi kasus

```
/setup-browser-cookies
```

CDP mode false. Skill jalankan `$B cookie-import-browser`. UI picker
muncul di tab browser baru, list domain dari Chrome user. Haris
search "github.com", klik "+". Search "vercel.com", klik "+". Tutup
tab. Bilang ke Claude "done".

Skill jalankan `$B cookies` → "github.com: 12 cookies imported,
vercel.com: 8 cookies imported." Sesi browse headless sekarang
logged in ke kedua situs. `/qa github-dashboard` atau `/scrape vercel
deployments` bisa langsung bekerja.

Alternatif singkat:

```
/setup-browser-cookies github.com
```

Skill skip UI, jalankan `$B cookie-import-browser comet --domain
github.com` langsung.

## Kesimpulan

`/setup-browser-cookies` menjembatani sesi authenticated browser asli
user dengan sesi headless automation tanpa harus repeat login. Picker
UI memberi user control granular (hanya domain yang dipilih), dan
CDP-mode check mencegah skill jalan tidak perlu ketika user sudah
pakai headed browser. Wajib paired dengan `/qa` atau `/scrape` untuk
target authenticated.
