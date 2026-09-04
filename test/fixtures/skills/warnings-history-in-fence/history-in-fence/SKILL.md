---
name: history-in-fence
description: A skill whose body shows a ## Changes heading only inside a fenced example, which must not trip the history-in-body warning.
allowed-tools: Read
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    context_budget_tokens: 1000
---
# /history-in-fence

Check the input, not exhaustive:

- Numeric out of range.
- String too long.
- Null where a value is required.

A changelog entry looks like this:

```markdown
## Changes

- **0.1.0** — Initial.
```

Report what matched.
