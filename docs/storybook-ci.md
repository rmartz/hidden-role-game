---
type: Reference
title: Storybook CI (shared rmartz/storybook-ci)
description: How this repo's Storybook test and screenshot CI is delegated to the shared rmartz/storybook-ci reusable workflows — what the two caller workflows configure, what the shared workflows own, and the operational facts (required-check context, PAT, resolver gap) a maintainer needs.
resource: ../.github/workflows/storybook-tests.yml
---

# Storybook CI

This repo's Storybook CI is two thin caller workflows that delegate to the shared
[`rmartz/storybook-ci`](https://github.com/rmartz/storybook-ci) reusable
workflows. The operational reasoning — Chromium provisioning and binary caching,
change gating, fail-vs-cancel deadline budgeting, per-PR concurrency, fork
exclusion, advisory isolation — lives upstream, once, so a fix there propagates
here through a Dependabot pin bump rather than an edit.

## The two callers

| File                                          | Role     | What it configures                                             |
| --------------------------------------------- | -------- | -------------------------------------------------------------- |
| `.github/workflows/storybook-tests.yml`       | Gating   | Nothing — every shared default already matches this repo.      |
| `.github/workflows/storybook-screenshots.yml` | Advisory | `on.paths` (`src/**`, `.storybook/**`) and `secrets: inherit`. |

### Why the tests caller needs no inputs

The shared defaults are `pnpm exec vitest run --project storybook` and
`pnpm build-storybook`. This repo has a `storybook` project in
[`vitest.config.mts`](../vitest.config.mts) and a `build-storybook` script in
`package.json`, so both resolve as-is.

It produces two check contexts:

- **`storybook-tests / Storybook Tests`** — the Vitest browser-mode story suite in
  real Chromium.
- **`storybook-tests / Storybook Build`** — the production `build-storybook`
  compile. A distinct render surface: the story suite renders through the
  addon-vitest transform and never invokes `storybook build`.

### Why the screenshots caller has `on.paths` and the tests caller does not

A reusable workflow's check context is `<caller job> / <called job>`, and
`storybook-tests / Storybook Tests` is a **required check** on the default-branch
ruleset. A required check that never runs because its `on.paths` did not match
hangs the PR forever, whereas a job _skipped_ by an `if:` counts as passing. So
gating for the tests caller is the shared workflow's `detect-changes` job plus
per-job `if:` — **never** add `paths` to `storybook-tests.yml`.

The screenshots caller is advisory and is never a required check, so `on.paths` is
safe there and keeps it off unrelated PRs.

## Screenshot posting needs a classic PAT

The GitHub user-attachments upload endpoint (`gh --attach`) rejects the Actions
`GITHUB_TOKEN`, so the shared workflow authenticates `gh` with a classic PAT
(`repo` scope) named **`STORYBOOK_SCREENSHOT_PAT`**, forwarded by
`secrets: inherit`. The whole job is skipped on fork PRs so the PAT never reaches
fork-authored code.

When the secret is missing or invalid, a preflight step posts one non-blocking
advisory PR comment and skips the build and capture — a misconfigured PAT
announces itself instead of looking like success.

## Which stories get screenshotted

The shared default resolver is `colocation`: a PR's directly changed story files,
plus the stories co-located in the same directory as any changed component file. A
change under `.storybook/**` cannot be localized to specific stories and forces a
full capture.

That is deliberately broader than this repo's previous bespoke behavior, which
captured only directly changed story files and therefore regenerated nothing when
a component was edited without touching its story. The residual gap of
`colocation` is a changed component whose story lives in a different directory, or
a shared presentational component consumed by stories elsewhere; see the upstream
[change-filtering reference](https://github.com/rmartz/storybook-ci/blob/main/docs/change-filtering.md)
for the other resolver modes and their gaps.

## Keeping the pin current

Each caller pins the shared workflow by full commit SHA with a `# vX.Y.Z` comment.
Dependabot's `github-actions` ecosystem reads that comment to map the SHA to a
release and bumps the SHA and comment together — so the comment is required, not
decorative.

## What this replaced

- `.github/scripts/storybook-screenshots.mjs` — the bespoke Playwright capture and
  gallery-comment script.
- `.github/workflows/storybook-screenshots-cleanup.yml` and the per-PR orphan image
  branch `gh-screenshots-pr-<N>`. `gh --attach` hosts the images natively, so
  there is no branch to clean up and no `contents: write` grant.
- The `storybook-tests` and `storybook-build` jobs in `ci-actions.yml`, and the
  `playwright` input on the local `.github/actions/setup` composite (they were its
  only consumers).
