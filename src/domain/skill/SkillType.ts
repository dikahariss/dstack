/**
 * The four computation types from `docs/skill-taxonomy.md`.
 *
 * Encoded under `metadata.dstack.type` in the source frontmatter. When
 * omitted, the repository infers it from skill structure per ADR-0015:
 *   1. `output_schema` declared    → schema-semantic
 *   2. `scripts/` folder exists    → hybrid (or deterministic when body < 500 tokens)
 *   3. Otherwise                   → semantic
 */
export type SkillType = 'deterministic' | 'semantic' | 'hybrid' | 'schema-semantic';

export const SKILL_TYPES: readonly SkillType[] = [
  'deterministic',
  'semantic',
  'hybrid',
  'schema-semantic',
] as const;

/**
 * Orthogonal axis F from the taxonomy. What the skill changes in the world.
 *
 * Defaults to `readonly` when not declared. The CI gate in ADR-0015 rejects
 * the combination semantic + external + autonomous.
 */
export type SideEffects = 'readonly' | 'local' | 'external';

export const SIDE_EFFECTS: readonly SideEffects[] = ['readonly', 'local', 'external'] as const;

/**
 * Orthogonal axis E from the taxonomy. How autonomously the skill acts.
 *
 * Defaults to `reactive` when not declared.
 */
export type Agency = 'reactive' | 'deliberative' | 'autonomous';

export const AGENCY: readonly Agency[] = ['reactive', 'deliberative', 'autonomous'] as const;

/**
 * Freedom-calibration band (ADR-0025). How much freedom the prompt gives the
 * agent — a separate axis from `type` (which is about code vs LLM at runtime).
 *
 * Defaults to `workflow` (~30% deterministic, the Hybrid default) when not
 * declared. `type: deterministic` skills omit it. Moving off `workflow` is
 * owner-decided; see ADR-0025 Governance.
 */
export type Calibration =
  | 'deterministic-dominant'
  | 'workflow'
  | 'judgment-dominant'
  | 'schema-meta';

export const CALIBRATIONS: readonly Calibration[] = [
  'deterministic-dominant',
  'workflow',
  'judgment-dominant',
  'schema-meta',
] as const;

export function isSkillType(value: unknown): value is SkillType {
  return typeof value === 'string' && (SKILL_TYPES as readonly string[]).includes(value);
}

export function isSideEffects(value: unknown): value is SideEffects {
  return typeof value === 'string' && (SIDE_EFFECTS as readonly string[]).includes(value);
}

export function isAgency(value: unknown): value is Agency {
  return typeof value === 'string' && (AGENCY as readonly string[]).includes(value);
}

export function isCalibration(value: unknown): value is Calibration {
  return typeof value === 'string' && (CALIBRATIONS as readonly string[]).includes(value);
}

/**
 * Inputs the type-inference rule needs. The repository fills these from a
 * loaded skill before calling `inferType`.
 */
export interface InferenceInput {
  readonly hasOutputSchema: boolean;
  readonly hasScriptsFolder: boolean;
  readonly bodyTokenCount: number;
}

/**
 * Compute the inferred type when `metadata.dstack.type` is absent.
 *
 * Mirrors the table in ADR-0015. The deterministic rule fires before
 * `hybrid` because a small body with scripts means the script is the work.
 */
export function inferType(input: InferenceInput): SkillType {
  if (input.hasOutputSchema) return 'schema-semantic';
  if (input.hasScriptsFolder && input.bodyTokenCount < 500) return 'deterministic';
  if (input.hasScriptsFolder) return 'hybrid';
  return 'semantic';
}
