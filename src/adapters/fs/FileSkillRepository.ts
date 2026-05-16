import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { LineCounter, parseDocument, YAMLMap, isScalar } from 'yaml';
import { Skill } from '@domain/skill/Skill';
import { SkillId } from '@domain/skill/SkillId';
import {
  SkillSpec,
  CONTEXT_BUDGET_DEFAULT,
  CONTEXT_BUDGET_CEILING,
} from '@domain/skill/SkillSpec';
import { SkillRepository } from '@domain/skill/ports';
import { Warning } from '@domain/render/RenderResult';
import { IncludeNotFoundError, SkillSpecError, SourceLocation } from '@domain/errors';

/**
 * Reads skills from a directory layout: `<root>/<skill-id>/{skill.yaml,prompt.md}`.
 *
 * The repository is the only place yaml parsing happens. The domain receives
 * already-validated SkillSpec objects.
 */
export class FileSkillRepository implements SkillRepository {
  constructor(private readonly root: string) {}

  async loadAll(): Promise<readonly Skill[]> {
    if (!existsSync(this.root)) return [];

    const entries = readdirSync(this.root);
    const skills: Skill[] = [];

    for (const entry of entries) {
      if (entry.startsWith('_') || entry.startsWith('.')) continue;
      const skillDir = join(this.root, entry);
      if (!statSync(skillDir).isDirectory()) continue;

      const skill = this.loadOne(skillDir);
      skills.push(skill);
    }

    return skills;
  }

  async loadById(id: SkillId): Promise<Skill | null> {
    const dir = join(this.root, id.value);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
    return this.loadOne(dir);
  }

  /**
   * Return directory names that look like skill folders, sorted. Used by
   * commands (e.g. `dstack validate`) that want to enumerate skills
   * without loading them, so a single broken skill does not abort the
   * scan. Skips entries starting with `_` (shared dirs) or `.` (hidden).
   */
  listIds(): readonly string[] {
    if (!existsSync(this.root)) return [];
    const ids: string[] = [];
    for (const entry of readdirSync(this.root)) {
      if (entry.startsWith('_') || entry.startsWith('.')) continue;
      const dir = join(this.root, entry);
      if (!statSync(dir).isDirectory()) continue;
      ids.push(entry);
    }
    return ids.sort();
  }

  private loadOne(skillDir: string): Skill {
    const dirName = basename(skillDir); // best-guess skill id before we parse
    const yamlPath = join(skillDir, 'skill.yaml');
    const promptPath = join(skillDir, 'prompt.md');

    if (!existsSync(yamlPath)) {
      throw new SkillSpecError(dirName, 'skill.yaml', 'file does not exist', {
        file: yamlPath,
      });
    }
    if (!existsSync(promptPath)) {
      throw new SkillSpecError(dirName, 'prompt.md', 'file does not exist', {
        file: promptPath,
      });
    }

    const yamlText = readFileSync(yamlPath, 'utf-8');
    const lineCounter = new LineCounter();
    const doc = parseDocument(yamlText, { lineCounter });

    if (doc.errors.length > 0) {
      const first = doc.errors[0]!;
      const line = first.pos[0] !== undefined
        ? lineCounter.linePos(first.pos[0]).line
        : undefined;
      throw new SkillSpecError(dirName, 'skill.yaml', first.message, {
        file: yamlPath,
        ...(line !== undefined ? { line } : {}),
      });
    }

    const raw = doc.toJSON() as Record<string, unknown> | null;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new SkillSpecError(dirName, 'skill.yaml', 'must be a YAML mapping', {
        file: yamlPath,
      });
    }

    const spec = this.parseSpec(raw, yamlPath, dirName, doc.contents, lineCounter);
    const prompt = readFileSync(promptPath, 'utf-8');
    const { content: includesContent, warnings: includeWarnings } = this.resolveIncludes(
      spec.id.value,
      spec.includes,
    );

    return new Skill(spec, prompt, includesContent, includeWarnings);
  }

  /** Read each `includes:` path relative to `<root>/`, joined by newline. Repeats warn and are kept once. */
  private resolveIncludes(
    skillId: string,
    paths: readonly string[],
  ): { content: string; warnings: Warning[] } {
    if (paths.length === 0) return { content: '', warnings: [] };

    const warnings: Warning[] = [];
    const buffer: string[] = [];
    const seen = new Set<string>();

    for (const includePath of paths) {
      const absolutePath = resolve(this.root, includePath);
      if (seen.has(absolutePath)) {
        warnings.push({
          kind: 'include-cycle-broken',
          message: `${includePath}: already included in this chain`,
        });
        continue;
      }
      if (!existsSync(absolutePath)) {
        throw new IncludeNotFoundError(skillId, includePath);
      }
      seen.add(absolutePath);
      buffer.push(readFileSync(absolutePath, 'utf-8'));
    }

    return { content: buffer.join('\n'), warnings };
  }

  private parseSpec(
    raw: Record<string, unknown>,
    yamlPath: string,
    dirName: string,
    contents: unknown,
    lineCounter: LineCounter,
  ): SkillSpec {
    // Resolve the skill id first so subsequent error messages can use the
    // canonical id rather than the directory name. The YAML key is `name`
    // per the official Agent Skills schema (ADR-0012); internally the value
    // becomes `SkillSpec.id` because the term "skill id" predates the rename.
    const nameRaw = this.requireString(raw, 'name', yamlPath, dirName, contents, lineCounter);
    const id = SkillId.parse(nameRaw, 'name');
    const errId = nameRaw; // canonical for error messages from here down

    const version = this.requireString(raw, 'version', yamlPath, errId, contents, lineCounter);
    const description = this.requireString(raw, 'description', yamlPath, errId, contents, lineCounter);
    const tools = this.requireStringArray(raw, 'tools', yamlPath, errId, contents, lineCounter);
    const budget = (raw['context_budget_tokens'] as number) ?? CONTEXT_BUDGET_DEFAULT;

    if (typeof budget !== 'number' || budget <= 0 || budget > CONTEXT_BUDGET_CEILING) {
      throw new SkillSpecError(
        errId,
        'context_budget_tokens',
        `must be a number in (0, ${CONTEXT_BUDGET_CEILING}] (got ${budget})`,
        this.locateField('context_budget_tokens', yamlPath, contents, lineCounter),
      );
    }

    const license = this.optionalString(raw, 'license', yamlPath, errId, contents, lineCounter);
    const compatibility = this.optionalString(raw, 'compatibility', yamlPath, errId, contents, lineCounter);

    return SkillSpec.fromValidated({
      id,
      version,
      description,
      tools,
      inputs: [], // YAGNI: parse when first skill uses them
      outputs: [], // YAGNI: parse when first skill uses them
      contextBudgetTokens: budget,
      triggers: (raw['triggers'] as string[]) ?? [],
      includes: (raw['includes'] as string[]) ?? [],
      ...(license !== undefined ? { license } : {}),
      ...(compatibility !== undefined ? { compatibility } : {}),
    });
  }

  private optionalString(
    raw: Record<string, unknown>,
    field: string,
    yamlPath: string,
    skillId: string,
    contents: unknown,
    lineCounter: LineCounter,
  ): string | undefined {
    const value = raw[field];
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.length === 0) {
      throw new SkillSpecError(
        skillId,
        field,
        'must be a non-empty string when present',
        this.locateField(field, yamlPath, contents, lineCounter),
      );
    }
    return value;
  }

  private requireString(
    raw: Record<string, unknown>,
    field: string,
    yamlPath: string,
    skillId: string,
    contents: unknown,
    lineCounter: LineCounter,
  ): string {
    const value = raw[field];
    if (typeof value !== 'string' || value.length === 0) {
      throw new SkillSpecError(
        skillId,
        field,
        'must be a non-empty string',
        this.locateField(field, yamlPath, contents, lineCounter),
      );
    }
    return value;
  }

  private requireStringArray(
    raw: Record<string, unknown>,
    field: string,
    yamlPath: string,
    skillId: string,
    contents: unknown,
    lineCounter: LineCounter,
  ): readonly string[] {
    const value = raw[field];
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new SkillSpecError(
        skillId,
        field,
        'must be an array of strings',
        this.locateField(field, yamlPath, contents, lineCounter),
      );
    }
    return value as readonly string[];
  }

  /**
   * Find the 1-indexed line where `field` is declared in the YAML document.
   * Returns `{ file, line }` when found, `{ file }` when the field doesn't
   * exist or the document shape is unexpected.
   */
  private locateField(
    field: string,
    file: string,
    contents: unknown,
    lineCounter: LineCounter,
  ): SourceLocation {
    if (!(contents instanceof YAMLMap)) return { file };
    for (const item of contents.items) {
      if (isScalar(item.key) && item.key.value === field) {
        const range = item.key.range;
        if (range && range[0] !== undefined) {
          return { file, line: lineCounter.linePos(range[0]).line };
        }
      }
    }
    return { file };
  }
}
