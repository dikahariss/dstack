# Improve Codebase Architecture

> **Sumber:** [`skills/engineering/improve-codebase-architecture/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Inspirasi: Ousterhout's *deep modules*. Sebuah modul "deep" punya interface kecil yang menyembunyikan banyak kompleksitas; "shallow" punya interface hampir sama kompleks dengan implementasi. Codebase yang sehat punya modul deep di tempat-tempat yang penting. Skill ini secara sengaja mencari *deepening opportunities* — refactor yang mengubah modul shallow menjadi deep — dengan tujuan testability dan AI-navigability.

Kekuatan utama skill: glossarium arsitektur yang ketat (Module, Interface, Implementation, Depth, Seam, Adapter, Leverage, Locality), plus heuristik praktis seperti *deletion test* ("kalau saya hapus modul ini, apakah kompleksitas menghilang atau muncul lagi di N caller?"). Skill ini *informed* oleh `CONTEXT.md` (nama domain untuk seam yang baik) dan ADR (keputusan yang tidak boleh dilitigasi ulang).

## Kapan menggunakannya

- User ingin "improve architecture", menemukan refactor opportunity, konsolidasi modul tightly-coupled, atau membuat codebase lebih testable / AI-navigable.
- Setelah `diagnose` selesai dan post-mortem menunjukkan absence of correct seam (cue: pindah ke skill ini).
- Frontmatter description: "Find deepening opportunities in a codebase, informed by the domain language in CONTEXT.md and the decisions in docs/adr/".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Improve architecture codebase ini — terlalu susah di-test."
- "Temukan refactor opportunity di modul order handling ini."
- "Codebase makin becek, agent susah navigate. Apa yang bisa
  dikonsolidasi?"
- Kata kunci kanonik (EN): `improve architecture`,
  `refactoring opportunities`, `testable`, `AI-navigable`.

Contoh task lengkap:

> "Di `src/orders/`, ada `OrderValidator.ts`,
> `OrderEnricher.ts`, `OrderPersister.ts`, `OrderEmitter.ts`
> — dipanggil berurutan dari 7 handler. Temukan deepening
> opportunity: jalankan deletion test, present kandidat
> bernomor, lalu grill saya sampai interface barunya jelas."

Yang terjadi: agent mengeksplor codebase dengan deletion test
dan heuristik depth/locality, mempresentasikan numbered list
kandidat refactor dengan Problem + Solution + Benefits, lalu
masuk ke grilling loop untuk satu kandidat yang dipilih user —
setiap term domain baru langsung ditambahkan ke `CONTEXT.md`.

## Cara menggunakannya

1. **Explore**: baca glossarium domain dan ADR area target. Pakai Agent tool (`subagent_type=Explore`) untuk jalan-jalan di codebase, catat friction: bouncing between many small modules, modul shallow, pure functions extracted untuk testability tapi tanpa locality, leaky seams, area untestable. Apply deletion test pada apa yang dicurigai shallow.
2. **Present candidates**: numbered list, tiap kandidat punya Files, Problem, Solution, Benefits (locality + leverage + test improvement). Pakai vocabulary `CONTEXT.md` untuk domain dan `LANGUAGE.md` untuk arsitektur. ADR conflict: hanya surface bila friction cukup besar untuk reopen ADR.
3. **Grilling loop**: setelah user pilih kandidat, drop ke grilling. Walk design tree: constraint, dependency, shape modul yang diperdalam, apa di balik seam, test mana yang bertahan.
4. **Side effects inline**: naming modul baru → tambah ke `CONTEXT.md`. User reject kandidat dengan load-bearing reason → tawarkan ADR. Eksplor alternative interface → baca `INTERFACE-DESIGN.md`.

## Contoh / Studi kasus

Codebase punya 4 file kecil: `OrderValidator.ts`, `OrderEnricher.ts`, `OrderPersister.ts`, `OrderEmitter.ts`. Masing-masing dipanggil berurutan dari 7 handler. Skill menjalankan deletion test: bila keempatnya dihapus dan logiknya dipindah ke handler, kompleksitas muncul lagi 7×. Tapi sebenarnya keempatnya selalu dipanggil bersama — itu signal modul shallow extracted untuk testability tanpa locality. Kandidat: deepen menjadi satu `OrderIntake` module dengan interface `intake(rawOrder): IntakeResult`. Tujuh handler tinggal panggil satu method. Test sekarang mengetes intake end-to-end (real bug surface) bukan empat unit yang lulus tapi gabungan rusak. Grilling loop kupas: bagaimana retry? bagaimana audit log? Apakah ada lebih dari satu adapter? Bila ada (mis. batch vs single), lihat `INTERFACE-DESIGN.md`. Update `CONTEXT.md` dengan term "Intake". Tidak perlu ADR.

## Kesimpulan

Skill paling "arsitektur" di catalog. Pakai bila Anda merasa codebase mulai becek, sulit di-test, atau agent kesulitan navigate. Dipasangkan dengan `diagnose` (post-mortem) dan `to-prd`/`to-issues` (publish hasil refactor).
