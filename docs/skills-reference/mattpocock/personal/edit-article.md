# Edit Article

> **Sumber:** [`skills/personal/edit-article/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/personal/edit-article/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** personal

## Mengapa skill ini penting

Skill personal Matt Pocock yang sangat ringkas (2 step) untuk mengedit draft artikel. Inti aturan: informasi adalah **directed acyclic graph** — satu bagian informasi bergantung pada bagian sebelumnya. Urutan section dan isinya harus respect dependency itu. Setelah struktur dikonfirmasi, tiap section ditulis ulang untuk clarity, coherence, flow — dengan batas keras **maksimum 240 karakter per paragraf**.

Ini skill personal — preferensi style penulis yang dijadikan repeatable workflow.

## Kapan menggunakannya

- User punya draft artikel dan ingin merevisi.
- User bilang "edit this article", "improve this draft", "tighten the prose".
- Frontmatter description: "Edit and improve articles by restructuring sections, improving clarity, and tightening prose".

## Cara menggunakannya

1. **Divide article into sections** berdasar heading yang ada. Identifikasi main point yang ingin dibuat di tiap section. Pertimbangkan information sebagai DAG — pieces of information bergantung pada pieces lain. Pastikan urutan section + isinya respect dependency.

   Konfirmasi sections ke user sebelum proceed.

2. **Per section**: rewrite untuk improve clarity, coherence, flow. **Maksimum 240 karakter per paragraf.**

## Contoh / Studi kasus

Draft artikel "Memahami TypeScript Generics" punya 5 section: Intro, Apa itu Generic, Type Parameter, Constraints, Default, Use Cases. Skill identifikasi DAG: Use Cases bergantung pada Constraints + Default, Default bergantung pada Type Parameter, Type Parameter bergantung pada Apa itu Generic, Apa itu Generic bergantung pada Intro. Urutan saat ini valid. Tapi agent menyarankan Constraints harus muncul sebelum Default karena Default sering kombinasi dengan Constraint. User setuju.

Per section, rewrite — pecah paragraf panjang menjadi unit-unit ≤240 karakter, ganti kalimat kompleks dengan kalimat lebih pendek, hapus filler ("basically", "really", "I think"). Hasil: artikel 30% lebih pendek, jauh lebih scannable.

## Kesimpulan

Skill personal, sangat ringkas. Aturan paling load-bearing: **dependency-aware section order** (DAG) dan **≤240 karakter per paragraf**. Bila preferensi style Anda berbeda, mudah di-fork dengan menyesuaikan batas karakter dan langkahnya.
