# Write a Skill

> **Sumber:** [`skills/productivity/write-a-skill/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/productivity/write-a-skill/SKILL.md)
> **Repo:** mattpocock-skills
> **Bucket:** productivity

## Mengapa skill ini penting

Skill catalog hanya berguna bila skill baru mudah ditambahkan dengan kualitas konsisten. Skill ini memberi template + checklist untuk menulis skill baru: struktur folder, format SKILL.md dengan frontmatter, requirement untuk description (≤1024 char, first sentence "what it does", second sentence "Use when [triggers]"), aturan kapan add scripts, kapan split files, dan review checklist.

Insight inti: **description adalah satu-satunya yang agent lihat** saat memutuskan skill mana di-load. Description payah = skill tidak pernah dipanggil. Description tajam dengan triggers spesifik = agent tahu kapan trigger.

## Kapan menggunakannya

- User ingin create, write, atau build skill baru.
- Sebagai template default tiap kali Anda menambah skill ke catalog.
- Frontmatter description: "Create new agent skills with proper structure, progressive disclosure, and bundled resources".

## Contoh prompt

Frasa pemicu singkat — kalimat yang membuat skill ini aktif:

- "Buat skill baru untuk summarize PR ke standup bullet."
- "Tulis skill yang auto-generate ADR dari diskusi arsitektur."
- "Saya mau build skill baru — bantu saya."
- Kata kunci kanonik (EN): `create a skill`, `write a skill`,
  `build a new skill`.

Contoh task lengkap:

> "Buat skill baru bernama `summarize-pr`. Input: URL pull
> request GitHub. Output: 5 bullet poin untuk daily standup —
> apa yang berubah, kenapa, risk, status test, dan follow-up.
> Pakai `gh pr view` untuk fetch data."

Yang terjadi: agent gather requirements (task, use case, perlu
script atau cukup instruksi), draft `SKILL.md` dengan frontmatter
description yang punya trigger spesifik dan isi <100 baris,
lalu review bersama user — apakah use case tercakup, ada yang
missing, dan tiap section sudah cukup detail.

## Cara menggunakannya

1. **Gather requirements**: task/domain apa? Use case spesifik? Butuh executable script atau cuma instruksi? Reference material untuk include?
2. **Draft skill**:
   - `SKILL.md` dengan instruksi concise.
   - File reference tambahan bila konten >500 baris.
   - Utility script bila operasi deterministik.
3. **Review dengan user**: cover use case? Ada yang missing/unclear? Section mana more/less detailed?

**Struktur folder**:

```
skill-name/
├── SKILL.md           # Main instructions (required)
├── REFERENCE.md       # Detailed docs (if needed)
├── EXAMPLES.md        # Usage examples (if needed)
└── scripts/           # Utility scripts (if needed)
    └── helper.js
```

**SKILL.md template**:

```md
---
name: skill-name
description: Brief description of capability. Use when [specific triggers].
---

# Skill Name

## Quick start

[Minimal working example]

## Workflows

[Step-by-step processes with checklists]

## Advanced features

[Link to separate files]
```

**Description requirements**: max 1024 char, third person, first sentence = what it does, second sentence = "Use when [triggers]".

**When to add scripts**: operasi deterministik (validation, formatting), code sama dibangkitkan berulang, error perlu explicit handling. Scripts hemat token + lebih reliable.

**When to split files**: SKILL.md >100 lines, konten distinct domains, advanced feature jarang dipakai.

**Review checklist**: description punya triggers, SKILL.md <100 lines, no time-sensitive info, terminologi konsisten, contoh konkret, reference one level deep.

## Contoh / Studi kasus

User ingin skill baru "summarize-pr". Gather: input adalah PR URL, output adalah summary 5 bullet untuk daily standup. Deterministic? Tidak — butuh judgment. Reference material? Pakai `gh pr view`. Draft SKILL.md:

```md
---
name: summarize-pr
description: Summarize a GitHub PR into 5 bullets suitable for daily standup. Use when user passes a PR URL and asks for a standup summary, or says "summarize this PR".
---

# Summarize PR

## Quick start

Pass PR URL. Output 5 bullets: what changed, why, risk, test status, follow-up.

## Workflow

1. `gh pr view <url> --json title,body,files`
2. Extract per kategori.
3. Format 5 bullets.
4. Print.
```

Description tajam (action + 2 trigger phrase). SKILL.md <30 lines. Tidak butuh REFERENCE.md atau scripts (operation tidak deterministik). Review checklist: pass.

## Kesimpulan

Skill paling meta — yang Anda pakai untuk membuat skill lain. Aturan paling load-bearing: **description punya triggers spesifik** (tanpa itu skill tidak pernah dipanggil), **SKILL.md <100 lines** (split bila lebih), dan **scripts hanya untuk operasi deterministik**.
