---
name: licensed
description: |
  Fixture that populates the optional license and compatibility fields
  added by ADR-0012. Used to verify both parser round-trip and renderer
  emission.
allowed-tools: Read
license: Apache-2.0
compatibility: Requires Bun 1.3+
metadata:
  dstack:
    version: 1.0.0
    context_budget_tokens: 1000
---
# /licensed

Fixture body. Not used for content assertions — only the frontmatter
fields license and compatibility are checked.
