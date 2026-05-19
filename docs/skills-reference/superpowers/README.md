# Superpowers Skills — Referensi Bahasa Indonesia

Dokumentasi referensi untuk 14 skill dari repo
[superpowers](https://github.com/obra/superpowers) (komunitas,
fokus pada disiplin pengembangan dengan agent LLM). Semua dokumen
ditulis dalam Bahasa Indonesia teknis untuk memudahkan engineer
Indonesia mempelajari dan mengadaptasi skill catalog ini.

## Karakter repo

Superpowers adalah skill catalog yang menanamkan **disciplines** —
aturan keras dengan Iron Laws, pressure testing, dan rationalization
tables. Filosofi-nya: agent LLM (sama seperti manusia) sangat kreatif
mencari alasan untuk skip discipline saat under pressure. Skill di
sini ditulis untuk **bulletproof** terhadap rasionalisasi.

Tiga disiplin fondasional yang saling berkaitan:

1. **test-driven-development** — no production code without failing
   test first.
2. **systematic-debugging** — no fixes without root cause investigation
   first.
3. **verification-before-completion** — no completion claims without
   fresh verification evidence.

Workflow eksekusi: `brainstorming` → `writing-plans` →
`using-git-worktrees` → `subagent-driven-development` atau
`executing-plans` → `finishing-a-development-branch`.

## Daftar skill (14 dokumen)

| # | Skill | Deskripsi singkat |
|---|---|---|
| 1 | [brainstorming](./brainstorming.md) | Gerbang wajib sebelum semua pekerjaan kreatif — dialog satu pertanyaan per kali sampai design disetujui dan spec ditulis. |
| 2 | [dispatching-parallel-agents](./dispatching-parallel-agents.md) | Dispatch beberapa subagent paralel untuk problem domain yang benar-benar independen, menjaga konteks main thread tetap ramping. |
| 3 | [executing-plans](./executing-plans.md) | Eksekusi plan inline tanpa subagent — load, review kritis, jalankan task-by-task, stop saat blocker, serahkan ke finishing. |
| 4 | [finishing-a-development-branch](./finishing-a-development-branch.md) | Verifikasi test → deteksi env → sajikan 4 opsi (merge/PR/keep/discard) → eksekusi → cleanup worktree dengan provenance check. |
| 5 | [receiving-code-review](./receiving-code-review.md) | Tangani feedback review dengan disiplin teknis — verifikasi, tanya, push back beralasan; no performative agreement, no thanks. |
| 6 | [requesting-code-review](./requesting-code-review.md) | Dispatch subagent code-reviewer dengan konteks terkurasi (git SHA + scope) untuk catch issues lebih awal. |
| 7 | [subagent-driven-development](./subagent-driven-development.md) | Eksekusi plan dengan subagent segar per task + dua tahap review (spec compliance lalu code quality); continuous execution. |
| 8 | [systematic-debugging](./systematic-debugging.md) | Empat fase wajib (Root Cause → Pattern → Hypothesis → Implementation); 3+ fix failures = stop dan pertanyakan arsitektur. |
| 9 | [test-driven-development](./test-driven-development.md) | Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST. Siklus RED-GREEN-REFACTOR ketat tanpa pengecualian. |
| 10 | [using-git-worktrees](./using-git-worktrees.md) | Pastikan workspace terisolasi — detect dulu, native tool harness kedua, `git worktree add` fallback terakhir. |
| 11 | [using-superpowers](./using-superpowers.md) | Meta-skill: invoke skill BEFORE any response. Aturan 1% — kalaupun ragu, invoke dulu. |
| 12 | [verification-before-completion](./verification-before-completion.md) | NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE. Run command → read output → baru klaim. |
| 13 | [writing-plans](./writing-plans.md) | Tulis plan untuk engineer dengan zero context — bite-sized TDD steps, kode lengkap, no placeholders, self-review. |
| 14 | [writing-skills](./writing-skills.md) | TDD applied to process documentation — pressure test baseline, write minimal skill, close loopholes; CSO discipline. |

## Cara membaca

Tiap dokumen mengikuti struktur konsisten:

- **Mengapa skill ini penting** — konteks dan masalah yang
  diselesaikan.
- **Kapan menggunakannya** — trigger praktis + kutipan frontmatter
  `description` asli.
- **Cara menggunakannya** — langkah ringkas + invokasi + file
  pendukung.
- **Contoh / Studi kasus** — skenario konkret.
- **Kesimpulan** — ringkasan padat dan hubungan dengan skill lain.

Untuk adopsi di dstack, prioritaskan tiga skill fondasional (TDD,
debugging, verification) dan workflow inti (brainstorming → plans →
worktrees → subagent-driven → finishing). Skill `using-superpowers`
adalah pintu masuk yang sebaiknya selalu aktif.
