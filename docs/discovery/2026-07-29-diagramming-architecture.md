# Discovery — an architecture diagram cannot leave the document it lives in

Depth: LIGHT (reversible, ≤1 day, no new entity, no personal data, no actor
outside the delivery team — Stages 1, 2, 6, 7: §0, §1, §2, §3, §7–§10)
Status: DRAFT
Date: 2026-07-29 · Requested by: repo owner
Agreed by: —

## 0. Gate table

| Stage | Gate | PASS / BLOCKED | Evidence |
|---|---|---|---|
| 1 | problem names no solution + cites an observation | **PASS** | §2 names no tool or format; the gap is recorded in-repo (E-1, E-2, E-4) |
| 2 | baseline + target + method + owner + guardrail | **PASS** | §3 — baseline is mechanically countable |
| 6 | out-of-scope non-empty with IDs; MUST ratio | **OVERRIDDEN** | §7 — six Out rows. **MUST ratio recomputed: 5 of 8, over half.** FR-7 was genuinely cut to OUT-6. **Escalated to the repo owner and OVERRIDDEN 2026-07-29: both tiers stay in the first cut, nothing further is cut.** The ratio is still over half and is recorded as such — the gate was not relabelled to pass, it was consciously accepted by the person accountable |
| 7 | gate table complete | **PASS** | this table |

## 1. Summary

- **The problem:** the picture of how a system fits together lives inside a
  document as text, so the people who most need to correct it cannot open it.
- **Who it hurts:** the stakeholder who can read the diagram but not edit its
  source; the engineer who becomes the bottleneck for every correction.
- **What success looks like:** every diagram in an agreed design also exists as
  a file someone else can open, edit, and hand back.
- **What we do about it:** one skill that turns the diagram's text source into
  editable and viewable artifacts, and keeps the text as the source of truth.
- **Riskiest assumption (A-1):** that an exported artifact will be edited rather
  than becoming a second, drifting copy. Cheapest check: after 30 days, count
  artifacts whose embedded source no longer matches the spec's fence.

## 2. Problem statement

**Today (verified):** `skills/writing-specs/SKILL.md:230` states the rule —
*"Diagrams are **Mermaid, inline** — no external tool, no binary"* — and
`skills/writing-specs/references/diagrams.md:113` adds *"The table is normative;
the diagram is illustrative."* Both are right for the spec document. The
consequence is that a diagram exists only as a fenced code block: it cannot be
opened in a drawing tool, cannot be dropped into a slide or a whiteboard
session, and cannot be corrected by anyone who does not write Mermaid.

**What should happen instead:** the same diagram also exists as a file a
reviewer can open, move a box in, and return — without the text source ceasing
to be authoritative.

**Who is affected, and the cost:** the reviewer whose objection the spec most
depends on (`writing-specs` calls that objection *"most of this skill's
value"*) is the reviewer least able to edit the notation. Every correction
therefore routes through an engineer, and corrections that are not worth
interrupting an engineer for simply do not happen.

**Root need.** "We need Excalidraw or draw.io" → why? → "the diagram is stuck
in the markdown" → why does that matter? → "only an engineer can change it" →
**the reader most likely to catch a wrong diagram is the one least able to fix
it.**

**Demand evidence:** partially observed. The gap is recorded in-repo (E-2), and
the multi-audience failure it causes was raised independently by the
stakeholder point of view during the `writing-specs` review (E-4). The demand
for *these particular tools* is an assertion by the repo owner — recorded as
such, not as measurement.

## 3. Goal and success metric

| Goal | Baseline | Target | Measured by | Owner | Review |
|---|---|---|---|---|---|
| PRIMARY — a diagram in an agreed design can be opened and edited by someone who does not write Mermaid | 0 of the diagrams in `docs/specs/` have an editable artifact | every diagram in an `AGREED` spec has one | count artifacts under `docs/design/` against ```mermaid fences in `docs/specs/` | repo owner | 30 days |
| GUARDRAIL — the export must not become a second source of truth | n/a | every artifact carries the source it was generated from, and regenerating from an unchanged source produces an unchanged artifact | grep the embedded source; regenerate and diff | repo owner | per run |

**Why this metric:** the problem is that the picture is trapped in one
notation; an openable file is exactly the untrapping. **Cheapest way it moves
without the problem being solved:** export a PNG. A PNG is openable and not
editable — which is why the target says *edited*, and why the guardrail checks
the embedded source rather than the file's existence.

## 7. Scope

**In — first cut.** Both tiers ship: `MUST` = must have, `SHOULD` = nice to have.
Owner decision 2026-07-29 — no further cut.

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Take a diagram's text source (Mermaid) and emit an editable file that opens in a drawing tool | MUST |
| FR-2 | Keep the text source normative: the artifact records which source produced it, and regeneration from an unchanged source is idempotent | MUST |
| FR-3 | Detect the local toolchain and state, per output, whether it was produced or skipped and why — never fail silently | MUST |
| FR-4 | Emit a viewable form (SVG/PNG) when the toolchain allows, so the diagram can be read without any tool | SHOULD |
| FR-5 | Say which diagram kinds convert to which formats, and refuse to imply editability that the converter does not provide | MUST |
| FR-6 | Name the altitude of each diagram (context / container / component) and refuse to mix two in one picture | SHOULD |
| FR-8 | When a viewable form was produced, check it for legibility defects — text overflowing its box, text/fill contrast, edges penetrating or running along borders, labels colliding — and report every finding; when no viewable form was produced, say the check did not run | SHOULD — conditional on FR-4, which is itself SHOULD; a requirement that can only run when an optional output exists cannot outrank it |
| NFR-1 | Body under the token budget; the format and shape catalogue loads on demand | MUST — pass: `bun run validate` reports no warning |

**Out — and why**

| ID | Item | Why out | Revisit when |
|---|---|---|---|
| OUT-1 | Bundling or installing a renderer with the skill | ADR-0017 makes the installer copy every file under `skills/<id>/` verbatim to every target, so a vendored renderer would ship to machines that cannot run it (E-5). Neither that ADR nor ADR-0028 forbids binaries — an earlier draft of this row wrongly claimed ADR-0028 did | never |
| OUT-2 | A hosted or network render service | Offline is the contract; a CDN fallback is how an offline promise quietly breaks | never |
| OUT-3 | Replacing the spec's inline Mermaid | `writing-specs` is right that the table is normative and the fence belongs in the document; this skill adds an artifact, it does not move the diagram out | never |
| OUT-4 | Visual design — colour systems, brand, typography | A different craft; `/dataviz` owns chart aesthetics and a design tool owns brand | a brand system is actually adopted |
| OUT-5 | UI screens and wireframes | Its sibling `wireframing-interfaces` owns them; a screen is not an architecture view | never |
| OUT-6 | **Round-trip of a human-edited artifact** (was FR-7, cut 2026-07-29) | It is release-two machinery: it cannot occur until a human has received and returned an artifact, which is exactly what A-1 doubts will happen. Building it now prices a hand-off that has never taken place | A-1 is settled — one artifact comes back edited |

## 8. Assumptions and open questions

| # | Assumption | Impact if wrong | Confidence | Owner | Blocks |
|---|---|---|---|---|---|
| A-1 | An exported artifact gets edited rather than becoming a drifting copy | High — the guardrail would be measuring the wrong thing, and a drifting picture is worse than none | MEDIUM | repo owner | the goal's validity |
| A-2 | Mermaid is an acceptable authoring notation for the agent, with the artifact as the human's editing surface | Medium — if reviewers want to author *from* the tool, the direction of truth flips | HIGH | repo owner | FR-2 |
| A-3 | The two target ecosystems stay separate — a file for one does not open in the other | Low — verified today (E-6); if a converter appears it is additive | HIGH | — | FR-5 |
| A-4 | A machine without the renderer is a normal case, not an error | High — if every run must render, the skill is unusable on the servers it is deployed to | HIGH | — | FR-3 |

## 9. Evidence log

| What | Where | When | What it showed |
|---|---|---|---|
| E-1 | `skills/writing-specs/references/diagrams.md:113` | 2026-07-29 | "The table is normative; the diagram is illustrative" — the spec deliberately keeps pictures secondary |
| E-2 | `skills/writing-specs/SKILL.md:230` | 2026-07-29 | "Diagrams are **Mermaid, inline** — no external tool, no binary" — the constraint that traps the diagram, and it is correct for the spec |
| E-3 | `drawio --version`, `drawio --help` | 2026-07-29 | v31.0.2 present locally; `-x` accepts **Mermaid input directly**; `-e` embeds the editable source into SVG/PNG; `--layout` offers elk/organic/tree presets |
| E-4 | `writing-specs` multi-persona review, stakeholder point of view | 2026-07-28 | "A diagram with no plain-language paragraph excludes exactly the reader who most needs to object" — the same audience gap, one level up |
| E-5 | `ssh djpl-dev-etl`, `ssh microvac-lab` | 2026-07-29 | **`drawio` absent on both**, `DISPLAY` empty — the deploy targets cannot render |
| E-6 | `drawio -x -f svg -o exc.svg t.excalidraw` | 2026-07-29 | `Error: Export failed` — draw.io does not read `.excalidraw`; the two ecosystems are separate |
| E-7 | Hand-written `.excalidraw` JSON + [schema docs](https://docs.excalidraw.com/docs/codebase/json-schema) | 2026-07-29 | The format is plain JSON and writable without any library |
| E-8 | `@excalidraw/mermaid-to-excalidraw` docs and CLI wrappers | 2026-07-29 | The official **converter** is DOM-bound; CLI wrappers run headless Chromium. No offline path to *converting* Mermaid → Excalidraw |
| E-12 | **Prior-art survey, 2026-07-29** — 7 public skill repos cloned, read and deleted (`nintynick`, `Agents365-ai`, `robonuggets`, `rnjn`, `rockyco`, `fabricioartur` excalidraw-skill; `Sunwood-ai-labs/draw-io-skill`) | 2026-07-29 | **Generating `.excalidraw` needs no browser at all.** `nintynick/scripts/excalidraw.py` is 760 lines of pure stdlib — imported and exercised here: `Scene` exposes rectangle, ellipse, diamond, text, arrow, connect, line, image, `to_json`, `save`, and `check_overlaps`. E-8's conclusion held only for conversion, not generation |
| E-13 | Same survey | 2026-07-29 | **Idempotence is impossible in both ecosystems by design.** Excalidraw requires `seed` and `versionNonce`; the reference implementation fills them from `os.urandom(4)`. No surveyed repo claims byte-identity — matching the random `diagram id` measured in E-11 |
| E-14 | Same survey — `Sunwood-ai-labs/draw-io-skill` §6 | 2026-07-29 | Linting the **rendered SVG** is a required preflight there, with 12 defect classes and numeric thresholds: text overflow by width and height, text/fill contrast, edges penetrating or running along borders, edge crossings, labels colliding with boxes, arrow runs too short after the last bend. `nintynick` puts `check_overlaps()` inside `Scene` itself. **No surveyed repo handled a missing toolchain**; the survey is 7 repos, too small to call absence-handling novel |
| E-9 | `gstack/diagram/SKILL.md` | 2026-07-29 | Solves this with a browse daemon + prebuilt HTML bundle, and documents that mermaid→excalidraw **supports flowcharts only** |
| E-10 | round-trip test: `drawio -x -f xml -o back.xml t2.svg` | 2026-07-29 | An embedded-source SVG converts back to XML — round-trip is real, not theoretical |
| E-11 | Affected actors | — | **affected actors observed: none** — one user, who is the requester |

## 10. Change log

| Date | Change | Affected IDs | Reason | Approved by |
|---|---|---|---|---|
| 2026-07-29 | Initial draft | all | — | — |
| 2026-07-29 | Stage-6 gate corrected PASS → **BLOCKED**: the MUST ratio was hand-written as 4 of 8 and is 5 of 7 after cutting FR-7. ADR-0028 removed as the authority for "no binaries" — it says no such thing; ADR-0017's install semantics are the real reason | gate, FR-7→OUT-6, OUT-1, A-2 | A five-point-of-view review found every hand-written count in the set was wrong, all in the direction that made the document look balanced | — |
| 2026-07-29 | Stage-6 gate **BLOCKED → OVERRIDDEN** by the repo owner: both tiers stay in the first cut, nothing further is cut. The 5-of-8 ratio stands as recorded — an override is not a pass, and the difference is kept visible | gate, §7 header | Owner answered the escalation directly | repo owner |
