# Obsidian Vault

> **Sumber:** [`skills/personal/obsidian-vault/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/personal/obsidian-vault/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** personal

## Mengapa skill ini penting

Skill personal untuk mengelola Obsidian vault milik Matt Pocock di `/mnt/d/Obsidian Vault/AI Research/`. Vault flat di root level — tidak pakai folder untuk organisasi, melainkan **index notes** (aggregator) dan **wikilinks** (`[[Note Title]]`). Pendekatan ini menjadikan vault navigable lewat link graph, bukan hierarchy folder.

Karena skill personal dengan path absolut yang hard-coded ke environment satu user, ini tidak portabel — tapi sangat instruktif sebagai contoh skill "personal infrastructure".

## Kapan menggunakannya

- Bila Anda adalah Matt Pocock (atau menjalankan setup vault serupa dengan path sama).
- Sebagai template untuk membuat skill personal sendiri yang interact dengan vault Anda.
- Frontmatter description: "Search, create, and manage notes in the Obsidian vault with wikilinks and index notes".

## Cara menggunakannya

**Vault location**: `/mnt/d/Obsidian Vault/AI Research/`, mostly flat at root.

**Naming conventions**:
- **Index notes**: aggregate related topics — `Ralph Wiggum Index.md`, `Skills Index.md`, `RAG Index.md`.
- **Title Case** untuk semua note name.
- **No folders** untuk organization — pakai link + index note.

**Linking**: Obsidian `[[wikilinks]]` syntax: `[[Note Title]]`. Notes link to dependencies/related notes di bawah. Index notes hanya list `[[wikilinks]]`.

**Workflows**:

- **Search by filename**:
  ```bash
  find "/mnt/d/Obsidian Vault/AI Research/" -name "*.md" | grep -i "keyword"
  ```
- **Search by content**:
  ```bash
  grep -rl "keyword" "/mnt/d/Obsidian Vault/AI Research/" --include="*.md"
  ```
  Atau pakai Grep/Glob tools langsung.
- **Create note baru**: Title Case filename, content sebagai unit of learning, `[[wikilinks]]` ke related notes di bawah. Bila bagian dari sequence bernomor, pakai hierarchical numbering.
- **Find backlinks**:
  ```bash
  grep -rl "\\[\\[Note Title\\]\\]" "/mnt/d/Obsidian Vault/AI Research/"
  ```
- **Find index notes**:
  ```bash
  find "/mnt/d/Obsidian Vault/AI Research/" -name "*Index*"
  ```

## Contoh / Studi kasus

Matt menambahkan note baru "Retrieval Augmented Generation Caveats". Skill: Title Case, simpan ke `/mnt/d/Obsidian Vault/AI Research/Retrieval Augmented Generation Caveats.md`. Content unit of learning. Di bagian bawah: `[[RAG Index]]`, `[[Hallucination]]`, `[[Evaluation Strategies]]`. Lalu `RAG Index.md` diupdate menambahkan baris `[[Retrieval Augmented Generation Caveats]]`. Search nanti lewat grep di vault path.

## Kesimpulan

Skill personal dengan path keras-coded. Untuk Anda yang ingin mengadopsi pola ini: ganti path, ganti naming convention bila perlu, dan pertahankan inti — **flat structure + index notes + wikilinks + Title Case**. Bila pakai Obsidian dengan vault portable, lebih baik baca path dari env var ketimbang hard-code.
