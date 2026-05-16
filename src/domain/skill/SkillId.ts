import { SkillSpecError } from '@domain/errors';

/**
 * SkillId is a validated string. The constructor enforces format so invalid
 * IDs cannot reach downstream code.
 *
 * Format: lowercase letters, digits, hyphens. 1-64 chars. Must start with a letter.
 *
 * The class wraps the string rather than being a type alias so the type system
 * distinguishes between "any string" and "a validated skill id" at call sites.
 */
export class SkillId {
  private static readonly PATTERN = /^[a-z][a-z0-9-]{0,63}$/;

  private constructor(readonly value: string) {}

  static parse(raw: string, sourceField: string = 'id'): SkillId {
    if (!SkillId.PATTERN.test(raw)) {
      throw new SkillSpecError(
        raw,
        sourceField,
        `must match ${SkillId.PATTERN} (got "${raw}")`,
      );
    }
    return new SkillId(raw);
  }

  equals(other: SkillId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
