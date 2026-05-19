# Dispatching Parallel Agents

> **Sumber:** [`skills/dispatching-parallel-agents/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Saat agent menghadapi banyak masalah independen sekaligus —
misalnya 6 test failure di 3 file yang berbeda — investigasi
berurutan membuang waktu. Setiap penyelidikan berdiri sendiri dan
bisa berjalan paralel. Skill ini mengajarkan bagaimana mendelegasikan
pekerjaan ke subagent dengan konteks terisolasi, sehingga main thread
tetap punya bandwidth untuk koordinasi sambil pekerjaan yang sebenarnya
diselesaikan oleh agent-agent kecil yang fokus.

Prinsip intinya: subagent **tidak mewarisi konteks atau histori
sesi** Anda. Anda menyusun persis apa yang mereka butuhkan. Ini
sekaligus menjaga konteks Anda sendiri tetap ramping untuk pekerjaan
koordinasi.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when facing 2+ independent tasks that can be worked on
> without shared state or sequential dependencies."

Trigger praktis:

- 3+ test files gagal dengan root cause berbeda-beda.
- Beberapa subsistem rusak secara independen pasca refactor besar.
- Tiap problem bisa dipahami tanpa konteks dari yang lain.
- Tidak ada shared state atau resource yang akan diperebutkan.

Jangan gunakan saat:

- Failure-nya berkaitan (fix satu mungkin memperbaiki yang lain).
- Anda butuh memahami full system state dulu.
- Agent-agent akan saling mengganggu (edit file yang sama).

## Cara menggunakannya

Empat langkah:

1. **Identifikasi domain independen** — kelompokkan failure berdasarkan
   subsistem yang rusak.
2. **Buat task agent yang fokus** — tiap agent dapat scope spesifik,
   tujuan jelas, constraint (jangan ubah kode lain), dan format output
   yang diharapkan.
3. **Dispatch paralel** — invoke `Task` tool berkali-kali dalam satu
   pesan untuk concurrency sesungguhnya.
4. **Review dan integrasikan** — baca tiap summary, cek konflik,
   jalankan full test suite, integrasikan.

Skill ini hanya berisi `SKILL.md` tunggal tanpa file pendukung —
seluruh panduan ada inline.

Pattern prompt agent yang baik:

- **Focused** — satu problem domain.
- **Self-contained** — semua konteks yang dibutuhkan ada di prompt.
- **Spesifik soal output** — agent harus tahu apa yang harus
  dilaporkan kembali.

## Contoh / Studi kasus

Skenario dari sesi debugging (2025-10-03): 6 test failure tersebar
di 3 file pasca refactor besar.

- `agent-tool-abort.test.ts` — 3 failure (timing issues)
- `batch-completion-behavior.test.ts` — 2 failure (tools tidak
  execute)
- `tool-approval-race-conditions.test.ts` — 1 failure (execution
  count = 0)

Keputusan: domain independen. Tool approval, batch completion, dan
abort tidak saling berkaitan.

Dispatch:

```
Agent 1 → Fix agent-tool-abort.test.ts
Agent 2 → Fix batch-completion-behavior.test.ts
Agent 3 → Fix tool-approval-race-conditions.test.ts
```

Hasil:

- Agent 1 mengganti arbitrary timeout dengan event-based waiting.
- Agent 2 memperbaiki event structure bug (threadId di tempat
  salah).
- Agent 3 menambahkan wait untuk async tool execution.

Integrasi: nol konflik karena ketiganya menyentuh file berbeda.
Waktu: 3 problem terselesaikan paralel, bukan 3x lebih lama.

## Kesimpulan

Dispatching paralel adalah cara agent berskala — bukan dengan satu
super-agent yang mengerti semuanya, melainkan dengan banyak agent
kecil dengan konteks terkurasi. Kuncinya: domain yang benar-benar
independen, prompt yang fokus dengan output yang jelas, dan review
integrasi setelah semua selesai. Untuk masalah yang berkaitan,
satu agent investigator tetap lebih cocok.
