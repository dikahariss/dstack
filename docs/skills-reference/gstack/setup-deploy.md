# Setup Deploy

> **Sumber:** [`setup-deploy/SKILL.md`](https://github.com/garrytan/gstack/blob/main/setup-deploy/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

`/land-and-deploy` butuh tahu: di platform mana app deploy, apa URL
produksi, bagaimana cek deploy success, command apa untuk verify
health. Tanpa info ini, skill harus tanya tiap kali — boring,
error-prone. `/setup-deploy` mendeteksi platform (Fly.io, Render,
Vercel, Netlify, Heroku, GitHub Actions, custom) otomatis dari file
config di repo, lalu tulis konfigurasi terpusat ke CLAUDE.md sehingga
deploy berikutnya otomatis.

Skill ini idempotent: bisa dijalankan ulang untuk reconfigure tanpa
risiko merusak settings lain.

## Kapan menggunakannya

Trigger di `description`:

- "setup deploy", "configure deployment", "set up land-and-deploy"
- "how do I deploy with gstack", "add deploy config"
- Trigger field: `configure deploy`, `setup deployment`,
  `set deploy platform`

Pakai sekali per project saat onboarding, atau ketika platform
deploy berubah.

Versi: `1.0.0`, `preamble-tier: 2`.

## Cara menggunakannya

1. **Step 1 Detection** — cek file:
   - `fly.toml` → Fly.io
   - `render.yaml` → Render
   - `vercel.json` atau `.vercel/` → Vercel
   - `netlify.toml` → Netlify
   - `Procfile` + Heroku remote → Heroku
   - `.github/workflows/deploy*.yml` → GitHub Actions
   - tidak ada → Custom/Manual
2. **Step 2 Project type detection** — package.json dengan `"bin"` →
   CLI; `.gemspec` → library; default → web app/API.
3. **Step 3 Platform-specific setup**:
   - **Fly.io** — extract app name dari `fly.toml`, cek `fly` CLI,
     verify dengan `fly status`, infer URL `https://{app}.fly.dev`,
     set deploy status command + health check.
   - **Render** — extract service name, check `RENDER_API_KEY` (tanpa
     expose), infer URL `https://{service}.onrender.com`. Render
     auto-deploy on push.
   - **Vercel** — check `vercel` CLI, `vercel ls --prod`. Auto-deploy
     on push (preview on PR, prod on merge to main).
   - **Netlify** — extract dari netlify.toml, auto-deploy.
   - **GitHub Actions only** — baca workflow, extract deploy target,
     tanya URL.
   - **Custom/Manual** — AskUserQuestion sequence: how deploys
     triggered (auto on push / GH Actions / CLI / manual / no deploy),
     production URL, success check method (HTTP health / CLI command /
     GH Actions status / just URL loads), pre-merge / post-merge
     hooks.
4. **Step 4 Write configuration** — temukan `## Deploy Configuration`
   section di CLAUDE.md, replace; jika tidak ada, append di akhir.
   Section berisi: platform, production URL, deploy workflow, deploy
   status command, merge method, project type, post-deploy health
   check, custom deploy hooks.
5. **Step 5 Verify** — test health check URL (`curl -sf`), test
   deploy status command. Jika gagal, report tanpa block (config
   tetap berguna).
6. **Step 6 Summary** — block ASCII ringkasan config + next steps
   ("Run /land-and-deploy" / "Edit CLAUDE.md" / "Run /setup-deploy
   again").

## Contoh / Studi kasus

Repo dengan `vercel.json`.

```
/setup-deploy
```

Detect: Vercel. Verify `vercel ls --prod` → "myapp - production at
myapp.vercel.app". Tanya user "Confirm production URL
https://myapp.vercel.app?" → Y.

Write ke CLAUDE.md:

```
## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://myapp.vercel.app
- Deploy workflow: auto-deploy on push to main
- Deploy status command: vercel ls --prod
- Merge method: squash
- Project type: web app
- Post-deploy health check: https://myapp.vercel.app
```

Health check curl: HTTP 200. Summary printed. `/land-and-deploy`
sekarang bisa otomatis tahu apa yang harus dimonitor post-merge.

## Kesimpulan

`/setup-deploy` adalah skill konfigurasi sekali pakai yang memberi
skill deploy gstack (`/ship`, `/land-and-deploy`, `/canary`) data
yang mereka butuhkan untuk verify deploy success tanpa interrogation
ulang setiap kali. CLAUDE.md sebagai single source of truth membuat
konfigurasi tetap discoverable di sesi mendatang.
