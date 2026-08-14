import { Host } from '@domain/host/Host';
import { HostRenderer } from '@domain/host/ports';
import { RenderContext } from '@domain/render/RenderContext';
import { RenderResult, Warning } from '@domain/render/RenderResult';
import { SkillSpec } from '@domain/skill/SkillSpec';
import {
  COMPREHENSIVE_MODULE_THRESHOLD,
  ENUMERATION_MIN_ITEMS,
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
 *       calibration: <...>         # ADR-0025 freedom band; omitted when type: deterministic
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
    const schemaTable = skill.spec.type === 'schema-semantic'
      ? renderSchemaTable(skill.spec.outputSchema)
      : '';
    const body = [skill.includesContent, schemaTable, skill.prompt]
      .filter((s) => s.length > 0)
      .join('\n');
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

    const expectsSpine = skill.spec.type !== 'deterministic' &&
      (skill.spec.calibration === 'workflow' || skill.spec.calibration === 'deterministic-dominant');
    if (expectsSpine && !hasDeterministicSpine(skill.prompt)) {
      warnings.push({
        kind: 'missing-spine',
        message:
          `${skill.spec.id.value}: body has no ordered list, table, or checklist. ` +
          `Hybrid-by-default (ADR-0025) wants a spine + a named judgment surface. ` +
          `Add steps/a gate/a table, or set calibration: judgment-dominant/schema-meta if intended.`,
      });
    }

    if (enumerates(skill.prompt) && !OPENNESS_MARKER.test(skill.prompt)) {
      warnings.push({
        kind: 'closed-enumeration',
        message:
          `${skill.spec.id.value}: body enumerates without saying whether the list is closed. ` +
          `Sonnet 5 does not generalize past a written list (ADR-0030). Say "not exhaustive" ` +
          `where the list is a starting point, or "closed by design" where the list is the deliverable.`,
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
      ...renderDescription(spec.description),
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
    // ADR-0025: type: deterministic already conveys the ~100% end, so a
    // calibration band would contradict it. Emit the band for every other
    // type, including the workflow default.
    if (spec.type !== 'deterministic') {
      lines.push(`    calibration: ${spec.calibration}`);
    }
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

/** ADR-0025: a body has a deterministic spine if it has an ordered list, a table, or a checklist. */
function hasDeterministicSpine(body: string): boolean {
  return /^\s*\d+\.\s/m.test(body) || /^\s*\|.*\|/m.test(body) || /- \[ \]/.test(body);
}

/**
 * `\s+` rather than a literal space: Markdown prose wraps, so a marker
 * routinely straddles a line break (`**not\nexhaustive**`). Matching only a
 * literal space silently re-flags a skill that did declare itself.
 */
const OPENNESS_MARKER =
  /not\s+exhaustive|non-exhaustive|extend\s+this\s+list|beyond\s+this\s+list|others\s+may\s+apply|closed\s+by\s+design/i;

function enumerates(body: string): boolean {
  const bullets = (body.match(/^\s*[-*]\s+\S/gm) ?? []).length;
  const ordered = (body.match(/^\s*\d+\.\s+\S/gm) ?? []).length;
  return bullets >= ENUMERATION_MIN_ITEMS || ordered >= ENUMERATION_MIN_ITEMS;
}

/**
 * Emit the `description:` frontmatter field.
 *
 * Single-paragraph descriptions (no blank-line breaks) fold to one line —
 * this matches anthropics-skills convention and produces cleaner output
 * when consumers read frontmatter as JSON. Multi-paragraph descriptions
 * fall back to a block scalar so paragraph breaks survive.
 */
function renderDescription(description: string): readonly string[] {
  const trimmed = description.trim();
  if (!trimmed.includes('\n\n')) {
    const oneLine = trimmed.replace(/\s+/g, ' ');
    return [`description: ${needsYamlQuoting(oneLine) ? JSON.stringify(oneLine) : oneLine}`];
  }
  return ['description: |', ...description.split('\n').map((l) => `  ${l}`)];
}

function needsYamlQuoting(value: string): boolean {
  return /^[\s\-?:,\[\]{}#&*!|>'"%@`]/.test(value) || /:\s|\s#/.test(value);
}

/**
 * Project the inline JSON Schema declared on a schema-semantic skill
 * into a Markdown table the LLM reads inside the body.
 *
 * The skill's frontmatter still carries the full schema for downstream
 * tooling; the table is a redundant but unambiguous representation
 * embedded where the LLM is already reading — it raises the chance
 * the model produces a valid output without separate runtime validation.
 *
 * Falls back to an empty string if the schema is not a JSON-Schema-shaped
 * object — the renderer is not in the business of validating schemas.
 */
function renderSchemaTable(schema: unknown): string {
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) return '';
  const obj = schema as Record<string, unknown>;
  const properties = obj['properties'];
  if (properties === null || typeof properties !== 'object' || Array.isArray(properties)) return '';

  const required = new Set(Array.isArray(obj['required']) ? (obj['required'] as string[]) : []);
  const rows: string[] = [
    '## Output schema',
    '',
    'Emit a single JSON object matching this shape. Frontmatter carries the full schema.',
    '',
    '| Field | Type | Required | Constraints | Description |',
    '|---|---|---|---|---|',
  ];

  for (const [name, valueRaw] of Object.entries(properties as Record<string, unknown>)) {
    if (valueRaw === null || typeof valueRaw !== 'object' || Array.isArray(valueRaw)) continue;
    const value = valueRaw as Record<string, unknown>;
    rows.push(
      `| \`${name}\` | ${schemaTypeLabel(value)} | ${required.has(name) ? 'yes' : 'no'} | ${schemaConstraints(value)} | ${schemaDescription(value)} |`,
    );
  }
  rows.push('');
  return rows.join('\n');
}

function schemaTypeLabel(value: Record<string, unknown>): string {
  const type = value['type'];
  if (type === 'array') {
    const items = value['items'];
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      const itemType = (items as Record<string, unknown>)['type'];
      if (typeof itemType === 'string') return `array<${itemType}>`;
    }
    return 'array';
  }
  return typeof type === 'string' ? type : 'any';
}

function schemaConstraints(value: Record<string, unknown>): string {
  const parts: string[] = [];
  if (Array.isArray(value['enum'])) parts.push(`enum: ${(value['enum'] as unknown[]).map((v) => JSON.stringify(v)).join(', ')}`);
  if (typeof value['minimum'] === 'number') parts.push(`>= ${value['minimum']}`);
  if (typeof value['maximum'] === 'number') parts.push(`<= ${value['maximum']}`);
  if (typeof value['minLength'] === 'number') parts.push(`len >= ${value['minLength']}`);
  if (typeof value['maxLength'] === 'number') parts.push(`len <= ${value['maxLength']}`);
  if (typeof value['pattern'] === 'string') parts.push(`pattern: \`${value['pattern']}\``);
  const items = value['items'];
  if (items && typeof items === 'object' && !Array.isArray(items)) {
    const inner = items as Record<string, unknown>;
    if (typeof inner['pattern'] === 'string') parts.push(`item pattern: \`${inner['pattern']}\``);
  }
  return parts.length === 0 ? '—' : parts.join('; ');
}

function schemaDescription(value: Record<string, unknown>): string {
  const desc = value['description'];
  return typeof desc === 'string' ? desc.replace(/\|/g, '\\|') : '';
}

function stringifyOutputSchema(schema: unknown): string {
  if (typeof schema === 'string') return quoteScalar(schema);
  return JSON.stringify(schema);
}
