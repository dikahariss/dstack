# CSO — Chief Security Officer Audit

> **Sumber:** [`cso/SKILL.md`](https://github.com/garrytan/gstack/blob/main/cso/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Kebanyakan tim audit kode mereka sendiri tapi lupa attack surface sesungguhnya: env vars yang bocor di CI logs, API keys stale di git history, staging server dengan akses ke prod DB, webhook yang menerima apapun, install scripts di production deps (vektor supply chain attack), dan skill Claude Code yang malicious (Snyk: 36% punya security flaw, 13.4% outright malicious). `/cso` adalah audit menyeluruh yang mulai dari attack surface census, lalu drill ke dependency supply chain, CI/CD, infrastruktur, webhook, LLM security, skill supply chain, OWASP Top 10, dan domain auth/data.

Output: **Security Posture Report** dengan finding terstruktur (severity rating, remediation plan, FP rules). Skill **tidak modifikasi kode** — produce report, user decide what to act on.

## Kapan menggunakannya

- Mode default `/cso` — full daily audit (Phase 0-14, 8/10 confidence gate).
- `/cso --comprehensive` — monthly deep scan (2/10 bar, surface lebih banyak).
- `/cso --infra` — infra only (Phase 0-6, 12-14).
- `/cso --code` — code only (Phase 0-1, 7, 9-11, 12-14).
- `/cso --skills` — skill supply chain only (Phase 0, 8, 12-14).
- `/cso --diff` — branch changes only (kombinable).
- `/cso --supply-chain`, `--owasp`, `--scope auth` — scope-spesifik.
- Scope flags **mutually exclusive** — kalau dual, error immediately (security tooling jangan ignore user intent).
- Phase 0, 1, 12, 13, 14 selalu jalan.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Audit security dulu sebelum go-live minggu depan."
- "Cek ada API key yang bocor di git history tidak?"
- "CSO review — mau pastikan supply chain dan CI/CD aman."
- Kata kunci kanonik (EN): `/cso`, `security audit`,
  `check for vulnerabilities`, `owasp review`.

Contoh task lengkap:

> "/cso --comprehensive di repo MaritimHub — audit lengkap
> menjelang launch: cek secrets di git history, dependency
> supply chain, webhook Stripe yang mungkin tanpa signature
> check, dan skill supply chain di `.claude/skills/`."

Yang terjadi: skill jalankan 15 phase (Phase 0–14) secara
sistematis — dari stack detection, attack surface census,
secrets archaeology di git history, dependency CVE scan, CI/CD
pipeline audit, webhook trace, LLM security, hingga OWASP Top 10.
Output adalah Security Posture Report berisi finding per severity
(CRITICAL/HIGH/MEDIUM) dengan FP rules dan remediation plan.
Tidak ada kode yang diubah — hanya laporan.

## Cara menggunakannya

1. Pakai Grep tool (bukan raw bash grep) untuk semua code searches — proper permissions.
2. **Phase 0 — Architecture Mental Model + Stack Detection**: detect Node/TS, Ruby, Python, Go, Rust, JVM, PHP, .NET; framework Next/Express/Django/Rails/dll. Soft gate: prioritas scan, bukan skip.
3. **Phase 1 — Attack Surface Census**: code surface (endpoints, auth boundaries, file upload, admin routes, webhooks) + infra surface (CI workflows, Docker, IaC, env files).
4. **Phase 2 — Secrets Archaeology**: scan git history untuk known prefixes (`AKIA`, `sk-`, `ghp_`, `xoxb-`), check `.env` tracked, CI configs dengan inline secrets.
5. **Phase 3 — Dependency Supply Chain**: package manager audit, install scripts di prod deps, lockfile integrity.
6. **Phase 4 — CI/CD Pipeline Security**: unpinned third-party actions, `pull_request_target`, script injection via `${{ github.event.* }}`, secrets sebagai env vars.
7. **Phase 5 — Infrastructure Shadow Surface**: Dockerfile (missing `USER`, `ARG` secrets), config files dengan prod credentials, IaC permissions.
8. **Phase 6 — Webhook & Integration Audit**: webhook tanpa signature verification, TLS disabled, OAuth scopes berlebihan. Code-tracing only, NO live requests.
9. **Phase 7 — LLM & AI Security**: prompt injection, unsanitized LLM output, tool calling tanpa validation, AI API keys di code.
10. **Phase 8 — Skill Supply Chain**: scan `.claude/skills/` lokal + (with permission) global skills untuk pattern `curl/exfiltrat`, credential access, prompt injection.
11. Phase 9-11: OWASP Top 10, domain auth/data, code patterns.
12. Phase 12-14: prior learnings (search `gstack-learnings-search`), reporting, write learnings.

Setiap finding punya: severity (CRITICAL/HIGH/MEDIUM), FP rules eksplisit, dan remediation.

## Contoh / Studi kasus

Haris jalankan `/cso --comprehensive` di maritimhub menjelang go-live:
- Phase 0: detect Node/TS + Next.js + Express API.
- Phase 1: 12 public endpoints, 3 admin-only, 1 file upload, 2 webhook receivers.
- Phase 2: CRITICAL — `AKIA*` AWS key di commit 6 bulan lalu (rotated tapi belum di-remove dari history). HIGH — `.env.production` tracked di git.
- Phase 3: HIGH — `node-fetch@2.6.1` punya CVE high.
- Phase 4: MEDIUM — workflow `deploy.yml` pakai `actions/checkout@v3` (unpinned, third-party).
- Phase 6: CRITICAL — `/webhook/stripe` tidak verify signature (trace handler chain confirm).
- Phase 7: HIGH — user input bocor ke system prompt via `getChatPrompt(userMessage)` di `ai/chat.ts:34`.
- Report final: 2 CRITICAL, 3 HIGH, 4 MEDIUM. Remediation per finding.
- Haris bawa report ini ke planning session, prioritize fix CRITICAL sebelum launch.

## Kesimpulan

`/cso` adalah audit security komprehensif "boil the lake" gaya gstack: tidak skip dimensi karena "tidak punya bug visible", tapi sistematis cek setiap kelas serangan. Read-only — produce report, bukan auto-fix (security fix butuh judgment manusia). Pasangkan dengan `/security-review` (yang lebih fokus ke PR diff) untuk lapisan defense. Mode `--diff` cocok untuk per-PR check; `--comprehensive` untuk audit bulanan/sebelum launch.
