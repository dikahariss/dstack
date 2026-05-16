import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { SkillRepository } from '@domain/skill/ports';
import { RenderResult } from '@domain/render/RenderResult';
import { DuplicateSkillIdError } from '@domain/errors';
import { Telemetry } from '@obs/Telemetry';
import { BuildSkill } from './BuildSkill';

/**
 * Render every skill in the repository for one host.
 *
 * Cross-skill validation lives here:
 * - duplicate skill IDs are an error
 *
 * Per-skill validation is delegated to BuildSkill.
 */
export class BuildCatalog {
  constructor(
    private readonly skills: SkillRepository,
    private readonly renderer: HostRenderer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: { host: Host; now: Date }): Promise<readonly RenderResult[]> {
    const all = await this.skills.loadAll();

    const seen = new Map<string, string[]>();
    for (const skill of all) {
      const id = skill.spec.id.value;
      const existing = seen.get(id) ?? [];
      existing.push(id);
      seen.set(id, existing);
    }
    for (const [id, paths] of seen) {
      if (paths.length > 1) throw new DuplicateSkillIdError(id, paths);
    }

    const buildOne = new BuildSkill(this.skills, this.renderer, this.telemetry);
    const results: RenderResult[] = [];
    for (const skill of all) {
      const result = await buildOne.execute({
        skillId: skill.spec.id,
        host: input.host,
        now: input.now,
      });
      results.push(result);
    }

    this.telemetry.emit({
      kind: 'catalog_built',
      host: input.host.name,
      skillCount: results.length,
    });

    return results;
  }
}
