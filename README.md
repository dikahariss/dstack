# dstack

dstack is a skill catalog renderer for Claude Code. It reads skill
definitions from disk, validates them, and writes the result in the
format Claude Code expects. The source skills follow the Agent Skills
format, so hosts like Codex and Gemini CLI load them directly without a
second renderer.

This project is a rewrite of [gstack](../gstack/) for a single user and a
single render target (Claude Code). The goal is to keep today's solution
simple, and to organize the code so that future changes do not become
expensive. Compatible hosts consume the source catalog directly — see
[Codex](#installing-skills-into-codex) and
[Gemini CLI](#installing-skills-into-gemini-cli).

## What "skill" means here

A skill is a reusable workflow that an AI host can discover from its
description or the user can invoke explicitly. Claude Code uses names such
as `/debugging`; Codex uses `$debugging`. Each skill is one directory under
`skills/<skill-id>/` containing:

- `SKILL.md` — required metadata, triggers, and workflow instructions.
- Optional `scripts/`, `references/`, `assets/`, or other bundled resources
  used by that workflow.

## What this project does

1. Reads every `skills/<skill-id>/SKILL.md` definition and its bundled files.
2. Validates each skill against the schema defined in
   [`docs/specs/skill-spec.md`](docs/specs/skill-spec.md).
3. Combines the prompt body with a small YAML header (called frontmatter)
   that Claude Code understands.
4. Writes the result to `.claude/skills/<skill-id>/SKILL.md`. Claude Code
   reads files from this directory at startup.

Codex and Gemini CLI deployment does not run this renderer. It links the
spec-compatible source directories under `skills/` into that host's user skill
directory.

## What this project does NOT do (and why)

The following features are deliberately not built:

- **Multiple renderer adapters**. Today the build pipeline only generates
  output for Claude Code. The code is structured so that a second renderer
  can be added if a host requires a genuinely different representation, but
  none is needed for Codex or Gemini CLI: both read the source `SKILL.md`
  directories directly. See
  [ADR-0029](docs/adr/0029-portable-source-consumption.md).

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

This project is at version 0 (v0). It builds and runs. The maintained skill
catalog lives under `skills/`. See `docs/plans/v1/` for the roadmap to
version 1.

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
bun run render debugging

# Scaffold a new skill (creates skills/<skill-id>/SKILL.md)
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
dstack render debugging
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

### Installing skills into Codex

Run this from the dstack repository root. The installation is additive: it
creates one symlink per dstack skill and refuses to replace an existing Codex
skill with the same name.

```bash
DSTACK_REPO=$(pwd)
DSTACK_CODEX_SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$DSTACK_CODEX_SKILLS_DIR"

for source_dir in "$DSTACK_REPO"/skills/*; do
  [ -f "$source_dir/SKILL.md" ] || continue
  skill_id=$(basename "$source_dir")
  target="$DSTACK_CODEX_SKILLS_DIR/$skill_id"

  if [ -e "$target" ] || [ -L "$target" ]; then
    echo "skip existing: $target"
    continue
  fi

  ln -s "$source_dir" "$target"
done
```

Symlinks expose source changes to Codex without copying or rerunning
`dstack build`. Start a new Codex session after installation or when an active
session still shows stale metadata. Keep the repository at the same absolute
path because moving it breaks the links.

Start a new Codex session, then invoke a skill with `$`:

```text
$using-dstack
$debugging
$writing-specs
```

To verify discovery with the installed Codex CLI:

```bash
codex debug prompt-input "verify dstack skills" | rg --fixed-strings 'using-dstack'
```

Updating the checkout is enough to update linked skills:

```bash
git pull
bun install --frozen-lockfile
bun run validate
```

`dstack build` and `dstack build --global` remain Claude Code commands; they
write under `.claude/skills`, not Codex. Direct deployment also does not
translate host-specific tool names or paths inside a skill body. Review those
instructions when a workflow explicitly depends on a Claude-only capability.

To uninstall only links pointing into the current checkout, run this from the
dstack repository root:

```bash
DSTACK_REPO=$(pwd)
DSTACK_CODEX_SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"

for target in "$DSTACK_CODEX_SKILLS_DIR"/*; do
  [ -L "$target" ] || continue
  link_source=$(readlink "$target")

  case "$link_source" in
    "$DSTACK_REPO"/skills/*) unlink "$target" ;;
  esac
done
```

### Installing skills into Gemini CLI

Gemini CLI discovers agent skills from `~/.gemini/skills`, so it is a direct
source consumer on the same terms as Codex ([ADR-0029](docs/adr/0029-portable-source-consumption.md)):
the same additive symlink loop works, with the target directory changed.

```bash
DSTACK_REPO=$(pwd)
DSTACK_GEMINI_SKILLS_DIR="$HOME/.gemini/skills"

mkdir -p "$DSTACK_GEMINI_SKILLS_DIR"

for source_dir in "$DSTACK_REPO"/skills/*; do
  [ -f "$source_dir/SKILL.md" ] || continue
  skill_id=$(basename "$source_dir")
  target="$DSTACK_GEMINI_SKILLS_DIR/$skill_id"

  if [ -e "$target" ] || [ -L "$target" ]; then
    echo "skip existing: $target"
    continue
  fi

  ln -s "$source_dir" "$target"
done
```

`gemini skills link <path>` links one skill natively and is equivalent for a
single directory; the loop above is the bulk form and matches the layout Codex
already uses.

To verify discovery — each dstack skill should report `[Enabled]` with a
`Location:` under `~/.gemini/skills`:

```bash
gemini skills list | rg --fixed-strings 'using-dstack'
```

The same caveat as Codex applies, and it is not cosmetic: format compatibility
is not semantic translation. A skill body naming a Claude-only tool
(`Agent`, `Skill`, `AskUserQuestion`) or a `.claude/` path stays limited on
Gemini until that skill documents a host-neutral route. Discovery being green
says the catalog loaded, not that every workflow runs.

Uninstall is the Codex block above with `DSTACK_GEMINI_SKILLS_DIR` substituted.

### Installing skills into Claude config dirs (incl. alternate model setups)

`bun run build` renders every skill to `./.claude/skills/` (the per-project
install). To make the skills available in a user Claude config dir — the default
`~/.claude` and alternate model setups such as `~/.claude-zai` (Z.ai / GLM),
`~/.claude-helium`, and `~/.claude-kimi` (Moonshot Kimi) — copy each rendered
skill into that dir's
`skills/` folder:

```bash
bun run build                                   # render to ./.claude/skills/

# Install/update every dstack skill into each config dir you use
for DIR in ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do
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
for DIR in ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do
  find "$DIR/skills/<old-id>" -type f 2>/dev/null
done

# 2. On a RENAME, move that payload into the new folder before deleting.
#    (A real case: pdf-to-rag-markdown/work/ held converted documents.)
for DIR in ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do
  [ -d "$DIR/skills/<old-id>/work" ] && rsync -a "$DIR/skills/<old-id>/work" "$DIR/skills/<new-id>/"
done

# 3. Only now remove the orphan.
for DIR in ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi; do rm -rf "$DIR/skills/<old-id>"; done
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
├── AGENTS.md          # Codex instructions (loaded automatically)
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
