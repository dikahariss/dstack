import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { SkillRepository } from '@domain/skill/ports';
import { SkillId } from '@domain/skill/SkillId';
import { Warning } from '@domain/render/RenderResult';
import { Telemetry } from '@obs/Telemetry';
import { BuildSkill } from './BuildSkill';

/** One skill's verdict from the validation pipeline. Warnings are non-fatal and do not flip `ok`. */
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
 * Validate skill IDs against a host. Unlike BuildCatalog this never
 * short-circuits — exceptions are captured per-skill so one bad skill
 * does not block the rest.
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
          tokenCount: rendered.rendered.tokenCount,
          tokenBudget: skill.spec.contextBudgetTokens,
          warnings: rendered.rendered.warnings,
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
