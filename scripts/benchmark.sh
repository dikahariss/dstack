#!/usr/bin/env bash
# Minimal benchmark harness for dstack v3 Track C.
# Pairwise head-to-head comparison of two skill bodies via `claude -p`.
# Future: rewrite as M48/M59 proper TS implementation under src/adapters/cli/.
#
# Usage:
#   scripts/benchmark.sh <skill-a-path> <skill-b-path> <cases-jsonl> <out-dir>
#
# Skill paths point to a SKILL.md file. Cases file is JSONL with `prompt` field.
# Output goes to <out-dir>/results.jsonl + <out-dir>/responses/.

set -euo pipefail

SKILL_A="${1:?skill A SKILL.md path required}"
SKILL_B="${2:?skill B SKILL.md path required}"
CASES="${3:?cases.jsonl path required}"
OUT_DIR="${4:?output directory required}"

if ! command -v claude >/dev/null 2>&1; then
  echo "ERROR: claude CLI not on PATH; benchmark requires Claude Code installed" >&2
  exit 2
fi

mkdir -p "$OUT_DIR/responses"

# Read skill bodies (strip frontmatter for cleaner system-prompt injection)
strip_frontmatter() {
  awk 'BEGIN{n=0} /^---$/{n++; next} n==2{print}' "$1"
}

BODY_A="$(strip_frontmatter "$SKILL_A")"
BODY_B="$(strip_frontmatter "$SKILL_B")"
NAME_A="$(basename "$(dirname "$SKILL_A")")"
NAME_B="$(basename "$(dirname "$SKILL_B")")"

echo "Benchmark: $NAME_A vs $NAME_B"
echo "Output: $OUT_DIR"
echo ""

CASE_IDX=0
RESULTS_FILE="$OUT_DIR/results.jsonl"
: > "$RESULTS_FILE"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  CASE_IDX=$((CASE_IDX + 1))
  CASE_ID="case-$CASE_IDX"
  PROMPT="$(echo "$line" | jq -r '.prompt')"
  ANTI="$(echo "$line" | jq -r '.anti_pattern // ""')"

  echo "[$CASE_ID] prompt: ${PROMPT:0:80}..."

  # Random a/b assignment for anonymisation
  if [ $((RANDOM % 2)) -eq 0 ]; then
    LETTER_A="X"; LETTER_B="Y"
  else
    LETTER_A="Y"; LETTER_B="X"
  fi

  # Run skill A
  echo "  → spawn $NAME_A (anonymised as $LETTER_A)..."
  RESP_A_FILE="$OUT_DIR/responses/${CASE_ID}-${LETTER_A}.txt"
  echo "$BODY_A" | claude -p --append-system-prompt "$BODY_A" "$PROMPT" > "$RESP_A_FILE" 2>&1 || echo "(skill A failed)" >> "$RESP_A_FILE"

  # Run skill B
  echo "  → spawn $NAME_B (anonymised as $LETTER_B)..."
  RESP_B_FILE="$OUT_DIR/responses/${CASE_ID}-${LETTER_B}.txt"
  echo "$BODY_B" | claude -p --append-system-prompt "$BODY_B" "$PROMPT" > "$RESP_B_FILE" 2>&1 || echo "(skill B failed)" >> "$RESP_B_FILE"

  # Judge prompt
  RESP_A="$(cat "$RESP_A_FILE")"
  RESP_B="$(cat "$RESP_B_FILE")"

  # Read first letter alphabetically for judge consistency
  if [ "$LETTER_A" = "X" ]; then
    FIRST="$RESP_A"; SECOND="$RESP_B"
    FIRST_LETTER="X"; SECOND_LETTER="Y"
  else
    FIRST="$RESP_B"; SECOND="$RESP_A"
    FIRST_LETTER="X"; SECOND_LETTER="Y"
  fi

  JUDGE_PROMPT="You are an evaluator for skill quality. Given a user prompt and two anonymous responses, rate each on 4 dimensions (1-5 Likert: 1=poor, 5=excellent) and pick a per-dimension winner.

Rubric dimensions:
- groundedness: response is grounded in concrete principles, not vague advice
- procedure: response follows a clear procedural structure
- anti_pattern: response avoids known anti-patterns${ANTI:+ (case-specific anti-pattern to watch: $ANTI)}
- specificity: response is specific and actionable, not generic

User prompt:
$PROMPT

Response X:
$FIRST

Response Y:
$SECOND

Reply with ONLY a JSON object, no other text, in this exact format:
{\"scores\":{\"X\":{\"groundedness\":N,\"procedure\":N,\"anti_pattern\":N,\"specificity\":N},\"Y\":{\"groundedness\":N,\"procedure\":N,\"anti_pattern\":N,\"specificity\":N}},\"winners\":{\"groundedness\":\"X|Y|tie\",\"procedure\":\"X|Y|tie\",\"anti_pattern\":\"X|Y|tie\",\"specificity\":\"X|Y|tie\",\"overall\":\"X|Y|tie\"},\"rationale\":\"one sentence\"}"

  echo "  → judge..."
  JUDGE_RAW="$(claude -p "$JUDGE_PROMPT" 2>&1 || echo '{"error":"judge failed"}')"
  # Extract JSON from judge response (strip any prose)
  JUDGE_JSON="$(echo "$JUDGE_RAW" | grep -o '{.*}' | head -1 || echo "$JUDGE_RAW")"

  # De-anonymise: map X/Y → skill names
  DEANON="$(jq -n --arg a "$LETTER_A" --arg b "$LETTER_B" --arg na "$NAME_A" --arg nb "$NAME_B" \
    '{($a): $na, ($b): $nb}')"

  # Emit result row
  jq -n \
    --arg case_id "$CASE_ID" \
    --arg prompt "$PROMPT" \
    --argjson deanon "$DEANON" \
    --argjson verdict "$JUDGE_JSON" \
    '{case_id: $case_id, prompt: $prompt, anonymisation: $deanon, verdict: $verdict}' \
    >> "$RESULTS_FILE"

  echo "  ✓ $CASE_ID done"
done < "$CASES"

echo ""
echo "Done. Results: $RESULTS_FILE"
echo "Aggregate: scripts/benchmark-aggregate.sh $OUT_DIR"
