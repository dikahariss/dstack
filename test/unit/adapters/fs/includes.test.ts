/**
 * Tests for the `includes` directive resolution in FileSkillRepository.
 * Covers M3.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { SkillId } from '@domain/skill/SkillId';
import { IncludeNotFoundError } from '@domain/errors';

const FIXTURES = resolve(import.meta.dir, '../../../fixtures/skills');

describe('FileSkillRepository: includes resolution', () => {
  test('loads include content and exposes it on Skill.includesContent', async () => {
    const repo = new FileSkillRepository(resolve(FIXTURES, 'with-includes'));
    const skill = await repo.loadById(SkillId.parse('uses-shared'));
    expect(skill).not.toBeNull();
    expect(skill!.includesContent).toContain('SHARED-INTRO-MARKER');
    expect(skill!.includeWarnings).toEqual([]);
  });

  test('throws IncludeNotFoundError when an include path is missing', async () => {
    const repo = new FileSkillRepository(resolve(FIXTURES, 'missing-include'));
    try {
      await repo.loadById(SkillId.parse('uses-missing'));
      throw new Error('expected IncludeNotFoundError');
    } catch (err) {
      expect(err).toBeInstanceOf(IncludeNotFoundError);
      const e = err as IncludeNotFoundError;
      expect(e.skillId).toBe('uses-missing');
      expect(e.includePath).toBe('_shared/does-not-exist.md');
    }
  });

  test('duplicate include in same list emits include-cycle-broken warning', async () => {
    const repo = new FileSkillRepository(resolve(FIXTURES, 'duplicate-includes'));
    const skill = await repo.loadById(SkillId.parse('uses-dupe'));
    expect(skill).not.toBeNull();
    expect(skill!.includesContent).toContain('PREAMBLE-MARKER');
    const occurrences = skill!.includesContent.split('PREAMBLE-MARKER').length - 1;
    expect(occurrences).toBe(1);
    expect(skill!.includeWarnings.length).toBe(1);
    expect(skill!.includeWarnings[0]!.kind).toBe('include-cycle-broken');
    expect(skill!.includeWarnings[0]!.message).toContain('_shared/preamble.md');
  });

  test('skills without includes have empty includesContent', async () => {
    const repo = new FileSkillRepository(resolve(FIXTURES, 'good'));
    const skill = await repo.loadById(SkillId.parse('alpha'));
    expect(skill).not.toBeNull();
    expect(skill!.includesContent).toBe('');
    expect(skill!.includeWarnings).toEqual([]);
  });
});
