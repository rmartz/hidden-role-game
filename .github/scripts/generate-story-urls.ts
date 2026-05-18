#!/usr/bin/env node
/**
 * Generate a screenshots.config.yml for auto-pr-screenshots-action.
 *
 * Usage:
 *   pnpm tsx .github/scripts/generate-story-urls.ts [file1.stories.tsx ...]
 *
 * File paths should be relative to the repository root (as produced by
 * `git diff --name-only`). When no files are passed the output is an empty
 * screenshots list so the screenshots job exits cleanly without errors.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { generateScreenshotsConfig } from "../../src/lib/storybook-screenshots/story-utils.js";

const STORYBOOK_BASE_URL = "http://localhost:6006";
const OUTPUT_PATH = join(process.cwd(), ".github", "screenshots.config.yml");

const filePaths = process.argv.slice(2).filter(Boolean);

if (filePaths.length === 0) {
  console.log("No story files provided — writing empty config.");
  writeFileSync(OUTPUT_PATH, "screenshots: []\n");
  process.exit(0);
}

const files = filePaths.map((filePath) => ({
  path: filePath,
  content: readFileSync(filePath, "utf-8"),
}));

const config = generateScreenshotsConfig(files, STORYBOOK_BASE_URL);
writeFileSync(OUTPUT_PATH, config);
console.log(`Generated ${filePaths.length} story file(s) → ${OUTPUT_PATH}`);
