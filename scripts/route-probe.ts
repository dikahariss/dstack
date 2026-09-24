#!/usr/bin/env bun
// Routing probe: asks a model which skill chain it would invoke for each case,
// under a given router body, without doing the task. Deterministic scoring.
// Usage:
//   bun scripts/route-probe.ts run --arm A --body arm-a.md --catalog catalog.md \
//     --cases cases.jsonl --model opus --out results.jsonl [--config-dir ~/.claude-zai]
//   bun scripts/route-probe.ts score results.jsonl
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

type Case = {
  id: string
  class: 'small' | 'question' | 'risk' | 'multi'
  prompt: string
  must_include: string[]
  must_not: string[]
  max_skills: number | null
}
type Result = {
  arm: string; model: string; config: string; id: string; class: Case['class']
  chain: string[]; pass: boolean; reasons: string[]
  tokens: number; cost_usd: number | null; ms: number
}

const PROBE_SUFFIX =
  '\n\n---\nDo not do the task. Reply with exactly one line: ' +
  'CHAIN: <skill ids in the order you would invoke them, comma-separated> or CHAIN: none'

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

function stripFrontmatter(md: string): string {
  return md.startsWith('---') ? md.replace(/^---\n[\s\S]*?\n---\n/, '') : md
}

function parseChain(text: string): string[] | null {
  const m = /CHAIN:\s*(.+)/i.exec(text)
  if (!m?.[1]) return null
  const body = m[1].trim()
  if (/^none\b/i.test(body)) return []
  return body.split(',').map((s) => s.trim().replace(/^\/+/, '').replace(/[`.]/g, '').toLowerCase()).filter(Boolean)
}

function judge(c: Case, chain: string[] | null): string[] {
  if (chain === null) return ['no CHAIN line']
  const reasons: string[] = []
  for (const s of c.must_include) if (!chain.includes(s)) reasons.push(`missing ${s}`)
  for (const s of c.must_not) if (chain.includes(s)) reasons.push(`unwanted ${s}`)
  if (c.max_skills !== null && chain.length > c.max_skills) reasons.push(`${chain.length} > max ${c.max_skills}`)
  return reasons
}

function run(args: string[]): void {
  const arm = flag(args, 'arm'), bodyPath = flag(args, 'body'), catalogPath = flag(args, 'catalog')
  const casesPath = flag(args, 'cases'), model = flag(args, 'model'), out = flag(args, 'out')
  const configDir = flag(args, 'config-dir')
  if (!arm || !bodyPath || !catalogPath || !casesPath || !model || !out) {
    console.error('run needs --arm --body --catalog --cases --model --out')
    process.exit(2)
  }
  const system = `${stripFrontmatter(readFileSync(bodyPath, 'utf8'))}\n\n# Skill catalog\n\n${readFileSync(catalogPath, 'utf8')}`
  const cases = readFileSync(casesPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Case)
  const env = { ...process.env, ...(configDir ? { CLAUDE_CONFIG_DIR: configDir } : {}) }
  let tokens = 0, cost = 0
  for (const c of cases) {
    const sandbox = mkdtempSync(join(tmpdir(), 'route-probe-'))
    const started = Date.now()
    const p = Bun.spawnSync(
      ['claude', '-p', '--disable-slash-commands', '--tools', '', '--model', model,
        '--output-format', 'json', '--append-system-prompt', system, c.prompt + PROBE_SUFFIX],
      { cwd: sandbox, env, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe' },
    )
    rmSync(sandbox, { recursive: true, force: true })
    let raw = '', t = 0, usd: number | null = null
    try {
      const j = JSON.parse(p.stdout.toString())
      raw = String(j.result ?? '')
      const u = j.usage ?? {}
      t = (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
      usd = typeof j.total_cost_usd === 'number' ? j.total_cost_usd : null
    } catch {
      raw = `ERROR exit=${p.exitCode} ${p.stderr.toString().slice(0, 300)}`
    }
    const chain = parseChain(raw)
    const reasons = judge(c, chain)
    const r: Result = {
      arm, model, config: configDir ?? '~/.claude', id: c.id, class: c.class,
      chain: chain ?? [], pass: reasons.length === 0, reasons, tokens: t, cost_usd: usd, ms: Date.now() - started,
    }
    appendFileSync(out, JSON.stringify(r) + '\n')
    tokens += t; cost += usd ?? 0
    console.log(`${arm} ${model} ${c.id} ${r.pass ? 'PASS' : 'FAIL ' + reasons.join('; ')} [${r.chain.join(',') || 'none'}]`)
  }
  console.log(`total: ${cases.length} calls, ${tokens} tokens, $${cost.toFixed(2)} reported`)
}

function score(path: string): void {
  const rows = readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Result)
  const groups = new Map<string, Result[]>()
  for (const r of rows) {
    const k = `${r.model}\t${r.arm}`
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  console.log('model\tarm\tn\tpass\tsmall+question pass\tsmall+question skills\trisk+multi pass\tno CHAIN\ttokens\tcost_usd')
  for (const [k, rs] of [...groups].sort()) {
    const light = rs.filter((r) => r.class === 'small' || r.class === 'question')
    const heavy = rs.filter((r) => r.class === 'risk' || r.class === 'multi')
    console.log([
      k, rs.length, rs.filter((r) => r.pass).length,
      `${light.filter((r) => r.pass).length}/${light.length}`,
      light.reduce((a, r) => a + r.chain.length, 0),
      `${heavy.filter((r) => r.pass).length}/${heavy.length}`,
      rs.filter((r) => r.reasons.includes('no CHAIN line')).length,
      rs.reduce((a, r) => a + r.tokens, 0),
      rs.reduce((a, r) => a + (r.cost_usd ?? 0), 0).toFixed(2),
    ].join('\t'))
  }
}

const [cmd, ...rest] = process.argv.slice(2)
if (cmd === 'run') run(rest)
else if (cmd === 'score' && rest[0]) score(rest[0])
else {
  console.error('usage: route-probe.ts run ... | route-probe.ts score <results.jsonl>')
  process.exit(2)
}
