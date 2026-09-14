#!/usr/bin/env node
/**
 * Dependabot grouping-outcome audit.
 *
 * Reconstructs, from the GitHub API, how every Dependabot PR in the repository
 * turned out — merged cleanly, needed a human fix to unblock, still stuck, or
 * routine Dependabot supersede-churn — attributes each to its Dependabot group,
 * and prints a per-group intervention-rate report as markdown.
 *
 * This is the standing instrument behind issue #885: it turns "which groups are
 * worth keeping?" into a measured question. A group whose ungrouped members
 * start needing fixes has earned a group; a group that never needs one is a
 * candidate to drop.
 *
 * Usage:
 *   node scripts/dependabot-audit.mjs [--repo owner/name] [--out report.md]
 *
 * Repo resolution: --repo → GH_REPO → GITHUB_REPOSITORY → `gh repo view`.
 * Requires the `gh` CLI, authenticated (GITHUB_TOKEN in CI).
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

import { buildReport } from "./dependabot-audit-classify.mjs";
import { renderMarkdown } from "./dependabot-audit-report.mjs";

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function resolveRepo(argRepo) {
  const repo = argRepo || process.env.GH_REPO || process.env.GITHUB_REPOSITORY;
  if (repo) return repo;
  return JSON.parse(gh(["repo", "view", "--json", "nameWithOwner"]))
    .nameWithOwner;
}

function parseArgs(argv) {
  const args = { repo: undefined, out: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") args.repo = argv[(i += 1)];
    else if (arg.startsWith("--repo=")) args.repo = arg.slice("--repo=".length);
    else if (arg === "--out") args.out = argv[(i += 1)];
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
  }
  return args;
}

function fetchPrs(repo, extraFields) {
  const fields = ["number", "title", "state", ...extraFields].join(",");
  return (author) => {
    const result = JSON.parse(
      gh([
        "pr",
        "list",
        "--repo",
        repo,
        "--author",
        author,
        "--state",
        "all",
        "--limit",
        "1000",
        "--json",
        fields,
      ]),
    );
    if (result.length === 1000) {
      throw new Error(
        `PR list for author "${author}" hit the 1,000-result cap — history is truncated. ` +
          "Paginate via gh api --paginate to cover all PRs.",
      );
    }
    return result;
  };
}

// Attach each PR's branch commits. Fetched per-PR (a single `gh pr list --json
// commits` over the whole set blows GitHub's GraphQL node ceiling, because the
// commits×authors connections multiply per PR). Only MERGED / OPEN PRs are
// worth fetching: an on-branch fix on a Dependabot-auto-closed churn PR never
// landed, so it can't be a `needed-fix`. Failures throw so the audit does not
// silently misclassify PRs whose on-branch fixes become invisible.
function attachCommits(repo, prs) {
  for (const pr of prs) {
    if (pr.state !== "MERGED" && pr.state !== "OPEN") {
      pr.commits = [];
      continue;
    }
    pr.commits = JSON.parse(
      gh([
        "pr",
        "view",
        String(pr.number),
        "--repo",
        repo,
        "--json",
        "commits",
      ]),
    ).commits;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = resolveRepo(args.repo);
  const dependabotPrs = fetchPrs(repo, ["statusCheckRollup"])("app/dependabot");
  attachCommits(repo, dependabotPrs);

  const allPrs = JSON.parse(
    gh([
      "pr",
      "list",
      "--repo",
      repo,
      "--state",
      "all",
      "--limit",
      "1000",
      "--json",
      "number,title,state,body,author",
    ]),
  );
  if (allPrs.length === 1000) {
    throw new Error(
      "All-PR list hit the 1,000-result cap — fix references may be incomplete. " +
        "Paginate via gh api --paginate to cover all PRs.",
    );
  }
  // Exclude Dependabot's own PRs; only human/bot fix PRs are fix references.
  const otherPrs = allPrs.filter(
    (pr) => pr.author?.login !== "dependabot[bot]",
  );

  const report = buildReport(dependabotPrs, otherPrs);
  const markdown = renderMarkdown(report, repo);
  process.stdout.write(`${markdown}\n`);
  if (args.out) writeFileSync(args.out, `${markdown}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
