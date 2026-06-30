#!/usr/bin/env node
/**
 * Captures Playwright screenshots for every Storybook story whose source file
 * changed in the PR, pushes them to a per-PR `gh-screenshots-pr-<N>` branch,
 * and posts (or updates) a PR comment with an inline gallery.
 *
 * Self-hosted (no third-party action): story IDs are read from Storybook's own
 * `storybook-static/index.json`, so they never drift from Storybook's auto-title
 * algorithm. Screenshots are captured with Playwright against a tiny static
 * server, then force-pushed to a per-PR orphan branch — each PR owns its own
 * image branch, so there is no cross-PR shared resource and concurrent PR runs
 * never race. The set is surfaced via a single marker-tagged PR comment updated
 * in place on re-runs. The per-PR branch is deleted when the PR closes by
 * .github/workflows/storybook-screenshots-cleanup.yml.
 *
 * Expected environment variables:
 *   GITHUB_TOKEN  – token with contents:write and pull-requests:write
 *   REPO          – "owner/repo"
 *   PR_NUMBER     – pull request number
 *   CHANGED_FILES – newline-separated list of changed *.stories.{ts,tsx} paths
 *   PR_HEAD_SHA   – HEAD SHA of the PR branch
 */

import { execSync } from "child_process";
import { readFileSync, rmSync, writeFileSync } from "fs";
import { createServer } from "http";
import { extname, join } from "path";
import { chromium } from "playwright";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const REPO = process.env.REPO ?? "";
const PR_NUMBER = process.env.PR_NUMBER ?? "";
const CHANGED_FILES = process.env.CHANGED_FILES ?? "";
const PR_HEAD_SHA = process.env.PR_HEAD_SHA ?? "";

const COMMENT_MARKER = "<!-- storybook-screenshots-bot -->";
// Per-PR image branch — each PR owns its own, so runs never race across PRs.
const SCREENSHOTS_BRANCH = `gh-screenshots-pr-${PR_NUMBER}`;
const STORYBOOK_PORT = 6006;

const MIME_TYPES = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "application/javascript",
  ".json": "application/json",
  ".mjs": "application/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

// ---------------------------------------------------------------------------
// Story discovery
// ---------------------------------------------------------------------------

const changedFiles = CHANGED_FILES.split("\n")
  .map((file) => file.trim())
  .filter((file) => file.length > 0);

if (changedFiles.length === 0) {
  console.log("No changed story files found — skipping.");
  process.exit(0);
}

const indexJson = JSON.parse(
  readFileSync("storybook-static/index.json", "utf8"),
);
const allEntries = Object.values(indexJson.entries ?? {});

const matchingStories = allEntries.filter((entry) => {
  if (entry.type !== "story") return false;
  // importPath is like "./src/components/Foo/Foo.stories.tsx"
  const normalized = entry.importPath.replace(/^\.\//, "");
  return changedFiles.some((file) => file === normalized);
});

if (matchingStories.length === 0) {
  console.log("No matching stories for changed files — skipping.");
  process.exit(0);
}

console.log(`Found ${matchingStories.length} stories to screenshot.`);

// ---------------------------------------------------------------------------
// Static file server for storybook-static/
// ---------------------------------------------------------------------------

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = req.url.split("?")[0];
      const filePath = join(
        "storybook-static",
        urlPath === "/" ? "index.html" : urlPath.replace(/^\//, ""),
      );
      const mime = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
      try {
        const content = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": mime });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(STORYBOOK_PORT, () => resolve(server));
  });
}

// ---------------------------------------------------------------------------
// Screenshot capture
// ---------------------------------------------------------------------------

async function captureScreenshots() {
  const server = await startStaticServer();
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const story of matchingStories) {
      console.log(`  Screenshotting: ${story.title} / ${story.name}`);
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      const url = `http://localhost:${STORYBOOK_PORT}/iframe.html?id=${story.id}&viewMode=story`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      await page
        .waitForSelector("#storybook-root", {
          state: "visible",
          timeout: 10_000,
        })
        .catch(() => {
          // Some stories render outside #storybook-root; continue anyway.
        });

      const buffer = await page.screenshot({ type: "png" });
      results.push({ story, buffer });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  return results;
}

// ---------------------------------------------------------------------------
// Push screenshots to the per-PR gh-screenshots-pr-<N> branch
// ---------------------------------------------------------------------------

function pushScreenshots(screenshots) {
  const shortSha = PR_HEAD_SHA.slice(0, 7);
  const tmpDir = "/tmp/gh-screenshots-worktree";

  execSync(
    'git config user.email "github-actions[bot]@users.noreply.github.com"',
  );
  execSync('git config user.name "github-actions[bot]"');

  // Each PR owns its image branch (gh-screenshots-pr-<N>), so runs never race
  // across PRs — there is no shared mutable resource. Rebuild the full set each
  // run as a fresh orphan branch and force-push it: no fetch/merge, no stale
  // files, and the branch stays image-only (carries no repo history). Intra-PR
  // serialization is handled by the workflow's per-PR concurrency group, so the
  // force-push never races with another run of the same PR.
  rmSync(tmpDir, { recursive: true, force: true });
  execSync(`git worktree add --orphan -b ${SCREENSHOTS_BRANCH} ${tmpDir}`);

  const fileNames = screenshots.map(({ story, buffer }) => {
    const safeName = story.id.replace(/[^a-zA-Z0-9-]/g, "-");
    const fileName = `${safeName}.png`;
    writeFileSync(`${tmpDir}/${fileName}`, buffer);
    return { story, fileName };
  });

  execSync(`git -C ${tmpDir} add -A`);
  execSync(
    `git -C ${tmpDir} commit -m "Screenshots for PR #${PR_NUMBER} (${shortSha})"`,
  );
  execSync(`git -C ${tmpDir} push --force origin ${SCREENSHOTS_BRANCH}`);
  execSync(`git worktree remove --force ${tmpDir}`);
  return fileNames;
}

// ---------------------------------------------------------------------------
// Post or update the PR comment
// ---------------------------------------------------------------------------

function buildRawUrl(fileName) {
  return `https://raw.githubusercontent.com/${REPO}/${SCREENSHOTS_BRANCH}/${fileName}`;
}

function buildCommentBody(fileNames) {
  const shortSha = PR_HEAD_SHA.slice(0, 7);
  const rows = fileNames
    .map(
      ({ story, fileName }) =>
        `| **${story.title}** — ${story.name} | ![${story.name}](${buildRawUrl(fileName)}) |`,
    )
    .join("\n");

  return `${COMMENT_MARKER}
## 📸 Storybook Screenshots

| Story | Preview |
|---|---|
${rows}

<sub>Generated from commit ${shortSha}</sub>`;
}

async function findExistingCommentId(apiBase, headers) {
  for (let page = 1; ; page++) {
    const res = await fetch(
      `${apiBase}/issues/${PR_NUMBER}/comments?per_page=100&page=${page}`,
      { headers },
    );
    if (!res.ok) {
      throw new Error(
        `GitHub API list-comments ${res.status}: ${await res.text()}`,
      );
    }
    const comments = await res.json();
    if (!Array.isArray(comments) || comments.length === 0) return null;

    const match = comments.find((comment) =>
      comment.body?.includes(COMMENT_MARKER),
    );
    if (match) return match.id;
    if (comments.length < 100) return null;
  }
}

async function postPrComment(fileNames) {
  const [owner, repoName] = REPO.split("/");
  const apiBase = `https://api.github.com/repos/${owner}/${repoName}`;
  const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "storybook-screenshots-bot",
  };

  const commentBody = buildCommentBody(fileNames);
  const existingCommentId = await findExistingCommentId(apiBase, headers);

  const url =
    existingCommentId !== null
      ? `${apiBase}/issues/comments/${existingCommentId}`
      : `${apiBase}/issues/${PR_NUMBER}/comments`;
  const res = await fetch(url, {
    method: existingCommentId !== null ? "PATCH" : "POST",
    headers,
    body: JSON.stringify({ body: commentBody }),
  });
  if (!res.ok) {
    throw new Error(
      `GitHub API write-comment ${res.status}: ${await res.text()}`,
    );
  }
  console.log(
    existingCommentId !== null
      ? "Updated existing PR comment."
      : "Posted new PR comment.",
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const screenshots = await captureScreenshots();

if (screenshots.length === 0) {
  console.log("No screenshots captured — skipping.");
  process.exit(0);
}

const fileNames = pushScreenshots(screenshots);
await postPrComment(fileNames);
console.log("Done.");
