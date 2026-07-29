# diagramming-architecture implementation plan

**Goal:** a skill that turns a diagram's text source into files other people can
open and edit, tells the truth about what this machine could produce, and never
lets the artifact become a second source of truth.

**Architecture:** one `SKILL.md` spine plus two bundled references that load on
demand — a capability/format matrix and the artifact-set form. The drawing
program stays EXTERNAL: probed, never shipped. Absence is a recorded verdict,
not an error.

**Stack:** Markdown + YAML frontmatter, rendered by dstack's own CLI. No
runtime code, no new dependency.

**Implements:** `docs/specs/2026-07-29-diagramming-architecture.md`
**Proven by:** `docs/tests/2026-07-29-diagramming-architecture.md`

Execute task by task. Per task run the stated command and compare against the
expected output before ticking it. `/verifying-before-done` before any "done".
Steps use `- [ ]` checkboxes.

## File structure first

| File | Its one responsibility |
|---|---|
| `skills/diagramming-architecture/SKILL.md` | the stage spine, the gates, the probe rule |
| `skills/diagramming-architecture/references/formats.md` | what each format carries, which conversions exist, the degradation matrix |
| `skills/diagramming-architecture/references/artifact-set.md` | the output form: file names, manifest columns, `DG-n` scheme, provenance rule |
| `skills/diagramming-architecture/eval/cases.jsonl` | the behavioural anti-patterns |
| `skills/using-dstack/SKILL.md` + `references/skill-catalog.md` | registration — router row, catalog row, chain |
| `skills/writing-specs/SKILL.md` | the reciprocal boundary |

`CMP-2` and `CMP-3` are independent of everything (spec §3), so tasks 2 and 3
can run in either order. Task 4 depends on both.

---

### Task 1: Scaffold and frontmatter

**Files:**
- Create: `skills/diagramming-architecture/SKILL.md`

- [ ] **Step 1 — scaffold**

```bash
bun run new diagramming-architecture
```

Expected: `created skill: diagramming-architecture (type=semantic)`

- [ ] **Step 2 — write the frontmatter**

```yaml
name: diagramming-architecture
description: >
  Use when a diagram in a design document needs to leave it — to be opened,
  edited, or handed to someone who does not write Mermaid; when a picture is
  wanted for a review, a slide, or a whiteboard; or when an existing diagram
  file must be read back against its source. Produces files, and states per
  output what this machine could and could not produce. Triggers: "buat
  diagram", "diagram arsitektur", "excalidraw", "draw.io", "drawio", "gambar
  arsitekturnya", "export diagram", "editable diagram", "C4 diagram", "ERD
  gambar", "flowchart", "diagram alur".
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

`Bash` is declared because the probe (`OP-1`) genuinely runs commands — unlike
its siblings, where it was declared and unused.

- [ ] **Step 3 — verify**

Run: `bun run validate 2>&1 | grep diagramming`
Expected: `diagramming-architecture: OK (<n>/5000 tokens)` with no `ERR`

---

### Task 2: The capability and format reference

**Files:**
- Create: `skills/diagramming-architecture/references/formats.md`

- [ ] **Step 1 — the degradation matrix**

Write the table from spec §3a verbatim: conditions *program on PATH*, *display
usable*, *kind converts* → what is produced. Include the two don't-care probes
and say why a collapse is an assumption until probed.

- [ ] **Step 1b — layout recipes**

Prior art shows layout is the hard part of a hand-written artifact and that it is
recipe-able. Carry named recipes with their positioning maths: grid of cards,
horizontal timeline, mind map, BPMN-lite process map, swimlane, before/after
banner, two-column. Without these the agent invents coordinates per diagram.

**Excalidraw schema trap, from two independent repos:** when an arrow binds to a
shape, the shape must also list that arrow in its `boundElements`. The binding is
reciprocal — miss it and the file opens with the arrow detached.

- [ ] **Step 2 — the format table**

One row per format: `.mmd`, `.drawio`, `.drawio.svg`, `.png`, `.excalidraw` —
what it carries, whether it is editable, whether it embeds its source, and which
kinds convert into it. State the flowchart-only limit (`E-8`) as a property of
the converter, not of this skill.

- [ ] **Step 3 — the probe**

The exact commands, with the rule that any failure resolves to `source-only`:

```bash
command -v drawio >/dev/null 2>&1 && echo present || echo absent
[ -n "${DISPLAY:-}" ] && echo display || echo no-display
```

- [ ] **Step 4 — verify**

Run: `bun run validate 2>&1 | grep diagramming`
Expected: still OK; the reference is bundled and does not count toward the body
budget, so the token number must be unchanged from Task 1.

---

### Task 3: The artifact-set form

**Files:**
- Create: `skills/diagramming-architecture/references/artifact-set.md`

- [ ] **Step 1 — the manifest schema**

The six columns from spec §4: `id`, `source file`, `source hash`, `altitude`,
`format`, `verdict`. State the absence rule verbatim: *a row absent means not
produced; a row present with `n/a` means deliberately not produced, with a
reason* — the two are never merged.

- [ ] **Step 2 — the ID scheme and provenance rule**

`DG-n` per diagram, stable, never renumbered. Every artifact names its source
and the source's hash. Regeneration from an unchanged hash produces identical
bytes.

- [ ] **Step 3 — the manifest-commit rule**

`OP-6` writes the manifest once, after the last artifact operation returns, and
every row records an **observed** result — never an intended one. Read-back was
cut to `SOUT-6` on 2026-07-29; do not write a read-back rule.

- [ ] **Step 4 — verify**

Run: `bun run validate 2>&1 | grep diagramming` → unchanged token count.

---

### Task 4: The SKILL.md body

**Files:**
- Modify: `skills/diagramming-architecture/SKILL.md`

- [ ] **Step 1 — the two laws**

```
THE TEXT SOURCE IS THE ONE THAT COUNTS.
NEVER CLAIM AN OUTPUT THIS MACHINE DID NOT PRODUCE.
```

- [ ] **Step 2 — the stages, each with a gate**

Probe → Author the source → Convert → Render → Manifest → Hand back. Every gate
writes *stage · PASS / BLOCKED / `n/a` · evidence*, matching the trio's
convention exactly: a PASS with an empty evidence cell is not a PASS; a gate
whose subject does not exist reads `n/a`, never PASS.

- [ ] **Step 3 — the altitude rule**

One altitude per diagram (`FR-6`); a request spanning two is split or refused
with the reason stated.

- [ ] **Step 4 — the judgment surface, named in one sentence**

Which picture answers the question being asked, and when a diagram should not be
drawn at all because a table already carries it.

- [ ] **Step 5 — hand-off**

Input from `/writing-specs`; the artifact is referenced from the spec, never
replacing its inline Mermaid (`SOUT-3`).

- [ ] **Step 6 — verify**

Run: `bun run validate 2>&1 | grep diagramming`
Expected: `OK` with the token count **at or below 4500** — above that the
`token-near-budget` warning fires and `build --strict` fails. If it is above,
move prose into `references/formats.md`, which is uncounted.

---

### Task 5: Behavioural cases

**Files:**
- Create: `skills/diagramming-architecture/eval/cases.jsonl`

- [ ] **Step 1 — one case per BLOCKER row**

Derive from `docs/tests/2026-07-29-diagramming-architecture.md` §4b. At minimum:
`TC-1` (no program → `n/a` rows, never a claimed file), `TC-8` (non-convertible
kind is not called editable), `TC-9` (idempotent regeneration), `TC-15`
(an artifact with no provenance row is refused), `TC-17` (report claims nothing
absent). TC-12/TC-13 are WITHDRAWN with FR-7 — do not write cases for them.

- [ ] **Step 2 — verify the file parses**

```bash
python3 -c "
import json
n=0
for l in open('skills/diagramming-architecture/eval/cases.jsonl'):
    l=l.strip()
    if l: json.loads(l); n+=1
print('JSONL valid,', n, 'cases')"
```

Expected: `JSONL valid, <n> cases` with n ≥ 5

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
- Modify: `skills/using-dstack/SKILL.md` — router row, chain, `## Changes`, **and the frontmatter `version`**
- Modify: `skills/using-dstack/references/skill-catalog.md` — catalog row, chain
- Modify: `skills/writing-specs/SKILL.md` — the reciprocal boundary, version, `## Changes`

- [ ] **Step 1 — router row**

`| A diagram must leave the document — editable or shareable | /diagramming-architecture |`

- [ ] **Step 2 — reciprocate in `writing-specs`**

Its Stage 7 says diagrams are Mermaid inline. Add: when the diagram must be
opened or edited by someone else, `/diagramming-architecture` produces the
artifact — the fence stays.

- [ ] **Step 3 — bump both versions**

`writing-skills` 0.4.0 requires this: register **and** bump in the same edit.
This is the step that was missed once already.

- [ ] **Step 4 — verify**

Run: `bun run validate 2>&1 | tail -2`
Expected: `28 skills checked: 28 OK, 0 ERR` — and no `warnings`, since
`using-dstack` sits near its budget.

---

### Task 7: Full gate

- [ ] **Step 1 — the four commands**

```bash
bun run validate && bun run build --strict && bun run typecheck && bun test
```

Expected: `28 OK, 0 ERR`; build exit 0 with no warning; `tsc` exit 0;
`99 pass, 0 fail`.

- [ ] **Step 2 — confirm the install carries the bundled files**

```bash
ls .claude/skills/diagramming-architecture/references
```

Expected: `artifact-set.md  formats.md`

---

### Task 8: Review and trial

- [ ] **Step 1 — `/multi-persona-review`**, five points of view whose concerns
barely overlap: software architect (is the altitude discipline real), technical
writer / stakeholder (can a non-Mermaid reader use the artifact), release
engineer (does it behave on a machine with no renderer), toolchain specialist
(are the format claims true), holistic dstack practitioner.

- [ ] **Step 2 — subagent trial.** Give it the spec's own container diagram and
have it produce a set **twice** — once with `PATH` intact, once with the program
removed — then self-assess against `AC-1` … `AC-10`.

- [ ] **Step 3 — fold every confirmed finding in**, then re-run Task 7.

---

### Task 9: Commit

- [ ] **Step 1 — one commit, body explains WHY**

Subject: `feat(skills): add diagramming-architecture`. The body says what the
skill exists to fix (the diagram cannot leave the document), the decisive
constraint (the renderer is absent on both deploy targets), and what the review
and trial changed.

- [ ] **Step 2 — verify before claiming done**

Re-run Task 7's four commands in the same turn as the claim.

---

## Self-review

1. **Coverage** — spec requirements to tasks: `FR-1`→T4, `FR-2`→T3, `FR-3`→T2+T4,
   `FR-4`→T2, `FR-5`→T2, `FR-6`→T4, `FR-7`→T3, `NFR-1`→T1/T4 step 6. No gaps.
2. **Placeholders** — none: every command is literal and every expected output is
   stated.
3. **Consistency** — the file paths in Task 1 match those used in Tasks 2–6; the
   `DG-n` scheme introduced in Task 3 is the one Task 4 references.

## Known risk in this plan

Task 4 step 6 is the step most likely to fail: three of the four skills built
this way needed two or three trims to clear the 90% budget warning. Budget an
extra pass, and move prose to the references rather than deleting content.
