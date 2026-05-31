# Prototype

> **Sumber:** [`skills/engineering/prototype/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

Prototype adalah **throwaway code yang menjawab satu pertanyaan**. Pertanyaan menentukan bentuk: bila pertanyaannya tentang state model / business logic, bangun terminal app interaktif kecil yang memaksa state machine melewati case yang sulit dipikirkan di atas kertas. Bila pertanyaannya tentang UI, generate beberapa varian UI radikal di satu route, switchable lewat URL search param + floating bottom bar. Salah pilih branch = prototype sia-sia.

Skill ini mencegah dua jebakan klasik: (a) prototype yang berubah jadi produksi tanpa disadari, dan (b) prototype yang tidak menjawab apa-apa karena terlalu polished untuk dimainkan.

## Kapan menggunakannya

- User ingin prototype, sanity-check data model / state machine, mock UI, eksplor opsi desain.
- User bilang "prototype this", "let me play with it", "try a few designs".
- Frontmatter description: "Build a throwaway prototype to flesh out a design before committing to it."

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Prototype state machine subscription ini dulu sebelum kita
  commit."
- "Buat beberapa variasi UI untuk halaman index skill catalog,
  biar bisa aku coba-coba."
- "Let me play with the data model dulu — prototype aja."
- Kata kunci kanonik (EN): `prototype this`, `let me play
  with it`, `try a few designs`, `sanity-check data model`.

Contoh task lengkap:

> "Saya ragu state machine subscription (`active → past_due →
> suspended → cancelled`) handle webhook out-of-order dengan
> benar. Buat prototype terminal interaktif di
> `scripts/proto-sub-state.ts` — satu command untuk run, print
> full state setiap event, throwaway dan clearly marked."

Yang terjadi: agent mengidentifikasi ini sebagai logic branch,
membangun terminal app minimal yang loop minta input event dan
print state penuh setelah tiap transisi — tanpa persistence,
tanpa polish, tanpa error handling selain yang membuat prototype
bisa jalan. Jawaban dicatat di `NOTES.md`, prototype dihapus.

## Cara menggunakannya

1. **Pick branch**: tentukan pertanyaan inti.
   - "Does this logic / state model feel right?" → `LOGIC.md` branch (terminal interactive app).
   - "What should this look like?" → `UI.md` branch (beberapa varian UI di satu route).
   Bila ambigu dan user tidak reachable, default ke yang lebih cocok dengan kode sekitar; state asumsi di top prototype.
2. **Rules yang berlaku untuk keduanya**:
   - Throwaway dari hari pertama, **clearly marked** as such; lokasi dekat tempat dipakai.
   - One command to run; konvensi task runner yang ada di project.
   - No persistence by default; state di memori.
   - Skip polish — no tests, no error handling kecuali agar runnable.
   - **Surface state**: print/render full state setiap action atau switch.
   - **Delete or absorb when done** — jangan biarkan rotting.
3. **When done**: capture jawabannya di tempat durable (commit message, ADR, issue, atau `NOTES.md` di samping prototype) bersama pertanyaan yang dijawab. Lalu hapus prototype atau lipat ke real code.

## Contoh / Studi kasus

**Logic branch**: tim ragu apakah state machine subscription (`active → past_due → suspended → cancelled`) handle webhook out-of-order. Prototype: terminal script `bun scripts/proto-sub-state.ts` yang loop minta input event nama (`paid`, `failed`, `cancel`), apply transition, print full state sub setelah tiap event. Tim main 10 menit, menemukan bahwa `cancel` dari `past_due` perlu refund partial yang belum dipikirkan. Jawaban ditulis di `NOTES.md`, prototype dihapus.

**UI branch**: pertanyaan "skill catalog index page seperti apa?" Generate `/proto?variant=a|b|c` dengan satu route. Variant A: dense table. Variant B: card grid dengan filter. Variant C: tree per bucket. Floating bar di bawah punya tombol switch + URL state. Setelah dimainkan, A menang karena rapat banyak skill dalam satu screen. Decision dicatat di ADR, prototype dihapus.

## Kesimpulan

Aturan paling penting: **pertanyaan menentukan bentuk**. Salah branch = waste. Setelah pertanyaan terjawab, prototype harus mati — yang hidup hanyalah jawabannya, tercatat di tempat durable.
