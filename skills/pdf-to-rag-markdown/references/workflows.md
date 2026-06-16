# Workflow & helper scripts

Proven on real Indonesian government docs — incl. a 279-page DIGITAL Permenhub
(dewrap path) and a 23-page SCANNED Inpres with an 18-page matrix lampiran
(vision/matrix path). The deterministic helpers ship as runnable files in
`../scripts/` (run via Bash). The `Workflow` orchestration below stays here as
templates the orchestrator inlines (or passes via the `Workflow` `scriptPath`/
`args`): a `Workflow` script runs sandboxed — no filesystem — so it cannot read
a sibling `.js` or a prompt file at runtime. Prompts come from `vision-prompts.md`.

## Fast one-pass orchestration (default)
Do NOT run phases 2→6 as separate Workflow calls with human waits between — that
staging, not the compute, is what made the 279-page run take ~1h.

**First fork on doc type (from triage):**
- **Digital / mixed** (reliable `pdftotext -layout` text layer): build the draft,
  run `dewrap.py` on the clean-prose pages, and send ONLY the
  chart/diagram/scrambled pages through the pipelined Workflow below.
- **Fully scanned** (Tagged:no, a full-page image per page, empty or garbled OCR):
  **SKIP the draft + dewrap entirely.** Render EVERY page and send ALL pages
  through the Workflow below (profile per page: govdoc / matrix / flowchart), then
  `splice.py assemble` the result. No dewrap and no anti-drift gate on this path —
  vision faithfulness is guarded by the grounding stage.

Send the vision pages through ONE pipelined Workflow that transcribes and grounds
in the same pass:

```js
export const meta = { name:'pdf-charts', description:'transcribe + ground each chart in one pipelined pass', phases:[{title:'Transcribe'},{title:'Ground'}] }
const cfg = typeof args==='string'?JSON.parse(args):args   // {png_dir, pages:[{page,profile}], matrix_header?}
const pad = n => String(n).padStart(3,'0')
const T = {type:'object',required:['page','markdown','kind'],properties:{page:{type:'integer'},markdown:{type:'string'},kind:{type:'string'},blank:{type:'boolean'}}}
const G = {type:'object',required:['page','grounded'],properties:{page:{type:'integer'},grounded:{type:'boolean'},invented:{type:'array',items:{type:'string'}},missing:{type:'array',items:{type:'string'}},altered:{type:'array',items:{type:'string'}},notes:{type:'string'}}}
const items = cfg.pages.map(it => ({page:it.page, profile:it.profile||'govdoc', png:`${cfg.png_dir}/p${pad(it.page)}.png`}))
const PROMPTS = {govdoc:GOVDOC, matrix:MATRIX, flowchart:FLOWCHART}   // the vision-prompts.md profiles, embedded
const transcribe = it => (PROMPTS[it.profile]||GOVDOC)(it.png, it.page, cfg.matrix_header)
const results = await pipeline(items,
  it => agent(transcribe(it), {label:`${it.profile}:p${it.page}`, phase:'Transcribe', schema:T}).then(r => ({...r, page:it.page, png:it.png})),
  r  => agent(GROUND(r.png,r.markdown,r.page), {label:`g:p${r.page}`, phase:'Ground', schema:G}).then(g => ({...r, grounded:g.grounded, ground:g})))
return results.filter(Boolean)
```
`pipeline()` has NO barrier between stages: page B transcribes while page A grounds,
so all pages transcribe AND ground in ~one pass of wall-clock. Each item carries a
**per-page `profile`** (govdoc/matrix/flowchart) so a mixed doc — e.g. govdoc
covers/dictum + a matrix lampiran — runs in ONE pass. `GOVDOC`/`MATRIX`/`FLOWCHART`/
`GROUND` are the `vision-prompts.md` profiles, embedded in the script. For a multi-page
matrix whose column header prints only on its first page, pass that locked header as
`cfg.matrix_header` so continuation agents reproduce the exact column set. After it
returns: `splice.py` the markdown in (assemble scanned / splice into the draft digital).

**Then VERIFY-BEFORE-FIX — `grounded=false` is a suspicion, not a verdict.** The
grounder is deliberately low-precision ("default to flagging"); on govdoc/scanned
pages most flags are intentionally-omitted chrome or the reviewer's own single-letter
misread (a 23-page scanned run flagged 18/23 — only 2 were real). For each flagged
page: re-read the PNG and classify every invented/missing/altered item as (a) genuine
drift, (b) omitted chrome (never a defect), or (c) a reviewer misread. Fix ONLY (a)
with the **Edit tool** (a targeted span replace) — NEVER `splice.py splice`, which
replaces the whole page and would discard its correct rest; on a single-letter
disagreement default to KEEP. The re-fix uses the same fallible channel, so require it
to AGREE with a second read (another vision pass; `pdftotext` only for prose/text-layer
pages, NOT the scrambled chart pages that were sent to vision because their text layer
is bad) before overwriting; else keep the original and surface it. Copy `doc.md` →
`doc.pre-ground.md` first so a bad batch is reversible. **No pilot, no waits.**

## Phase 0 — triage (Bash)
```bash
# scanned vs digital + empty pages
for p in $(seq 1 $TOTAL); do
  c=$(pdftotext -f $p -l $p IN.pdf - | tr -d '[:space:]' | wc -c)
  [ "$c" -eq 0 ] && echo "p$p EMPTY(scanned)"
done
# per-page image count (1 full-page image/pg = scanned; 0 = digital text)
for p in $(seq 1 $TOTAL); do pdfimages -list -f $p -l $p IN.pdf | tail -n +3 | wc -l; done
```
Detect **scrambled** pages on the *output* after a draft: ≥45% of non-pipe lines
shorter than 25 chars → that page is a vector flowchart/table → send to vision.
(`../scripts/measure_rag.py` reports this `garble_ratio` for a finished doc.)

## Phase 1 — render (Bash)
```bash
pdftoppm -png -r 200 IN.pdf png/p          # makes p-01.png ...
cd png; for f in p-*.png; do n=$(echo "$f"|sed 's/p-0*\([0-9]*\)\.png/\1/'); \
  mv "$f" "$(printf 'p%03d.png' "$n")"; done   # → p001.png (3-pad, matches scripts)
```

## Phase 2 — vision_transcribe.js (one agent per page)
```js
export const meta = { name:'vision-transcribe', description:'...', phases:[{title:'Transcribe'}] }
const cfg = typeof args==='string'?JSON.parse(args):args     // {docs:[{doc,profile,png_dir,pages:[..]}]}
const ITEMS=[]; for(const d of cfg.docs) for(const pg of d.pages){
  const p3=String(pg).padStart(3,'0')
  ITEMS.push({doc:d.doc,page:pg,png:`${d.png_dir}/p${p3}.png`,profile:d.profile||'govdoc'}) }
const SCHEMA={type:'object',required:['page','markdown','kind'],properties:{
  page:{type:'integer'}, markdown:{type:'string'}, kind:{type:'string'}, blank:{type:'boolean'}}}
const results = await pipeline(ITEMS, (it)=>
  agent(PROMPT(it), {label:`${it.doc}:p${it.page}`, phase:'Transcribe', schema:SCHEMA})
    .then(r=> r?{...r,doc:it.doc,page:it.page}:null))
return results.filter(Boolean)
```
`PROMPT(it)` branches on `it.profile` → govdoc / matrix / flowchart prompt from
`vision-prompts.md`. Embed the chosen prompt text in the script (or pass it via
`args`); the sandbox cannot read `vision-prompts.md` at runtime.

## Phase 3 — assemble / splice → `../scripts/splice.py`
**Frontmatter** (`splice.py --frontmatter` requires it). The scanned path authors
`fm.txt` by hand (the digital draft already carries it):
```bash
cat > fm.txt <<EOF
---
title: <doc title>
source_file: <name>.pdf
total_pages: $(pdfinfo IN.pdf | awk '/^Pages:/{print $2}')
conversion_method: ai-vision (scanned) + grounding
page_markers: true
---
EOF
```
**Digital draft** (digital path only — build it, dewrap it, then splice charts in):
```bash
: > draft.md
for p in $(seq 1 $TOTAL); do
  printf '<!-- page %s -->\n\n' "$p" >> draft.md
  pdftotext -layout -f $p -l $p IN.pdf - >> draft.md; printf '\n\n' >> draft.md
done
python3 ../scripts/dewrap.py --in draft.md --out doc.md   # prepend fm.txt or keep draft's
```
Write the per-page vision results to `pages.json` (a list of `{page, markdown}`,
or a `Workflow` task-output object whose `result` holds that list) and run:
```bash
# fully scanned (no digital base): build from scratch
python3 ../scripts/splice.py assemble --results pages.json --frontmatter fm.txt --out doc.md
# replace specific re-transcribed pages inside an existing doc
python3 ../scripts/splice.py splice   --doc doc.md --results pages.json --out doc.md
```
Both are keyed on the `^<!-- page N -->$` marker; splice leaves every other page
byte-for-byte untouched.

## Phase 4 — prose: `../scripts/dewrap.py` (default) — fix_chunks.js (fallback only)
Clean-digital prose:
```bash
python3 ../scripts/dewrap.py --in draft.md --out clean.md   # ~10 ms, not AI
```
Deterministic de-wrap + BAB/Bagian/Paragraf/Pasal promotion, letter-neutral.
Benchmarked **word-identical** to the AI fix-agents (added=0/removed=0 over 245
pages) — so do NOT spend agents on clean prose. Verify cheaply: heading counts and
`measure_rag.py` garble; if dewrap clearly mis-structured an **irregular** doc
(heading counts wrong, big garble), fall back to AI fix-agents for the bad region —
split on page markers into `work/<slug>/in_NNN.md`, each agent Reads `in_NNN.md` and
writes `out_NNN.md` (fix-pass prompt), then the same anti-drift gate applies.

## Phase 5 — anti-drift gate → `../scripts/anti_drift_gate.py` (the safety net)
**Scope:** the gate guards the digital fix-PASS only (in_NNN.md/out_NNN.md prose
chunks). It does NOT apply to vision transcriptions or vision re-fixes — there is no
pdftotext source to revert to, so a fully-scanned doc skips this gate and relies on
the grounding stage + verify-before-fix for faithfulness.

Reassemble from `out_NNN.md`, **reverting** any chunk whose letter/digit stream
drifted from `in_NNN.md` (de-wrapping & headings add 0 letters; hallucination
adds, content-loss removes):
```bash
python3 ../scripts/anti_drift_gate.py --in-dir work/<slug> --frontmatter fm.txt --out final.md
# thresholds (proven defaults): revert if added letters >40, or removed >6% of source
```
If a chunk reverts because an agent tried to **reconstruct scrambled flowchart
text**, that page belongs in vision (phase 2, flowchart profile) — not the fix
pass. Detect such pages on the output and re-do them with vision.

## Phase 6 — grounding (adversarial) — pipeline it WITH phase 2
Default: fold grounding into the transcribe pass (`pipeline(pages, transcribe,
ground)`) so every page is verified the instant it is read, in ONE run over ALL
vision pages — never sample-then-ask-then-rest. Use the canonical **`ground`
profile** in `vision-prompts.md`: it scores CONVERSION fidelity (not completeness),
carries the SHARED intentionally-omitted-chrome allow-list (so it never flags page
numbers / emblem caption / catchwords as missing), keeps source typos as faithful,
and is cautious on single-letter claims. Then apply VERIFY-BEFORE-FIX (above) to its
output — the grounder only adds pages to a review queue; it never licenses a blind edit.
For a whole-doc quality score, a standalone reviewer (`agentType:'Explore'`) can grep
headings + sample pages + score 0–100, but it is optional QA, not the fix trigger.

## Other helpers (`../scripts/`)
- `polish_tables.py` — pad ragged pipe rows to the block's column count; unify
  table-header separators; never changes cell text. It pads each per-page table block
  independently (page markers break contiguity), so it is SAFE on a page-spanning
  matrix — it never merges pages or mis-aligns columns.
- `measure_rag.py` — report words, garble %, headings, page markers, table
  empty-cell %. Read-only gauge. CAVEATS: `garble_ratio` over-counts on
  structurally-terse docs (signature blocks, `Kepada:`/`Untuk:` labels, dictum
  tokens, lampiran headers are short but legitimate) — confirm by eye before
  re-routing. A HIGH `table_empty_cell_ratio` is EXPECTED and faithful on a
  merged-cell matrix (blank merged cells must NEVER be back-filled), not a defect.
- Catchwords are already omitted by the vision/fix prompts (shared chrome list).
  For a digital draft you can also strip them deterministically: drop lines matching
  `^\s*/.*(\.\.\.|…)\s*$`, and a lone `/N. Word…` fragment at a page foot.

## Cost recap
Sum `subagent_tokens` from each Workflow's task-notification; report per-phase
totals + agent count at the end (Max plan = quota, not per-token billing, but
document it). For live tracking use a `+Ntokens` budget directive and
`budget.spent()` inside the workflow.
