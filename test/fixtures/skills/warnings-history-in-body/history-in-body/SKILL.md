---
name: history-in-body
description: A skill whose body still carries a ## Changes section, used to exercise the history-in-body warning.
allowed-tools: Read
metadata:
  dstack:
    version: 0.2.0
    type: semantic
    context_budget_tokens: 1000
---
# /history-in-body

Check the input, not exhaustive:

- Numeric out of range.
- String too long.
- Null where a value is required.

Report what matched.

## Changes

- **0.2.0** — Added the null check.
- **0.1.0** — Initial.
