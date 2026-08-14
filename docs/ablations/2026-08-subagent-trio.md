# Ablation — the subagent trio

Task 11 of `docs/plans/2026-08-14-unhobbling-skill-catalog.md`.

The question is narrower than Task 10's. `dispatching-parallel-agents`,
`subagent-driven-development` and `multi-persona-review` all push *toward*
delegation. Anthropic's Opus 5 guide pushes against it:

> Do not delegate work you can finish yourself in a handful of tool calls, and
> do not use subagents to verify or double-check your own work.

The Sonnet 5 guide says nothing of the kind, and Sonnet 5 is the daily driver.
So the question is: **does each skill cause delegation on work the model would
have finished in a handful of tool calls?** The measure is tool-call count and
wall-clock alongside output quality, not quality alone.

## `dispatching-parallel-agents` — COMPLETE, terminated at Stage 1

**Zero recorded invocations** in the transcript store
(`docs/ablations/2026-08-invocation-census.md`). The procedure §1 is explicit:
three real tasks do not exist, so the run stops, and that is the result.

This is a real finding, not a gap. A skill that has never once been invoked has
no observed over-delegation to correct, and no evidence on which to move its
band in either direction. It stays `workflow` and waits for first use.

Its sibling `subagent-driven-development` covers the same ground for
plan-driven work and has been used, which may be the whole explanation.

## `subagent-driven-development` and `multi-persona-review` — NOT RUN

Both clear the three-task bar (4 and 30 real invocations). Neither has been
ablated. **Their bands do not move**, and this document does not argue that
they should.

What would settle it, precisely: six sessions per skill — three real past tasks
× railed/free — recording tool-call count and wall-clock alongside whether the
delegated result was better than one the model would have produced itself.
`multi-persona-review` is the higher-value target of the two: it is the
most-invoked skill in the catalog at 30 calls, and its five-seat panel is the
largest single delegation any skill in this catalog authorises.

## Indirect evidence, and why it is not enough

This session ran twelve subagents across two other ablations
(`verifying-before-done`, `writing-specs`). The railed `writing-specs` runs
spent **4.9× the tool calls** of the free ones for the same defect catching.

That is a real measurement of what rails cost, but it is **not** evidence about
these three skills. It measures instruction verbosity inside a single agent,
not a skill's propensity to spawn agents. Using it to demote a delegation skill
would be exactly the substitution of a convenient adjacent number for the
missing one that the honesty guard exists to catch.

## Status

| Skill | Invocations | Ablation | Band |
|---|---|---|---|
| `dispatching-parallel-agents` | 0 | complete — terminated at Stage 1 | `workflow`, unchanged |
| `subagent-driven-development` | 4 | **not run** | `workflow`, unchanged |
| `multi-persona-review` | 30 | **not run** | `workflow`, unchanged |

None of the three is `deterministic-dominant`, so none is a demotion candidate
from the [narrow-bridge test](2026-08-narrow-bridge-test.md). The open question
for all three is whether they should acquire a *floor* — a size below which they
do not fire — which `multi-persona-review` already models with its
three-iteration cap and its explicit "four subagents on a 50-line config is
waste".
