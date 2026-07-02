#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" — decides whether a deployment should build.
#   exit 1 => proceed with the build/deploy
#   exit 0 => skip (Vercel cancels the deployment)
#
# Goal: conserve the daily Vercel preview-deploy quota. A preview deploy only
# exists to enable UAT, so most PRs don't need one — only feature and bug-fix
# work does. We therefore build previews ONLY for feat/feature/fix branches and
# skip everything else (docs, chore, refactor, test, deps, etc.).
#
# The Ignored Build Step runs against a commit and only has the git ref
# ($VERCEL_GIT_COMMIT_REF) — NOT the PR title. This repo's branch-name
# conventions make the prefix a reliable proxy for the PR's conventional-commit
# type: feat: PRs come from feat/ or feature/ branches, fix: PRs from fix/.
# A label-driven "deploy only when `ready for UAT`" design is the better long
# term answer but needs the Vercel API; it's tracked as a follow-up issue.
set -euo pipefail

# Production (the main branch) must always deploy — the quota concern is
# previews only.
if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "VERCEL_ENV=production — building."
  exit 1
fi

ref="${VERCEL_GIT_COMMIT_REF:-}"
case "$ref" in
  main | master | feat/* | feature/* | fix/*)
    echo "Branch '$ref' is deploy-eligible — building preview."
    exit 1
    ;;
  *)
    echo "Branch '$ref' is not a feat/feature/fix branch — skipping preview deploy to conserve quota."
    exit 0
    ;;
esac
