import { RenderContext } from '@domain/render/RenderContext';
import { RenderResult } from '@domain/render/RenderResult';
import { BundledFile } from '@domain/skill/BundledFile';

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
 * One unit the Installer can write: the rendered `SKILL.md` plus any
 * bundled files (scripts/, references/, assets/, etc.) shipped alongside.
 *
 * The Installer treats bundled files as opaque — it copies them verbatim
 * with their original executable bit. The renderer never sees them.
 */
export interface RenderedSkill {
  readonly rendered: RenderResult;
  readonly bundled: readonly BundledFile[];
}

/**
 * Installer writes a batch of RenderedSkills to disk under a host's output
 * root. The batch shape ensures atomic-ish behaviour: all-or-nothing per
 * skill, never half-rendered output.
 *
 * Implementations may write to a staging dir and rename, or write directly
 * — that's an adapter concern.
 */
export interface Installer {
  install(outputRoot: string, items: readonly RenderedSkill[]): Promise<InstallReport>;
}

export interface InstallReport {
  readonly outputRoot: string;
  readonly written: number;
  readonly skipped: number;
  readonly removed: number;
}
