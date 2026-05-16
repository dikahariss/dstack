import { RenderResult } from '@domain/render/RenderResult';

/**
 * Format renderer warnings for CLI output.
 *
 * Warnings live in `RenderResult.warnings` but the CLI ignored them until
 * v0.2 (see ROADMAP M5). This formatter is the bridge: input is the full
 * list of results, output is multi-line text grouped by skill.
 *
 * Returns an empty string when no warnings exist. Callers should check
 * the result and skip printing when empty.
 *
 * Format:
 *   warnings:
 *     <skill-id>:
 *       - <warning-kind>: <message>
 *       - <warning-kind>: <message>
 *     <other-skill>:
 *       - <warning-kind>: <message>
 *
 * The first line ("warnings:") makes the section grep-friendly:
 * `dstack build | grep -A 999 '^warnings:'`.
 */
export function formatWarnings(results: readonly RenderResult[]): string {
  const withWarnings = results.filter((r) => r.warnings.length > 0);
  if (withWarnings.length === 0) return '';

  const lines: string[] = ['warnings:'];
  for (const result of withWarnings) {
    const skillId = skillIdFromPath(result.path);
    lines.push(`  ${skillId}:`);
    for (const w of result.warnings) {
      lines.push(`    - ${w.kind}: ${w.message}`);
    }
  }
  return lines.join('\n');
}

/**
 * Count total warnings across all results. Useful for summary lines like
 * "built N skills (M warnings)".
 */
export function countWarnings(results: readonly RenderResult[]): number {
  return results.reduce((sum, r) => sum + r.warnings.length, 0);
}

/**
 * RenderResult.path looks like `<skill-id>/SKILL.md`. Extract the skill id
 * for display. If the path does not match this shape, return it whole.
 */
function skillIdFromPath(path: string): string {
  const slash = path.indexOf('/');
  return slash > 0 ? path.slice(0, slash) : path;
}
