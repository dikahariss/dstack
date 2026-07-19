# dstack

dstack exists to raise individual performance — on two tracks. The first
is **AI skills**: agent workflows rendered for Claude Code. The second is
**non-skill performance content**: evidence-based research and writing on
high performance (today, the *Sistem Operasi Diri* book research in
[`docs/hpi-riset/`](docs/hpi-riset/)).

The **software** in this repo serves the first track only. It is a skill
catalog renderer: it reads skill definitions from disk, validates them,
and writes the result in the format Claude Code expects. Non-skill content
is static — the renderer never touches it (see
[ADR-0026](docs/adr/0026-broaden-project-purpose.md)).

This project is a rewrite of [gstack](../gstack/) for a single user and a
single AI host (Claude Code). The goal is to keep today's solution simple,
and to organize the code so that future changes do not become expensive.

## What "skill" means here

A skill is a slash command that the user can run in Claude Code. For
example: `/ship`, `/review`, `/qa`. Each skill is one directory under
`skills/<skill-id>/`. The directory contains two files:

- `skill.yaml` — metadata. The skill's name, version, description, and
  the list of tools it is allowed to use.
- `prompt.md` — the prompt text. This is the instruction the AI model
  reads when the user runs the skill.

## What this project does

1. Reads every skill directory under `skills/`.
2. Validates each skill against the schema defined in
   [`docs/specs/skill-spec.md`](docs/specs/skill-spec.md).
3. Combines the prompt body with a small YAML header (called frontmatter)
   that Claude Code understands.
4. Writes the result to `.claude/skills/<skill-id>/SKILL.md`. Claude Code
   reads files from this directory at startup.

## What this project does NOT do (and why)

The following features are deliberately not built:

- **Multiple AI hosts**. Today this project only generates output for
  Claude Code. The code is structured so that a second host (such as
  Codex or Kiro) can be added later, but no second host is written.
  Reason: only one user, only one host. Adding more would create code
  that no one uses. See [ADR-0002](docs/adr/0002-single-host-v0.md).

- **Template engine for prompts**. Skill prompts are plain Markdown.
  There are no template variables, no resolvers, no shared snippets
  injected automatically. Reason: gstack has a template engine; the cost
  of that engine appears in every skill, even skills that need nothing
  from it. See [ADR-0003](docs/adr/0003-skill-as-data.md) and
  [ADR-0004](docs/adr/0004-no-template-engine-v0.md).

- **Browser, Chrome extension, sidebar**. The browser automation tool is
  documented as a separate package (`packages/browse/`) but is not
  implemented yet. See [ADR-0007](docs/adr/0007-browse-separate-process.md).

- **Telemetry by default**. Nothing is logged unless the user sets the
  environment variable `DSTACK_TELEMETRY=local`. See
  [ADR-0006](docs/adr/0006-telemetry-opt-in.md).

## Why this rewrite exists

Three concrete problems appeared when using gstack on Ubuntu 24.04:

1. **Unwanted host directories**. Running `bun run build` in gstack
   creates ten output directories (`.opencode/`, `.kiro/`,
   `.openclaw/`, and others) even when the user only uses Claude Code.
   Every user pays this cost.
   See [ADR-0002](docs/adr/0002-single-host-v0.md).

2. **Large setup script**. The gstack install script `setup` is 1044
   lines of bash. It does many separate jobs in one file: building
   binaries, detecting hosts, creating symbolic links, and more. The
   file is hard to read and hard to extend.
   See [ADR-0005](docs/adr/0005-bun-runtime.md).

3. **Browser fails on Ubuntu 24.04**. The browse tool tries to start
   Chromium without the `--no-sandbox` flag. On Ubuntu 24.04, the
   default kernel setting blocks unprivileged user namespaces, so
   Chromium cannot create its sandbox and the process crashes. gstack
   does not detect this case.
   See [ADR-0008](docs/adr/0008-sandbox-detection-at-adapter.md).

These three problems are not bugs in gstack. They are design pressures
that appeared as gstack grew. dstack is what you write when you know
where the pressures will appear.

## Project status

This project is at version 0 (v0). It builds and runs. One skill is
included as an example. See `docs/plans/v1/` for the roadmap to version 1.

- Architecture overview: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Architecture Decision Records (ADRs): [docs/adr/](docs/adr/)
- Skill schema: [docs/specs/skill-spec.md](docs/specs/skill-spec.md)
- Example skill: [skills/guarding-destructive-commands/](skills/guarding-destructive-commands/)
- v1 roadmap: [docs/plans/v1/ROADMAP.md](docs/plans/v1/ROADMAP.md)

## How to run

This project uses [Bun](https://bun.sh/) (a JavaScript runtime and
package manager).

```bash
# Install dependencies
bun install

# Build all skills and install to ./.claude/skills/
bun run build

# Render one skill and print to standard output
bun run render careful

# Scaffold a new skill (creates skills/<skill-id>/{skill.yaml,prompt.md})
bun run new my-new-skill

# Validate every skill (no install); exit 1 if any skill fails
bun run validate

# Check that the TypeScript code is valid
bun run typecheck

# Run all tests
bun test
```

### Optional: install `dstack` as a global command

`package.json` declares `dstack` as a binary, so you can use it
anywhere instead of running scripts from the repo root.

```bash
# One-time setup from the dstack repo root
bun link

# Now usable from anywhere
dstack build
dstack render careful
dstack new my-new-skill
dstack list
dstack validate
dstack doctor
dstack --help
```

To remove: run `bun unlink` from the repo root.

The CLI entry point is `src/adapters/cli/main.ts`. It carries a
`#!/usr/bin/env bun` shebang and the executable bit, so it can also
be invoked directly: `./src/adapters/cli/main.ts <command>`.

### Installing skills into Claude config dirs (incl. alternate model setups)

`bun run build` renders every skill to `./.claude/skills/` (the per-project
install). To make the skills available in a user Claude config dir — the default
`~/.claude` and alternate model setups such as `~/.claude-zai` (Z.ai / GLM) and
`~/.claude-kimi` (Moonshot Kimi) — copy each rendered skill into that dir's
`skills/` folder:

```bash
bun run build                                   # render to ./.claude/skills/

# Install/update every dstack skill into each config dir you use
for DIR in ~/.claude ~/.claude-zai ~/.claude-kimi; do
  [ -d "$DIR" ] || continue                      # skip a config dir you don't have
  mkdir -p "$DIR/skills"                          # ensure skills/ exists on first install
  for s in .claude/skills/*/; do
    id=$(basename "$s")
    rsync -a --exclude='__pycache__' "$s" "$DIR/skills/$id/"
  done
done
```

The copy is **additive on purpose** — no `rm -rf`, no `rsync --delete`. A skill
folder in a config dir can accumulate files the repo does not have: run output,
scratch work, a `work/` directory a skill wrote. Wiping the folder to "get a
clean copy" destroys that silently. Renamed and deleted skills leave an orphan
folder instead, which you remove deliberately (below) after looking at it.

This updates and adds every dstack skill in each dir and leaves your other
(non-dstack) skills untouched. When a skill is **deleted or renamed** in the
repo, deal with its orphan folder in two steps — **look first, then remove**:

```bash
# 1. List what the orphan holds. Anything the repo does not ship is yours.
for DIR in ~/.claude ~/.claude-zai ~/.claude-kimi; do
  find "$DIR/skills/<old-id>" -type f 2>/dev/null
done

# 2. On a RENAME, move that payload into the new folder before deleting.
#    (A real case: pdf-to-rag-markdown/work/ held converted documents.)
for DIR in ~/.claude ~/.claude-zai ~/.claude-kimi; do
  [ -d "$DIR/skills/<old-id>/work" ] && rsync -a "$DIR/skills/<old-id>/work" "$DIR/skills/<new-id>/"
done

# 3. Only now remove the orphan.
for DIR in ~/.claude ~/.claude-zai ~/.claude-kimi; do rm -rf "$DIR/skills/<old-id>"; done
```

> `dstack build --global` installs to `~/.claude/skills/dstack/` instead; the
> manual copy above targets the flat `~/.claude/skills/<id>/` layout and the
> alternate config dirs, which `--global` does not reach.

## Configuration (optional)

dstack runs with defaults and needs no configuration. The only opt-in
today is local telemetry. Copy `.env.example` to `.env` and uncomment
the variable to enable it. Bun loads `.env` automatically on every
command. `.env` is gitignored so any local secrets you add later stay
local.

| Variable | What it does |
|---|---|
| `DSTACK_LOG=debug` | Print one structured line per telemetry event to stderr. Off by default. Takes precedence over `DSTACK_TELEMETRY=local`. |
| `DSTACK_TELEMETRY=local` | Enable local-only JSONL telemetry to `~/.dstack/telemetry/events.jsonl`. Off by default. See [ADR-0006](docs/adr/0006-telemetry-opt-in.md). |

## Directory layout

```
dstack/
├── CLAUDE.md          # Agent instructions (read first if you are an AI)
├── CONTEXT.md         # Domain language glossary (for AI agents)
├── VERSION            # Current dstack version
├── CHANGELOG.md       # Release notes
├── .env.example       # Template for optional env vars (copy to .env)
├── docs/              # ARCHITECTURE, adr/, specs/, plans/
│   ├── adr/           # Architecture Decision Records
│   ├── specs/         # skill-spec, render-spec, install-spec, host-spec
│   └── plans/v1/      # Roadmap, deferred items, status
├── src/               # TypeScript source code
│   ├── domain/        # Core types, no input/output operations
│   ├── application/   # Use cases that orchestrate the domain
│   ├── adapters/      # Code that talks to filesystem, Claude Code, CLI
│   └── observability/ # Telemetry (logging to file, opt-in only)
├── packages/browse/   # Browser automation (separate package, planned)
├── skills/            # Skill definitions — the product
└── test/              # Tests (unit, contract, integration)
```

## License

License is not yet decided. Do not redistribute this code until a
license is chosen.
