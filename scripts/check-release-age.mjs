#!/usr/bin/env node
/**
 * Dependency-cooldown gate (POC). Fails a PR that introduces a package version
 * younger than RELEASE_AGE_MIN_DAYS (default 7). This enforces the "let a
 * release age before we adopt it" supply-chain policy deterministically, at the
 * layer we control — independent of Dependabot's own `cooldown`, which is
 * advisory at PR-creation time and has documented reliability gaps for npm.
 *
 * Why this shape and not pnpm's `minimum-release-age`: putting that setting in
 * committed pnpm config makes Dependabot's own lockfile regeneration honor it,
 * which forces pnpm to fetch publish-time metadata for the whole candidate tree
 * on every update — the full-metadata storm that causes multi-minute/hour
 * Dependabot timeouts on large repos. This gate never touches Dependabot's
 * resolver: it inspects the *result* (the lockfile diff) and queries the
 * registry for only the handful of newly-introduced versions.
 *
 * Usage:  node scripts/check-release-age.mjs [baseRef]
 *   baseRef  git ref to diff against (default: origin/main). The base
 *            pnpm-lock.yaml is read via `git show <baseRef>:pnpm-lock.yaml`;
 *            the head lockfile is read from ./pnpm-lock.yaml in the working
 *            tree. Only versions present in head but not base are checked.
 *
 * Exits 0 if every newly-introduced version is at least the threshold old (or
 * could not be resolved on the public registry — private/workspace/tarball
 * specifiers are skipped). Exits 1 listing each too-young version. Registry
 * fetch failures are warned and skipped (fail-open) so a flaky registry does
 * not produce a spurious red build; a confirmed too-young version always fails.
 */

import { execFileSync } from "child_process";
import { readFileSync } from "fs";

const baseRef = process.argv[2] ?? "origin/main";
const minDays = Number(process.env.RELEASE_AGE_MIN_DAYS ?? "7");
const minMs = minDays * 24 * 60 * 60 * 1000;

const SEMVER_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

/**
 * Collect the `name@version` keys from the top-level `packages:` block of a
 * pnpm v9 lockfile. That block lists each resolved package canonically, without
 * the peer-dependency suffixes that appear in `snapshots:`, so its keys are
 * exactly the `name@version` pairs we want. Returns a Set of "name@version".
 */
function lockedPackages(lockfileText) {
  const packages = new Set();
  let inPackages = false;
  for (const rawLine of lockfileText.split("\n")) {
    const topLevel = /^(\S.*):\s*$/.exec(rawLine);
    if (topLevel) {
      inPackages = topLevel[1] === "packages";
      continue;
    }
    if (!inPackages) continue;
    // A package key is indented exactly two spaces and ends with a colon.
    const entry = /^ {2}(\S.*):\s*$/.exec(rawLine);
    if (entry) packages.add(entry[1].replace(/^['"]|['"]$/g, ""));
  }
  return packages;
}

/** Split a `name@version` key into its name and semver version, else undefined. */
function parseKey(key) {
  const at = key.lastIndexOf("@");
  if (at <= 0) return undefined;
  const name = key.slice(0, at);
  const version = key.slice(at + 1).split("(")[0];
  if (!SEMVER_VERSION.test(version)) return undefined;
  return { name, version };
}

/** Publish timestamp (ms) for name@version, or undefined if unresolvable. */
async function publishedAt(name, version) {
  const url = `https://registry.npmjs.org/${name.replace("/", "%2F")}`;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const time = (await res.json()).time?.[version];
  return time ? Date.parse(time) : undefined;
}

const headLock = readFileSync("pnpm-lock.yaml", "utf8");
const baseLock = execFileSync("git", ["show", `${baseRef}:pnpm-lock.yaml`], {
  encoding: "utf8",
});

const basePackages = lockedPackages(baseLock);
const introduced = [...lockedPackages(headLock)]
  .filter((key) => !basePackages.has(key))
  .map(parseKey)
  .filter((parsed) => parsed !== undefined);

const now = Date.now();
const violations = [];
for (const { name, version } of introduced) {
  let published;
  try {
    published = await publishedAt(name, version);
  } catch (err) {
    console.warn(
      `  warning: could not check ${name}@${version}: ${err.message}`,
    );
    continue;
  }
  if (published === undefined) continue; // private / workspace / unpublished
  const ageDays = (now - published) / (24 * 60 * 60 * 1000);
  if (now - published < minMs) {
    violations.push(`  ${name}@${version} — ${ageDays.toFixed(1)} days old`);
  }
}

if (violations.length > 0) {
  console.error(
    `pnpm-lock.yaml — ${violations.length} newly-introduced version(s) younger than the ${minDays}-day cooldown:`,
  );
  for (const v of violations) console.error(v);
  console.error(
    "\nHold the update until the version ages past the cooldown, then re-run this\n" +
      "check. Malicious releases are typically caught and yanked within days.",
  );
  process.exit(1);
}

console.log(
  `pnpm-lock.yaml — all newly-introduced versions are at least ${minDays} days old. OK`,
);
