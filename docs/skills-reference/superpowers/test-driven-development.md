# Test-Driven Development

> **Sumber:** [`skills/test-driven-development/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

TDD bukan tentang coverage. Ia tentang **proof**. Tes yang ditulis
setelah implementasi lulus instan — yang tidak membuktikan apa-apa,
karena tes itu mungkin mengetes hal yang salah, mengetes implementation
detail bukan behavior, atau melewatkan edge case yang lupa Anda
pikirkan. Skill ini menanamkan The Iron Law: **NO PRODUCTION CODE
WITHOUT A FAILING TEST FIRST.** Tulis kode dulu? Hapus. Mulai
ulang.

Siklus RED-GREEN-REFACTOR yang ketat memastikan tiap baris kode
produksi dilahirkan dari kebutuhan tes yang konkret. Tes pertama-tama
gagal karena fitur belum ada — ini adalah "watching the test fail"
yang membuktikan tes benar-benar menguji sesuatu. Lalu kode minimal
ditulis untuk memuaskan tes. Refactor terakhir membersihkan tanpa
menambah behavior.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when implementing any feature or bugfix, before writing
> implementation code."

Selalu:

- Fitur baru.
- Bug fixes.
- Refactoring.
- Behavior changes.

Pengecualian (tanya pengguna dulu): throwaway prototype, generated
code, configuration files.

Berpikir "skip TDD just this once"? Stop. Itu rasionalisasi.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Implementasi validator email ini pakai TDD."
- "Test-first ya — tulis test yang gagal dulu, baru kodenya."
- "Perbaiki bug ini dengan red-green-refactor."
- Kata kunci kanonik (EN): `do TDD`, `test-first`,
  `red-green-refactor`, `write the test first`.

Contoh task lengkap:

> "Tambahkan fungsi `retryOperation` yang mengulang operasi gagal
> maksimal 3 kali. Kerjakan dengan TDD — tulis test yang gagal dulu,
> tunjukkan ke aku gagalnya, baru kode minimal yang membuatnya lulus."

Yang terjadi: agent menulis satu test minimal, menjalankannya untuk
memastikan ia GAGAL karena fitur belum ada (bukan typo), baru menulis
kode seminimal mungkin agar lulus, lalu refactor tanpa menambah
behavior — RED → GREEN → REFACTOR.

## Cara menggunakannya

Siklus RED-GREEN-REFACTOR:

1. **RED — Write Failing Test**: satu test minimal, satu behavior,
   nama jelas, real code (mock hanya bila tak terhindarkan).
2. **Verify RED — Watch It Fail** (MANDATORY): jalankan tes,
   konfirmasi gagal karena fitur missing, bukan typo.
3. **GREEN — Minimal Code**: tulis kode paling sederhana yang
   membuat tes pass. Jangan over-engineer, jangan tambah fitur,
   jangan refactor kode lain.
4. **Verify GREEN — Watch It Pass** (MANDATORY): tes pass, tes
   lain tidak rusak, output pristine.
5. **REFACTOR — Clean Up**: hilangkan duplikasi, perbaiki nama,
   extract helpers. Tetap hijau, jangan tambah behavior.
6. **Repeat** — failing test berikutnya untuk fitur berikutnya.

File pendukung di direktori sumber:

- `testing-anti-patterns.md` — pitfall umum mock dan test utilities
  (testing mock behavior bukan real behavior, test-only methods di
  production classes, mocking tanpa paham dependencies).

Verifikasi checklist sebelum mark complete:

- Setiap fungsi/method baru punya test.
- Watched each test fail before implementing.
- Each test failed for expected reason (feature missing, not typo).
- Wrote minimal code to pass each test.
- All tests pass, output pristine.
- Tests use real code (mocks only if unavoidable).
- Edge cases and errors covered.

## Contoh / Studi kasus

Bug: empty email diterima form.

**RED:**

```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

**Verify RED:**

```bash
$ npm test
FAIL: expected 'Email required', got undefined
```

**GREEN:**

```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...
}
```

**Verify GREEN:**

```bash
$ npm test
PASS
```

**REFACTOR:** extract validation kalau ada field lain yang butuh
pola serupa.

Anti-rasionalisasi yang sering muncul:

- "Tests after achieve the same goals — it's spirit not ritual."
  Salah. Tests-after menjawab "what does this do?" Tests-first
  menjawab "what should this do?" Tests-after bias oleh implementasi
  Anda sendiri.
- "Deleting X hours of work is wasteful." Sunk cost fallacy. Kode
  tanpa tes terbukti = technical debt.

## Kesimpulan

TDD adalah disiplin paling fundamental dalam superpowers. Iron Law-nya
sederhana: kode produksi → tes ada dan gagal duluan; sebaliknya =
bukan TDD. Skill ini berisi tabel rasionalisasi panjang karena agent
LLM (sama seperti manusia) sangat kreatif menemukan alasan untuk
skip. Aturan emas: violating the letter is violating the spirit.
Padukan dengan `systematic-debugging` (Phase 4: failing test untuk
reproduksi bug) dan `verification-before-completion` (run command,
read output, baru claim).
