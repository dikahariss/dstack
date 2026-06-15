# Workflow & helper scripts

Proven on 7 real docs. The deterministic helpers ship as runnable files in
`../scripts/` (run via Bash). The `Workflow` orchestration below stays here as
templates the orchestrator inlines (or passes via the `Workflow` `scriptPath`/
`args`): a `Workflow` script runs sandboxed — no filesystem — so it cannot read
a sibling `.js` or a prompt file at runtime. Prompts come from `vision-prompts.md`.

## Fast one-pass orchestration (default)
Do NOT run phases 2→6 as separate Workflow calls with human waits between — that
staging, not the compute, is what made the 279-page run take ~1h. After the
deterministic prep (triage, render PNGs, `pdftotext -layout` draft, `splice.py
assemble`, and **`dewrap.py` on the digital-prose pages**), send ONLY the chart
pages through ONE pipelined Workflow that transcribes and grounds in the same pass:

```js
export const meta = { name:'pdf-charts', description:'transcribe + ground each chart in one pipelined pass', phases:[{title:'Transcribe'},{title:'Ground'}] }
const cfg = typeof args==='string'?JSON.parse(args):args            // {png_dir, pages:[..]}
const pad = n => String(n).padStart(3,'0')
const T = {type:'object',required:['page','markdown','kind'],properties:{page:{type:'integer'},markdown:{type:'string'},kind:{type:'string'},blank:{type:'boolean'}}}
const G = {type:'object',required:['page','grounded'],properties:{page:{type:'integer'},grounded:{type:'boolean'},invented_units:{type:'array',items:{type:'string'}},missing_units:{type:'array',items:{type:'string'}},notes:{type:'string'}}}
const items = cfg.pages.map(p => ({page:p, png:`${cfg.png_dir}/p${pad(p)}.png`}))
const results = await pipeline(items,
  it => agent(TRANSCRIBE(it.png,it.page), {label:`p${it.page}`,  phase:'Transcribe', schema:T}).then(r => ({...r, page:it.page, png:it.png})),
  r  => agent(GROUND(r.png,r.markdown,r.page), {label:`g${r.page}`, phase:'Ground', schema:G}).then(g => ({...r, grounded:g.grounded, issues:g})))
return results.filter(Boolean)
```
`pipeline()` has NO barrier between stages: page B transcribes while page A grounds,
so all charts transcribe AND ground in ~one chart-pass of wall-clock (not transcribe
THEN ground). `TRANSCRIBE`/`GROUND` are the prompts from `vision-prompts.md`, embedded
in the script. Prose is already done by `dewrap.py` (instant) on the host, so the
wall-clock is just this chart pass. After it returns: `splice.py` the chart markdown
in → `anti_drift_gate.py` → then auto-fix any `grounded:false` page with one tiny
re-vision Workflow on just those pages. **No pilot, no sample-then-rest, no waits.**

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
`PROMPT(it)` branches on `it.profile` → govdoc / flowchart prompt from
`vision-prompts.md`. Embed the chosen prompt text in the script (or pass it via
`args`); the sandbox cannot read `vision-prompts.md` at runtime.

## Phase 3 — assemble / splice → `../scripts/splice.py`
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
Default: fold grounding into the phase-2 chart pass (see "Fast one-pass
orchestration" above) so every chart is verified the instant it is transcribed, in
ONE run over ALL chart pages — not a sample-then-ask-then-rest sequence. The
standalone reviewer below is for a whole-doc quality score when you want one.
`pipeline(DOCS, review→verify)`. Review agent (use `agentType:'Explore'`) greps
headings, samples 6 pages, flags garble + suspect pages, scores 0–100. Verify
agent: for vision docs Reads the suspect-page PNGs and sets `grounded=false` on any
unsupported sentence/cell; for L1/agent docs compares to `pdftotext -layout -f N
-l N`. **Tell the reviewer to score CONVERSION quality and treat source-faithful
typos as non-defects**, or the source's own typos drag the score down.

## Other helpers (`../scripts/`)
- `polish_tables.py` — pad ragged pipe rows to the block's column count; unify
  table-header separators. Run after the gate; never changes cell text.
- `measure_rag.py` — report words, garble %, headings, page markers, table
  empty-cell %. Read-only; use it as a quick RAG-readiness gauge.
- Strip catchwords deterministically: drop lines matching `^\s*/.*(\.\.\.|…)\s*$`.

## Cost recap
Sum `subagent_tokens` from each Workflow's task-notification; report per-phase
totals + agent count at the end (Max plan = quota, not per-token billing, but
document it). For live tracking use a `+Ntokens` budget directive and
`budget.spent()` inside the workflow.
