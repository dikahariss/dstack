---
name: version
description: Read or bump the project VERSION file deterministically. Use when the user asks to "show version", "bump version", "release X.Y.Z", or "what version are we on".
allowed-tools: Bash Read
metadata:
  dstack:
    type: deterministic
    version: 0.1.0
    context_budget_tokens: 1000
    side_effects: local
    agency: reactive
    triggers:
      - show version
      - bump version
      - release version
      - what version
---
# /version

Show or bump the project's VERSION file. The script in `scripts/` does
the real work — your job is to pick which subcommand to run and pass
through the user's intent.

## Decide which script invocation fits

Use `scripts/version.sh` with one of these subcommands. Do not invent
a different procedure.

| User intent                         | Command                          |
|-------------------------------------|----------------------------------|
| Show the current version            | `scripts/version.sh show`        |
| Bump the patch (e.g. 1.2.3 -> 1.2.4)| `scripts/version.sh bump patch`  |
| Bump the minor                      | `scripts/version.sh bump minor`  |
| Bump the major                      | `scripts/version.sh bump major`  |
| Set an explicit version             | `scripts/version.sh set X.Y.Z`   |

Run the chosen command via the `Bash` tool, then print the resulting
version to the user. Do not edit `VERSION` directly with `Edit` — the
script is the single source of truth.
