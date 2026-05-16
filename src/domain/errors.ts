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

export class SkillSpecError extends DomainError {
  override readonly name = 'SkillSpecError';
  constructor(
    readonly skillId: string,
    readonly field: string,
    readonly problem: string,
  ) {
    super(`skill ${skillId}: field "${field}": ${problem}`);
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
