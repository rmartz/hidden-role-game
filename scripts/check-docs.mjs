#!/usr/bin/env node
/**
 * Enforces the documentation conventions for pages under `docs/`:
 *
 *   1. OKF frontmatter — every `docs/**\/*.md` opens with a YAML frontmatter
 *      block carrying a `type` from the allowed vocabulary plus `title` and
 *      `description`. Per-mode pages (Roles / Actions / DataFlow) also carry
 *      `gameMode` and a `resource` path, and any `resource:` path must exist.
 *
 *   2. Index reachability — every page is reachable by navigating markdown
 *      links from the top-level index (`docs/index.md`) through index files
 *      only (`index.md`, the OKF directory index). This is exactly the "listed
 *      in an index, and every sub-index reachable from its parent" rule: a
 *      reader (or agent) can reach any page by walking index → sub-index → page.
 *
 * Frontmatter is parsed directly (no dependency), the same constrained-YAML
 * way `validate-config.mjs` parses `deployment/`.
 *
 * Exits 0 when every page is conformant, 1 when any violation is found.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs");

// The top-level index every other page must be reachable from.
const ROOT_INDEX = join(docsDir, "index.md");

// Canonical OKF `type` vocabulary for this repo (see docs/index.md).
const ALLOWED_TYPES = [
  "Actions",
  "DataFlow",
  "Guide",
  "Index",
  "Reference",
  "Roles",
];

// Per-mode page types additionally require `gameMode` and `resource`.
const MODE_TYPES = new Set(["Actions", "DataFlow", "Roles"]);

/** A file is a directory index when it is named index.md (the OKF index). */
function isIndexFile(absPath) {
  const name = absPath.slice(absPath.lastIndexOf("/") + 1);
  return name === "index.md";
}

/**
 * Parse the leading `--- ... ---` frontmatter block into a key/value map, or
 * return undefined when the file does not open with one. Only scalar values are
 * needed (type, title, description, gameMode, resource); list values are ignored.
 */
function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") return undefined;
  const result = {};
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return result;
    const colon = lines[i].indexOf(":");
    if (colon === -1) continue;
    const key = lines[i].slice(0, colon).trim();
    const value = lines[i]
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) result[key] = value;
  }
  // No closing fence — treat as malformed (no frontmatter).
  return undefined;
}

/** Collect every markdown page under docs/, as absolute paths, sorted. */
function collectPages() {
  return readdirSync(docsDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

/** Frontmatter violations for a single page, as `path: reason` strings. */
function frontmatterViolations(absPath) {
  const rel = relative(root, absPath);
  const frontmatter = parseFrontmatter(readFileSync(absPath, "utf8"));
  if (!frontmatter) {
    return [`${rel}: missing OKF frontmatter (no leading \`---\` block)`];
  }

  const violations = [];
  const { type, title, description, gameMode, resource } = frontmatter;

  if (!type) {
    violations.push(`${rel}: missing required frontmatter field \`type\``);
  } else if (!ALLOWED_TYPES.includes(type)) {
    violations.push(
      `${rel}: invalid \`type: ${type}\` (allowed: ${ALLOWED_TYPES.join(", ")})`,
    );
  }
  if (!title)
    violations.push(`${rel}: missing required frontmatter field \`title\``);
  if (!description)
    violations.push(
      `${rel}: missing required frontmatter field \`description\``,
    );

  if (type && MODE_TYPES.has(type)) {
    if (!gameMode)
      violations.push(
        `${rel}: \`type: ${type}\` requires frontmatter field \`gameMode\``,
      );
    if (!resource)
      violations.push(
        `${rel}: \`type: ${type}\` requires frontmatter field \`resource\``,
      );
  }
  if (resource && !existsSync(join(root, resource))) {
    violations.push(
      `${rel}: \`resource: ${resource}\` does not exist in the repo`,
    );
  }

  return violations;
}

/**
 * Extract the docs pages an index file links to. Only local markdown targets
 * within docs/ are returned (absolute paths); external URLs, anchors, and
 * non-.md targets are ignored. Both inline `](path)` and reference-style
 * `]: path` link definitions are recognized.
 */
function linkedPages(indexPath) {
  const content = readFileSync(indexPath, "utf8");
  const targets = new Set();
  const linkRe = /\]\(([^)\s]+)\)|\]:\s*(\S+)/g;
  let match;
  while ((match = linkRe.exec(content)) !== null) {
    const raw = (match[1] ?? match[2]).split("#")[0].split("?")[0];
    if (!raw || /^[a-z][a-z0-9+.-]*:/i.test(raw) || !raw.endsWith(".md"))
      continue;
    const abs = resolve(dirname(indexPath), raw);
    if (abs.startsWith(docsDir + "/")) targets.add(abs);
  }
  return targets;
}

/**
 * Reachability violations: every page must be reachable from ROOT_INDEX by
 * following links through index files only. Returns `path: reason` strings.
 */
function reachabilityViolations(pages) {
  if (!existsSync(ROOT_INDEX)) {
    return [`docs/index.md: top-level index is missing`];
  }
  const pageSet = new Set(pages);
  const reached = new Set([ROOT_INDEX]);
  const queue = [ROOT_INDEX];
  while (queue.length > 0) {
    const indexPath = queue.shift();
    for (const target of linkedPages(indexPath)) {
      if (!pageSet.has(target) || reached.has(target)) continue;
      reached.add(target);
      // Only index files are traversed further; other pages are leaves.
      if (isIndexFile(target)) queue.push(target);
    }
  }

  return pages
    .filter((page) => !reached.has(page))
    .map(
      (page) =>
        `${relative(root, page)}: not reachable from docs/index.md — link it from an index.md`,
    );
}

function main() {
  const pages = collectPages();
  const violations = [];
  for (const page of pages) violations.push(...frontmatterViolations(page));
  violations.push(...reachabilityViolations(pages));

  if (violations.length > 0) {
    console.error("Documentation convention violations:\n");
    for (const violation of violations) console.error(`  ✗ ${violation}`);
    console.error(
      `\n${violations.length} violation(s). See docs/index.md for the docs conventions.`,
    );
    process.exit(1);
  }

  console.log(
    `docs/ — ${pages.length} page(s) OK (frontmatter + index reachability).`,
  );
}

main();
