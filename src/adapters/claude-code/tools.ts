/**
 * Tool registry for Claude Code's harness.
 *
 * This is the authoritative list against which `skill.yaml`'s `tools` field
 * is validated. Names that are not in this list cause `UnknownToolError`.
 *
 * Source: Claude Code's harness documentation. Update when Anthropic ships
 * new tools or renames existing ones. The list is intentionally explicit
 * rather than a regex — typos in tool names are a real failure mode and
 * the explicit list catches them.
 */
export const CLAUDE_CODE_TOOLS: readonly string[] = [
  'Agent',
  'AskUserQuestion',
  'Bash',
  'Edit',
  'Glob',
  'Grep',
  'NotebookEdit',
  'Read',
  'Skill',
  'TaskCreate',
  'TaskGet',
  'TaskList',
  'TaskUpdate',
  'WebFetch',
  'WebSearch',
  'Write',
] as const;
