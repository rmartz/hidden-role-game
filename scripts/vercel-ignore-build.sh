#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" — decides whether a Git-integration deployment
# should build.
#   exit 1 => proceed with the build/deploy
#   exit 0 => skip (Vercel cancels the deployment)
#
# Production (main) always builds. Preview auto-deploys are disabled entirely:
# previews are now label-driven — the Preview Deploy workflow
# (.github/workflows/preview-deploy.yml) deploys a preview via the Vercel CLI
# only when a PR is labelled `ready for UAT`. A preview exists to enable UAT, so
# tying it to that label (rather than every push) is both the quota win and the
# correct signal. The CLI deploy uploads a prebuilt output, so it is not gated
# by this Ignored Build Step.
set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "VERCEL_ENV=production — building."
  exit 1
fi

echo "Preview auto-deploy disabled — previews are label-driven (see the Preview Deploy workflow). Skipping."
exit 0
