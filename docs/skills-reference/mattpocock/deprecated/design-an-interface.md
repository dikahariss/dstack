# Design an Interface

> **Sumber:** [`skills/deprecated/design-an-interface/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/deprecated/design-an-interface/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** deprecated

## Mengapa skill ini penting

Skill ini mengangkat prinsip "Design It Twice" dari buku *A Philosophy of Software Design* karya John Ousterhout: ide pertama yang muncul di kepala hampir tidak pernah menjadi desain terbaik. Untuk modul yang akan dipakai berulang kali (API publik, contract antar layer, port di hexagonal architecture), perlu paksaan eksplisit untuk membandingkan beberapa bentuk interface yang sangat berbeda sebelum memilih.

Skill di-deprecate karena cakupannya bergerak ke arah pekerjaan arsitektur yang lebih luas dan kini ditangani sebagai bagian dari `engineering/improve-codebase-architecture` (yang mencantumkan dokumen pendamping `INTERFACE-DESIGN.md`). Namun nilai inti — desain interface secara paralel oleh beberapa sub-agent dengan constraint berbeda — tetap relevan sebagai pola.

## Kapan menggunakannya

- User minta "design it twice" atau ingin mengeksplorasi beberapa bentuk API/modul sebelum implementasi.
- Sedang merancang interface modul yang akan dipakai oleh banyak caller, terutama bila perubahan interface mahal.
- Sebelum mengunci kontrak port di hexagonal architecture.
- Frontmatter description menyebut "Generate multiple radically different interface designs for a module using parallel sub-agents".

## Cara menggunakannya

1. **Gather requirements**: pahami problem yang diselesaikan modul, siapa caller-nya, operasi kunci, constraint (perf, kompatibilitas), apa yang harus disembunyikan vs diekspos.
2. **Generate designs**: spawn 3+ sub-agent paralel via Task tool. Tiap agent diberi constraint berbeda:
   - Minimalkan jumlah method (1–3 maksimum)
   - Maksimalkan fleksibilitas
   - Optimalkan untuk common case
   - Inspirasi dari paradigma/library tertentu
3. **Present designs** sequentially: signature, contoh penggunaan, apa yang disembunyikan.
4. **Compare**: simplicity, generality, efficiency, depth, ease of correct use.
5. **Synthesize**: sering desain terbaik adalah kombinasi insight dari beberapa opsi.

## Contoh / Studi kasus

Misal sebuah modul perlu menulis hasil render ke filesystem. Tiga sub-agent diminta merancang interface dengan constraint berbeda. Agent A mengusulkan satu method `write(skill, target)` (paling sederhana). Agent B membuat builder API dengan opsi atomic write, dry-run, dan callback (paling fleksibel). Agent C menyediakan `writeMany(skills[], target)` plus single-skill wrapper, dioptimalkan untuk skenario batch yang paling umum. Setelah ditampilkan berurutan, diskusi tradeoff menunjukkan bahwa varian C menghadirkan depth paling besar — kompleksitas batch tersembunyi tetapi tetap mudah dipakai untuk single skill — sehingga dipilih sebagai dasar dan dikombinasikan dengan opsi dry-run dari varian B.

## Kesimpulan

Walau ditandai deprecated, pola "paralel sub-agent dengan constraint berbeda lalu bandingkan" tetap teknik produktif untuk melatih intuisi desain interface yang dalam. Untuk pekerjaan baru, gunakan `improve-codebase-architecture` yang sudah mengintegrasikan pola ini ke dalam alur perbaikan arsitektur yang lebih besar.
