# Skills Reference

Dokumentasi referensi Bahasa Indonesia untuk semua skill yang dipakai
sebagai influence dan workflow di ekosistem ini. Setiap skill punya
satu file yang menjawab empat pertanyaan: *kenapa penting*, *kapan
dipakai*, *bagaimana cara pakainya*, *contoh konkret*.

Tujuannya bukan menggantikan `SKILL.md` aslinya — itu tetap kanon. File
di sini adalah peta cepat: scan dulu, lalu buka sumber asli kalau perlu
detail eksekusi.

## Daftar repo

| Repo | Jumlah skill | Folder | Karakter |
|---|---:|---|---|
| [anthropics-skills](anthropics/) | 17 | `anthropics/` | Resmi Anthropic. Skill produksi untuk Claude.ai & API. Fokus pada output artifact (docx, pdf, pptx, web). |
| [gstack](gstack/) | 46 | `gstack/` | Workflow internal Haris. Pipeline plan-mode (CEO/Design/Eng/DX review), shipping (`/ship`, `/land-and-deploy`), QA, dan integrasi browser. |
| [mattpocock-skills](mattpocock/) | 28 | `mattpocock/` | Skill personal Matt Pocock. Domain knowledge & engineering discipline (TDD, diagnose, triage, to-prd, dst). Dibagi per bucket. |
| [superpowers](superpowers/) | 14 | `superpowers/` | Komunitas Obra. Discipline pengembangan — TDD strict, systematic debugging, code review pipeline, plan execution. |
| **Total** | **105** | — | — |

## Cara baca dokumen ini

Setiap file skill mengikuti struktur yang sama:

1. **Mengapa skill ini penting** — masalah yang dipecahkan.
2. **Kapan menggunakannya** — trigger spesifik (kutipan dari frontmatter `description` kalau ada).
3. **Cara menggunakannya** — langkah ringkas + invokasi + file pendukung.
4. **Contoh / Studi kasus** — minimal satu skenario konkret.
5. **Kesimpulan** — ringkasan padat: apa skill ini, untuk siapa, hasil akhirnya apa.

Header tiap file menyebutkan path absolut ke `SKILL.md` aslinya supaya
mudah loncat ke sumber otoritatif.

## Cara navigasi cepat

- Mau lihat semua skill di satu repo → buka `README.md` di subfolder repo
  tersebut. Tiap README punya tabel atau daftar 1-line per skill.
- Mau cari skill berdasarkan masalah ("ada skill buat debug nggak?") →
  pakai `grep` di folder ini, mis. `grep -ril "debug" docs/skills-reference/`.
- Mau bandingkan dua skill mirip (mis. `mattpocock/engineering/tdd` vs
  `superpowers/test-driven-development`) → keduanya pakai struktur
  identik, jadi side-by-side comparison gampang.

## Hubungan dengan dstack

dstack ini renderer skill — kapabilitasnya dibatasi oleh ADR-0001
(hexagonal, YAGNI). Dokumentasi di folder ini **tidak** dipakai oleh
build pipeline; ini murni referensi human-readable. File-file di
`skills/` (root dstack) yang akan di-render ke `.claude/skills/`.

Empat repo di atas adalah *influences*, bukan dependencies (lihat
`CLAUDE.md` di root dstack). Dokumentasi ini membantu Haris dan agent
lain memahami **kosa kata desain** yang diadopsi dstack: pola bucket
dari mattpocock, discipline TDD dari superpowers, schema Agent Skills
dari anthropics, dan workflow ship/plan dari gstack sendiri.

## Cara update dokumentasi

Saat ada skill baru di salah satu repo:

1. Baca `SKILL.md` baru.
2. Buat file dengan template yang sama di folder repo terkait.
3. Update tabel di README subfolder repo tersebut.
4. Update angka total di tabel atas (jika perubahan signifikan).

Saat skill di-deprecate atau dihapus dari source:

1. Tandai di README repo (mis. "deprecated, lihat X").
2. Jangan hapus file ini sebelum konfirmasi — referensi historis tetap
   berguna.
