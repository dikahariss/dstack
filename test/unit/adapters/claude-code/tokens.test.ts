/**
 * Tests for the approximate token counter.
 *
 * dstack uses a single counter (approximate, offline). Earlier versions
 * shipped two counters (approximate and an Anthropic-SDK-backed one)
 * with a factory selecting between them on env vars. That layer was
 * removed: real tokenization requires an API key, a network call, and
 * an extra runtime dependency, none of which are worth it for the
 * coarse budgets dstack enforces (default 4 000, ceiling 16 000).
 */
import { describe, test, expect } from 'bun:test';
import { approximateTokenCount } from '../../../../src/adapters/claude-code/tokens';

describe('approximateTokenCount', () => {
  test('returns positive count for non-empty text', () => {
    expect(approximateTokenCount('hello world')).toBeGreaterThan(0);
  });

  test('zero chars yields zero tokens', () => {
    expect(approximateTokenCount('')).toBe(0);
  });

  test('count scales roughly with length', () => {
    const short = approximateTokenCount('abcd'); // 4 chars
    const long = approximateTokenCount('abcd'.repeat(100)); // 400 chars
    expect(long).toBeGreaterThan(short * 50);
  });

  test('matches the documented formula (chars/4 * 1.05, ceiling)', () => {
    // 400 chars → ceil(400/4) = 100 → ceil(100 * 1.05) = 105
    expect(approximateTokenCount('a'.repeat(400))).toBe(105);
    // 40 chars → ceil(40/4) = 10 → ceil(10 * 1.05) = 11
    expect(approximateTokenCount('a'.repeat(40))).toBe(11);
  });

  test('is deterministic: same input gives same output', () => {
    const text = 'one fish, two fish, red fish, blue fish';
    expect(approximateTokenCount(text)).toBe(approximateTokenCount(text));
  });
});
