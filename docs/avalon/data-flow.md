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

The app manages the full quest loop. Players and the narrator use the seven Avalon actions to drive state mutations:

1. Quest Leader calls `propose-team` → phase transitions from `TeamProposal` to `TeamVote`.
2. All players call `cast-team-vote` → votes accumulate.
3. Narrator calls `resolve-team-vote` → `passed` is set.
4. Narrator calls `advance-from-team-vote`:
   - Approved: transitions to `Quest` phase.
   - Rejected: rotates leader and returns to `TeamProposal`, or ends the game with Evil win after 5 consecutive rejections.
5. Team members call `play-quest-card` → cards accumulate.
6. Narrator calls `resolve-quest` → `failCount` and `succeeded` are set.
7. Narrator calls `advance-from-quest`:
   - 3 Good quest wins + Assassin role: transitions to `Assassination` phase.
   - 3 Good quest wins, no Assassin: Good wins.
   - 3 Evil quest wins: Evil wins.
   - Otherwise: increments quest number, rotates leader, returns to `TeamProposal`.

See `docs/avalon/actions.md` for full action reference.

## Role Visibility Details

`visibleRoleAssignments` contains only the players a given role can identify based on `canSeeTeam`:

- Bad players and the Special Good player see the full list of Evil team members.
- Plain Good players have an empty `visibleRoleAssignments`.
- The Narrator sees all role assignments.
