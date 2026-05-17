---
name: uses-missing
description: Fixture whose includes field points at a file that does not exist.
allowed-tools: Read
metadata:
  dstack:
    version: 1.0.0
    context_budget_tokens: 1000
    includes:
      - _shared/does-not-exist.md
---
Body for the missing-include fixture.
