#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="${1:?output dir required}"
RESULTS="$OUT_DIR/results.jsonl"
[ -f "$RESULTS" ] || { echo "ERROR: $RESULTS not found" >&2; exit 1; }

echo "# Benchmark leaderboard"
echo ""
echo "Source: \`$RESULTS\`"
echo ""
echo "## Per-dimension wins"
echo ""
echo "| Dimension | De-anonymised winner counts |"
echo "|---|---|"

for DIM in groundedness procedure anti_pattern specificity overall; do
  COUNTS=$(jq -r --arg dim "$DIM" '
    (.verdict.winners[$dim] // "tie") as $w |
    if $w == "tie" then "tie"
    else (.anonymisation[$w] // "unknown")
    end
  ' "$RESULTS" 2>/dev/null | sort | uniq -c | awk '{printf "%s:%s ", $2, $1}' | sed 's/ $//')
  echo "| $DIM | $COUNTS |"
done

echo ""
echo "## Per-case detail"
echo ""

jq -c '.' "$RESULTS" | while read -r ROW; do
  CASE_ID=$(echo "$ROW" | jq -r '.case_id')
  PROMPT=$(echo "$ROW" | jq -r '.prompt')
  RATIONALE=$(echo "$ROW" | jq -r '.verdict.rationale // "n/a"')
  echo "### $CASE_ID"
  echo ""
  echo "**Prompt**: ${PROMPT:0:200}"
  echo ""
  echo "**Winners (de-anonymised)**:"
  for DIM in groundedness procedure anti_pattern specificity overall; do
    W=$(echo "$ROW" | jq -r --arg dim "$DIM" '.verdict.winners[$dim] // "tie"')
    SKILL=$(echo "$ROW" | jq -r --arg w "$W" '.anonymisation[$w] // "tie"')
    [ "$W" = "tie" ] && SKILL="tie"
    echo "- $DIM: $SKILL"
  done
  echo ""
  echo "**Rationale**: $RATIONALE"
  echo ""
done
