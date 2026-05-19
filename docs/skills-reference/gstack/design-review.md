# Design Review — Design Audit → Fix → Verify

> **Sumber:** [`design-review/SKILL.md`](https://github.com/garrytan/gstack/blob/main/design-review/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Design review yang tidak diikuti fix loop biasanya jadi laporan PDF mengendap di Drive. `/design-review` adalah end-to-end: senior product designer + frontend engineer di satu skill — audit live site dengan visual standards ketat, generate finding, fix di kode, verify hasilnya, commit per-finding sebagai atomic commits. Bukan cuma "ini jelek", melainkan "ini jelek, ini fix-nya, ini commitnya, ini verifikasinya".

Skill ini diff-aware: kalau di feature branch tanpa URL, otomatis masuk **diff-aware mode** (audit hanya halaman yang terkena perubahan). Calibrasi terhadap `DESIGN.md` proyek (deviation lebih severe). Test framework bootstrap otomatis kalau belum ada (vitest, jest, dll).

## Kapan menggunakannya

- Voice trigger: "design review", "visual polish", "audit UI".
- Sebelum merge feature dengan UI changes.
- Periodik audit (monthly) untuk catch design drift.
- Mode argumen:
  - `/design-review` — default (5-8 pages standard depth, atau diff-aware kalau feature branch).
  - `/design-review --quick` — homepage + 2 pages.
  - `/design-review --deep` — 10-15 pages.
  - `/design-review https://app.com` — specific URL.
  - Plus auth options: "Sign in as user@example.com", "Import cookies".

## Cara menggunakannya

1. **Setup**: parse parameters (URL, scope, depth, auth). Auto-detect CDP mode (kalau browse sudah connect ke real browser, skip cookie import). Cek `DESIGN.md` di root — semua finding di-calibrate ke sini.
2. **Clean working tree gate**: kalau `git status --porcelain` non-empty, STOP. Tanya: A) commit, B) stash, C) abort. Skill butuh clean tree untuk atomic fix commits.
3. Browse binary check (SETUP). Design binary `$D` check (opsional untuk target mockup generation).
4. **Test Framework Bootstrap** (kalau belum ada framework):
   - Detect runtime (Node, Ruby, Python, Go, Rust, PHP, Elixir) + framework (Rails, Next).
   - Research best practices via WebSearch.
   - AskUserQuestion pilih framework (default rekomendasi: vitest + testing-library untuk Node).
   - Install + config + 3-5 first real tests dari recent changed files (test what code DOES, bukan `.toBeDefined()`).
   - Setup CI workflow di `.github/workflows/test.yml`.
   - Write `TESTING.md`, update `CLAUDE.md` dengan "## Testing" section.
   - Commit bootstrap sebagai `chore: bootstrap test framework`.
   - Opsi opt-out: `.gstack/no-test-bootstrap` marker.
5. **Audit Phase**: visit halaman, screenshot + snapshot + console error. Apply standards:
   - Typography: hierarchy, leading, contrast.
   - Spacing: rhythm, alignment, breathing room.
   - Color: contrast (WCAG), brand consistency.
   - Hierarchy: visual weight matches importance.
   - Interactive states: hover/focus/disabled visible.
   - Mobile: 44px touch targets, no hover-only.
   - DESIGN.md deviation: HIGHER severity.
6. **Fix Loop** per finding:
   - Identify exact selector/component.
   - (Opsional) generate target mockup via `$D generate` untuk visualize intended state.
   - Edit file dengan minimal diff.
   - Re-screenshot, verify visually.
   - Run relevant tests.
   - Commit atomic: `fix(design): <one-line description>`.
7. **Report**: per-page findings, per-finding status (FIXED / SKIPPED / NEEDS_REVIEW), screenshots before/after.

Output: `$HOME/.gstack/projects/$SLUG/designs/design-audit-{date}/` dengan screenshots, findings.md, report.

## Contoh / Studi kasus

Haris merge fitur pricing page baru ke `feat/pricing`. Sebelum bikin PR, run `/design-review`:
- Working tree clean (sudah commit semua).
- Diff-aware mode aktif (no URL given, on feature branch).
- Test framework belum ada → bootstrap vitest, generate 4 tests untuk recent files, commit.
- Audit pricing page:
  - HIGH: contrast button CTA primary cuma 3.8:1 (WCAG AA butuh 4.5:1 untuk normal text). DESIGN.md spek navy 900 = 4.5+ on white, tapi developer pakai navy 700.
  - MEDIUM: spacing between pricing cards 16px, sementara DESIGN.md scale = 24px.
  - LOW: hover state pada feature checkmark tidak visible.
- Fix loop:
  - Finding 1: Edit `PricingCard.tsx`, ganti `bg-navy-700` → `bg-navy-900`. Re-screenshot OK. Commit `fix(design): use navy-900 for CTA contrast (WCAG AA)`.
  - Finding 2: Update Tailwind `space-y-4` → `space-y-6`. Commit.
  - Finding 3: Add `hover:bg-gray-100` transition. Commit.
- Report tampil: 3 fixes, 3 commits, before/after screenshots.

## Kesimpulan

`/design-review` adalah loop lengkap — audit, fix, verify, commit — bukan cuma reporter. Test framework bootstrap otomatis menghilangkan friction "tapi project ini belum punya test". Atomic per-finding commits bikin git history bersih dan rollback-friendly. Pasangkan dengan `/design-consultation` (system definition), `/design-shotgun` (exploration), `/design-html` (reference HTML). Ini paling bermanfaat di proyek mature dengan `DESIGN.md` lengkap, karena calibrasi finding jauh lebih tajam.
