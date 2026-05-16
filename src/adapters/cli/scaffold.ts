import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SkillId } from '@domain/skill/SkillId';

/** Scaffold `<root>/<skill-id>/{skill.yaml, prompt.md}`. Refuses to overwrite. */
export interface ScaffoldResult {
  readonly skillId: string;
  readonly skillDir: string;
  readonly filesWritten: readonly string[];
}

export class ScaffoldError extends Error {
  override readonly name = 'ScaffoldError';
}

export function scaffoldSkill(skillsRoot: string, idRaw: string): ScaffoldResult {
  const id = SkillId.parse(idRaw, 'skill-id'); // throws SkillSpecError if invalid
  const skillDir = join(skillsRoot, id.value);

  if (existsSync(skillDir)) {
    throw new ScaffoldError(
      `skill directory already exists: ${skillDir}. ` +
        `Choose a different id or delete the existing directory first.`,
    );
  }

  mkdirSync(skillDir, { recursive: true });

  const yamlPath = join(skillDir, 'skill.yaml');
  const promptPath = join(skillDir, 'prompt.md');

  writeFileSync(yamlPath, skillYamlTemplate(id.value), 'utf-8');
  writeFileSync(promptPath, promptMdTemplate(id.value), 'utf-8');

  return {
    skillId: id.value,
    skillDir,
    filesWritten: [yamlPath, promptPath],
  };
}

function skillYamlTemplate(skillId: string): string {
  return `name: ${skillId}
version: 0.1.0
description: |
  TODO: one or two sentences describing what this skill does and when to use
  it. The description appears in Claude Code's slash-command list, so write
  the trigger phrasing the user is most likely to think.

tools:
  - Read
  - Bash

context_budget_tokens: 4000

triggers: []
`;
}

function promptMdTemplate(skillId: string): string {
  return `# /${skillId}

TODO: write the instruction body. This is the text Claude reads when the
user runs \`/${skillId}\`.

## When to use this skill

TODO: list two or three scenarios where this skill is the right choice.

## What this skill does

TODO: describe the procedure step by step. Prefer short numbered lists
over paragraphs. The LLM follows what is written here literally.

## Output

TODO: describe what the user sees when the skill finishes.
`;
}
