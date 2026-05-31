# Writing Beats

> **Sumber:** [`skills/in-progress/writing-beats/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/in-progress/writing-beats/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** in-progress

**Status:** in-progress — eksperimen format penulisan artikel sebagai journey of beats, choose-your-own-adventure style.

## Mengapa skill ini penting

Banyak draft artikel mati di tengah jalan karena terlalu cepat dikurung struktur (outline, headings, target word count). Skill ini mengusulkan pendekatan berbeda: artikel dibangun **beat by beat**, satu *move* pada satu waktu, dan setelah tiap beat user memilih ke mana beat berikutnya bercabang. Mirip choose-your-own-adventure. Artikel berakhir ketika journey selesai, bukan ketika pile bahan habis — leftover fragment justru tanda bahwa material melebihi kebutuhan, yang baik.

Skill ini berpasangan dengan `writing-fragments` (untuk mengumpulkan bahan mentah) dan `writing-shape` (untuk pendekatan shaping yang lebih argumentatif).

## Kapan menggunakannya

- User punya markdown file berisi raw material dan ingin merangkainya sebagai narasi (bukan argumen logis).
- User bilang ingin pendekatan "journey" / "story" / "beats" alih-alih outline.
- Frontmatter description: "Shape an article as a journey of beats, choose-your-own-adventure style".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Susun artikel ini sebagai journey of beats, bukan outline."
- "Rakit raw material ini jadi narasi beat-by-beat."
- "Mau nulis artikel story-style dari fragments ini."
- Kata kunci kanonik (EN): `writing beats`, `beats`,
  `choose-your-own-adventure`, `narrative journey`.

Contoh task lengkap:

> "Saya punya `fragments/microservices.md` berisi raw
> material. Bantu susun jadi artikel naratif dengan
> pendekatan beats — tawari 3 starting beat dulu, saya
> pilih, baru tulis ke `articles/microservices-draft.md`.
> Simpan satu beat per turn."

Yang terjadi: skill menawarkan 2–3 kandidat starting beat
dari raw material, user memilih satu, skill menulis tepat
satu beat ke file artikel dan berhenti, lalu menawarkan
2–3 arah next beat — loop terus sampai journey selesai.

## Cara menggunakannya

1. **Konfirmasi path artikel**: bila user belum sebut tempat simpan, tanya sekali dan ingat untuk sesi ini.
2. **Tulis 2–3 candidate starting beats** dari raw material, masing-masing entry point berbeda. Show ke user sebelum write ke file. Preview beat yang mungkin muncul setelahnya bila path ini diambil.
3. **Setelah user pilih starting beat**, tulis **hanya beat itu** ke article file. Beat boleh satu kalimat atau beberapa paragraf — apa pun ukuran natural beat. Berhenti.
4. **Re-read article file dari disk**, lalu tawarkan 2–3 candidate next beats — arah berbeda untuk pivot dari posisi sekarang.
5. **Loop** step 3–4 sampai journey selesai.

Aturan: append satu beat at a time, never write ahead. Re-read file dari disk sebelum tiap write — preserve edit user. Bila user edit beat sebelumnya substansial, biarkan itu mempengaruhi apa yang datang berikutnya. Bila user bilang "rewrite that beat" atau "go back and try a different beat 3", lakukan — edit in place, biarkan sisanya.

## Contoh / Studi kasus

Raw material: kumpulan fragmen tentang pengalaman migrasi monolith ke microservices. Agent tawarkan 3 starting beat:

A. *Anekdot opening* — "Pada hari Senin sistem down 3 jam karena satu service yang katanya sudah split." Beat lanjut: meletakkan blame, lalu apa yang sebenarnya terjadi.
B. *Punchline opening* — "Tujuh tahun setelah migrasi, kami merger ulang setengah service." Beat lanjut: kenapa, dan apa pelajarannya.
C. *Tinjauan netral* — "Microservices bukan keputusan teknis, tapi keputusan organisasi." Beat lanjut: argumentatif, dengan dukungan vignette.

User pilih B. Beat 1 ditulis ke file (3 paragraf). Re-read. Agent tawarkan 3 next beat: (1) ceritakan keputusan merge spesifik pertama, (2) zoom out ke teori organisasional, (3) jump ke kondisi tim hari ini. User pilih 1. Tulis beat 2. Lanjut sampai 7 beat. Pile masih punya 4 fragmen tak terpakai — itu OK.

## Kesimpulan

Status in-progress: pendekatan beats lebih cocok untuk artikel naratif daripada argumentatif. Bila artikel lebih tepat sebagai argumen logis, gunakan `writing-shape`. Aturan inti: **append one beat at a time, never write ahead, re-read file sebelum tiap write**.
