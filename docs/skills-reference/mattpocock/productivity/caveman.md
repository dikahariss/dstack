# Caveman

> **Sumber:** [`skills/productivity/caveman/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/productivity/caveman/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** productivity

## Mengapa skill ini penting

LLM cenderung verbose: pleasantries, filler, hedging, artikel berulang. Itu boros token, lambat dibaca, dan kerap mengaburkan substansi teknis. Skill ini menyalakan mode komunikasi **ultra-compressed** yang memangkas ~75% token sambil mempertahankan accuracy teknis penuh. Setelah aktif, mode persisten — tidak revert otomatis setelah banyak turn, hanya mati ketika user bilang "stop caveman" atau "normal mode".

Caveman mode bukan tentang kasar atau gaul — ini tentang fragmen, abbreviasi, dan struktur `[thing] [action] [reason]. [next step].`

## Kapan menggunakannya

- User bilang "caveman mode", "talk like caveman", "use caveman", "less tokens", "be brief".
- Slash command `/caveman`.
- Saat sesi panjang dan token budget jadi concern.
- Frontmatter description: "Ultra-compressed communication mode. Cuts token usage ~75%".

## Cara menggunakannya

**Persistence**: aktif tiap response sekali triggered. Tidak revert. Tidak filler drift. Masih aktif bila ragu. Off hanya ketika user perintah eksplisit.

**Rules — drop**:
- Articles (a/an/the)
- Filler (just, really, basically, actually, simply)
- Pleasantries (sure, certainly, of course, happy to)
- Hedging
- Fragments OK
- Short synonyms (big bukan extensive, fix bukan "implement a solution for")
- Abbreviate (DB/auth/config/req/res/fn/impl)
- Strip conjunctions
- Arrows untuk causality (X -> Y)
- One word bila satu kata cukup

**Stay exact**: technical terms, code blocks, error messages.

**Pattern**: `[thing] [action] [reason]. [next step].`

**Bukan**: "Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by..."
**Tapi**: "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"

**Auto-Clarity Exception**: drop caveman temporary untuk: security warnings, irreversible action confirmation, multi-step sequence yang ambigu kalau fragmen, user minta klarifikasi atau ulang pertanyaan. Resume caveman setelah bagian itu clear.

## Contoh / Studi kasus

**Q: "Why React component re-render?"**

> Inline obj prop -> new ref -> re-render. `useMemo`.

**Q: "Explain database connection pooling."**

> Pool = reuse DB conn. Skip handshake -> fast under load.

**Destructive op example** (caveman drop temporarily):

> **Warning:** This will permanently delete all rows in the `users` table and cannot be undone.
>
> ```sql
> DROP TABLE users;
> ```
>
> Caveman resume. Verify backup exist first.

## Kesimpulan

Skill yang sengaja unik: mengubah register komunikasi global agent untuk sesi. Aturan paling load-bearing: **persistent sampai user matikan**, **technical term + code + error stay exact**, dan **auto-clarity exception** untuk destructive/security/ambigu. Pasangkan dengan sesi panjang atau budget token ketat.
