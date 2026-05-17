/**
 * Tests that SkillSpecError carries source location (file + line) when
 * available. Covers M15.
 *
 * Fixtures live under test/fixtures/skills/bad-yaml/.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { SkillId } from '@domain/skill/SkillId';
import { SkillSpecError } from '@domain/errors';

const BAD_YAML_ROOT = resolve(import.meta.dir, '../../../fixtures/skills/bad-yaml');

describe('SkillSpecError source location', () => {
  test('yaml syntax error: source.file points at SKILL.md, line is set', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('syntax-error'));
      throw new Error('expected SkillSpecError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(SkillSpecError);
      const e = err as SkillSpecError;
      expect(e.source?.file).toContain('syntax-error/SKILL.md');
      expect(e.source?.line).toBeGreaterThan(0);
      expect(e.message).toContain('SKILL.md:');
    }
  });

  test('wrong-type fixture: tools error includes file path and field line', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('wrong-type'));
      throw new Error('expected SkillSpecError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(SkillSpecError);
      const e = err as SkillSpecError;
      expect(e.skillId).toBe('wrong-type');
      expect(e.field).toBe('allowed-tools');
      expect(e.problem).toContain('space-separated string or array of tool names');
      expect(e.source?.file).toContain('wrong-type/SKILL.md');
      // Line 4 is `allowed-tools: 42` in the v2 fixture (after --- and metadata lines).
      expect(e.source?.line).toBe(4);
      expect(e.message).toMatch(/at .+wrong-type\/SKILL\.md:4$/);
    }
  });

  test('missing-tools fixture: file path present, line absent', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('missing-tools'));
      throw new Error('expected SkillSpecError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(SkillSpecError);
      const e = err as SkillSpecError;
      expect(e.skillId).toBe('missing-tools');
      expect(e.field).toBe('allowed-tools');
      expect(e.source?.file).toContain('missing-tools/SKILL.md');
      expect(e.source?.line).toBeUndefined();
      // Path appears, but not as ".../<file>:<digit>" — the trailing colon+digit
      // is the file:line marker we use to indicate a known line.
      expect(e.message).toContain('missing-tools/SKILL.md');
      expect(e.message).not.toMatch(/missing-tools\/SKILL\.md:\d+/);
    }
  });

  test('skillId in error is the canonical kebab id, not the dir path', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('wrong-type'));
    } catch (err) {
      const e = err as SkillSpecError;
      expect(e.message.startsWith('skill wrong-type:')).toBe(true);
    }
  });

  test('error message format: "skill <id>: field \\"<field>\\": <problem> at <file>:<line>"', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('wrong-type'));
    } catch (err) {
      const e = err as SkillSpecError;
      expect(e.message).toMatch(/^skill .+: field ".+": .+ at .+\.md:\d+$/);
    }
  });
});
