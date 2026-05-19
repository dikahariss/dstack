# Setup Pre-Commit

> **Sumber:** [`skills/misc/setup-pre-commit/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/misc/setup-pre-commit/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** misc

## Mengapa skill ini penting

Pre-commit hook adalah safety net murah: format file otomatis, jalankan typecheck, jalankan test — sebelum commit masuk repo. Bila skip, kode broken bisa masuk main branch dan baru ketahuan di CI (lebih lambat) atau worse di production. Skill ini scaffolding sekali pakai untuk setup Husky + lint-staged (Prettier) + script `typecheck` & `test` di pre-commit hook, dengan deteksi otomatis package manager (npm/pnpm/yarn/bun).

## Kapan menggunakannya

- Project baru tanpa pre-commit hook.
- User ingin add Husky, configure lint-staged, atau add commit-time formatting/typechecking/testing.
- Frontmatter description: "Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests".

## Cara menggunakannya

1. **Detect package manager**: cek `package-lock.json` (npm), `pnpm-lock.yaml` (pnpm), `yarn.lock` (yarn), `bun.lockb` (bun). Default npm bila tidak jelas.
2. **Install devDependencies**: `husky lint-staged prettier`.
3. **Initialize Husky**: `npx husky init` — buat `.husky/` + tambah `prepare: "husky"` di package.json.
4. **Create `.husky/pre-commit`** (no shebang untuk Husky v9+):

   ```
   npx lint-staged
   npm run typecheck
   npm run test
   ```

   Ganti `npm` dengan package manager terdeteksi. Bila repo tidak punya script `typecheck` atau `test`, omit baris itu dan beritahu user.
5. **Create `.lintstagedrc`**:

   ```json
   { "*": "prettier --ignore-unknown --write" }
   ```

6. **Create `.prettierrc`** (bila belum ada) dengan default reasonable: 2 space, 80 char, double quote, semi true, es5 trailing comma.
7. **Verify**: file ada, executable, prepare script benar, jalankan `npx lint-staged`.
8. **Commit**: `Add pre-commit hooks (husky + lint-staged + prettier)` — bagus sebagai smoke test bahwa hook bekerja.

## Contoh / Studi kasus

Project bun TypeScript baru tanpa hook. Skill deteksi `bun.lockb` → pakai bun. Install `husky lint-staged prettier`. `npx husky init`. Tulis `.husky/pre-commit`:

```
bunx lint-staged
bun run typecheck
bun test
```

Buat `.lintstagedrc` dengan rule prettier. Tidak buat `.prettierrc` karena project sudah punya. Verify dengan `bunx lint-staged` — semua file ter-format. Commit `Add pre-commit hooks (husky + lint-staged + prettier)`. Hook jalan, Prettier reformat 3 file, typecheck pass, test pass. Commit masuk.

## Kesimpulan

Skill yang sangat fokus dan deterministik. Aturan paling load-bearing: **deteksi package manager**, **omit `typecheck`/`test` line bila script tidak ada** (jangan break commit), dan **commit pertama berfungsi sebagai smoke test**. Husky v9+ tidak butuh shebang, gunakan bentuk modern.
