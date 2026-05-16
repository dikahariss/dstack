import { RenderContext } from '@domain/render/RenderContext';
import { RenderResult } from '@domain/render/RenderResult';

/**
 * HostRenderer turns a Skill into a file content + path for a specific host.
 *
 * Each host has its own renderer. The Claude Code renderer emits
 * `<skill-id>/SKILL.md` with Claude-shaped frontmatter. A Codex renderer
 * would emit different frontmatter and possibly rewrite tool names.
 *
 * Renderers are pure — they do not write to disk. The Installer does.
 */
export interface HostRenderer {
  render(ctx: RenderContext): RenderResult;
}

/**
 * Installer writes a batch of RenderResults to disk under a host's output root.
 *
 * The batch shape ensures atomic-ish behavior: all-or-nothing per skill,
 * never half-rendered output. Implementations may write to a staging dir
 * and rename, or write directly — that's an adapter concern.
 */
export interface Installer {
  install(outputRoot: string, results: readonly RenderResult[]): Promise<InstallReport>;
}

export interface InstallReport {
  readonly outputRoot: string;
  readonly written: number;
  readonly skipped: number;        // unchanged files
  readonly removed: number;        // skills that existed before but not now
}
