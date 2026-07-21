/**
 * Host is a target environment that consumes rendered skills.
 *
 * Today: Claude Code. The Host entity captures the parts a use case needs
 * to know without reaching for adapter-specific details.
 */

export type HostName = 'claude-code'; // union grows when adapters land

export interface ToolRegistry {
  /**
   * Tool names recognized by this host. Skills that declare unknown tools
   * fail validation. See ADR-0009.
   */
  readonly knownTools: readonly string[];
}

export class Host {
  constructor(
    readonly name: HostName,
    readonly outputRoot: string,        // e.g., "~/.claude/skills"
    readonly tools: ToolRegistry,
  ) {}
}
