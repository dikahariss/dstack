import { Host } from '../host/Host';
import { Skill } from '../skill/Skill';

/**
 * RenderContext is the immutable input to a renderer.
 *
 * Time is injected (not pulled from `new Date()`) so renders are
 * deterministic under tests. Token budget is from the skill's spec,
 * surfaced here so renderers do not have to re-read it.
 */
export interface RenderContext {
  readonly host: Host;
  readonly skill: Skill;
  readonly tokenBudget: number;
  readonly now: Date;
}
