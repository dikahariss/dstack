---
name: uses-dupe
description: |
  Fixture that names the same include twice; the second reference must
  trigger an include-cycle-broken warning rather than re-including.
allowed-tools: Read
metadata:
  dstack:
    version: 1.0.0
    context_budget_tokens: 1000
    includes:
      - _shared/preamble.md
      - _shared/preamble.md
---
Body for the duplicate-includes fixture.
