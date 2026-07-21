# v3 research — 4-repo reference audit

This document records the research that shaped v3. v2's research used a
web-search fan-out (27 sources) to find the optimal default skill
computation type. v3 is different: the user explicitly named four
cloned reference repositories and asked which of their ideas dstack
should adopt.

The question that drove the research:

> Given dstack's v2 state (strict spec-compliant catalog renderer,
> 4-type taxonomy, bundled resources, eight skills), what can be
> adopted from the four reference repositories — superpowers, gstack,
> mattpocock-skills, anthropics-skills — to make the **quality of
> output Claude Code produces when using a dstack-rendered skill**
> measurably better?

The user is on Claude Code Max 20x, not the API. Token economy is not
a constraint. The bar is output quality.

## Method

| Layer | Count | Description |
|---|---|---|
| Reference repos | 4 | Cloned locally, audited top-down |
| Audit dimensions | 6 | Purpose, structure, organisation, schema, validation, distribution |
| Idea candidates | ~30 | Distilled across the four repos |
| Idea → milestone | 24 | Adopted (mapped to M40–M60: validators, snapshots, workflow skills, eval+benchmark+UAT) |
| Idea → DEFERRED | 7 | Considered, deferred with trigger |
| Idea → rejected | 9 | Conflict with ADR or dstack DNA |

Sources:

- `~/KODING/WORKSPACE-MH/superpowers` — multi-harness skill
  methodology with bootstrap hook.
- `~/KODING/WORKSPACE-MH/gstack` — operational workflow hub
  with persistent browser daemon, security scanning, eval suite.
- `~/KODING/WORKSPACE-MH/mattpocock-skills` — personal skill
  catalog with domain-driven design and bucket organisation.
- `~/KODING/WORKSPACE-MH/anthropics-skills` — official
  Anthropic reference catalog with the formal spec.

The audit was done in parallel against the dstack codebase to spot
gaps and friction points — those gaps are what each adopted idea
addresses.

## Per-repo distilled findings

### 1. superpowers — RELEASE-NOTES discipline and contributor guardrails

The repo's `CLAUDE.md` carries an explicit "94% PR rejection rate"
warning to AI agents and a pre-submission checklist. Its
`RELEASE-NOTES.md` is version-driven, with behavioural tests embedded
inline. The skills are triggered automatically via a bootstrap hook
at session start.

Adopted:

- **RELEASE-NOTES.md discipline** — landed as M57 (repo-level
  release notes) plus M45 (per-skill `## Changes` section). dstack
  inherits the spirit (version-driven, terse, one bullet per change)
  without the cross-harness apparatus.
- **Four foundational workflow skills** — landed as M49:
  `writing-plans`, `executing-plans`,
  `finishing-a-development-branch`, `receiving-code-review`.
  superpowers presents these as a connected workflow (plan → execute
  → finish → respond-to-review). dstack adopts them verbatim in
  intent, re-authoring the bodies to fit dstack's voice (neutral,
  terse, direct) and to cite the M41–M44 validator vocabulary. They
  fill the workflow gap the audit surfaced and unlock M55's bucket
  threshold (8 → 13 skills).
- **TDD-for-skill-authoring discipline** — landed inside M47.
  superpowers' `writing-skills` skill applies TDD to skill bodies:
  write baseline test cases (now `eval/cases.jsonl` via M48), then
  the skill, then refactor against failing cases. M47's body adopts
  this pattern explicitly.

Considered, not adopted:

- Bootstrap-hook auto-triggering. dstack uses explicit invocation
  (Claude Code's slash-command model). Auto-triggering would conflict
  with ADR-0001 (no IO at domain level) and the spec at
  agentskills.io. **Rejected.**
- Subagent dispatch pattern (each skill spawns its own subagent for
  isolated context). dstack's renderer is sync and skills do not
  orchestrate other skills. **Rejected for v3** — DEFERRED entry
  added (D26 in DEFERRED.md).
- Cross-harness testing (CI runs against Codex/Cursor/Claude Code in
  parallel). dstack is single-host per ADR-0002. **Rejected** (the
  port is in place; an adapter ships only when a host demands it).

### 2. gstack — operational learning surfacing and atomic writes

gstack ships a persistent browser daemon, an ML-based prompt-injection
classifier, a security dashboard, and a learnings.jsonl that captures
operational failures and surfaces them in future sessions. Most of
this is out of scope for dstack (single user, single host, no daemon
need). Two patterns are worth borrowing.

Adopted:

- **Narrative doctor output with operational signal** — landed in M53.
  dstack's `doctor` will optionally read
  `~/.dstack/telemetry/events.jsonl` (already emitted by the v1
  `FileTelemetry` adapter) and surface last-build status in the
  narrative. Read-only, silent-skip on missing file. The learnings
  loop is lighter than gstack's full capture mechanism but rests on
  the same insight: surface yesterday's failures so today's session
  can avoid them.

Already present in dstack:

- **Atomic file writes** — `FsInstaller` already uses
  `tmp.${process.pid}` + `renameSync`. Confirmed in code read; no
  work needed. M54 (application-layer unit tests) will add a test
  that asserts the temp-file pattern survives a thrown error
  mid-write.

Considered, not adopted:

- Persistent browser daemon, ML classifier, security dashboard,
  workspace-versioning, compiled binaries. All conflict with
  dstack's scope (one user, one host) or with ADR-0005 (Bun + TS,
  no compiled binary distribution) or ADR-0006 (telemetry local-only,
  opt-in). **Rejected.**
- Canary token injection (random token in system prompt, rolling
  buffer scan for exfiltration). Real concept, but premature: dstack
  has no remote attack surface. **Rejected for v3.**
- Diff-based two-tier test selection (gate vs periodic). Attractive
  but dstack's test suite is small enough that the entire suite
  runs in milliseconds. **Rejected for v3** — DEFERRED D25.

### 3. mattpocock-skills — bucket organisation and setup-driven config

mattpocock's catalog organises skills into top-level buckets
(`productivity/`, `engineering/`, `misc/`, `in-progress/`,
`deprecated/`) each with a human-written README. The `CONTEXT.md`
file maps domain terminology (Issue tracker, Issue, Triage role) to
real label strings so the agent decodes jargon once. The installer
asks setup-time questions (issue-tracker type, triage labels, doc
location) and writes a per-repo config.

Adopted:

- **Bucket organisation** — landed as M55. dstack uses a domain-led
  bucket enum (`engineering | productivity | review | workflow |
  misc`) with optional `metadata.dstack.bucket` field and dual layout
  (flat or nested under `skills/<bucket>/`). v1 M17 was gated on 10+
  skills; with Track A adding M47 `/write-a-skill` plus M49's four
  workflow skills plus the v1-legacy migration, the catalog reaches
  13 skills and the threshold fires.
- **Grill-me discipline** — merged into existing `brainstorm` during
  M40. mattpocock's `grill-me` interview pattern (one question at a
  time + a recommended answer per question) is more focused than
  dstack's current `brainstorm`. M40 incorporates the discipline so
  the polished `brainstorm` ships with v3.
- **Setup-time wizard** — landed as M46. `dstack new` (no args)
  launches a readline-driven wizard that asks the right questions
  in order (id, type, description, triggers, side_effects, agency).
  Different from mattpocock's per-repo setup (which asks about
  external integrations); dstack's wizard scaffolds a single skill
  with inline validation.
- **Domain language / glossary pattern** — partially adopted. dstack
  already has a root-level `CONTEXT.md` for itself. v3 does not add
  per-skill glossaries (overkill for a single-user catalog), but the
  M58 mini-spec uses the same shared-terminology insight: each
  `metadata.dstack.*` field has one normative definition that all
  validators and error messages reference.

Considered, not adopted:

- Caveman compression mode (skill that compresses responses by 75%).
  dstack does not host conversational skills; this is a host-level
  concern. **Rejected.**
- Zoom-out architectural-perspective skill. Existing dstack skills
  (`debugging`, `code-review`) already cover the territory.
  **Rejected for v3** — could be considered as a future skill if the
  user requests it.
- Newsletter-driven feedback loop. Out of scope for a single-user
  catalog. **Rejected.**

### 4. anthropics-skills — meta-skill pattern and formal spec

The official reference catalog ships 19 skills in domain-organised
folders (creative, technical, enterprise, document). The
`skill-creator` meta-skill is a skill for creating skills with
built-in eval testing, benchmark, and description optimizer. The
`spec/agent-skills-spec.md` is the formal normative document that
agentskills.io publishes. Skills bundle resources in
`/agents/`, `/assets/`, `/eval-viewer/`, `/references/`, `/scripts/`
sub-folders.

Adopted:

- **Meta-skill `/write-a-skill`** — landed as M47. Hybrid skill,
  bundled `scripts/check.sh` runs the validator, bundled
  `references/quality-checklist.md` enumerates the M41–M44 warning
  kinds. Self-test in CI: the meta-skill must pass its own rules.
- **Formal mini-spec** — landed as M58. dstack publishes
  `docs/spec/dstack-skill-spec.md` describing every
  `metadata.dstack.*` extension. The agentskills.io baseline is the
  upstream spec dstack defers to; the mini-spec only documents the
  extensions.
- **Eval harness inspiration** — partial. anthropics-skills'
  skill-creator bundles eval cases as `evals/cases.jsonl`. dstack
  v3's M48 adopts the same fixture format (`skills/<id>/eval/
  cases.jsonl`) but runs the eval via `claude -p` subprocess, not a
  hosted runner.

Already present in dstack:

- **Bundled resources** — v2 M25 shipped `scripts/`, `references/`,
  `assets/` (plus free-form sub-folders). No new work in v3.

Considered, not adopted:

- MCP builder skill. Useful but orthogonal to dstack's mission
  (dstack is a catalog renderer, not an MCP authoring tool). The
  user can hand-author MCP skills via the standard authoring flow.
  **Rejected for v3.**
- Domain taxonomy for examples (creative / technical / enterprise /
  document). dstack v3's bucket enum (M55) is closer to
  mattpocock's domain (engineering / productivity / etc.) which fits
  the actual skills in this catalog better. **Rejected** — different
  axis.
- Plugin marketplace registration (`/plugin marketplace add
  anthropics/skills`). Distribution surface, not authoring concern.
  **Rejected** — DEFERRED D6 from v1 still applies.

## Idea → milestone mapping table

| Idea | Source repo | Adopted? | Milestone | Rationale |
|---|---|---|---|---|
| Trigger-body coherence check | dstack gap analysis | Yes | M41 | Silent drift between triggers and body is the biggest content-quality risk |
| Description accuracy check | dstack gap analysis | Yes | M42 | Description is what Claude Code reads to load the skill |
| Required body structure | dstack gap analysis | Yes | M43 | Convergent v2 convention, now enforced |
| Cross-reference validity | dstack gap analysis | Yes | M44 | Prevents silent rot in `[[id]]` and relative links |
| RELEASE-NOTES discipline | superpowers | Yes | M45, M57 | Per-skill + repo-level |
| Interactive setup wizard | mattpocock | Yes | M46 | Closes the schema-to-skill gap |
| Meta-skill for authoring | anthropics-skills, superpowers | Yes | M47 | Single source of authoring guidance; TDD pattern from superpowers |
| LLM-judge eval harness (absolute) | anthropics-skills, v1 D3 | Yes | M48 | User concern (quality > tokens) unlocks v1 D3 trigger |
| LLM-judge pairwise comparison | gap analysis (user challenge) | Yes | M48 (`--vs`) | Without it, "dstack is better" is unverifiable |
| Multi-candidate comparative benchmark | gap analysis (user goal) | Yes | M59 | Track C ship gate; head-to-head against all 4 ref catalogs |
| UAT scenarios per skill | gap analysis (user goal) | Yes | M60 | Human-validated quality gate; final arbiter beyond LLM-judge |
| Quality measurement methodology (ADR-0023) | gap analysis (user goal) | Yes | M48, M59, M60 | Formalises rubric, anonymisation, repeat protocol, limitations |
| `writing-plans` skill | superpowers | Yes | M49 | Universal plan-writing discipline absent from dstack |
| `executing-plans` skill | superpowers | Yes | M49 | Pair with `writing-plans` to complete the workflow loop |
| `finishing-a-development-branch` skill | superpowers | Yes | M49 | Structured branch wrap-up; complements `verification` |
| `receiving-code-review` skill | superpowers | Yes | M49 | Receiver-side counterpart to existing `code-review` |
| `grill-me` interview discipline | mattpocock | Yes | M40 | One-question-at-a-time pattern merged into `brainstorm` |
| Snapshot rendered output | dstack gap analysis | Yes | M50 | Pins the byte-level contract |
| Template helper consolidation | dstack gap analysis | Yes | M51 | Renderer hygiene under snapshot pin |
| `--check` / `--json` flags | dstack gap analysis | Yes | M52 | Scriptability for CI and editors |
| Narrative doctor + telemetry surface | gstack (light) | Yes | M53 | Surface yesterday's failures, today |
| Application-layer unit tests | dstack gap analysis | Yes | M54 | Failure-mode isolation |
| Bucket organisation | mattpocock, anthropics-skills | Yes | M55 | Unlocks v1 M17 (10+ skills threshold) |
| Documentation cleanup | dstack gap analysis | Yes | M56 | v2 shipped; v1 jargon must go |
| Formal mini-spec | anthropics-skills | Yes | M58 | Single normative doc for `metadata.dstack.*` |
| Atomic file writes | gstack | Already present | — | `FsInstaller` already does this |
| CONTEXT.md per skill | mattpocock | Partial | M58 | Mini-spec replaces the role; per-skill defer |
| Bootstrap hook auto-trigger | superpowers | No | — | Conflicts with ADR-0001 + invocation model |
| Subagent dispatch pattern | superpowers | No | DEFERRED D26 | Out of scope for a renderer |
| Persistent browser daemon | gstack | No | — | Out of scope; conflicts with ADR-0007 |
| ML prompt-injection defense | gstack | No | — | No remote attack surface |
| Canary token injection | gstack | No | — | Premature for single-user catalog |
| Compiled binaries | gstack | No | — | ADR-0005 (Bun + TS only) |
| Multi-harness cross-test | superpowers | No | v1 D1 / v2 D12 | Single-host until host demands non-spec field |
| Plugin marketplace | anthropics-skills | No | v1 D6 | Distribution surface; user is the only consumer |
| Caveman compression | mattpocock | No | — | Host-level concern, not catalog |
| MCP builder skill | anthropics-skills | No | — | Orthogonal to catalog mission |

> **2026-06-02 update.** The "Subagent dispatch pattern" row above was
> revisited under [ADR-0024](../../adr/0024-catalog-breadth-over-yagni.md):
> the *skills* were imported (prose only), but the *renderer-primitive*
> rejection still stands (DEFERRED D26). See the fourth-pass note below.

## Rejected ideas with rationale

The audit surfaced ideas that look attractive in isolation but
conflict with dstack's accepted ADRs or its scope. Listing them
explicitly so future iterations do not re-litigate:

1. **Bootstrap hook auto-trigger** (superpowers). Skills auto-firing
   at session start. Conflicts with ADR-0001 (no IO in domain) and
   with the agentskills.io invocation model.
2. **Persistent browser daemon** (gstack). 58MB Bun-compiled binary
   with HTTP server. ADR-0005 rejects compiled binaries; ADR-0007
   keeps `browse` (when it eventually ships) in its own process and
   limits its surface.
3. **ML prompt-injection classifier** (gstack). 22MB ONNX model
   bundled at runtime. dstack has no remote attack surface, no
   tool-call adapter, no daemon — defending against prompt injection
   at the catalog layer solves a problem the catalog does not have.
4. **Canary token injection** (gstack). Random token in system
   prompt, rolling-buffer scan on output. Same reason as #3.
5. **Compiled binaries** (gstack). `bun build --compile` distribution.
   ADR-0005 stands.
6. **Cross-harness CI** (superpowers). Run skills against Codex,
   Cursor, Claude Code in parallel. v1 D1 / v2 D12 still apply: the
   `HostRenderer` port is in place; an adapter ships when a real
   host demands one.
7. **Plugin marketplace** (anthropics-skills). `/plugin marketplace
   add` is a distribution surface. dstack is single-user; v1 D6
   still applies.
8. **Caveman compression mode** (mattpocock). Skill that compresses
   responses by 75%. Host-conversation concern, not catalog.
9. **MCP builder skill** (anthropics-skills). Orthogonal to a
   catalog renderer; the user can author MCP skills via the
   standard flow.

## Key insight

Quality of skill output does not scale with the size of the catalog.
Three pressure points matter:

1. **Validator depth** — the validator must catch content-level rot,
   not just structural rot.
2. **Eval harness on-demand** — measurement beats subjective review,
   and the user's setup (Claude Code Max 20x) makes the cost
   negligible.
3. **Authoring DX** — a meta-skill plus an interactive wizard plus a
   formal spec reduce the gap between a fresh template and a passing
   skill.

The four reference repos converge on three of those pressure points
in different ways:

- anthropics-skills via the meta-skill pattern and the formal spec.
- mattpocock via bucket organisation and setup-time configuration.
- superpowers via release-notes discipline and contributor
  guardrails.
- gstack via operational learning surfacing (which dstack adopts in
  light form: doctor reads telemetry events).

The combination is what v3 ships. The pieces that do not fit dstack's
scope (multi-harness, daemon, ML defense, compiled binaries) stay in
the reference repos where they belong.

## Verdict (informing ROADMAP.md)

**Adopt 24 ideas across M40–M60. Defer 7. Reject 9.**

The adopted set spans four families:

1. **dstack gap analysis** (deeper validation, snapshot tests, CLI
   polish, app-layer tests, renderer refactor) — M40–M44, M50–M56.
2. **Reference imports** (RELEASE-NOTES discipline, bucket
   organisation, meta-skill, formal spec, eval harness, four
   workflow skills, grill-me interview discipline) — M45–M47, M49,
   M55, M57, M58.
3. **Measurement & validation** (LLM-judge absolute + pairwise,
   multi-candidate benchmark, UAT scenarios, quality methodology) —
   M48, M59, M60 + ADR-0023.
4. **Honest framing** of the "better than references" claim — built
   into the thesis, not a separate milestone.

The result is a v3 that improves output quality across four
pressure points while preserving every accepted ADR, grows the
catalog from 8 to 13 skills (unlocking the v1 M17 bucket threshold),
and — most importantly — **closes the measurement gap that earlier
plan iterations left open**. Without Track C (M48 + M59 + M60), the
claim "dstack is better" is unverifiable.

### Audit follow-up — first-pass second-pass third-pass review

This RESEARCH document carries four layers of audit:

1. **First pass** — initial fan-out across the four cloned repos
   produced 14 adopted ideas mapped to M40–M58, primarily focused
   on catalog tooling (validators, snapshots, CLI polish) and a
   light eval harness (M48 absolute mode).
2. **Second pass** — direct comparison of dstack's eight skills
   against actual reference-repo file listings surfaced four
   universal workflow skills missed by the first pass: `writing-
   plans`, `executing-plans`, `finishing-a-development-branch`,
   `receiving-code-review`. All four were added as M49.
   mattpocock's `grill-me` interview discipline was merged into
   M40. **Adopted count rose from 14 to 19.**
3. **Third pass** — user challenge ("how do we know dstack skills
   are better than the references?") exposed that v3 had no
   comparative measurement mechanism. M48 was extended with a
   pairwise `--vs` mode, M59 (`dstack benchmark`) was added for
   multi-candidate comparison, M60 (UAT scenarios) was added for
   human-validated final acceptance, and ADR-0023 was queued to
   formalise the methodology. The v3 thesis was rewritten to
   replace assertion with falsifiable hypothesis. **Adopted count
   rose from 19 to 24.**
4. **Fourth pass (2026-06-02)** — a different axis from the first
   three. The user directed importing the remaining proven superpowers
   skills as-is, relaxing YAGNI for skill *content* (now
   [ADR-0024](../../adr/0024-catalog-breadth-over-yagni.md)). This
   adopted the subagent-dispatch skills the audit had rejected — but
   only as prose skills; the *renderer-primitive* rejection still stands
   (DEFERRED D26). `receiving-code-review` (M49) was folded into the
   existing `code-review` rather than shipped separately. Hardening all
   imports to the dstack bar is tracked in
   [skill-hardening-plan.md](skill-hardening-plan.md).

The first three passes narrowed the gap between "we believe v3 is
better" and "here is the evidence." The third pass is what turns dstack
v3 from an opinion into an experiment. The fourth widened the catalog
rather than sharpening the measurement.

See [ROADMAP.md](ROADMAP.md) for the milestone list and the
[DEFERRED.md](DEFERRED.md) for ideas held back with trigger
conditions.

## Sources

### Cloned reference repositories (4)

- [`~/KODING/WORKSPACE-MH/superpowers`](~/KODING/WORKSPACE-MH/superpowers) — obra/superpowers, multi-harness skill methodology
- [`~/KODING/WORKSPACE-MH/gstack`](~/KODING/WORKSPACE-MH/gstack) — gstack, operational workflow hub
- [`~/KODING/WORKSPACE-MH/mattpocock-skills`](~/KODING/WORKSPACE-MH/mattpocock-skills) — mattpocock/skills, domain-driven skill library
- [`~/KODING/WORKSPACE-MH/anthropics-skills`](~/KODING/WORKSPACE-MH/anthropics-skills) — anthropics/skills, official reference catalog

### dstack internal references (consulted during audit)

- [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md) — port + adapter inventory
- [`docs/code-taxonomy.md`](../../code-taxonomy.md) — coding rules
- [`docs/plans/v2/ROADMAP.md`](../v2/ROADMAP.md) — v2 milestone list
- [`docs/plans/v2/RESEARCH.md`](../v2/RESEARCH.md) — v2 web-search findings
- [`docs/plans/v2/DEFERRED.md`](../v2/DEFERRED.md) — v2 YAGNI register
- [`docs/adr/`](../../adr/) — ADR 0001–0017

### Upstream specs (deferred to)

- [agentskills.io specification](https://agentskills.io/specification) — the format dstack output conforms to
- [Anthropic Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — implementation reference
