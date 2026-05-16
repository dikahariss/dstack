# /careful — Destructive Command Guardrails

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

A future dstack ADR will decide whether to add hooks. The trade-off
is real: hooks are powerful, but they also add runtime complexity
dstack has so far avoided. See `docs/plans/v1/DEFERRED.md` entry D2
for the current status of hook support.
