# Landing Report — Version Queue Dashboard

> **Sumber:** [`landing-report/SKILL.md`](https://github.com/garrytan/gstack/blob/main/landing-report/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Saat menjalankan 5-10 paralel Conductor workspaces atau tim dengan banyak PR open, susah lihat sekilas: nomor versi mana yang sudah di-claim oleh PR open, sibling workspace mana yang punya kerjaan WIP yang akan ship segera, dan slot mana yang `/ship` akan claim selanjutnya. Tanpa visibility ini, dua PR bisa collide claim versi `v1.7.0.0` — pemenang kedua akan overwrite CHANGELOG yang pertama atau land duplicate.

`/landing-report` adalah dashboard **read-only** yang panggil util yang sama (`bin/gstack-next-version`) yang dipakai `/ship`, tapi tanpa mutasi. Bayangkan ini seperti `gh pr list` untuk VERSION numbers.

## Kapan menggunakannya

- Voice trigger: "landing report", "version queue", "ship queue", "what version comes next", "show open PR versions".
- Sebelum `/ship` untuk cek apakah ada collision.
- Saat coordination meeting tim — dashboard sekilas siapa ship apa.
- Saat workflow Conductor banyak — visibility ke sibling workspaces.
- Aman dijalankan di plan mode (PLAN MODE EXCEPTION — read-only).

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Tampilkan version queue sebelum aku /ship."
- "Cek landing report — ada collision tidak di PR yang open?"
- "Versi mana yang akan aku claim kalau /ship sekarang?"
- Kata kunci kanonik (EN): `/landing-report`, `landing report`,
  `version queue`, `what version comes next`.

Contoh task lengkap:

> "/landing-report — aku lagi di workspace tokyo-v2 feat/pricing,
> mau cek apakah ada PR lain yang sudah claim versi yang sama
> sebelum aku jalankan /ship."

Yang terjadi: skill membaca VERSION di base branch dan semua
open PR, memanggil `bin/gstack-next-version` 4 kali (micro/
patch/minor/major), lalu render dashboard tabel dengan daftar
PR yang claim versi, sibling worktrees aktif (bertanda bintang),
dan slot versi yang akan di-claim kalau `/ship` dijalankan kini.
Read-only — tidak ada mutasi.

## Cara menggunakannya

1. **Step 1: Detect platform + base branch** — `gh pr view --json baseRefName` atau `gh repo view --json defaultBranchRef`, fallback `main`.
2. **Step 2: Read current state**:
   ```bash
   CURRENT_VERSION=$(cat VERSION | tr -d '[:space:]')
   git fetch origin "$BASE_BRANCH" --quiet
   BASE_VERSION=$(git show "origin/$BASE_BRANCH:VERSION" | tr -d '[:space:]')
   ```
3. **Step 3: Query queue** — panggil `bin/gstack-next-version --base "$BASE_BRANCH" --bump <level> --current-version "$BASE_VERSION"` 4x untuk micro/patch/minor/major (cheap, gh call cached).
4. **Step 4: Render dashboard** — single table:
   ```
   ╔══════════════════════════════════════════════════════════════════╗
   ║                     GSTACK LANDING REPORT                        ║
   ╠══════════════════════════════════════════════════════════════════╣
   ║ Repo:    <owner/repo>                                            ║
   ║ Base:    <base> @ v<base-version>                                ║
   ║ Host:    github|gitlab|unknown                                   ║
   ║ Status:  ONLINE|OFFLINE                                          ║
   ╚══════════════════════════════════════════════════════════════════╝
   
   Open PRs claiming versions on <base>:
     #1152  alpha-branch    → v1.7.0.0
     #1153  beta-branch     → v1.7.0.0  ⚠ collision with #1152
   
   Sibling Conductor worktrees:
     path                  branch         VERSION    last commit   PR
     ../tokyo-v2           feat/dashboard v1.7.1.0   3h ago        none  ★ active
   
   If you ran /ship right now, you'd claim:
     micro:  v1.6.3.1
     patch:  v1.7.1.0  (bumped past claimed 1.7.0.0)
     minor:  v1.8.0.0
     major:  v2.0.0.0
   ```
   `★ active` = sibling dengan VERSION ahead of base AND last commit <24h AND no open PR — kandidat akan ship segera.
5. **Step 5: Suggest next action**:
   - Kalau collision (dua PR claim versi sama): warn, suggest salah satu rerun /ship untuk pickup slot berikutnya.
   - Kalau active sibling outranks branch user: warn, branch akan butuh rebump kalau sibling ship duluan.
   - Kalau clean: "Queue is clean. Next /ship will claim a slot without conflict."

Offline / unknown-host output shorter block dengan reason warning.

File pendukung: `bin/gstack-next-version` (canonical version queue logic), `bin/gstack-paths`.

## Contoh / Studi kasus

Haris jalankan 3 Conductor workspace paralel di MaritimHub: feat/pricing (workspace tokyo-v2), feat/auth (melbourne), feat/payments (osaka). Sebelum /ship feat/pricing, run `/landing-report`:
- Output: 
  - Open PRs: #1155 feat/payments → v1.8.0.0.
  - Siblings: tokyo-v2 (current, v1.7.1.0 not yet PR'd, last commit 3h ago, ★ active), melbourne (12 hari lalu, idle), osaka (PR #1155 dengan v1.8.0.0).
  - If /ship now: micro v1.6.3.1, patch v1.7.1.0 (claim slot ahead of osaka's 1.8.0.0), minor v1.8.0.0 (collision warning — would conflict dengan osaka).
- Suggest action: "Patch bump safe. Minor bump akan collide dengan #1155, mau rebump ke 1.9.0.0?"
- Haris pilih patch bump untuk feat/pricing → tidak ada collision.

## Kesimpulan

`/landing-report` adalah `gh pr list` untuk VERSION numbers — visibility ringan ke queue tanpa mutasi. Cocok untuk paralel Conductor workflow atau tim multi-PR. Read-only ketat: aman dipanggil di plan mode atau debug session. Pasangkan dengan `/ship` (yang otomatis pakai logic queue ini) untuk avoid collision. Untuk team yang baru pakai gstack, run ini sebelum tiap /ship sebagai habit awal — 30 detik prevention vs jam-jam debugging CHANGELOG collision.
