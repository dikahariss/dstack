/**
 * Typed domain errors. Adapters and use cases catch by type, not by message.
 *
 * Convention: every error carries enough structured context to identify the
 * offending entity. Avoid string interpolation in `message`; put facts in
 * properties so callers can render them.
 */

export class DomainError extends Error {
  override readonly name: string = 'DomainError';
}

/**
 * SourceLocation identifies where in the filesystem an error originated.
 *
 * `file` is an absolute path. `line` is 1-indexed when present. Errors
 * carry this so the user can click into the offending file at the right
 * spot. The `yaml` package's LineCounter is the source for line numbers
 * on YAML-syntax failures.
 */
export interface SourceLocation {
  readonly file: string;
  readonly line?: number;
}

function formatLocation(loc: SourceLocation | undefined): string {
  if (!loc) return '';
  return loc.line !== undefined ? ` at ${loc.file}:${loc.line}` : ` at ${loc.file}`;
}

export class SkillSpecError extends DomainError {
  override readonly name = 'SkillSpecError';
  readonly source: SourceLocation | undefined;

  constructor(
    readonly skillId: string,
    readonly field: string,
    readonly problem: string,
    source?: SourceLocation,
  ) {
    super(`skill ${skillId}: field "${field}": ${problem}${formatLocation(source)}`);
    this.source = source;
  }
}

export class IncludeNotFoundError extends DomainError {
  override readonly name = 'IncludeNotFoundError';
  constructor(
    readonly skillId: string,
    readonly includePath: string,
  ) {
    super(`skill ${skillId}: include "${includePath}" not found`);
  }
}

export class TokenBudgetExceededError extends DomainError {
  override readonly name = 'TokenBudgetExceededError';
  constructor(
    readonly skillId: string,
    readonly actual: number,
    readonly budget: number,
  ) {
    super(`skill ${skillId}: rendered ${actual} tokens, budget ${budget}`);
  }
}

export class UnknownToolError extends DomainError {
  override readonly name = 'UnknownToolError';
  constructor(
    readonly skillId: string,
    readonly toolName: string,
    readonly knownTools: readonly string[],
  ) {
    super(
      `skill ${skillId}: tool "${toolName}" not in host registry. ` +
        `known: ${knownTools.join(', ')}`,
    );
  }
}

export class DuplicateSkillIdError extends DomainError {
  override readonly name = 'DuplicateSkillIdError';
  constructor(readonly skillId: string, readonly paths: readonly string[]) {
    super(`duplicate skill id "${skillId}" at: ${paths.join(', ')}`);
  }
}
