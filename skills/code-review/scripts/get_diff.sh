#!/usr/bin/env bash
# get_diff.sh — fetch the diff that needs review.
#
# Strategy:
#   * If GH_PR_NUMBER is set, use `gh pr diff $GH_PR_NUMBER`.
#   * Else if HEAD is on a branch with an upstream, diff against the
#     upstream tracking branch.
#   * Otherwise diff against `origin/main` (or `origin/master`,
#     whichever exists).
#
# Output goes to stdout. Errors go to stderr with a non-zero exit.

set -euo pipefail

if [[ -n "${GH_PR_NUMBER:-}" ]]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI not available; cannot fetch diff for PR ${GH_PR_NUMBER}" >&2
    exit 1
  fi
  exec gh pr diff "${GH_PR_NUMBER}"
fi

upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [[ -n "$upstream" ]]; then
  exec git diff "${upstream}...HEAD"
fi

for fallback in origin/main origin/master; do
  if git rev-parse --verify "$fallback" >/dev/null 2>&1; then
    exec git diff "${fallback}...HEAD"
  fi
done

echo "no upstream branch and no origin/main or origin/master to diff against" >&2
exit 1
