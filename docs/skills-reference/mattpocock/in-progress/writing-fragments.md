# Writing Fragments

> **Sumber:** [`skills/in-progress/writing-fragments/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/in-progress/writing-fragments/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** in-progress

**Status:** in-progress — bagian dari trilogi penulisan eksperimental (`writing-fragments` → `writing-shape` atau `writing-beats`).

## Mengapa skill ini penting

Banyak penulis terlalu cepat memaksakan struktur ke ide yang masih mentah. Skill ini sengaja **menunda struktur**: jalankan grilling session yang menambang user untuk *fragmen* — nugget heterogen yang mungkin nanti masuk artikel: kalimat tajam, vignette, klaim dengan justifikasi satu baris, half-thought, quote, observasi cluster. Semua fragmen ditampung di satu markdown file, dipisahkan `---`. Tanpa outline, tanpa TOC. Model mentalnya: buku catatan novelis — bertahun-tahun unstructured noticings yang nanti ditambang.

Skill ini adalah hulu dari pipeline penulisan; hilirnya `writing-shape` (untuk merakit menjadi argumen) atau `writing-beats` (untuk merakit menjadi narasi).

## Kapan menggunakannya

- User ingin mengembangkan ide sebelum memberi struktur.
- User bilang "fragments", "ideate", "raw material" untuk tulisan.
- Sebelum mencoba menulis artikel utuh — bangun stok dulu.
- Frontmatter description: "mines the user for fragments ... appends them to a single document as raw material".

## Cara menggunakannya

1. **Run grilling session**: interview user relentlessly tentang topik. **Jangan impose phases, outline, atau structure** — itu out of scope.
2. **Tampung fragmen ke satu markdown file** seiring muncul dari kedua sisi percakapan. Bila user belum kasih path, tanya sekali lalu ingat.
3. **Capture fragmen dari awal**, termasuk dari prompt pertama user.
4. **First write**: satu H1 di atas dengan working title (boleh ganti nanti) — tidak ada metadata, TOC, atau date.
5. **Format file**: fragmen dipisah `\n---\n`. Tidak ada heading di dalam body. Tidak ada tag. Tidak ada urutan di luar urutan penambahan.
6. **Append silently**: jangan minta izin setiap fragmen, sebut sambil lalu ("adding that").
7. **Re-read file dari disk sebelum tiap write**: user mungkin edit, reorder, atau delete antar turn — preserve.
8. **First-class commands**: "cut the last one", "rewrite that one sharper", "merge those two".

## Contoh / Studi kasus

User memulai: "Saya pikir microservices itu masalah organisasi, bukan teknis." Agent: "Catat — itu thesis kalimat. Cerita konkret yang mendukung?" User cerita insiden dua tim yang split service tanpa kontrak jelas. Agent append:

```markdown
# Microservices itu masalah organisasi

Microservices bukan keputusan teknis. Itu keputusan organisasi.

---

Dua tim split satu service tanpa duduk bareng dulu menyepakati kontrak. Hasilnya:
3 minggu kemudian, satu tim ganti shape response, tim lain tidak tahu, production down
Senin pagi.

---

> "Conway's Law tidak menjelaskan apa pun. Conway's Law adalah ramalan."

— overheard di standup
```

Lanjut grilling: agent tanya tentang counter-examples, vignette positif, analogi. Tiap kali sebuah fragmen muncul, di-append. Setelah satu jam, file punya 22 fragmen tak terstruktur, siap di-shape lewat `writing-shape`.

## Kesimpulan

Status in-progress: pasangan natural adalah `writing-shape`/`writing-beats` di hilir. Aturan paling load-bearing: **jangan impose structure**, **re-read sebelum tiap write**, dan perlakukan "cut/rewrite/merge" sebagai instruksi first-class.
