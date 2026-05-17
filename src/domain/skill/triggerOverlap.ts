import { Skill } from './Skill';
import { Warning } from '@domain/render/RenderResult';

/**
 * For each trigger phrase declared by two or more skills, emit one
 * `overlapping-trigger` warning per affected skill listing the
 * conflicting peers. Comparison is case- and whitespace-insensitive.
 *
 * Pure function over already-loaded skills; both BuildCatalog and
 * ValidateCatalog rely on it so the two surfaces stay in sync.
 */
export function collectOverlappingTriggers(skills: readonly Skill[]): Map<string, readonly Warning[]> {
  const phraseToSkills = new Map<string, string[]>();
  for (const skill of skills) {
    for (const phrase of skill.spec.triggers) {
      const key = phrase.toLowerCase().trim();
      if (key.length === 0) continue;
      const list = phraseToSkills.get(key) ?? [];
      if (!list.includes(skill.spec.id.value)) list.push(skill.spec.id.value);
      phraseToSkills.set(key, list);
    }
  }

  const warnings = new Map<string, Warning[]>();
  for (const [phrase, ids] of phraseToSkills) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      const peers = ids.filter((x) => x !== id).join(', ');
      const list = warnings.get(id) ?? [];
      list.push({
        kind: 'overlapping-trigger',
        message: `trigger "${phrase}" also declared by: ${peers}`,
      });
      warnings.set(id, list);
    }
  }
  return warnings;
}
