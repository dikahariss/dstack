/**
 * Agent Skills schema compatibility test (M19).
 *
 * Renders every real skill in `skills/` and asserts that the frontmatter
 * matches the official Agent Skills schema:
 *
 *   - `name` is a kebab-case string (1..64 chars, starts with a letter)
 *   - `description` is a non-empty string
 *   - `license`, when present, is a string
 *   - `compatibility`, when present, is a string
 *   - `allowed-tools`, when present, is an array of strings
 *
 * dstack-only additions (e.g. `version`) are allowed; the official schema
 * treats unknown fields as additionalProperties. Aligned with ADR-0012.
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { parseDocument } from 'yaml';
import { resolve } from 'node:path';
import { Host } from '@domain/host/Host';
import { BuildCatalog } from '@app/BuildCatalog';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { NoopTelemetry } from '@obs/NoopTelemetry';
import { RenderResult } from '@domain/render/RenderResult';

const SKILL_NAME_RE = /^[a-z][a-z0-9-]{0,63}$/;

interface Frontmatter {
  name?: unknown;
  description?: unknown;
  license?: unknown;
  compatibility?: unknown;
  'allowed-tools'?: unknown;
}

function extractFrontmatter(content: string): Frontmatter {
  const opener = content.indexOf('---');
  const closer = content.indexOf('---', opener + 3);
  if (opener !== 0 || closer < 0) {
    throw new Error('output is missing --- frontmatter fences');
  }
  const doc = parseDocument(content.slice(opener + 3, closer));
  if (doc.errors.length > 0) {
    throw new Error(`frontmatter is not parseable YAML: ${doc.errors[0]!.message}`);
  }
  return doc.toJS() as Frontmatter;
}

describe('Agent Skills schema compatibility', () => {
  let results: readonly RenderResult[];

  beforeAll(async () => {
    const repo = new FileSkillRepository(resolve(import.meta.dir, '../../skills'));
    const renderer = new ClaudeCodeRenderer();
    const host = new Host('claude-code', '/tmp/dstack-schema-test', {
      knownTools: CLAUDE_CODE_TOOLS,
    });
    results = await new BuildCatalog(repo, renderer, new NoopTelemetry()).execute({
      host,
      now: new Date(0),
    });
    expect(results.length).toBeGreaterThan(0);
  });

  test('every skill renders parseable YAML frontmatter', () => {
    for (const r of results) {
      expect(() => extractFrontmatter(r.content)).not.toThrow();
    }
  });

  test('every skill carries a kebab-case name', () => {
    for (const r of results) {
      const fm = extractFrontmatter(r.content);
      expect(typeof fm.name).toBe('string');
      expect(fm.name).toMatch(SKILL_NAME_RE);
    }
  });

  test('every skill carries a non-empty description', () => {
    for (const r of results) {
      const fm = extractFrontmatter(r.content);
      expect(typeof fm.description).toBe('string');
      expect((fm.description as string).length).toBeGreaterThan(0);
    }
  });

  test('license, when present, is a string', () => {
    for (const r of results) {
      const fm = extractFrontmatter(r.content);
      if (fm.license !== undefined) {
        expect(typeof fm.license).toBe('string');
      }
    }
  });

  test('compatibility, when present, is a string', () => {
    for (const r of results) {
      const fm = extractFrontmatter(r.content);
      if (fm.compatibility !== undefined) {
        expect(typeof fm.compatibility).toBe('string');
      }
    }
  });

  test('allowed-tools, when present, is an array of strings', () => {
    for (const r of results) {
      const fm = extractFrontmatter(r.content);
      const tools = fm['allowed-tools'];
      if (tools !== undefined) {
        expect(Array.isArray(tools)).toBe(true);
        for (const t of tools as readonly unknown[]) {
          expect(typeof t).toBe('string');
        }
      }
    }
  });
});
