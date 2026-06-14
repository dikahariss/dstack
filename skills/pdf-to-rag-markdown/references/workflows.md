# Workflow & helper scripts

Proven on 7 real docs. The deterministic helpers ship as runnable files in
`../scripts/` (run via Bash). The `Workflow` orchestration below stays here as
templates the orchestrator inlines (or passes via the `Workflow` `scriptPath`/
`args`): a `Workflow` script runs sandboxed — no filesystem — so it cannot read
a sibling `.js` or a prompt file at runtime. Prompts come from `vision-prompts.md`.

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

## Phase 4 — fix_chunks.js (one agent per ~6-page chunk)
Split each doc on page markers into `work/<slug>/in_NNN.md` (preserve frontmatter
separately). Workflow: each agent Reads `in_NNN.md`, writes `out_NNN.md` (fix-pass
prompt from `vision-prompts.md`), returns `{idx,wrote,notes}`. Same `pipeline()`
shape as phase 2.

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

## Phase 6 — review_workflow.js (adversarial)
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
