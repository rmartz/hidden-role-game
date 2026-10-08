---
okf_version: "0.2"
---

# Documentation Index

Curated reference knowledge for this codebase. Each **content** page carries [Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) YAML frontmatter so agents can retrieve and traverse it before a task. This is the OKF root `index.md` directory listing — a reserved index file that, per the spec, carries no frontmatter beyond `okf_version`; every page below is reachable from here.

## Page types

| Type        | Meaning                                                     |
| ----------- | ----------------------------------------------------------- |
| `Guide`     | Task-oriented walkthrough (onboarding, how-to).             |
| `Reference` | Structural reference not tied to a single game mode.        |
| `Roles`     | A game mode's roles, teams, and visibility rules.           |
| `Actions`   | A game mode's actions, payloads, and validation.            |
| `DataFlow`  | A game mode's `PlayerGameState` fields and Firebase schema. |

## General

- [Getting Started](GETTING_STARTED.md) — onboarding guide for new developers.
- [Project Structure](PROJECT_STRUCTURE.md) — directory-by-directory breakdown of the codebase.
- [Game Mode Documentation](GAME_MODES.md) — overview of every supported game mode.
- [Open Knowledge Format (OKF)](open-knowledge-format.md) — the frontmatter + `index.md` convention these docs follow, and the authoritative spec.

## Tooling

- [Dependabot grouping audit](dependabot-audit.md) — how `scripts/dependabot-audit.mjs` measures per-group intervention rates to keep the Dependabot grouping strategy evidence-based.
- [pr-policy](pr-policy.md) — how the `pr-policy` caller runs the shared PR content checks and posts the `pr-policy` verdict; this app keeps the UAT gate (a PR waits for `no UAT needed` or `UAT passed`).
- [pr-lifecycle](pr-lifecycle.md) — how the `pr-lifecycle` caller keeps each PR's lifecycle labels in step with its current facts; labels only for now, no auto-merge arming.
- [Storybook CI](storybook-ci.md) — how the Storybook test and screenshot checks delegate to the shared `rmartz/storybook-ci` reusable workflows.

## Design

- [Design notes](design/index.md) — design notes and decision records, such as the no-device player / omniscient-narrator requirement.

## Game modes

- [Werewolf](werewolf/index.md)
- [Secret Villain](secret-villain/index.md)
- [Avalon](avalon/index.md)
- [Clocktower](clocktower/index.md)

## Adding a page

New content pages under `docs/` must begin with OKF frontmatter — at minimum the required `type` key, plus `title` and `description`. Per-mode pages also set `gameMode` and a `resource` path to the documented source. After adding a content page, link it from the nearest `index.md` — the root index for a top-level page, or its subdirectory's `index.md` (e.g. `werewolf/index.md`) for a page in a subdirectory — so every page stays reachable. Index files (`index.md`) are reserved filenames and must not carry frontmatter (the root `docs/index.md` may optionally carry `okf_version`). See [Open Knowledge Format (OKF)](open-knowledge-format.md) for the full convention and the authoritative spec.
