---
name: wrapped-marker
description: A skill whose openness marker straddles a line break, the way Markdown prose actually wraps, used to prove the closed-enumeration detector is not defeated by a newline.
allowed-tools: Read
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    context_budget_tokens: 1000
---
# /wrapped-marker

Check the input against each category:

1. Numeric out of range.
2. String too long.
3. Null where a value is required.
4. Wrong type entirely.

Filled cards live in the reference — a library, **not
exhaustive**. Add any category the input actually shows and say why it belongs.
