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

export class SkillNotFoundError extends DomainError {
  override readonly name = 'SkillNotFoundError';
  constructor(readonly skillId: string) {
    super(`skill not found: ${skillId}`);
  }
}

/**
 * Raised by the Skill aggregate when the SKILL.md body is empty. The
 * invariant is "every skill carries a non-empty body the LLM can read."
 */
export class EmptySkillBodyError extends DomainError {
  override readonly name = 'EmptySkillBodyError';
  constructor(readonly skillId: string) {
    super(`skill ${skillId}: SKILL.md body is empty`);
  }
}

/**
 * A skill declares a compatibility constraint (e.g. "Requires Bun 1.3+")
 * that the current runtime does not meet. Raised by BuildSkill when the
 * `compatibility` field carries a `Requires Bun X.Y+` clause and the
 * running Bun version is older.
 */
export class CompatibilityError extends DomainError {
  override readonly name = 'CompatibilityError';
  constructor(
    readonly skillId: string,
    readonly requirement: string,
    readonly actual: string,
  ) {
    super(`skill ${skillId}: requires ${requirement}, current runtime ${actual}`);
  }
}

/**
 * The skill's path policy rejected a bundled file. Raised when a bundled
 * path uses `..`, an absolute prefix, or a symlink — see ADR-0017.
 */
export class BundledResourceError extends DomainError {
  override readonly name = 'BundledResourceError';
  constructor(
    readonly skillId: string,
    readonly relativePath: string,
    readonly reason: string,
  ) {
    super(`skill ${skillId}: bundled resource "${relativePath}" rejected: ${reason}`);
  }
}

/**
 * A skill declares `metadata.dstack.type: schema-semantic` but did not
 * declare `output_schema`. Required by ADR-0015's validator rule table.
 */
export class MissingOutputSchemaError extends DomainError {
  override readonly name = 'MissingOutputSchemaError';
  constructor(readonly skillId: string) {
    super(
      `skill ${skillId}: type is schema-semantic but metadata.dstack.output_schema is missing`,
    );
  }
}

/**
 * The forbidden combination from `docs/skill-taxonomy.md` Part 3 final
 * check: a semantic skill that mutates external state autonomously.
 */
export class DangerousCombinationError extends DomainError {
  override readonly name = 'DangerousCombinationError';
  constructor(readonly skillId: string) {
    super(
      `skill ${skillId}: type=semantic + side_effects=external + agency=autonomous is rejected ` +
        `by ADR-0015. Demote at least one axis: require user confirmation (deliberative), ` +
        `constrain output (schema-semantic), or remove external mutation.`,
    );
  }
}
