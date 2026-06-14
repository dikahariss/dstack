/**
 * Tool registry for Claude Code's harness.
 *
 * The authoritative list against which a skill's `allowed-tools` field is
 * validated. Names not in this list raise `UnknownToolError`.
 *
 * Synced to the live Claude Code harness tool set (2026-06-14). MCP tools
 * (`mcp__<server>__<tool>`) are deliberately excluded: they are
 * user/server-specific, vary per session, and are not first-party host
 * tools. Update when Anthropic ships, renames, or removes a first-party
 * tool. The list is explicit rather than a regex — typos in tool names are
 * a real failure mode and the explicit list catches them.
 */
export const CLAUDE_CODE_TOOLS: readonly string[] = [
  'Agent',
  'AskUserQuestion',
  'Bash',
  'CronCreate',
  'CronDelete',
  'CronList',
  'DesignSync',
  'Edit',
  'EnterPlanMode',
  'EnterWorktree',
  'ExitPlanMode',
  'ExitWorktree',
  'Glob',
  'Grep',
  'LSP',
  'ListMcpResourcesTool',
  'Monitor',
  'NotebookEdit',
  'PushNotification',
  'Read',
  'ReadMcpResourceTool',
  'RemoteTrigger',
  'ScheduleWakeup',
  'Skill',
  'TaskCreate',
  'TaskGet',
  'TaskList',
  'TaskOutput',
  'TaskStop',
  'TaskUpdate',
  'ToolSearch',
  'WebFetch',
  'WebSearch',
  'Workflow',
  'Write',
] as const;
