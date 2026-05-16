import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument } from 'yaml';
import { Host } from '@domain/host/Host';
import { SkillId } from '@domain/skill/SkillId';
import { HostRenderer } from '@domain/host/ports';
import { ValidateCatalog } from '@app/ValidateCatalog';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { Telemetry } from '@obs/Telemetry';

/** Doctor verdict for one skill id (either source-side or install-side). */
export interface DoctorRow {
  readonly id: string;
  readonly status: 'OK' | 'ERR';
  readonly issues: readonly string[];
}

export interface DoctorReport {
  readonly rows: readonly DoctorRow[];
  readonly exitCode: 0 | 1;
}

/** Diagnose source/install consistency: validation, version drift, orphans. */
export async function diagnose(input: {
  repo: FileSkillRepository;
  renderer: HostRenderer;
  telemetry: Telemetry;
  host: Host;
  installRoot: string;
}): Promise<DoctorReport> {
  const { repo, renderer, telemetry, host, installRoot } = input;
  const sourceIds = repo.listIds();
  const installedIds = findInstalledIds(installRoot);

  const verdicts = await new ValidateCatalog(repo, renderer, telemetry).execute({
    skillIds: sourceIds,
    host,
    now: new Date(),
  });

  const rows: DoctorRow[] = [];
  let anyError = false;

  for (const v of verdicts) {
    const issues: string[] = [];
    if (!v.ok) {
      issues.push(v.error?.message ?? 'validation failed');
    } else if (installedIds.has(v.skillId)) {
      const drift = await detectVersionDrift(repo, installRoot, v.skillId);
      if (drift !== undefined) issues.push(drift);
    }
    if (issues.length > 0) anyError = true;
    rows.push({
      id: v.skillId,
      status: issues.length > 0 ? 'ERR' : 'OK',
      issues,
    });
  }

  for (const id of installedIds) {
    if (sourceIds.includes(id)) continue;
    rows.push({
      id,
      status: 'ERR',
      issues: ['orphan: installed but no source skill — run `dstack build`'],
    });
    anyError = true;
  }

  return { rows, exitCode: anyError ? 1 : 0 };
}

/** Render doctor rows as greppable lines plus a summary. */
export function formatDoctorReport(report: DoctorReport): readonly string[] {
  if (report.rows.length === 0) {
    return ['(no skills found in source or install root)'];
  }
  const lines: string[] = [];
  let ok = 0;
  for (const r of report.rows) {
    if (r.issues.length === 0) {
      lines.push(`${r.id}: OK`);
      ok += 1;
      continue;
    }
    lines.push(`${r.id}: ERR ${r.issues.join('; ')}`);
  }
  lines.push('');
  lines.push(`${report.rows.length} entries checked: ${ok} OK, ${report.rows.length - ok} ERR`);
  return lines;
}

function findInstalledIds(root: string): Set<string> {
  if (!existsSync(root)) return new Set();
  const ids = new Set<string>();
  for (const entry of readdirSync(root)) {
    if (entry.startsWith('.')) continue;
    const dir = join(root, entry);
    if (!statSync(dir).isDirectory()) continue;
    if (existsSync(join(dir, 'SKILL.md'))) ids.add(entry);
  }
  return ids;
}

async function detectVersionDrift(
  repo: FileSkillRepository,
  installRoot: string,
  id: string,
): Promise<string | undefined> {
  const skill = await repo.loadById(SkillId.parse(id));
  if (skill === null) return undefined;
  const installedVersion = readInstalledVersion(installRoot, id);
  if (installedVersion === undefined) return undefined;
  if (installedVersion === skill.spec.version) return undefined;
  return `version drift: source ${skill.spec.version}, installed ${installedVersion} — run \`dstack build\``;
}

function readInstalledVersion(root: string, id: string): string | undefined {
  const skillFile = join(root, id, 'SKILL.md');
  if (!existsSync(skillFile)) return undefined;
  const content = readFileSync(skillFile, 'utf-8');
  const opener = content.indexOf('---');
  const closer = content.indexOf('---', opener + 3);
  if (opener !== 0 || closer < 0) return undefined;
  const doc = parseDocument(content.slice(opener + 3, closer));
  const v = (doc.toJS() as { version?: unknown }).version;
  return typeof v === 'string' ? v : undefined;
}
