---
name: open-enum
description: A skill whose body enumerates four items and declares the list open, used to prove the closed-enumeration warning stays silent when a marker is present.
allowed-tools: Read
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    context_budget_tokens: 1000
---
# /open-enum

Check the input against each category:

1. Numeric out of range.
2. String too long.
3. Null where a value is required.
4. Wrong type entirely.

These four are a starting point, not a limit — this list is not exhaustive,
so add any category the input actually shows and say why it belongs.

Report the category that matched.
