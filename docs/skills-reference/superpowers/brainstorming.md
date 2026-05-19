# Brainstorming

> **Sumber:** [`skills/brainstorming/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Sebagian besar waktu yang terbuang di proyek perangkat lunak berasal
dari asumsi yang tidak diperiksa. Engineer (manusia atau LLM) langsung
loncat ke implementasi tanpa menyepakati apa yang sebenarnya dibangun,
untuk siapa, dan dengan batasan apa. Brainstorming memaksa proses
dialog satu pertanyaan pada satu waktu sampai desain terbentuk, lalu
menulis spec yang harus disetujui pengguna sebelum baris kode apa pun
ditulis.

Skill ini menanamkan satu prinsip keras: **tidak ada implementasi
tanpa desain yang disetujui**, bahkan untuk proyek yang "kelihatannya
sederhana" seperti todo-list atau perubahan konfigurasi. Justru di
proyek-proyek "sepele" itulah asumsi tak diperiksa paling sering
menjadi sumber rework.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "You MUST use this before any creative work — creating features,
> building components, adding functionality, or modifying behavior.
> Explores user intent, requirements and design before implementation."

Bullet trigger praktis:

- Sebelum menulis fitur baru, komponen baru, atau utility apa pun.
- Sebelum mengubah perilaku sistem yang sudah ada secara material.
- Saat pengguna meminta "buatkan X" tanpa spec tertulis.
- Saat skill `EnterPlanMode` hendak dipanggil — brainstorming
  mendahuluinya.

## Cara menggunakannya

Skill ini terstruktur sebagai checklist 9 langkah (yang harus
dibuatkan TodoWrite-nya):

1. **Eksplorasi konteks proyek** — periksa file, dokumentasi, commit
   terbaru.
2. **Tawarkan Visual Companion** jika topik mengandung pertanyaan
   visual (pesan terpisah, bukan digabung pertanyaan lain).
3. **Tanya klarifikasi** — satu pertanyaan per pesan, multiple choice
   bila memungkinkan, fokus pada tujuan/constraints/success criteria.
4. **Usulkan 2–3 pendekatan** dengan trade-off dan rekomendasi.
5. **Presentasikan desain** per bagian, minta persetujuan setelah
   tiap bagian.
6. **Tulis design doc** ke `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
   dan commit ke git.
7. **Spec self-review** — scan placeholder, konsistensi internal,
   scope, ambiguitas; perbaiki inline.
8. **User mereview spec tertulis** sebelum lanjut.
9. **Transisi ke implementasi** — invoke skill `writing-plans` (satu-satunya
   skill yang boleh dipanggil setelah brainstorming).

File pendukung di direktori sumber:

- `visual-companion.md` — panduan lengkap mode browser untuk mockup,
  diagram, dan perbandingan visual.
- `spec-document-reviewer-prompt.md` — template subagent untuk
  mereview dokumen spesifikasi.
- `scripts/` — utilitas pendukung Visual Companion.

## Contoh / Studi kasus

Pengguna meminta: "Buatkan dashboard analytics untuk toko online."
Tanpa brainstorming, agent biasanya langsung membuat halaman React
dengan chart-chart umum (revenue, orders, users) dan database schema
generik. Hasil: kerja sia-sia karena ternyata pengguna hanya butuh
satu metrik tunggal (conversion rate per kategori produk) untuk
laporan mingguan ke supplier.

Dengan brainstorming, agent akan:

1. Memeriksa file/commit dulu — apakah sudah ada metrics module?
2. Bertanya scope: "Dashboard ini untuk siapa — pemilik toko,
   supplier, atau internal ops?" (multiple choice).
3. Mendalami sukses kriteria: "Apa keputusan yang akan diambil
   pengguna setelah melihat dashboard ini?"
4. Mengusulkan 2–3 pendekatan: (a) satu metric card, (b) tabel
   ringkas per kategori, (c) chart interaktif.
5. Menulis spec singkat (~200 kata) dan minta approval.

Setelah disetujui, baru `writing-plans` dipanggil untuk membuat plan
implementasinya.

## Kesimpulan

Brainstorming adalah gerbang wajib sebelum semua pekerjaan kreatif.
Ia melindungi pengguna (dan agent) dari membangun hal yang salah
dengan memaksa dialog terstruktur — satu pertanyaan per kali, 2–3
pendekatan, design yang disetujui, spec yang ditulis dan disetujui
ulang. Output terminalnya selalu spec yang siap diserahkan ke skill
`writing-plans`, dan tidak pernah implementasi langsung.
