# wireframing-interfaces implementation plan

**Goal:** a skill that turns the spec's step table into a rough picture of each
screen — one panel per state the spec names — rough enough that nobody mistakes
it for finished, and honest about every state it did not draw.

**Architecture:** one `SKILL.md` spine plus two bundled references — a shape and
fidelity catalogue, and the screen-set form. The drawing program is EXTERNAL and
probed, exactly as in its sibling. The spec's step table is the only input.

**Stack:** Markdown + YAML frontmatter. No runtime code, no new dependency.

**Implements:** `docs/specs/2026-07-29-wireframing-interfaces.md`
**Proven by:** `docs/tests/2026-07-29-wireframing-interfaces.md`

Execute task by task. Per task run the stated command and compare against the
expected output before ticking it. `/verifying-before-done` before any "done".

## File structure first

| File | Its one responsibility |
|---|---|
| `skills/wireframing-interfaces/SKILL.md` | the stage spine, the gates, the fidelity cap |
| `skills/wireframing-interfaces/references/shapes.md` | the permitted shape set and the fidelity ceiling, with the sink list |
| `skills/wireframing-interfaces/references/screen-set.md` | the output form: per-screen columns, state grid, `WF-n` scheme, trace rule |
| `skills/wireframing-interfaces/eval/cases.jsonl` | the behavioural anti-patterns |
| `skills/using-dstack/SKILL.md` + `references/skill-catalog.md` | registration |
| `skills/writing-specs/SKILL.md` | the reciprocal boundary |

`CMP-2` and `CMP-3` are independent (spec §3); tasks 2 and 3 in either order.

**Build this second.** It shares the probe *pattern* with
`diagramming-architecture` (spec §3 structural decision). Building that one
first means the probe wording is settled and this skill copies a proven form
rather than inventing a second one that drifts.

---

### Task 1: Scaffold and frontmatter

**Files:**
- Create: `skills/wireframing-interfaces/SKILL.md`

- [ ] **Step 1 — scaffold**

```bash
bun run new wireframing-interfaces
```

Expected: `created skill: wireframing-interfaces (type=semantic)`

- [ ] **Step 2 — write the frontmatter**

```yaml
name: wireframing-interfaces
description: >
  Use when a spec describes what a screen must do but nobody can see it yet —
  before implementation invents the layout, or when a stakeholder needs to
  check the flow rather than read a table of states. Draws one low-fidelity
  panel per state the spec names, and records every state it did not draw.
  Never decides colour, typeface, or spacing. Triggers: "wireframe", "mockup",
  "gambar layarnya", "rancangan tampilan", "sketsa UI", "low fidelity",
  "excalidraw", "draw.io", "drawio", "bagaimana tampilannya", "screen design".
allowed-tools: Read Grep Glob Write Edit Bash Skill
metadata:
  dstack:
    version: 0.1.0
    type: semantic
    calibration: deterministic-dominant
    side_effects: local
    agency: deliberative
    context_budget_tokens: 5000
```

Note the description says what it **never** does. That clause is load-bearing:
it is what stops the skill being invoked for visual design.

- [ ] **Step 3 — verify**

Run: `bun run validate 2>&1 | grep wireframing`
Expected: `wireframing-interfaces: OK (<n>/5000 tokens)`, no `ERR`

---

### Task 2: The shape and fidelity reference

**Files:**
- Create: `skills/wireframing-interfaces/references/shapes.md`

- [ ] **Step 1 — the permitted shape set**

The verified-offline shapes only: `mxgraph.mockup.containers.browserWindow`,
`mxgraph.mockup.forms.searchBox`, `.forms.button`, plus plain rectangle and
text. State the fallback rule: a shape unavailable becomes a plain rectangle
**plus a recorded note** — never a silent substitution (`R-1`).

- [ ] **Step 2 — the fidelity ceiling, as a universal negative**

No brand colour, no typeface choice, no spacing scale. List the sinks a scan
must cover, from test §3b: shape fill and stroke, text style attributes, any
embedded stylesheet, the embedded source XML, the exported image. Say plainly
that an absence scan passes against an artifact that draws nothing — which is
why the state-coverage cases are the ones that stop that.

- [ ] **Step 3 — the marker**

Every screen carries a visible "not visual design" marker. Give its exact text
so it is identical across artifacts and greppable.

- [ ] **Step 4 — verify**

Run: `bun run validate 2>&1 | grep wireframing` → token count unchanged from
Task 1, since bundled files are uncounted.

---

### Task 3: The screen-set form

**Files:**
- Create: `skills/wireframing-interfaces/references/screen-set.md`

- [ ] **Step 1 — the manifest schema**

From spec §4: `id`, `realises` (step + requirement IDs), `states drawn`,
`states skipped` with reasons, `fidelity marker`, `verdict per format`.

- [ ] **Step 2 — the state grid**

One panel per state the spec names, drawn from the five in
`writing-specs/references/spec-doc.md:241` — Empty, Loading, Partial, Denied,
Failed. A state the spec does not name is **skipped and recorded**, never
silently absent. That distinction is `AC-3`, the highest-ranked case.

- [ ] **Step 3 — the interactive test (syntactic)**

The step table has **no actor column**, so "has a human actor" is not derivable
from the declared input. A step counts as interactive when its **Fields and
validation** cell is non-empty; otherwise no screen is drawn and the reason is
recorded. An empty cell that nonetheless names a state is a spec defect — record
and ask, do not guess.

- [ ] **Step 4 — verify**

Run: `bun run validate 2>&1 | grep wireframing` → unchanged.

---

### Task 4: The SKILL.md body

**Files:**
- Modify: `skills/wireframing-interfaces/SKILL.md`

- [ ] **Step 1 — the two laws**

```
DRAW EVERY STATE THE SPEC NAMES, OR RECORD WHY NOT.
ROUGH ON PURPOSE — A PICTURE THAT LOOKS FINISHED STOPS THE ARGUMENT.
```

- [ ] **Step 2 — the stages, each with a gate**

Probe → Derive the screen list → Draw the states → Navigation → Manifest →
Hand back. Gate convention identical to the trio: PASS needs evidence, `n/a`
where the subject is absent, `BLOCKED` escalates and stamps dependents.

- [ ] **Step 3 — the input gate**

No step table → refuse and route to `/writing-specs`. Do not invent screens;
that is `TC-5`.

- [ ] **Step 4 — the judgment surface, named in one sentence**

Which steps are genuinely one screen and which are two, and where the fidelity
cap must bend for a screen whose whole point is density.

- [ ] **Step 5 — verify**

Run: `bun run validate 2>&1 | grep wireframing`
Expected: `OK` at or below **4500** tokens. Above that, move prose into
`references/shapes.md`.

---

### Task 5: Behavioural cases

**Files:**
- Create: `skills/wireframing-interfaces/eval/cases.jsonl`

- [ ] **Step 1 — one case per BLOCKER row**

From test §4b: `TC-1` (unnamed state is skipped *and recorded*), `TC-2` (a panel
per named state), `TC-4`/`TC-5` (no step table → refuse, never invent), `TC-9`
… `TC-12` (fidelity cap, including a field label containing a colour word),
`TC-19` (no program → editable still produced).

- [ ] **Step 2 — verify the file parses**

```bash
python3 -c "
import json
n=0
for l in open('skills/wireframing-interfaces/eval/cases.jsonl'):
    l=l.strip()
    if l: json.loads(l); n+=1
print('JSONL valid,', n, 'cases')"
```

Expected: `JSONL valid, <n> cases` with n ≥ 6

---

### Task 5b: Make budget headroom FIRST — measured, not assumed

**Files:** `skills/using-dstack/SKILL.md`, `skills/writing-specs/SKILL.md`

Measured on this repo: `using-dstack` is at **2239/2500** and the warning fires
above **2250** — about 41 characters of headroom. `writing-specs` is at
**4466/5000** against a **4500** threshold, and 5000 is a documented hard max
that cannot be raised. A router row plus a `## Changes` bullet exceeds both. A
reviewer executed Task 6 as originally written and got `3 warnings` and
`build --strict` exit 1.

- [ ] **Step 1** — raise `using-dstack` `context_budget_tokens` 2500 → 3000.
- [ ] **Step 2** — trim `writing-specs` by at least 120 tokens (compress its
      `## Changes` entries; do not delete rules).
- [ ] **Step 3 — verify BEFORE touching Task 6**

Run: `bun run validate 2>&1 | grep -E 'using-dstack|writing-specs'`
Expected: both `OK`, neither with `(1 warnings)`.

---

### Task 6: Register and reciprocate

**Files:**
- Modify: `skills/using-dstack/SKILL.md` — router row, chain, `## Changes`, **frontmatter `version`**
- Modify: `skills/using-dstack/references/skill-catalog.md`
- Modify: `skills/writing-specs/SKILL.md` — the boundary, version, `## Changes`

- [ ] **Step 1 — router row**

`| Spec says what a screen does; nobody can see it yet | /wireframing-interfaces |`

- [ ] **Step 2 — reciprocate in `writing-specs`**

Its Stage 5 says interface behaviour is "states and rules, not pixels". Add:
the picture of those states is `/wireframing-interfaces`; the table stays
normative.

- [ ] **Step 3 — bump every version touched**

- [ ] **Step 4 — verify**

Run: `bun run validate 2>&1 | tail -2`
Expected: `29 skills checked: 29 OK, 0 ERR`, no warnings.

---

### Task 7: Full gate

- [ ] **Step 1**

```bash
bun run validate && bun run build --strict && bun run typecheck && bun test
```

Expected: `29 OK, 0 ERR`; build exit 0, no warning; `tsc` exit 0;
`99 pass, 0 fail`.

- [ ] **Step 2 — confirm bundled files installed**

```bash
ls .claude/skills/wireframing-interfaces/references
```

Expected: `screen-set.md  shapes.md`

---

### Task 8: Review and trial

- [ ] **Step 1 — `/multi-persona-review`**, five points of view: a
non-technical stakeholder who must judge the flow, a UX/interaction designer
(is the fidelity cap defensible or merely crude), an implementer (is a panel
enough to build from), an accessibility reviewer (does the picture show focus
order and labels, per `SOUT-4`), holistic dstack practitioner.

- [ ] **Step 2 — subagent trial.** Feed it the interface table from
`docs/specs/2026-07-29-diagramming-architecture.md` §7 — a real table with an
`n/a` column and a job-like step — and have it self-assess against `AC-1` …
`AC-10`. The `n/a` columns are the interesting part: they test `TC-1` for real.

- [ ] **Step 3 — fold findings in**, re-run Task 7.

---

### Task 9: Commit

- [ ] **Step 1 — one commit**

Subject: `feat(skills): add wireframing-interfaces`. Body: the gap it fills
(the arrangement is decided at implementation time, unreviewed), why the
fidelity cap is deliberate rather than a limitation, and the amended `OUT-1`
trigger in the `writing-specs` discovery — the recorded condition never fired,
and the honest move was to amend rather than claim it had.

- [ ] **Step 2 — verify before claiming done.**

---

## Self-review

1. **Coverage** — `FR-1`→T3+T4, `FR-2`→T3, `FR-3`→T2+T4, `FR-4`→T3, `FR-5`→T2,
   `FR-6`→T4, `FR-7`→T4, `NFR-1`→T1/T4 step 5. No gaps.
2. **Placeholders** — none; every command literal, every expectation stated.
3. **Consistency** — `WF-n` introduced in Task 3 is what Task 4 references; the
   shape names in Task 2 are the ones verified to render offline, not guesses.

## Known risks in this plan

- **Ordering.** Building this before `diagramming-architecture` means inventing
  the probe wording twice. Do it second.
- **The fidelity cap is the one thing a reviewer will push back on.** Open
  decision 2 is unresolved; expect Task 8 step 1 to reopen it, and treat that as
  the review working rather than failing.
- Task 4 step 5 will likely need two trims to clear the budget warning, as every
  skill in this family has.
