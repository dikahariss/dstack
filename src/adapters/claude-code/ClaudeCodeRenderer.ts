import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { RenderContext } from '@domain/render/RenderContext';
import { RenderResult, Warning } from '@domain/render/RenderResult';
import { SkillSpec } from '@domain/skill/SkillSpec';
import {
  COMPREHENSIVE_MODULE_THRESHOLD,
} from '@domain/skill/SkillSpec';
import { approximateTokenCount } from './tokens';

/**
 * Renders a Skill into Claude Code's expected on-disk shape.
 *
 * Output layout: `<host.outputRoot>/<skill-id>/SKILL.md` plus any bundled
 * resources (copied by the Installer, not the renderer).
 *
 * Frontmatter shape per ADR-0014:
 *
 *   ---
 *   name: <id>
 *   description: |
 *     <description>
 *   license: <license>            # optional
 *   compatibility: <compat>       # optional
 *   metadata:
 *     dstack:
 *       type: <SkillType>
 *       version: <semver>
 *       triggers: [...]            # optional, only emitted when non-empty
 *       context_budget_tokens: <n>
 *       side_effects: <...>
 *       agency: <...>
 *       output_schema: <...>       # optional, schema-semantic only
 *   allowed-tools: <space-separated>
 *   ---
 *
 * The renderer is pure and deterministic. Include resolution happens
 * upstream in the SkillRepository — the renderer receives the already
 * concatenated text on `Skill.includesContent` and forwards any
 * resolution warnings it produced. Bundled resources are installed
 * verbatim by the Installer; they are not part of `RenderResult.content`
 * and not counted against the token budget (ADR-0016).
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

    const moduleFolderCount = this.countModuleFolders(skill.bundled);
    if (moduleFolderCount >= COMPREHENSIVE_MODULE_THRESHOLD) {
      warnings.push({
        kind: 'comprehensive-skill',
        message:
          `${skill.spec.id.value}: ${moduleFolderCount} module folders. SkillsBench reports ` +
          `that comprehensive skills (≥4 modules) reduce pass rate by 2.9pp on average. ` +
          `Consider splitting into focused skills.`,
      });
    }

    return {
      path: `${skill.spec.id.value}/SKILL.md`,
      content,
      tokenCount,
      warnings,
    };
  }

  private buildFrontmatter(_host: Host, spec: SkillSpec): string {
    const lines: string[] = [
      '---',
      `name: ${spec.id.value}`,
      'description: |',
      ...spec.description.split('\n').map((l) => `  ${l}`),
    ];
    if (spec.license !== undefined) lines.push(`license: ${spec.license}`);
    if (spec.compatibility !== undefined) lines.push(`compatibility: ${spec.compatibility}`);

    lines.push('metadata:');
    lines.push('  dstack:');
    lines.push(`    type: ${spec.type}`);
    lines.push(`    version: ${spec.version}`);
    if (spec.triggers.length > 0) {
      lines.push('    triggers:');
      for (const trigger of spec.triggers) {
        lines.push(`      - ${quoteScalar(trigger)}`);
      }
    }
    lines.push(`    context_budget_tokens: ${spec.contextBudgetTokens}`);
    lines.push(`    side_effects: ${spec.sideEffects}`);
    lines.push(`    agency: ${spec.agency}`);
    if (spec.outputSchema !== undefined) {
      lines.push(`    output_schema: ${stringifyOutputSchema(spec.outputSchema)}`);
    }

    if (spec.tools.length > 0) {
      lines.push(`allowed-tools: ${spec.tools.join(' ')}`);
    }
    lines.push('---');
    return lines.join('\n');
  }

  private countModuleFolders(bundled: readonly { relativePath: string }[]): number {
    const tops = new Set<string>();
    for (const file of bundled) {
      const slash = file.relativePath.indexOf('/');
      if (slash > 0) tops.add(file.relativePath.slice(0, slash));
    }
    return tops.size;
  }
}

function quoteScalar(value: string): string {
  if (/^[A-Za-z0-9 _.,()/\-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function stringifyOutputSchema(schema: unknown): string {
  if (typeof schema === 'string') return quoteScalar(schema);
  return JSON.stringify(schema);
}
