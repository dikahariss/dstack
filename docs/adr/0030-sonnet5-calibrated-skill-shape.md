# ADR-0030 — Sonnet-5 calibrated skill shape

- **Status:** Accepted
- **Date:** 2026-08-14
- **Supersedes:** ADR-0025 (the four bands are carried forward unchanged; the
  governance clause is replaced)
- **Reversibility:** Cheap.

## Context

Anthropic's Sonnet 5 prompting guide states the model "interprets prompts
literally and explicitly… does not silently generalize an instruction from
one item to another, and does not infer requests you didn't make." Sonnet 5
is this catalog's daily driver. A closed list in a skill is therefore not
guidance — it is a ceiling. The model's own knowledge past item N does not
arrive unless the skill invites it.

Two measurements on the 33-skill catalog, taken 2026-08-14:

- 2 of 33 skills declare any list open (`debugging`, `designing-test-cases`).
  30 enumerate without declaring anything; 1 (`managing-version`) does not
  enumerate at all.
- 13 skills sit at `deterministic-dominant` against 1 at
  `judgment-dominant`, despite ADR-0025 naming `workflow` the default.

The second number is ADR-0025's governance clause working as written: rails
cost a written rationale, freedom costs empirical evidence. That asymmetry is
a one-way ratchet, and the catalog has no procedure that ever removes a rail.

Boris Cherny's ablation practice — delete, observe, restore only what
demonstrably fails — is the missing counterweight. Anthropic's Agent Skills
guidance names the same axis we call calibration: match the degree of freedom
to the task, exact steps only for the "narrow bridge with cliffs on both
sides."

## Decision

**1. Every enumeration declares itself.** A skill body with three or more
list items carries one of two markers:

- *Open* — "not exhaustive", "a starting point, not a limit", "extend this
  list". Use where the list samples a space the model knows more of.
- *Closed by design* — with the reason. Use where the enumeration **is** the
  deliverable (`designing-test-cases` produces the case list) or where the
  set is externally fixed (a file format's legal values).

Enforced by the `closed-enumeration` render warning, not by a validate error.

**2. Write exit criteria, not step sequences.** The default skill shape is
task + guardrails + exit criteria. A fixed step order is reserved for the
narrow bridge: destructive commands, migrations, deploys, anything where one
wrong order is unrecoverable. Elsewhere the model picks the route.

**3. Never restate what the model already knows.** A skill carries our
conventions, our commands, our architecture, our definition of good. It does
not re-teach boundary value analysis or root cause analysis. On Sonnet 5 a
written-out general concept does not add to the model's version — it
*replaces* it with our shorter one.

**4. Bands are carried forward from ADR-0025 unchanged**: `judgment-dominant`
10–20%, `workflow` ~30% (default), `deterministic-dominant` 60–80%+,
`schema-meta` n/a.

**5. Governance, replacing ADR-0025's clause.** Both directions now cost the
same evidence, and there is a defined way to produce it:

- Moving toward rails or toward freedom requires one ablation run (below)
  plus owner approval.
- Once per major model release, every `deterministic-dominant` skill is
  re-justified against the narrow-bridge test or demoted to `workflow`.

**6. The ablation protocol.** For one skill:

1. Pick 3 real past tasks that invoked it.
2. Run each on the daily-driver model with the skill, and again with the
   skill's body replaced by its goal and exit criteria alone.
3. Record what the railed run got right that the free run missed, and what
   the free run surfaced that the railed run never reached.
4. Restore only the rails that item 3 shows are load-bearing.
5. Record the run and the decision in the skill's `## Changes`.

A skill may not move bands on argument alone. The procedure is written out in
`docs/procedures/skill-ablation.md`.

## Trade-offs

- `+` Removes the ratchet: rails can now be lost, not only gained.
- `+` The openness rule is one sentence per skill and directly targets the
  documented Sonnet 5 literalism.
- `+` Keeps ADR-0025's bands, so no skill's existing flag changes meaning.
- `-` Ablation costs real runs. Mitigated: 3 tasks, once per band change.
- `-` The `closed-enumeration` detector is a regex heuristic and will
  false-positive. Mitigated: warning, never an error; the "closed by design"
  marker is a one-line dismissal that also documents the reason.
- `-` **It also false-negatives, and this is the weaker end.** The detector
  matches the marker anywhere in the body, so one marker silences the whole
  skill however many undeclared lists it has — and a marker sitting in
  `## Changes`, far from any list, silences it just as well. Measured 2026-08-14
  by stripping the body markers from `dispatching-parallel-agents` and leaving
  one in its changelog: the warning stayed off. Scoping a marker to the list it
  belongs to needs real block parsing, which is more machinery than a warning
  earns today. Mitigated only by review: a sweep must be audited per skill for a
  marker in the body *above* `## Changes`, not by trusting the warning count.
  The 2026-08-14 sweep was audited that way and 0 of 33 passed falsely.

## YAGNI guard

No new frontmatter field — the marker is prose in the body, so the exemption
and its reason live where a reader will see them. No hard validate error
(D29 still holds). No per-model skill variants: one catalog, calibrated for
the daily driver, with model-specific findings recorded in `## Changes`.

## Reversibility

Cheap. Reverting means deleting the `closed-enumeration` warning kind and its
detector, and restoring ADR-0025's governance clause. The openness sentences
already written into skill bodies are harmless prose if the rule is dropped —
they read as ordinary guidance, so no sweep is needed to undo them.
