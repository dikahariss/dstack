# Writing Plans

> **Sumber:** [`skills/writing-plans/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Plan yang baik adalah kontrak eksekusi. Plan yang buruk — penuh
"TBD", "TODO", "implement later", "add appropriate error handling" —
menggeser pekerjaan berpikir ke executor, yang sering kali model
lebih murah atau subagent dengan konteks terbatas. Hasilnya: keputusan
ad-hoc, inkonsistensi antar task, dan bug yang berakar dari
ketidakjelasan plan.

Skill ini mengajarkan menulis plan untuk **engineer yang punya zero
context** tentang codebase Anda. Tiap task adalah bite-sized (2–5
menit), tiap step berisi konten aktual (kode lengkap, perintah
eksak, expected output), dan tiap plan terstruktur ulang menjadi
file structure → TDD cycle per task → commit. DRY, YAGNI, TDD,
frequent commits.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when you have a spec or requirements for a multi-step task,
> before touching code."

Trigger praktis:

- Setelah `brainstorming` menghasilkan spec yang disetujui.
- Pengguna memberi requirement multi-step.
- Sebelum menyentuh kode untuk pekerjaan apa pun yang lebih dari
  1–2 step.

Scope check: jika spec mencakup beberapa subsistem independen,
seharusnya sudah dipecah menjadi sub-project specs saat brainstorming.
Kalau belum, suggest pemecahan sebelum menulis plan.

## Cara menggunakannya

Alur:

1. **Save plan ke** `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`.
2. **Plan header** wajib menyebut required sub-skill (subagent-driven
   atau executing-plans), goal singkat, arsitektur 2–3 kalimat, tech
   stack.
3. **File structure section** — petakan file mana yang akan dibuat
   atau dimodifikasi, dan tanggung jawab masing-masing. Decomposition
   decisions di-lock di sini.
4. **Task structure** — tiap task punya:
   - **Files**: Create/Modify/Test dengan path eksak.
   - **Steps** dengan checkbox (`- [ ]`):
     - Step 1: Write failing test (kode aktual).
     - Step 2: Run test, expected FAIL dengan message spesifik.
     - Step 3: Minimal implementation (kode aktual).
     - Step 4: Run test, expected PASS.
     - Step 5: Commit dengan message yang sudah ditulis.
5. **No placeholders** — "TBD", "implement later", "add appropriate
   error handling" adalah plan failures. Setiap step harus berisi
   konten yang engineer butuhkan untuk eksekusi.
6. **Self-review** setelah plan ditulis — spec coverage, placeholder
   scan, type consistency.
7. **Execution handoff** — tawarkan dua opsi: subagent-driven
   (recommended) atau inline execution.

File pendukung: tidak ada — seluruh template inline.

## Contoh / Studi kasus

Spec menyetujui: "Tambah feature flag system dengan provider
LocalStorage."

Plan header:

```markdown
# Feature Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a feature flag system with LocalStorage provider for
client-side flag evaluation.

**Architecture:** Pure functions for flag evaluation, provider
interface for storage, single store for state. No global state, no
side effects in evaluation.

**Tech Stack:** TypeScript, no new dependencies.
```

Task 1 dengan TDD bite-sized:

```markdown
### Task 1: FlagProvider Interface

**Files:**
- Create: `src/feature-flags/FlagProvider.ts`
- Test: `test/unit/feature-flags/FlagProvider.test.ts`

- [ ] **Step 1: Write the failing test**

[Kode test lengkap di sini, bukan placeholder]

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/unit/feature-flags/FlagProvider.test.ts`
Expected: FAIL with "Cannot find module 'src/feature-flags/FlagProvider'"

- [ ] **Step 3: Write minimal implementation**

[Kode interface lengkap di sini]

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test test/unit/feature-flags/FlagProvider.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

git add -A
git commit -m "feat: add FlagProvider interface"
```

Anti-pattern yang dicegah: "Similar to Task N" tanpa repeat kode.
Engineer mungkin baca task tidak berurutan — repeat kode-nya.

## Kesimpulan

Writing-plans memastikan plan adalah dokumen eksekusi yang lengkap,
bukan to-do list kabur. Aturannya keras: exact file paths, kode
lengkap di setiap step, perintah eksak dengan expected output,
TDD bite-sized, no placeholders. Self-review wajib sebelum
handoff. Output terminal: plan disimpan dan opsi eksekusi
ditawarkan (subagent-driven recommended, atau inline executing-plans
sebagai fallback).
