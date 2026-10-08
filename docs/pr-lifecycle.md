---
type: Reference
title: pr-lifecycle (shared rmartz/pr-lifecycle-action)
description: The shared @rmartz/pr-lifecycle reconciler, run via rmartz/pr-lifecycle-action, which keeps each PR's lifecycle labels in step with its current facts; labels only for now (no auto-merge arming).
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

**Labels only.** This repo is in the labels-only pilot phase of the fleet rollout
([rmartz/pr-lifecycle#75](https://github.com/rmartz/pr-lifecycle/issues/75)):
`arm-auto-merge` is off and no real-actor token is passed, so the workflow never
arms, merges, disarms, or updates a branch. `bot-automerge.yml` still arms
eligible bot PRs. Arming, and retiring bot-automerge, come in later PRs.

**Triggers.** It runs on `pull_request_target`, so Dependabot PRs get a token that
can write labels. It reads the PR over the API and never checks out PR code.
`workflow_run` lists the Actions workflows behind this repo's required checks
(`CI`, `Storybook Tests`, `Repo Hygiene`). Keep that list in step if a required
check moves to a new workflow.

The reconciler's behaviour is documented in
[pr-lifecycle's docs](https://github.com/rmartz/pr-lifecycle/blob/main/docs/overview.md),
and the caller in the action's
[consumer guide](https://github.com/rmartz/pr-lifecycle-action/blob/main/docs/consuming.md).
