/**
 * Unit tests for the `SkillId` value object.
 *
 * Pure logic, no fs, no setup. The whole file should run in <10ms.
 */
import { describe, test, expect } from 'bun:test';
import { SkillId } from '@domain/skill/SkillId';
import { SkillSpecError } from '@domain/errors';

describe('SkillId', () => {
  test('accepts lowercase letters and digits with hyphens', () => {
    expect(SkillId.parse('ship').value).toBe('ship');
    expect(SkillId.parse('plan-ceo-review').value).toBe('plan-ceo-review');
    expect(SkillId.parse('a1').value).toBe('a1');
  });

  test('rejects uppercase', () => {
    expect(() => SkillId.parse('Ship')).toThrow(SkillSpecError);
  });

  test('rejects leading digit', () => {
    expect(() => SkillId.parse('1ship')).toThrow(SkillSpecError);
  });

  test('rejects underscore', () => {
    expect(() => SkillId.parse('plan_ceo')).toThrow(SkillSpecError);
  });

  test('rejects empty string', () => {
    expect(() => SkillId.parse('')).toThrow(SkillSpecError);
  });

  test('rejects strings over 64 chars', () => {
    expect(() => SkillId.parse('a'.repeat(65))).toThrow(SkillSpecError);
  });

  test('equals compares by value', () => {
    expect(SkillId.parse('alpha').equals(SkillId.parse('alpha'))).toBe(true);
    expect(SkillId.parse('alpha').equals(SkillId.parse('beta'))).toBe(false);
  });

  test('toString returns the value', () => {
    expect(SkillId.parse('alpha').toString()).toBe('alpha');
    expect(`${SkillId.parse('alpha')}`).toBe('alpha');
  });
});
