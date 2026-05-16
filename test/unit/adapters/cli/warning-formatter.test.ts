/**
 * Unit tests for `formatWarnings` and `countWarnings`.
 *
 * Pure functions, no fs, no setup. Whole file runs in <10ms.
 */
import { describe, test, expect } from 'bun:test';
import {
  formatWarnings,
  countWarnings,
} from '../../../../src/adapters/cli/warning-formatter';
import type { RenderResult } from '../../../../src/domain/render/RenderResult';

function makeResult(
  skillId: string,
  warnings: ReadonlyArray<{ kind: string; message: string }>,
): RenderResult {
  return {
    path: `${skillId}/SKILL.md`,
    content: '',
    tokenCount: 0,
    warnings: warnings as RenderResult['warnings'],
  };
}

describe('formatWarnings', () => {
  test('returns empty string when no warnings', () => {
    const results: RenderResult[] = [makeResult('alpha', []), makeResult('beta', [])];
    expect(formatWarnings(results)).toBe('');
  });

  test('returns empty string for empty input', () => {
    expect(formatWarnings([])).toBe('');
  });

  test('groups warnings by skill', () => {
    const results: RenderResult[] = [
      makeResult('alpha', [{ kind: 'token-near-budget', message: '950 of 1000 tokens (>90%)' }]),
      makeResult('beta', [{ kind: 'long-description', message: 'description over 200 chars' }]),
    ];
    const output = formatWarnings(results);
    expect(output).toContain('warnings:');
    expect(output).toContain('  alpha:');
    expect(output).toContain('  beta:');
    expect(output).toContain('token-near-budget: 950 of 1000 tokens (>90%)');
    expect(output).toContain('long-description: description over 200 chars');
  });

  test('includes multiple warnings for same skill', () => {
    const results: RenderResult[] = [
      makeResult('alpha', [
        { kind: 'token-near-budget', message: 'tight' },
        { kind: 'overlapping-trigger', message: 'trigger collision' },
      ]),
    ];
    const output = formatWarnings(results);
    expect(output).toContain('token-near-budget: tight');
    expect(output).toContain('overlapping-trigger: trigger collision');
    expect(output.match(/^  alpha:$/m)?.length).toBe(1); // appears once
  });

  test('skips skills with zero warnings', () => {
    const results: RenderResult[] = [
      makeResult('alpha', [{ kind: 'token-near-budget', message: 'tight' }]),
      makeResult('beta', []),
      makeResult('gamma', [{ kind: 'long-description', message: 'long' }]),
    ];
    const output = formatWarnings(results);
    expect(output).toContain('alpha:');
    expect(output).not.toContain('beta:');
    expect(output).toContain('gamma:');
  });

  test('output is grep-anchorable on `warnings:`', () => {
    const results: RenderResult[] = [
      makeResult('alpha', [{ kind: 'token-near-budget', message: 'tight' }]),
    ];
    const output = formatWarnings(results);
    expect(output.startsWith('warnings:')).toBe(true);
  });
});

describe('countWarnings', () => {
  test('returns 0 for no warnings', () => {
    expect(countWarnings([])).toBe(0);
    expect(countWarnings([makeResult('alpha', [])])).toBe(0);
  });

  test('sums warnings across all results', () => {
    const results: RenderResult[] = [
      makeResult('alpha', [
        { kind: 'token-near-budget', message: 'x' },
        { kind: 'long-description', message: 'y' },
      ]),
      makeResult('beta', [{ kind: 'overlapping-trigger', message: 'z' }]),
      makeResult('gamma', []),
    ];
    expect(countWarnings(results)).toBe(3);
  });
});
