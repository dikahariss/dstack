# dstack v1 — Roadmap

The list of work needed to take dstack from v0.1.0 (Phase 1 complete:
architecture in place, one skill, CLI warnings + file:line errors
shipped) to v1 (useful as a daily replacement for the workflows the
user runs most often, single user).

Each milestone has:

- **Why**: the user problem this solves.
- **Acceptance**: the concrete conditions that mark the milestone as
  done.
- **Effort**: estimated time, in "AI-pair time" (one person working
  with Claude as a coding partner).
- **Depends on**: other milestones that must finish first.
- **Open questions**: decisions still to make.

## Phase 1 (shipped in v0.1.0)

The first tagged version landed these milestones. Their entries have
been moved to [DONE.md](DONE.md):

- **M5** — Renderer warnings printed in CLI output.
- **M6** — `VERSION` file plus `CHANGELOG.md` discipline.
- **M15** — Errors carry `file[:line]` source location.

Plus two non-ROADMAP additions:

- **A1** — `CONTEXT.md` at repo root (domain language glossary).
- **A3** — `dstack new <skill-id>` scaffolding command.

**M2 (real Anthropic tokenizer) was explored and rejected.** The
opt-in design was built end-to-end, then removed: the API-key /
network / extra-dep cost outweighed the ±1% accuracy gain over the
offline approximation. Precise counting may return as an on-demand
subcommand (see [DEFERRED.md](DEFERRED.md)).

## Tier classification

This roadmap uses MoSCoW prioritization. MoSCoW stands for "Must,
Should, Could, Would-not." We use three of the four tiers.

| Tier | Meaning |
|---|---|
| **Must** | dstack cannot be considered v1 without this. |
| **Should** | High value, but v1 can ship without it. |
| **Could** | Nice to have. Postpone if the higher tiers take longer than expected. |

---

# Must (blocking for v1)

## M1 — Add 5 or more useful skills

- **Why.** dstack with one skill is a demo. dstack with the workflows
  the user runs daily is a tool.
- **Candidate skills**, in order of likely usefulness to the user:
  1. `/tdd` — test-driven development discipline (red-green-refactor
     loop). Differentiator: nudges the agent into a feedback-loop
     habit that other skill catalogs do not enforce. Adapted from
     publicly documented patterns; no external dependency.
  2. `/retro` — weekly reflection. Stand-alone. No hooks needed.
  3. `/investigate` — root-cause debugging methodology. Plain prose
     skill.
  4. `/review` — code review of the current diff. Uses the `Bash`
     tool only.
  5. `/context-save` and `/context-restore` — session continuity.
     Lower priority than the others because it overlaps with
     CONTEXT.md plus normal Claude session resume.
  6. `/ship` — the workflow that ties many others together. A full
     ship workflow can run wide (tens of thousands of tokens); for
     dstack, plan to split it into smaller skills or trim to fit the
     16 000-token ceiling.
- **Acceptance**:
  - 5 (or more) skills live under `skills/<skill-id>/`.
  - All pass `bun run build` (no `TokenBudgetExceededError`).
  - Each skill has a one-line note in its prompt body that documents
    any deliberate behavior differences from the reference (advisory
    vs enforcement, etc.).
  - At least one skill is actually used by the user in real work.
  - `/tdd` is included unless explicitly de-prioritised in writing —
    it is the differentiator versus prose-only skill catalogs.
- **Effort**: 1 to 2 hours of AI-pair time per skill. Total: 6 to 12
  hours for 5-6 skills.
- **Depends on**: Nothing structural. Token counting is approximate;
  for any skill that lands near its budget, verify the count by hand
  (paste the rendered SKILL.md into the Anthropic console or run a
  spot-check via `claude -p --output-format json`).
- **Open questions**:
  - Does `/ship` exceed the 16,000-token ceiling? If yes, either split
    it into smaller skills, or write a new ADR that raises the ceiling
    for this one skill.
  - Which candidate skills carry too much harness-specific telemetry
    or preamble to import cleanly? Record those in the skill's
    comments.

## M3 — Resolve `includes:` directive

- **Why.** The skill specification says skills can reference
  `_shared/*.md` snippets. Today the field is parsed but not used. A
  skill that lists `includes` in `skill.yaml` is accepted but the
  files are not actually included in the output. This is a documented
  contract that is broken in code.
- **Acceptance**:
  - `FileSkillRepository` resolves `includes` from `skills/_shared/*.md`.
  - The renderer concatenates the included content before the
    `prompt.md` content.
  - `IncludeNotFoundError` is raised if a referenced file does not
    exist.
  - A test verifies that a fixture skill with
    `includes: [_shared/foo.md]` renders the snippet's content in the
    output.
  - Cycle detection: if file A includes file B, and B includes A, the
    renderer emits a warning of kind `include-cycle-broken` and stops
    following the chain.
- **Effort**: 1 hour.
- **Depends on**: Nothing.
- **Open questions**:
  - Where should included content appear: at the top of the prompt or
    at the bottom? **Decision: at the top.** Includes set context;
    the prompt body acts on that context.
  - Should we support nested includes (one include file that itself
    has an `includes` directive)? **Decision at planning: yes, with
    a depth limit of 4 and cycle detection.** Revisited during
    implementation: no skill needs nesting yet, so the depth tracking
    was removed per code-taxonomy Anti-pattern 8 (structure for
    hypothetical future flexibility). Duplicate-path cycle detection
    on the flat list remains.

## M4 — `dstack validate` command

- **Why.** Today, a broken skill fails at build time. With many
  skills, the user wants fast per-skill feedback without running the
  full render. The validate command is also a natural pre-commit hook:
  validate skills before staging them in git.
- **Acceptance**:
  - `bun run dstack validate` walks the `skills/` directory.
  - It reports each skill's status: pass or fail, with file and line
    context if known.
  - Exit code is 0 if every skill is valid. Exit code is 1 if any
    skill is invalid.
  - Output is greppable: each line begins with `<skill-id>: OK` or
    `<skill-id>: ERR <message>`.
- **Effort**: 1 hour.
- **Depends on**: Nothing structural. Reuses the existing repository
  and parser code.
- **Open questions**:
  - Should `validate` also count tokens? **Decision: yes.** Budget
    overrun is the most common silent breakage. Catching it without
    rendering is cheap.

---

# Should (high value, not blocking)

## M7 — `dstack list` command

- **Why.** Today there is no way to ask "what skills do I have, what
  versions, and what is their token cost?" except by running `ls -la
  skills/` and reading each yaml file.
- **Acceptance**:
  - `dstack list` prints a table with columns: id, version, tokens,
    tools, first line of description.
  - `dstack list --json` prints the same data as JSON for programs
    that consume it.
- **Effort**: 45 minutes.
- **Depends on**: Nothing. Token counts shown are approximate (±10%);
  the column header should note "approx" to make that explicit.

## M8 — Contract suite for `HostRenderer`

- **Why.** ADR-0001 says one of the payoffs of hexagonal architecture
  is a shared contract test suite for each port. Only
  `SkillRepository` has such a suite today. When a second renderer is
  added (a hypothetical Codex adapter), there is no shared suite to
  catch drift between them.
- **Acceptance**:
  - `test/contract/HostRenderer.contract.ts` defines a shared suite.
  - `ClaudeCodeRenderer.contract.test.ts` runs the suite against the
    Claude Code adapter.
  - The suite tests these invariants: rendering is deterministic
    (same input gives same output); the reported token count matches
    the body length; the frontmatter is parseable YAML; warnings are
    surfaced in the result.
- **Effort**: 45 minutes.
- **Depends on**: Nothing.

## M9 — Contract suite for `Installer`

- **Why.** Same reasoning as M8. `FsInstaller` is the only
  implementation today. A future installer (one that writes a JSON
  manifest instead of individual files, for example) needs the same
  suite.
- **Acceptance**:
  - The shared suite covers: idempotent install (a second run reports
    "skipped" for unchanged files); orphan file removal (skills that
    existed but no longer do are removed from the output directory);
    path policy enforcement (writes outside allowed roots throw).
- **Effort**: 30 minutes.
- **Depends on**: Nothing.

## M10 — End-to-end integration test (and build-time benchmark)

- **Why.** Today, the proof that the chain works is that `bun run
  build` succeeded once on the developer's machine. This proof needs
  to live in the test suite, so that a future refactor cannot
  silently break the wiring. Plus: the docs claim "`dstack build`
  runs in under 1 second for 100 skills." That claim is currently
  unverified; a regression could slip in silently as skill count
  grows.
- **Acceptance**:
  - `test/integration/build-and-install.test.ts` does this: creates
    a temporary `skills/` directory; wires the real adapters (file
    repository, file installer, Claude Code renderer); runs
    `BuildCatalog` and `InstallSkills`; asserts that files appear on
    disk with expected content.
  - The test cleans up its temporary directory afterward.
  - A second case in the same file generates 100 minimal fixture
    skills, runs the full pipeline, and asserts wall-clock time is
    under 1 second on the test runner. Tag the test with a generous
    skip condition for slow CI runners if needed.
- **Effort**: 1 hour for the chain test plus 30 minutes for the
  benchmark case.
- **Depends on**: Nothing.

## M11 — Continuous integration (CI) pipeline

- **Why.** "Tests pass on main" is only true if a machine other than
  the developer's runs them. CI is also a forcing function for clean
  dependency declarations.
- **Acceptance**:
  - A workflow file at `.github/workflows/ci.yml` runs on each pull
    request.
  - The workflow runs `bun install`, then `bun run typecheck`, then
    `bun test`.
  - A failing workflow blocks merging the pull request.
- **Effort**: 30 minutes.
- **Depends on**: Nothing.
- **Open questions**:
  - GitHub Actions, or an alternative (Forgejo, GitLab CI)?
    **Decision: GitHub Actions for now**, because the repository is
    on GitHub. Revisit if the repository moves.

## M12 — `CONTRIBUTING.md` (how to add a skill)

- **Why.** Without this document, the answer to "how do I add a
  skill?" requires reading 4 files. New contributors waste time.
- **Acceptance**:
  - One Markdown file walks a reader from "I have an idea for a
    skill" to "my skill renders and a test verifies it."
  - References the skill specification rather than duplicating it.
  - Covers: creating `skills/<skill-id>/`, writing the yaml and
    prompt, running validate, running tests, conventions for version
    bumps.
- **Effort**: 1 hour.
- **Depends on**: M4 (so the validate flow can be referenced).

---

# Could (postpone if Must or Should run long)

## M13 — Debug logging

- **Why.** When rendering produces an unexpected result, "why" is
  invisible. A `DSTACK_LOG=debug` environment variable that prints
  each step (loaded N skills, rendered M, installed K) would speed
  diagnosis.
- **Acceptance**: environment-gated logging at each use case
  boundary. Off by default. Format: `[<timestamp>] <use-case-name>
  <event> <details>`.
- **Effort**: 30 minutes.

## M14 — `--strict` flag (treat warnings as errors)

- **Why.** Continuous integration wants binary signal: passed or
  failed. M5 (shipped) surfaces warnings to the CLI. M14 lets CI fail
  when warnings appear.
- **Acceptance**: `dstack build --strict` exits with non-zero status
  if any warning was emitted.
- **Effort**: 15 minutes.
- **Depends on**: Nothing (M5 is shipped).

## M16 — `dstack diff <version-a> <version-b>` for skills

- **Why.** Auditing what changed in a skill between two versions.
- **Acceptance**: out of scope at this priority. Note: this can be
  added later without architecture changes.

## M17 — Skill bucket organisation

- **Why.** A flat `skills/` directory works for a handful of skills.
  Past about ten, it becomes hard to scan. A bucketed layout
  (`skills/engineering/`, `skills/productivity/`, `skills/meta/`,
  `skills/in-progress/`, `skills/deprecated/`) keeps related skills
  together and lets the build skip drafts and retired entries.
- **Acceptance**:
  - `FileSkillRepository` walks `skills/` recursively (one level)
    and discovers `<bucket>/<skill-id>/`.
  - Buckets `in-progress/` and `deprecated/` are excluded from
    `dstack build` output but are still validated.
  - At least one bucket is non-empty (proves the layout works).
  - A short ADR records the directory contract.
- **Effort**: 1 hour for the repository walk plus 30 minutes for the
  ADR.
- **Depends on**: M1 (the bucket layout matters only when the
  catalog has at least 10 skills).
- **Trigger to revisit if deferred**: catalog reaches 10 or more
  skills, OR a contributor reports that the flat layout is hard to
  scan.

## M19 — Spec-compatibility test against Anthropic's official spec

- **Why.** The rendered `SKILL.md` format is defined by Anthropic.
  A test that validates output against the official spec leaves the
  door open to publish dstack skills to Anthropic's marketplace
  later, with zero rewrite. It also catches drift if Anthropic
  changes the format.
- **Acceptance**:
  - A test under `test/contract/` loads Anthropic's published
    Agent Skills schema (referenced URL or a pinned local copy) and
    asserts that every rendered skill conforms.
  - The test runs in the standard `bun test` invocation.
- **Effort**: 1 hour.
- **Depends on**: Nothing structural.

## M20 — `dstack doctor` command

- **Why.** A health check that diagnoses common skill-installation
  problems without the user having to read source. Catches: orphan
  files in `~/.claude/skills/<id>/` that no longer exist in
  `skills/`, version mismatches between `skill.yaml` and the
  rendered `SKILL.md`, and missing required fields.
- **Acceptance**:
  - `dstack doctor` walks both `skills/` and the install root and
    prints a one-line status per skill.
  - Exit code is 0 if everything is consistent, 1 if anything is
    broken.
- **Effort**: 1 hour.
- **Depends on**: M4 (`dstack validate` shares the per-skill check
  logic).

---

# Effort summary

Phase 1 (M5 + M6 + M15 + A1 + A3) is done and shipped in v0.1.0. M2
was explored and rejected (see Phase 1 section above). Remaining work
to reach v1:

| Tier | Items | Total AI-pair time |
|---|---|---|
| Must | M1, M3, M4 | About 8 to 12 hours (M1 is most of the total) |
| Should | M7 through M12 | About 5 hours (M10 grew by 30 min for the benchmark case) |
| Could | M13, M14, M16, M17, M19, M20 | About 4 to 5 hours |
| **v1 minimum** | **8 milestones (Must + Should)** | **About 14 to 18 hours** |

M17, M19, M20 are not blocking for v1 — they are mid-term polish that
becomes valuable once the catalog grows past ten skills (M17), the
maintainer wants to consider Anthropic-marketplace publication (M19),
or installation-debug friction shows up in real use (M20).

For a senior full-time engineer working without AI, the remainder is
roughly one week of work. For this user, working part-time, plan
about two weeks.

# Suggested order

The dependencies between remaining milestones suggest this order:

```
M3 (includes)               M4 (validate)
  |                            |
  +------------+---------------+
               |
               v
M1 (port 5 skills, in 5 separate sessions)
  |
  v
M8 + M9 (contract suites — can run in parallel)
  |
  v
M10 (integration test)
  |
  v
M11 (CI)    M12 (CONTRIBUTING.md)    M7 (list command)
  (these three can run in parallel)
  |
  v
Could tier (M13, M14, M16, M19 anytime;
            M17 after catalog reaches ~10 skills;
            M20 after M4)
```

A good next session covers M3 + M4, which prepare the ground for
porting real skills. After that, M1 dominates the calendar.
