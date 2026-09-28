#!/usr/bin/env bun
// Aggregate per-session metrics from Claude Code transcript stores.
// Emits no prompt or response text: counts, durations, model ids, skill ids only.
// Usage: bun scripts/session-metrics.ts <out.jsonl> <config-dir>... [--since=YYYY-MM-DD] [--until=YYYY-MM-DD]
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'

const IDLE_GAP_MS = 30 * 60 * 1000
const TEST_CMD = /\b(bun test|npm (run )?test|pnpm test|yarn test|npx (jest|vitest)|jest|vitest|pytest|go test|cargo test|dotnet test|ng test|phpunit|mvn test|gradle test)\b/
const VERIFY_CMD = new RegExp(TEST_CMD.source + '|\\b(tsc|typecheck|lint|build|dotnet build|cargo (build|check)|go (build|vet)|ng build|bun run validate)\\b')
const DONE_CLAIM = /\b(done|fixed|all (tests )?pass(ing)?|all green|works now|selesai|sudah (beres|jalan|fix)|berhasil)\b/i
const INVENTED_REF: ReadonlyArray<readonly [string, RegExp]> = [
  ['missing-path', /does not exist|No such file or directory|ENOENT|File not found/i],
  ['edit-mismatch', /String to replace not found|old_string .*not (found|unique)/i],
  ['unknown-command', /command not found|Unknown (command|option)|unrecognized (option|arguments)/i],
  ['unknown-module', /Cannot find module|ModuleNotFoundError|could not be resolved|is not defined/i],
]
const DOC_PATH = /\/docs\/(plans|specs|discovery|priority|design|process|models|tests|reviews|uat|ablations)\/|(^|\/)([^/]*[-_.])?plans?([-_.][^/]*)?\.md$/i

type Row = Record<string, unknown>

function textOf(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((c) => (typeof c === 'string' ? c : (c?.text ?? ''))).join('\n')
  return ''
}

function isHumanPrompt(d: Row): boolean {
  if (d.type !== 'user' || d.isMeta) return false
  const c = (d.message as Row | undefined)?.content
  if (typeof c === 'string') return true
  return Array.isArray(c) && !c.some((x: Row) => x?.type === 'tool_result')
}

function analyse(file: string, configDir: string): Row | null {
  const lines = readFileSync(file, 'utf8').split('\n')
  const models: Record<string, number> = {}
  const tools: Record<string, number> = {}
  const skills: string[] = []
  const invented: Record<string, number> = {}
  const testIds = new Set<string>()
  const editTurns: Record<string, Set<number>> = {}
  let first = Infinity, last = 0, agentMs = 0, userMs = 0, idleMs = 0
  let prompts = 0, turns = 0, testRuns = 0, testFails = 0, toolErrors = 0
  let doneClaims = 0, unverifiedDone = 0, turnEdited = false, verifiedAfterEdit = false, lastText = ''
  let lastTurnEnd = 0, cost: Row | null = null, cwd = '', branch = ''
  const outByMsg: Record<string, number> = {}
  let docChars = 0, mdChars = 0, codeChars = 0

  for (const line of lines) {
    if (!line) continue
    let d: Row
    try { d = JSON.parse(line) } catch { continue }
    const ts = typeof d.timestamp === 'string' ? Date.parse(d.timestamp) : NaN
    if (!Number.isNaN(ts)) { first = Math.min(first, ts); last = Math.max(last, ts) }
    if (typeof d.cwd === 'string' && !cwd) cwd = d.cwd
    if (typeof d.gitBranch === 'string' && d.gitBranch) branch = d.gitBranch
    if (d.type === 'cost-state') cost = d
    if (d.type === 'system' && d.subtype === 'turn_duration') {
      turns++; agentMs += Number(d.durationMs) || 0
      if (DONE_CLAIM.test(lastText)) {
        doneClaims++
        if (turnEdited && !verifiedAfterEdit) unverifiedDone++
      }
      turnEdited = false; verifiedAfterEdit = false; lastText = ''
      if (!Number.isNaN(ts)) lastTurnEnd = ts
    }
    if (isHumanPrompt(d)) {
      prompts++
      if (lastTurnEnd && !Number.isNaN(ts) && ts > lastTurnEnd) {
        const gap = ts - lastTurnEnd
        if (gap > IDLE_GAP_MS) idleMs += gap; else userMs += gap
      }
    }
    const msg = d.message as Row | undefined
    if (d.type === 'assistant' && msg) {
      if (typeof msg.model === 'string' && msg.model !== '<synthetic>') models[msg.model] = (models[msg.model] ?? 0) + 1
      if (typeof msg.id === 'string') {
        const out = Number((msg.usage as Row | undefined)?.output_tokens) || 0
        outByMsg[msg.id] = Math.max(outByMsg[msg.id] ?? 0, out)
      }
      for (const c of (msg.content as Row[] | undefined) ?? []) {
        if (c?.type === 'text' && typeof c.text === 'string' && !d.isSidechain) lastText = c.text
        if (c?.type !== 'tool_use') continue
        const name = String(c.name); const input = (c.input ?? {}) as Row
        tools[name] = (tools[name] ?? 0) + 1
        if (name === 'Skill' && typeof input.skill === 'string') skills.push(input.skill)
        const cmd = name === 'Bash' ? String(input.command ?? '') : ''
        if (TEST_CMD.test(cmd)) { testRuns++; testIds.add(String(c.id)) }
        if (VERIFY_CMD.test(cmd)) verifiedAfterEdit = true
        if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(name) && typeof input.file_path === 'string') {
          (editTurns[input.file_path] ??= new Set()).add(turns)
          turnEdited = true; verifiedAfterEdit = false
          const written = String((name === 'Write' ? input.content : input.new_string) ?? '').length
          if (!d.isSidechain) {
            if (DOC_PATH.test(input.file_path)) docChars += written
            else if (input.file_path.endsWith('.md')) mdChars += written
            else codeChars += written
          }
        }
      }
    }
    if (d.type === 'user' && Array.isArray(msg?.content)) {
      for (const c of msg!.content as Row[]) {
        if (c?.type !== 'tool_result' || !c.is_error) continue
        toolErrors++
        if (testIds.has(String(c.tool_use_id))) testFails++
        const t = textOf(c.content)
        for (const [label, re] of INVENTED_REF) if (re.test(t)) { invented[label] = (invented[label] ?? 0) + 1; break }
      }
    }
  }
  if (prompts === 0 || first === Infinity) return null
  const min = (ms: number) => Math.round(ms / 600) / 100
  const edits = Object.values(editTurns)
  return {
    config: basename(configDir),
    session: basename(file, '.jsonl'),
    project: basename(cwd),
    branch,
    start: new Date(first).toISOString(),
    wall_min: min(last - first),
    agent_min: min(agentMs),
    user_min: min(userMs),
    idle_min: min(idleMs),
    api_min: cost ? min(Number(cost.totalAPIDuration) || 0) : null,
    tool_min: cost ? min(Number(cost.totalToolDuration) || 0) : null,
    cost_usd: cost ? Math.round((Number(cost.totalCostUSD) || 0) * 100) / 100 : null,
    prompts,
    turns,
    models,
    tool_calls: Object.values(tools).reduce((a, b) => a + b, 0),
    output_tokens: Object.values(outByMsg).reduce((a, b) => a + b, 0),
    doc_chars: docChars,
    md_chars: mdChars,
    code_chars: codeChars,
    tools,
    skills,
    files_edited: edits.length,
    files_reworked: edits.filter((s) => s.size >= 3).length,
    test_runs: testRuns,
    test_fails: testFails,
    tool_errors: toolErrors,
    invented_ref: invented,
    done_claims: doneClaims,
    unverified_done: unverifiedDone,
    dev_session: edits.length > 0 && testRuns > 0 && turns > 0,
  }
}

const argv = process.argv.slice(2)
const unknown = argv.filter((a) => a.startsWith('--') && !/^--(since|until)=/.test(a))
if (unknown.length > 0) {
  console.error(`unknown flag: ${unknown.join(' ')} (dates go as --since=YYYY-MM-DD)`)
  process.exit(2)
}
const dateFlag = (name: string): string | undefined => {
  const v = argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
  if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    console.error(`--${name} needs YYYY-MM-DD, got "${v}"`)
    process.exit(2)
  }
  return v
}
const since = dateFlag('since')
const until = dateFlag('until')
const [out, ...dirs] = argv.filter((a) => !a.startsWith('--'))
if (!out || dirs.length === 0) {
  console.error('usage: bun scripts/session-metrics.ts <out.jsonl> <config-dir>... [--since=YYYY-MM-DD] [--until=YYYY-MM-DD]')
  process.exit(2)
}
const rows: Row[] = []
let readDirs = 0
for (const dir of dirs) {
  const projects = join(dir, 'projects')
  if (!existsSync(projects)) { console.error(`skip ${dir}: no projects/`); continue }
  readDirs++
  for (const p of readdirSync(projects)) {
    const pdir = join(projects, p)
    if (!statSync(pdir).isDirectory()) continue
    for (const f of readdirSync(pdir)) {
      if (!f.endsWith('.jsonl')) continue
      const row = analyse(join(pdir, f), dir)
      const day = row ? String(row.start).slice(0, 10) : ''
      if (row && (!since || day >= since) && (!until || day <= until)) rows.push(row)
    }
  }
}
if (readDirs === 0) {
  console.error('no config dir had a projects/ folder')
  process.exit(2)
}
writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n')

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)] ?? 0
}
const p75 = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length * 0.75)] ?? 0
}
const num = (set: Row[], k: string) => set.map((r) => Number(r[k]) || 0)
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const catalog = existsSync('skills') ? new Set(readdirSync('skills')) : new Set<string>()
const dstackSkills = (r: Row) => new Set((r.skills as string[]).map((s) => s.split(':').pop() ?? s).filter((s) => catalog.has(s))).size
const BUCKETS = [['0-1', (n: number) => n <= 1], ['2', (n: number) => n === 2], ['3+', (n: number) => n >= 3]] as const

console.log(`sessions: ${rows.length} (${rows.map((r) => String(r.start)).sort()[0]?.slice(0, 10)} → ${rows.map((r) => String(r.start)).sort().pop()?.slice(0, 10)})`)
console.log('\n## Sessions per config and model (a session counts once per model it used)')
const pairs: Record<string, number> = {}
for (const r of rows) for (const m of Object.keys(r.models as Record<string, number>)) pairs[`${r.config}\t${m}`] = (pairs[`${r.config}\t${m}`] ?? 0) + 1
for (const [k, v] of Object.entries(pairs).sort((a, b) => b[1] - a[1])) console.log(`${v}\t${k}`)

const dev = rows.filter((r) => r.dev_session)
console.log(`\n## Dev sessions (edits + test runs + turn data): n=${dev.length}`)
for (const k of ['wall_min', 'agent_min', 'user_min', 'idle_min', 'tool_calls', 'test_runs']) {
  console.log(`${k}\tmedian=${median(num(dev, k))}\tp75=${p75(num(dev, k))}`)
}
console.log('\n## Agent minutes by dstack skills invoked per dev session')
for (const [label, test] of BUCKETS) {
  const b = dev.filter((r) => test(dstackSkills(r)))
  console.log(`${label}\tn=${b.length}\tmedian agent_min=${median(num(b, 'agent_min'))}`)
}
const costed = dev.filter((r) => r.api_min !== null && Number(r.api_min) + Number(r.tool_min) > 0)
console.log(`\n## Tool share of API+tool time (dev sessions with cost-state): n=${costed.length}`)
console.log(`median tool_share=${median(costed.map((r) => Number(r.tool_min) / (Number(r.api_min) + Number(r.tool_min)))).toFixed(2)}`)
console.log('\n## Hallucination proxies (dev sessions)')
const inv: Record<string, number> = {}
for (const r of dev) for (const [k, v] of Object.entries(r.invented_ref as Record<string, number>)) inv[k] = (inv[k] ?? 0) + v
console.log(`invented_ref per session\t${Object.entries(inv).map(([k, v]) => `${k}=${(v / Math.max(dev.length, 1)).toFixed(2)}`).join(' ')}`)
console.log(`unverified_done\t${sum(num(dev, 'unverified_done'))}/${sum(num(dev, 'done_claims'))} done-claims`)
console.log('\n## Output volume by dstack skills invoked per dev session')
for (const [label, test] of BUCKETS) {
  const b = dev.filter((r) => test(dstackSkills(r)))
  const doc = sum(num(b, 'doc_chars'))
  const all = doc + sum(num(b, 'md_chars')) + sum(num(b, 'code_chars'))
  console.log(`${label}\tn=${b.length}\tmedian output_tokens=${median(num(b, 'output_tokens'))}\tdoc_share=${all ? (doc / all).toFixed(2) : 'n/a'}`)
}
const planned = dev.filter((r) => (r.skills as string[]).some((s) => s.split(':').pop() === 'writing-plans'))
console.log(`\n## Dev sessions that invoked writing-plans: n=${planned.length}`)
for (const k of ['agent_min', 'output_tokens', 'doc_chars']) {
  console.log(`${k}\tmedian=${median(num(planned, k))}\tp75=${p75(num(planned, k))}`)
}
