# Migrate to Shoehorn

> **Sumber:** [`skills/misc/migrate-to-shoehorn/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/misc/migrate-to-shoehorn/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** misc

## Mengapa skill ini penting

Di test code, sering kita perlu pass partial data ke function yang tipenya kaya (e.g. `Request` dengan 20+ properti, tapi test cuma peduli `body.id`). Solusi tradisional: `as Type` assertion — TypeScript happy, tapi double-edged: tipe target harus disebutkan manual, dan `as unknown as Type` dipakai untuk data yang sengaja salah, menyebabkan readers berhenti percaya tipe.

`@total-typescript/shoehorn` (library Matt Pocock) menyediakan tiga helper: `fromPartial()` (partial data yang type-checked), `fromAny()` (data sengaja salah, autocomplete tetap jalan), `fromExact()` (force full object, swap nanti dengan fromPartial). Skill ini memandu migrasi test file dari `as` ke shoehorn.

**Test code only** — jangan pakai di production code.

## Kapan menggunakannya

- User menyebut shoehorn, ingin replace `as` di test, atau butuh partial test data.
- Codebase punya test dengan banyak `as Type` / `as unknown as Type`.
- Frontmatter description: "Migrate test files from `as` type assertions to @total-typescript/shoehorn".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Ganti semua `as Type` di test file dengan shoehorn."
- "Migrasi assertion `as unknown as` di spec file ke fromAny."
- "Pakai shoehorn untuk partial test data di suite ini."
- Kata kunci kanonik (EN): `shoehorn`, `fromPartial`,
  `replace as`, `partial test data`.

Contoh task lengkap:

> "Di `src/api/__tests__/user.spec.ts` ada banyak
> `as Request` dan `as unknown as Request`. Migrasi ke
> shoehorn — `fromPartial()` untuk data valid partial,
> `fromAny()` untuk data yang sengaja salah. Install dulu
> jika belum ada, lalu jalankan typecheck."

Yang terjadi: skill menginstall `@total-typescript/shoehorn`,
mencari semua `as` assertion di file test, mengganti pola
`as Type` dengan `fromPartial()` dan `as unknown as Type`
dengan `fromAny()`, menambah import yang diperlukan, lalu
menjalankan typecheck untuk verifikasi.

## Cara menggunakannya

1. **Gather requirements**: file test mana yang punya `as` assertion bermasalah? Apakah large object dengan few needed properties? Butuh pass intentionally wrong data untuk error testing?
2. **Install**: `npm i @total-typescript/shoehorn`
3. **Find target files**: `grep -r " as [A-Z]" --include="*.test.ts" --include="*.spec.ts"`
4. **Migrate patterns**:
   - `as Type` → `fromPartial()` untuk partial data yang valid
   - `as unknown as Type` → `fromAny()` untuk data sengaja salah
   - `fromExact()` untuk force full (swap nanti)
5. **Add imports** dari `@total-typescript/shoehorn`.
6. **Run type check** untuk verify.

| Function        | Use case                                           |
| --------------- | -------------------------------------------------- |
| `fromPartial()` | Pass partial data yang masih type-check             |
| `fromAny()`     | Pass data sengaja salah (autocomplete tetap jalan) |
| `fromExact()`   | Force full object (swap dengan fromPartial nanti)  |

## Contoh / Studi kasus

Before:

```ts
it("gets user by id", () => {
  getUser({
    body: { id: "123" },
    headers: {},
    cookies: {},
    // ...20 properti fake lain
  });
});

it("rejects invalid id", () => {
  getUser({ body: { id: 123 } } as unknown as Request);
});
```

After:

```ts
import { fromPartial, fromAny } from "@total-typescript/shoehorn";

it("gets user by id", () => {
  getUser(fromPartial({ body: { id: "123" } }));
});

it("rejects invalid id", () => {
  getUser(fromAny({ body: { id: 123 } }));
});
```

Test pertama bersih dari fake properties; test kedua tidak lagi pakai `as unknown as`, tapi tetap memungkinkan pass data sengaja salah.

## Kesimpulan

Skill yang sangat fokus. Pattern paling sering dipakai: `fromPartial()` untuk large interface, `fromAny()` untuk error path testing. Aturan paling load-bearing: **test code only** — produksi harus tetap menulis data lengkap dan benar.
