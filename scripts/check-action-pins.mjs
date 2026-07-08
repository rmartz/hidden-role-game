#!/usr/bin/env node
/**
 * Enforces the SHA-pinning rule from AGENTS.md: every third-party GitHub Action
 * referenced in a workflow or composite action must pin an immutable 40-char
 * commit SHA and carry a trailing `# vX.Y.Z` version comment.
 *
 * A mutable tag (`actions/checkout@v7`) can be force-repointed at a malicious
 * commit (the tj-actions/changed-files class of attack); an immutable commit
 * SHA cannot. The version comment is not decoration: Dependabot's
 * github-actions ecosystem reads it to know which release the opaque SHA maps
 * to, and bumps the SHA *and* the comment together — so a missing/mismatched
 * comment means Dependabot silently stops maintaining the pin.
 *
 * Exempt: local actions (`uses: ./…`) — first-party, no external tag to pin —
 * and Docker refs (`uses: docker://…`), which have their own digest-pinning
 * story out of scope here.
 *
 * Exits 0 if every external `uses:` is SHA-pinned with a version comment, 1
 * otherwise, naming each offending file / line / ref and why.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEARCH_DIRS = [".github/workflows", ".github/actions"];
const YAML = /\.ya?ml$/;

// Captures the ref and any trailing comment on a `uses:` line, tolerating an
// optional list dash and optional quotes around the ref.
const USES = /^\s*(?:-\s*)?uses:\s*["']?([^"'#\s]+)["']?\s*(?:#\s*(.*?)\s*)?$/;
const SHA = /^[0-9a-f]{40}$/;
// Require a full v-prefixed MAJOR.MINOR.PATCH (optional prerelease/build) — not
// a floating `v7` or `v7.0`. Dependabot anchors the pin on this comment, and a
// precise version is what lets it detect and write the next exact release; the
// leading token of the comment is what it reads.
const VERSION_COMMENT = /^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (YAML.test(entry)) files.push(full);
  }
  return files;
}

function checkRef(ref, comment) {
  if (ref.startsWith("./") || ref.startsWith("docker://")) return undefined;
  const at = ref.lastIndexOf("@");
  if (at === -1) return "no version — pin to a 40-char commit SHA";
  const version = ref.slice(at + 1);
  if (!SHA.test(version)) {
    return `pinned to "${version}" — must be a 40-char commit SHA`;
  }
  if (!comment) {
    return "missing a `# vX.Y.Z` version comment (Dependabot needs it to track the pin)";
  }
  if (!VERSION_COMMENT.test(comment.split(/\s+/)[0])) {
    return `version comment "${comment}" is not full semver — use \`# vMAJOR.MINOR.PATCH\` so Dependabot can track the pin`;
  }
  return undefined;
}

const violations = [];
for (const dir of SEARCH_DIRS) {
  const abs = join(root, dir);
  let entries;
  try {
    entries = walk(abs);
  } catch {
    continue; // directory absent — nothing to check
  }
  for (const file of entries) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const match = USES.exec(line);
      if (!match) return;
      const reason = checkRef(match[1], match[2]);
      if (reason) {
        const rel = file.slice(root.length + 1);
        violations.push(`  ${rel}:${i + 1} — ${match[1]}: ${reason}`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error(
    `${violations.length} GitHub Action reference(s) are not SHA-pinned with a version comment:`,
  );
  for (const v of violations) console.error(v);
  console.error(
    "\nPin to the commit SHA the tag resolves to, keeping the version in a\n" +
      "comment, e.g. `actions/checkout@9c091bb… # v7.0.0`, so a repointed tag\n" +
      "cannot inject code and Dependabot keeps the pin up to date.",
  );
  process.exit(1);
}

console.log("All GitHub Actions are SHA-pinned with a version comment. OK");
