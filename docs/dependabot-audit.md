---
type: Reference
title: Dependabot grouping audit
description: Reconstructs how every Dependabot PR turned out (clean / needed-fix / stuck / churn), attributes each to its Dependabot group, and prints a per-group intervention-rate report so the grouping strategy stays evidence-based.
---

# Dependabot grouping audit

Turns "which Dependabot groups are worth keeping?" into a measured question.

The grouping in [`.github/dependabot.yml`](../.github/dependabot.yml) is a set of
bets: that isolating certain packages (`prettier`, `typescript`) keeps their
breakages out of the shared batch, and that cross-realm and interlocked families
(`react`, `lodash`, `vite`) must bump atomically. [`scripts/dependabot-audit.mjs`](../scripts/dependabot-audit.mjs)
checks those bets against history — it reads every Dependabot PR the repository
has ever opened, classifies how each one ended, and reports the per-group rate at
which a bump needed a human fix.

A group whose ungrouped members start needing fixes has earned a group; a group
that never needs one is a candidate to drop. When the `storybook`, `eslint`, and
`tailwind` major-only family groups were removed as never-fired (issue #885),
this audit became the instrument that measures whether an ungrouped major of one
of them actually breaks — the evidence that would justify re-adding it.

## Usage

```bash
node scripts/dependabot-audit.mjs                 # report on the current repo
node scripts/dependabot-audit.mjs --repo owner/n  # report on another repo
node scripts/dependabot-audit.mjs --out report.md # also write the report to a file
```

The report is written to stdout as markdown. Repo resolution follows the fleet
convention: `--repo` → `GH_REPO` → `GITHUB_REPOSITORY` → `gh repo view`.

Requires the [`gh` CLI](https://cli.github.com/), authenticated. In CI the
`GITHUB_TOKEN` (exposed as `GH_TOKEN`) is sufficient.

## Classification

Each Dependabot PR is placed in exactly one bucket:

- **clean** — merged, with no fix referencing it.
- **needed-fix** — a **merged** fix/unblock PR targets it (by the explicit
  `Dependabot #N` token, or as the culprit of a lockfile-corruption repair), **or
  a human fix commit was pushed directly onto its branch** (a non-merge,
  non-bot commit — e.g. #785's `Reformat with prettier 3.9.0`, or #320's
  `fix: remove redundant type argument flagged by typescript-eslint 8.58`). Only
  landed fixes count, so a closed investigation that concluded "no code change
  needed" (e.g. an infra/billing failure) does not flag its Dependabot PR.
- **stuck** — still open with a failing check.
- **churn** — Dependabot auto-closed it (a routine recreate/supersede). Excluded
  from the intervention-rate denominator, as is a still-pending open PR.

Interventions whose only evidence is a lockfile-corruption repair are tagged
`merge-mechanics (group-independent)`: that failure mode is unrelated to which
group merged that week and should be read separately from the grouping signal.

The group is inferred from the PR title (`the <x> group`, an `owner/repo` bump →
`github-actions`, otherwise a single ungrouped package). The `churn` split is a
heuristic on close state, not a per-PR verification of the closer. On-branch
commits are fetched per-PR for merged/open PRs only (a single list query over the
whole set exceeds GitHub's GraphQL node ceiling).

## CI

The **Dependabot audit** workflow
([`.github/workflows/dependabot-audit.yml`](../.github/workflows/dependabot-audit.yml))
runs this monthly, writes the report to the job summary, and upserts a single
tracking issue (titled `Dependabot grouping audit`) so the per-group rates stay
watchable over time. It can also be run on demand via `workflow_dispatch`.
