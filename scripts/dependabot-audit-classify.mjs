// Pure classification logic for the Dependabot grouping-outcome audit.
// Imported by scripts/dependabot-audit.mjs (main entry) and
// scripts/dependabot-audit-report.mjs (rendering). Exported for testing.

// Group names Dependabot can name in a PR title. A SUPERSET of the groups
// currently in .github/dependabot.yml: it also keeps names since removed
// (storybook, eslint, tailwind — pruned in #885) so historical PRs that used
// them still attribute correctly. Add a name here, never remove one.
const KNOWN_GROUPS = [
  "dev-dependencies",
  "eslint",
  "lodash",
  "prettier",
  "production-dependencies",
  "react",
  "storybook",
  "tailwind",
  "typescript",
  "vite",
];

export const CLEAN = "clean";
export const NEEDED_FIX = "needed-fix";
export const STUCK = "stuck";
export const PENDING = "pending";
export const CHURN = "churn";

// Which Dependabot group a PR title belongs to. "bump the <x> group ...",
// "... in the <x> group ..." → <x>; an "owner/repo" bump (no leading @) is a
// GitHub Actions ecosystem bump; anything else is an ungrouped single package.
export function groupOf(title) {
  const named = title.match(/\bthe ([a-z][a-z-]*) group\b/i);
  if (named && KNOWN_GROUPS.includes(named[1].toLowerCase())) {
    return named[1].toLowerCase();
  }
  if (/\bbump (?!@)[\w.-]+\/[\w.-]+/i.test(title)) return "github-actions";
  return "individual";
}

// Map each Dependabot PR number to the merged fix/unblock PRs that target it.
// Two precise signals, matching the repo's conventions, keep incidental
// mentions out (a churn-cluster narrative citing bare `#180`, a cross-repo
// `owner/repo#63`) and only count fixes that actually landed:
//   (a) the explicit "Dependabot #N" / "Dependabot PR #N" token, and
//   (b) a lockfile-corruption repair (title says lockfile/corrupt) naming the
//       culprit merge by a bare `#N` that is not part of an `owner/repo#N` slug.
// Only MERGED PRs count, so a closed investigation that concluded "no code fix
// needed" (e.g. an infra failure) does not flag its Dependabot PR.
export function fixReferences(otherPrs, dependabotNums) {
  const refs = new Map();
  const add = (num, fixPr) => {
    if (!dependabotNums.has(num)) return;
    if (!refs.has(num)) refs.set(num, []);
    if (!refs.get(num).includes(fixPr)) refs.get(num).push(fixPr);
  };
  for (const pr of otherPrs) {
    if (pr.state !== "MERGED") continue;
    const text = `${pr.title}\n${pr.body || ""}`;
    for (const m of text.matchAll(/\bdependabot(?: pr)? #(\d+)/gi)) {
      add(Number(m[1]), pr.number);
    }
    if (/\b(lockfile|corrupt)/i.test(pr.title)) {
      for (const m of text.matchAll(/(?<![\w/-])#(\d+)/g))
        add(Number(m[1]), pr.number);
    }
  }
  return refs;
}

export function isRed(rollup) {
  return (rollup || []).some(
    (c) =>
      c.conclusion === "FAILURE" ||
      c.state === "FAILURE" ||
      c.state === "ERROR",
  );
}

// Fixes committed directly onto the Dependabot branch (rather than in a separate
// fix PR). A human, non-merge commit on a Dependabot branch is a manual unblock
// — e.g. #785's "Reformat with prettier 3.9.0" or #320's "fix: remove redundant
// type argument flagged by typescript-eslint 8.58". Excluded: the bot's own bump
// commit, github-actions lockfile-regen commits, and "Merge branch 'main'"
// branch-updates (keeping a PR current is not a fix). Returns the headlines.
export function onBranchFixCommits(pr) {
  return (pr.commits || [])
    .filter((c) => {
      const author = c.authors?.[0]?.login || c.authors?.[0]?.name || "";
      if (/dependabot/i.test(author)) return false;
      if (/github-actions/i.test(author)) return false;
      return !/^Merge /.test(c.messageHeadline || "");
    })
    .map((c) => c.messageHeadline);
}

export function outcomeOf(pr, hasFix) {
  if (hasFix) return NEEDED_FIX;
  if (pr.state === "MERGED") return CLEAN;
  if (pr.state === "OPEN") return isRed(pr.statusCheckRollup) ? STUCK : PENDING;
  return CHURN; // CLOSED and never merged, no landed fix → Dependabot supersede-churn
}

// Pure classification: given the Dependabot PRs, the other PRs, and the repo
// slug, produce { rows, groups } ready for rendering. Exported for testing.
export function buildReport(dependabotPrs, otherPrs) {
  const nums = new Set(dependabotPrs.map((p) => p.number));
  const fixRefs = fixReferences(otherPrs, nums);
  // Fix PRs that repaired lockfile corruption — a merge-mechanics failure that
  // is independent of which group happened to merge, flagged so its rows are
  // not misread as a grouping signal.
  const lockfileFixers = new Set(
    otherPrs
      .filter(
        (pr) => pr.state === "MERGED" && /\b(lockfile|corrupt)/i.test(pr.title),
      )
      .map((pr) => pr.number),
  );
  const rows = dependabotPrs.map((pr) => {
    const fixes = fixRefs.get(pr.number) || [];
    const onBranch = onBranchFixCommits(pr);
    const hasFix = fixes.length > 0 || onBranch.length > 0;
    // Mechanics = the intervention is purely lockfile/merge-mechanics, not a
    // grouping signal: every fix PR was a lockfile repair AND every on-branch
    // fix headline is lockfile-related. A single genuine code fix flips it off.
    const fixPrMechanics =
      fixes.length === 0 || fixes.every((f) => lockfileFixers.has(f));
    const onBranchMechanics =
      onBranch.length === 0 ||
      onBranch.every((h) => /lockfile|corrupt|regenerate/i.test(h));
    return {
      number: pr.number,
      title: pr.title,
      group: groupOf(pr.title),
      outcome: outcomeOf(pr, hasFix),
      fixes,
      onBranch,
      mechanics: hasFix && fixPrMechanics && onBranchMechanics,
    };
  });

  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.group)) {
      groups.set(row.group, {
        clean: 0,
        [NEEDED_FIX]: 0,
        stuck: 0,
        pending: 0,
        churn: 0,
      });
    }
    const bucket = groups.get(row.group);
    bucket[row.outcome === CLEAN ? "clean" : row.outcome] += 1;
  }
  return { rows, groups };
}
