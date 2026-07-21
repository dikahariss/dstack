# dstack — Agent instructions

dstack is a skill catalog renderer for Claude Code: it reads skill
definitions, validates them, and writes Claude-Code-compatible
`SKILL.md` files. One user, one host. TypeScript on Bun. Hexagonal
architecture, ADR-driven, YAGNI strict.

The renderer's scope stays frozen and every DEFERRED item stands
([ADR-0028](docs/adr/0028-renderer-only-scope.md)). When working in
`src/`, dstack *is* the renderer.

This file is the entry point for AI agents working in this repo.
Read top to bottom before doing anything. The rules here are tight;
follow them literally.

## Read these next (in this order)

| File | Why | When |
|---|---|---|
| [CONTEXT.md](CONTEXT.md) | Domain glossary. What "skill", "port", "renderer", "wiring point" mean here. | Always, first. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layered design with diagrams. Port + adapter inventory. | When touching `src/`. |
| [docs/code-taxonomy.md](docs/code-taxonomy.md) | Coding rules. When to write a function vs a class, inline vs constant, helper extraction, error handling, comments, imports. Resolves the rule-vs-ADR conflicts. | When writing or reviewing any code in `src/` or `test/`. |
| [docs/plans/v1/ROADMAP.md](docs/plans/v1/ROADMAP.md) | What's planned for v1 and what's done. | When suggesting features. |
| [docs/plans/v1/DEFERRED.md](docs/plans/v1/DEFERRED.md) | What is deliberately NOT being built and why. | When tempted to add something big. |
| [docs/adr/](docs/adr/) | Why each design choice was made. Read the relevant one before changing it. | When changing architecture. |
| [docs/specs/](docs/specs/) | Contracts for the render pipeline, skill schema, installer, host. | When implementing or modifying these. |

## Commands

```bash
bun install                  # one-time setup
bun run build                # render every skill → .claude/skills/
bun run build --strict       # like build, but exit 1 on any warning
bun run render <skill-id>    # render one skill, print to stdout
bun run new <skill-id>       # scaffold skills/<id>/ from template
bun run list                 # table of every skill (id, version, tokens, tools)
bun run validate             # check every skill; exit 1 on any failure
bun run doctor               # diagnose source vs install consistency
bun run typecheck            # tsc --noEmit, strict mode
bun test                     # all tests, ~500 ms
```

The CLI entry point is `src/adapters/cli/main.ts`. All wiring of
concrete adapters happens there and nowhere else.

## Critical rules — do NOT violate

### Architecture rules (from ADR-0001)

1. **Domain layer (`src/domain/`) imports nothing outside itself**
   except built-in TypeScript types. No `fs`, no `fetch`, no
   `child_process`, no `console.log`. If domain code needs IO,
   define a port; put the IO in an adapter.
2. **Application layer (`src/application/`) imports only domain
   types and ports**. Never import concrete adapter classes here.
3. **Adapters (`src/adapters/`) may import domain types**. The
   other direction is forbidden.
4. **Concrete adapters are constructed in exactly one place**:
   `src/adapters/cli/main.ts`. If you find yourself writing
   `new ClaudeCodeRenderer()` anywhere else, stop.

### YAGNI rules (from ADR-0001, ADR-0004, all DEFERRED entries)

- **Do not create a port with one implementation** unless a test
  fake also implements it. Otherwise inline the call.
- **Do not add template variables, resolvers, or auto-injected
  preambles** to the renderer. Per ADR-0003 + ADR-0004, skills are
  YAML + Markdown only.
- **Do not add a second host adapter** (Codex, Kiro, etc.) until a
  named real user asks for one. The `HostRenderer` port is ready;
  don't pre-build adapters. See ADR-0002.
- **Do not add features documented in DEFERRED.md** (D1-D11) unless
  the entry's "Trigger to revisit" condition has actually fired.

### Specific patterns that are forbidden right now

| Forbidden | Why | If you really need it |
|---|---|---|
| Add `@anthropic-ai/sdk` (or any LLM provider SDK) as runtime dep | Removed in v0.1.0 after exploration. See DEFERRED D11. | Use `claude -p` subprocess in a separate on-demand subcommand, not in `build`. |
| Make `HostRenderer.render` async | It is sync; only the SkillRepository is async. | Don't. The renderer is pure given its inputs. |
| Read environment variables outside `src/adapters/cli/main.ts` | All env reads happen at the wiring point. | Pass values down through constructors. |
| Add a hook engine for `PreToolUse` etc. | DEFERRED D2. One degraded skill (`/guarding-destructive-commands`) is acceptable; threshold is two. | If two skills need hooks, open D2 properly: write a new ADR, add a `HookEngine` port + contract suite, then a minimal adapter. |
| Add bash scripts for build / install / setup | ADR-0005. dstack has no bash orchestrator. | Add a TypeScript subcommand. |
| Write `console.log` in domain or application code | ADR-0006. Emit a `TelemetryEvent` instead. | Use the `Telemetry` port. |
| Use `parseYaml` directly | YAML errors must carry `file[:line]`. Always use `parseDocument` with `LineCounter`. | See `FileSkillRepository` for the pattern. |

## Where to add new things

| You want to add… | Put it here | Then do this |
|---|---|---|
| A new skill | `bun run new <skill-id> [--type=<t>]` then edit `skills/<skill-id>/SKILL.md` (and `scripts/` for hybrid/deterministic) | `bun run build` to verify. |
| A new domain entity / value object | `src/domain/<area>/` | No IO. Add a unit test under `test/unit/domain/`. |
| A new port | `src/domain/<area>/ports.ts` | Only if YAGNI rule passes (see above). Add a contract suite under `test/contract/`. |
| A new adapter for an existing port | `src/adapters/<area>/` | Apply the existing contract suite to it. |
| A new use case | `src/application/` | Constructor-inject ports. Add a unit test that uses fake adapters. |
| A new CLI subcommand | `src/adapters/cli/<feature>.ts` + dispatch in `main.ts` | Update the `--help` output and `README.md` command table. |
| A new ADR | `docs/adr/NNNN-short-slug.md` | Add a row to `docs/adr/README.md` index AND `docs/ARCHITECTURE.md` index. |
| A new env variable | `.env.example` (template only) + read it in `main.ts` | Document in `README.md` + `CONTEXT.md` env tables. |
| A test fixture | `test/fixtures/skills/<bucket>/<name>/` | Document its purpose in `docs/plans/v1/DONE.md`. |

## Code conventions

| Convention | Example |
|---|---|
| Files use kebab-case for filenames, PascalCase for types | `FileSkillRepository.ts` exports `class FileSkillRepository` |
| Skill IDs use kebab-case, must start with a letter | `debugging`, `plan-ceo-review`, NOT `Debugging` or `1plan` |
| Skill IDs name the activity, **max 3 words** ([ADR-0027](docs/adr/0027-skill-naming-convention.md)) | Prefer a gerund: `verifying-before-done`. No bare abbreviation (`tdd`), adjective (`careful`), or generic noun (`version`). Hard ceiling of three hyphen-separated words — drop articles, then the least load-bearing noun. Can't disambiguate in 3? The skill does too much; split it. Keep the old id as a trigger keyword. |
| Typed errors only — no `throw new Error("...")` in domain | `throw new SkillSpecError(id, field, problem, source?)` |
| Prefer `readonly` and `const` everywhere | All domain types are immutable |
| No comments unless WHY is non-obvious | If you must explain WHAT, rename the identifier |
| Skills are hybrid by default | Body: deterministic spine + a named judgment surface. Pick a calibration band (default `workflow` ~30%). Set `metadata.dstack.calibration` if not `workflow`. See ADR-0025 + playbook §1.15. |
| Strict TS settings are on | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Respect them; don't disable. |
| Path aliases for non-sibling imports | `import { Skill } from '@domain/skill/Skill'` (NOT `'../../domain/skill/Skill'`). Aliases: `@domain/*`, `@app/*`, `@adapters/*`, `@obs/*`. Sibling (`./X`) stays relative. See [ADR-0011](docs/adr/0011-import-path-aliases.md). |

## Testing rules

- Unit tests live under `test/unit/`. No filesystem, no setup.
  Run in <10 ms each.
- Contract tests live under `test/contract/`. One shared suite per
  port. Every adapter implementing the port runs the same suite.
- Integration tests will live under `test/integration/` (planned
  as M10). Use a `mkdtempSync` temp directory, clean up afterward.
- Every bug fix gets a regression test. Every new public API gets
  a test that exercises its contract.

## Commit style

- One logical change per commit. If you have a rename plus a
  rewrite, split them.
- Commit messages: imperative subject (≤72 chars), then a body
  that explains WHY (not WHAT — the diff shows what).
- Co-author footer: `Co-Authored-By: Claude <noreply@anthropic.com>`
- Never `git push --force` without explicit user request.

## Pacing rules for AI agents

These are explicit so cheap models do not over-act:

1. **Read before writing.** Always read the file (or run grep) to
   find the existing pattern before adding code. Don't invent.
2. **Match the existing style.** If the codebase uses
   `readonly value: string`, you use `readonly`. If it uses
   `class` over `function`, you use `class`. Don't refactor style
   on the side.
3. **Verify, don't claim.** After a change: run
   `bun run typecheck` AND `bun test`. Don't say "done" until both
   pass.
4. **Trace stale references before doc edits.** After renaming or
   removing anything, grep the whole repo for the old name. If
   you find it in five files, update all five — don't leave the
   diff half-done.
5. **One commit per session unless the user asks otherwise.**
   Group related changes; don't fragment by mood.
6. **When in doubt, ask.** A clarifying question is cheaper than
   a wrong refactor.

## Voice

dstack documentation is **neutral, terse, direct**. No marketing
voice. No "your human partner" or other branded terminology.
Refer to the user as "the user." When writing skill prompts, the
target audience is the LLM consuming the skill, not the human
reader.

## When suggesting changes that affect ADRs

If you propose a change that contradicts an Accepted ADR, write a
new ADR that supersedes the old one. Do not edit accepted ADRs
in place. The numbering rule is in `docs/adr/README.md`.

## Influences (not dependencies)

dstack's design borrows ideas from a few public skill catalogs:

- **mattpocock-skills** — the `CONTEXT.md` domain-glossary pattern;
  skill bucket organisation (planned M17).
- **superpowers** — TDD-first discipline as a candidate skill (M1);
  the "explicit forbidden actions" structure of agent instructions.
- **anthropics-skills** — the official Agent Skills schema that
  dstack output must remain compatible with (planned M19).

These are reference points only. dstack does not depend on or
re-export any of their code.
