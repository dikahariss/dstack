import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { SkillRepository } from '@domain/skill/ports';
import { SkillId } from '@domain/skill/SkillId';
import { Telemetry } from '@obs/Telemetry';
import { BuildSkill } from './BuildSkill';

/** One row in the `dstack list` output. `error` is set when the skill could not be loaded or rendered. */
export interface SkillRow {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly tools: readonly string[];
  readonly tokenCount?: number;
  readonly tokenBudget?: number;
  readonly error?: string;
}

/**
 * Collect descriptive rows for every skill id. Skills that fail to load or
 * render surface as `error` rows rather than aborting the listing.
 */
export class ListCatalog {
  constructor(
    private readonly skills: SkillRepository,
    private readonly renderer: HostRenderer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: {
    skillIds: readonly string[];
    host: Host;
    now: Date;
  }): Promise<readonly SkillRow[]> {
    const buildOne = new BuildSkill(this.skills, this.renderer, this.telemetry);
    const rows: SkillRow[] = [];

    for (const idRaw of input.skillIds) {
      let id: SkillId;
      try {
        id = SkillId.parse(idRaw);
      } catch (err) {
        rows.push(errorRow(idRaw, err));
        continue;
      }

      try {
        const skill = await this.skills.loadById(id);
        if (skill === null) {
          rows.push({
            id: id.value,
            version: '?',
            description: '',
            tools: [],
            error: 'not found',
          });
          continue;
        }
        const rendered = await buildOne.execute({
          skillId: id,
          host: input.host,
          now: input.now,
        });
        rows.push({
          id: id.value,
          version: skill.spec.version,
          description: skill.spec.description,
          tools: skill.spec.tools,
          tokenCount: rendered.tokenCount,
          tokenBudget: skill.spec.contextBudgetTokens,
        });
      } catch (err) {
        rows.push(errorRow(id.value, err));
      }
    }

    return rows;
  }
}

function errorRow(id: string, err: unknown): SkillRow {
  return {
    id,
    version: '?',
    description: '',
    tools: [],
    error: err instanceof Error ? err.message : String(err),
  };
}
