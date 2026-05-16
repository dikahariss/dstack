import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { Installer, InstallReport } from '@domain/host/ports';
import { RenderResult } from '@domain/render/RenderResult';
import { assertAllowed } from './paths';

/**
 * Writes RenderResult content to disk under outputRoot.
 *
 * - Path policy enforced via `assertAllowed`.
 * - Per-file atomic via tmp + rename.
 * - "skipped" = file already exists with identical content; we leave it.
 * - "removed" = files under outputRoot that do not correspond to any
 *   result. Cleaned up after writes succeed so a transient build doesn't
 *   delete state.
 */
export class FsInstaller implements Installer {
  async install(outputRoot: string, results: readonly RenderResult[]): Promise<InstallReport> {
    const root = assertAllowed(outputRoot);
    mkdirSync(root, { recursive: true });

    let written = 0;
    let skipped = 0;

    const expectedDirs = new Set<string>();
    for (const r of results) {
      const fullPath = assertAllowed(join(root, r.path));
      const dir = dirname(fullPath);
      mkdirSync(dir, { recursive: true });
      expectedDirs.add(dir.substring(root.length + 1).split('/')[0] ?? '');

      if (existsSync(fullPath)) {
        const existing = readFileSync(fullPath, 'utf-8');
        if (existing === r.content) {
          skipped++;
          continue;
        }
      }

      const tmpPath = `${fullPath}.tmp.${process.pid}`;
      writeFileSync(tmpPath, r.content, 'utf-8');
      renameSync(tmpPath, fullPath);
      written++;
    }

    const removed = this.removeOrphans(root, expectedDirs);
    return { outputRoot: root, written, skipped, removed };
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
