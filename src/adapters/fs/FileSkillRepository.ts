import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { LineCounter, parseDocument, YAMLMap, isScalar } from 'yaml';
import { Skill } from '../../domain/skill/Skill';
import { SkillId } from '../../domain/skill/SkillId';
import {
  SkillSpec,
  CONTEXT_BUDGET_DEFAULT,
  CONTEXT_BUDGET_CEILING,
} from '../../domain/skill/SkillSpec';
import { SkillRepository } from '../../domain/skill/ports';
import { SkillSpecError, SourceLocation } from '../../domain/errors';

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

    return new Skill(spec, prompt);
  }

  private parseSpec(
    raw: Record<string, unknown>,
    yamlPath: string,
    dirName: string,
    contents: unknown,
    lineCounter: LineCounter,
  ): SkillSpec {
    // Resolve the skill id first so subsequent error messages can use the
    // canonical id rather than the directory name.
    const idRaw = this.requireString(raw, 'id', yamlPath, dirName, contents, lineCounter);
    const id = SkillId.parse(idRaw, 'id');
    const errId = idRaw; // canonical for error messages from here down

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
    });
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
