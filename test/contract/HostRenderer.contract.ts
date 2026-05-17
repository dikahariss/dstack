/**
 * Contract suite for the `HostRenderer` port.
 *
 * Every adapter that implements `HostRenderer` calls this function with a
 * factory. The suite encodes invariants the port promises to callers — a
 * second renderer (Codex, Kiro) must satisfy the same shape.
 */
import { describe, test, expect } from 'bun:test';
import { parseDocument } from 'yaml';
import { Host } from '@domain/host/Host';
import { Skill } from '@domain/skill/Skill';
import { SkillSpec, CONTEXT_BUDGET_DEFAULT } from '@domain/skill/SkillSpec';
import { SkillId } from '@domain/skill/SkillId';
import { HostRenderer } from '@domain/host/ports';
import { Warning } from '@domain/render/RenderResult';
import { RenderContext } from '@domain/render/RenderContext';

const HOST = new Host('claude-code', '/tmp/dstack-test-out', { knownTools: ['Read'] });

function buildSkill(overrides: { budget?: number; warnings?: Warning[] } = {}): Skill {
  const spec = SkillSpec.fromValidated({
    id: SkillId.parse('alpha'),
    version: '0.1.0',
    description: 'A test skill used by the renderer contract suite.',
    tools: ['Read'],
    inputs: [],
    outputs: [],
    contextBudgetTokens: overrides.budget ?? CONTEXT_BUDGET_DEFAULT,
    triggers: [],
    includes: [],
    type: 'semantic',
    sideEffects: 'readonly',
    agency: 'reactive',
  });
  return new Skill(spec, 'prompt body', '', overrides.warnings ?? []);
}

function buildContext(skill: Skill): RenderContext {
  return { host: HOST, skill, tokenBudget: skill.spec.contextBudgetTokens, now: new Date(0) };
}

export function runHostRendererContract(name: string, factory: () => HostRenderer): void {
  describe(`HostRenderer contract: ${name}`, () => {
    test('rendering is deterministic for the same context', () => {
      const renderer = factory();
      const ctx = buildContext(buildSkill());
      const a = renderer.render(ctx);
      const b = renderer.render(ctx);
      expect(a.content).toBe(b.content);
      expect(a.path).toBe(b.path);
      expect(a.tokenCount).toBe(b.tokenCount);
    });

    test('token count is proportional to content length', () => {
      const renderer = factory();
      const result = renderer.render(buildContext(buildSkill()));
      const ratio = result.tokenCount / result.content.length;
      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(0.35);
    });

    test('frontmatter parses as YAML and carries name + version', () => {
      const renderer = factory();
      const result = renderer.render(buildContext(buildSkill()));
      const opener = result.content.indexOf('---');
      const closer = result.content.indexOf('---', opener + 3);
      expect(opener).toBe(0);
      expect(closer).toBeGreaterThan(0);
      const doc = parseDocument(result.content.slice(opener + 3, closer));
      expect(doc.errors.length).toBe(0);
      const fm = doc.toJS() as {
        name: string;
        metadata?: { dstack?: { version?: string } };
      };
      expect(fm.name).toBe('alpha');
      expect(fm.metadata?.dstack?.version).toBe('0.1.0');
    });

    test('warnings from include resolution are forwarded into the result', () => {
      const renderer = factory();
      const cycleWarning: Warning = {
        kind: 'include-cycle-broken',
        message: 'cycle: a -> b -> a',
      };
      const result = renderer.render(buildContext(buildSkill({ warnings: [cycleWarning] })));
      expect(result.warnings).toContainEqual(cycleWarning);
    });

    test('emits token-near-budget when content exceeds 90% of budget', () => {
      const renderer = factory();
      const tiny = buildSkill({ budget: 30 });
      const result = renderer.render(buildContext(tiny));
      expect(result.tokenCount).toBeGreaterThan(30 * 0.9);
      const near = result.warnings.filter((w) => w.kind === 'token-near-budget');
      expect(near.length).toBe(1);
    });
  });
}
