#!/usr/bin/env bash
# list_comments.sh — fetch every review comment for a PR as JSONL.
#
# Each line is `{author, file, line, body}` so the model can iterate in
# order without re-parsing the wire format. Requires `gh` and `jq`.
#
# Usage:
#   GH_PR_NUMBER=42 list_comments.sh
#   list_comments.sh 42

set -euo pipefail

pr="${1:-${GH_PR_NUMBER:-}}"
if [[ -z "$pr" ]]; then
  echo "usage: list_comments.sh <pr-number> (or set GH_PR_NUMBER)" >&2
  exit 1
fi

for cmd in gh jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd not installed; cannot fetch PR comments" >&2
    exit 1
  fi
done

gh pr view "$pr" --json comments --jq '.comments[] | {author: .author.login, file: null, line: null, body: .body}'
gh api "repos/{owner}/{repo}/pulls/${pr}/comments" --jq '.[] | {author: .user.login, file: .path, line: .line, body: .body}'
