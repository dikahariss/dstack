import { Host } from '@domain/host/Host';
import { HostRenderer, RenderedSkill } from '@domain/host/ports';
import { SkillId } from '@domain/skill/SkillId';
import { SkillRepository } from '@domain/skill/ports';
import {
  TokenBudgetExceededError,
  UnknownToolError,
  DangerousCombinationError,
  MissingOutputSchemaError,
  SkillNotFoundError,
  CompatibilityError,
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
 *   - `compatibility` clauses like "Requires Bun 1.3+" must be satisfied
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
      throw new SkillNotFoundError(skillId.value);
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

    if (skill.spec.compatibility !== undefined) {
      assertBunCompatible(skillId.value, skill.spec.compatibility);
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

/**
 * Enforce `Requires Bun X.Y+` clauses inside `compatibility`. Other
 * compatibility statements are treated as informational and pass
 * through — the application only knows how to verify its own runtime.
 */
function assertBunCompatible(skillId: string, compatibility: string): void {
  const match = compatibility.match(/Requires Bun (\d+)\.(\d+)(?:\.(\d+))?\+/i);
  if (!match) return;
  const required = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
  };
  const actualStr = (globalThis as { Bun?: { version: string } }).Bun?.version ?? '0.0.0';
  const parts = actualStr.split('.').map(Number);
  const actual = { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };

  const fails =
    actual.major < required.major ||
    (actual.major === required.major && actual.minor < required.minor) ||
    (actual.major === required.major &&
      actual.minor === required.minor &&
      actual.patch < required.patch);

  if (fails) {
    throw new CompatibilityError(skillId, match[0].replace(/^Requires /i, ''), `Bun ${actualStr}`);
  }
}
