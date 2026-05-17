import { Warning } from '@domain/render/RenderResult';
import { EmptySkillBodyError } from '@domain/errors';
import { SkillSpec } from './SkillSpec';
import { BundledFile } from './BundledFile';

/**
 * Skill is the aggregate: a validated spec plus the prompt body, resolved
 * `includes` content, and any bundled resources shipped alongside SKILL.md.
 *
 * The aggregate boundary is "everything the installer needs to materialise
 * one skill on disk." Include resolution and bundled-file collection happen
 * in the repository (where filesystem reads belong); the renderer sees the
 * resolved text and the installer copies the bundled files.
 */
export class Skill {
  constructor(
    readonly spec: SkillSpec,
    readonly prompt: string,
    readonly includesContent: string,
    readonly includeWarnings: readonly Warning[],
    readonly bundled: readonly BundledFile[] = [],
  ) {
    if (prompt.length === 0) {
      throw new EmptySkillBodyError(spec.id.value);
    }
  }
}
