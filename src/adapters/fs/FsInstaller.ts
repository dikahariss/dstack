import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  readdirSync,
  rmSync,
  statSync,
  chmodSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { Installer, InstallReport, RenderedSkill } from '@domain/host/ports';
import { assertAllowed } from './paths';

/**
 * Writes RenderedSkill content to disk under outputRoot.
 *
 * For each item:
 *   - `rendered.path` (e.g. `alpha/SKILL.md`) is written atomically.
 *   - Each `bundled` file is copied verbatim under `<skill-id>/<relativePath>`,
 *     preserving the executable bit.
 *
 * Counters:
 *   - "written" counts every newly-written or modified file (SKILL.md plus bundled).
 *   - "skipped" counts files whose on-disk content already matches.
 *   - "removed" counts top-level skill directories that no longer correspond
 *     to any item; cleaned up after writes succeed so a transient build does
 *     not delete state.
 *
 * Path policy enforced via `assertAllowed`. Bundled relative paths were
 * already screened by the repository's path policy (ADR-0017).
 */
export class FsInstaller implements Installer {
  async install(outputRoot: string, items: readonly RenderedSkill[]): Promise<InstallReport> {
    const root = assertAllowed(outputRoot);
    mkdirSync(root, { recursive: true });

    let written = 0;
    let skipped = 0;

    const expectedDirs = new Set<string>();
    for (const item of items) {
      const renderPath = assertAllowed(join(root, item.rendered.path));
      mkdirSync(dirname(renderPath), { recursive: true });
      expectedDirs.add(this.topDir(renderPath, root));

      const renderOutcome = this.writeText(renderPath, item.rendered.content);
      if (renderOutcome === 'written') written++;
      else skipped++;

      const skillRoot = dirname(renderPath);
      for (const bundled of item.bundled) {
        const bundledPath = assertAllowed(join(skillRoot, bundled.relativePath));
        mkdirSync(dirname(bundledPath), { recursive: true });
        const outcome = this.writeBinary(bundledPath, bundled.content);
        if (outcome === 'written') written++;
        else skipped++;
        if (bundled.executable) chmodSync(bundledPath, 0o755);
      }
    }

    const removed = this.removeOrphans(root, expectedDirs);
    return { outputRoot: root, written, skipped, removed };
  }

  private writeText(fullPath: string, content: string): 'written' | 'skipped' {
    if (existsSync(fullPath)) {
      const existing = readFileSync(fullPath, 'utf-8');
      if (existing === content) return 'skipped';
    }
    const tmpPath = `${fullPath}.tmp.${process.pid}`;
    writeFileSync(tmpPath, content, 'utf-8');
    renameSync(tmpPath, fullPath);
    return 'written';
  }

  private writeBinary(fullPath: string, content: Buffer): 'written' | 'skipped' {
    if (existsSync(fullPath)) {
      const existing = readFileSync(fullPath);
      if (existing.equals(content)) return 'skipped';
    }
    const tmpPath = `${fullPath}.tmp.${process.pid}`;
    writeFileSync(tmpPath, content);
    renameSync(tmpPath, fullPath);
    return 'written';
  }

  private topDir(fullPath: string, root: string): string {
    const rest = fullPath.substring(root.length + 1);
    const slash = rest.indexOf('/');
    return slash === -1 ? rest : rest.slice(0, slash);
  }

  private removeOrphans(root: string, expectedDirs: Set<string>): number {
    if (!existsSync(root)) return 0;
    const entries = readdirSync(root);
    let removed = 0;
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const dir = join(root, entry);
      if (!statSync(dir).isDirectory()) continue;
      if (!expectedDirs.has(entry)) {
        rmSync(dir, { recursive: true, force: true });
        removed++;
      }
    }
    return removed;
  }
}
