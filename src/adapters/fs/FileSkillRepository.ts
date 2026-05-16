import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Skill } from '../../domain/skill/Skill';
import { SkillId } from '../../domain/skill/SkillId';
import {
  SkillSpec,
  CONTEXT_BUDGET_DEFAULT,
  CONTEXT_BUDGET_CEILING,
} from '../../domain/skill/SkillSpec';
import { SkillRepository } from '../../domain/skill/ports';
import { SkillSpecError } from '../../domain/errors';

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
    const yamlPath = join(skillDir, 'skill.yaml');
    const promptPath = join(skillDir, 'prompt.md');

    if (!existsSync(yamlPath)) {
      throw new SkillSpecError(skillDir, 'skill.yaml', 'file does not exist');
    }
    if (!existsSync(promptPath)) {
      throw new SkillSpecError(skillDir, 'prompt.md', 'file does not exist');
    }

    const raw = parseYaml(readFileSync(yamlPath, 'utf-8')) as Record<string, unknown>;
    const spec = this.parseSpec(raw, skillDir);
    const prompt = readFileSync(promptPath, 'utf-8');

    return new Skill(spec, prompt);
  }

  private parseSpec(raw: Record<string, unknown>, source: string): SkillSpec {
    const idRaw = this.requireString(raw, 'id', source);
    const id = SkillId.parse(idRaw, 'id');
    const version = this.requireString(raw, 'version', source);
    const description = this.requireString(raw, 'description', source);
    const tools = this.requireStringArray(raw, 'tools', source);
    const budget = (raw['context_budget_tokens'] as number) ?? CONTEXT_BUDGET_DEFAULT;

    if (typeof budget !== 'number' || budget <= 0 || budget > CONTEXT_BUDGET_CEILING) {
      throw new SkillSpecError(
        idRaw,
        'context_budget_tokens',
        `must be a number in (0, ${CONTEXT_BUDGET_CEILING}] (got ${budget})`,
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

  private requireString(raw: Record<string, unknown>, field: string, source: string): string {
    const value = raw[field];
    if (typeof value !== 'string' || value.length === 0) {
      throw new SkillSpecError(source, field, 'must be a non-empty string');
    }
    return value;
  }

  private requireStringArray(
    raw: Record<string, unknown>,
    field: string,
    source: string,
  ): readonly string[] {
    const value = raw[field];
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new SkillSpecError(source, field, 'must be an array of strings');
    }
    return value as readonly string[];
  }
}
