# Land and Deploy — Merge, Deploy, Verify

> **Sumber:** [`land-and-deploy/SKILL.md`](https://github.com/garrytan/gstack/blob/main/land-and-deploy/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Dua kerjaan paling menyiksa di software: (1) merge yang break prod, (2) merge yang stuck 45 menit di queue sambil staring screen. `/land-and-deploy` adalah skill release-engineer yang handle keduanya: merge efisien, wait intelligently, verify thoroughly, dan kasih verdict yang jelas. Skill ini pickup dari `/ship` (yang bikin PR) dan ambil alih: merge PR, wait deploy workflow, run canary verification, present final report HEALTHY / DEGRADED.

Skill mostly automated — tidak tanya konfirmasi tiap step kecuali ada stake nyata. First-run punya dry-run khusus yang map dan validate deploy infrastructure (platform detection, CLI availability, URL reachability) sebelum touch apapun.

## Kapan menggunakannya

- Setelah `/ship` create PR dan user siap deploy.
- Voice trigger routing: "ship/deploy/PR".
- Argumen:
  - `/land-and-deploy` — auto-detect PR, no post-deploy URL.
  - `/land-and-deploy <url>` — auto-detect, verify deploy at URL.
  - `/land-and-deploy #123` — specific PR.
  - `/land-and-deploy #123 <url>` — both.

## Cara menggunakannya

Skill stop hanya untuk:
- First-run dry-run validation (Step 1.5)
- Pre-merge readiness gate (Step 3.5)
- gh CLI tidak authed, no PR found, CI failure, merge conflict, permission denied, deploy workflow failure (offer revert), production health issue.

Never stop untuk: pilih merge method (auto-detect), timeout warnings (warn & continue).

**Step 1: Pre-flight** — `gh auth status`, parse args, detect PR via `gh pr view --json`, validate state (no PR → STOP, MERGED → suggest `/canary`, CLOSED → reopen first, OPEN → continue).

**Step 1.5: First-run dry-run** — kalau `~/.gstack/projects/$SLUG/land-deploy-confirmed` tidak ada (atau hash deploy config berubah):
- **1.5a Deploy infrastructure detection** — parse `## Deploy Configuration` di CLAUDE.md, auto-detect platform: `fly.toml` (fly), `render.yaml` (render), `vercel.json`/`.vercel` (vercel), `netlify.toml`, `Procfile` (heroku), `railway.json`. Detect deploy workflows di `.github/workflows/*`.
- **1.5b Command validation** — test gh auth, platform CLI (`fly status`, `heroku releases`, `vercel ls`), curl prod URL.
- **1.5c Staging detection** — staging URL di CLAUDE.md, staging workflow file, Vercel/Netlify preview deploys via `gh pr checks`.
- **1.5d Readiness preview** — `gstack-review-read`, check CHANGELOG/VERSION updated.
- **1.5e Dry-run confirmation** — present infra table + warnings, AskUserQuestion: A) match, B) something off, C) /setup-deploy first.
- Validation failures = WARNINGs, bukan BLOCKERS (kecuali gh auth).

**Step 2-3: Wait CI + Pre-merge gate** — cek CI status, kalau pending wait. Pre-merge readiness via `gstack-review-read`: reviews recency, tests passing, docs updated, PR description accurate.

**Step 4: Merge** — auto-detect method (squash/merge/rebase) dari repo settings. Detect merge queue.

**Step 5: Staging deploy (kalau detected)** — offer deploy ke staging dulu, verify, lalu prod.

**Step 6: Wait deploy** — track deploy workflow run, stream output progress.

**Step 7: Canary verification** — kalau URL provided, jalankan `/canary <url> --quick` atau full monitoring. Kalau alert: AskUserQuestion (investigate / continue / rollback / dismiss).

**Step 8: Final report** — HEALTHY / DEGRADED dengan evidence (deploy logs, canary screenshots, health check results).

Voice & tone (penting): narate what's happening, explain why before asking, be specific (Fly.io app 'myapp' is healthy, bukan "deploy looks good"), acknowledge stakes (this is production), first run = teacher mode, subsequent = efficient mode.

## Contoh / Studi kasus

Haris ship fitur pricing baru di maritimhub. PR #347 sudah ada. First time deploy untuk project ini:
- `/land-and-deploy https://api.maritimhub.com`
- Step 1: gh auth OK. PR #347 OPEN, state mergeable.
- Step 1.5 FIRST_RUN dry-run:
  - 1.5a: detected `fly.toml`, app "maritimhub-api". Deploy workflow `.github/workflows/deploy.yml`.
  - 1.5b: `fly status --app maritimhub-api` ✓, curl prod URL → 200 ✓.
  - 1.5c: staging detected (`fly.staging.toml` + `deploy-staging.yml`).
  - 1.5d: reviews 2 hari lalu (CEO + Eng clean), tests pass, CHANGELOG updated, VERSION bumped.
  - 1.5e dry-run table presented. Haris pilih A (match).
- Save deploy-confirmed hash. Next run skip dry-run.
- Step 5: staging deploy offered → Haris accept. Deploy ke staging, /canary staging 5 min → HEALTHY.
- Step 4: merge PR via squash. Deploy workflow trigger.
- Step 7: prod canary 10 min monitoring. Check #5 (300s): pricing endpoint timeout 1x → MEDIUM alert (transient, no second occurrence). Continue.
- Final: HEALTHY. Report dengan PR link, staging URL, prod URL, canary screenshots.

## Kesimpulan

`/land-and-deploy` adalah end-of-pipeline skill: assume `/ship` sudah jalan, fokus ke release engineering. First-run dry-run mencegah "deploy to wrong platform" disaster. Voice teaching-mode di first run, efficient-mode subsequent. Staging detection bikin opsional safety net antara merge dan prod. Pair dengan `/canary` (yang dipanggil internal) untuk post-deploy verification. Aturan emas: selalu jalankan dengan URL canary di pertama kali ke prod baru — verification dengan baseline jauh lebih bernilai dari sekedar trust deploy workflow log.
