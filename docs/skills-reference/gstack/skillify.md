# Skillify

> **Sumber:** [`skillify/SKILL.md`](https://github.com/garrytan/gstack/blob/main/skillify/SKILL.md)
> **Repo:** gstack (workflow internal Haris)

## Mengapa skill ini penting

`/scrape` dengan prototype path memerlukan ~30 detik per call. Jika
intent itu reusable (HN top stories, Reddit hot posts, pricing
competitor), 30 detik × 50 call setiap minggu = waktu yang tidak
perlu. `/skillify` mengkodifikasi prototype `/scrape` terakhir yang
sukses menjadi browser-skill permanen di disk. Call berikutnya pada
intent yang sama match path dan jalan ~200ms.

Skill ini synthesize `script.ts` + `script.test.ts` + fixture dari
percakapan, run test di temp dir, dan minta approval sebelum commit.
Jika test gagal, di-discard tanpa meninggalkan artefak di disk.

## Kapan menggunakannya

Trigger di `description`:

- "skillify", "codify", "save this scrape", "make this permanent"
- Trigger field: `skillify`, `codify this scrape`, `save this scrape`,
  `make this permanent`

Pakai setelah `/scrape` prototype berhasil dan user merasa intent itu
akan dipakai berulang. `/scrape` di akhir prototype memang append
nudge satu line: "Say /skillify to make this a permanent skill
(200ms next call)".

Versi: `1.0.0`.

## Cara menggunakannya

11 step:

1. **Context check** — pastikan ada sesi `/scrape` sukses recent.
   Tanpa itu, skill bilang "No recent /scrape to codify".
2. **Tier selection** — AskUserQuestion: global
   (`~/.claude/skills/gstack/browser-skills/`) atau project (di repo
   `.claude/skills/`). Cek shadow collision (skill nama sama di tier
   lain).
3. **Naming** — kebab-case, must start with letter.
4. **Synthesis** — walk back percakapan, ekstrak URL, selector,
   transformation logic. Generate:
   - `script.ts` — Bun script entry point.
   - `script.test.ts` — fixture-replay test.
   - `fixture/page.html` — snapshot HTML untuk test.
   - `SKILL.md` — frontmatter (name, version, host, args, triggers,
     description) + body 2-3 kalimat penjelasan.
5. **Stage** — `stageSkill()` menulis ke staged dir di `~/.gstack/
   browser-skills.staging/<name>/`. Capture `stagedDir`.
6. **Run test** — `$B skill test <name> --dir <stagedDir>` atau
   fallback `(cd stagedDir && bun test script.test.ts)`. Failure:
   - Fixable parser bug: rewrite + retry, max 2 retries, show diff
     sebelum tiap retry.
   - Still failing atau env error: `discardStaged()`, report
     failure, show staged script.ts as reference. STOP. No artifact.
7. **Approval gate** — AskUserQuestion dengan format decision brief
   D1: "Commit skill `<name>` at `<resolved tier path>`?" Options:
   - A) Commit it (recommended)
   - B) Look at the script first
   - C) Discard
   Jika B, print SKILL.md + script.ts inline, re-ask tanpa option B.
8. **Commit atomic** — `commitSkill({name, tier, stagedDir})`. Jika
   "already exists" (shadow collision dismissed di step 2): ask
   pick different name / `$B skill rm` then retry / discard.
9. **Discard path** — `discardStaged(stagedDir)`. Report.
10. **Confirm + verify** — `$B skill list | grep <name>`, `$B skill
    run <name>` → bandingkan output dengan prototype. Jika beda,
    surface ke user (sintesis drifted) — jangan silently roll back.
11. **End line** — "Skill '<name>' committed at <tier>. Future
    /scrape calls matching '<canonical-trigger>' will run in ~200ms."

**Limits** (honest):

- Bun runtime required (Phase 1 design carry-over).
- Fixture-replay tests point-in-time — site HTML rotate, fixture
  stale.
- Synthesis best-effort — multi-page atau hydration kompleks butuh
  hand-edit.
- Single target — satu `$B goto` per skill.

## Contoh / Studi kasus

Setelah `/scrape product prices on store.example.com/laptops` sukses
prototype:

```
/skillify
```

Tier: global. Name: `store-laptops`.

Synthesis:

- `script.ts` — `await $B.goto(url); const html = await $B.html();
  parse <li.product-card> → {name, price, currency}; return
  {items, count}`.
- `script.test.ts` — load `fixture/page.html`, monkey-patch
  `$B.html()`, assert shape.
- `fixture/page.html` — snapshot HTML store yang di-strip secrets.
- `SKILL.md` frontmatter: `name: store-laptops`, `host:
  store.example.com`, `triggers: [product prices, store laptops]`,
  `args: []`.

Test pass. Approval D1 → user pilih A. Commit ke
`~/.claude/skills/gstack/browser-skills/store-laptops/`. Verify:
`$B skill run store-laptops` output JSON sama dengan prototype.

End: "Skill 'store-laptops' committed at global. Future /scrape
calls matching 'product prices on store.example.com' will run in
~200ms."

## Kesimpulan

`/skillify` melengkapi `/scrape` jadi pasangan progressive
disclosure: pertama kali jalan slow (prototype), berikutnya
instant (codified). Spec output (script + test + fixture + SKILL.md)
membuat skill terkode dapat di-review dan di-edit manual ketika
target site berubah. Karena ada approval gate + verify post-commit,
no silent corruption.
