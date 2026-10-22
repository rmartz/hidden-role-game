---
type: Reference
title: pr-lifecycle (shared rmartz/pr-lifecycle-action)
description: The shared @rmartz/pr-lifecycle reconciler, run via rmartz/pr-lifecycle-action, which keeps each PR's lifecycle labels in step with its current facts, and arms auto-merge when a PR reaches approved.
resource: .github/workflows/pr-lifecycle.yml
tags: [ci, github-actions, pr-lifecycle, labels]
---

# pr-lifecycle

[`.github/workflows/pr-lifecycle.yml`](../.github/workflows/pr-lifecycle.yml) runs
[`rmartz/pr-lifecycle-action`](https://github.com/rmartz/pr-lifecycle-action) on
every relevant PR event: opens, pushes, labels, reviews, review requests, and CI
completing. Each run recomputes the PR's lifecycle state from its current facts
and converges its labels: `approved`, `changes requested`, `blocked`,
`escalation needed`, `fix required`, `ci failing`, and `review requested`. A
`/review` verdict on the current head drives the state, and a push invalidates it,
so a label never describes a head that hasn't earned it.

**Arming.** When a PR reaches `approved`, including an eligible Dependabot PR,
the workflow arms GitHub-native auto-merge, which lands once the default-branch
ruleset's required checks pass, the `pr-policy` UAT gate included. This replaced
`bot-automerge.yml` ([rmartz/pr-lifecycle#75](https://github.com/rmartz/pr-lifecycle/issues/75)).
With `auto-update` it also brings an approved PR that merge-safety labels
`update required` current with update-branch, but never a Dependabot PR: a person
or Dependabot itself rebases those. The rmartz-pr-lifecycle App token is the real
actor for arming, merging, and updating, so the merge and the new head trigger
workflows as usual.

**UAT.** With `uat: "on"` it keeps exactly one of `no UAT needed`,
`UAT pending`, `UAT ready`, or `UAT passed` on each PR, and posts the
`pr-lifecycle/sign-off` commit status saying which human sign-off the head
needs. The pr-policy caller gates on that status, trusting it from
`rmartz-pr-lifecycle[bot]` (the `sign-off-status-creators` default).

**Triggers.** It runs on `pull_request_target`, so Dependabot PRs get a token that
can write labels. It reads the PR over the API and never checks out PR code.
`workflow_run` lists the Actions workflows behind this repo's required checks
(`CI`, `Storybook Tests`, `Repo Hygiene`, `pr-policy`). Keep that list in step if
a required check moves to a new workflow.

The reconciler's behaviour is documented in
[pr-lifecycle's docs](https://github.com/rmartz/pr-lifecycle/blob/main/docs/overview.md),
and the caller in the action's
[consumer guide](https://github.com/rmartz/pr-lifecycle-action/blob/main/docs/consuming.md).
