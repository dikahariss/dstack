# v4 RESEARCH — where a literal 30/70 hybrid default is sub-optimal

**Question.** If "hybrid by default = 30% deterministic / 70% AI
semantic" is applied as a *uniform* default across all 18 skills, which
skills become sub-optimal, and why?

**TL;DR.** A literal 30/70 fits about **half** the catalog (the
workflow-shaped skills). The other **9 of 18 deviate — 5 strongly.**
30/70 is a *workflow-shaped* ratio; it mis-serves three other skill
shapes:

1. **Safety / deterministic skills** that need **more** rails than 30%.
2. **Judgment-dominant skills** that need **fewer** rails than 30%.
3. **Structurally different skills** (schema-semantic, meta/router) where
   the "procedural spine" concept does not map cleanly at all.

Recommendation: keep **"rails + named judgment"** as the invariant, but
demote the **30/70 number** from a law to a per-skill *calibration band*,
and exempt three clusters explicitly. The v4 plan and ADR-0025 implement
this as four bands plus an owner-gated `calibration` flag (default
`workflow`); 30/70 stays only as the default of the `workflow` band.

---

## 1. What "30% deterministic / 70% semantic" silently assumes

The ratio encodes one skill *shape*: a **workflow with ground truth** —
a multi-step task where roughly a third of the value is in the rails
(ordered procedure, gates, tables, verification commands) and two-thirds
is in the reasoning (diagnosis, design, the final call). `debugging`,
`code-review`, `writing-plans`, and `angular21-maritimhub` are exactly
this shape. For them 30/70 is right.

The default breaks whenever a skill's *ideal* calibration point sits far
from that ratio, or whenever "deterministic" and "semantic" are not even
the right two buckets for the skill.

---

## 2. Four failure modes of a uniform 30/70

| Mode | What goes wrong | Direction |
|---|---|---|
| **M1 — under-constrains** | Safety/consistency-critical skills need 60–100% determinism. Capping rails at ~30% (or *framing* the skill as "70% AI judgment") invites the exact failure the skill exists to prevent. | needs **more** det. |
| **M2 — over-constrains** | Judgment-dominant skills (relentless interview) are *weakened* by a rigid 30% spine. Empirically measured, not hypothetical. | needs **less** det. |
| **M3 — structural mismatch** | For schema-semantic and meta/router skills, "deterministic" is not a *procedural spine* (steps/gates/verify-command). It is the output schema, or a routing rule. The 30/70 framing and the spine-element checklist misfire. | ratio is the **wrong model** |
| **M4 — the "free to research the latest" clause backfires** | The doctrine's "70% AI semantic, free to research the latest, final decision is the AI's" is *good* for `angular21` (latest Angular APIs) but a **liability** for fixed-protocol skills, where you explicitly do NOT want the agent improvising a "better" procedure. | wrong *message* |

M4 is the subtle one. "Hybrid by default" carries two payloads: a ratio
*and* a posture ("trust the agent's judgment, let it research"). The
posture is wrong for the safety/deterministic cluster even where the
ratio could be argued.

---

## 3. Per-skill calibration table (all 18)

"Ideal det." is the rough share of the skill's value that should be rails
vs judgment. "Fits 30/70?" judges the *uniform default*, not the skill's
current quality.

| Skill | `type` | Ideal det. | Fits 30/70? | Mode | Why |
|---|---|---|---|---|---|
| **version** | deterministic | **95–100%** | ✗ extreme | M1+M4 | A script is the source of truth. AI must NOT compute version logic; "70% AI" is a release-breaking hallucination surface. |
| **careful** | (semantic) | **70–85%** | ✗ strong | M1+M4 | A destructive-ops guardrail. Its value is removing reliance on in-the-moment AI judgment — the thing that fails under momentum. "70% trust AI + research latest" inverts its purpose. |
| **verification** | semantic | **65–80%** | ✗ strong | M1 | Discipline skill. The iron law + exact gate must dominate; 30% rails invites a rationalized skip — the precise failure it counters. |
| **brainstorm** | semantic | **10–20%** | ✗ strong | M2 | Relentless interview. v3 benchmark: it *loses to* mattpocock/grill-me because dstack is broader/more-structured. More spine pushes it further from the winning shape. |
| **classify-issue** | schema-semantic | n/a (schema) | ✗ structural | M3 | "Determinism" here is the output JSON Schema + severity rubric, not a procedural spine. Spine element (e) "verify command" is N/A; the ratio model does not apply. |
| **finishing-a-development-branch** | semantic | **60–75%** | ✗ moderate | M1 | `side_effects: external`. The dangerous-combination rule wants deterministic rails for external mutation; exact bash + typed "discard" confirm are the value. |
| **using-git-worktrees** | semantic | **60–75%** | ✗ mild | M1 | Mostly deterministic by design (Step 0 detection gate, exact bash, `git check-ignore`). Judgment is thin. 30% under-constrains. |
| **using-dstack** | semantic | n/a (router) | ✗ mild | M3 | Meta/router. "Determinism" is the invoke-before-acting rule + priority order; element (e) N/A. Not a workflow with ground truth — the ratio is arbitrary. |
| **tdd** | semantic | **40–55%** | ~ borderline | M1 mild | Discipline skill; the red-green-refactor *sequence* is non-negotiable. Well-balanced today, but "70% free judgment" slightly undersells the rigidity. |
| **debugging** | semantic | 30–40% | ✓ | — | Workflow; rails (triage table, phases) *help* — benchmark-proven. |
| **code-review** | hybrid | 30–40% | ✓ | — | Workflow + script; verify-then-act. |
| **writing-plans** | semantic | 25–35% | ✓ | — | Workflow; judgment in file split + task design. |
| **writing-skills** | semantic | 25–35% | ✓ | — | Workflow; judgment in what to teach. |
| **dispatching-parallel-agents** | semantic | 30–40% | ✓ | — | Workflow; judgment = independence call. |
| **executing-plans** | semantic | 30–45% | ✓ | — | Router into `/verification` + `/finishing`; judgment = plan critique. |
| **subagent-driven-development** | semantic | 35–45% | ✓ | — | Workflow; judgment = context per subagent + blocker reading. |
| **requesting-code-review** | semantic | 35–45% | ✓ | — | Mechanical dispatch + judgment = what context to craft. |
| **angular21-maritimhub** | hybrid | ~30% | ✓ exemplar | — | Literally "Deterministic (~30%) / Semantic (~70%)". The shape the default is named after. |

**Count: 9 fit cleanly, 9 deviate (5 strong, 4 mild).** A uniform 30/70
is correct for half the catalog and wrong for the other half.

---

## 4. The "kurang optimal" shortlist, ranked

### Strong mismatches (fix the default for these)

1. **version** — the default is *maximally* wrong. A deterministic script
   skill has ~zero semantic share by design; "70% AI" is a correctness
   hazard, not a calibration nicety. (Already `type: deterministic`, so
   the v4 `missing-spine` warning exempts it — but the *doctrine wording*
   must not claim it is 30/70.)

2. **careful** — safety inversion. The skill exists because AI judgment
   *degrades under momentum* on destructive commands. A default that says
   "trust the agent 70% and let it research the latest" is the opposite
   of the guarantee. Determinism should dominate; the only judgment is
   "is this novel op also destructive?" (the v4 P0 fix already adds that
   one judgment line — correctly small).

3. **verification** — discipline erosion. evidence-before-claim only
   works if the gate is near-mechanical and non-negotiable. The v3
   benchmark wins came from *adding* rails (exact bash + exit codes), not
   from leaving 70% to judgment.

4. **brainstorm** — the only **empirically measured** case. v3 benchmark
   report: brainstorm loses 0–2 to grill-me precisely because grill-me is
   "deliberately narrower — just a relentless interview pattern," while
   dstack/brainstorm carries more structure. A 30% deterministic *mandate*
   moves it the wrong way. Ideal is ~90% judgment with a tiny spine
   (recommendation-first + stop/keep gates).

5. **classify-issue** — wrong model, not wrong ratio. Its determinism is
   the **output schema** (enforced on the answer) plus the severity
   lookup rubric — not a procedural spine. The "spine + verify command"
   checklist does not map; forcing it produces awkward, low-value edits.

### Mild mismatches (calibrate, don't force to 30%)

6. **finishing-a-development-branch** — external-mutating; wants
   60–75% rails (M1). 7. **using-git-worktrees** — deterministic by
   design; ~60–75% (M1). 8. **using-dstack** — meta/router; ratio is
   arbitrary, element (e) N/A (M3). 9. **tdd** — discipline; the sequence
   is rigid even though overall balance is fine (M1 mild).

---

## 5. Why this matters — grounding in dstack's own frameworks

The mismatch is not a matter of taste; three existing dstack artifacts
already predict it:

- **Taxonomy §"Final check: failure cost"** — "Production goes down, or
  data is lost → use Deterministic where possible. Minimize LLM
  responsibility." This *directly contradicts* a 30%-determinism cap for
  `version`, `careful`, `verification`, `finishing-a-development-branch`,
  whose failure cost is high.
- **Taxonomy Part 3 dangerous-combination rule** (and the
  `DangerousCombinationError` in code) — external-mutating skills must be
  constrained. `finishing-a-development-branch` is `external`; the default
  posture pulls it toward *less* constraint.
- **`/writing-skills` discipline-vs-technique split** — discipline skills
  ("rules that must hold under pressure, like `/tdd` and `/verification`")
  are explicitly the rigid class. A default tuned for technique/pattern
  skills under-serves them.
- **playbook §1.3 "match specificity to fragility"** — the first-party
  guidance is that freedom is calibrated *per skill and per section*
  (high/medium/low), which is the opposite of a single global ratio.
- **v3 benchmark report** — the `brainstorm` loss is the measured proof
  of M2.

---

## 6. Recommendation — refine the doctrine, don't abandon it (ACCEPTED)

The doctrine's **invariant is sound**: every skill has a deterministic
spine *and* a named judgment surface. Keep that. The **30/70 number** is
what over-generalises. The owner accepted (2026-06-04) replacing it with a
**spectrum of four bands**, recorded by an optional frontmatter flag
`metadata.dstack.calibration` (default `workflow`). The v4 plan
(`skill-hybrid-by-default-plan.md`) implements this; ADR-0025 records it.

The deterministic share is a dial: **10% → 20% → 30% (default) → up to ~80%+.**

| Band (`calibration`) | Det. share | Skills | Note |
|---|---|---|---|
| `judgment-dominant` | 10–20% | brainstorm | Tiny spine on purpose. The rule is the spine; the rest is the interview. |
| `workflow` **(default, omit flag)** | ~30% | debugging, code-review, tdd, writing-plans, writing-skills, dispatching-parallel-agents, executing-plans, subagent-driven-development, requesting-code-review, angular21-maritimhub | Where 30/70 is the default. |
| `deterministic-dominant` | 60–80%+ | careful, verification, finishing-a-development-branch, using-git-worktrees | Rails dominate. Judgment is small + *bounded*. Do NOT tell these "research the latest, the call is yours." |
| `schema-meta` | n/a as a % | classify-issue, using-dstack | "Determinism" is the schema or routing rule, not steps. |

(`version` is `type: deterministic` at ~100%; it omits the flag.)

### Governance (asymmetric — the key safeguard)

Default is `workflow`. The justification to move depends on direction:

- **→ `judgment-dominant` (more AI freedom, risky):** requires **empirical
  evidence** (benchmark/UAT/test) that the default over-constrains, **plus
  owner approval**. This is the owner's rule: mark a skill AI-semantic only
  if testing shows the default is sub-optimal *and* the owner decides it.
- **→ `deterministic-dominant` / `schema-meta` (more rails, safe):**
  requires only a **documented rationale**, plus owner approval.

Record the evidence + decision in the skill's `## Changes`. Adding AI
freedom is earned by proof; adding rails only needs a reason.

### How this lands in the plan

- **Flag:** the `calibration` field — plan Track B1 (union, parser,
  renderer; rendered into output so a cheap model reads the band directly).
- **Band-aware warning:** `missing-spine` exempts `judgment-dominant`,
  `schema-meta`, and `type: deterministic` — plan Track B2.
- **Per-skill:** deterministic-dominant skills get a *bounded* judgment
  line (mirror `careful`); `brainstorm` carries the benchmark evidence
  line — plan Track D.

### What NOT to change

- Do not abandon "hybrid by default." The invariant (spine + named
  judgment) holds for **all 18** — even `version` has a spine (the
  intent→command table) and a bounded judgment (pick the subcommand).
- Do not push any skill toward `type: hybrid` to satisfy a ratio
  (ADR-0015 stands; this is a separate axis).

---

## 7. One-paragraph answer to the question

A uniform "30% deterministic / 70% semantic" default is sub-optimal for
**version, careful, verification, brainstorm, and classify-issue most
strongly, and for finishing-a-development-branch, using-git-worktrees,
using-dstack, and tdd more mildly** — nine of eighteen. Five want *more*
determinism than 30% (safety/discipline/external skills), one wants far
*less* (the relentless-interview skill, already proven by benchmark), and
two do not fit the deterministic-vs-semantic *axis* at all (schema and
meta/router). The fix is not to drop the doctrine but to make 30/70 the
default of one **band** (Workflow) among four, and to scope the
"research-the-latest, the call is yours" posture away from the
deterministic-dominant skills. The mechanism is an optional
`metadata.dstack.calibration` flag (default `workflow`); moving a skill to
`judgment-dominant` requires benchmark/UAT/test evidence plus owner
approval, while moving toward more rails needs only a rationale — so the
"AI-semantic" override is always earned by proof and an owner decision,
never reached by drift.
