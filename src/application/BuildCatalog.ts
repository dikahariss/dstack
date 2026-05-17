import { Host } from '@domain/host/Host';
import { HostRenderer, RenderedSkill } from '@domain/host/ports';
import { Skill } from '@domain/skill/Skill';
import { SkillRepository } from '@domain/skill/ports';
import { DuplicateSkillIdError } from '@domain/errors';
import { Warning } from '@domain/render/RenderResult';
import { Telemetry } from '@obs/Telemetry';
import { BuildSkill } from './BuildSkill';

/**
 * Render every skill in the repository for one host.
 *
 * Cross-skill validation lives here:
 *   - duplicate skill IDs are an error
 *   - overlapping trigger phrases across skills emit a warning on every
 *     skill that shares the phrase
 *
 * Per-skill validation is delegated to BuildSkill.
 */
export class BuildCatalog {
  constructor(
    private readonly skills: SkillRepository,
    private readonly renderer: HostRenderer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: { host: Host; now: Date }): Promise<readonly RenderedSkill[]> {
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

    const overlapWarnings = collectOverlappingTriggers(all);

    const buildOne = new BuildSkill(this.skills, this.renderer, this.telemetry);
    const results: RenderedSkill[] = [];
    for (const skill of all) {
      const result = await buildOne.execute({
        skillId: skill.spec.id,
        host: input.host,
        now: input.now,
      });
      const extra = overlapWarnings.get(skill.spec.id.value) ?? [];
      const merged: RenderedSkill = extra.length === 0
        ? result
        : {
            rendered: { ...result.rendered, warnings: [...result.rendered.warnings, ...extra] },
            bundled: result.bundled,
          };
      results.push(merged);
    }

    this.telemetry.emit({
      kind: 'catalog_built',
      host: input.host.name,
      skillCount: results.length,
    });

    return results;
  }
}

/**
 * For each trigger phrase that appears in two or more skills, emit one
 * `overlapping-trigger` warning per affected skill. Returns a map of
 * skill id -> warnings to attach.
 */
function collectOverlappingTriggers(skills: readonly Skill[]): Map<string, Warning[]> {
  const phraseToSkills = new Map<string, string[]>();
  for (const skill of skills) {
    for (const phrase of skill.spec.triggers) {
      const key = phrase.toLowerCase().trim();
      if (key.length === 0) continue;
      const list = phraseToSkills.get(key) ?? [];
      if (!list.includes(skill.spec.id.value)) list.push(skill.spec.id.value);
      phraseToSkills.set(key, list);
    }
  }

  const warnings = new Map<string, Warning[]>();
  for (const [phrase, ids] of phraseToSkills) {
    if (ids.length < 2) continue;
    const others = (id: string) => ids.filter((x) => x !== id).join(', ');
    for (const id of ids) {
      const list = warnings.get(id) ?? [];
      list.push({
        kind: 'overlapping-trigger',
        message: `trigger "${phrase}" also declared by: ${others(id)}`,
      });
      warnings.set(id, list);
    }
  }
  return warnings;
}
