# Process-output baseline — 2026-09

Command: `bun scripts/session-metrics.ts <out> ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi` at `48e7867` plus the Task 1 change, run 2026-09-28. Sessions 2026-08-04 → 2026-09-28.

```text
## Dev sessions (edits + test runs + turn data): n=56
wall_min	median=338.01	p75=804.12
agent_min	median=146.83	p75=253.45
user_min	median=39.44	p75=108.84
idle_min	median=139.11	p75=546.4
tool_calls	median=271	p75=440
test_runs	median=8	p75=24

## Agent minutes by dstack skills invoked per dev session
0-1	n=16	median agent_min=68.22
2	n=9	median agent_min=68.03
3+	n=31	median agent_min=190.93

## Output volume by dstack skills invoked per dev session
0-1	n=16	median output_tokens=160273	doc_share=0.12
2	n=9	median output_tokens=211637	doc_share=0.39
3+	n=31	median output_tokens=367449	doc_share=0.52

## Dev sessions that invoked writing-plans: n=28
agent_min	median=185.48	p75=254.79
output_tokens	median=367449	p75=563593
doc_chars	median=55729	p75=112359
```

`doc_share` is the share of characters written through `Write`/`Edit` that land in plan, spec, discovery, test-case, review, UAT, or ablation documents. The rest goes to code (non-Markdown files) or to other Markdown. Output tokens and agent minutes are correlated (r ≈ 0.7). Files edited are equal across the 0–1 and 3+ buckets (median 11), but this is still a correlation, not a cause. Task 8 of `docs/plans/2026-09-28-fast-track-and-sdd-recalibration.md` compares its after-picture against the "Dev sessions that invoked writing-plans" rows.
