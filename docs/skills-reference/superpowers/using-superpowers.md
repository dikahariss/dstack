# Using Superpowers

> **Sumber:** [`skills/using-superpowers/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Skill catalog hanya berguna kalau agent benar-benar menggunakannya.
Default LLM adalah meloncat ke jawaban — "saya bisa lakukan ini",
"saya tahu konsepnya" — dan melewatkan skill yang sebenarnya
seharusnya dipanggil. Skill ini adalah **meta-skill**: aturan
bagaimana skill lain ditemukan dan dipakai di setiap turn percakapan.

Aturan kerasnya: kalau ada peluang 1% bahwa skill berlaku untuk
tugas Anda, Anda **wajib** invoke skill itu. Tidak ada negosiasi,
tidak ada rasionalisasi. Bahkan untuk pertanyaan klarifikasi —
pengecekan skill terjadi **sebelum** respons apa pun, termasuk
clarifying questions.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when starting any conversation — establishes how to find
> and use skills, requiring Skill tool invocation before ANY
> response including clarifying questions."

Trigger praktis:

- Setiap pesan pengguna baru.
- Sebelum `EnterPlanMode` (cek brainstorming dulu).
- Tidak berlaku untuk subagent yang di-dispatch dengan tugas
  spesifik (`<SUBAGENT-STOP>` di awal skill).

## Cara menggunakannya

Aturan inti: **Invoke relevant or requested skills BEFORE any
response or action.**

Hierarki prioritas instruksi:

1. **User explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md,
   direct requests) — tertinggi.
2. **Superpowers skills** — override default system behavior.
3. **Default system prompt** — terendah.

Jika CLAUDE.md bilang "jangan pakai TDD" dan skill bilang "selalu
TDD" — ikuti pengguna.

Mekanisme akses per platform:

- **Claude Code**: pakai `Skill` tool. Jangan pernah pakai `Read`
  tool pada skill files.
- **Copilot CLI**: pakai `skill` tool — auto-discovered dari plugins.
- **Gemini CLI**: pakai `activate_skill` tool. Metadata loaded di
  session start, full content on demand.

Tool mapping cross-platform tersedia di direktori `references/`
sumber (`copilot-tools.md`, `codex-tools.md`).

Prioritas saat multiple skill cocok:

1. **Process skills first** (brainstorming, debugging) — menentukan
   HOW.
2. **Implementation skills second** (frontend-design, mcp-builder) —
   menentukan eksekusi.

"Let's build X" → brainstorming dulu, lalu implementation skills.
"Fix this bug" → debugging dulu, lalu domain-specific skills.

Skill types:

- **Rigid** (TDD, debugging) — ikuti persis, jangan adapt away
  discipline.
- **Flexible** (patterns) — adaptasi prinsip ke konteks.

Skill itu sendiri akan memberi tahu Anda termasuk type yang mana.

## Contoh / Studi kasus

Pengguna: "Tambah endpoint baru untuk export laporan ke CSV."

Default agent (tanpa skill ini): langsung tulis route handler, mungkin
tanya satu pertanyaan klarifikasi soal format kolom.

Dengan skill ini, agent:

1. Sebelum response apa pun, cek apakah skill berlaku.
2. **Brainstorming** berlaku — ini creative work, perlu desain dulu.
3. Invoke `brainstorming` skill, announce: "Using brainstorming to
   explore this idea."
4. Buat TodoWrite per checklist item brainstorming.
5. Ikuti skill: eksplor konteks proyek, tanya satu pertanyaan, dst.

Anti-pattern yang dicegah:

- "This is just a simple question" → Questions are tasks, cek
  skill.
- "Let me explore codebase first" → Skill tell you HOW to explore.
- "I remember this skill" → Skills evolve, baca versi current.
- "The skill is overkill" → Simple things become complex.

## Kesimpulan

Using-superpowers adalah fondasi seluruh skill catalog superpowers.
Tanpa disiplin ini, skill lain hanya jadi dokumentasi yang dilewatkan.
Aturan 1% berarti agent harus pesimis tentang kemampuannya sendiri
dan optimis tentang nilai skill — invoke kalaupun ragu. Kalau setelah
invoke ternyata skill tidak relevan, tidak perlu dipakai. Tapi tidak
invoke sama sekali = kehilangan peluang nilai. Untuk dstack, prinsip
ini setara dengan kewajiban memanggil skill yang relevan sebelum
melakukan implementation work apa pun.
