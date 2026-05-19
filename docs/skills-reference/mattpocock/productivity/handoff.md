# Handoff

> **Sumber:** [`skills/productivity/handoff/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/productivity/handoff/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** productivity

## Mengapa skill ini penting

Sesi LLM panjang tidak portable: konteks tinggal di transcript yang tidak dapat diteruskan ke sesi baru atau agent lain. Bila sesi habis (token budget, context window penuh, atau Anda butuh switch ke fresh agent), pekerjaan macet. Skill `handoff` mengkompak percakapan saat ini menjadi **handoff document** singkat — disimpan ke path yang dihasilkan `mktemp` — sehingga agent berikutnya dapat melanjutkan tanpa harus baca seluruh transcript.

Aturan emas: **jangan duplikasi konten yang sudah ditangkap di artifact lain** (PRD, plan, ADR, issue, commit, diff). Reference saja by path/URL. Handoff doc hanya menambah konteks yang *tidak ada* di tempat lain.

## Kapan menggunakannya

- Sesi panjang dan akan switch ke fresh agent.
- Sebelum sesi berakhir (token budget hampir habis, context window penuh).
- User bilang "handoff this", "summarize for next session".
- Frontmatter `argument-hint: "What will the next session be used for?"` — sertakan tujuan sesi berikutnya bila Anda tahu.

## Cara menggunakannya

1. **Buat path output**: `mktemp -t handoff-XXXXXX.md`. Baca file (kosong) sebelum write.
2. **Tulis handoff document** yang merangkum percakapan saat ini sehingga fresh agent dapat melanjutkan.
3. **Jangan duplikasi** konten yang sudah ada di artifact lain — PRD, plan, ADR, issue, commit, diff. Reference by path/URL.
4. **Suggest skills** yang next session perlu pakai, bila ada.
5. **Bila user pass argument**, treat sebagai deskripsi fokus next session dan sesuaikan dokumen.

Struktur saran:
- Konteks singkat (apa yang sedang dikerjakan, kenapa).
- Apa yang sudah dilakukan (reference artifact bila ada).
- Apa yang masih outstanding (decision yang belum dibuat, question yang belum dijawab).
- Skills disarankan untuk next session.
- Path/URL artifact relevan.

## Contoh / Studi kasus

Sesi: dua jam grilling + nulis PRD untuk fitur subscription cancellation, plus eksperimen prototype kecil. User panggil `/handoff "implement subscription cancellation"`. Skill jalankan `mktemp -t handoff-XXXXXX.md` → `/tmp/handoff-aB3xYz.md`. Tulis:

```markdown
# Handoff: implement subscription cancellation

## Context
Tim sedang membangun fitur cancel subscription. PRD sudah dipublish, prototype state machine sudah dimainkan.

## Done
- PRD: GitHub issue #142 (label `ready-for-agent`).
- Prototype: `scripts/proto-sub-state.ts` (akan dihapus setelah implementasi).
- Decision arsitektur: cancel-immediate vs cancel-at-period-end disahkan sebagai dua method terpisah.

## Outstanding
- Refund policy untuk cancel-immediate belum di-grill (ADR-0005 mungkin perlu diperluas).
- Email template untuk konfirmasi cancel belum dibuat.
- Test integrasi belum disepakati seam-nya.

## Suggested next skills
- `/to-issues` untuk pecah PRD #142 menjadi vertical slice.
- `/tdd` setelah issue pertama dipilih.
- `/grill-with-docs` untuk refund policy.

## Artifacts
- PRD: https://github.com/org/repo/issues/142
- Prototype: scripts/proto-sub-state.ts
- ADR-0005: docs/adr/0005-refund-policy.md
```

Path handoff dishare ke user. Next agent buka file, paham state dalam 1 menit.

## Kesimpulan

Skill super pendek tapi sangat krusial untuk sesi panjang. Aturan paling load-bearing: **mktemp + read sebelum write**, **jangan duplikasi artifact lain**, **suggest skills next session**. Pasangkan dengan praktik artifact-first (PRD, ADR, issue) supaya handoff doc tetap ringan.
