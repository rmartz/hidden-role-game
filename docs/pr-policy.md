---
type: Reference
title: pr-policy (shared rmartz/pr-policy-action)
description: How this repo runs the shared @rmartz/pr-policy PR content checks via rmartz/pr-policy-action on pull_request_target — the pr-policy verdict it posts, why this Next.js app keeps the UAT gate, and why the trigger is pull_request_target.
resource: ../.github/workflows/pr-policy.yml
---

# pr-policy

[`.github/workflows/pr-policy.yml`](../.github/workflows/pr-policy.yml) runs
[`rmartz/pr-policy-action`](https://github.com/rmartz/pr-policy-action), which
wraps the [`@rmartz/pr-policy`](https://github.com/rmartz/pr-policy) library. It
reads the PR's title, labels, and changed files through the API, then posts the
**`pr-policy`** verdict and reconciles the labels it owns (`CI approval needed`).
This repo **consumes** the action; it does not re-implement any policy.

## What it checks

The checks, and what makes each one red or pending, are listed in
[pr-policy's check docs](https://github.com/rmartz/pr-policy/blob/main/docs/checks/index.md).
The version in force is the one bundled by the pinned action. In short: red
means the author has something to fix (a bad title, for example), and pending
means a person has to act.

**This repo keeps the UAT gate**, because it is a Next.js app with something to
user-test. A code PR stays pending until it carries `no UAT needed` (the review
agent's call) or a person's `UAT passed` (the legacy `tested` label also
counts). Test-only (including Storybook stories), docs, CI, dependency-only,
metadata-only, and `refactor`-titled PRs are exempt automatically. The caller
must not set `skip-uat`.

The verdict is posted twice: as the `pr-policy` check-run and as a `pr-policy`
commit status. The status keeps the merge gate working when GitHub supersedes
the check suite the check-run landed in. The action also posts one
informational status per check (`pr-policy / title`, `pr-policy / uat`, …). All
of these need the workflow's `statuses: write`.

## Why `pull_request_target`

Under `pull_request`, fork and Dependabot PRs get a read-only token and could not
write the check-run, status, or label. `pull_request_target` runs with a
base-context write token, which is safe only because the workflow never checks
out or runs PR code. The job is named `pr-policy (evaluate)` so it does not
collide with the `pr-policy` check-run and status.
