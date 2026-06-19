#!/usr/bin/env bash
# Enforce the changed-file line-count ratchet on TypeScript files.
#
# Ratchet, not a hard ceiling. A changed file over the limit passes only if
# this change reduces its line count (even if still over). Files under the
# limit always pass; newly-added files over the limit always fail.
#
# Thresholds: 2× the recommended max from CLAUDE.md
#   Source files: recommended ~200 lines → hard cap 400
#   Test files:   recommended ~300 lines → hard cap 600
#
# Modes:
#   --staged          pre-commit: staged index vs HEAD
#   --base <ref>      CI: working tree vs <ref> (the PR merge-base)
#
# In CI (GITHUB_ACTIONS=true) violations are emitted as workflow annotations
# (::error / ::notice). In pre-commit mode plain text goes to stderr/stdout.
#
# Bypass: git commit --no-verify skips the pre-commit hook.
# The CI step still enforces the ratchet on the final diff.

SOURCE_LIMIT=400
TEST_LIMIT=600

mode=""
base=""

while [ $# -gt 0 ]; do
  case "$1" in
    --staged)
      mode=staged
      shift
      ;;
    --base)
      mode=base
      base="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 --staged | --base <ref>" >&2
      exit 2
      ;;
  esac
done

if [ -z "$mode" ]; then
  echo "Usage: $0 --staged | --base <ref>" >&2
  exit 2
fi

if [ "$mode" = "base" ] && [ -z "$base" ]; then
  echo "--base requires a ref argument" >&2
  exit 2
fi

failed=0

while IFS= read -r file; do
  # Only check TypeScript source files
  case "$file" in
    *.ts|*.tsx) ;;
    *) continue ;;
  esac

  # Get line counts and skip deleted files
  if [ "$mode" = "staged" ]; then
    # Use the staged blob, not the working tree; --diff-filter=ACMR already
    # excludes deletions, but guard against index mismatches anyway.
    new=$(git show ":$file" 2>/dev/null | wc -l) || continue
    old=$(git show "HEAD:$file" 2>/dev/null | wc -l)
  else
    [ -f "$file" ] || continue
    new=$(wc -l < "$file")
    old=$(git show "$base:$file" 2>/dev/null | wc -l)
  fi

  # Determine limit by file type
  case "$file" in
    *.spec.ts|*.spec.tsx|*.test.ts|*.test.tsx|*-tests/*.ts|*-tests/*.tsx)
      limit=$TEST_LIMIT
      kind="test"
      ;;
    *)
      limit=$SOURCE_LIMIT
      kind="source"
      ;;
  esac

  # Under the limit — always fine.
  if [ "$new" -lt "$limit" ]; then
    continue
  fi

  # Over the limit — allowed only if this change reduces the file's length.
  # git show returns nothing (0 lines) for a file new on this branch, so a
  # newly-added oversized file can never count as a reduction.
  if [ "$new" -lt "$old" ]; then
    if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
      echo "::notice file=$file,title=Oversized but improving::$file — $new lines, down from $old ($kind limit: $limit); reducing, allowed"
    else
      echo "note: $file — $new lines (was $old, $kind limit: $limit); reducing toward limit, allowed"
    fi
    continue
  fi

  if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    echo "::error file=$file,title=File too long::$file — $new lines, was $old ($kind limit: $limit); over limit and not reduced by this PR"
  else
    echo "error: $file — $new lines ($kind limit: $limit); over limit and not reduced by this change" >&2
  fi
  failed=1

done < <(
  if [ "$mode" = "staged" ]; then
    git diff --cached --name-only --diff-filter=ACMR
  else
    git diff --name-only "$base" HEAD
  fi
)

if [ "$failed" -ne 0 ]; then
  echo "" >&2
  echo "One or more changed files are over the line-count limit and were not reduced by this change." >&2
  echo "  Source files: recommended max ~200 lines, hard cap ${SOURCE_LIMIT}" >&2
  echo "  Test files:   recommended max ~300 lines, hard cap ${TEST_LIMIT}" >&2
  echo "A file over the limit passes only if this change reduces its line count" >&2
  echo "(progress is allowed even while it is still over the limit)." >&2
  echo "Split the flagged files by logical concern before merging." >&2
  exit 1
fi
