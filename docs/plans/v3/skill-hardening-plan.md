# Skill hardening plan — the five copy-as-is superpowers imports

This plan brings the five superpowers skills imported as-is (commit
`ec982ad`, under [ADR-0024](../../adr/0024-catalog-breadth-over-yagni.md))
up to the same quality bar as dstack's already-adapted skills. It is the
"perbaikan supaya lebih baik" follow-up to the import: the import made
the skills *present*; this plan makes them *dstack-native*.

It is the hardening track referenced by [ROADMAP.md](ROADMAP.md) M49 and
[DEFERRED.md](DEFERRED.md) D26.

## Scope

In scope — five skills:

| Skill | Budget (used) | Source commit |
|---|---|---|
| `executing-plans` | 1500 (821) | `ec982ad` |
| `finishing-a-development-branch` | 3500 (2040) | `ec982ad` |
| `dispatching-parallel-agents` | 3000 (1847) | `ec982ad` |
| `subagent-driven-development` (+3 `references/` prompts) | 4500 (3539) | `ec982ad` |
| `using-git-worktrees` | 3500 (2304) | `ec982ad` |

Out of scope (deferred, with reason):

- **`eval/cases.jsonl`** — M49 decided "yes for all four," but the
  harness that runs them (M48 `dstack eval`) is not built. Authoring
  cases now is forward investment with no runner; defer until M48 lands.
- **`uat/scenarios.md`** — M60 work; needs the user in the loop. Defer.
- **`receiving-code-review` as a separate skill** — settled: folded into
  `code-review` (superset). Not reopened here.
- **A `references/subagent-dispatch.md` *catalog primitive*** — D26's
  renderer-primitive rejection stands. The shared *file* (below) is a
  content-layer fix, not a renderer feature.

## The bar (what "hardened" means)

The reference exemplars are the four skills adapted in `ca51efd`
(`writing-plans`, `requesting-code-review`, `writing-skills`,
`using-dstack`). A skill is hardened when:

1. **Voice** — neutral, terse, direct. "the user," never "your human
   partner." Sentence-style H2 headings, not Title Case.
2. **No graphviz.** dstack uses tables and numbered lists, not `dot`
   diagrams ([writing-skills](../../../skills/writing-skills/SKILL.md)
   convention). Every `dot` block is converted.
3. **Host-accurate tool names.** No `TodoWrite` (not in the Claude Code
   tool registry); rephrase to a generic "todo per item" or the `Task*`
   tools. `allowed-tools` lists only tools the body actually drives.
4. **Required body structure** (M43): a "When to use" / "When NOT to
   use" H2, plus "How to apply" and an "Anti-patterns" / "Common
   mistakes" section.
5. **Grounded triggers + coherent description** (M41/M42): each trigger
   phrase appears in the body; description and body do not drift.
6. **Cross-references wired and resolvable** (M44): related skills linked
   with `/skill` or `[[id]]`; every link target exists.
7. **No dangling brand strings** beyond a single, justified back-compat
   note in `## Changes`.
8. Verification gate passes (see below).

## Cross-cutting findings (the gap analysis)

| Gap | Where | Fix |
|---|---|---|
| Graphviz `dot` blocks | `dispatching-parallel-agents` (1), `subagent-driven-development` (2 — incl. the large process digraph) | Convert to numbered list / table. Likely *reduces* tokens. |
| `TodoWrite` references | `executing-plans` (Step 1), `subagent-driven-development` (×3) | Rephrase to generic todo / `Task*` tools. |
| Missing cross-references | `finishing-a-development-branch` (no `[[verification]]`/`[[code-review]]`/`[[using-git-worktrees]]`), `dispatching-parallel-agents` (no link to `subagent-driven-development`/`debugging`), `using-git-worktrees` (no link to `finishing-a-development-branch`), `executing-plans` (no `[[verification]]`) | Add a Cross-references section to each. |
| Duplicated subagent-dispatch boilerplate | `dispatching-parallel-agents` and `subagent-driven-development` share the same "isolated context / construct exactly what they need" paragraph verbatim | D26 action — see "Shared subagent-dispatch reference" below. |
| Trigger overlap | `executing-plans` vs `subagent-driven-development` (both "execute plan"); `dispatching-parallel-agents` vs `subagent-driven-development` (both subagent dispatch) | De-confliction matrix below. |
| Brand leakage | `~/.config/superpowers/worktrees/` strings in `finishing-a-development-branch` and `using-git-worktrees` | Intentional back-compat; keep but ensure each is justified once in `## Changes`, not scattered. |
| Title Case headings, `❌/✅` emoji bullets | `dispatching-parallel-agents`, `finishing-a-development-branch` | Normalise to dstack voice/tables. |

## Per-skill work

### `executing-plans`
- Add explicit "When to use / When NOT to use" H2 (currently only in the
  description).
- Replace "Create TodoWrite" with host-accurate phrasing.
- Add `[[verification]]` cross-reference (M49 acceptance asked for it).
- Generous budget headroom (821/1500); no token risk.

### `finishing-a-development-branch`
- Add the missing Cross-references section: `[[verification]]`,
  `[[code-review]]`, `[[using-git-worktrees]]` (M49 acceptance).
- **Type decision:** M49 specified `type: hybrid` with a bundled
  `scripts/check-branch-state.sh`; the import shipped `semantic` with
  inline bash. Recommend converting to `hybrid` + extracting the Step 2
  detection bash into the script (matches M49, cheap, body already holds
  the exact commands). Confirm before doing.
- Normalise Title Case headings.

### `dispatching-parallel-agents`
- Convert the `dot` "when to use" block to a decision table.
- Convert `❌/✅` mistake bullets to the standard mistake/fix table.
- Add Cross-references: `[[subagent-driven-development]]` (sibling
  dispatch skill), `[[debugging]]` (the failures it parallelises).
- Apply the shared subagent-dispatch reference (below).

### `subagent-driven-development`
- Convert both `dot` blocks — especially the large process digraph
  (lines ~60–103) — to a numbered process list. Expect a token drop from
  3539, widening headroom under the 4500 budget.
- Replace the three `TodoWrite` references.
- Apply the shared subagent-dispatch reference (below).
- Cross-references already complete; verify all targets resolve.

### `using-git-worktrees`
- Add "When NOT to use" + Cross-references (`[[finishing-a-development-branch]]`,
  the wrap-up counterpart).
- Keep `EnterWorktree`/`ExitWorktree` native-tool guidance (correct for
  Claude Code).
- Consolidate the `superpowers/worktrees` back-compat mentions.

## Shared subagent-dispatch reference (D26 action)

`dispatching-parallel-agents` and `subagent-driven-development` carry the
same "subagents get isolated context you construct deliberately"
boilerplate. D26 prescribes a shared `references/subagent-dispatch.md`
(or a `_shared/` include) rather than a catalog primitive.

**Open sub-decision for the execution session:** dstack bundles
resources per-skill (`skills/<id>/references/`). A file shared by two
skills needs a home. Options:
1. One canonical copy in one skill; the other links to it by
   repo-root-relative path (M44 permits repo-root links).
2. Use the `includes:` mechanism if available in the current renderer
   (check v2 M3 / D18 status before relying on it).
3. Accept a short duplicated paragraph in both (cheapest; D26's trigger
   is "boilerplate more verbose than the skills' actual content" — a
   single paragraph may not meet that threshold).

Decide based on how much boilerplate actually overlaps once the bodies
are rewritten. Do not build an include mechanism just for this.

## Trigger de-confliction matrix

| Skill | Fires when | Must NOT be confused with |
|---|---|---|
| `executing-plans` | Executing a written plan in a **separate** session with review checkpoints | `subagent-driven-development` (same session) |
| `subagent-driven-development` | Executing a plan in the **current** session, one subagent per task | `executing-plans` (separate session); `dispatching-parallel-agents` (no plan) |
| `dispatching-parallel-agents` | 2+ **independent failures** to investigate concurrently (no plan) | `subagent-driven-development` (plan-driven, sequential per task) |
| `using-git-worktrees` | Setting up an **isolated workspace** before work | — |
| `finishing-a-development-branch` | Work **done**, deciding merge/PR/keep/discard | `verification` (quality gate, not the wrap-up decision) |

Sharpen each `triggers:` array and description so these boundaries hold.

## Sequencing

1. Graphviz → tables/lists (the largest, token-affecting change).
2. `TodoWrite` and voice/heading normalisation.
3. Cross-reference wiring + trigger de-confliction (do together; both
   touch frontmatter + a Cross-references section).
4. Shared subagent-dispatch reference decision + apply.
5. `finishing-a-development-branch` type decision (hybrid + script).
6. Verification gate.

Bump each touched skill to `0.2.0` with a `## Changes` entry describing
the hardening delta.

## Verification gate

After each skill and once at the end:

```bash
bun run validate          # 18 OK, 0 ERR; watch the <used>/<budget> column
bun run build --strict    # exit 0, no warnings
bun run typecheck         # exit 0
bun test                  # all pass
bun run doctor            # source/install consistency
```

## Effort

~3 to 5 hours for all five (graphviz conversion in
`subagent-driven-development` dominates). No new ports, no engine
changes — pure content work, reversible per ADR-0024.
