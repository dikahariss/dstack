import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { RenderContext } from '@domain/render/RenderContext';
import { RenderResult, Warning } from '@domain/render/RenderResult';
import { approximateTokenCount } from './tokens';

/**
 * Renders a Skill into Claude Code's expected on-disk shape.
 *
 * Output layout: `<host.outputRoot>/<skill-id>/SKILL.md`
 *
 * The renderer is pure and deterministic. Include resolution happens
 * upstream in the SkillRepository — the renderer receives the already
 * concatenated text on `Skill.includesContent` and forwards any
 * resolution warnings it produced.
 */
export class ClaudeCodeRenderer implements HostRenderer {
  render(ctx: RenderContext): RenderResult {
    const { skill } = ctx;
    const warnings: Warning[] = [...skill.includeWarnings];

    const frontmatter = this.buildFrontmatter(ctx.host, skill.spec);
    const body = skill.includesContent.length > 0
      ? skill.includesContent + '\n' + skill.prompt
      : skill.prompt;
    const content = frontmatter + '\n' + body;
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
