# Systematic Debugging

> **Sumber:** [`skills/systematic-debugging/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md)
> **Repo:** superpowers (komunitas, fokus discipline pengembangan)

## Mengapa skill ini penting

Random fixes adalah biaya tersembunyi terbesar dalam debugging. Agent
yang menebak — "coba ubah ini, lihat apakah jalan" — tidak hanya
memperlambat resolusi, tapi sering menambah bug baru di tempat lain
dan menutupi root cause asli. Skill ini menanamkan The Iron Law:
**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.** Symptom fixes
adalah kegagalan.

Empat fase berurutan (Root Cause → Pattern Analysis → Hypothesis →
Implementation) memaksa agent berhenti menebak, mengumpulkan evidence,
membandingkan dengan working examples, merumuskan hipotesis spesifik,
test minimal, baru fix. Berdasarkan data sesi: pendekatan sistematis
membutuhkan 15–30 menit dengan first-time fix rate ~95%, sementara
random fixes menghabiskan 2–3 jam thrashing dengan first-time fix
rate ~40% dan sering memunculkan bug baru.

## Kapan menggunakannya

Frontmatter aslinya berbunyi:

> "Use when encountering any bug, test failure, or unexpected
> behavior, before proposing fixes."

Trigger praktis:

- Test failure (single atau multi-file).
- Bug di produksi atau staging.
- Perilaku tak terduga.
- Performance problem atau build failure.
- **Khususnya** saat under time pressure, saat "just one quick fix"
  terlihat obvious, atau setelah sudah mencoba beberapa fix.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Test ini flaky, debug sistematis sampai ke akar."
- "Cari root cause kenapa upload gagal di production."
- "Berhenti nebak — investigasi bug ini beneran dulu."
- Kata kunci kanonik (EN): `debug`, `find the root cause`,
  `investigate`, `stop guessing`.

Contoh task lengkap:

> "Endpoint /checkout kadang return 500 di production tapi gak pernah
> kereproduce di lokal. Jangan langsung tambal — debug sistematis:
> cari root cause-nya dulu, baru usulkan fix."

Yang terjadi: agent menjalankan empat fase wajib (Root Cause → Pattern
Analysis → Hypothesis → Implementation), mengumpulkan evidence sebelum
menebak, dan tidak mengusulkan fix sebelum akar masalah terbukti; 3+
fix gagal = stop dan pertanyakan arsitektur.

## Cara menggunakannya

Empat fase wajib berurutan:

1. **Phase 1: Root Cause Investigation** — baca error messages
   lengkap, reproduce konsisten, cek recent changes, **gather evidence
   di multi-component systems** (instrumentasi tiap boundary), trace
   data flow ke sumber.
2. **Phase 2: Pattern Analysis** — temukan working examples,
   bandingkan, identifikasi tiap perbedaan, pahami dependencies.
3. **Phase 3: Hypothesis and Testing** — formulasikan satu hipotesis
   spesifik ("Saya kira X adalah root cause karena Y"), test minimal,
   verifikasi sebelum lanjut.
4. **Phase 4: Implementation** — buat failing test case dulu,
   implement single fix, verifikasi. **Jika 3+ fix gagal: stop dan
   pertanyakan arsitektur.**

File pendukung di direktori sumber:

- `root-cause-tracing.md` — teknik backward tracing lengkap.
- `defense-in-depth.md` — validasi di multiple layers setelah root
  cause ditemukan.
- `condition-based-waiting.md` — ganti arbitrary timeout dengan
  condition polling.
- `condition-based-waiting-example.ts` — contoh helper TypeScript.
- `find-polluter.sh` — script utility.
- Test fixtures (`test-academic.md`, `test-pressure-1/2/3.md`) untuk
  testing skill ini sendiri.

## Contoh / Studi kasus

Skenario multi-layer (CI → build script → signing script → codesign):

**Phase 1 — gather evidence:**

```bash
# Layer 1: Workflow
echo "=== Secrets available in workflow: ==="
echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

# Layer 2: Build script
echo "=== Env vars in build script: ==="
env | grep IDENTITY || echo "IDENTITY not in environment"

# Layer 3: Signing script
echo "=== Keychain state: ==="
security list-keychains
security find-identity -v

# Layer 4: Actual signing
codesign --sign "$IDENTITY" --verbose=4 "$APP"
```

Output mengungkap: secrets → workflow ✓, workflow → build ✗.
Investigasi terfokus di build script, bukan di codesign atau
keychain.

Anti-pattern yang dicegah skill ini — agent biasanya akan:

1. Coba `codesign` dengan flag berbeda (gagal).
2. Coba reset keychain (gagal).
3. Coba regenerate certificate (gagal).
4. 2 jam terbuang, root cause masih tidak ditemukan.

Dengan skill ini, instrumentasi 5 menit mengungkap bahwa env var
tidak diteruskan dari workflow ke build script — fix 1 baris.

**Phase 4.5 — saat 3+ fix gagal:** stop, tanyakan apakah pattern
fundamentalnya yang salah. Mungkin shared state yang dipakai bukan
pendekatan yang tepat, refactor architecture lebih kecil daripada
trying-fix-#4.

## Kesimpulan

Systematic debugging adalah disiplin yang membayar dirinya sendiri
berkali-kali lipat. Aturan utama: NO FIXES WITHOUT ROOT CAUSE.
Empat fase memaksa agent mengumpulkan evidence sebelum menyentuh
kode, dan threshold 3-fix-failures memaksa pause untuk mempertanyakan
arsitektur, bukan menambah fix ke-4. Cocok dipadukan dengan
`test-driven-development` (untuk failing test reproduksi di Phase 4)
dan `verification-before-completion` (untuk memverifikasi fix benar-benar
bekerja).
