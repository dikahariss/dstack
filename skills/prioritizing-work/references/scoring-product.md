# PRODUCT lane — Kano band, then RICE

Read when Stage 0 returned `LANE: PRODUCT`. Kano **classifies** into a
band; RICE **orders inside one band**. Kano's own respondent instructions
state the question pairs are not used to rank-order requirements, so a
RICE score never promotes an item past an unmet Kano gate.

Quote the verbatim band row beside every number you print (R7).

## RICE

Declare the round constants as literals before any row, and echo them on
the output: the **one** goal metric · reach window (`1 month`,
`1 quarter`, `1 year`) · reach unit (`people` or `events`) · effort unit
(person-days) · the role list summed into every estimate · confidence
encoding (decimal).

> **Deliberate departure from the source.** Intercom's original RICE uses
> person-**months**. This skill uses person-**days**, because at this
> scale person-months collapse almost every item to `0.5` and destroy
> discrimination. The unit only has to be declared once and applied
> uniformly. Do not "correct" it back.

| Input | Allowed values | How it is fixed |
|---|---|---|
| **Reach** | A count `≥0` of distinct people passing through the changed surface inside the window. Two significant figures at ≥100. **Never a percentage, never a 1–5 score** | See the three rules below |
| **Impact** | Exactly one of `3 · 2 · 1 · 0.5 · 0.25`. `1.5`, `2.5`, `4` and `0` are invalid | Per-person effect on the **one** declared metric |
| **Confidence** | Exactly one of `1.0 · 0.8 · 0.5`. `0.9`, `0.65`, `0.3` are invalid | A **count** of how many of {Reach, Impact, Effort} are evidenced at E2+: 3 → `1.0`; 2 → `0.8`; ≤1 → `0.5` |
| **Effort** | Person-days `> 0`, summed across every role on the declared list, **shown as an addition** | `PM 1 + design 2 + eng 8 + QA 2 = 13`. Ranges take the upper bound |
| **Score** | `(R × I × C) ÷ E` | Printed as **two lines**: `R × I × C = <product>`, then `<product> ÷ E = <score>`. Integer, half up |

### The three Reach rules

1. **Flow vs stock.** A flow metric uses the template
   `upstream volume per period × observed attach rate × periods in
   window` — e.g. `500/month × 30% × 3 = 450 per quarter`, where `× 3` is
   *months in a quarter*, not a third factor. A **stock** (actives,
   installed base, registered accounts) enters at its **window value** and
   is **not** multiplied; multiplying monthly uniques double-counts
   returners.
2. **Encounter, not eligible.** Count who will meet the change, not who
   is permitted to.
3. **Acted-on, not rendered.** A surface that renders for everyone but is
   acted on by few enters at the **acted-on** count. If the acted-on rate
   is not measured, Reach is `UNSCORABLE` — this is the single largest
   silent multiplier in the framework, routinely worth 3×.

`R5` still governs: **RICE requires Reach at E2 or better.** Below that
the row is `UNSCORABLE` no matter what Confidence would have scored.

### Impact anchors

Durations are **per affected person per week**. Without a denominator the
same behaviour scores `1` or `2` depending on whether the reader thought
in days or weeks.

| Value | Label | Relative lift per affected person on the declared metric | Also required |
|---|---|---|---|
| `3` | massive | ≥50% relative, **or** a whole step disappears, **or** ≥50% previously dropped out at that step | Cite a **measured** analogue |
| `2` | high | ~20–50% relative — a workaround exists costing **>5 minutes per person per week**, or a support contact | Name the reference feature |
| `1` | medium | ~5–20% relative — removes **1–5 minutes per person per week**, or 1–2 steps | Name the reference feature |
| `0.5` | low | ~1–5% — perceptible; the person would not name it unprompted | — |
| `0.25` | minimal | <1%, **or no stated causal mechanism** linking it to the declared metric | — |

- **Reference-set method, strongly preferred.** Fix 3–5 already-shipped
  features with agreed scores before the round. Every row names the one
  it compared against and says bigger / same / smaller *per person*.
  Pairwise comparison is far more reproducible than absolute judgment.
- **No reference feature exists in this product** → Impact is
  `UNSCORABLE`, **not** `0.5`. Defaulting to `0.5` biases every new
  product downward and no alarm detects it.
- **Population-count validator, run per row:** if the sentence justifying
  Impact contains a population count ("affects all our enterprise
  customers"), Reach has been double-counted inside Impact — the row is
  invalid and is re-scored.
- Torn between two rungs, take the **lower**. The burden of proof sits on
  the higher rung.
- Impact is measured against the **one** declared metric — not revenue,
  not strategic importance, not stakeholder pressure. If the value does
  not route to that metric, the item is `0.25` or `OUT-METRIC`.

### Effort anchors

`1` a config or copy change, no design, no migration · `3` one screen or
one endpoint on existing patterns · `8` a feature across 2–3 layers with
a migration · `20` a subsystem: new model, screens, tests, rollout ·
`≥45` a programme — decompose before scoring.

**Tie band (R12): 15%.** Two scores within 15% are one tier, broken by a
stated non-numeric reason — dependency, commitment, availability, date —
never by the decimal. One Confidence rung moves a score 20–37.5%; one
Impact rung moves it 50–100%. Against that sensitivity, reporting 686 as
beating 683 is noise presented as a decision.

## Kano

State each candidate as a **customer benefit in ≤20 words**, never a
feature name. Ask the two questions and answer them **independently**.
Write the sentence *"with this present / absent, `<named persona>` would
___"* **before** picking an option.

| Code | Wording | Behavioural anchor — a behaviour, not a feeling |
|---|---|---|
| `LIKE` | I like it | Raises it unprompted as a reason to choose or recommend the product |
| `EXPECT` | I expect it | Assumes it is **already there**. A statement about an assumed baseline, not about strength of desire |
| `NEUTRAL` | I am neutral | No behaviour change, no willingness to pay, would not mention it either way |
| `TOLERATE` | I can tolerate it | Continues using it without contacting support and without building a workaround |
| `DISLIKE` | I dislike it | Produces an **action**: a support contact, a workaround, or a churn consideration |

**Where users cannot opt out** — mandated, internal, or regulator-imposed
software, where "would you choose it" is unanswerable — substitute:
`LIKE` = would raise it unprompted as an improvement worth the change;
`EXPECT` = would file a ticket if it disappeared. Without this
substitution every attribute in compulsory software collapses toward
`EXPECT`, which silently converts Attractive into Indifferent.

Do not paraphrase the options, and do not number them on the instrument —
respondents read 1–5 as a rating scale and answer a different question.
On the **absent** half, `LIKE` is meaningful and not an error: it means
the person actively prefers the attribute gone.

### Evaluation lookup — Berger et al. standard

**ROW = the PRESENT (functional) answer. COLUMN = the ABSENT
(dysfunctional) answer.** Pure lookup, no judgment.

| present ↓ / absent → | `LIKE` | `EXPECT` | `NEUTRAL` | `TOLERATE` | `DISLIKE` |
|---|---|---|---|---|---|
| **`LIKE`** | Q | A | A | A | **O** |
| **`EXPECT`** | R | I | I | I | M |
| **`NEUTRAL`** | R | I | I | I | M |
| **`TOLERATE`** | R | I | I | I | M |
| **`DISLIKE`** | R | R | R | R | Q |

`A` attractive · `O` one-dimensional · `M` must-be · `I` indifferent ·
`R` reverse · `Q` the question is broken.

> **Mandatory transposition self-check, before any lookup:** look up
> (`LIKE`, `DISLIKE`). It **must** return `O`. If it returns anything
> else the table is transposed — stop and re-read it. A row/column swap
> converts every Attractive into a Reverse and inverts the whole study
> with no error surfacing anywhere.

**Tie rule between categories:** `M > O > A > I`, leftmost wins. Flag
`contested` when the gap is ≤2 respondents or ≤10% of N.
**Hygiene:** `Q` ≥10% of respondents for an attribute → drop it and
rewrite the question. `R` >50% → invert the pair and **rescore all
respondents**, not only the reverse ones.

### Fulfilment state — a separate required field

Kano classifies the **attribute**. It says nothing about your product's
performance on it, and the build decision is undecidable without this.
Omit it and a model polishes already-satisfied basics forever.

| Value | Anchor |
|---|---|
| `NOT_MET` | Absent, or fails for a normal user in a normal flow |
| `PARTIALLY_MET` | Present but below acceptable — **state the measured number** |
| `MET_AT_PARITY` | Comparable to a **named** competitor — cite the competitor and the observation |
| `MET_ABOVE_PARITY` | Measurably better than the named competitor |
| `NOT_APPLICABLE` | Does not exist in any product yet |

### Build band = category × fulfilment

| Category | Fulfilment | Band | Action |
|---|---|---|---|
| `M` | `NOT_MET` / `PARTIALLY_MET` | **`P0_GATE`** | Build now. **Not a trade-off, not scored** — an unmet must-be caps total satisfaction regardless of what else ships |
| `M` | `MET_AT_PARITY` or better | **`P3_MAINTAIN`** | Marginal return ≈ 0. Tests and monitoring only, no roadmap slot |
| `O` | any | **`P1_COMPETE`** | Invest to at least parity with a named competitor. Order within the band by RICE |
| `A` | any | **`P2_DIFFERENTIATE`** | Pick a small number, not all. Order within the band by RICE |
| `I` | any | **`DO_NOT_BUILD`** | Record as a **decision**, so it stops being re-proposed |
| `R` | any | **`INVERT_OR_DROP`** | Restate as its opposite and rescore, or drop |
| `Q` | ≥10% | **`REWRITE_QUESTION`** | Not a result about the product |

Every categorisation carries an **as-of date and a re-check interval**
(default 6 months for software). Past its interval it is `EXPIRED` —
refuse to prioritise from it. Attributes decay Attractive →
One-dimensional → Must-be as competitors copy them; a category from two
years ago is describing a market that no longer exists.

**At E3 or E4** print categories and bands only, and follow the proxy
protocol in `evidence-rules.md`. Better/Worse coefficients computed over
invented respondents are forbidden: they are indistinguishable from
measured ones on the page.

## Worked round

Constants: goal metric **weekly filings completed** (current 1,240/wk) ·
window `1 quarter` · unit `people` · effort person-days · roles PM,
design, eng, QA.

**Item A — save a search so yesterday's view reopens without re-entering
filters.**

- Reach: agents reaching the dashboard = stock of 412 registered (E2,
  operator count, named). Acted-on rate for the save action: **not
  measured** → by rule 3, Reach is `UNSCORABLE`.
- Verdict: `UNSCORABLE — Reach: acted-on rate for the save action is
  unmeasured. 0.5 pd: count distinct agents invoking save over 14 days.`
- It is listed, not scored, and not ranked. **This is the correct output**,
  and it is the one a round with no instrumentation will produce often.

**Item B — bulk-upload replaces one-by-one filing.**

- Reach: 210 agents filed ≥5 times last quarter (E1, named query,
  2026-04-01→06-30). Stock, entered at window value, not multiplied.
- Impact: measured analogue — the 2026-Q1 bulk-edit feature cut
  step-count 40% for the same segment. `2` (high, 20–50%), reference
  feature named.
- Confidence: Reach E1, Impact E2, Effort E2 → 3 factors → `1.0`.
- Effort: `PM 1 + design 3 + eng 12 + QA 3 = 19` pd (engineer's written
  estimate).

```
R × I × C = 210 × 2 × 1.0 = 420
420 ÷ 19 = 22
```

- Kano: present `LIKE`, absent `DISLIKE` → lookup → **`O`**
  (one-dimensional). Transposition check: (`LIKE`,`DISLIKE`) = `O` ✔.
- Fulfilment `NOT_MET` → band **`P1_COMPETE`**.

**Item C — the filing receipt is emailed within 1 minute.**

- Kano: present `EXPECT`, absent `DISLIKE` → **`M`** (must-be).
- Fulfilment `PARTIALLY_MET` (measured median 6 min) → **`P0_GATE`**.
- RICE score: 8. Lower than B's 22.

**Order: C, then B.** C is `P0_GATE` and B is `P1_COMPETE`; an unmet
must-be gates the band above it, so B's higher RICE score does not
promote it. A is neither — it is on the `UNSCORABLE` list with its
0.5 pd measurement named.

`## Order departs from score` — *C (RICE 8) precedes B (RICE 22): C is
`P0_GATE`, an unmet must-be. RICE orders within a band, never across.*
