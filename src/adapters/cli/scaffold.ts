import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SkillId } from '@domain/skill/SkillId';
import { SkillType } from '@domain/skill/SkillType';

/** Scaffold `<root>/<skill-id>/SKILL.md`. Refuses to overwrite. */
export interface ScaffoldResult {
  readonly skillId: string;
  readonly skillDir: string;
  readonly filesWritten: readonly string[];
}

export class ScaffoldError extends Error {
  override readonly name = 'ScaffoldError';
}

export function scaffoldSkill(
  skillsRoot: string,
  idRaw: string,
  type: SkillType = 'semantic',
): ScaffoldResult {
  const id = SkillId.parse(idRaw, 'skill-id');
  const skillDir = join(skillsRoot, id.value);

  if (existsSync(skillDir)) {
    throw new ScaffoldError(
      `skill directory already exists: ${skillDir}. ` +
        `Choose a different id or delete the existing directory first.`,
    );
  }

  mkdirSync(skillDir, { recursive: true });
  const filesWritten: string[] = [];

  const skillMdPath = join(skillDir, 'SKILL.md');
  writeFileSync(skillMdPath, skillMdTemplate(id.value, type), 'utf-8');
  filesWritten.push(skillMdPath);

  if (type === 'hybrid' || type === 'deterministic') {
    const scriptsDir = join(skillDir, 'scripts');
    mkdirSync(scriptsDir);
    const placeholder = join(scriptsDir, 'README.md');
    writeFileSync(
      placeholder,
      `# scripts/\n\nDrop executable helpers here. Reference them from SKILL.md.\n`,
      'utf-8',
    );
    filesWritten.push(placeholder);
  }

  return { skillId: id.value, skillDir, filesWritten };
}

function skillMdTemplate(skillId: string, type: SkillType): string {
  const typeBlock = type === 'semantic' ? '' : `    type: ${type}\n`;
  const hint = typeHint(type);
  return `---
name: ${skillId}
description: TODO one or two sentences describing what this skill does and when to use it.
allowed-tools: Read Bash
metadata:
  dstack:
    version: 0.1.0
    context_budget_tokens: 4000
${typeBlock}    triggers: []
---
# /${skillId}

TODO: write the instruction body. This is the text Claude reads when the
user runs \`/${skillId}\`.

${hint}

## When to use this skill

TODO: list two or three scenarios where this skill is the right choice.

## What this skill does

TODO: describe the procedure step by step. Prefer short numbered lists
over paragraphs. The LLM follows what is written here literally.

## Output

TODO: describe what the user sees when the skill finishes.
`;
}

function typeHint(type: SkillType): string {
  switch (type) {
    case 'deterministic':
      return '> **Type: deterministic.** The body should be brief; real work happens in `scripts/`.';
    case 'hybrid':
      return '> **Type: hybrid.** Combine narrative reasoning here with concrete helpers in `scripts/`.';
    case 'schema-semantic':
      return '> **Type: schema-semantic.** Add `output_schema` under `metadata.dstack` to constrain the output shape.';
    case 'semantic':
      return '> **Type: semantic.** Pure instructions — no scripts or schemas required.';
  }
}
