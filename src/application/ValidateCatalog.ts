import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { SkillRepository } from '@domain/skill/ports';
import { SkillId } from '@domain/skill/SkillId';
import { Warning } from '@domain/render/RenderResult';
import { Telemetry } from '@obs/Telemetry';
import { BuildSkill } from './BuildSkill';

/**
 * One skill's verdict after running the per-skill validation pipeline.
 * `ok: true` means the skill loaded, every tool resolved, and the render
 * fit inside its declared `context_budget_tokens`. Warnings (e.g.
 * `token-near-budget`, `include-cycle-broken`) are non-fatal and listed
 * for display but do not flip `ok`.
 */
export interface ValidationResult {
  readonly skillId: string;
  readonly ok: boolean;
  readonly tokenCount?: number;
  readonly tokenBudget?: number;
  readonly warnings: readonly Warning[];
  readonly error?: ValidationError;
}

export interface ValidationError {
  readonly name: string;
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
}

/**
 * Validate a list of skill IDs against a host. Used by `dstack validate`.
 *
 * Unlike BuildCatalog this never short-circuits: one bad skill does not
 * prevent the next from being checked. Each id is run through the same
 * BuildSkill pipeline as a normal build, but exceptions are captured per
 * skill instead of propagating.
 *
 * The caller supplies the id list (e.g. by enumerating `skills/`). That
 * keeps directory walking in the adapter layer.
 */
export class ValidateCatalog {
  constructor(
    private readonly skills: SkillRepository,
    private readonly renderer: HostRenderer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: {
    skillIds: readonly string[];
    host: Host;
    now: Date;
  }): Promise<readonly ValidationResult[]> {
    const buildOne = new BuildSkill(this.skills, this.renderer, this.telemetry);
    const results: ValidationResult[] = [];

    for (const idRaw of input.skillIds) {
      let id: SkillId;
      try {
        id = SkillId.parse(idRaw);
      } catch (err) {
        results.push({
          skillId: idRaw,
          ok: false,
          warnings: [],
          error: toValidationError(err),
        });
        continue;
      }

      try {
        const skill = await this.skills.loadById(id);
        if (skill === null) {
          results.push({
            skillId: id.value,
            ok: false,
            warnings: [],
            error: { name: 'NotFound', message: 'skill directory missing skill.yaml' },
          });
          continue;
        }

        const rendered = await buildOne.execute({
          skillId: id,
          host: input.host,
          now: input.now,
        });
        results.push({
          skillId: id.value,
          ok: true,
          tokenCount: rendered.tokenCount,
          tokenBudget: skill.spec.contextBudgetTokens,
          warnings: rendered.warnings,
        });
      } catch (err) {
        results.push({
          skillId: id.value,
          ok: false,
          warnings: [],
          error: toValidationError(err),
        });
      }
    }

    return results;
  }
}

function toValidationError(err: unknown): ValidationError {
  if (!(err instanceof Error)) {
    return { name: 'Unknown', message: String(err) };
  }
  const source = (err as { source?: { file?: string; line?: number } }).source;
  const base: ValidationError = { name: err.name, message: err.message };
  if (source?.file === undefined) return base;
  return source.line !== undefined
    ? { ...base, file: source.file, line: source.line }
    : { ...base, file: source.file };
}
