#!/usr/bin/env node
/**
 * Enforces the full-semver pin rule from AGENTS.md: every registry dependency
 * in package.json must pin a full major.minor.patch version (keeping any ^ or ~
 * range annotation). A partial pin like "^3" lets Dependabot bump the package
 * by moving only pnpm-lock.yaml, so the update never shows up in the
 * package.json diff and a behavior/formatting change appears out of nowhere.
 *
 * Non-registry specifiers are exempt: tarball/git URLs, workspace:, catalog:,
 * link:, file:, and dist-tags (e.g. "latest", "*").
 *
 * Exits 0 if all pins are full versions, 1 if any violations are found, naming
 * each offending section / dependency / range.
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

// A simple registry version range: optional ^ or ~ followed by a version
// number. Anything else (URLs, workspace:/catalog:/link:/file:, dist-tags) does
// not match and is exempt from the rule.
const REGISTRY_RANGE = /^[\^~]?\d/;

// Full major.minor.patch, optional range annotation, optional prerelease/build.
const FULL_SEMVER = /^[\^~]?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const violations = DEPENDENCY_SECTIONS.flatMap((section) =>
  Object.entries(pkg[section] ?? {})
    .filter(([, spec]) => REGISTRY_RANGE.test(spec) && !FULL_SEMVER.test(spec))
    .map(([name, spec]) => `  ${section} / ${name} / "${spec}"`),
);

if (violations.length > 0) {
  console.error(
    `package.json — ${violations.length} dependency pin(s) are not a full major.minor.patch version:`,
  );
  for (const v of violations) console.error(v);
  console.error(
    '\nPin the full version (keeping the ^ or ~ annotation), e.g. "^3" -> "^3.8.4",\n' +
      "so Dependabot bumps are always visible in the package.json diff.",
  );
  process.exit(1);
}

console.log("package.json — all dependency pins specify a full version. OK");
