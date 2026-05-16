/**
 * Contract suite for the `Installer` port.
 *
 * Adapters implementing `Installer` call this with a factory. The suite
 * encodes the idempotency, orphan-removal, and path-policy invariants.
 *
 * Temp output roots live under `~/.dstack/skills/` because that path is
 * inside the policy allow-list (see `src/adapters/fs/paths.ts`). Each
 * test creates a fresh mkdtemp subdir and cleans up afterward.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Installer } from '@domain/host/ports';
import { RenderResult } from '@domain/render/RenderResult';

const ALLOWED_PARENT = join(homedir(), '.dstack/skills');

function result(path: string, content: string): RenderResult {
  return { path, content, tokenCount: Math.ceil(content.length / 4), warnings: [] };
}

export function runInstallerContract(name: string, factory: () => Installer): void {
  describe(`Installer contract: ${name}`, () => {
    let outputRoot: string;

    beforeEach(() => {
      mkdirSync(ALLOWED_PARENT, { recursive: true });
      outputRoot = mkdtempSync(join(ALLOWED_PARENT, '__contract-test-'));
    });

    afterEach(() => {
      rmSync(outputRoot, { recursive: true, force: true });
    });

    test('writes a fresh skill and reports written count', async () => {
      const installer = factory();
      const report = await installer.install(outputRoot, [result('alpha/SKILL.md', 'alpha body')]);
      expect(report.written).toBe(1);
      expect(report.skipped).toBe(0);
      expect(report.removed).toBe(0);
      expect(readFileSync(join(outputRoot, 'alpha/SKILL.md'), 'utf-8')).toBe('alpha body');
    });

    test('second install of unchanged content reports skipped, not written', async () => {
      const installer = factory();
      const results = [result('alpha/SKILL.md', 'alpha body')];
      await installer.install(outputRoot, results);
      const second = await installer.install(outputRoot, results);
      expect(second.written).toBe(0);
      expect(second.skipped).toBe(1);
    });

    test('rewrites the file when content changes', async () => {
      const installer = factory();
      await installer.install(outputRoot, [result('alpha/SKILL.md', 'v1')]);
      const report = await installer.install(outputRoot, [result('alpha/SKILL.md', 'v2')]);
      expect(report.written).toBe(1);
      expect(report.skipped).toBe(0);
      expect(readFileSync(join(outputRoot, 'alpha/SKILL.md'), 'utf-8')).toBe('v2');
    });

    test('removes orphan skills no longer present in the result set', async () => {
      const installer = factory();
      await installer.install(outputRoot, [
        result('alpha/SKILL.md', 'a'),
        result('beta/SKILL.md', 'b'),
      ]);
      const report = await installer.install(outputRoot, [result('alpha/SKILL.md', 'a')]);
      expect(report.removed).toBe(1);
      expect(existsSync(join(outputRoot, 'beta'))).toBe(false);
      expect(existsSync(join(outputRoot, 'alpha/SKILL.md'))).toBe(true);
    });

    test('rejects writes whose output root is outside the allow-list', async () => {
      const installer = factory();
      await expect(
        installer.install('/tmp/dstack-disallowed-root', [result('alpha/SKILL.md', 'x')]),
      ).rejects.toThrow();
    });
  });
}
