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

  test('creates SKILL.md inside the skill directory', () => {
    const result = scaffoldSkill(tmpRoot, 'my-new-skill');
    expect(result.skillId).toBe('my-new-skill');
    expect(result.skillDir).toBe(join(tmpRoot, 'my-new-skill'));
    expect(result.filesWritten).toHaveLength(1);
    expect(existsSync(join(tmpRoot, 'my-new-skill', 'SKILL.md'))).toBe(true);
  });

  test('SKILL.md contains the name, version, budget, and allowed-tools', () => {
    scaffoldSkill(tmpRoot, 'alpha');
    const md = readFileSync(join(tmpRoot, 'alpha', 'SKILL.md'), 'utf-8');
    expect(md).toContain('name: alpha');
    expect(md).toContain('context_budget_tokens: 4000');
    expect(md).toContain('version: 0.1.0');
    expect(md).toContain('allowed-tools:');
  });

  test('SKILL.md body contains the slash-command heading', () => {
    scaffoldSkill(tmpRoot, 'my-skill');
    const md = readFileSync(join(tmpRoot, 'my-skill', 'SKILL.md'), 'utf-8');
    expect(md).toContain('# /my-skill');
    expect(md).toContain('When to use this skill');
  });

  test('hybrid scaffold creates a scripts/ folder with a placeholder', () => {
    const result = scaffoldSkill(tmpRoot, 'hybrid-demo', 'hybrid');
    expect(result.filesWritten.length).toBe(2);
    expect(existsSync(join(tmpRoot, 'hybrid-demo', 'scripts'))).toBe(true);
    expect(existsSync(join(tmpRoot, 'hybrid-demo', 'scripts', 'README.md'))).toBe(true);
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
