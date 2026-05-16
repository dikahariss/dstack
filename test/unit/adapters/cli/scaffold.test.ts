/**
 * Unit tests for `scaffoldSkill`. Touches the filesystem (in a temp dir),
 * so technically these are integration-style. Kept under unit/ because
 * they run in <50ms with no network or external process.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffoldSkill, ScaffoldError } from '@adapters/cli/scaffold';
import { SkillSpecError } from '@domain/errors';

describe('scaffoldSkill', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'dstack-scaffold-'));
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  test('creates skill directory with two files', () => {
    const result = scaffoldSkill(tmpRoot, 'my-new-skill');
    expect(result.skillId).toBe('my-new-skill');
    expect(result.skillDir).toBe(join(tmpRoot, 'my-new-skill'));
    expect(result.filesWritten).toHaveLength(2);
    expect(existsSync(join(tmpRoot, 'my-new-skill', 'skill.yaml'))).toBe(true);
    expect(existsSync(join(tmpRoot, 'my-new-skill', 'prompt.md'))).toBe(true);
  });

  test('skill.yaml contains the id and default budget', () => {
    scaffoldSkill(tmpRoot, 'alpha');
    const yaml = readFileSync(join(tmpRoot, 'alpha', 'skill.yaml'), 'utf-8');
    expect(yaml).toContain('id: alpha');
    expect(yaml).toContain('context_budget_tokens: 4000');
    expect(yaml).toContain('version: 0.1.0');
    expect(yaml).toContain('tools:');
  });

  test('prompt.md contains the slash-command heading', () => {
    scaffoldSkill(tmpRoot, 'my-skill');
    const md = readFileSync(join(tmpRoot, 'my-skill', 'prompt.md'), 'utf-8');
    expect(md).toContain('# /my-skill');
    expect(md).toContain('When to use this skill');
  });

  test('rejects invalid skill id (uppercase)', () => {
    expect(() => scaffoldSkill(tmpRoot, 'Bad-Id')).toThrow(SkillSpecError);
  });

  test('rejects invalid skill id (underscore)', () => {
    expect(() => scaffoldSkill(tmpRoot, 'bad_id')).toThrow(SkillSpecError);
  });

  test('rejects invalid skill id (leading digit)', () => {
    expect(() => scaffoldSkill(tmpRoot, '1bad')).toThrow(SkillSpecError);
  });

  test('refuses to overwrite existing skill directory', () => {
    scaffoldSkill(tmpRoot, 'existing');
    expect(() => scaffoldSkill(tmpRoot, 'existing')).toThrow(ScaffoldError);
  });

  test('overwrite error mentions the path', () => {
    scaffoldSkill(tmpRoot, 'existing');
    try {
      scaffoldSkill(tmpRoot, 'existing');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ScaffoldError);
      expect((err as ScaffoldError).message).toContain(join(tmpRoot, 'existing'));
    }
  });
});
