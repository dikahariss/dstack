import { describe, test, expect } from 'bun:test';
import { formatRowsTable, formatRowsJson } from '@adapters/cli/list-formatter';
import type { SkillRow } from '@app/ListCatalog';

describe('formatRowsTable', () => {
  test('returns a sentinel line when there are no rows', () => {
    expect(formatRowsTable([])).toEqual(['(no skills found)']);
  });

  test('renders header + one row with aligned columns', () => {
    const rows: SkillRow[] = [
      {
        id: 'alpha',
        version: '0.1.0',
        description: 'first line\nsecond line',
        tools: ['Read', 'Bash'],
        tokenCount: 320,
        tokenBudget: 4000,
      },
    ];
    const lines = formatRowsTable(rows);
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('TOKENS (approx)');
    expect(lines[1]).toContain('alpha');
    expect(lines[1]).toContain('0.1.0');
    expect(lines[1]).toContain('320/4000');
    expect(lines[1]).toContain('Read,Bash');
    expect(lines[1]).toContain('first line');
    expect(lines[1]).not.toContain('second line');
  });

  test('puts the error message in the tokens column for failed rows', () => {
    const rows: SkillRow[] = [
      {
        id: 'broken',
        version: '?',
        description: '',
        tools: [],
        error: 'not found',
      },
    ];
    const lines = formatRowsTable(rows);
    expect(lines[1]).toContain('not found');
  });
});

describe('formatRowsJson', () => {
  test('emits a JSON array', () => {
    const rows: SkillRow[] = [
      {
        id: 'alpha',
        version: '0.1.0',
        description: 'd',
        tools: ['Read'],
        tokenCount: 100,
        tokenBudget: 4000,
      },
    ];
    const parsed = JSON.parse(formatRowsJson(rows));
    expect(parsed[0].id).toBe('alpha');
    expect(parsed[0].tokenCount).toBe(100);
  });
});
