import { ValidationResult } from '@app/ValidateCatalog';

/** Render ValidationResults as greppable lines for `dstack validate`. Exit 1 if any skill failed; empty input prints a sentinel line. */
export function formatValidationResults(
  results: readonly ValidationResult[],
): { readonly lines: readonly string[]; readonly exitCode: 0 | 1 } {
  if (results.length === 0) {
    return { lines: ['(no skills found)'], exitCode: 0 };
  }

  const lines: string[] = [];
  let anyError = false;

  let warnCount = 0;
  for (const r of results) {
    if (r.ok) {
      const suffix = r.warnings.length > 0 ? ` (${r.warnings.length} warnings)` : '';
      lines.push(`${r.skillId}: OK (${r.tokenCount}/${r.tokenBudget} tokens)${suffix}`);
      for (const w of r.warnings) {
        lines.push(`  - ${w.kind}: ${w.message}`);
        warnCount++;
      }
      continue;
    }
    const raw = r.error?.message ?? 'unknown error';
    const prefix = `skill ${r.skillId}: `;
    const message = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
    lines.push(`${r.skillId}: ERR ${message}`);
    anyError = true;
  }

  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.length - okCount;
  lines.push('');
  const warnPart = warnCount > 0 ? `, ${warnCount} warnings` : '';
  lines.push(`${results.length} skills checked: ${okCount} OK, ${errCount} ERR${warnPart}`);

  return { lines, exitCode: anyError ? 1 : 0 };
}
