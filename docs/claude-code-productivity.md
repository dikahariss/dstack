# Claude Code Productivity Guide (v2.1.157)

> Reference for the Claude Code features that most improve productivity and
> workflow. Each feature uses the same shape: **What / Why / How / When**.
> Written to be easy for any model (including smaller ones) to read and act on.

- **Verified version:** `2.1.157` (from `claude --version` on this machine).
- **Research date:** 2026-06-04.
- **Sources:** `code.claude.com/docs` (commands, hooks, interactive-mode, skills,
  sub-agents, model-config), GitHub CHANGELOG `anthropics/claude-code`, and
  `claude --help`. See [Sources](#sources).
- **Version flags:** features newer than 2.1.157 are marked. Removed commands
  (`/vim`, `/pr-comments`) are flagged so they are not used by mistake.

This is a Claude Code usage reference, not a dstack architecture doc. Move or
rename it freely.

> **Related:** this doc covers Claude Code's built-in features. For the dstack
> project's own skills (the catalog in `skills/`) and when to invoke each, see
> `skills/using-dstack/SKILL.md` and its `references/skill-catalog.md`.

---

## Contents

1. [Quick reference: which feature for which situation](#quick-reference)
2. [Context & memory](#1-context--memory)
3. [Delegation & parallelism](#2-delegation--parallelism)
4. [Control & safety](#3-control--safety)
5. [Reasoning & model](#4-reasoning--model)
6. [Automation & scripting](#5-automation--scripting)
7. [Extensibility](#6-extensibility)
8. [Navigation & sessions](#7-navigation--sessions)
9. [Review & verification](#8-review--verification)
10. [Convenience & visibility](#9-convenience--visibility)
11. [Keyboard shortcuts](#10-keyboard-shortcuts)
12. [Version notes (2.1.x)](#11-version-notes-21x)
13. [Sources](#sources)

---

## Quick reference

| Situation | Use | Why |
|---|---|---|
| Session is long, context is filling up | `/context` then `/compact` | See what eats tokens, then summarize |
| Switch to a new task, start clean | `/clear` | Reset context; old chat still in `/resume` |
| Quick question without polluting history | `/btw <question>` | Ephemeral answer, not added to transcript |
| Big change, want to explore first | Plan mode (`Shift+Tab` or `/plan`) | Read-only until you approve the plan |
| Claude went the wrong way | `Esc`, then `Esc Esc` → `/rewind` | Stop, roll code/chat back to a checkpoint |
| Heavy research across many files | Subagent (`/agents`, or ask Claude to delegate) | Only the summary returns; main context stays clean |
| Change spans dozens of files | `/batch <instruction>` | Split into 5–30 parallel units, one worktree each |
| Trivial / fast task | `/model haiku` or `/effort low` | Save tokens and time |
| Hard architecture decision | `/model opus` + `/effort xhigh` | Deeper reasoning |
| Run inside CI / a script | `claude -p ... --output-format json` | Headless, structured output |
| Auto-format/lint after each edit | `PostToolUse` hook | Deterministic enforcement, not "please remember" |
| You keep typing the same instructions | Make a **skill** (`/skill-name`) | Write once; body loads only when used |
| Access external tools (DB, Sentry, etc.) | MCP server (`/mcp`) | Claude queries directly, no copy-paste |

---

## 1. Context & memory

The context window is the scarcest resource. These have the highest payoff because
they keep a session sharp without restarting.

### `/compact [instructions]` — summarize the conversation
- **What:** Replaces conversation history with an AI summary. Frees tokens, keeps key points. Can be focused.
- **Why:** Lets long sessions continue without hitting the context limit.
- **How:** `/compact`, or `/compact focus on the API changes, drop debug logs`. Auto-compaction runs automatically near the limit (shows `auto`); manual gives control.
- **When:** After verbose exploring/debugging; when `/context` shows history dominating; before moving to the next task phase.

### `/context [all]` — inspect the context window
- **What:** A colored grid of what uses tokens: CLAUDE.md, history, skills, MCP tools, file contents. Suggests optimizations.
- **Why:** You cannot optimize what you do not measure. One MCP server can quietly cost thousands of tokens via its tool schemas.
- **How:** `/context` (grid) or `/context all` (per-item detail).
- **When:** Before/after `/compact`; when a session fills up faster than expected; when deciding which MCP servers or skills to keep enabled.

### `/clear` — start a new conversation
- **What:** Empty context in the same project. The old conversation stays in `/resume`. Aliases: `/reset`, `/new`.
- **Why:** Move to an unrelated task without dragging old context along (and without losing it).
- **How:** `/clear`, or `/clear label` to name the old chat in the `/resume` picker. To free context but stay in the same chat, use `/compact` instead.
- **When:** New, unrelated feature or bug. Not for freeing space mid-task — that is `/compact`.

### `CLAUDE.md` + `.claude/rules/` — instructions loaded every session
- **What:** Markdown loaded at the start of every session. `CLAUDE.md` holds project conventions; `.claude/rules/*.md` holds rules you can scope to file paths.
- **Why:** Conventions (build commands, code style, "never do X") persist across sessions without re-typing. Path-scoped rules load only when relevant, keeping context lean.
- **How:**
  - `/init` generates a starter `CLAUDE.md` (set `CLAUDE_CODE_NEW_INIT=1` for an interactive flow).
  - `/memory` to edit. Import other files with `@path` (e.g. `See @README.md`).
  - Scope a rule with `paths:` (glob) frontmatter.
- **When:** First session in a repo, and whenever Claude repeats the same mistake twice — that is a signal to make the rule permanent.

### Auto-memory — cross-session notes Claude maintains
- **What:** Claude saves learnings across sessions (build commands, debug patterns, preferences) in `~/.claude/projects/<project>/memory/MEMORY.md`.
- **Why:** Accumulates knowledge without you manually editing CLAUDE.md. Less repetition across sessions.
- **How:** Manage via `/memory` (view, enable/disable entries). First ~200 lines / 25KB load each session; topic files load on demand.
- **When:** On for long-term projects. Off for sandbox/throwaway work.

### `/btw <question>` — side question without polluting history
- **What:** A quick question about current work that does not enter the transcript. Sees full context but has no tools. Ephemeral.
- **Why:** The inverse of a subagent (subagent: has tools, starts empty; `/btw`: sees everything, no tools). Saves context for "what was that config file again?" without breaking focus.
- **How:** `/btw what file holds the DB config?`. Works even while Claude is busy. Press `f` to fork the answer into a full session.
- **When:** You need a fast answer from what is already in context, but do not want to add a turn or interrupt a long task.

---

## 2. Delegation & parallelism

The core of workflow optimization: **isolate context** and **work in parallel**.
Heavy tasks that read many files should not bloat your main window.

### Subagents — isolated workers
- **What:** Assistants that run in their own context, separate from the main chat. Only their summary returns to you.
- **Why:** Research that reads 50 files produces a lot of output — with a subagent, your main window only gets the conclusion. Saves tokens, keeps the chat clean, and several can run in parallel.
- **How:** Built-in ones appear automatically: `Explore` (search/understand code), `Plan` (write plans). Custom ones live in `.claude/agents/<name>.md` with frontmatter (`description`, `model`, `tools`, `effort`). Manage via `/agents`, or just ask Claude to delegate.
- **When:** Parallel research; specialized reviews (security, performance); long exploration whose output need not stay in the main context.

### `/agents` — manage and monitor subagents
- **What:** A panel to configure agents and watch sessions that are running, blocked, or done.
- **Why:** Visibility over parallel work — see which agents wait on you and which are finished.
- **How:** `/agents` (in session) or `claude agents` (terminal; `--json` for scripting).
- **When:** When running many subagents or `/batch`, to check progress.

### `/batch <instruction>` — large-scale parallel refactor *(bundled skill)*
- **What:** Splits a codebase-wide change into 5–30 independent units, then runs one background subagent per unit in an isolated git worktree. Each unit implements, runs tests, and opens a PR.
- **Why:** Turns hours of serial work into parallel work without file conflicts. Good for framework migrations or cross-module API renames.
- **How:** `/batch migrate src/ from Solid to React`. Needs a git repo. Claude researches, proposes a plan, then spawns agents after you approve.
- **When:** A change that touches many independent files or modules.

### `/background [prompt]` (alias `/bg`) — detach the session
- **What:** Detaches the whole session to run as a background agent and frees your terminal.
- **Why:** Long tasks run without holding your terminal hostage; monitor with `claude agents`.
- **How:** `/background`, or `/background finish and run all tests` to leave one last instruction.
- **When:** Long autonomous tasks (big builds, batch tests) that do not need constant watching.

### `/tasks` (alias `/bashes`) — manage background tasks
- **What:** List and manage bash commands running in the background of this session.
- **Why:** Control long processes (dev server, watcher) without losing track.
- **How:** `/tasks`. Background output is written to a file Claude can read.
- **When:** After backgrounding a command with `Ctrl+B`, to monitor or stop it.

### `/fork <directive>` — forked subagent
- **What:** Spawns a background subagent that inherits the full conversation and works on the directive while you continue; its result returns when done.
- **Version note:** This forked-subagent behavior is new in **v2.1.161**. On **2.1.157** (your version), `/fork` is still an **alias for `/branch`**. To copy the chat and move into the copy, use `/branch`.
- **When (≥2.1.161):** Hand off a sub-task that needs the full conversation context without stopping.

### Dynamic workflows / `ultracode` — orchestrate many agents
- **What:** Claude plans and runs many background agents for substantial tasks (fan-out, verify, synthesize). `ultracode` = `xhigh` reasoning + automatic workflow orchestration.
- **Why:** Handles work too big for one context (wide audits, migrations, deep reviews) with structured parallelism.
- **How:** `/effort ultracode` (session-only), then `/workflows` to watch/pause/save progress. Built-in workflow example: `/deep-research`.
- **When:** Large refactors, migrations, or research. Token-expensive — use when the scale truly demands it.

---

## 3. Control & safety

Tune the trade-off between speed (fewer prompts) and control (full oversight).

### Permission modes — `Shift+Tab` cycles approval strategies
- **What:** Controls how Claude handles permission prompts for file edits and shell commands.
- **Why:** Match safety vs speed to context. Strict in prod, loose in a safe sandbox.
- **How:** Press `Shift+Tab` to cycle: `default` (ask each action) → `acceptEdits` (auto-approve file edits) → `plan` (read-only until you approve a plan) → any modes you enabled (`auto`, `bypassPermissions`). Set a default with `--permission-mode <mode>` or in settings.
- **When:** `plan` to explore a big change; `acceptEdits` for trusted routine work; `bypassPermissions` only in an isolated container/CI.

### Plan mode — plan before executing
- **What:** Claude uses only read-only tools and produces a plan; execution starts after you approve.
- **Why:** Stops Claude from coding fast on a wrong assumption. You review the approach cheaply before any diff exists.
- **How:** `Shift+Tab` to plan mode, or `/plan`, or `/plan fix the auth bug` to start with that task.
- **When:** Before a large or risky change; when the solution space is still wide.

### Checkpoints & `/rewind` — undo changes
- **What:** Every file edit is snapshotted. `/rewind` (aliases `/checkpoint`, `/undo`) opens history to restore code and/or conversation to an earlier point.
- **Why:** Refactor boldly because you can always return to the last good state in a few keys.
- **How:** `Esc Esc` with empty input, or `/rewind`. Pick a checkpoint, then: restore code & chat / chat only / code only / summarize from here. **Limit:** Bash commands (e.g. `rm`) are **not** checkpointed — only direct file edits.
- **When:** When Claude starts to drift; after a few messages to set a safe point.

### `/permissions` — fine-grained tool rules
- **What:** allow / ask / deny rules per tool (Bash, Read, Edit, WebFetch, MCP, etc.).
- **Why:** Deterministic guardrails — block sensitive files, auto-approve trusted commands, require a prompt for risky ones.
- **How:** `/permissions` (UI), or in `.claude/settings.json`:
  ```json
  {
    "permissions": {
      "allow": ["Bash(npm test)", "Bash(git commit *)"],
      "deny":  ["Read(.env)", "Bash(rm -rf *)"],
      "ask":   ["Edit(src/auth/**)"]
    }
  }
  ```
  Wildcards work. Set once per project; it is stored and shared with the team.
- **When:** Project setup. Also see `/fewer-permission-prompts` (skill), which scans transcripts and builds a read-only allowlist for you.

### Hooks — automation on lifecycle events
- **What:** Shell / HTTP / prompt / agent handlers that run on specific events (before/after tool use, session start, etc.).
- **Why:** **Deterministic** enforcement, not hope. Run lint after each edit, block style-failing commits, notify on risky operations — without relying on Claude to remember.
- **How:** In `.claude/settings.json`, the structure is **nested**: `hooks → EventName → [{ matcher, hooks: [{ type, command }] }]`:
  ```json
  {
    "hooks": {
      "PostToolUse": [
        {
          "matcher": "Edit|Write",
          "hooks": [
            { "type": "command", "command": "npx prettier --write .", "timeout": 60 }
          ]
        }
      ]
    }
  }
  ```
  Events include: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart`,
  `SessionEnd`, `Stop`, `SubagentStop`, `PreCompact`, `PostCompact`, `Notification`,
  `PermissionRequest`. Types: `command`, `http`, `mcp_tool`, `prompt`, `agent`.
  View active hooks with `/hooks`.
- **When:** Deterministic enforcement (lint, review gates, notifications). For judgment-based decisions, use a skill or CLAUDE.md instead.

---

## 4. Reasoning & model

Set "how much brain" per task — a direct lever on cost vs quality.

### `/effort [level|auto]` — reasoning depth
- **What:** Controls how deeply the model thinks before answering.
- **Why:** Save tokens on simple tasks, invest reasoning on hard decisions.
- **How:** `/effort` (slider) or `/effort <level>`. Levels: `low`, `medium`, `high`, `xhigh`, `max`, `ultracode`. `max` and `ultracode` are session-only. `ultracode` = `xhigh` + automatic workflow orchestration. `auto` resets to the model default. Opus 4.8 defaults to `high`. Set at launch with `--effort <level>`.

  | Level | For |
  |---|---|
  | `low` | Fast, latency-sensitive, not intelligence-sensitive |
  | `medium` | Lower token spend |
  | `high` | Default — balanced |
  | `xhigh` | Deeper reasoning, more tokens |
  | `max` | Deepest, session-only |
  | `ultracode` | `xhigh` + auto workflows (large-scale tasks) |
- **When:** Raise it for hard architecture/algorithms; lower it for mechanical edits.

### `/model [model]` — switch models
- **What:** Move between fast/cheap (Haiku) and most capable (Opus).
- **Why:** Haiku for quick searches, Sonnet for daily coding, Opus for complex architecture.
- **How:** `/model` (picker; press `s` for this-session-only, arrows adjust effort) or `/model opus`. Aliases: `opus` (Opus 4.8), `sonnet` (Sonnet 4.6), `haiku`, `opusplan` (Opus while planning, Sonnet while executing). Set a default with `--model`.
- **When:** Start with Sonnet; go to Opus for heavy decisions; Haiku for trivial tasks.

### `/fast [on|off]` — fast mode
- **What:** Faster Opus output (not a downgrade to a smaller model). On Opus 4.8 it is ~2.5× faster at ~2× standard rate.
- **Why:** Cuts latency on the strongest model when you want Opus quality without the wait.
- **How:** `/fast` or toggle `Alt+O` (`Option+O`). Available on Opus 4.8/4.7/4.6.
- **When:** Fast iterative loops where wait time breaks your flow.

### Extended thinking — visible reasoning
- **What:** Claude's internal reasoning (gray text) shown before the answer.
- **Why:** Seeing the chain of thought helps diagnose when Claude drifts, and raises quality on hard problems.
- **How:** Toggle `Alt+T` (`Option+T`). Open the transcript viewer with `Ctrl+O` to see detail. Depth is set by `/effort`.
- **When:** Debugging Claude's reasoning or tackling a hard architecture problem.

---

## 5. Automation & scripting

Take Claude out of the interactive session: into CI, scripts, and schedules.

### `claude -p "prompt"` — headless / non-interactive
- **What:** Runs Claude Code from a script or CI. Prints the result to stdout; can return JSON with metadata.
- **Why:** Integrate into build pipelines, linters, reviews, or scheduled jobs.
- **How:**
  ```bash
  # basic
  claude -p "Fix the bug in auth.py"

  # structured output + schema validation
  claude -p "List function names in auth.py" \
    --output-format json \
    --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'

  # restrict tools and pipe input
  git diff main | claude -p "Review this diff for security issues" --allowedTools "Read"

  # cap spend
  claude -p "..." --max-budget-usd 0.50
  ```
  JSON output includes `session_id`, `total_cost_usd`, `usage`, and `structured_output` (with a schema). Use `--output-format stream-json` for streaming.
- **When:** CI/CD, build scripts, one-off CLI analysis.

### `--bare` — clean run for reproducibility
- **What:** Skips auto-discovery (hooks, plugins, MCP, CLAUDE.md, auto-memory). Uses only what you pass explicitly.
- **Why:** Reproducible CI — a teammate's local config cannot affect the run.
- **How:** `claude --bare -p "..." --allowedTools "Read" --settings '{"model":"sonnet"}'`. Pass context explicitly via `--system-prompt`, `--append-system-prompt`, `--add-dir`, `--mcp-config`, `--agents`, `--plugin-dir`.
- **When:** Any scripted/CI run where consistency matters more than local config.

### `/loop [interval] [prompt]` — run repeatedly *(bundled skill)*
- **What:** Runs a prompt/command repeatedly while the session is open. Without an interval, Claude self-paces.
- **Why:** Poll a status, re-run tests periodically, check an endpoint.
- **How:** `/loop 5m check if the deploy finished`, or `/loop /code-review`. Interval format: `Xs`/`Xm`/`Xh`. Without a prompt, it runs an autonomous maintenance check or `.claude/loop.md`.
- **When:** Repeated checks or polling within one session.

### `/schedule [description]` (alias `/routines`) — scheduled cloud agents
- **What:** Create/update/run **routines** that execute on Anthropic-managed cloud infrastructure on a cron-like schedule.
- **Why:** Hands-off automation that needs no input: daily lint sweeps, dependency updates, weekly audits — runs even when your terminal is off.
- **How:** `/schedule`, then Claude walks you through setup conversationally. Needs GitHub connected (see `/web-setup`).
- **When:** Fully autonomous recurring tasks. (For repetition inside a live session, use `/loop`.)

---

## 6. Extensibility

Shape Claude Code around your workflow.

### Skills — reusable instructions/workflows
- **What:** A `SKILL.md` file with instructions/checklists/procedures. Claude loads it when relevant, or you invoke it directly with `/<skill-name>`. **The body loads only when used**, so long reference material is nearly free until needed.
- **Why:** When you type the same instructions a third time, make it a skill. For dstack's own catalog and when to invoke each skill, see `skills/using-dstack` and its `references/skill-catalog.md`.
- **How:** Create `~/.claude/skills/<name>/SKILL.md` (personal) or `.claude/skills/<name>/SKILL.md` (project):
  ```yaml
  ---
  description: Summarize uncommitted changes and flag risky ones. Use when the user asks "what changed" or wants a diff review.
  disable-model-invocation: false
  ---
  ## Current changes
  !`git diff HEAD`
  ## Instructions
  Summarize in 2–3 bullets, then list risks.
  ```
  - Dynamic context: a `` !`command` `` line runs and is inlined before Claude reads the skill.
  - Key frontmatter: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation` (only you can invoke), `user-invocable: false` (only Claude invokes), `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork` (runs in a subagent), `paths` (auto-load by glob).
  - Argument substitution: `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N` (`$0`, `$1`), `$name` (from `arguments:`), `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`.
  - Keep `SKILL.md` under 500 lines; move long reference to supporting files.
- **When:** Repeatable procedures, checklists, style guides, domain knowledge.

### Custom slash commands (`.claude/commands/*.md`)
- **What:** Your own commands (e.g. `/deploy`). **Now merged into skills** — `.claude/commands/deploy.md` and `.claude/skills/deploy/SKILL.md` both create `/deploy`. Old `commands/` files still work.
- **Why:** Team workflows become first-class commands.
- **How:** Prefer the skill format (supports supporting files, invocation control, auto-load). The command name comes from the directory/file name.
- **When:** When a team workflow deserves to be a `/command`.

### MCP servers — connect external tools and data
- **What:** Model Context Protocol servers that give Claude direct access to databases, APIs, monitoring, browsers, etc.
- **Why:** Instead of pasting data into chat, Claude queries directly: "top 10 errors in Sentry?", "users who signed up this week".
- **How:**
  ```bash
  claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
  claude mcp add --transport stdio db -- npx @bytebase/dbhub --dsn "postgresql://..."
  ```
  Manage and authenticate (OAuth) with `/mcp`. Scopes: `local` (you only), `project` (shared via `.mcp.json`), `user` (all your projects). MCP prompts appear as `/mcp__<server>__<prompt>`.
- **When:** Whenever you repeatedly copy data from another tool into chat.

### Plugins — installable feature bundles
- **What:** Bundle skills, MCP servers, hooks, agents, and commands into one installable unit.
- **Why:** Share a complete setup across projects/teams in one install.
- **How:** `/plugin` to manage; `--plugin-dir`/`--plugin-url` to load for one session. Plugin skills are namespaced `<plugin>:<skill>`. Since 2.1.157, plugins in `.claude/skills` auto-load without a marketplace; `claude plugin init <name>` scaffolds one.
- **When:** You have a standard setup (MCP + skills + hooks) reused across repos.

---

## 7. Navigation & sessions

Run many workstreams without losing your place.

| Command / flag | What & when |
|---|---|
| `claude --continue` / `-c` | Resume the last conversation in this directory. Quick pickup. |
| `/resume [session]` / `claude --resume` | Picker of past conversations (search, preview). Background sessions marked `bg`. Switch between parallel tasks. |
| `/branch [name]` | Branch the conversation here; original stays safe. Try another approach without losing the current path. |
| `/clear` | Start clean (see §1). |
| `/rename [name]` | Name the session (shows in prompt bar and picker). When juggling tasks. Or `-n/--name` at launch. |
| `--fork-session` | On resume, create a new session ID instead of overwriting the old one. |
| `--from-pr [PR]` | Resume the session linked to a PR. |
| `--add-dir <path>` / `/add-dir` | Grant access to extra directories (monorepo/related project). `.claude/skills/` inside is also loaded. |
| `-w/--worktree [name]` | Create a new git worktree for this session (isolation). `--tmux` for a tmux session. |
| `/teleport` (alias `/tp`) | Pull a Claude Code on the web session into this terminal. |
| `/remote-control` (alias `/rc`) | Continue this local session from another device via claude.ai. |
| `/export [file]` | Export the conversation as text. Archive/share. |

> **Worktrees** pair well with sessions: each worktree is a parallel session that
> does not interfere with the others. Ideal before executing a plan or `/batch`.

---

## 8. Review & verification

Catch issues before they spread — most are bundled skills that run several agents
in parallel.

| Command | What & when |
|---|---|
| `/diff` | Interactive diff viewer: uncommitted changes and per-turn diffs. Before committing. |
| `/code-review [low\|…\|max\|ultra] [--fix] [--comment] [target]` | *(skill)* Review the diff for correctness bugs plus cleanup opportunities. `--fix` applies findings; `--comment` posts them as PR comments; `ultra` runs a multi-agent cloud review. Before merge. |
| `/simplify [target]` | *(skill, since 2.1.154)* Four parallel agents do **cleanup only** (reuse, simplification, efficiency, abstraction level), then apply fixes. Does **not** hunt bugs — that is `/code-review`. |
| `/review [PR]` | Review a PR locally in this session. |
| `/security-review` | Analyze branch changes for vulnerabilities (injection, auth, data exposure). Before shipping sensitive features. |
| `/run` | *(skill, ≥2.1.145)* Launch and drive the app to see a change actually work, not just tests. |
| `/verify` | *(skill, ≥2.1.145)* Build + run the app to confirm a change works, without relying on tests/type-checks. |
| `/run-skill-generator` | *(skill, ≥2.1.145)* Teach `/run` & `/verify` how to build/launch your project (saved as a per-project skill). |

---

## 9. Convenience & visibility

Small features that save minutes daily.

| Feature | What & when |
|---|---|
| `/usage` (aliases `/cost`, `/stats`) | Session cost, plan limits, stats; breakdown by skill/subagent/plugin/MCP. Track spend. |
| `/context [all]` | Inspect the context window (see §1). |
| `/recap` | One-line summary of the current session. Auto-appears when you return after being away. |
| `/insights` | Report on your session patterns: project areas, interaction patterns, friction points. Reflect/optimize habits. |
| `/focus` | Compact view: only your last prompt, a one-line tool summary, and the final answer (fullscreen). When the screen is too busy. |
| Task list (`Ctrl+T`) | Multi-step task list in the status area; survives compaction. |
| Prompt suggestions | Gray suggestion in the input (from git history/chat). `Tab`/`→` to accept. |
| PR status in footer | Color-coded PR link (green=approved, yellow=pending, red=changes, gray=draft). Needs `gh`. |
| `/statusline` | Configure the status line (e.g. from your shell prompt). |
| Shell mode (`!`) | `! npm test` runs a command directly and adds output to context, with no Claude approval. |
| `/powerup` | Short interactive lessons to discover Claude Code features. |
| `/release-notes` | View the changelog by version. After an auto-update, to learn what is new. |

---

## 10. Keyboard shortcuts

| Key | Action |
|---|---|
| `Shift+Tab` | Cycle permission modes (`default` → `acceptEdits` → `plan` → …) |
| `Esc` | Interrupt Claude (work done so far is kept) |
| `Esc` `Esc` | Empty input → open `/rewind`; with text → clear draft (saved to history) |
| `Ctrl+B` | Move a running command/agent to the background (tmux: press twice) |
| `Ctrl+T` | Toggle the task list |
| `Ctrl+O` | Toggle the transcript viewer (tool detail; expands MCP calls) |
| `Ctrl+R` | Reverse-search command history (`Ctrl+S` changes scope: session/project/all) |
| `Ctrl+C` | Interrupt; if idle, first press clears input, second exits |
| `Ctrl+D` | Exit the session |
| `Ctrl+X Ctrl+K` | Kill all background subagents (press twice within 3s to confirm) |
| `Ctrl+G` / `Ctrl+X Ctrl+E` | Open the prompt in your text editor |
| `Ctrl+L` | Redraw the screen (if the display breaks) |
| `Alt+P` / `Option+P` | Switch model without clearing the prompt |
| `Alt+T` / `Option+T` | Toggle extended thinking |
| `Alt+O` / `Option+O` | Toggle fast mode |
| `Ctrl+V` / `Alt+V` | Paste an image from the clipboard (as an `[Image #N]` chip) |
| `/` (at start) | Command or skill |
| `!` (at start) | Shell mode |
| `@` | Mention a file path (autocomplete) |
| `#` | Quick-add to memory / CLAUDE.md |
| `Shift+Enter` / `\`+`Enter` / `Ctrl+J` | New line (multi-line input) |
| `Up` / `Down` | Navigate input history |
| `Tab` / `→` | Accept a prompt suggestion |

> On macOS, `Alt/Option` shortcuts need "Option as Meta" enabled in your terminal
> (iTerm2/Terminal/VS Code). See `/terminal-setup`.

---

## 11. Version notes (2.1.x)

**Relatively new (already in your 2.1.157):**

| Feature | Version | Note |
|---|---|---|
| Opus 4.8 + default effort `high` | 2.1.154 | Flagship model; `/effort xhigh`/`max` available |
| Dynamic workflows + `ultracode` | 2.1.154 | Orchestrate many agents; watch `/workflows` |
| Fast mode on Opus 4.8 (~2.5×) | 2.1.154 | `/fast` or `Alt+O` |
| `/simplify` cleanup-only | 2.1.154 | No longer hunts bugs (use `/code-review`) |
| `/reload-skills` | 2.1.152 | Re-scan skills without restart |
| `/run`, `/verify`, `/run-skill-generator` | 2.1.145 | Run & verify the real app |
| `/goal` (work until a condition is met) | 2.1.139 | `/goal all tests pass and coverage > 90%` |
| Agent view (`claude agents`) | 2.1.139 | See running/waiting/done sessions |
| Plugin `.claude/skills` auto-load | 2.1.157 | No marketplace; `claude plugin init <name>` |

**Newer than 2.1.157 (may not be on your version — check `/release-notes`):**

- `/fork` as a forked subagent (2.1.161; on 2.1.157 it is still an alias for `/branch`).
- `claude agents --json` shows `waitingFor` (2.1.162).
- Auto mode for Bedrock/Vertex/Foundry (2.1.158).

**Removed — do not use on 2.1.157:**

- `/vim` — **removed in 2.1.92.** Toggle Vim via `/config` → Editor mode.
- `/pr-comments` — **removed in 2.1.91.** Ask Claude directly to view PR comments.

**Staying current:** `claude update` (or `/release-notes` to read the changelog,
`/powerup` for interactive feature lessons).

---

## Sources

- Commands reference — https://code.claude.com/docs/en/commands
- Hooks — https://code.claude.com/docs/en/hooks
- Interactive mode (shortcuts & input) — https://code.claude.com/docs/en/interactive-mode
- Skills — https://code.claude.com/docs/en/skills
- Subagents — https://code.claude.com/docs/en/sub-agents
- Model & effort — https://code.claude.com/docs/en/model-config
- CHANGELOG — https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- Local `claude --help` and `claude --version` (2.1.157), 2026-06-04.
