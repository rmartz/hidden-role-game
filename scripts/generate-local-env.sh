#!/usr/bin/env bash
# Generates .env.local in the project root by pulling from Vercel's stored
# environment variables for the staging (preview) environment.
#
# Usage: scripts/generate-local-env.sh
#
# Requires: vercel CLI authenticated via `vercel login`

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Prerequisites ─────────────────────────────────────────────────────────────

if ! command -v vercel &>/dev/null; then
  echo "ERROR: vercel CLI not found."
  echo "Install it with: pnpm add -g vercel"
  exit 1
fi

if ! vercel whoami &>/dev/null 2>&1; then
  echo "ERROR: Not authenticated with Vercel."
  echo "Run: vercel login"
  exit 1
fi

# ── Pull ──────────────────────────────────────────────────────────────────────

OUTPUT="$PROJECT_ROOT/.env.local"

echo "Pulling staging environment variables from Vercel..."
(
  cd "$PROJECT_ROOT"
  vercel env pull "$OUTPUT" --environment=preview --yes
)

echo ""
echo "Written to .env.local (gitignored — do not commit)."
echo "Re-run this script after key rotation to refresh your local credentials."
