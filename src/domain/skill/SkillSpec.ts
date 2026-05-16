import { SkillId } from './SkillId';

/**
 * SkillSpec is the parsed, validated form of `skill.yaml`.
 *
 * It is a value object: immutable, equality by value, no identity.
 * Construction is via `SkillSpec.parse(raw)` so validation lives in one
 * place. Direct construction is intentionally awkward.
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
}

/**
 * The renderer's hard ceiling. See ADR-0010.
 * A skill that declares more than this fails the build.
 */
export const CONTEXT_BUDGET_CEILING = 16_000;
export const CONTEXT_BUDGET_DEFAULT = 4_000;

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
  }

  static fromValidated(data: SkillSpecData): SkillSpec {
    return new SkillSpec(data);
  }
}
