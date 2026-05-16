import { ValidationResult } from '../../application/ValidateCatalog';

/**
 * Render `ValidationResult`s as the line-oriented output of
 * `dstack validate`. Each line begins with the skill id followed by
 * `OK` or `ERR`, so the output stays greppable:
 *
 *   careful: OK (1238/1500 tokens)
 *   wrong-type: ERR field "tools": must be an array of strings at /…/skill.yaml:5
 *
 * Exit code is 0 if every skill is OK, 1 if any skill failed.
 * Empty input yields one line so the caller can tell validate ran.
 */
export interface FormattedValidation {
  readonly lines: readonly string[];
  readonly exitCode: 0 | 1;
}

export function formatValidationResults(
  results: readonly ValidationResult[],
): FormattedValidation {
  if (results.length === 0) {
    return { lines: ['(no skills found)'], exitCode: 0 };
  }

  const lines: string[] = [];
  let anyError = false;

  for (const r of results) {
    lines.push(r.ok ? formatOk(r) : formatErr(r));
    if (!r.ok) anyError = true;
  }

  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.length - okCount;
  lines.push('');
  lines.push(`${results.length} skills checked: ${okCount} OK, ${errCount} ERR`);

  return { lines, exitCode: anyError ? 1 : 0 };
}

function formatOk(r: ValidationResult): string {
  return `${r.skillId}: OK (${r.tokenCount}/${r.tokenBudget} tokens)`;
}

function formatErr(r: ValidationResult): string {
  const message = stripSkillPrefix(r.skillId, r.error?.message ?? 'unknown error');
  return `${r.skillId}: ERR ${message}`;
}

/**
 * SkillSpecError.message already begins with `skill <id>: `, which would
 * duplicate the per-line skill id prefix. Trim that duplication so each
 * line reads `<id>: ERR <field-and-problem-and-source>`.
 */
function stripSkillPrefix(skillId: string, message: string): string {
  const prefix = `skill ${skillId}: `;
  return message.startsWith(prefix) ? message.slice(prefix.length) : message;
}
