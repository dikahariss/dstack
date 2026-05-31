# Requesting Code Review

> **Sumber:** [`skills/requesting-code-review/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Menunggu review sampai pekerjaan "selesai semua" membuat bug
mengakar dan biaya perbaikan membengkak. Skill ini mendispatch
subagent code-reviewer dengan konteks yang dikurasi — bukan histori
sesi penuh — untuk mengevaluasi delta git secara fokus. Reviewer
tetap berfokus pada work product, bukan pada thought process Anda,
dan konteks Anda sendiri tetap bersih untuk melanjutkan kerja.

Prinsip inti: **review early, review often.** Dispatch subagent
setelah setiap task di subagent-driven development, setelah fitur
major, sebelum merge ke main, atau sekadar untuk fresh perspective
saat stuck.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when completing tasks, implementing major features, or
> before merging to verify work meets requirements."

Wajib:

- Setelah setiap task di subagent-driven-development.
- Setelah menyelesaikan fitur besar.
- Sebelum merge ke main.

Opsional tapi berharga:

- Saat stuck (perspektif baru).
- Sebelum refactor besar (baseline check).
- Setelah memperbaiki bug kompleks.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Review dulu perubahan di branch ini sebelum merge."
- "Minta code review untuk fitur yang baru kelar."
- "Cek kualitas diff ini lewat reviewer terpisah."
- Kata kunci kanonik (EN): `request code review`, `review my changes`.

Contoh task lengkap:

> "Aku baru kelar modul pembayaran (commit a1b2c3..d4e5f6). Sebelum
> merge, minta code review — dispatch reviewer dengan scope diff itu
> saja, fokus ke korrektness dan edge case."

Yang terjadi: agent mengambil git SHA base/head, lalu men-dispatch
subagent code-reviewer dengan konteks terkurasi (delta + scope
spesifik, bukan histori sesi penuh) supaya isu tertangkap sebelum
merge — sementara konteks Anda sendiri tetap bersih.

## Cara menggunakannya

Tiga langkah:

1. **Ambil git SHA**:
   ```bash
   BASE_SHA=$(git rev-parse HEAD~1)  # atau origin/main
   HEAD_SHA=$(git rev-parse HEAD)
   ```
2. **Dispatch subagent code-reviewer** lewat `Task` tool, isi template
   di `code-reviewer.md` dengan placeholder:
   - `{DESCRIPTION}` — ringkasan singkat apa yang dibangun
   - `{PLAN_OR_REQUIREMENTS}` — apa yang seharusnya dilakukan
   - `{BASE_SHA}` — commit awal
   - `{HEAD_SHA}` — commit akhir
3. **Bertindak atas feedback**:
   - Fix Critical immediately.
   - Fix Important sebelum lanjut.
   - Catat Minor untuk nanti.
   - Push back kalau reviewer salah (dengan reasoning).

File pendukung: `code-reviewer.md` di direktori sumber — template
prompt subagent yang harus diisi sebelum dispatch.

## Contoh / Studi kasus

Setelah menyelesaikan Task 2 "Add verification function":

```
BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed
```

Tindak lanjut: tambahkan progress indicators (Important), lanjut Task
3, catat Minor untuk later sweep.

Push back saat reviewer salah:

```
Reviewer: "This async function should use Promise.all()"
You: "Looked at it — these operations have inter-dependencies (op B
needs result of op A). Promise.all would cause race. Current
sequential pattern is correct. Want me to add a comment explaining
the dependency?"
```

## Kesimpulan

Requesting code review adalah feedback loop yang melindungi kualitas
sebelum bug menyebar. Subagent reviewer dapat konteks yang dikurasi
khusus, sehingga fokus pada work product. Aturan kerasnya: jangan
skip review karena "ini simple", jangan abaikan Critical/Important
issues, jangan setuju pada feedback yang salah secara teknis tanpa
push back. Cocok dipadukan dengan `receiving-code-review` di sisi
penerima.
