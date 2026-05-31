# TDD

> **Sumber:** [`skills/engineering/tdd/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** engineering

## Mengapa skill ini penting

TDD klasik (red-green-refactor) sering disalahgunakan menjadi *horizontal slicing*: tulis semua test dulu, lalu semua implementasi. Hasilnya test "crap" — menguji bentuk yang dibayangkan bukan behavior aktual, insensitive terhadap perubahan nyata, dan terlalu coupling ke struktur internal. Skill ini menegakkan **vertical slices via tracer bullets**: satu test → satu implementasi → ulang. Tiap test merespons apa yang baru dipelajari dari cycle sebelumnya.

Filosofi inti: test harus memverifikasi behavior melalui public interface, bukan implementation detail. Kode boleh berubah total; test tidak boleh.

## Kapan menggunakannya

- User ingin TDD, "red-green-refactor", integration test, atau test-first development.
- Membangun fitur baru atau perbaikan bug di mana ada behavior baru yang dapat diobservasi via public interface.
- Frontmatter description: "Test-driven development with red-green-refactor loop".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Kerjakan fitur ini dengan TDD ya, test-first."
- "Tulis test yang gagal dulu sebelum implementasi."
- "Red-green-refactor — satu behavior per cycle."
- Kata kunci kanonik (EN): `TDD`, `red-green-refactor`, `test-first`,
  `integration tests`.

Contoh task lengkap:

> "Tambahkan fungsi `applyCoupon(cart, coupon)` ke checkout service.
> Kerjakan dengan TDD — mulai dari behavior paling penting dulu:
> kupon valid mengurangi harga. Tunjukkan test merah dulu, baru
> kode minimal yang membuatnya hijau, lalu kita lanjut ke behavior
> berikutnya."

Yang terjadi: agent mengonfirmasi prioritas behavior bersama user,
menulis satu test untuk behavior pertama dan menjalankannya sampai
RED, lalu menulis kode minimal agar GREEN — cycle diulang per
behavior, refactor hanya dilakukan setelah semua test hijau.

## Cara menggunakannya

1. **Planning**: pakai glossarium domain untuk nama test/interface; respect ADR area. Konfirmasi dengan user perubahan interface, behavior yang dites (dengan prioritas), opportunity untuk deep modules, desain interface yang testable. **Anda tidak bisa tes semuanya** — konfirmasi behavior mana yang paling penting.
2. **Tracer bullet**: tulis SATU test untuk SATU behavior pertama → RED → tulis minimal code → GREEN. Ini membuktikan path end-to-end.
3. **Incremental loop**: untuk tiap behavior berikutnya: RED → minimal code → GREEN. Aturan: satu test pada satu waktu; cukup code untuk pass test sekarang; jangan antisipasi test berikutnya; fokus pada observable behavior.
4. **Refactor**: setelah semua tests pass, cari refactor candidate (extract duplication, deepen modules, SOLID, run test setelah tiap step). **Never refactor while RED.**

Anti-pattern paling besar: bulk-write test dulu. Bila ketahuan, hentikan dan kembali ke vertical slice.

## Contoh / Studi kasus

Fitur: checkout dengan kupon. Behavior diprioritaskan: (1) checkout valid tanpa kupon → success, (2) kupon valid → harga diskon diterapkan, (3) kupon expired → error, (4) kupon stacked → error, (5) kupon dipakai per akun → error pada pemakaian kedua.

Tracer bullet: test "checkout valid cart returns success" → write minimal `checkout(cart)` → green. Cycle 2: test "valid coupon reduces price" → write code untuk apply coupon → green. Cycle 3: test "expired coupon returns error" → tambah check → green. Dan seterusnya.

Bila bulk-tulis 5 test sekaligus, ditemukan saat menulis impl bahwa test #4 sebetulnya butuh API berbeda (stacked → array, bukan single coupon) — test sudah commit ke shape yang salah. Vertical slice mencegah ini.

## Kesimpulan

Aturan paling load-bearing dari skill ini: **never refactor while RED**, dan **vertical slice, not horizontal**. Hindari menulis test untuk behavior yang belum dibutuhkan; biarkan test selanjutnya tumbuh dari apa yang dipelajari dari cycle sebelumnya.
