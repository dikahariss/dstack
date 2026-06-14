/**
 * Coverage for the `calibration` frontmatter field (ADR-0025):
 *   - a declared band parses to that value;
 *   - an omitted band defaults to `workflow`;
 *   - the renderer always emits `calibration: <band>` into frontmatter;
 *   - an unknown band is rejected at parse time.
 *
 * Fixtures live under test/fixtures/skills/calibration/.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { Host } from '@domain/host/Host';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { SkillId } from '@domain/skill/SkillId';
import { SkillSpecError } from '@domain/errors';

const ROOT = resolve(import.meta.dir, '../../../fixtures/skills');
const HOST = new Host('claude-code', '/tmp/dstack-calibration-test', {
  knownTools: CLAUDE_CODE_TOOLS,
});

function bucket(name: string): FileSkillRepository {
  return new FileSkillRepository(resolve(ROOT, name));
}

async function render(skillId: string) {
  const skill = await bucket('calibration').loadById(SkillId.parse(skillId));
  return new ClaudeCodeRenderer().render({
    host: HOST,
    skill: skill!,
    tokenBudget: skill!.spec.contextBudgetTokens,
    now: new Date(0),
  });
}

describe('calibration field (ADR-0025)', () => {
  test('parses a declared band', async () => {
    const skill = await bucket('calibration').loadById(SkillId.parse('calib-set'));
    expect(skill!.spec.calibration).toBe('judgment-dominant');
  });

  test('defaults to workflow when omitted', async () => {
    const skill = await bucket('calibration').loadById(SkillId.parse('calib-default'));
    expect(skill!.spec.calibration).toBe('workflow');
  });

  test('renderer emits the declared band into frontmatter', async () => {
    const result = await render('calib-set');
    expect(result.content).toContain('calibration: judgment-dominant');
  });

  test('renderer emits the default band even when the flag is omitted', async () => {
    const result = await render('calib-default');
    expect(result.content).toContain('calibration: workflow');
  });

  test('renderer omits the band for type: deterministic (the type conveys it)', async () => {
    const result = await render('calib-deterministic');
    expect(result.content).not.toContain('calibration:');
  });

  test('rejects an unknown band at parse time', async () => {
    let caught: unknown;
    try {
      await bucket('calibration').loadById(SkillId.parse('calib-bad'));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(SkillSpecError);
  });
});
