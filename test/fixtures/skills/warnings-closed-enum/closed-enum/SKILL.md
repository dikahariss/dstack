---
name: closed-enum
description: A skill whose body enumerates four items and never says whether the list is open, used to exercise the closed-enumeration warning.
allowed-tools: Read
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    context_budget_tokens: 1000
---
# /closed-enum

Check the input against each category:

1. Numeric out of range.
2. String too long.
3. Null where a value is required.
4. Wrong type entirely.

Report the category that matched.
