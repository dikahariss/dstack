import { resolve, sep } from 'node:path';
import { homedir } from 'node:os';

/**
 * Path policy: explicit allowlist of writable roots.
 *
 * The domain has no path knowledge. This module is the gate. A bug in any
 * adapter that tried to write `/etc/passwd` or `~/.ssh/config` is caught
 * here, not in production.
 */
export class PathPolicyError extends Error {
  override readonly name = 'PathPolicyError';
  constructor(readonly attempted: string, readonly allowed: readonly string[]) {
    super(
      `path "${attempted}" is not under any allowed root: ${allowed.join(', ')}`,
    );
  }
}

export function allowedOutputRoots(): readonly string[] {
  const home = homedir();
  return [
    resolve(process.cwd(), '.claude/skills'),
    resolve(home, '.claude/skills/dstack'),
    resolve(home, '.dstack/skills'),
  ];
}

/**
 * Returns the resolved path if allowed; throws `PathPolicyError` otherwise.
 * Uses prefix-with-separator check to prevent `/foo/bar` matching `/foo/barbaz`.
 */
export function assertAllowed(path: string): string {
  const resolved = resolve(path);
  for (const root of allowedOutputRoots()) {
    if (resolved === root || resolved.startsWith(root + sep)) {
      return resolved;
    }
  }
  throw new PathPolicyError(resolved, allowedOutputRoots());
}
