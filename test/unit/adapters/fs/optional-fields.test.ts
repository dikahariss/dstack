/**
 * Tests for the optional `license` and `compatibility` fields added by
 * ADR-0012. Verifies the parser reads them and the renderer forwards
 * them into the output frontmatter when present.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { SkillId } from '@domain/skill/SkillId';
import { Host } from '@domain/host/Host';

const FIXTURES = resolve(import.meta.dir, '../../../fixtures/skills/with-licenses');
const HOST = new Host('claude-code', '/tmp/out', { knownTools: CLAUDE_CODE_TOOLS });
const NOW = new Date('2026-01-01T00:00:00Z');

describe('optional license/compatibility fields (ADR-0012)', () => {
  test('parser exposes license and compatibility on SkillSpec', async () => {
    const repo = new FileSkillRepository(FIXTURES);
    const skill = await repo.loadById(SkillId.parse('licensed'));
    expect(skill).not.toBeNull();
    expect(skill!.spec.license).toBe('Apache-2.0');
    expect(skill!.spec.compatibility).toBe('Requires Bun 1.3+');
  });

  test('renderer emits license and compatibility in output frontmatter', async () => {
    const repo = new FileSkillRepository(FIXTURES);
    const skill = await repo.loadById(SkillId.parse('licensed'));
    const result = new ClaudeCodeRenderer().render({
      host: HOST,
      skill: skill!,
      tokenBudget: skill!.spec.contextBudgetTokens,
      now: NOW,
    });
    expect(result.content).toContain('license: Apache-2.0');
    expect(result.content).toContain('compatibility: Requires Bun 1.3+');
  });

  test('skills without license or compatibility omit those frontmatter lines', async () => {
    const repo = new FileSkillRepository(resolve(import.meta.dir, '../../../fixtures/skills/good'));
    const skill = await repo.loadById(SkillId.parse('alpha'));
    expect(skill!.spec.license).toBeUndefined();
    expect(skill!.spec.compatibility).toBeUndefined();
    const result = new ClaudeCodeRenderer().render({
      host: HOST,
      skill: skill!,
      tokenBudget: skill!.spec.contextBudgetTokens,
      now: NOW,
    });
    expect(result.content).not.toContain('license:');
    expect(result.content).not.toContain('compatibility:');
  });
});
