import { SkillSpec } from './SkillSpec';

/**
 * Skill is the aggregate: a validated spec plus the prompt body.
 *
 * The aggregate boundary is "everything the renderer needs to produce
 * output for one skill." It does not include resolved `includes` content
 * — that happens in the renderer, where include resolution can be cached
 * across the build.
 */
export class Skill {
  constructor(
    readonly spec: SkillSpec,
    readonly prompt: string,
  ) {
    if (prompt.length === 0) {
      throw new Error(
        `Skill ${spec.id}: prompt is empty. Every skill must have a non-empty prompt.md.`,
      );
    }
  }
}
