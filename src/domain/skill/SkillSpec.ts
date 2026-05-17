import { SkillId } from './SkillId';
import { SkillType, SideEffects, Agency } from './SkillType';

/**
 * SkillSpec is the parsed, validated form of `SKILL.md` frontmatter.
 *
 * It is a value object: immutable, equality by value, no identity.
 * Construction is via `SkillSpec.fromValidated(data)` so validation lives
 * in one place (the repository). Direct construction is intentionally
 * awkward.
 */

export type ToolName = string;          // validated against host registry later
export type TriggerPhrase = string;

export interface SkillInput {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'url' | 'path';
  readonly required: boolean;
  readonly default?: unknown;
  readonly description?: string;
}

export interface SkillOutput {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'url' | 'path' | 'record';
  readonly description?: string;
}

export interface SkillSpecData {
  readonly id: SkillId;
  readonly version: string;
  readonly description: string;
  readonly tools: readonly ToolName[];
  readonly inputs: readonly SkillInput[];
  readonly outputs: readonly SkillOutput[];
  readonly contextBudgetTokens: number;
  readonly triggers: readonly TriggerPhrase[];
  readonly includes: readonly string[];
  readonly license?: string;
  readonly compatibility?: string;

  // v2 additions (ADR-0015). Always set after parse — the repository fills
  // defaults or inferred values when the source omits them.
  readonly type: SkillType;
  readonly declaredType?: SkillType;     // present iff the source declared one
  readonly sideEffects: SideEffects;     // defaults to 'readonly'
  readonly agency: Agency;                // defaults to 'reactive'
  readonly outputSchema?: unknown;        // inline JSON Schema or relative path
}

/**
 * Body-only token ceiling. ADR-0016 supersedes ADR-0010's 16,000-token
 * total-output ceiling. Bundled resources (scripts/, references/, assets/)
 * are not counted; they load on demand.
 */
export const CONTEXT_BUDGET_CEILING = 5_000;
export const CONTEXT_BUDGET_DEFAULT = 4_000;

/** Body-token threshold below which a skill with `scripts/` infers `deterministic`. */
export const DETERMINISTIC_BODY_TOKEN_THRESHOLD = 500;

/** Module-folder count above which the validator emits `comprehensive-skill`. SkillsBench. */
export const COMPREHENSIVE_MODULE_THRESHOLD = 4;

export class SkillSpec implements SkillSpecData {
  readonly id: SkillId;
  readonly version: string;
  readonly description: string;
  readonly tools: readonly ToolName[];
  readonly inputs: readonly SkillInput[];
  readonly outputs: readonly SkillOutput[];
  readonly contextBudgetTokens: number;
  readonly triggers: readonly TriggerPhrase[];
  readonly includes: readonly string[];
  readonly license?: string;
  readonly compatibility?: string;
  readonly type: SkillType;
  readonly declaredType?: SkillType;
  readonly sideEffects: SideEffects;
  readonly agency: Agency;
  readonly outputSchema?: unknown;

  private constructor(data: SkillSpecData) {
    this.id = data.id;
    this.version = data.version;
    this.description = data.description;
    this.tools = data.tools;
    this.inputs = data.inputs;
    this.outputs = data.outputs;
    this.contextBudgetTokens = data.contextBudgetTokens;
    this.triggers = data.triggers;
    this.includes = data.includes;
    if (data.license !== undefined) this.license = data.license;
    if (data.compatibility !== undefined) this.compatibility = data.compatibility;
    this.type = data.type;
    if (data.declaredType !== undefined) this.declaredType = data.declaredType;
    this.sideEffects = data.sideEffects;
    this.agency = data.agency;
    if (data.outputSchema !== undefined) this.outputSchema = data.outputSchema;
  }

  static fromValidated(data: SkillSpecData): SkillSpec {
    return new SkillSpec(data);
  }
}
