---
name: guarding-destructive-commands
description: |
  Safety guardrails for destructive commands. Reminds the user to pause before
  rm -rf, DROP TABLE, force-push, git reset --hard, kubectl delete, and similar
  destructive operations. Use when touching prod, debugging live systems, or
  working in a shared environment. Use when asked to "be careful", "safety
  mode", "prod mode", or "careful mode".
allowed-tools: Bash Read
metadata:
  dstack:
    version: 0.4.0
    type: semantic
    context_budget_tokens: 1500
    side_effects: readonly
    agency: reactive
    calibration: deterministic-dominant
    triggers:
      - be careful
      - warn before destructive
      - safety mode
      - prod mode
---
# /guarding-destructive-commands

Safety mode is **advisory** in dstack. dstack does not intercept bash
via hooks — the discipline is yours plus this checklist. Before
running any of the patterns below, stop, restate what the command will
do, and confirm with the user.

## Patterns that require explicit confirmation

| Pattern | Example | Why pause |
|---|---|---|
| `rm -rf` / `rm -r` | `rm -rf /var/data` | Recursive delete, no undo |
| `DROP TABLE` / `DROP DATABASE` | `DROP TABLE users;` | Data loss, no undo |
| `TRUNCATE` | `TRUNCATE orders;` | Data loss, no undo |
| `git push --force` / `-f` | `git push -f origin main` | Rewrites remote history |
| `git reset --hard` | `git reset --hard HEAD~3` | Uncommitted work lost |
| `git checkout .` / `git restore .` | `git checkout .` | Uncommitted work lost |
| `kubectl delete` | `kubectl delete pod` | Production impact |
| `docker rm -f` / `docker system prune` | `docker system prune -a` | Container/image loss |

## Safe exceptions (no confirmation needed)

- `rm -rf node_modules` / `.next` / `dist` / `__pycache__` / `.cache` /
  `build` / `.turbo` / `coverage`

These are build-artifact directories. Removing them is reversible — the
next build recreates them. Treat them as cache, not data.

## The table is a floor, not a whitelist

The only judgment here: is a destructive command NOT in the table (e.g.
`terraform destroy`, `flyctl apps destroy`, `gh repo delete`, `bq rm`)
still destructive? If it is irreversible or hits shared/prod state, run
the pause protocol as if it were listed. Do not improvise a faster path.
The call to pause is yours; everything else follows the protocol.

## The pause protocol

When you see a pattern from the table, before sending the command:

1. **Restate the action.** "I'm about to run `git push -f origin main`. This
   will overwrite the remote `main` branch with my local one. Anyone who has
   pulled `main` will need to reset."
2. **Name the failure.** What can't be undone? Who else is affected?
3. **Ask.** `AskUserQuestion` with the action quoted verbatim. Do not
   paraphrase. Do not run before the answer.

This is slower than running the command. That is the point.

## When this skill is NOT enough

Hook-based interception (a `PreToolUse` hook that blocks a Bash call
before it runs) is strictly stronger than advisory text — it catches
operations that bypass conscious thought. If you are working on prod
or a shared system and need that guarantee, use a tool that supports
hook-level enforcement until dstack adds hook support.

Hook support is deliberately deferred in dstack (DEFERRED entry D2):
hooks are powerful but add runtime complexity, and the threshold to
revisit is two skills needing them. This skill is the only one that
does, so the guardrail stays advisory.

## Changes

- **0.4.0** — Renamed `careful` → `guarding-destructive-commands`. A bare
  adjective is exactly the "vague name" Anthropic's naming guidance warns
  against; the new name states the action. The "be careful"/"careful mode"
  triggers are kept.
- **0.3.0** — Declared type/side_effects/agency + calibration:
  deterministic-dominant (ADR-0025; safety guardrail, high failure cost).
  Named the bounded judgment (the table is a floor, not a whitelist).
