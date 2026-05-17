# ADR-0017 — Bundled resources support (`scripts/`, `references/`, `assets/`)

- **Status:** Accepted
- **Date:** 2026-05-17
- **Reversibility:** Moderate. Removing bundled support means dropping
  the installer's recursive walk plus the path-policy check. Skills
  that shipped bundled files would still work; they just stop being
  installed.

## Terms used in this ADR

| Term | Definition |
|---|---|
| Bundled resource | Any file inside a skill directory other than `SKILL.md` itself. Examples: `scripts/extract.py`, `references/api.md`, `assets/template.html`, `themes/dark.json`. |
| Module folder | A subdirectory of the skill. Examples: `scripts/`, `references/`, `assets/`, plus free-form names. |
| Path policy | The rules that determine which bundled paths the installer accepts and which it rejects. |
| Progressive disclosure | The Anthropic-defined three-tier loading model: metadata → body → bundled. Bundled files load on demand. |

## Context

v1 supports only `SKILL.md` (the prompt body) and `_shared/*.md`
(concatenated includes). There is no way to ship:

- Executable scripts (Python, shell, JavaScript) that the agent runs
  during a skill execution.
- Reference docs (`references/api.md`, `references/schema.yaml`) that
  the agent reads on demand.
- Output templates, fonts, sample data, or any other static asset.

9 of 17 skills in the reference catalog `anthropics/skills` need
bundled scripts (`docx`, `pdf`, `pptx`, `xlsx`, `mcp-builder`,
`skill-creator`, `slack-gif-creator`, `webapp-testing`,
`web-artifacts-builder`). Without bundled-resource support, none of
them can be ported into dstack.

The agentskills.io specification documents `scripts/`, `references/`,
`assets/` as standard optional subdirectories, plus "any additional
files or directories" (`themes/`, `examples/`, `core/`, `python/`,
etc. — used by real catalog skills).

Claude Code's progressive-disclosure model treats bundled files as
**Level 3**: they do not load into the model's context until the
agent references them. This is what makes the "no practical limit on
bundled content" property work
([agent-skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)).

## Decision

A skill directory may contain arbitrary subdirectories alongside
`SKILL.md`. The installer copies every file under `skills/<id>/` —
except `_shared/` content (handled separately) — verbatim into
`.claude/skills/<id>/`.

```
skills/<skill-id>/
├── SKILL.md           # Required
├── scripts/           # Optional, conventional
├── references/        # Optional, conventional
├── assets/            # Optional, conventional
├── <any-other>/       # Optional, free-form (themes/, examples/, core/, etc.)
└── LICENSE.txt        # Optional
```

### Path policy

The installer rejects any bundled path that:

- Contains a `..` segment (path traversal).
- Is absolute (starts with `/` or a drive letter on Windows).
- Is a symbolic link.
- Resolves to a location outside the skill directory.
- Uses the reserved name `_shared/` (reserved for legacy includes —
  see [ADR-0003](0003-skill-as-data.md)).

Rejection produces a `BundledResourceError` with the offending path
and the reason.

### Executable bits

The installer preserves the executable bit on copy. Authors can mark
`scripts/run.sh` as executable; the installed file remains
executable.

### No template substitution

The installer copies files byte-for-byte. There is no `{{variable}}`
substitution. There is no per-host rewriting. The prompt body refers
to bundled files using **relative paths from the skill root**
(`scripts/run.sh`, `references/api.md`), and the agent runs commands
from that root.

### How bundled resources relate to token budgeting

[ADR-0016](0016-per-tier-token-budget.md) defines per-tier
budgeting. Bundled resources do not count against the body token
budget. They count toward `bundled_count` and `bundled_bytes` in
`dstack list`, informational only.

### Anti-pattern check (from M29 in v2 ROADMAP)

A skill with 4 or more module folders emits a `comprehensive-skill`
warning, citing SkillsBench arXiv 2602.12670. The recommended pattern
is 2–3 module folders.

## Trade-offs

**Upsides (`+`)**

- All 17 anthropic skills become portable into dstack 1:1, with zero
  restructuring.
- All four computation types from
  [`docs/skill-taxonomy.md`](../skill-taxonomy.md) become buildable.
  Hybrid skills get their `scripts/`. Deterministic skills get their
  primary work unit. Schema-semantic skills can ship their JSON
  Schema file.
- The body of a `SKILL.md` can shrink. Detail moves to
  `references/`, logic moves to `scripts/`. Authors are nudged
  toward the "concise body + bundled details" pattern that
  SkillsBench identified as highest-performing.
- Free-form subfolders match what `anthropic/skills` actually does in
  practice (`themes/`, `examples/`, `python/`, `csharp/`).

**Downsides (`-`)**

- Installer surface area grows. A recursive walk plus a path policy
  is more code than the v1 single-file installer.
- New attack surface for malicious paths (`../../etc/passwd`,
  symlinked exploits). The path policy mitigates this; it must be
  tested adversarially in the contract suite.
- Bundled files mean a skill can ship arbitrary code that runs in
  the agent's runtime. This is intentional and matches the
  agentskills.io threat model: only install skills from trusted
  sources.

## YAGNI guard

Do not auto-execute bundled scripts at build time. The build step
copies files; the agent decides when to run them at skill-execution
time.

Do not validate the contents of bundled scripts. Trust the skill
author. The path policy is a perimeter check, not a code review.

Do not add per-host path rewriting (the gstack-style pattern from
[`hosts/claude.ts`](../../docs/ARCHITECTURE.md) lineage). The
agentskills.io spec defines a single path convention; multi-host
support is achieved by spec compliance (ADR-0014), not by per-host
transforms.

Do not bundle compiled binaries automatically. Scripts written in
Python (PEP 723 inline deps), Node (via `npx`), or shell are
sufficient for v2. See [v2 DEFERRED D15](../plans/v2/DEFERRED.md) for
when compiled binaries become relevant.

## Reversibility

Moderate. To reverse:

1. Remove the installer's recursive walk; restore the single-file
   copy path.
2. Remove the `BundledResource` value object and its parsing from
   the repository.
3. Strip `bundled_count`/`bundled_bytes` from `dstack list`.
4. Delete or ignore subdirectory content in existing skill folders.

Skills with bundled files would still validate but would lose their
non-`SKILL.md` content on next install. The cost scales with how
many skills depend on bundled resources.

## References

- agentskills.io specification —
  [optional directories](https://agentskills.io/specification#optional-directories).
- [agentskills.io using-scripts](https://agentskills.io/skill-creation/using-scripts)
  — guidance on script design.
- [`docs/skill-taxonomy.md`](../skill-taxonomy.md) — taxonomy the
  Hybrid/Deterministic/Schema-semantic types depend on bundled
  scripts to express.
- [ADR-0003](0003-skill-as-data.md) — the original `_shared/`
  includes mechanism, which remains alive alongside the new bundled
  folders.
- [ADR-0005](0005-bun-runtime.md) — the "no bash orchestrator"
  decision. Bundled scripts are author-supplied (Python/shell/JS);
  dstack itself does not orchestrate them.
- [v2 ROADMAP M25, M26, M29](../plans/v2/ROADMAP.md) — the milestones
  that implement this ADR.
- [v2 DEFERRED D15](../plans/v2/DEFERRED.md) — the bundled-binary
  pattern that this ADR explicitly does not cover.
