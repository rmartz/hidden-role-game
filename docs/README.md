---
type: Index
title: Documentation Index
description: Directory listing of all docs/ reference pages, grouped by kind.
tags: [index, documentation]
---

# Documentation Index

Curated reference knowledge for this codebase. Each page carries [Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) YAML frontmatter so agents can retrieve and traverse it before a task. This page is the OKF `index.md`-style directory listing.

## Page types

| Type        | Meaning                                                     |
| ----------- | ----------------------------------------------------------- |
| `Index`     | This directory listing.                                     |
| `Guide`     | Task-oriented walkthrough (onboarding, how-to).             |
| `Reference` | Structural reference not tied to a single game mode.        |
| `Roles`     | A game mode's roles, teams, and visibility rules.           |
| `Actions`   | A game mode's actions, payloads, and validation.            |
| `DataFlow`  | A game mode's `PlayerGameState` fields and Firebase schema. |

## General

- [Getting Started](GETTING_STARTED.md) — onboarding guide for new developers.
- [Project Structure](PROJECT_STRUCTURE.md) — directory-by-directory breakdown of the codebase.
- [Game Mode Documentation](GAME_MODES.md) — overview of every supported game mode.

## Game modes

### Werewolf

- [Roles](werewolf/roles.md)
- [Actions](werewolf/actions.md)
- [Data Flow](werewolf/data-flow.md)

### Secret Villain

- [Roles](secret-villain/roles.md)
- [Actions](secret-villain/actions.md)
- [Data Flow](secret-villain/data-flow.md)

### Avalon

- [Roles](avalon/roles.md)
- [Actions](avalon/actions.md)
- [Data Flow](avalon/data-flow.md)

### Clocktower

- [Actions](clocktower/actions.md)

## Adding a page

New pages under `docs/` must begin with OKF frontmatter — at minimum the required `type` key, plus `title` and `description`. Per-mode pages also set `gameMode` and a `resource` path to the documented source. After adding a page, link it from the relevant section above so the index stays complete.
