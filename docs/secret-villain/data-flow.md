# Secret Villain — Data Flow

## Overview

Secret Villain uses the shared game infrastructure for role assignment and team visibility. Like Avalon, there is no night phase — the app's role is to distribute identities and enforce information asymmetry between Bad players and the Special Bad.

## PlayerGameState Fields

| Field                    | Narrator        | Players                                            |
| ------------------------ | --------------- | -------------------------------------------------- |
| `status`                 | ✓               | ✓                                                  |
| `gameMode`               | ✓               | ✓                                                  |
| `players`                | ✓               | ✓                                                  |
| `gameOwner`              | ✓               | ✓                                                  |
| `myPlayerId`             | — (undefined)   | ✓                                                  |
| `myRole`                 | — (undefined)   | ✓ own role                                         |
| `visibleRoleAssignments` | All assignments | Bad teammates only (Good and Special Bad see none) |
| `rolesInPlay`            | ✓               | ✓                                                  |

Night-phase fields (`nightActions`, `myNightTarget`, `teamVotes`, `nightStatus`, etc.) are never populated for Secret Villain.

## Data Flow

### Lobby → Game Start

1. Players join the lobby; Narrator starts the game via the API.
2. `GameInitializationService` assigns roles and writes per-player `PlayerGameState` to Firebase.
3. Each client receives its state via Firebase `onValue` and displays the player's role and any visible teammates.

### During Play

The app has no further involvement — gameplay happens outside the app. No actions or state mutations are defined for Secret Villain.

## Role Visibility Details

`visibleRoleAssignments` reflects each role's `canSeeTeam` configuration:

- **Bad players** see all other Bad players (including the Special Bad) — they know who's on their side and who the special role is.
- **Special Bad player** sees nobody — they must identify their teammates through play.
- **Good players** see nobody.
- **Narrator** sees all role assignments.

This deliberate asymmetry is the core mechanic: Bad players can coordinate, but the Special Bad cannot.
