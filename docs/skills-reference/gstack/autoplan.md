# Autoplan — Auto-Review Pipeline

> **Sumber:** [`autoplan/SKILL.md`](https://github.com/garrytan/gstack/blob/main/autoplan/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

Plan-mode di Claude Code biasanya butuh rangkaian review berurutan: CEO (strategi & scope), Design (UI/UX), Engineering (arsitektur & test), dan Developer Experience (DX). Menjalankan keempatnya manual berarti puluhan AskUserQuestion, copy-paste konteks antar skill, dan resiko salah urutan. `/autoplan` membungkus seluruh pipeline ini menjadi satu invokasi: "rough plan in, fully reviewed plan out". Setiap pertanyaan antara di-auto-decide pakai 6 prinsip terstandar; hanya taste decision dan user-challenge yang sampai ke gate persetujuan final.

Selain hemat waktu, skill ini juga menjaga rigor: dia tidak meringkas section review menjadi tabel one-liner — setiap section dijalankan dengan kedalaman yang sama seperti versi interaktif, hanya pengambilan keputusannya yang berbeda.

## Kapan menggunakannya

- Pengguna mengetik `/autoplan` di plan-mode dengan plan kasar siap di-review.
- Voice trigger dari routing CLAUDE.md: "full review pipeline".
- Setelah scope plan jelas tapi belum disetujui — perlu CEO + Design + Eng + DX sekaligus.
- Tidak cocok untuk eksplorasi awal (gunakan `/office-hours` dulu) atau plan trivial < 1 jam effort.

## Cara menggunakannya

1. Tulis plan kasar di file plan (host-controlled).
2. Invoke `/autoplan`.
3. Phase 0 menyimpan restore point ke `~/.gstack/projects/$SLUG/<branch>-autoplan-restore-<datetime>.md` dan menyisipkan komentar HTML di plan file.
4. Phase 0.5 melakukan preflight auth Codex (multi-signal), warn versi CLI yang known-bad.
5. Phase 1-3.5 berjalan berurutan: CEO Review → Design Review (kalau UI-scope) → Eng Review → DX Review (kalau DX-scope). Setiap fase menjalankan dual voice (Claude subagent + Codex) bila tersedia.
6. Auto-decision dipandu 6 prinsip: (1) choose completeness, (2) boil lakes, (3) pragmatic, (4) DRY, (5) explicit over clever, (6) bias toward action.
7. Premises (Phase 1) dan User Challenge tidak pernah di-auto-decided — selalu naik ke user gate.
8. Output akhir: plan file ter-update dengan `## GSTACK REVIEW REPORT`, audit trail keputusan, dan verdict per-review.

File pendukung:
- `~/.claude/skills/gstack/plan-ceo-review/SKILL.md`, `plan-design-review`, `plan-eng-review`, `plan-devex-review` — semua dibaca penuh dari disk dan diikuti pada kedalaman penuh.
- `~/.claude/skills/gstack/bin/gstack-codex-probe` — preflight auth/versi Codex.
- `~/.claude/skills/gstack/bin/gstack-review-read` — baca review history untuk dashboard akhir.

## Contoh / Studi kasus

Haris menulis plan untuk fitur upload file dengan signed URL di MaritimHub. Plan punya UI baru (form upload + progress bar) dan endpoint API baru. Invoke `/autoplan`:
- Phase 1 CEO menemukan premis "user butuh resume upload" yang belum divalidasi → gate ke user.
- Phase 2 Design menyarankan tambahan empty state (TASTE DECISION → ditandai untuk approval final).
- Phase 3 Eng + Codex sepakat ada race condition di handler concurrent upload → flagged sebagai security risk, ditampilkan dengan framing urgen.
- Phase 3.5 DX merekomendasikan dokumentasi endpoint dengan example payload (auto-approved karena dalam blast radius).
- Restore point disimpan; bila Haris perlu rollback, tinggal copy "Original Plan State" balik ke plan file.

## Kesimpulan

`/autoplan` adalah "boil-the-lake" pipeline reviewer: lengkap, terstandar, dan terlacak. Ia menggantikan judgment user pada keputusan rutin (mekanik) sambil tetap memunculkan keputusan taste dan strategis ke permukaan. Cocok dipakai sebagai default review pipeline sebelum implementasi besar; jangan dipakai untuk eksplorasi awal atau perubahan kecil yang tidak butuh four-phase rigor.
