# Verification Before Completion

> **Sumber:** [`skills/verification-before-completion/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Mengklaim "done", "tests pass", atau "fixed" tanpa baru saja menjalankan
perintah verifikasi adalah **dishonesty**, bukan efisiensi. Sumber
masalah: agent sering merasa percaya diri ("should work now"),
mengandalkan output run sebelumnya, atau percaya pada laporan
sub-agent tanpa verifikasi independen. Hasilnya: bug yang lolos ke
commit/PR, fungsi tidak terdefinisi yang crash di produksi, dan
hilangnya kepercayaan pengguna ("I don't believe you").

Skill ini menanamkan The Iron Law: **NO COMPLETION CLAIMS WITHOUT
FRESH VERIFICATION EVIDENCE.** Kalau belum jalankan perintah
verifikasi di message ini, tidak boleh klaim bahwa ia pass.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when about to claim work is complete, fixed, or passing,
> before committing or creating PRs — requires running verification
> commands and confirming output before making any success claims;
> evidence before assertions always."

Trigger praktis (SELALU sebelum):

- Klaim sukses/completion (apapun fraseologinya).
- Ekspresi kepuasan ("Great!", "Perfect!", "Done!").
- Pernyataan positif tentang work state.
- Commit, PR creation, task completion.
- Pindah ke task berikutnya.
- Delegasi ke agent.

## Cara menggunakannya

Gate function 5 langkah:

1. **IDENTIFY**: perintah apa yang membuktikan klaim ini?
2. **RUN**: eksekusi FULL command (fresh, complete) di message ini.
3. **READ**: full output, cek exit code, hitung failures.
4. **VERIFY**: apakah output mengonfirmasi klaim?
   - Jika TIDAK → nyatakan status sebenarnya dengan evidence.
   - Jika YA → nyatakan klaim WITH evidence.
5. **ONLY THEN**: buat klaim.

Skip step apapun = lying, bukan verifying.

Common failure modes:

| Klaim | Butuh | Tidak cukup |
|---|---|---|
| Tests pass | Output test command: 0 failures | Run sebelumnya, "should pass" |
| Linter clean | Output linter: 0 errors | Partial check, ekstrapolasi |
| Build succeeds | Build command: exit 0 | Linter pass, "logs look good" |
| Bug fixed | Test original symptom: passes | Kode diubah, diasumsikan fixed |
| Regression test works | Red-green cycle verified | Test pass sekali |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

Skill ini hanya berisi `SKILL.md` tunggal — tidak ada file pendukung.

## Contoh / Studi kasus

**Pattern: regression test (TDD red-green):**

Salah (tanpa verifikasi):

```
I've written a regression test for the bug.
```

Benar:

```
1. Write regression test
2. Run → PASS (suspicious, this is post-fix code)
3. Revert fix
4. Run → MUST FAIL (proves test catches the bug)
5. Restore fix
6. Run → PASS
[Now] "Regression test verified: catches bug when fix is reverted,
       passes when fix is in place."
```

**Pattern: agent delegation:**

Salah:

```
Agent reports success → Trust report → Claim done
```

Benar:

```
Agent reports success → git diff → verify changes match expectation
→ run test → "Agent completed; diff shows X, Y, Z; 12/12 tests pass"
```

**Pattern: build vs linter:**

Salah:

```
Linter passed → "Build is clean"
```

Benar:

```
Linter passed AND build run separately → exit 0 → "Linter clean,
build passes"
```

Linter ≠ compiler. Banyak error compilation tidak ditangkap linter.

## Kesimpulan

Verification-before-completion adalah penjaga kejujuran agent. Iron
Law-nya: tanpa evidence baru di message ini, tidak ada klaim. Tabel
rasionalisasi panjang ada di skill ini karena godaan untuk skip
sangat besar — terutama saat lelah, di akhir sesi, atau setelah
banyak iterasi. Skill ini berbobot setara TDD dan systematic-debugging
sebagai disiplin fondasional. Padukan dengan keduanya: TDD memastikan
test ada, systematic-debugging memastikan root cause ditemukan,
verification memastikan klaim "done" benar-benar didukung evidence.
