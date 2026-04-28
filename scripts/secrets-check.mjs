#!/usr/bin/env node
/**
 * Pre-commit secrets check. Scans staged files for secrets via gitleaks.
 *
 * Designed to be invoked via `pnpm run secrets-check`.
 * Intended to be called from .husky/pre-commit alongside lint-staged.
 */

import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const gitleaks = spawnSync("which", ["gitleaks"], { encoding: "utf8" });
if (gitleaks.status !== 0) {
  console.warn(
    "\nWARNING: gitleaks not installed — secret scanning skipped.\n" +
      "  Install with: brew install gitleaks\n" +
      "  Secrets will still be caught by CI, but local detection is strongly recommended.\n",
  );
  process.exit(0);
}

const result = spawnSync(
  "gitleaks",
  ["protect", "--staged", "--config", ".gitleaks.toml", "--redact"],
  { stdio: "inherit", cwd: root },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
