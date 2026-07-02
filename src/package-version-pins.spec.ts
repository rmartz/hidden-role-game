import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

// Enforces the full-semver pin rule from AGENTS.md: every registry dependency
// must pin major.minor.patch (with an optional ^ or ~ range annotation), so a
// Dependabot bump always shows up in the package.json diff rather than moving
// only the lockfile. Partial pins like "^3" or "^3.8" hide bumps from review.
const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
) as Record<string, Record<string, string>>;

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

// A registry version range: optional range annotation (^, ~, >=, >, <=, <, =)
// followed by a version number. Non-registry specifiers (tarball URLs, git+,
// workspace:, file:, link:, dist-tags like "latest", "*") do not start with
// a version-range character or digit and are exempt from the rule.
const REGISTRY_RANGE = /^(?:[\^~]|[><]=?|=)?\d/;

// Full major.minor.patch, optional range annotation, optional prerelease/build.
const FULL_SEMVER = /^(?:[\^~]|[><]=?|=)?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

const pinnedEntries = DEPENDENCY_SECTIONS.flatMap((section) =>
  Object.entries(packageJson[section] ?? {})
    .filter(([, spec]) => REGISTRY_RANGE.test(spec))
    .map(([name, spec]) => ({ section, name, spec })),
);

describe("package.json version pins", () => {
  it.each(pinnedEntries)(
    "$section: $name pins a full major.minor.patch version ($spec)",
    ({ spec }) => {
      expect(spec).toMatch(FULL_SEMVER);
    },
  );
});
