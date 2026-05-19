# To Issues

> **Sumber:** [`skills/engineering/to-issues/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Plan besar yang menumpuk di satu issue raksasa tidak grabbable: tidak bisa dipick paralel, tidak bisa di-demo per slice, dan progress sulit dilihat. Skill ini memecah plan menjadi **tracer bullet issues** — vertical slice yang menembus seluruh layer (schema, API, UI, tests) end-to-end, masing-masing demoable secara mandiri. Tujuan akhirnya adalah maximize parallelism: banyak agent / dev bisa ambil issue berbeda sekaligus.

Pembedaan penting: tiap slice ditandai HITL (human in the loop) atau AFK (away from keyboard — fully autonomous). Prefer AFK bila bisa.

## Kapan menggunakannya

- User ingin memecah plan, spec, PRD jadi issue tracker.
- Setelah `to-prd` selesai dan PRD siap dipecah ke tiket.
- Setelah `improve-codebase-architecture` selesai dan refactor besar harus dipecah.
- Prasyarat: `setup-matt-pocock-skills` sudah dijalankan supaya issue tracker dan label vocabulary terkonfigurasi.

## Cara menggunakannya

1. **Gather context**: kerja dari konteks percakapan; bila user pass issue reference, fetch full body + comments dari tracker.
2. **Explore codebase (opsional)**: pahami state, pakai glossarium domain untuk title/description; respect ADR.
3. **Draft vertical slices**: tracer bullet — narrow but COMPLETE path through every layer; demoable on its own; prefer many thin atas few thick. Tandai HITL / AFK per slice.
4. **Quiz the user**: present numbered list dengan Title, Type (HITL/AFK), Blocked by, User stories covered. Tanyakan granularity, dependency, merge/split. Iterate sampai approve.
5. **Publish**: untuk tiap slice yang di-approve, create issue ke tracker dengan template Parent / What to build / Acceptance criteria / Blocked by. Apply triage label `ready-for-agent`. Publish dalam dependency order agar bisa reference issue identifier yang real. **Jangan close atau modify parent issue.**

## Contoh / Studi kasus

PRD: "Pengguna dapat mengelola subscription mereka di dashboard." Setelah eksplorasi, draft 6 vertical slice:

1. (AFK) Tampilkan subscription aktif di dashboard read-only. Blocked by: none.
2. (AFK) Tombol "Cancel at period end" + endpoint + test. Blocked by: #1.
3. (HITL) Konfirmasi modal copy dan layout — perlu design review. Blocked by: #2.
4. (AFK) Tombol "Cancel immediately" + refund prorata + test. Blocked by: #3.
5. (AFK) Tambah event audit log untuk cancel. Blocked by: #4.
6. (AFK) Email konfirmasi cancel. Blocked by: #4.

User minta merge #5 dan #6 karena keduanya selalu jalan bareng → digabung. Setelah approve, 5 issue dibuat berurutan di tracker, masing-masing dengan acceptance criteria checklist dan blocked-by referencing real number.

## Kesimpulan

Skill ini adalah "splitter" antara plan dan delivery. Pasangkan dengan `to-prd` (untuk plan besar) atau `improve-codebase-architecture` (untuk refactor). Aturan paling penting: **vertical bukan horizontal**, **demoable per slice**, dan **HITL vs AFK** secara eksplisit supaya orang/agent tahu mana yang aman dipick tanpa bertanya.
