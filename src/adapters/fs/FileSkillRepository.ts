import { readdirSync, readFileSync, statSync, lstatSync, existsSync } from 'node:fs';
import { basename, join, relative, resolve, sep, isAbsolute } from 'node:path';
import { LineCounter, parseDocument, YAMLMap, isScalar } from 'yaml';
import { Skill } from '@domain/skill/Skill';
import { SkillId } from '@domain/skill/SkillId';
import {
  SkillSpec,
  CONTEXT_BUDGET_DEFAULT,
  CONTEXT_BUDGET_CEILING,
  DETERMINISTIC_BODY_TOKEN_THRESHOLD,
} from '@domain/skill/SkillSpec';
import {
  SkillType,
  SideEffects,
  Agency,
  isSkillType,
  isSideEffects,
  isAgency,
  inferType,
} from '@domain/skill/SkillType';
import { BundledFile } from '@domain/skill/BundledFile';
import { SkillRepository } from '@domain/skill/ports';
import { Warning } from '@domain/render/RenderResult';
import {
  IncludeNotFoundError,
  SkillSpecError,
  SourceLocation,
  BundledResourceError,
} from '@domain/errors';
import { approximateTokenCount } from '@adapters/claude-code/tokens';

const RESERVED_SUBDIRS = new Set(['_shared']);

/**
 * Reads skills from a directory layout:
 *
 *   <root>/<skill-id>/
 *     SKILL.md            — required v2 source (YAML frontmatter + Markdown body)
 *     scripts/            — optional bundled resources
 *     references/         — optional bundled resources
 *     assets/             — optional bundled resources
 *     <any-other>/        — optional free-form subfolders
 *     LICENSE.txt         — optional
 *
 * The legacy v1 layout (`skill.yaml` + `prompt.md`) is no longer loaded.
 * Encountering one raises `SkillSpecError` directing the user to run
 * `dstack migrate-v2`. The migrator (src/adapters/cli/migrate.ts) remains
 * available for converting third-party catalogs.
 *
 * The repository is the only place YAML parsing happens. Domain code
 * receives already-validated SkillSpec objects plus a Skill aggregate that
 * carries the prompt body and bundled files.
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
    const dirName = basename(skillDir);
    const skillMdPath = join(skillDir, 'SKILL.md');
    const legacyYamlPath = join(skillDir, 'skill.yaml');

    if (existsSync(skillMdPath)) {
      return this.loadV2(skillDir, dirName, skillMdPath);
    }
    if (existsSync(legacyYamlPath)) {
      throw new SkillSpecError(
        dirName,
        'SKILL.md',
        'legacy skill.yaml + prompt.md layout is no longer supported. Run `dstack migrate-v2` to convert.',
        { file: skillMdPath },
      );
    }
    throw new SkillSpecError(dirName, 'SKILL.md', 'file does not exist', {
      file: skillMdPath,
    });
  }

  private loadV2(skillDir: string, dirName: string, skillMdPath: string): Skill {
    const fileText = readFileSync(skillMdPath, 'utf-8');
    const split = splitFrontmatter(fileText);
    if (split === null) {
      throw new SkillSpecError(
        dirName,
        'SKILL.md',
        'file must start with YAML frontmatter delimited by --- fences',
        { file: skillMdPath },
      );
    }
    const { yamlText, body, yamlLineOffset } = split;

    const lineCounter = new LineCounter();
    const doc = parseDocument(yamlText, { lineCounter });

    if (doc.errors.length > 0) {
      const first = doc.errors[0]!;
      const yamlLine = first.pos[0] !== undefined
        ? lineCounter.linePos(first.pos[0]).line
        : undefined;
      throw new SkillSpecError(dirName, 'SKILL.md', first.message, {
        file: skillMdPath,
        ...(yamlLine !== undefined ? { line: yamlLine + yamlLineOffset } : {}),
      });
    }

    const raw = doc.toJSON() as Record<string, unknown> | null;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new SkillSpecError(dirName, 'SKILL.md', 'frontmatter must be a YAML mapping', {
        file: skillMdPath,
      });
    }

    const { spec, warnings } = this.parseSpec({
      raw,
      sourcePath: skillMdPath,
      dirName,
      contents: doc.contents,
      lineCounter,
      lineOffset: yamlLineOffset,
      body,
      skillDir,
    });

    const { content: includesContent, warnings: includeWarnings } = this.resolveIncludes(
      spec.id.value,
      spec.includes,
    );

    const bundled = this.walkBundled(skillDir, spec.id.value);
    return new Skill(spec, body, includesContent, [...warnings, ...includeWarnings], bundled);
  }

  /**
   * Walk every file under skillDir excluding SKILL.md and reserved
   * subfolders. Returns bundled files with their relative path and
   * content. Enforces the path policy from ADR-0017.
   */
  private walkBundled(skillDir: string, skillId: string): readonly BundledFile[] {
    const files: BundledFile[] = [];
    const stack: string[] = [skillDir];
    const seen = new Set<string>();

    while (stack.length > 0) {
      const dir = stack.pop()!;
      const real = resolve(dir);
      if (seen.has(real)) continue;
      seen.add(real);

      for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.')) continue;
        const fullPath = join(dir, entry);
        const lst = lstatSync(fullPath);

        if (lst.isSymbolicLink()) {
          const relPath = toRelativePosix(skillDir, fullPath);
          throw new BundledResourceError(skillId, relPath, 'symbolic links are not allowed');
        }

        if (lst.isDirectory()) {
          if (dir === skillDir && RESERVED_SUBDIRS.has(entry)) continue;
          stack.push(fullPath);
          continue;
        }

        if (!lst.isFile()) continue;
        if (dir === skillDir && entry === 'SKILL.md') continue;

        const relPath = toRelativePosix(skillDir, fullPath);
        if (relPath.includes('..') || isAbsolute(relPath)) {
          throw new BundledResourceError(skillId, relPath, 'path traversal not allowed');
        }
        files.push({
          relativePath: relPath,
          content: readFileSync(fullPath),
          executable: (lst.mode & 0o111) !== 0,
        });
      }
    }

    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return files;
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

  // 130 lines: deliberately a flat, top-to-bottom YAML-to-SkillSpec parse.
  // Each block validates one field with its own typed error and source
  // location. Splitting into per-field helpers would manufacture
  // single-caller methods (code-taxonomy anti-pattern 3) without
  // shortening the visible call chain.
  private parseSpec(args: {
    raw: Record<string, unknown>;
    sourcePath: string;
    dirName: string;
    contents: unknown;
    lineCounter: LineCounter;
    lineOffset: number;
    body: string;
    skillDir: string;
  }): { spec: SkillSpec; warnings: readonly Warning[] } {
    const { raw, sourcePath, dirName, contents, lineCounter, lineOffset, body, skillDir } = args;

    const nameRaw = this.requireString(raw, 'name', sourcePath, dirName, contents, lineCounter, lineOffset);
    const id = SkillId.parse(nameRaw, 'name');
    const errId = nameRaw;

    if (id.value !== dirName) {
      throw new SkillSpecError(
        errId,
        'name',
        `must match parent directory "${dirName}" (got "${id.value}")`,
        this.locateField('name', sourcePath, contents, lineCounter, lineOffset),
      );
    }

    const description = this.requireString(raw, 'description', sourcePath, errId, contents, lineCounter, lineOffset);
    if (description.length > 1024) {
      throw new SkillSpecError(
        errId,
        'description',
        `must be at most 1024 characters (got ${description.length})`,
        this.locateField('description', sourcePath, contents, lineCounter, lineOffset),
      );
    }
    const descriptionWordCount = description.trim().split(/\s+/).filter((s) => s.length > 0).length;

    const license = this.optionalString(raw, 'license', sourcePath, errId, contents, lineCounter, lineOffset);
    const compatibility = this.optionalString(raw, 'compatibility', sourcePath, errId, contents, lineCounter, lineOffset);
    if (compatibility !== undefined && compatibility.length > 500) {
      throw new SkillSpecError(
        errId,
        'compatibility',
        `must be at most 500 characters (got ${compatibility.length})`,
        this.locateField('compatibility', sourcePath, contents, lineCounter, lineOffset),
      );
    }

    const tools = this.parseTools(raw, sourcePath, errId, contents, lineCounter, lineOffset);
    const dstackMeta = this.dstackMetadata(raw);

    const version = this.requireDstackString(dstackMeta, raw, 'version', sourcePath, errId, contents, lineCounter, lineOffset);
    const triggers = this.optionalDstackStringArray(dstackMeta, raw, 'triggers');
    const includes = this.optionalDstackStringArray(dstackMeta, raw, 'includes');

    const budget = this.parseBudget(dstackMeta, raw, sourcePath, errId, contents, lineCounter, lineOffset);

    const declaredTypeRaw = dstackMeta?.['type'] ?? raw['type'];
    let declaredType: SkillType | undefined;
    if (declaredTypeRaw !== undefined) {
      if (!isSkillType(declaredTypeRaw)) {
        throw new SkillSpecError(
          errId,
          'metadata.dstack.type',
          `must be one of: deterministic, semantic, hybrid, schema-semantic (got "${String(declaredTypeRaw)}")`,
          this.locateField('type', sourcePath, contents, lineCounter, lineOffset),
        );
      }
      declaredType = declaredTypeRaw;
    }

    const sideEffectsRaw = dstackMeta?.['side_effects'] ?? raw['side_effects'];
    if (sideEffectsRaw !== undefined && !isSideEffects(sideEffectsRaw)) {
      throw new SkillSpecError(
        errId,
        'metadata.dstack.side_effects',
        `must be one of: readonly, local, external (got "${String(sideEffectsRaw)}")`,
        this.locateField('side_effects', sourcePath, contents, lineCounter, lineOffset),
      );
    }
    const sideEffects: SideEffects = (sideEffectsRaw as SideEffects | undefined) ?? 'readonly';

    const agencyRaw = dstackMeta?.['agency'] ?? raw['agency'];
    if (agencyRaw !== undefined && !isAgency(agencyRaw)) {
      throw new SkillSpecError(
        errId,
        'metadata.dstack.agency',
        `must be one of: reactive, deliberative, autonomous (got "${String(agencyRaw)}")`,
        this.locateField('agency', sourcePath, contents, lineCounter, lineOffset),
      );
    }
    const agency: Agency = (agencyRaw as Agency | undefined) ?? 'reactive';

    const outputSchema = dstackMeta?.['output_schema'] ?? raw['output_schema'];

    const hasScripts = existsSync(join(skillDir, 'scripts'));
    const bodyTokenCount = approximateTokenCount(body);
    const resolvedType: SkillType = declaredType ?? inferType({
      hasOutputSchema: outputSchema !== undefined,
      hasScriptsFolder: hasScripts,
      bodyTokenCount,
    });

    const warnings: Warning[] = [
      ...this.typeStructureWarnings({
        skillId: id.value,
        declaredType,
        resolvedType,
        hasScripts,
        bodyTokenCount,
        hasOutputSchema: outputSchema !== undefined,
      }),
    ];
    if (descriptionWordCount > 200) {
      warnings.push({
        kind: 'long-description',
        message: `${id.value}: description is ${descriptionWordCount} words (>200). Consider trimming for skill-listing readability.`,
      });
    }

    const spec = SkillSpec.fromValidated({
      id,
      version,
      description,
      tools,
      inputs: [],
      outputs: [],
      contextBudgetTokens: budget,
      triggers,
      includes,
      ...(license !== undefined ? { license } : {}),
      ...(compatibility !== undefined ? { compatibility } : {}),
      type: resolvedType,
      ...(declaredType !== undefined ? { declaredType } : {}),
      sideEffects,
      agency,
      ...(outputSchema !== undefined ? { outputSchema } : {}),
    });
    return { spec, warnings };
  }

  private dstackMetadata(raw: Record<string, unknown>): Record<string, unknown> | undefined {
    const meta = raw['metadata'];
    if (meta === null || meta === undefined || typeof meta !== 'object' || Array.isArray(meta)) {
      return undefined;
    }
    const dstack = (meta as Record<string, unknown>)['dstack'];
    if (dstack === null || dstack === undefined || typeof dstack !== 'object' || Array.isArray(dstack)) {
      return undefined;
    }
    return dstack as Record<string, unknown>;
  }

  private parseTools(
    raw: Record<string, unknown>,
    sourcePath: string,
    errId: string,
    contents: unknown,
    lineCounter: LineCounter,
    lineOffset: number,
  ): readonly string[] {
    const candidate = raw['allowed-tools'];
    if (candidate === undefined) {
      throw new SkillSpecError(
        errId,
        'allowed-tools',
        'must be a space-separated string or array of tool names',
        this.locateField('allowed-tools', sourcePath, contents, lineCounter, lineOffset),
      );
    }
    if (typeof candidate === 'string') {
      const parts = candidate.split(/\s+/).filter((s) => s.length > 0);
      if (parts.length === 0) {
        throw new SkillSpecError(
          errId,
          'allowed-tools',
          'must list at least one tool',
          this.locateField('allowed-tools', sourcePath, contents, lineCounter, lineOffset),
        );
      }
      return parts;
    }
    if (Array.isArray(candidate) && candidate.every((v) => typeof v === 'string')) {
      return candidate as readonly string[];
    }
    throw new SkillSpecError(
      errId,
      'allowed-tools',
      'must be a space-separated string or array of tool names',
      this.locateField('allowed-tools', sourcePath, contents, lineCounter, lineOffset),
    );
  }

  private parseBudget(
    dstack: Record<string, unknown> | undefined,
    raw: Record<string, unknown>,
    sourcePath: string,
    errId: string,
    contents: unknown,
    lineCounter: LineCounter,
    lineOffset: number,
  ): number {
    const declared = dstack?.['context_budget_tokens'] ?? raw['context_budget_tokens'];
    const budget = declared ?? CONTEXT_BUDGET_DEFAULT;
    if (typeof budget !== 'number' || budget <= 0 || budget > CONTEXT_BUDGET_CEILING) {
      throw new SkillSpecError(
        errId,
        'context_budget_tokens',
        `must be a number in (0, ${CONTEXT_BUDGET_CEILING}] (got ${String(budget)})`,
        this.locateField('context_budget_tokens', sourcePath, contents, lineCounter, lineOffset),
      );
    }
    return budget;
  }

  private typeStructureWarnings(input: {
    skillId: string;
    declaredType: SkillType | undefined;
    resolvedType: SkillType;
    hasScripts: boolean;
    bodyTokenCount: number;
    hasOutputSchema: boolean;
  }): readonly Warning[] {
    const warnings: Warning[] = [];
    const { declaredType, hasScripts, bodyTokenCount } = input;
    if (declaredType === 'hybrid' && !hasScripts) {
      warnings.push({
        kind: 'type-structure-mismatch',
        message: `${input.skillId}: type=hybrid but no scripts/ folder. Add scripts/ or change type to semantic.`,
      });
    } else if (declaredType === 'semantic' && hasScripts) {
      warnings.push({
        kind: 'type-structure-mismatch',
        message: `${input.skillId}: type=semantic but scripts/ folder exists. Consider type=hybrid.`,
      });
    } else if (declaredType === 'deterministic' && bodyTokenCount >= DETERMINISTIC_BODY_TOKEN_THRESHOLD * 2) {
      warnings.push({
        kind: 'type-structure-mismatch',
        message: `${input.skillId}: type=deterministic but body is ${bodyTokenCount} tokens (>= 1000). Consider type=hybrid.`,
      });
    }
    return warnings;
  }

  private requireDstackString(
    dstack: Record<string, unknown> | undefined,
    raw: Record<string, unknown>,
    field: string,
    sourcePath: string,
    skillId: string,
    contents: unknown,
    lineCounter: LineCounter,
    lineOffset: number,
  ): string {
    const value = dstack?.[field] ?? raw[field];
    if (typeof value !== 'string' || value.length === 0) {
      throw new SkillSpecError(
        skillId,
        `metadata.dstack.${field}`,
        'must be a non-empty string',
        this.locateField(field, sourcePath, contents, lineCounter, lineOffset),
      );
    }
    return value;
  }

  private optionalDstackStringArray(
    dstack: Record<string, unknown> | undefined,
    raw: Record<string, unknown>,
    field: string,
  ): readonly string[] {
    const value = dstack?.[field] ?? raw[field];
    if (value === undefined) return [];
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      return value as readonly string[];
    }
    return [];
  }

  private optionalString(
    raw: Record<string, unknown>,
    field: string,
    sourcePath: string,
    skillId: string,
    contents: unknown,
    lineCounter: LineCounter,
    lineOffset: number,
  ): string | undefined {
    const value = raw[field];
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.length === 0) {
      throw new SkillSpecError(
        skillId,
        field,
        'must be a non-empty string when present',
        this.locateField(field, sourcePath, contents, lineCounter, lineOffset),
      );
    }
    return value;
  }

  private requireString(
    raw: Record<string, unknown>,
    field: string,
    sourcePath: string,
    skillId: string,
    contents: unknown,
    lineCounter: LineCounter,
    lineOffset: number,
  ): string {
    const value = raw[field];
    if (typeof value !== 'string' || value.length === 0) {
      throw new SkillSpecError(
        skillId,
        field,
        'must be a non-empty string',
        this.locateField(field, sourcePath, contents, lineCounter, lineOffset),
      );
    }
    return value;
  }

  private locateField(
    field: string,
    file: string,
    contents: unknown,
    lineCounter: LineCounter,
    lineOffset: number,
  ): SourceLocation {
    if (!(contents instanceof YAMLMap)) return { file };
    for (const item of contents.items) {
      if (isScalar(item.key) && item.key.value === field) {
        const range = item.key.range;
        if (range && range[0] !== undefined) {
          return { file, line: lineCounter.linePos(range[0]).line + lineOffset };
        }
      }
    }
    return { file };
  }
}

/**
 * Split a SKILL.md file into its YAML frontmatter and Markdown body.
 *
 * Returns null when the file does not start with a `---` fence — the caller
 * decides whether to error or fall back to a legacy layout.
 *
 * `yamlLineOffset` is the file line at which `yamlText` begins, so YAML
 * parser line numbers can be mapped back to file line numbers.
 */
function splitFrontmatter(text: string): {
  yamlText: string;
  body: string;
  yamlLineOffset: number;
} | null {
  if (!text.startsWith('---')) return null;
  const afterFence = text.indexOf('\n', 3);
  if (afterFence === -1) return null;
  const closingFence = text.indexOf('\n---', afterFence);
  if (closingFence === -1) return null;

  const yamlText = text.slice(afterFence + 1, closingFence);
  const bodyStart = text.indexOf('\n', closingFence + 1);
  const body = bodyStart === -1 ? '' : text.slice(bodyStart + 1);
  return { yamlText, body, yamlLineOffset: 1 };
}

function toRelativePosix(base: string, full: string): string {
  return relative(base, full).split(sep).join('/');
}
