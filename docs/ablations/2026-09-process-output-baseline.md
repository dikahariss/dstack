# Process-output baseline — 2026-09

Command: `bun scripts/session-metrics.ts <out> ~/.claude ~/.claude-zai ~/.claude-helium ~/.claude-kimi --until=2026-09-27` at `0b7b172` plus the branch-review fixes, run 2026-09-28. Sessions 2026-08-04 → 2026-09-27 by UTC start day; the cut excludes sessions still running on the run day, so the numbers reproduce.

```text
## Dev sessions (edits + test runs + turn data): n=55
wall_min	median=338.01	p75=804.12
agent_min	median=148.49	p75=253.45
user_min	median=39.44	p75=108.84
idle_min	median=139.11	p75=546.4
tool_calls	median=271	p75=440
test_runs	median=8	p75=24

## Agent minutes by dstack skills invoked per dev session
0-1	n=16	median agent_min=68.22
2	n=8	median agent_min=99.91
3+	n=31	median agent_min=190.93

## Output volume by dstack skills invoked per dev session
0-1	n=16	median output_tokens=160273	doc_share=0.13
2	n=8	median output_tokens=241127	doc_share=0.39
3+	n=31	median output_tokens=367449	doc_share=0.55

## Dev sessions that invoked writing-plans: n=27
agent_min	median=185.48	p75=254.79
output_tokens	median=367449	p75=563593
doc_chars	median=63702	p75=112359
```

`doc_share` is the share of characters written through `Write`/`Edit` that land in process documents: `docs/` folders for plans, specs, discovery, priority, design, process, models, test cases, reviews, UAT, and ablations, plus any `*plan*.md` whose name has "plan" as its own word. The rest counts as code (non-Markdown files) or other Markdown.

The counts are main thread only. Subagent transcripts are not read, so code written by delegated implementers is missing and `doc_share` is inflated in sessions that delegate. `MultiEdit` writes count as zero (none in this window).

Output tokens and agent minutes are correlated (r ≈ 0.7). Files edited are equal across the 0–1 and 3+ buckets (median 11), but this is still a correlation, not a cause. Task 8 of `docs/plans/2026-09-28-fast-track-and-sdd-recalibration.md` compares its after-picture against the "Dev sessions that invoked writing-plans" rows.
