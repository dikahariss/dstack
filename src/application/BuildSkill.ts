import { Host } from '@domain/host/Host';
import { HostRenderer, RenderedSkill } from '@domain/host/ports';
import { SkillId } from '@domain/skill/SkillId';
import { SkillRepository } from '@domain/skill/ports';
import {
  TokenBudgetExceededError,
  UnknownToolError,
  DangerousCombinationError,
  MissingOutputSchemaError,
} from '@domain/errors';
import { Telemetry } from '@obs/Telemetry';

/**
 * Render one skill for one host. Used by `dstack render <id>` and by
 * BuildCatalog as the per-skill step.
 *
 * Validation that does not require cross-skill knowledge happens here:
 *   - tools must exist in the host's registry
 *   - body token count must fit the declared budget (ADR-0016)
 *   - schema-semantic skills must declare `output_schema` (ADR-0015)
 *   - the dangerous combination semantic+external+autonomous is rejected
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

  async execute(input: { skillId: SkillId; host: Host; now: Date }): Promise<RenderedSkill> {
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

    if (skill.spec.type === 'schema-semantic' && skill.spec.outputSchema === undefined) {
      throw new MissingOutputSchemaError(skillId.value);
    }
    if (
      skill.spec.type === 'semantic' &&
      skill.spec.sideEffects === 'external' &&
      skill.spec.agency === 'autonomous'
    ) {
      throw new DangerousCombinationError(skillId.value);
    }

    const rendered = this.renderer.render({
      host,
      skill,
      tokenBudget: skill.spec.contextBudgetTokens,
      now,
    });

    if (rendered.tokenCount > skill.spec.contextBudgetTokens) {
      throw new TokenBudgetExceededError(
        skillId.value,
        rendered.tokenCount,
        skill.spec.contextBudgetTokens,
      );
    }

    this.telemetry.emit({
      kind: 'skill_rendered',
      skillId: skillId.value,
      host: host.name,
      tokenCount: rendered.tokenCount,
      tokenBudget: skill.spec.contextBudgetTokens,
    });

    return { rendered, bundled: skill.bundled };
  }
}
