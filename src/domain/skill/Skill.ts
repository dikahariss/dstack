import { Warning } from '@domain/render/RenderResult';
import { SkillSpec } from './SkillSpec';

/**
 * Skill is the aggregate: a validated spec plus the prompt body and any
 * resolved `includes` content.
 *
 * The aggregate boundary is "everything the renderer needs to produce
 * output for one skill." Include resolution happens in the repository
 * (where filesystem reads belong); the renderer receives the already
 * resolved text and any warnings collected during resolution.
 */
export class Skill {
  constructor(
    readonly spec: SkillSpec,
    readonly prompt: string,
    readonly includesContent: string = '',
    readonly includeWarnings: readonly Warning[] = [],
  ) {
    if (prompt.length === 0) {
      throw new Error(
        `Skill ${spec.id}: prompt is empty. Every skill must have a non-empty prompt.md.`,
      );
    }
  }
}
