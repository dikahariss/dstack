#!/usr/bin/env bash
# Automated UAT proxy — runs UAT scenario prompts via `claude -p` with skill loaded,
# captures responses for the user's manual pass/fail review.
# NOT a substitute for human UAT; just produces evidence.
#
# Usage: scripts/uat-proxy.sh <skill-id>

set -euo pipefail
SKILL_ID="${1:?skill id required}"
SKILL_DIR="/home/haris/KODING/WORKSPACE-MH/dstack/skills/$SKILL_ID"
[ -d "$SKILL_DIR" ] || { echo "no such skill: $SKILL_ID" >&2; exit 1; }
[ -f "$SKILL_DIR/uat/scenarios.md" ] || { echo "no UAT scenarios: $SKILL_ID" >&2; exit 1; }

OUT_DIR="$SKILL_DIR/uat/runs/$(date +%Y-%m-%d)-automated"
mkdir -p "$OUT_DIR"

BODY=$(awk 'BEGIN{n=0} /^---$/{n++; next} n==2{print}' "$SKILL_DIR/SKILL.md")

# Extract scenario prompts from scenarios.md (lines starting with "> ")
SCENARIO=0
awk '/^> "/{print}' "$SKILL_DIR/uat/scenarios.md" | while IFS= read -r line; do
  SCENARIO=$((SCENARIO + 1))
  PROMPT=$(echo "$line" | sed 's/^> "//;s/"$//')
  echo "[$SKILL_ID scenario-$SCENARIO] ${PROMPT:0:80}..."
  OUT_FILE="$OUT_DIR/scenario-$SCENARIO.txt"
  echo "$BODY" | claude -p --append-system-prompt "$BODY" "$PROMPT" > "$OUT_FILE" 2>&1 || echo "(call failed)" >> "$OUT_FILE"
  echo "  → $OUT_FILE ($(wc -c < "$OUT_FILE") bytes)"
done

echo "Done: $OUT_DIR"
echo "Review the responses manually against $SKILL_DIR/uat/scenarios.md pass/fail criteria"
