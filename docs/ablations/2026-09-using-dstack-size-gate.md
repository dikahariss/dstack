# using-dstack size-gate pilot — 2026-09-24

Models: `claude-opus-5-5`, `claude-sonnet-5`, `claude-haiku-4-5-20251001`

CLI: Claude Code `2.1.281`
Cases: frozen 20-case set (`cases.jsonl`); arm A is the current body, arm B adds the frozen size paragraph.

## Scores

```text
model                         arm  n   pass  small+question pass  small+question skills  risk+multi pass  no CHAIN  tokens    cost_usd
claude-haiku-4-5-20251001     A    20  16    9/10                 8                      7/10            1         1170513   0.96
claude-haiku-4-5-20251001     B    20  18    10/10                9                      8/10            1         1320736   0.80
claude-opus-5-5               A    20  18    8/10                 14                     10/10           0         1142544   3.97
claude-opus-5-5               B    20  20    10/10                14                     10/10           0         1272286   2.75
claude-sonnet-5               A    20  20    10/10                6                      10/10           0         1220411   1.66
claude-sonnet-5               B    20  19    9/10                 12                     10/10           0         1122940   1.72
```

## Keep criteria

| Model | K1: risk+multi pass does not fall | K2: small+question lighter or +3 passes | K3: no CHAIN ≤1 | Result |
|---|---|---|---|---|
| `claude-opus-5-5` | PASS — 10/10 ≥ 10/10 | FAIL — 14 > 0.75 × 14; 10/10 < 8/10 + 3 | PASS — 0 | Drop |
| `claude-sonnet-5` | PASS — 10/10 = 10/10 | FAIL — 12 > 0.75 × 6; 9/10 < 10/10 + 3 | PASS — 0 | Drop |
| `claude-haiku-4-5-20251001` | PASS — 8/10 ≥ 7/10 | FAIL — 9 > 0.75 × 8; 10/10 < 9/10 + 3 | PASS — 1 | Drop |

K2 fails on every model, so the all-model keep rule is false. Arm A had a nonzero small+question skill count for every model; the “no routing ceremony to remove” condition did not occur.

## Failing cases

| Model | Arm | Case | Reason |
|---|---|---|---|
| `claude-opus-5-5` | A | S2 | `3 > max 2` |
| `claude-opus-5-5` | A | S3 | `3 > max 2` |
| `claude-sonnet-5` | B | S4 | `unwanted test-driven-development; 2 > max 1` |
| `claude-haiku-4-5-20251001` | A | S1 | `4 > max 2` |
| `claude-haiku-4-5-20251001` | A | R5 | `missing test-driven-development` |
| `claude-haiku-4-5-20251001` | A | M4 | `missing executing-plans` |
| `claude-haiku-4-5-20251001` | A | M5 | `no CHAIN line` |
| `claude-haiku-4-5-20251001` | B | M4 | `missing executing-plans` |
| `claude-haiku-4-5-20251001` | B | M5 | `no CHAIN line` |

## Budget and decision

Total: 120 calls, 7,249,430 tokens. The six per-arm summaries round to US$11.86 combined; summing stored per-case `total_cost_usd` values gives US$11.87. Both are below the G1 limits of 160 calls and US$40; no rerun was needed.

Decision: **drop**. The owner's 2026-09-24 advance authorization applied only if K1–K3 all passed on every tested model; K2 failed on all three, so the condition to apply the change was not met.
