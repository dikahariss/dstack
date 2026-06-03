# Deferred from v1 — YAGNI register

This document lists features that are deliberately NOT in v1. Each
entry includes the reason for deferral and the conditions that would
make us reconsider.

Reading this list and thinking "I want feature X" is not the same as
needing X. Before building any item from this list, check whether the
listed "trigger to revisit" has actually happened.

## Terms used in this document

| Term | Definition |
|---|---|
| YAGNI | "You Aren't Gonna Need It." A discipline of not building features until they are actually needed. |
| Trigger | A concrete condition that, if it becomes true, makes us reconsider whether to build the feature. |
| Estimated effort | AI-pair time, measured the same way as `ROADMAP.md`. |

---

## D1 — Multi-host renderer (Codex, Kiro, OpenCode, etc.)

- **Why deferred.** One user, one AI host (Claude Code).
  [ADR-0002](../../adr/0002-single-host-v0.md) covers the
  reasoning.
- **What is in place.** The `HostRenderer` port is defined. Adding a
  host requires one new adapter file and one wiring line.
- **Trigger to revisit.** A named real user wants Codex, Kiro, or
  similar, AND has agreed to maintain the adapter.
- **Estimated effort when triggered.** 2 to 3 hours for the first
  additional host. About 1 hour for each host after that.

## D2 — Hook engine (skill-controlled PreToolUse, PostToolUse)

- **Why deferred.** Some skills (such as `/careful`) want to intercept
  Claude Code tool calls before they run. Implementing hook routing
  would require changes to the renderer (frontmatter passthrough) and
  possibly a runtime daemon for shared state. This is outside the v0
  surface.
- **What is in place.** The renderer copies known frontmatter fields
  only. Unknown fields (like `hooks:`) are dropped silently. `/careful`
  ships as advisory text and documents the degradation in its own
  prompt body.
- **Status note (v0.1.0).** One skill (`/careful`) already wants
  hooks. By itself this is not enough to elevate D2 — one degraded
  skill is acceptable in v0.x. The elevation threshold is **two or
  more skills** that materially need hooks (for example, a future
  `/freeze`/`/guard` pair that has to block file edits, not just
  remind the user).
- **Trigger to revisit.** A second v1 skill needs runtime
  interception, OR a real incident traces to `/careful`'s advisory
  behavior failing where hook enforcement would have caught it.
- **Estimated effort when triggered.** 3 to 5 hours. Implementation
  should start with a `HookEngine` port plus contract tests, then a
  minimal adapter that supports `PreToolUse` only — not a general
  hook framework. A new ADR is required.

## D3 — LLM-judge evaluation harness

- **Why deferred.** [ADR-0009](../../adr/0009-spec-driven-skills.md)
  describes the reason. LLM evaluations matter when a second person
  is shipping skills that the original author cannot review by hand.
  Today, the same person writes and reviews. Self-judging is enough.
- **What is in place.** Contract tests for ports. Static validation
  (planned in roadmap milestone M4).
- **Trigger to revisit.** A second contributor lands a skill pull
  request, OR a ported skill quietly degrades and we lack a way to
  detect it.
- **Estimated effort when triggered.** 1 to 2 weeks. This is the
  largest deferred item.

## D4 — `packages/browse/` implementation

- **Why deferred.** No v1 skill needs browser automation yet. Building
  the package before there is a real caller is speculation.
  [ADR-0007](../../adr/0007-browse-separate-process.md) keeps
  the boundary so that the port is mechanical when the need is real.
- **What is in place.** `packages/browse/README.md` describes the
  planned layout and the contract for cross-package communication
  (child process or HTTP).
- **Trigger to revisit.** A v1 skill (such as a hypothetical `/qa` or
  `/review` against a staging URL) needs browser automation.
- **Estimated effort when triggered.** 2 to 4 weeks. A clean
  implementation is on the order of 20,000 to 25,000 lines. This work
  needs its own ADRs under `packages/browse/docs/adr/`.

## D5 — Remote telemetry endpoint

- **Why deferred.** [ADR-0006](../../adr/0006-telemetry-opt-in.md)
  is explicit: telemetry is local only. Adding a remote endpoint
  would require a new ADR plus a major version bump plus an explicit
  user consent flow.
- **What is in place.** Local-only `FileTelemetry`. Opt-in by
  environment variable.
- **Trigger to revisit.** dstack becomes a published or widely-shared
  tool, AND the maintainer designs an explicit consent flow, AND a
  specific question exists that only aggregate data can answer.
- **Estimated effort when triggered.** 1 to 2 weeks. Includes the
  consent flow and the new ADR.

## D6 — Plugin or extension system

- **Why deferred.** No external contributors today.
  [ADR-0004](../../adr/0004-no-template-engine-v0.md) (YAGNI
  guard) applies here too.
- **Trigger to revisit.** A second person wants to ship a skill that
  requires rendering behavior dstack does not have, AND the change
  cannot reasonably be added to dstack core.
- **Estimated effort when triggered.** Reject by default. Prefer
  contributing the new behavior to dstack core. A plugin system is a
  last resort.

## D7 — Auto-update mechanism (`dstack upgrade`)

- **Why deferred.** Single user, one machine. Manual `git pull`
  works. An auto-update mechanism that is throttled, network-failure
  safe, and non-blocking is real engineering we do not need yet.
- **Trigger to revisit.** dstack is used on 3 or more machines, OR
  by 2 or more people who do not automatically know when an update
  is available.
- **Estimated effort when triggered.** 4 to 6 hours. The hard part
  is making it not block startup when the network is bad.

## D8 — Sidebar, Chrome extension, integrated browser product

- **Why deferred.** Out of scope. dstack is a skill catalog renderer,
  not a product surface. A browser-integrated sidebar belongs in a
  separate tool, not in dstack.
- **Trigger to revisit.** Probably never. If the user wants a
  sidebar, the answer is to use a separate tool, not to rebuild it
  inside dstack.

## D9 — Worktree / parallel-session integration

- **Why deferred.** dstack development today happens in one working
  directory. Tooling that manages multiple parallel sessions
  (worktrees, isolated workspaces) is not part of v1.
- **Trigger to revisit.** dstack development moves into a multi-
  worktree setup AND we hit a real conflict.
- **Estimated effort when triggered.** 1 to 2 hours.
- **Status (2026-06-02).** Tangential, no action. A `using-git-worktrees`
  *skill* was imported under
  [ADR-0024](../../adr/0024-catalog-breadth-over-yagni.md), but this
  entry concerns dstack's *own* development moving to a multi-worktree
  setup — which has not happened. Shipping a worktree skill for the
  user's general work does not fire this trigger.

## D10 — Team-mode install

- **Why deferred.** A `--team` mode that bootstraps a project
  repository so teammates get dstack automatically when they clone
  is a multi-user feature. dstack is single-user.
- **Trigger to revisit.** Same trigger as D5: dstack becomes a shared
  tool.

## D11 — Exact token counting on demand

- **Why deferred.** Originally tracked as ROADMAP M2 ("real Anthropic
  tokenizer"). The opt-in implementation was built end-to-end, tested
  against the live API, and then removed: requiring an API key, a
  network call, and an extra runtime dependency for every build was
  not worth the ±1% accuracy gain over the offline approximation.
  The 90% near-budget warning fires well inside the approximation's
  ±10% error band, so coarse counting is enough for the
  budget-enforcement contract.
- **What is in place.** `approximateTokenCount` in
  `src/adapters/claude-code/tokens.ts`. Inlined into
  `ClaudeCodeRenderer` (no port, per ADR-0001 YAGNI guard).
- **Trigger to revisit.** A real skill lands within 5% of its budget
  AND the approximation is reported wrong by a meaningful margin in
  production use.
- **Estimated effort when triggered.** 2 to 3 hours. The shape would
  be a separate `dstack count <skill-id>` subcommand that shells out
  to `claude -p --output-format json` (reusing the user's existing
  Claude Code auth) and prints `usage.input_tokens` — not a
  per-build dependency. No API key required.

---

# How to read this list

Each entry is a **promise to revisit when the trigger fires**, not a
"never." When the trigger does fire, the item moves into ROADMAP for
the relevant version (v1.1, v2, etc.).

If you read this list and think "I want item X," resist building it.
Ask: has the trigger fired?

- If yes: open ROADMAP and add it.
- If no: document why you want it (update this file with a "Why I want
  this" note), and check back next sprint. Most deferred items stay
  deferred forever, and that is the correct outcome. The trigger was
  never going to fire.

---

# Items that are rejected (not deferred)

These items are NOT in v1 and are unlikely to ever be in dstack.

| Item | Why rejected |
|---|---|
| Template variable substitution in `prompt.md` (`{{var}}`) | [ADR-0003](../../adr/0003-skill-as-data.md). The prompt is what the LLM sees. Variable substitution is the host's job, not the renderer's. |
| A plugin marketplace | dstack is not a platform. |
| Web UI for editing skills | Skills are text files. Edit them in a text editor. |
| A daemon for hot-reloading the skill catalog | `dstack build` runs in under 1 second for 100 skills. Daemons add complexity for no real benefit. |
| Skill dependency graph ("this skill requires that one") | If two skills genuinely depend on each other, they should be one skill. The `includes:` mechanism (roadmap M3) covers the legitimate sharing cases. |
