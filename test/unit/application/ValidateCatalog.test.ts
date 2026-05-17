/**
 * Tests for the `ValidateCatalog` use case. Covers M4.
 *
 * Uses the real FileSkillRepository + ClaudeCodeRenderer against fixture
 * directories, so each test exercises the integration the CLI relies on.
 */
import { describe, test, expect } from 'bun:test';
import { resolve } from 'node:path';
import { ValidateCatalog } from '@app/ValidateCatalog';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { Host } from '@domain/host/Host';
import { NoopTelemetry } from '@obs/NoopTelemetry';

const FIXTURES = resolve(import.meta.dir, '../../fixtures/skills');
const HOST = new Host('claude-code', '/tmp/dstack-validate-test', {
  knownTools: CLAUDE_CODE_TOOLS,
});
const NOW = new Date('2026-01-01T00:00:00Z');

function makeValidator(rootDir: string) {
  const repo = new FileSkillRepository(resolve(FIXTURES, rootDir));
  return {
    repo,
    validate: new ValidateCatalog(repo, new ClaudeCodeRenderer(), new NoopTelemetry()),
  };
}

describe('ValidateCatalog', () => {
  test('returns empty array when skillIds is empty', async () => {
    const { validate } = makeValidator('good');
    const results = await validate.execute({ skillIds: [], host: HOST, now: NOW });
    expect(results).toEqual([]);
  });

  test('reports OK with token counts for every valid skill', async () => {
    const { repo, validate } = makeValidator('good');
    const ids = repo.listIds();
    expect(ids.length).toBeGreaterThan(0);
    const results = await validate.execute({ skillIds: ids, host: HOST, now: NOW });
    expect(results.length).toBe(ids.length);
    for (const r of results) {
      expect(r.ok).toBe(true);
      expect(typeof r.tokenCount).toBe('number');
      expect(typeof r.tokenBudget).toBe('number');
      expect(r.tokenCount! <= r.tokenBudget!).toBe(true);
    }
  });

  test('captures SkillSpecError per-skill instead of throwing', async () => {
    const { repo, validate } = makeValidator('bad-yaml');
    const ids = repo.listIds();
    const results = await validate.execute({ skillIds: ids, host: HOST, now: NOW });
    expect(results.length).toBe(ids.length);
    for (const r of results) {
      expect(r.ok).toBe(false);
      expect(r.error?.name).toBe('SkillSpecError');
    }
  });

  test('captures source file/line when available on SkillSpecError', async () => {
    const { validate } = makeValidator('bad-yaml');
    const results = await validate.execute({
      skillIds: ['wrong-type'],
      host: HOST,
      now: NOW,
    });
    expect(results.length).toBe(1);
    const r = results[0]!;
    expect(r.ok).toBe(false);
    expect(r.error?.file).toContain('wrong-type/SKILL.md');
    expect(r.error?.line).toBe(4);
  });

  test('returns NotFound for an id whose directory does not exist', async () => {
    const { validate } = makeValidator('good');
    const results = await validate.execute({
      skillIds: ['ghost'],
      host: HOST,
      now: NOW,
    });
    expect(results.length).toBe(1);
    expect(results[0]!.ok).toBe(false);
    expect(results[0]!.error?.name).toBe('NotFound');
  });

  test('continues past a broken skill to validate the rest', async () => {
    const { validate } = makeValidator('bad-yaml');
    const results = await validate.execute({
      skillIds: ['syntax-error', 'wrong-type', 'missing-tools'],
      host: HOST,
      now: NOW,
    });
    expect(results.map((r) => r.skillId)).toEqual([
      'syntax-error',
      'wrong-type',
      'missing-tools',
    ]);
    for (const r of results) expect(r.ok).toBe(false);
  });
});
