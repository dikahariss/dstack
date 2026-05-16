# dstack v1 — Roadmap

The list of work needed to take dstack from v0 (architecture proven,
two skills) to v1 (useful as a daily replacement for gstack core
workflows, single user).

Each milestone has:

- **Why**: the user problem this solves.
- **Acceptance**: the concrete conditions that mark the milestone as
  done.
- **Effort**: estimated time, in "AI-pair time" (one person working
  with Claude as a coding partner).
- **Depends on**: other milestones that must finish first.
- **Open questions**: decisions still to make.

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

## M1 — Port 5 or more useful skills from gstack

- **Why.** dstack with 2 skills is a demo. dstack with the workflows
  the user runs daily is a tool. Without more skills, there is no
  reason to switch from gstack.
- **Candidate skills**, in order of likely usefulness to the user:
  1. `/retro` — weekly reflection. Stand-alone. No hooks needed.
  2. `/investigate` — root-cause debugging methodology. Plain prose
     skill.
  3. `/review` — code review of the current diff. Uses the `Bash`
     tool only.
  4. `/context-save` and `/context-restore` — session continuity.
  5. `/ship` — the workflow that ties many others together. The
     gstack version is about 36,000 tokens. It will likely need to be
     split into smaller skills, or trimmed, to fit the dstack token
     budget.
- **Acceptance**:
  - 5 skills live under `skills/<skill-id>/`.
  - All pass `bun run build` (no `TokenBudgetExceededError`).
  - Each skill has a one-line note about what (if anything) differs
    from the gstack version.
  - At least one skill is actually used by the user in real work.
- **Effort**: 1 to 2 hours of AI-pair time per skill. Total: 6 to 10
  hours.
- **Depends on**: M2 (the real tokenizer). The current approximate
  counter may misjudge large skills. Better to port with the real
  counter ready.
- **Open questions**:
  - Does `/ship` exceed the 16,000-token ceiling? If yes, either split
    it into smaller skills, or write a new ADR that raises the ceiling
    for this one skill.
  - Which gstack skills carry too much gstack-specific telemetry or
    preamble code to port cleanly? Record those in the skill's
    comments.

## M2 — Use the real Anthropic tokenizer instead of approximation

- **Why.** [ADR-0010](../../docs/adr/0010-context-budget.md) requires
  hard budget enforcement. Today we use character-count approximation
  with a 5% safety margin. For skills near their declared budget, the
  approximation may be wrong in either direction: a false failure (the
  build fails when the skill would fit), or a silent overshoot (the
  build passes but the LLM actually receives too many tokens).
- **Acceptance**:
  - The file `src/adapters/claude-code/tokens.ts` calls Anthropic's
    real tokenizer. The expected path is
    `@anthropic-ai/sdk`'s `messages.countTokens` method, or a
    WebAssembly port of the tokenizer.
  - A test with a fixture text of known token count returns the
    correct count within plus or minus 1 percent.
  - The approximate counter is kept as a fallback. The environment
    variable `DSTACK_TOKEN_APPROX=1` selects the approximate counter
    for offline use.
- **Effort**: 1 to 2 hours. Most of the time is figuring out the SDK
  API.
- **Depends on**: Nothing.
- **Open questions**:
  - Does the SDK tokenizer require a network call? If yes, then offline
    builds cannot use it. In that case, keep the approximate counter
    as the default and add an ADR addendum explaining the trade-off.

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
    has an `includes` directive)? **Decision: yes, with a depth limit
    of 4 and cycle detection.**

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

## M5 — Print renderer warnings in the CLI output

- **Why.** The domain emits typed warnings (`token-near-budget`,
  `overlapping-trigger`, etc.). The renderer collects them. The CLI
  currently ignores them. A warning that no one reads is useless.
- **Acceptance**:
  - `dstack build` prints warnings, grouped by skill, at the end of
    its output.
  - Each warning line includes the skill id, the warning kind, and
    the message.
  - The exit code remains 0 (warnings do not fail the build) unless
    the `--strict` flag is passed.
- **Effort**: 30 minutes.
- **Depends on**: Nothing.

## M6 — Add `VERSION` and `CHANGELOG.md` discipline

- **Why.** Today dstack has no version number. As soon as a second
  person reads this code, "what changed since I last looked" is a
  natural question. A CHANGELOG answers it cheaply. The VERSION file
  makes future auto-update possible.
- **Acceptance**:
  - A `VERSION` file at the repository root contains the current
    version. The first version is `0.1.0`.
  - A `CHANGELOG.md` file at the repository root contains one entry
    per release.
  - Each entry lists user-visible changes first. Contributor-only
    changes go in a separate "For contributors" subsection.
  - The first entry (for v0) lists the architecture work and the two
    initial skills.
- **Effort**: 30 minutes.
- **Depends on**: Nothing.
- **Open questions**:
  - Should we use gstack's four-part version scheme (`X.Y.Z.W`)?
    **Decision: no, use classic three-part semantic versioning.** The
    four-part scheme in gstack exists because of its workspace queue
    behavior. dstack does not need that.

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
- **Depends on**: M2 (so token counts are accurate).

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

## M10 — End-to-end integration test

- **Why.** Today, the proof that the chain works is that `bun run
  build` succeeded once on the developer's machine. This proof needs
  to live in the test suite, so that a future refactor cannot
  silently break the wiring.
- **Acceptance**:
  - `test/integration/build-and-install.test.ts` does this: creates a
    temporary `skills/` directory; wires the real adapters (file
    repository, file installer, Claude Code renderer); runs
    `BuildCatalog` and `InstallSkills`; asserts that files appear on
    disk with expected content.
  - The test cleans up its temporary directory afterward.
- **Effort**: 1 hour.
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
  failed. M5 surfaces warnings. M14 lets CI fail when warnings appear.
- **Acceptance**: `dstack build --strict` exits with non-zero status
  if any warning was emitted.
- **Effort**: 15 minutes.
- **Depends on**: M5.

## M15 — Better error messages with file and line numbers

- **Why.** An error like `SkillSpecError: must be a non-empty string`
  tells the user what is wrong but not where. Including
  `skills/<skill-id>/skill.yaml:7` would make it faster to fix.
- **Acceptance**: errors carry the source file path. When the
  underlying parser provides line numbers, errors include the line
  number too.
- **Effort**: 1 hour. The `yaml` package provides source location
  information; we just do not currently extract it.

## M16 — `dstack diff <version-a> <version-b>` for skills

- **Why.** Auditing what changed in a skill between two versions.
- **Acceptance**: out of scope at this priority. Note: this can be
  added later without architecture changes.

---

# Effort summary

| Tier | Items | Total AI-pair time |
|---|---|---|
| Must | M1 through M6 | About 10 to 13 hours (M1 is most of the total) |
| Should | M7 through M12 | About 5 hours |
| Could | M13 through M16 | About 2 hours |
| **v1 total** | **M1 through M12** | **About 15 to 18 hours** |

For a senior full-time engineer working without AI, v1 is roughly one
week of work. For this user, working part-time, plan about two weeks.

# Suggested order

The dependencies between milestones suggest this order, which
maximizes early value:

```
M6 (VERSION + CHANGELOG)
  |
  v
M2 (real tokenizer)         M5 (surface warnings)
  |                            |
  v                            v
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
Could tier (M13 through M16, as time permits)
```

A good first session covers M6 + M2 + M5. They are small, mostly
mechanical, and build confidence. A second session covers M3 + M4,
which prepare the ground for porting real skills. After that, M1
dominates the calendar.
