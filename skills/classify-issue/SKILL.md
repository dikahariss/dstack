---
name: classify-issue
description: Classifies a bug report, feature request, or chore into a structured triage record. Use when the user pastes an issue body and asks to "triage this", "classify this issue", or "what kind of issue is this".
allowed-tools: Read
metadata:
  dstack:
    type: schema-semantic
    version: 0.2.1
    context_budget_tokens: 1500
    side_effects: readonly
    agency: deliberative
    calibration: schema-meta
    triggers:
      - triage this
      - classify issue
      - what kind of issue
      - issue classification
    output_schema:
      type: object
      required: [kind, severity, area, reasoning]
      additionalProperties: false
      properties:
        kind:
          type: string
          enum: [bug, feature, chore, question, regression]
          description: The top-level kind of issue.
        severity:
          type: integer
          minimum: 1
          maximum: 5
          description: 1 = trivial, 5 = production-down.
        area:
          type: string
          minLength: 2
          maxLength: 32
          description: A short kebab-case label for the affected area (e.g. "auth", "billing").
        reasoning:
          type: string
          minLength: 16
          description: Two or three sentences explaining the classification.
        duplicates:
          type: array
          items:
            type: string
            pattern: "^#[0-9]+$"
          description: Optional list of related issue numbers.
---
# /classify-issue

Read the issue text the user pasted (or pointed at) and emit a single
JSON object matching the schema in this skill's frontmatter. Do not
add commentary outside the JSON.

The schema constrains the *shape* of the answer; `kind`, `severity`, and
`area` remain your judgment call — the format is fixed, the classification
is yours.

## Procedure

1. Read the issue body carefully. If important context is missing,
   ask one clarifying question before classifying.
2. Pick a `kind` from the enum. If the issue is mostly "how do I…",
   choose `question`. If it used to work and stopped, choose
   `regression`.
3. Rate `severity` from 1 to 5:
   - 1: cosmetic typo, docs-only nit
   - 2: minor inconvenience, easy workaround
   - 3: feature broken for some users, no data loss
   - 4: feature broken for everyone, or visible data integrity risk
   - 5: production-down or active data loss
4. Choose a short `area` label (kebab-case, ≤ 32 chars). Reuse common
   areas across issues — invent a new label only when none fits.
5. Write `reasoning` as two or three sentences. Reference the
   strongest evidence from the issue.
6. List related issues in `duplicates` only when you actually
   recognised them — never speculate.

## Misclassification traps

The `kind` enum is **closed by design** — downstream consumers parse it, so a
seventh value breaks them; force the issue into the nearest one and say why in
`reasoning`. The traps below are **not exhaustive**.

| Looks like | Actually | Why |
|---|---|---|
| Feature request phrased as a bug ("X is broken, it won't Y") | `feature` | Y never existed; it is a new capability, not a defect. |
| Worked before, stopped after a change | `regression` | A defect that used to pass is a regression — note the suspected cause. |
| "How do I…" with no defect | `question` | No code change is implied; do not file as `bug`. |
| One-off maintenance (bump dep, rename) | `chore` | No user-visible behavior change. |

## Output

Emit exactly one JSON object. No prose before or after. Example
shape:

```json
{
  "kind": "bug",
  "severity": 4,
  "area": "auth",
  "reasoning": "Users report being logged out after every page reload since v1.4. The session cookie path changed in #812.",
  "duplicates": ["#812"]
}
```

If the JSON is invalid against the schema, the downstream tooling
will reject it. Triple-check enum values and `area` length before
returning.

## Changes

- **0.2.1** — ADR-0030 list openness: the kind enum is closed by design (consumers parse it, so a seventh value breaks them); the misclassification traps are open.
- **0.2.0** — calibration: schema-meta (ADR-0025; determinism is the
  output schema, not a procedure). Named the judgment (kind/severity/area
  are your call; the schema fixes the shape). Added a misclassification
  traps table.
- **0.1.0** — Initial schema-semantic triage skill.
