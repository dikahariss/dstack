/**
 * Renderer-side coverage for M3: ensure ClaudeCodeRenderer concatenates
 * `Skill.includesContent` ahead of the prompt body and propagates any
 * include warnings to the RenderResult.
 */
import { describe, test, expect } from 'bun:test';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { Skill } from '@domain/skill/Skill';
import { SkillSpec } from '@domain/skill/SkillSpec';
import { SkillId } from '@domain/skill/SkillId';
import { Host } from '@domain/host/Host';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';

function fixtureSpec(): SkillSpec {
  return SkillSpec.fromValidated({
    id: SkillId.parse('demo'),
    version: '1.0.0',
    description: 'demo skill',
    tools: ['Read'],
    inputs: [],
    outputs: [],
    contextBudgetTokens: 4_000,
    triggers: [],
    includes: [],
    type: 'semantic',
    sideEffects: 'readonly',
    agency: 'reactive',
    calibration: 'workflow',
  });
}

const HOST = new Host('claude-code', '/tmp/out', { knownTools: CLAUDE_CODE_TOOLS });
const NOW = new Date('2026-01-01T00:00:00Z');

describe('ClaudeCodeRenderer + includes', () => {
  test('prepends includesContent before the prompt body', () => {
    const skill = new Skill(
      fixtureSpec(),
      'PROMPT-BODY-MARKER\n',
      'INCLUDE-MARKER\n',
      [],
    );
    const result = new ClaudeCodeRenderer().render({
      host: HOST,
      skill,
      tokenBudget: skill.spec.contextBudgetTokens,
      now: NOW,
    });
    const includeIdx = result.content.indexOf('INCLUDE-MARKER');
    const promptIdx = result.content.indexOf('PROMPT-BODY-MARKER');
    expect(includeIdx).toBeGreaterThan(-1);
    expect(promptIdx).toBeGreaterThan(includeIdx);
  });

  test('emits no extra blank line when includesContent is empty', () => {
    const skill = new Skill(fixtureSpec(), 'PROMPT-ONLY\n', '', []);
    const result = new ClaudeCodeRenderer().render({
      host: HOST,
      skill,
      tokenBudget: skill.spec.contextBudgetTokens,
      now: NOW,
    });
    expect(result.content.endsWith('---\nPROMPT-ONLY\n')).toBe(true);
  });

  test('forwards Skill.includeWarnings into RenderResult.warnings', () => {
    const skill = new Skill(
      fixtureSpec(),
      'body\n',
      'inc\n',
      [{ kind: 'include-cycle-broken', message: 'demo cycle' }],
    );
    const result = new ClaudeCodeRenderer().render({
      host: HOST,
      skill,
      tokenBudget: skill.spec.contextBudgetTokens,
      now: NOW,
    });
    const kinds = result.warnings.map((w) => w.kind);
    expect(kinds).toContain('include-cycle-broken');
  });
});
