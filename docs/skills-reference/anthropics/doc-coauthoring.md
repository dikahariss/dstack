# Doc Co-Authoring

> **Sumber:** [`skills/doc-coauthoring/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md)
> **Repo:** anthropics-skills (resmi Anthropic)

## Mengapa skill ini penting

Menulis dokumen panjang via prompt biasa biasanya berakhir dengan satu monster draft
yang sulit di-review, atau ping-pong tanpa arah — user kasih konteks sepotong-sepotong,
Claude nebak sisanya. Skill ini menstrukturkan kolaborasi menjadi tiga tahap yang
disengaja: **Context Gathering**, **Refinement & Structure**, **Reader Testing**. Setiap
tahap punya checklist transisi yang jelas sehingga proses tidak macet di tengah.

Nilai uniknya: stage 3 (Reader Testing) — Claude bisa memanggil sub-agent dengan context
bersih (no context bleed) untuk menguji apakah dokumen benar-benar bekerja untuk pembaca
asing. Ini menangkap blind spot yang author sendiri tidak akan lihat. Cocok untuk
dokumen yang akan dibaca orang lain (PRD, RFC, design doc, decision doc).

## Kapan menggunakannya

Trigger dari frontmatter `description`:

- User mention "write a doc", "draft a proposal", "create a spec", "write up".
- User menyebut tipe dokumen spesifik: PRD, design doc, decision doc, RFC.
- User mulai menulis tugas substantial yang butuh struktur, bukan paragraf cepat.

Saat trigger, **tawarkan dulu** workflow ini — jelaskan tiga tahap dan tanya apakah user
mau coba atau prefer freeform. Hormati pilihan user.

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Bantu saya menulis decision doc migrasi database."
- "Saya mau draft RFC untuk sistem notifikasi baru."
- "Tolong co-author PRD fitur onboarding bareng saya."
- Kata kunci kanonik (EN): `write a doc`, `draft a proposal`,
  `create a spec`, `decision doc`, `RFC`.

Contoh task lengkap:

> "Saya perlu nulis design doc untuk migrasi autentikasi dari
> session cookie ke JWT. Audiensnya tim platform (8 orang).
> Bantu saya dengan workflow co-authoring — saya siap dump
> konteks dulu."

Yang terjadi: agent menawarkan workflow tiga tahap (Context
Gathering → Refinement & Structure → Reader Testing), lalu
memandu user: 5 pertanyaan meta, info-dump bebas, 5-10
clarifying questions, build section per section via brainstorm
+ curate + str_replace, dan akhirnya uji dokumen dengan
sub-agent fresh (no context bleed) untuk menangkap blind spot
sebelum dokumen dibagikan.

## Cara menggunakannya

### Stage 1: Context Gathering

Tujuan: menutup gap antara apa yang user tahu dan apa yang Claude tahu.

- Ajukan 5 pertanyaan meta: tipe dokumen, audience utama, dampak yang diinginkan,
  template/format yang harus diikuti, constraint lain.
- Dorong user info-dump (stream-of-consciousness OK, paste channel/dokumen, link Drive/Slack
  via integrasi yang tersedia).
- Saat user selesai dump awal, ajukan 5-10 numbered clarifying questions.
- Exit condition: pertanyaan menunjukkan paham — bisa ngobrol edge case tanpa user
  perlu menjelaskan basic.

### Stage 2: Refinement & Structure

Tujuan: bangun dokumen section-by-section. Loop per-section:

1. **Clarifying questions** — 5-10 pertanyaan spesifik tentang section.
2. **Brainstorm** — 5-20 opsi numbered (tergantung kompleksitas section).
3. **Curation** — user pilih keep/remove/combine.
4. **Gap check** — tanya apa yang missing.
5. **Drafting** — pakai `str_replace` untuk ganti placeholder dengan konten asli.
6. **Iterative refinement** — surgical edits via `str_replace` (jangan reprint full doc).

Mulai dari section dengan most unknowns (untuk decision doc: core proposal; untuk spec:
technical approach). Summary section terakhir. Setelah 3 iterasi tanpa perubahan substantif,
tanya apakah ada yang bisa dihapus tanpa kehilangan info penting.

Saat 80%+ section selesai, re-read whole doc — cek flow, redundancy, kontradiksi, kalimat
yang tidak punya weight.

### Stage 3: Reader Testing

Tujuan: tes dengan Claude fresh (no context) untuk catch blind spot.

- **Dengan sub-agent (Claude Code):** Claude generate 5-10 pertanyaan reader realistic,
  spawn sub-agent dengan hanya konten dokumen + pertanyaan, ringkas mana yang dijawab
  benar/salah. Plus check tambahan: ambiguity, false assumption, contradictions.
- **Tanpa sub-agent (Claude.ai web):** user buka fresh Claude conversation, paste dokumen,
  tanya pertanyaan yang disiapkan, report balik mana yang reader Claude gagal jawab.

Loop ke stage 2 untuk section yang bermasalah sampai reader Claude konsisten jawab
benar dan tidak surface gap baru.

### Final Review

Setelah Reader Testing pass — recommend user re-read sendiri, double-check fakta/link,
verify dampak tercapai. Tips akhir: link conversation di appendix supaya pembaca lain bisa
lihat development process.

## Contoh / Studi kasus

User: *"Saya mau menulis decision doc soal migrasi dari REST ke gRPC."*

- **Stage 1:** Claude tanya audience (engineering leadership? team?), format (Notion
  template?), konteks tim. User dump diskusi Slack, perf benchmark, alternatif yang
  pernah dipertimbangkan. Claude tanya 7 clarifying questions tentang concern backwards
  compat, timeline, dan budget.
- **Stage 2:** Claude mulai dari section "Proposal" (most unknowns). Brainstorm 12 poin
  yang relevan. User pilih 6, kombinasikan 2. Claude draft 1 paragraf, user minta lebih
  ringkas. Lanjut section "Risks", "Migration Plan", "Alternatives Considered", "Summary".
- **Stage 3:** Claude spawn sub-agent dengan dokumen + 8 pertanyaan ("kenapa tidak HTTP/3?",
  "bagaimana handle service mesh existing?"). Sub-agent gagal jawab 2 pertanyaan karena
  section Alternatives kurang spesifik. Loop balik ke section itu, perbaiki, re-test.

## Kesimpulan

Skill ini adalah workflow tiga tahap untuk co-authoring dokumen yang substantive: Context
Gathering → Refinement & Structure → Reader Testing. Diniatkan supaya hasil akhir benar-benar
bekerja untuk pembaca lain (bukan hanya enak dibaca author), dengan disiplin
surgical-edit (str_replace, bukan full reprint) dan tes empiris via sub-agent. Cocok untuk
PRD/RFC/design doc/decision doc — bukan untuk catatan internal cepat atau email.
