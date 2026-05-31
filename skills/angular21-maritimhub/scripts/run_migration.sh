#!/usr/bin/env bash
#
# run_migration.sh — Run ONE official Angular schematic behind a build/test/commit gate.
#
# This is deterministic plumbing, not orchestration. It runs a single migration,
# then builds (and optionally tests), and stops loudly on failure so Claude can
# inspect the fallout and decide what to do. Claude chooses WHICH migration to run
# and in WHAT order (see SKILL.md / references/migrations.md) — this script just
# executes one step safely and reports a clean pass/fail.
#
# Why one-at-a-time + commit: a single isolated schematic is trivial to debug or
# revert; a batch of five is a nightmare. The git commit after each green step is
# the undo button.
#
# Usage:
#   bash run_migration.sh <migration-name> [extra schematic args...]
#   bash run_migration.sh control-flow
#   bash run_migration.sh route-lazy-loading --path src/app/admin
#   DRY_RUN=1  bash run_migration.sh control-flow   # preview only, writes nothing
#   RUN_TEST=1 bash run_migration.sh inject         # also gate on tests (suite must run headless)
#   NO_COMMIT=1 bash run_migration.sh standalone    # build, but don't auto-commit (inspect first)
#
# Gates: schematic -> build (always) -> test (only if RUN_TEST=1) -> commit.
# The test gate is opt-in because a misconfigured 'ng test' can hang and stall everything.
#
# Recommended order (run each, inspect, fix fallout, then the next):
#   standalone  (run 3x: convert -> remove-modules -> bootstrap)
#   control-flow
#   cleanup-unused-imports
#   inject
#   signal-queries-migration
#   output-migration
#   signal-input-migration
#   route-lazy-loading
#   self-closing-tag
#   ngclass-to-class-migration / ngstyle-to-style-migration
#   common-to-standalone
#   router-testing-module-migration

set -uo pipefail

MIG="${1:-}"
if [ -z "$MIG" ]; then
  echo "Usage: bash run_migration.sh <migration-name> [extra args]"
  echo "See the header of this script for the recommended order."
  exit 1
fi
shift || true

PKG_RUN="npx"; command -v ng >/dev/null 2>&1 && PKG_RUN=""

run_ng() { if [ -n "$PKG_RUN" ]; then npx ng "$@"; else ng "$@"; fi; }

echo "============================================================"
echo " MIGRATION: @angular/core:$MIG  $*"
echo "============================================================"

# Dry-run: preview the schematic's changes without touching anything. No gates, no commit.
if [ "${DRY_RUN:-0}" = "1" ]; then
  echo ">> DRY RUN — previewing changes only, nothing written."
  run_ng generate "@angular/core:$MIG" "$@" --dry-run
  exit $?
fi

# We rely on git for the commit gate and as the undo button. Require a repo.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: not inside a git repository. This script commits each step so you can"
  echo "revert cleanly. Run 'git init' (and an initial commit) first, or use DRY_RUN=1."
  exit 1
fi

# Refuse to run on a dirty tree — we need a clean baseline to make the commit meaningful.
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "ERROR: working tree is dirty. Commit or stash first so this step is isolated"
  echo "(then a bad migration is one 'git revert' away)."
  exit 1
fi

echo ">> running schematic..."
if ! run_ng generate "@angular/core:$MIG" "$@"; then
  echo "!! schematic FAILED. Nothing committed. Read the error above — many failures"
  echo "   are pre-existing compile errors the schematic needs resolved first."
  exit 2
fi

echo ">> building (gate)..."
if ! run_ng build; then
  echo "!! BUILD FAILED after $MIG. This is expected for some migrations (e.g. inject"
  echo "   breaking super() chains, signal-input refs needing () calls)."
  echo "   Fix the build by hand, then commit. NOT auto-committing."
  exit 3
fi

# Test gate is OPT-IN. A misconfigured 'ng test' (e.g. Karma without a headless browser)
# can HANG indefinitely and stall everything — worse than a failure. Enable deliberately
# with RUN_TEST=1 once you know the suite runs headless and exits.
if [ "${RUN_TEST:-0}" = "1" ]; then
  echo ">> testing (gate)..."
  if ! run_ng test --watch=false; then
    echo "!! TESTS FAILED. Inspect: schematics don't touch spec files perfectly (not AoT)."
    echo "   Fix tests, then commit. NOT auto-committing."
    exit 4
  fi
else
  echo ">> (test gate skipped — set RUN_TEST=1 to enable once your suite runs headless)"
fi

if [ "${NO_COMMIT:-0}" = "1" ]; then
  echo ">> build green. NO_COMMIT set — review the diff, then commit yourself."
  exit 0
fi

git add -A
git commit -q -m "chore(angular): apply $MIG migration" && \
  echo ">> committed: chore(angular): apply $MIG migration"
echo ">> DONE. Proceed to the next migration."
