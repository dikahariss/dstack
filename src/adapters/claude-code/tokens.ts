/**
 * Token counting for context-budget enforcement.
 *
 * dstack uses an approximate, offline counter: `chars / 4`, plus a 5%
 * safety margin, rounded up. Empirically within ±10% of Anthropic's
 * exact tokenizer for ordinary prose.
 *
 * Why approximate-only:
 *
 *   - Budgets are coarse (default 4 000, ceiling 16 000) and the
 *     near-budget warning fires at 90%. The ±10% approximation error
 *     fits comfortably inside that margin.
 *   - Exact tokenization requires a network call to Anthropic's API,
 *     which means an API key, a per-build cost in latency, and a new
 *     failure mode (offline / unauthorised). The trade-off is not
 *     worth it for the budgets dstack enforces today.
 *   - If precise counting ever becomes necessary, do it on demand —
 *     a future `dstack count <skill-id>` subcommand can shell out
 *     once instead of taxing every build.
 */
export function approximateTokenCount(text: string): number {
  const base = Math.ceil(text.length / 4);
  return Math.ceil(base * 1.05);
}
