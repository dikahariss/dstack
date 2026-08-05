# ADR-0029 — One renderer, portable source consumption

- **Status:** Accepted
- **Date:** 2026-08-05
- **Reversibility:** Cheap. Direct-consumer installation is documentation and
  symlinks; the renderer pipeline is unchanged.

## Context

ADR-0002 assumed every AI host required a different rendered file format, so
supporting Codex necessarily meant adding `CodexRenderer`. That was true before
the v2 source migration.

ADRs 0012–0014 and 0017 made each source directory a portable Agent Skill:
`SKILL.md` carries spec-compliant frontmatter and bundled resources remain next
to it. Codex can discover those directories directly. A named user requested
Codex deployment, and the installed Codex CLI discovered all 30 linked source
skills without a renderer or transformed copy.

The old decision still has a useful boundary—do not multiply renderer
adapters—but its claim that Codex support requires an adapter is now false.

## Decision

Keep one renderer adapter: `ClaudeCodeRenderer`.

Treat a compatible host reading `skills/<id>/` directly as **source
consumption**, outside the `HostRenderer`, `Host`, and `Installer` pipeline.
Document the host-native install location and link source directories there.

Add a host adapter only when measured host requirements need a representation
the portable source cannot provide: different required fields, path layout,
tool-name transformation, or another material host-specific contract.

Direct source consumption does not promise semantic translation. A skill body
that names a Claude-only tool or path remains limited until that skill documents
and verifies a host-neutral or Codex-specific path.

## Trade-offs

- `+` Codex receives the catalog with no duplicate renderer, build pass, or
  copied skill tree.
- `+` A symlinked install follows source and bundled-resource updates.
- `+` The codebase keeps one renderer and the existing YAGNI boundary.
- `-` Installation is documented outside the dstack installer and must protect
  existing host skills itself.
- `-` Format compatibility does not make every workflow body host-neutral.
- `-` Host discovery paths are external contracts and may change independently.

## YAGNI guard

Do not create `CodexRenderer`, a host registry, or a generalized deployment
layer merely to write a different directory. Revisit an adapter only after a
real workflow demonstrates a required transform that direct source consumption
cannot express.

Do not claim support for a host solely because it parses `SKILL.md`; test
discovery and state untranslated tool/path limitations.

## Reversibility

Cheap. Remove the host-native links and deployment documentation to stop direct
consumption. If Codex later needs a transform, implement the existing
`HostRenderer` contract without changing the source schema.

## References

- [ADR-0002](0002-single-host-v0.md) — superseded single-host assumption.
- [ADR-0014](0014-metadata-namespace.md) — portable spec frontmatter.
- [ADR-0017](0017-bundled-resources.md) — portable bundled resources.
- [v2 D12](../plans/v2/DEFERRED.md#d12--multi-host-renderer-adapters-gemini-cli-codex-cursor-goose)
  — renderer trigger retained by this decision.
