import { SkillRow } from '@app/ListCatalog';

/** Render rows as an aligned table. Token column header notes "approx" — counts are within ±10% of the exact tokenizer. */
export function formatRowsTable(rows: readonly SkillRow[]): readonly string[] {
  if (rows.length === 0) return ['(no skills found)'];

  type Cell = {
    id: string;
    version: string;
    type: string;
    tokens: string;
    tools: string;
    description: string;
  };
  const header: Cell = {
    id: 'ID',
    version: 'VERSION',
    type: 'TYPE',
    tokens: 'TOKENS (approx)',
    tools: 'TOOLS',
    description: 'DESCRIPTION',
  };
  const cells: Cell[] = rows.map((r) => ({
    id: r.id,
    version: r.version,
    type: r.type ?? '?',
    tokens: r.error !== undefined ? r.error : `${r.tokenCount ?? '?'}/${r.tokenBudget ?? '?'}`,
    tools: r.tools.join(','),
    description: (r.description.split('\n')[0] ?? '').trim(),
  }));
  const all = [header, ...cells];
  const w = {
    id: Math.max(...all.map((r) => r.id.length)),
    version: Math.max(...all.map((r) => r.version.length)),
    type: Math.max(...all.map((r) => r.type.length)),
    tokens: Math.max(...all.map((r) => r.tokens.length)),
    tools: Math.max(...all.map((r) => r.tools.length)),
  };
  return all.map((r) =>
    [
      r.id.padEnd(w.id),
      r.version.padEnd(w.version),
      r.type.padEnd(w.type),
      r.tokens.padEnd(w.tokens),
      r.tools.padEnd(w.tools),
      r.description,
    ].join('  '),
  );
}

/** Render rows as JSON for programmatic consumption. */
export function formatRowsJson(rows: readonly SkillRow[]): string {
  return JSON.stringify(rows, null, 2);
}
