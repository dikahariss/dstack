/**
 * Tests for `formatValidationResults`. Covers M4.
 */
import { describe, test, expect } from 'bun:test';
import { formatValidationResults } from '@adapters/cli/validate-formatter';
import type { ValidationResult } from '@app/ValidateCatalog';

describe('formatValidationResults', () => {
  test('empty input prints a sentinel line and exits 0', () => {
    const { lines, exitCode } = formatValidationResults([]);
    expect(lines).toEqual(['(no skills found)']);
    expect(exitCode).toBe(0);
  });

  test('all OK: prints id with token count and exits 0', () => {
    const { lines, exitCode } = formatValidationResults([
      { skillId: 'careful', ok: true, tokenCount: 746, tokenBudget: 1500, warnings: [] },
      { skillId: 'tdd', ok: true, tokenCount: 1100, tokenBudget: 2000, warnings: [] },
    ]);
    expect(exitCode).toBe(0);
    expect(lines[0]).toBe('careful: OK (746/1500 tokens)');
    expect(lines[1]).toBe('tdd: OK (1100/2000 tokens)');
    expect(lines[lines.length - 1]).toBe('2 skills checked: 2 OK, 0 ERR');
  });

  test('any ERR: exit code is 1 and the line is greppable', () => {
    const result: ValidationResult = {
      skillId: 'broken',
      ok: false,
      warnings: [],
      error: { name: 'SkillSpecError', message: 'unparseable yaml at /tmp/broken/skill.yaml:3' },
    };
    const { lines, exitCode } = formatValidationResults([result]);
    expect(exitCode).toBe(1);
    expect(lines[0]).toBe('broken: ERR unparseable yaml at /tmp/broken/skill.yaml:3');
    expect(lines[lines.length - 1]).toBe('1 skills checked: 0 OK, 1 ERR');
  });

  test('strips duplicate "skill <id>: " prefix from SkillSpecError messages', () => {
    const result: ValidationResult = {
      skillId: 'wrong-type',
      ok: false,
      warnings: [],
      error: {
        name: 'SkillSpecError',
        message:
          'skill wrong-type: field "tools": must be an array of strings at /tmp/skill.yaml:5',
      },
    };
    const { lines } = formatValidationResults([result]);
    expect(lines[0]).toBe(
      'wrong-type: ERR field "tools": must be an array of strings at /tmp/skill.yaml:5',
    );
  });

  test('mixed OK and ERR exits 1 and reports counts in the summary', () => {
    const { lines, exitCode } = formatValidationResults([
      { skillId: 'a', ok: true, tokenCount: 10, tokenBudget: 1000, warnings: [] },
      { skillId: 'b', ok: false, warnings: [], error: { name: 'X', message: 'boom' } },
      { skillId: 'c', ok: true, tokenCount: 20, tokenBudget: 1000, warnings: [] },
    ]);
    expect(exitCode).toBe(1);
    expect(lines[lines.length - 1]).toBe('3 skills checked: 2 OK, 1 ERR');
  });
});
