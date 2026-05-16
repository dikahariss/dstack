/**
 * Tests that SkillSpecError carries source location (file + line) when
 * available. Covers M15.
 *
 * Fixtures live under test/fixtures/skills/bad-yaml/.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { FileSkillRepository } from '../../../../src/adapters/fs/FileSkillRepository';
import { SkillId } from '../../../../src/domain/skill/SkillId';
import { SkillSpecError } from '../../../../src/domain/errors';

const BAD_YAML_ROOT = resolve(import.meta.dir, '../../../fixtures/skills/bad-yaml');

describe('SkillSpecError source location', () => {
  test('yaml syntax error: source.file points at skill.yaml, line is set', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('syntax-error'));
      throw new Error('expected SkillSpecError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(SkillSpecError);
      const e = err as SkillSpecError;
      expect(e.source?.file).toContain('syntax-error/skill.yaml');
      expect(e.source?.line).toBeGreaterThan(0);
      expect(e.message).toContain('skill.yaml:');
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
      expect(e.field).toBe('tools');
      expect(e.problem).toContain('array of strings');
      expect(e.source?.file).toContain('wrong-type/skill.yaml');
      // Line 5 is `tools: Read` in the fixture.
      expect(e.source?.line).toBe(5);
      expect(e.message).toMatch(/at .+wrong-type\/skill\.yaml:5$/);
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
      expect(e.field).toBe('tools');
      expect(e.source?.file).toContain('missing-tools/skill.yaml');
      expect(e.source?.line).toBeUndefined();
      // Path appears, but not as ".../<file>:<digit>" — the trailing colon+digit
      // is the file:line marker we use to indicate a known line.
      expect(e.message).toContain('missing-tools/skill.yaml');
      expect(e.message).not.toMatch(/missing-tools\/skill\.yaml:\d+/);
    }
  });

  test('skillId in error is the canonical kebab id, not the dir path', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('wrong-type'));
    } catch (err) {
      const e = err as SkillSpecError;
      // Message starts with "skill wrong-type:" — not the full filesystem path.
      expect(e.message.startsWith('skill wrong-type:')).toBe(true);
    }
  });

  test('error message format: "skill <id>: field \\"<field>\\": <problem> at <file>:<line>"', async () => {
    const repo = new FileSkillRepository(BAD_YAML_ROOT);
    try {
      await repo.loadById(SkillId.parse('wrong-type'));
    } catch (err) {
      const e = err as SkillSpecError;
      expect(e.message).toMatch(/^skill .+: field ".+": .+ at .+\.yaml:\d+$/);
    }
  });
});
