import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseDocument, stringify } from 'yaml';

/** One skill's migration outcome. */
export interface MigrationOutcome {
  readonly skillId: string;
  readonly status: 'migrated' | 'already-v2' | 'skipped' | 'failed';
  readonly message?: string;
}

export interface MigrationReport {
  readonly outcomes: readonly MigrationOutcome[];
}

/**
 * Walk `<root>/*` and convert legacy `skill.yaml + prompt.md` skills into
 * single-file `SKILL.md`. ADR-0013 is the source format spec.
 *
 * Strategy:
 *   1. read skill.yaml; lift the standard agentskills fields (name,
 *      description, allowed-tools, license, compatibility) into the top
 *      of the new frontmatter.
 *   2. move every dstack-specific field (version, context_budget_tokens,
 *      triggers, includes, type, side_effects, agency, output_schema)
 *      under `metadata.dstack`.
 *   3. emit `--- ... ---\n<prompt.md body>` to SKILL.md.
 *   4. delete the old skill.yaml + prompt.md only after the new file is
 *      on disk.
 *
 * Skills that already have SKILL.md are reported as already-v2 and left
 * untouched. Skills that lack both layouts surface as `skipped`.
 */
export function migrateLegacySkills(skillsRoot: string): MigrationReport {
  if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) {
    return { outcomes: [] };
  }

  const outcomes: MigrationOutcome[] = [];
  for (const entry of readdirSync(skillsRoot)) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue;
    const dir = join(skillsRoot, entry);
    if (!statSync(dir).isDirectory()) continue;
    outcomes.push(migrateOne(dir));
  }
  return { outcomes };
}

const DSTACK_KEYS = new Set([
  'version',
  'context_budget_tokens',
  'triggers',
  'includes',
  'type',
  'side_effects',
  'agency',
  'output_schema',
]);

const TOP_LEVEL_KEYS = new Set([
  'name',
  'description',
  'allowed-tools',
  'license',
  'compatibility',
]);

function migrateOne(skillDir: string): MigrationOutcome {
  const dirName = basename(skillDir);
  const skillMdPath = join(skillDir, 'SKILL.md');
  const yamlPath = join(skillDir, 'skill.yaml');
  const promptPath = join(skillDir, 'prompt.md');

  if (existsSync(skillMdPath)) {
    return { skillId: dirName, status: 'already-v2' };
  }
  if (!existsSync(yamlPath) || !existsSync(promptPath)) {
    return {
      skillId: dirName,
      status: 'skipped',
      message: 'no skill.yaml + prompt.md found',
    };
  }

  let yamlText: string;
  let body: string;
  try {
    yamlText = readFileSync(yamlPath, 'utf-8');
    body = readFileSync(promptPath, 'utf-8');
  } catch (err) {
    return {
      skillId: dirName,
      status: 'failed',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const doc = parseDocument(yamlText);
  if (doc.errors.length > 0) {
    return {
      skillId: dirName,
      status: 'failed',
      message: `skill.yaml has YAML errors: ${doc.errors[0]!.message}`,
    };
  }

  const raw = doc.toJSON() as Record<string, unknown> | null;
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      skillId: dirName,
      status: 'failed',
      message: 'skill.yaml is not a YAML mapping',
    };
  }

  const top: Record<string, unknown> = {};
  const dstack: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (TOP_LEVEL_KEYS.has(key)) {
      top[key] = value;
    } else if (DSTACK_KEYS.has(key)) {
      dstack[key] = value;
    } else if (key === 'tools') {
      // v1 used `tools:` for the allow list; v2 uses `allowed-tools`.
      top['allowed-tools'] = Array.isArray(value) ? (value as string[]).join(' ') : value;
    } else {
      dstack[key] = value;
    }
  }

  if (typeof top['allowed-tools'] !== 'string' && Array.isArray(top['allowed-tools'])) {
    top['allowed-tools'] = (top['allowed-tools'] as string[]).join(' ');
  }

  if (Object.keys(dstack).length > 0) {
    top['metadata'] = { dstack };
  }

  const frontmatterText = stringify(top, { lineWidth: 0 }).trimEnd();
  const skillMd = `---\n${frontmatterText}\n---\n${body.startsWith('\n') ? body.slice(1) : body}`;

  try {
    writeFileSync(skillMdPath, skillMd, 'utf-8');
    unlinkSync(yamlPath);
    unlinkSync(promptPath);
  } catch (err) {
    return {
      skillId: dirName,
      status: 'failed',
      message: err instanceof Error ? err.message : String(err),
    };
  }
  return { skillId: dirName, status: 'migrated' };
}

export function formatMigrationReport(report: MigrationReport): readonly string[] {
  if (report.outcomes.length === 0) return ['nothing to migrate'];
  const lines: string[] = [];
  for (const o of report.outcomes) {
    const detail = o.message !== undefined ? `  ${o.message}` : '';
    lines.push(`  ${o.skillId.padEnd(24)} ${o.status}${detail}`);
  }
  const counts: Record<string, number> = {};
  for (const o of report.outcomes) counts[o.status] = (counts[o.status] ?? 0) + 1;
  const summary = Object.entries(counts)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  lines.push('');
  lines.push(summary);
  return lines;
}
