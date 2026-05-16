import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { SkillId } from '@domain/skill/SkillId';
import { SkillRepository } from '@domain/skill/ports';
import { RenderResult } from '@domain/render/RenderResult';
import { TokenBudgetExceededError, UnknownToolError } from '@domain/errors';
import { Telemetry } from '@obs/Telemetry';

/**
 * Render one skill for one host. Used by `dstack render <id>` and by
 * BuildCatalog as the per-skill step.
 *
 * Validation that does not require cross-skill knowledge happens here:
 * - tools must exist in the host's registry
 * - token count must fit budget
 *
 * Cross-skill validation (duplicate IDs, overlapping triggers) is the
 * caller's responsibility — typically `BuildCatalog`.
 */
export class BuildSkill {
  constructor(
    private readonly skills: SkillRepository,
    private readonly renderer: HostRenderer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: { skillId: SkillId; host: Host; now: Date }): Promise<RenderResult> {
    const { skillId, host, now } = input;

    const skill = await this.skills.loadById(skillId);
    if (skill === null) {
      throw new Error(`skill not found: ${skillId}`);
    }

    for (const tool of skill.spec.tools) {
      if (!host.tools.knownTools.includes(tool)) {
        throw new UnknownToolError(skillId.value, tool, host.tools.knownTools);
      }
    }

    const result = this.renderer.render({
      host,
      skill,
      tokenBudget: skill.spec.contextBudgetTokens,
      now,
    });

    if (result.tokenCount > skill.spec.contextBudgetTokens) {
      throw new TokenBudgetExceededError(
        skillId.value,
        result.tokenCount,
        skill.spec.contextBudgetTokens,
      );
    }

    this.telemetry.emit({
      kind: 'skill_rendered',
      skillId: skillId.value,
      host: host.name,
      tokenCount: result.tokenCount,
      tokenBudget: skill.spec.contextBudgetTokens,
    });

    return result;
  }
}
