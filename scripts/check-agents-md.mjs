#!/usr/bin/env node
/**
 * Enforces the agent directive-file convention across the repository:
 *
 *   1. All directives live in AGENTS.md (the single source of truth).
 *   2. Every AGENTS.md has a companion CLAUDE.md in the same directory, and
 *      every CLAUDE.md has a companion AGENTS.md in the same directory.
 *   3. Every CLAUDE.md is a bare wrapper whose only content is the Claude Code
 *      import line `@AGENTS.md` — no directives, no other text, no symlinks.
 *
 * Walks the repo (skipping vendored / build / VCS / worktree directories),
 * pairs up AGENTS.md and CLAUDE.md files by directory, and reports every
 * violation.
 *
 * Exits 0 when the whole tree is compliant, 1 when any violation is found.
 */

import { lstatSync, readdirSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Directories that never contain first-party directive files. `.claude` holds
// gitignored local worktrees (full repo checkouts on other branches); walking
// them would flag stale copies that are not part of this commit.
const SKIP_DIRS = new Set([
  ".claude",
  ".git",
  ".git-worktrees",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "storybook-static",
]);

// The exact content a CLAUDE.md wrapper must import.
const IMPORT_LINE = "@AGENTS.md";

/** Recursively collect the directories that contain an AGENTS.md or CLAUDE.md. */
function collectDirs(dir, found) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectDirs(join(dir, entry.name), found);
    } else if (entry.name === "AGENTS.md" || entry.name === "CLAUDE.md") {
      found.add(dir);
    }
  }
  return found;
}

function existsInDir(dir, name) {
  try {
    lstatSync(join(dir, name));
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a CLAUDE.md wrapper. Returns an error string, or undefined when the
 * file is a compliant bare `@AGENTS.md` wrapper. A symlink is rejected outright
 * — the convention requires a real file containing the import line.
 */
function wrapperError(claudePath) {
  const stat = lstatSync(claudePath);
  if (stat.isSymbolicLink()) {
    return "CLAUDE.md is a symlink; it must be a real file containing only `@AGENTS.md`";
  }
  if (!stat.isFile()) {
    return "CLAUDE.md is not a regular file (e.g. a directory); it must be a real file containing only `@AGENTS.md`";
  }
  const meaningfulLines = readFileSync(claudePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (meaningfulLines.length === 1 && meaningfulLines[0] === IMPORT_LINE) {
    return undefined;
  }
  return `CLAUDE.md must contain only the bare import line \`${IMPORT_LINE}\`, but found: ${JSON.stringify(meaningfulLines)}`;
}

function main() {
  const violations = [];
  for (const dir of collectDirs(root, new Set())) {
    const rel = relative(root, dir) || ".";
    const hasAgents = existsInDir(dir, "AGENTS.md");
    const hasClaude = existsInDir(dir, "CLAUDE.md");

    if (hasAgents && !hasClaude) {
      violations.push(`${rel}: AGENTS.md has no companion CLAUDE.md`);
    }
    if (hasClaude && !hasAgents) {
      violations.push(`${rel}: CLAUDE.md has no companion AGENTS.md`);
    }
    if (hasClaude) {
      const error = wrapperError(join(dir, "CLAUDE.md"));
      if (error) violations.push(`${rel}: ${error}`);
    }
  }

  if (violations.length > 0) {
    console.error("Agent directive-file convention violations:\n");
    for (const violation of violations) console.error(`  ✗ ${violation}`);
    console.error(
      `\n${violations.length} violation(s). Fix them so that every AGENTS.md has a` +
        ` companion CLAUDE.md whose only content is \`${IMPORT_LINE}\`.`,
    );
    process.exit(1);
  }

  console.log("All AGENTS.md / CLAUDE.md pairs are compliant.");
}

main();
