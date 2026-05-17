/**
 * Coverage for the four warning kinds the parser + cross-skill validator
 * can emit beyond the include/token cases already covered elsewhere:
 *   - comprehensive-skill   (>=4 module folders)
 *   - type-structure-mismatch (declared type does not match structure)
 *   - long-description      (>200 words in description)
 *   - overlapping-trigger   (two skills share a trigger phrase)
 *
 * Fixtures live under test/fixtures/skills/warnings/.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { Host } from '@domain/host/Host';
import { BuildCatalog } from '@app/BuildCatalog';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { NoopTelemetry } from '@obs/NoopTelemetry';
import { SkillId } from '@domain/skill/SkillId';

const ROOT = resolve(import.meta.dir, '../../../fixtures/skills');
const HOST = new Host('claude-code', '/tmp/dstack-warning-test', {
  knownTools: CLAUDE_CODE_TOOLS,
});

function bucket(name: string): FileSkillRepository {
  return new FileSkillRepository(resolve(ROOT, name));
}

describe('warning fixtures', () => {
  test('comprehensive-skill: emitted via renderer when >=4 module folders', async () => {
    const results = await new BuildCatalog(bucket('warnings-comprehensive'), new ClaudeCodeRenderer(), new NoopTelemetry())
      .execute({ host: HOST, now: new Date(0) });
    expect(results.length).toBe(1);
    const kinds = results[0]!.rendered.warnings.map((w) => w.kind);
    expect(kinds).toContain('comprehensive-skill');
  });

  test('type-structure-mismatch: declared type=semantic with scripts/ folder', async () => {
    const skill = await bucket('warnings-mismatch').loadById(SkillId.parse('type-mismatch'));
    const kinds = skill!.includeWarnings.map((w) => w.kind);
    expect(kinds).toContain('type-structure-mismatch');
  });

  test('long-description: emitted when description exceeds 200 words', async () => {
    const skill = await bucket('warnings-long-desc').loadById(SkillId.parse('long-desc'));
    const kinds = skill!.includeWarnings.map((w) => w.kind);
    expect(kinds).toContain('long-description');
  });

  test('overlapping-trigger: cross-skill detection in BuildCatalog', async () => {
    const results = await new BuildCatalog(bucket('warnings-overlap'), new ClaudeCodeRenderer(), new NoopTelemetry())
      .execute({ host: HOST, now: new Date(0) });
    const a = results.find((r) => r.rendered.path.startsWith('overlap-a/'));
    const b = results.find((r) => r.rendered.path.startsWith('overlap-b/'));
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    const aOverlap = a!.rendered.warnings.filter((w) => w.kind === 'overlapping-trigger');
    const bOverlap = b!.rendered.warnings.filter((w) => w.kind === 'overlapping-trigger');
    expect(aOverlap.length).toBe(1);
    expect(bOverlap.length).toBe(1);
    expect(aOverlap[0]!.message).toContain('overlap-b');
    expect(bOverlap[0]!.message).toContain('overlap-a');
  });
});
