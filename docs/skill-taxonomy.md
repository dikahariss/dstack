# Skill taxonomy

A reference document for classifying skills and choosing how to build a
new one. This document is not an Architecture Decision Record (ADR). It
describes categories. ADRs make specific decisions that may use these
categories.

## How to read this document

- **Part 1** defines the primary axis: how the work is performed. Four
  parallel types live on this axis.
- **Part 2** describes orthogonal axes. "Orthogonal" means independent.
  Every skill picks one value on each orthogonal axis, regardless of its
  type from Part 1.
- **Part 3** is the decision framework. It is an ordered list of questions
  that points to the right type.
- **Part 4** is a comparison table for the four types.
- **Part 5** lists patterns to avoid, with reasons.
- **Part 6** lists what would change in dstack if this taxonomy were
  adopted in `skill.yaml`. These changes are not yet committed. They
  require new ADRs before being implemented.

## Glossary

Terms used throughout this document.

| Term | Definition |
|---|---|
| Skill | A package of behavior that an AI coding agent (Claude Code) can invoke as a slash command. Stored as `skill.yaml` and `prompt.md` in `skills/<id>/`. |
| LLM | Large Language Model. Generates text from a prompt. Example: Claude, GPT, Gemini. |
| Prompt | The text instructions given to an LLM. |
| Deterministic | Code that produces the same output for the same input every time. No LLM involved. |
| Semantic | A skill that uses an LLM to produce output. |
| Schema | A formal description of the shape of structured data. JSON Schema is one common format. |
| Tool use | A feature where the LLM produces output matching a predefined schema instead of free text. Also called "function calling" or "structured output." |
| Side effect | A change the skill makes to something outside itself: file content, git state, external API, etc. |
| Agent | A program that uses an LLM in a loop to take actions toward a goal. |
| Sub-agent | A second agent spawned by a skill or another agent, with bounded context. |
| Hook | A function that runs automatically when another event happens. Example: Claude Code's PreToolUse hook runs before any tool call. |
| RAG | Retrieval-Augmented Generation. The skill fetches information from a database or document store and includes it in the prompt. |

---

## Part 1 — Computation model axis

This axis answers one question: **how is the work performed?** There are
four parallel types.

### Type 1: Deterministic

The skill performs its work entirely through code. No LLM is involved
at runtime.

- Input goes into a function. Output comes out. The same input always
  produces the same output.
- Examples: a script that bumps a version number, a script that parses
  YAML, a script that calls `git push`, a regex check that validates an
  email address.

### Type 2: Open-ended Semantic

The skill uses an LLM. The LLM produces prose (free text) without any
output structure enforced by code.

- The LLM reads the prompt and writes text in response.
- Examples: a skill that brainstorms product ideas, a skill that writes
  a weekly retrospective, a skill that summarizes a document, a skill
  that explains a concept.

The term "Open-ended" means: the LLM is free to produce any text. There
is no schema constraining the output.

### Type 3: Hybrid

The skill uses both code and LLM in coordination. Code prepares input
and validates output; the LLM does the reasoning in the middle.

- Pattern: `code reads state → LLM reasons → code validates → code acts`.
- Example: `/responding-to-review` reads the diff with a script (code), reasons
  about each review comment (LLM), then edits files and replies (code).
- Most production skills fall into this type.

### Type 4: Schema-constrained Semantic

The skill uses an LLM, but the LLM is required to produce output that
matches a defined schema (usually JSON Schema). The LLM is not free to
produce arbitrary prose.

- The LLM reads the prompt and emits structured data. The host (Claude
  Code, OpenAI, etc.) enforces the structure.
- Examples: a classifier that emits `{label: "bug" or "feature",
  confidence: number between 0 and 1}`. An extractor that emits
  `{title: string, due_date: ISO-date-string, owner: string}`.

This type became practical after 2023, when Anthropic, OpenAI, and Google
shipped reliable tool use / structured output features. Before that,
people parsed LLM prose with regular expressions, which was fragile.

Schema-constrained Semantic is not a subtype of Hybrid. In Hybrid, the
LLM produces prose that code then interprets. In Schema-constrained, the
LLM produces the structured data directly.

### Examples

| Skill or code path | Type |
|---|---|
| A CLI command that reads or writes a config file | Deterministic |
| `/managing-version` (read or bump the VERSION file) | Deterministic |
| `/brainstorm` (interview the user, walk the decision tree) | Open-ended Semantic |
| `/debugging` (root-cause investigation, no fixed output shape) | Open-ended Semantic |
| `/responding-to-review` (script fetches the diff, LLM reasons, code edits) | Hybrid |
| `/classify-issue` (emit a structured triage record) | Schema-constrained Semantic |
| A prompt-injection classifier with a fixed label set | Schema-constrained Semantic |

### Computation type is not the calibration doctrine

The four types answer *how work runs* (code vs LLM). They are distinct
from the **calibration** axis ([ADR-0025](adr/0025-hybrid-by-default-doctrine.md)):
how much freedom the prompt gives the agent (judgment-dominant → workflow
→ deterministic-dominant → schema-meta). A `type: semantic` skill normally
still has a deterministic spine. Do not set `type: hybrid` to satisfy the
doctrine; the doctrine is satisfied by body structure + the `calibration`
flag, not the type enum.

---

## Part 2 — Orthogonal axes

Every skill makes a choice on each axis below, regardless of its Part 1
type. The choices on these axes are independent of each other and of
Part 1.

### Axis A — Knowledge source

Where the skill gets the information it needs.

| Choice | Meaning |
|---|---|
| Self-contained | All required information is in the skill's code or prompt. The skill does not call any tools to fetch information. |
| Tool-using | The skill calls tools such as Bash, Read, or Edit to fetch information at runtime. |
| RAG | The skill searches an external source (vector database, document collection, web) for information. |
| Mixed | Combination of the above. Most common in practice. |

### Axis B — Temporal pattern

When and for how long the skill runs.

| Choice | Meaning |
|---|---|
| One-shot synchronous | The user invokes the skill. It runs to completion in one turn. Then it stops. |
| Multi-turn conversational | The skill runs across several turns of user-skill dialog. Example: `/brainstorm`. |
| Asynchronous | The skill starts, returns immediately, and delivers its result later. |
| Continuous loop | The skill runs in the background indefinitely. Example: a background deploy monitor (hypothetical; dstack ships none). |
| Event-driven | The skill activates automatically when some other event fires. Example: a PreToolUse hook on `/guarding-destructive-commands` that activates before each Bash tool call (not yet supported in dstack — see DEFERRED.md D2). |

### Axis C — Coordination pattern

How the skill works with other skills or agents.

| Choice | Meaning |
|---|---|
| Solo | The skill runs by itself. |
| Pipeline | A sequence of skills runs in order. Output of A becomes input of B, then B's output becomes input of C. |
| Fan-out | The skill spawns several sub-agents in parallel. It waits for all to finish, then aggregates results. Example: `/dispatching-parallel-agents` runs one sub-agent per independent failure in parallel. |
| Sub-agent delegation | The skill spawns one sub-agent with limited context. Used when the sub-task should not see the parent's full context, for security or focus reasons. |

### Axis D — Statefulness

Whether the skill remembers anything between invocations.

| Choice | Meaning |
|---|---|
| Stateless | Each invocation is independent. The skill remembers nothing from previous runs. |
| Session-stateful | The skill remembers data during one user session. When the session ends, the memory is gone. |
| Cross-session stateful | The skill saves data to a file or database. Future invocations can read this data. Example: `/context-save` writes to disk; `/context-restore` reads from disk. |

### Axis E — Agency level

How much the skill decides on its own.

| Choice | Meaning |
|---|---|
| Reactive | The skill responds to each user instruction. The user controls every step. |
| Deliberative | The skill plans the next steps, asks the user for confirmation, then executes. |
| Autonomous | The skill loops on its own until it reaches a goal or hits a timeout. It does not pause for user confirmation. |

### Axis F — Side-effect profile

What the skill changes in the world.

| Choice | Meaning |
|---|---|
| Read-only | The skill changes nothing. It only reads and reports. Examples: `/verifying-before-done`, `/classify-issue`. |
| Local mutating | The skill changes files in the current project. Example: `/managing-version` edits the VERSION file. |
| External mutating | The skill changes state outside the project. Examples: pushing a pull request to GitHub, deploying to production, calling an external API. |

### Worked example: skill `/ship` (hypothetical)

`/ship` is a hypothetical skill — not in the dstack catalog — used here
only to show all seven axes decided at once. It picks one choice per axis.

| Axis | Choice for `/ship` |
|---|---|
| Computation type (Part 1) | Hybrid |
| Knowledge source (A) | Tool-using (git, gh CLI) |
| Temporal pattern (B) | One-shot synchronous |
| Coordination (C) | Solo (may spawn a sub-agent for code review) |
| Statefulness (D) | Stateless (the data lives in git, not in skill memory) |
| Agency (E) | Deliberative (plan, confirm with user, execute) |
| Side-effect profile (F) | External mutating (pushes branch to remote) |

A designer who picks only one axis ("this is Hybrid") leaves the other
six axes undecided. The taxonomy exists to force explicit choices on all
seven.

---

## Part 3 — Decision framework

A sequence of questions. Answer them in order to arrive at the right
computation type.

### Question 1: Can the task be written as plain code (if/else, regex, parser)?

If yes, choose **Deterministic**. Do not use an LLM for work that code
can do. Reasons:

- Code runs in milliseconds. LLM calls take seconds.
- Code has zero cost per run. LLM calls cost money.
- Code with no LLM cannot hallucinate. LLMs sometimes invent wrong
  answers.

Common mistake: validating YAML format with an LLM. Wrong choice. Use a
YAML parser. Use an LLM only if the YAML is valid but the field contents
need human-style judgment (example: "is this description clear?").

### Question 2: Does the output need a defined structure?

If yes, and reasoning is required, choose **Schema-constrained Semantic**.

Do not parse LLM prose with regular expressions. Use tool use or
structured output instead. The LLM is then forced to produce valid
structured data.

Example: to classify a ticket as a bug or feature, define a schema:
`{type: "bug" or "feature", confidence: number, reasoning: string}`.
The LLM emits this directly. The result is parseable by code without
regex.

### Question 3: Is there ground truth outside the LLM?

"Ground truth" means: a source of facts the skill can read, separate
from the LLM. Examples of ground truth: the filesystem, git state, an
API response, a database row.

If yes, default to **Hybrid**. Pattern:

```
code reads ground truth →
LLM reasons about the situation →
code validates the LLM's output →
code performs the action
```

Code on both ends protects the system from LLM errors. Without code at
the start, the LLM might miss a fact. Without code at the end, the LLM
might cause a bad change.

### Question 4: Is the task primarily creative writing or judgment?

If the main job is to generate prose for a human to read, and no action
or structured data is required, choose **Open-ended Semantic**.

Examples: brainstorming, writing a retrospective, explaining a concept,
summarizing a long document.

### Final check: failure cost

Ask: "If this skill silently produces a wrong result, what is the cost?"

| Failure cost | Push toward |
|---|---|
| "The suggestion is mediocre." | Open-ended Semantic is acceptable. |
| "Downstream code takes the wrong action because of misclassification." | Schema-constrained Semantic. |
| "A file is edited incorrectly." | Hybrid with validation before write. |
| "Production goes down, or data is lost." | Use Deterministic where possible. Minimize LLM responsibility. |

The most dangerous combination is: External-mutating side effects +
Autonomous agency + Open-ended Semantic computation. This combination
almost always causes incidents. To make it safe, demote at least one
axis: require user confirmation (Deliberative), or constrain output to
a schema (Schema-constrained), or remove the external mutation.

---

## Part 4 — Comparison table

A descriptive scale, low to high, for each dimension.

| Dimension | Deterministic | Open-ended Sem | Hybrid | Schema-constr Sem |
|---|---|---|---|---|
| Predictability | Very high | Low | Medium | High |
| Speed | Very high | Low | Medium | Low |
| Cost per run | Near zero | High | Medium | High |
| Capability ceiling | Low | Very high | Very high | High |
| Maintainability | High | Low (prompt drift) | Medium | Medium |
| Testability | Very high | Low (needs LLM-judge) | Medium | High (schema validate) |
| Auditability | Very high | Low | Medium | Medium |
| Versionability | Very high | Low | Medium | Medium |

Notes:

- "Cost per run" measures how much money one invocation spends on LLM
  calls. Code with no LLM costs nothing. An LLM call costs money even
  if the output is short.
- "Capability ceiling" measures how complex a task this type can handle.
  Deterministic code is limited to what humans can program explicitly.
  LLMs handle vague tasks that have no exact algorithm.
- "Prompt drift" means: a prompt that worked yesterday may stop working
  after the model is updated. Code does not have this problem.
- Schema-constrained Semantic has the same Speed cost as Open-ended
  Semantic because an LLM call still runs. The savings appear elsewhere:
  the output does not need retries to be valid.

---

## Part 5 — Anti-patterns

Common mistakes when choosing a computation type.

### Anti-pattern 1: Using an LLM where regex would work

The skill uses an LLM to do work a regular expression can do.

Bad pattern:

```
Prompt to LLM: "Is this string a valid email? Answer yes or no."
```

Good pattern:

```
Code: regex_check(/^[^@]+@[^@]+\.[^@]+$/, input_string)
```

Why this is wrong: the LLM is slower, costs money, and may eventually
return a wrong answer for an unusual input. The regex is faster, free,
and never produces a hallucinated answer.

### Anti-pattern 2: Claiming "Hybrid" when the skill is actually Open-ended

A skill is labeled Hybrid because it runs one Bash command (`git status`)
and then passes everything to the LLM with no validation. This is not
Hybrid. It is Open-ended Semantic with one tool call.

Real Hybrid has code at **both ends**: code prepares input before the
LLM call, and code validates the LLM's output before any side effect.

### Anti-pattern 3: Schemas that allow too much

A schema like `{result: string}` is barely better than no schema. The
LLM can write anything inside the string.

Bad pattern:

```
{result: string}
```

Good pattern:

```
{
  classification: "bug" or "feature" or "chore",
  priority: 1 or 2 or 3 or 4 or 5,
  reasoning: string
}
```

The good schema uses an enumerated list of allowed values and a numeric
range. The LLM cannot return something outside these constraints.

### Anti-pattern 4: Choosing Open-ended Semantic too early

A developer says "this task is complex, so I will use the LLM for
everything." This skips two cheaper options.

The correct order to try:

1. Try Deterministic first. Can the task be coded?
2. If no, try Schema-constrained Semantic. Can the output be structured?
3. If no, try Hybrid. Can code wrap the LLM call?
4. If no, then Open-ended Semantic.

Many tasks that appear to need an LLM turn out to be solvable with a
lookup table and some if-else logic.

### Anti-pattern 5: Autonomous + Open-ended + External-mutating

This combination is dangerous and almost always causes incidents. The
skill loops on its own, generates free text, and changes things outside
the project.

Rule: any skill with External-mutating side effects must be either
Deliberative (the user confirms at least one action) or Schema-constrained
(every action is validated against a schema before it runs).

### Anti-pattern 6: Replacing working code with an LLM "to be smart"

A developer refactors `if (x > 5) doA() else doB()` into an LLM prompt.

This change reduces capability, raises cost, and reduces reliability.
Only replace code with an LLM call when a new requirement appears that
the if/else cannot handle.

---

## Part 6 — Implications for dstack architecture

Section 6.1 (the `type`/`side_effects`/`agency` fields) has since been
adopted by [ADR-0015](adr/0015-type-taxonomy-adoption.md) and is live in
[skill-spec.md](specs/skill-spec.md). The `calibration` field
([ADR-0025](adr/0025-hybrid-by-default-doctrine.md)) is a separate axis,
also live. Subsections 6.2–6.5 remain proposals; each needs its own ADR.

### 6.1 New fields in `skill.yaml`

If the taxonomy is adopted, `skill.yaml` would gain new fields:

```yaml
# Primary axis (Part 1)
type: hybrid | deterministic | semantic | schema-semantic

# Orthogonal axes that matter for safety
side_effects: readonly | local | external
agency: reactive | deliberative | autonomous
```

Other orthogonal axes (knowledge source, temporal, coordination,
statefulness) would be added only when a real use case requires them
for automated decisions, such as CI gates or billing.

### 6.2 CI gate driven by the taxonomy

A CI check could reject or warn on dangerous combinations:

```
Reject in CI:
  type == "semantic"
  AND side_effects == "external"
  AND agency == "autonomous"

Warn in CI:
  type == "semantic" AND side_effects == "external"
  agency == "autonomous" AND side_effects is not "readonly"
```

This could be added alongside milestone M4 (`dstack validate`) in the
roadmap, or as its own milestone.

### 6.3 Renderer support for Schema-constrained Semantic

To support Schema-constrained Semantic skills, the renderer would need
new behavior:

- `skill.yaml` may declare `output_schema: <JSON Schema>`.
- The renderer embeds the schema into the rendered output as instructions
  the Claude Code harness can parse. Or, where the host supports it, the
  renderer emits an MCP tool definition.
- The Claude Code harness then forces the LLM to produce output matching
  the schema.

This change is non-trivial. It is not in the v1 roadmap today. Add it
when the first skill that needs a schema output appears.

### 6.4 Implications for testing

Today's test tiers are: Unit, Contract, Integration. If the taxonomy is
adopted, each computation type gets its own test strategy:

| Computation type | Test strategy |
|---|---|
| Deterministic | Unit tests and property-based tests. |
| Schema-constrained Semantic | Schema-validation tests. The LLM call is replaced by a fake that returns canned text. A real validator checks the schema. |
| Hybrid | Integration tests with a fake LLM that returns scripted responses for each call. |
| Open-ended Semantic | LLM-judge evaluation. This is expensive and is deferred per ADR-0009. |

### 6.5 Implications for skill documentation

The shipped `dstack list` command (ROADMAP M7) could be extended to
group its output by computation type. The user would then see the
catalog's profile at a glance: how many Deterministic, how many Hybrid,
and so on. Today the column set is fixed; adding a `--group-by type`
flag is a small follow-up if the grouping becomes useful.

---

## Cross-references

### Specifications (where taxonomy may eventually appear in code)

- [specs/skill-spec.md](specs/skill-spec.md) — the `skill.yaml` format.
  Section 6.1 of this document describes how the taxonomy would extend
  this schema if formally adopted.
- [specs/host-spec.md](specs/host-spec.md) — the host contract, including
  the tool registry. Taxonomy classifies skills by computation type;
  some computation types may become host-supported features (such as
  schema-constrained output via tool use).
- [specs/render-spec.md](specs/render-spec.md) — the render pipeline.
  Section "Computation type and the renderer" explains how the
  renderer would behave differently per type if the schema gains a
  `type` field.
- [specs/install-spec.md](specs/install-spec.md) — the install
  contract. Side-effect profile (Axis F in this document) is related
  to where installed output ends up.

### Architecture Decision Records

- [ADR-0003](adr/0003-skill-as-data.md) — why skills are not built on a
  template engine. Relevant to Section 1 (computation types) because
  templates would themselves be a hidden computation step.
- [ADR-0004](adr/0004-no-template-engine-v0.md) — the operational
  consequence of ADR-0003. Same relevance as above.
- [ADR-0009](adr/0009-spec-driven-skills.md) — the existing skill
  contract (tools, inputs, outputs). Section 6.1 describes how to
  extend this with taxonomy fields.
- [ADR-0010](adr/0010-context-budget.md) — relevant for Semantic and
  Hybrid skills, which consume more tokens than Deterministic ones.

### Layer READMEs

- [`src/domain/README.md`](../src/domain/README.md) — the domain layer
  has no computation type of its own; it defines the types that allow
  taxonomy fields to exist later.
- [`src/application/README.md`](../src/application/README.md) — use
  cases would dispatch to different rendering behavior if the taxonomy
  were adopted.
- [`src/adapters/claude-code/README.md`](../src/adapters/claude-code/README.md)
  — Schema-constrained Semantic skills (taxonomy Type 4) would require
  Claude Code's tool use feature, which is host-specific.

### Plan documents

- [`docs/plans/v1/DEFERRED.md`](plans/v1/DEFERRED.md) entry D3 — LLM-judge
  evaluation, the test strategy for Open-ended Semantic skills.
- [`docs/plans/v1/ROADMAP.md`](plans/v1/ROADMAP.md) — M3 (includes)
  matters for any type that composes shared content. M5 (warning
  surfacing, already shipped) helps users notice when their
  classification is wrong.

## One-paragraph summary

A skill has two kinds of design decisions. First: how does the work get
done? Choose one of Deterministic, Open-ended Semantic, Hybrid, or
Schema-constrained Semantic (Part 1). Second: how does the skill behave
across six other axes — knowledge source, temporal pattern, coordination,
statefulness, agency, side-effect profile (Part 2)? Decide both kinds
explicitly. For production skills, the safe default is Hybrid plus
Deliberative agency plus code validation before any side effect.
