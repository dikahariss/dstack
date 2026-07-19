#!/usr/bin/env bash
# version.sh — read or update the VERSION file deterministically.
#
# Usage:
#   version.sh show
#   version.sh bump (major | minor | patch)
#   version.sh set X.Y.Z
#
# Exit codes: 0 success, 1 invalid arg, 2 VERSION file missing.

set -euo pipefail

VERSION_FILE="${VERSION_FILE:-VERSION}"

show() {
  if [[ ! -f "$VERSION_FILE" ]]; then
    echo "VERSION file not found at $VERSION_FILE" >&2
    exit 2
  fi
  cat "$VERSION_FILE"
}

bump() {
  local part="$1"
  if [[ ! -f "$VERSION_FILE" ]]; then
    echo "VERSION file not found at $VERSION_FILE" >&2
    exit 2
  fi
  local current
  current="$(cat "$VERSION_FILE")"
  if [[ ! "$current" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "VERSION file does not contain a semver triple: $current" >&2
    exit 1
  fi
  local major="${BASH_REMATCH[1]}"
  local minor="${BASH_REMATCH[2]}"
  local patch="${BASH_REMATCH[3]}"
  case "$part" in
    major) major=$((major + 1)); minor=0; patch=0 ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    patch) patch=$((patch + 1)) ;;
    *) echo "unknown bump part: $part (expected major|minor|patch)" >&2; exit 1 ;;
  esac
  local next="${major}.${minor}.${patch}"
  printf '%s\n' "$next" > "$VERSION_FILE"
  echo "$next"
}

set_explicit() {
  local target="$1"
  if [[ ! "$target" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "target version must be a semver triple X.Y.Z (got $target)" >&2
    exit 1
  fi
  printf '%s\n' "$target" > "$VERSION_FILE"
  echo "$target"
}

case "${1:-}" in
  show) show ;;
  bump) shift; bump "${1:-}" ;;
  set)  shift; set_explicit "${1:-}" ;;
  *)
    cat >&2 <<USAGE
usage: version.sh show
       version.sh bump (major | minor | patch)
       version.sh set X.Y.Z
USAGE
    exit 1
    ;;
esac
