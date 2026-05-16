/**
 * Apply the `SkillRepository` contract to `FileSkillRepository`.
 *
 * If we add a second adapter (e.g. HttpSkillRepository), it gets a parallel
 * file that calls the same `runSkillRepositoryContract` with its own
 * factory. The shared suite catches drift.
 */
import { resolve } from 'node:path';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { runSkillRepositoryContract } from './SkillRepository.contract';

const FIXTURES = resolve(import.meta.dir, '../fixtures/skills');

runSkillRepositoryContract('FileSkillRepository', {
  good: async () => new FileSkillRepository(resolve(FIXTURES, 'good')),
  missingPrompt: async () => new FileSkillRepository(resolve(FIXTURES, 'missing-prompt')),
  empty: async () => new FileSkillRepository(resolve(FIXTURES, 'does-not-exist')),
});
