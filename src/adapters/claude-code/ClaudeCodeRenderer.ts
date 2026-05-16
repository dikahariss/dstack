import { Host } from '../../domain/host/Host';
import { HostRenderer } from '../../domain/host/ports';
import { RenderContext } from '../../domain/render/RenderContext';
import { RenderResult, Warning } from '../../domain/render/RenderResult';
import { approximateTokenCount } from './tokens';

/**
 * Renders a Skill into Claude Code's expected on-disk shape.
 *
 * Output layout: `<host.outputRoot>/<skill-id>/SKILL.md`
 *
 * The renderer is pure and deterministic. It does not read includes itself —
 * those are resolved upstream by the SkillRepository so the cache lives in
 * one place. The renderer composes what it is given.
 */
export class ClaudeCodeRenderer implements HostRenderer {
  render(ctx: RenderContext): RenderResult {
    const { skill } = ctx;
    const warnings: Warning[] = [];

    const frontmatter = this.buildFrontmatter(ctx.host, skill.spec);
    const content = frontmatter + '\n' + skill.prompt;
    const tokenCount = approximateTokenCount(content);

    if (tokenCount > skill.spec.contextBudgetTokens * 0.9) {
      warnings.push({
        kind: 'token-near-budget',
        message: `${tokenCount} of ${skill.spec.contextBudgetTokens} tokens (>90%)`,
      });
    }

    return {
      path: `${skill.spec.id.value}/SKILL.md`,
      content,
      tokenCount,
      warnings,
    };
  }

  private buildFrontmatter(_host: Host, spec: import('../../domain/skill/SkillSpec').SkillSpec): string {
    const lines = [
      '---',
      `name: ${spec.id.value}`,
      `version: ${spec.version}`,
      `description: |`,
      ...spec.description.split('\n').map((l) => `  ${l}`),
      `allowed-tools: [${spec.tools.join(', ')}]`,
      '---',
    ];
    return lines.join('\n');
  }
}
