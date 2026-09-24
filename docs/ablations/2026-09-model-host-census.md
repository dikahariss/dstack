# Model and host census — 2026-09-24

Method: `grep -rhoP '"name":"Skill","input":\{"skill":"[^"]+"' ~/.claude/projects --include='*.jsonl' | sed -E 's/.*"skill":"([^"]+)"/\1/; s/^anthropic-skills://' | sort | uniq -c | sort -rn` and `bun scripts/session-metrics.ts ~/.claude/dstack-census/2026-09-24-sessions.jsonl ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi`; transcript window 2026-08-04 → 2026-09-24.

## Hosts

| Host | Config dir | Default model | Skill loading | Sessions in window |
|---|---|---|---|---:|
| Claude Code | `~/.claude` | `opus[1m]` | rendered copy | 452 |
| Claude Code | `~/.claude-zai` | `cc/claude-sonnet-5` | rendered copy | 25 |
| Claude Code | `~/.claude-helium` | `opus[1m]` | rendered copy | 111 |
| Claude Code | `~/.claude-kimi` | unset | rendered copy | 2 |
| Codex | `~/.codex` | `gpt-6-luna` | symlink to source | 687 history lines; not window-scoped |

## Models observed

| Sessions | Config | Model |
|---:|---|---|
| 296 | `.claude` | `claude-opus-5` |
| 65 | `.claude` | `claude-fable-5-1` |
| 59 | `.claude-helium` | `claude-opus-5` |
| 42 | `.claude` | `claude-sonnet-5` |
| 34 | `.claude` | `claude-haiku-4-5-20251001` |
| 10 | `.claude` | `claude-fable-5` |
| 8 | `.claude-zai` | `claude-sonnet-5` — as reported by gateway |
| 8 | `.claude-helium` | `claude-haiku-4-5-20251001` |
| 5 | `.claude-zai` | `claude-opus-5` — as reported by gateway |
| 4 | `.claude-helium` | `claude-fable-5` |
| 4 | `.claude-helium` | `claude-fable-5-1` |
| 3 | `.claude-zai` | `gemini-3.8-flash` — as reported by gateway |
| 2 | `.claude` | `claude-opus-4-8` |
| 2 | `.claude-kimi` | `claude-sonnet-5` — as reported by gateway |
| 1 | `.claude` | `claude-opus-5-5` |
| 1 | `.claude-zai` | `qwen/qwen3.8-flash` — as reported by gateway |
| 1 | `.claude-zai` | `claude-haiku-4-5-20251001` — as reported by gateway |
| 1 | `.claude-zai` | `gpt-6-sol` — as reported by gateway |
| 1 | `.claude-zai` | `gpt-5.6-terra` — as reported by gateway |
| 1 | `.claude-zai` | `gpt-5.6-luna` — as reported by gateway |
| 1 | `.claude-zai` | `z-ai/glm-5.3-flash` — as reported by gateway |
| 1 | `.claude-zai` | `gpt-6-luna` — as reported by gateway |
| 1 | `.claude-zai` | `gpt-5.6-sol` — as reported by gateway |
| 1 | `.claude-zai` | `deepseek/deepseek-v4.1-flash` — as reported by gateway |
| 1 | `.claude-helium` | `claude-sonnet-5` |

The current Anthropic models listed in the [Models overview](https://platform.claude.com/docs/en/models/overview), checked 2026-09-24, are `claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5`, and `claude-haiku-4-5-20251001`. Not observed: none.

## Skill invocations

| Skill | 2026-09-24 | 2026-09-04 |
|---|---:|---:|
| `researching-facts` | 41 | — |
| `test-driven-development` | 37 | 6 |
| `using-dstack` | 35 | 24 |
| `writing-plans` | 30 | 23 |
| `multi-persona-review` | 25 | 23 |
| `running-uat` | 21 | 15 |
| `artifact-design` | 21 | 17 |
| `prioritizing-work` | 18 | 11 |
| `claude-in-chrome` | 17 | 14 |
| `executing-plans` | 13 | 12 |
| `debugging` | 13 | 7 |
| `discovering-requirements` | 10 | 9 |
| `writing-specs` | 9 | 6 |
| `requesting-code-review` | 7 | 4 |
| `finishing-development-branch` | 7 | 5 |
| `designing-test-cases` | 7 | 3 |
| `writing-skills` | 6 | 5 |
| `verifying-before-done` | 5 | 1 |
| `subagent-driven-development` | 5 | 2 |
| `guarding-destructive-commands` | 5 | 4 |
| `using-git-worktrees` | 4 | 3 |
| `pdf-to-rag` | 4 | 3 |
| `diagramming-architecture` | 4 | 4 |
| `run` | 3 | 2 |
| `claude-api` | 3 | 3 |
| `responding-to-review` | 2 | 2 |
| `dispatching-parallel-agents` | 2 | 0 |
| `workflow-authoring` | 2 | — |
| `deep-audit` | 2 | 1 |
| `auditing-short-video` | 2 | 2 (`auditing-video`) |
| `pptx` | 1 | 1 |
| `modelling-system-behaviour` | 1 | 1 |
| `maritimhub-frontend-local` | 1 | — |
| `managing-version` | 1 | 0 |
| `literature-trends` | 1 | 1 |
| `literature-search` | 1 | 1 |
| `literature-fulltext` | 1 | 1 |
| `init` | 1 | 1 |
| `generating-images` | 1 | 0 |
| `dataviz` | 1 | 1 |
| `brainstorm` | 1 | 1 |
| `better-writing` | 1 | — |
| `better-typography` | 1 | — |
| `better-layout` | 1 | — |
| `better-interface` | 1 | — |
| `better-colors` | 1 | — |
| `better-accessibility` | 1 | — |

## Predecessor open items

- Task 12 waits on the 6.5M-token / 54-session budget; its Step 0 census rerun is complete here on 2026-09-24. G1 closes Task 12 as superseded; rows reopen only through G3.
- Task 13's claude.ai sync remains partial: 4 of 36 current, sync commit `3863c91`.
- ADR-0031 says “Opus 5 daily”; the primary Claude config reports `opus[1m]`, while the census records `claude-opus-5` in 296 sessions and `claude-opus-5-5` in 1.
