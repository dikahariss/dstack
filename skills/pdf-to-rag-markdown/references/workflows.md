# Workflow & helper scripts

Proven on 7 real docs. Copy these into the working dir, adapt the config, and run
via the `Workflow` tool. Prompts come from `vision-prompts.md`.

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
`PROMPT(it)` branches on `it.profile` → govdoc / flowchart prompt from `vision-prompts.md`.

## Phase 3 — assemble / splice (py)
- **assemble** (no L1 base, fully scanned): write YAML frontmatter, then per page
  `"<!-- page N -->\n\n{markdown}\n\n"` sorted by page.
- **splice** (replace specific pages in an existing md): for each result, find the
  `^<!-- page N -->$` marker and replace its block up to the next marker.
```python
MARKER=re.compile(r"^<!-- page (\d+) -->$",re.M)
def replace_page(text,page,new_md):
    ms=list(MARKER.finditer(text))
    for i,m in enumerate(ms):
        if int(m.group(1))==page:
            end=ms[i+1].start() if i+1<len(ms) else len(text)
            return text[:m.end()]+f"\n{new_md.rstrip()}\n\n"+text[end:],True
    return text,False
```
Read the Workflow result from its task-output JSON: `data["result"]` (may be a
JSON string → `json.loads` again).

## Phase 4 — fix_chunks.js (one agent per ~6-page chunk)
Split each doc on page markers into `work/<slug>/in_NNN.md` (preserve frontmatter
separately). Workflow: each agent Reads `in_NNN.md`, writes `out_NNN.md` (fix-pass
prompt), returns `{idx,wrote,notes}`. Same `pipeline()` shape as phase 2.

## Phase 5 — anti-drift gate (py) — the safety net
Reassemble from `out_NNN.md`, but **revert** any chunk whose letter/digit stream
drifted from `in_NNN.md` (de-wrapping & headings add 0 letters; hallucination adds,
content-loss removes).
```python
def stream(t):  # ignore whitespace, markdown, '#', page markers
    t=re.sub(r"<!-- page \d+ -->"," ",t); return re.sub(r"[^a-z0-9]+","",t.lower())
def drift(a,b):
    a,b=stream(a),stream(b); add=rem=0
    for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
        if tag in("insert","replace"): add+=j2-j1
        if tag in("delete","replace"): rem+=i2-i1
    return add,rem
# revert chunk if add>40 or rem>0.06*len(stream(orig)); else accept fixed
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

## Other helpers
- `polish_tables.py` — pad ragged pipe rows to the block's column count; unify
  table-header separators. `measure_rag.py` — words, garble %, headings, page
  markers, table empty-cell %.
- Strip catchwords deterministically: drop lines matching `^\s*/.*(\.\.\.|…)\s*$`.

## Cost recap
Sum `subagent_tokens` from each Workflow's task-notification; report per-phase
totals + agent count at the end (Max plan = quota, not per-token billing, but
document it). For live tracking use a `+Ntokens` budget directive and
`budget.spent()` inside the workflow.
