/**
 * Contract suite for the `SkillRepository` port.
 *
 * Every concrete adapter that implements `SkillRepository` must call this
 * function with a factory that produces a repository pointed at a known
 * fixture set. The suite encodes invariants the port promises to callers.
 *
 * This is the file that makes hexagonal architecture pay off — drift
 * between adapters (e.g. a future HttpSkillRepository) is caught here.
 */
import { describe, test, expect } from 'bun:test';
import type { SkillRepository } from '../../src/domain/skill/ports';
import { SkillId } from '../../src/domain/skill/SkillId';
import { SkillSpecError } from '../../src/domain/errors';

export interface ContractFixtures {
  /** Repo pointed at a valid two-skill set: ids "alpha" and "beta". */
  good: () => Promise<SkillRepository>;
  /** Repo pointed at a one-skill set where prompt.md is missing. */
  missingPrompt: () => Promise<SkillRepository>;
  /** Repo pointed at an empty root. */
  empty: () => Promise<SkillRepository>;
}

export function runSkillRepositoryContract(name: string, fixtures: ContractFixtures): void {
  describe(`SkillRepository contract: ${name}`, () => {
    test('loadAll returns empty array for empty root', async () => {
      const repo = await fixtures.empty();
      const all = await repo.loadAll();
      expect(all).toEqual([]);
    });

    test('loadAll returns every skill in the root', async () => {
      const repo = await fixtures.good();
      const all = await repo.loadAll();
      const ids = all.map((s) => s.spec.id.value).sort();
      expect(ids).toEqual(['alpha', 'beta']);
    });

    test('loadAll skills carry their prompt body', async () => {
      const repo = await fixtures.good();
      const all = await repo.loadAll();
      for (const s of all) {
        expect(s.prompt.length).toBeGreaterThan(0);
      }
    });

    test('loadById returns the matching skill', async () => {
      const repo = await fixtures.good();
      const found = await repo.loadById(SkillId.parse('alpha'));
      expect(found).not.toBeNull();
      expect(found?.spec.id.value).toBe('alpha');
    });

    test('loadById returns null for unknown id', async () => {
      const repo = await fixtures.good();
      const found = await repo.loadById(SkillId.parse('does-not-exist'));
      expect(found).toBeNull();
    });

    test('loadAll throws SkillSpecError when prompt.md missing', async () => {
      const repo = await fixtures.missingPrompt();
      await expect(repo.loadAll()).rejects.toBeInstanceOf(SkillSpecError);
    });
  });
}
