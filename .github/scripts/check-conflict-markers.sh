#!/usr/bin/env bash
# Block commits that introduce Git merge-conflict markers.
#
# A merge-conflict resolution can leave markers behind; nothing else stops them
# being committed and pushed, so they would only surface at review time. Worse,
# the PostToolUse Prettier formatter reflows leftover markers in Markdown/YAML
# (>>>>>>> branch becomes a nested blockquote, ======= a setext heading),
# mangling them so `git checkout --ours/--theirs` and manual resolution can no
# longer match them. This guard catches markers at commit time.
#
# Mode:
#   --staged    scan staged blobs (pre-commit hook)
#
# Detection (full-triple rule, no doc special-casing):
#   A line beginning with seven `<` or seven `>` (followed by whitespace or
#   end-of-line) is an unambiguous conflict ANGLE marker — these never occur in
#   normal source or Markdown, so they are flagged anywhere. The separator line
#   (seven `=`) and the diff3 base line (seven `|`) are reported too, but ONLY
#   in a file that already contains an angle marker — so a Markdown setext
#   underline or a `=======` divider is never a false positive.
#
# Bypass: git commit --no-verify (git-native), or ALLOW_CONFLICT_MARKERS=1.

if [ "${ALLOW_CONFLICT_MARKERS:-}" = "1" ]; then
  exit 0
fi

mode=""
while [ $# -gt 0 ]; do
  case "$1" in
    --staged)
      mode=staged
      shift
      ;;
    *)
      echo "Usage: $0 --staged" >&2
      exit 2
      ;;
  esac
done

if [ "$mode" != "staged" ]; then
  echo "Usage: $0 --staged" >&2
  exit 2
fi

angle_re='^(<<<<<<<|>>>>>>>)([[:space:]]|$)'
mid_re='^(=======|\|\|\|\|\|\|\|)([[:space:]]|$)'

failed=0

while IFS= read -r -d '' file; do
  content=$(git show ":$file" 2>/dev/null) || continue

  # Full-triple rule: a file is only a conflict if it has an angle marker.
  if ! printf '%s' "$content" | grep -Eq "$angle_re"; then
    continue
  fi

  echo "error: $file contains Git conflict markers:" >&2
  printf '%s\n' "$content" | grep -nE "$angle_re|$mid_re" >&2
  failed=1
done < <(git diff --cached --name-only --diff-filter=ACMR -z)

if [ "$failed" -ne 0 ]; then
  echo "" >&2
  echo "Resolve the conflict markers above before committing." >&2
  echo "Bypass with: git commit --no-verify  (or ALLOW_CONFLICT_MARKERS=1)" >&2
  exit 1
fi
