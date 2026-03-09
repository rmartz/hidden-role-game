/**
 * Patches the generated .pnp.cjs to add trailing slashes to workspace package
 * locations. pnpm currently generates locations like "./app" but the PnP
 * findPackageLocator algorithm requires trailing slashes to correctly match
 * files within workspace packages against the right package context.
 *
 * Workspace packages are identified as packageLocation values that:
 * - start with "./"
 * - do not contain "node_modules"
 * - do not already end with "/"
 * - are not the root "./"
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const pnpPath = join(repoRoot, ".pnp.cjs");

let pnp = readFileSync(pnpPath, "utf8");

// Match packageLocation values that look like workspace packages
const pattern = /"packageLocation": "(\.[^"]+)"/g;
const toFix = new Set();

for (const match of pnp.matchAll(pattern)) {
  const loc = match[1];
  if (loc !== "./" && !loc.endsWith("/") && !loc.includes("node_modules")) {
    toFix.add(loc);
  }
}

if (toFix.size === 0) {
  process.exit(0);
}

for (const loc of toFix) {
  pnp = pnp.replaceAll(
    `"packageLocation": "${loc}"`,
    `"packageLocation": "${loc}/"`,
  );
  console.log(`Patched PnP workspace location: "${loc}" → "${loc}/"`);
}

writeFileSync(pnpPath, pnp);
