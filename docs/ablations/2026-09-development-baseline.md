# Development baseline — 2026-09

## Dev sessions (edits + test runs + turn data): n=54
wall_min	median=338.01	p75=791.67
agent_min	median=155.89	p75=253.45
user_min	median=39.44	p75=108.84
idle_min	median=139.11	p75=532.4
tool_calls	median=271	p75=439
test_runs	median=10	p75=24

## Agent minutes by dstack skills invoked per dev session
0-1	n=16	median agent_min=68.22
2	n=8	median agent_min=99.91
3+	n=30	median agent_min=205.88

## Tool share of API+tool time (dev sessions with cost-state): n=15
median tool_share=0.13

## Hallucination proxies (dev sessions)
invented_ref per session	missing-path=1.24 unknown-module=0.19 edit-mismatch=0.17 unknown-command=0.06
unverified_done	108/404 done-claims

Bottleneck rule: B-chain — user median 39.44 < agent median 155.89; tool share 0.13 < 0.40; the `3+` bucket (n=30, median 205.88) is at least twice the `0–1` bucket (n=16, median 68.22), so Task 4 runs.

A4 is a correlation confounded by task size; it does not establish cause.

H1 and H3 are proxies with unmeasured precision.
