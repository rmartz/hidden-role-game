# Avalon — Data Flow

## Overview

Avalon uses the shared game infrastructure for role assignment and team visibility, but has no night phase mechanics. The `PlayerGameState` contains only the core identity and visibility fields.

## PlayerGameState Fields

| Field                    | Narrator        | Players        |
| ------------------------ | --------------- | -------------- |
| `status`                 | ✓               | ✓              |
| `gameMode`               | ✓               | ✓              |
| `players`                | ✓               | ✓              |
| `gameOwner`              | ✓               | ✓              |
| `myPlayerId`             | — (undefined)   | ✓              |
| `myRole`                 | — (undefined)   | ✓ own role     |
| `visibleRoleAssignments` | All assignments | Teammates only |
| `rolesInPlay`            | ✓               | ✓              |

Night-phase fields (`nightActions`, `myNightTarget`, `teamVotes`, `nightStatus`, etc.) are never populated for Avalon.

## Data Flow

### Lobby → Game Start

1. Players join the lobby; Narrator starts the game via the API.
2. `createGame` (`src/server/game.ts`) orchestrates game creation: `buildGame` assigns roles and builds the `Game` object, `buildAllPlayerStates` computes per-player `PlayerGameState`, and `writeAllPlayerStates` persists them to Firebase.
3. Each client receives its state via Firebase `onValue` and displays the player's role and any visible teammates.

### During Play

The app has no further involvement — questing and voting happen outside the app. No actions or state mutations are defined for Avalon.

## Role Visibility Details

`visibleRoleAssignments` contains only the players a given role can identify based on `canSeeTeam`:

- Bad players and the Special Good player see the full list of Evil team members.
- Plain Good players have an empty `visibleRoleAssignments`.
- The Narrator sees all role assignments.
