---
name: modelling-system-behaviour
description: >
  Use when the behaviour a system owes its users must be modelled in UML —
  a use case diagram naming who wants what and where the system boundary
  falls, or a sequence diagram fixing the order of messages between an actor
  and the parts that serve them. Covers the components, the notation rules,
  the include/extend traps, combined fragments, and the cross-check that the
  actors in a sequence are the actors someone actually agreed to. Produces
  `.puml` sources plus renders. Not for BPMN process models and not for
  architecture pictures. Triggers: "use case diagram", "diagram use case",
  "sequence diagram", "diagram sekuens", "UML", "plantuml", "aktor sistem",
  "skenario interaksi", "message flow", "lifeline", "diagram interaksi",
  "siapa saja aktornya", "boundary sistem".
allowed-tools: Read Grep Glob Write Edit Bash Skill
metadata:
  dstack:
    version: 0.1.0
    type: hybrid
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 4500
    triggers:
      - modelling system behaviour
      - use case diagram
      - diagram use case
      - sequence diagram
      - diagram sekuens
      - plantuml
      - uml
      - aktor sistem
      - skenario interaksi
      - diagram interaksi
---
# /modelling-system-behaviour

A use case diagram says who wants what from the system and where the system
stops. A sequence diagram says, for one of those wants, what happens in what
order and who waits for whom. They are one skill because they share one actor
set, and the moment they stop sharing it, one of them is wrong.

```
ONE ACTOR SET ACROSS BOTH MODELS.
PLANTUML EXITS 0 ON A SYNTAX ERROR — A RENDER PROVES NOTHING UNTIL IT IS CHECKED.
```

The second law is measured, not cautious: a file broken on purpose rendered to
a 1,963-byte SVG containing the text `A A`, with exit status 0 and nothing on
stderr. A malformed message line is dropped and the rest of the diagram renders
as though it were complete.

## When to use — and when not

| Instead of this skill | Use |
|---|---|
| A process with roles, hand-offs and approvals | `/modelling-business-processes` — that is BPMN, not UML |
| What talks to what, structurally | `/diagramming-architecture` |
| A quick interaction fence inside a spec | `/writing-specs` — its Mermaid `sequenceDiagram` is enough |
| Nobody has agreed who the actors are | `/discovering-requirements` first — this skill consumes an actor list, it does not invent one |

A sequence diagram of *internal* calls with no actor is an architecture picture
wearing UML notation. Send it to `/diagramming-architecture` instead.

## Stage 0 — inputs

| Input | Source | If missing |
|---|---|---|
| The system boundary, in one sentence | the spec | stop — without it, every use case is arguably in scope |
| The actor list | discovery's actor table | stop — do not invent actors; an unnamed actor is a finding |
| The goals each actor has | requirements | stop |
| Which scenarios need a sequence | your judgment, stated | default: the goal with the most branches, plus one failure path |
| Output root | `docs/models/<slug>/` | a user or repo preference overrides |

## The probe

```bash
node --version >/dev/null 2>&1 && echo tool-ok || echo NO-TOOL
java -version   >/dev/null 2>&1 && echo jre-ok  || echo NO-JRE
```

`node-plantuml` runs the PlantUML jar on the local JRE. Either missing resolves
to **`no-render`**: the `.puml` sources and every source-level check still run,
and each image row reads `n/a` with its reason. `no-render` never blocks the
`.puml`, which is the artifact a person opens and edits.

## The stages — each gate can refuse

Every gate writes one row: *stage · PASS / BLOCKED / `n/a` · evidence*. **A PASS
with an empty evidence cell is not a PASS.**

### 1. Frame — the boundary and the actor set

Name the system, then list the actors *outside* it. An actor is whoever or
whatever the system serves or depends on: a person in a role, another system, a
scheduler. It is never a component of the system being drawn.

Write the actor set down once. Both models below use it and nothing else.

**Gate:** the boundary is one sentence; every actor traces to the requirements.

### 2. Use case model — one file

One `rectangle` naming the system, the use cases inside it, the actors outside,
associations across the line. Rules, the include/extend trap, and the
decomposition failure that produces forty tiny use cases are in
`references/use-case.md`. Three that decide whether the model is worth anything:

- **A use case is a goal, not a step.** `Submit application` is a goal;
  `Click submit`, `Validate field`, `Open form` are steps of it.
- **Every use case sits inside the boundary; every actor sits outside it.**
  A use case drawn loose has no declared scope.
- **`<<include>>` and `<<extend>>` point in opposite directions.** Getting this
  backwards is the single most common error in the notation.

**Gate:** every actor is associated with at least one use case; every use case
is inside the rectangle.

### 3. Sequence models — one file per scenario

One `.puml` per scenario, named for the use case it realises. Draw the main
success path and **at least one thing going wrong** — a rejection, a timeout, a
refusal. Components, fragments, and the activation rules are in
`references/sequence.md`.

- **Declare every lifeline.** PlantUML silently invents one for any undeclared
  name, so a typo becomes a participant nobody notices.
- **`alt` means two or more branches**; one branch is `opt`. Readers rely on it.
- **A return is a dashed arrow**, and only where the caller actually waits.

**Gate:** every lifeline is declared; every actor in the file is in the stage-1
actor set.

### 4. Check the source — before any render

```bash
python3 scripts/check_uml.py docs/models/<slug>/
```

It reports: undeclared lifelines, unbalanced fragments and activations, `alt`
with one branch, arrows with no target, use cases outside the boundary, actors
associated with nothing, one-word use cases, and — the reason both models live
here — any actor driving a sequence that appears in no use case model.

**Gate:** the checker ran and every finding is listed with the element named.
Exit **2** is BLOCKED, not a pass.

### 5. Render, then check again

```bash
npx --yes node-plantuml@latest generate <name>.puml -s -o <name>.svg
```

Then **re-run the checker**. With an `.svg` beside each `.puml` it round-trips
every declared label and every plain message label through the rendered text.
This is the only defence against the silent-error behaviour, because the exit
code is always 0.

A render that is missing a label the source declares means the render is stale
or the source is broken. Fix it; do not ship the pair.

**Gate:** every declared output has a verdict, and the post-render check ran.

### 6. Hand back

Report: the boundary, the actor set, the use cases, which scenarios got a
sequence and which did not and why, the checker's findings, and which files
exist.

**Gate:** the report claims no file that is not on disk.

## Output

`docs/models/<slug>/` — `use-cases.puml` plus one `seq-<scenario>.puml` per
scenario, with renders beside them. Report in chat as: boundary, actors, use
cases, scenarios drawn and skipped, checker findings. Not the files.

## Judgment

Two calls are yours. **Which scenarios earn a sequence diagram** — one per use
case is a rule that produces twenty diagrams nobody reads; draw the ones where
the *ordering* is the thing in doubt, and say which you skipped and why. And
**where the boundary falls**: putting a payment provider inside it makes its
failures invisible, putting it outside makes them a modelled actor with a
timeout. That choice is the design, not a drawing decision.

## Badly and well

> Ask: "bikin use case diagram untuk modul pengajuan izin"

| | |
|---|---|
| ✗ | Twelve bubbles — `Login`, `Open form`, `Fill data`, `Click submit`, `Validate`, `Save` — no rectangle, one actor named `User`, arrows in both directions. That is a flowchart drawn with use case shapes. |
| ✓ | Rectangle `Permit application`. Actors `Applicant`, `Reviewer`, `Payment provider`. Use cases `Submit application`, `Review application`, `Pay permit fee`; `Pay permit fee` `<<include>>`s `Settle payment`. Three goals, each one an actor would name if asked what they came to do. |

## Red flags

| Thought | Reality |
|---|---|
| "It rendered, so it's fine" | Measured: exit 0 with a broken file, and a 1,963-byte SVG reading `A A`. Run the checker after rendering. |
| "Login is a use case" | It is a precondition of every use case. Model it once or not at all; it is never the goal an actor came for. |
| "One use case per screen" | Screens are how a goal is served today. A use case survives a redesign. |
| "`<<extend>>` points from base to extension" | Backwards. The extension points at the base it extends. |
| "The lifeline names are obvious" | PlantUML invents one for any undeclared name. A typo becomes a silent participant. |
| "Every use case needs a sequence diagram" | Draw the ones where ordering is in doubt. Say which you skipped. |
| "The sequence has a new actor, I'll just add it" | Then the use case model is wrong, or the actor is not an actor. Fix the model, not the drawing. |
| "Mermaid would be quicker" | Mermaid has no use case diagram at all, and no combined fragments. Fine inside a spec; not for a model that must hold. |

## Hand-off

Input from `/discovering-requirements` — its actor table *is* the actor set, and
copying it is what makes the cross-check meaningful. Sequence diagrams feed
`/writing-specs` §interaction and `/designing-test-cases`, where each alternate
path is already a test case waiting to be named.

## Bundled files

- `references/use-case.md` — components, association rules, include/extend/
  generalization, the decomposition failure, and the textual use case that
  belongs beside the picture.
- `references/sequence.md` — lifelines, message kinds, activation, combined
  fragments, and the ordering mistakes a render does not expose.
- `scripts/check_uml.py` — source and render checks. Exit 0 clean, 1 findings,
  2 unreadable.

## Changes

- **0.1.0** — Initial. Built after measuring that **PlantUML exits 0 on a syntax
  error and writes a plausible SVG** — a deliberately broken file produced 1,963
  bytes reading `A A` — which is why rendering is followed by a round-trip check
  rather than trusted. A second measurement shaped the checker: a malformed
  message line is *dropped* and the rest renders intact, so the round-trip alone
  cannot see it and a source-level dangling-arrow check exists too. Use case and
  sequence share one skill because the cross-model actor check — an actor
  driving a sequence but named in no use case model — only exists if they do.
