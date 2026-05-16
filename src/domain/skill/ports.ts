import { Skill } from './Skill';
import { SkillId } from './SkillId';

/**
 * SkillRepository is the port for loading skills from somewhere.
 *
 * "Somewhere" is the filesystem today. Tomorrow it could be a remote
 * manifest, a database, an MCP server. The port stays the same.
 */
export interface SkillRepository {
  /**
   * Load all skills available to this repository.
   *
   * Implementations should fail fast on invalid skills rather than
   * filtering them out — a malformed spec is a bug, not a missing skill.
   */
  loadAll(): Promise<readonly Skill[]>;

  /**
   * Load one skill by id. Returns null if not found (not an error).
   */
  loadById(id: SkillId): Promise<Skill | null>;
}
