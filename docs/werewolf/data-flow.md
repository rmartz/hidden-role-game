# Werewolf — Data Flow

## Overview

Game state lives in Firebase Realtime Database and is pre-computed per player by `GameSerializationService`. Each player receives only the information appropriate for their role and the current phase.

## Database Layout

```
/games/{gameId}/public            — game metadata
/games/{gameId}/playerState/{sessionId}   — pre-computed PlayerGameState per player
/games/{gameId}/sessionIndex/{sessionId} — maps sessionId → playerId
```

The Narrator's session is stored separately and receives a different (fuller) `PlayerGameState` than regular players.

## PlayerGameState Fields

### Always Present

| Field                    | Narrator        | Players                         |
| ------------------------ | --------------- | ------------------------------- |
| `status`                 | ✓               | ✓                               |
| `gameMode`               | ✓               | ✓                               |
| `players`                | ✓               | ✓                               |
| `gameOwner`              | ✓               | ✓                               |
| `myPlayerId`             | — (undefined)   | ✓                               |
| `myRole`                 | — (undefined)   | ✓ own role                      |
| `visibleRoleAssignments` | All assignments | Teammates + dead players' roles |
| `rolesInPlay`            | ✓               | ✓                               |
| `deadPlayerIds`          | ✓               | ✓                               |
| `timerConfig`            | ✓ (if set)      | ✓ (if set)                      |

### Narrator-Only (Nighttime)

| Field          | Description                                         |
| -------------- | --------------------------------------------------- |
| `nightActions` | Full record of all night actions keyed by phase key |

### Player Fields — Nighttime (own turn only)

These fields are only populated when the active phase matches the player's role.

| Field                    | Roles                     | Description                                                                                    |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `myNightTarget`          | All night-waking roles    | The player's currently selected target player ID                                               |
| `myNightTargetConfirmed` | All night-waking roles    | Whether the selection is locked in                                                             |
| `teamVotes`              | Werewolf (group phase)    | `{ playerName, targetPlayerId }[]` — all alive team members' current votes                     |
| `suggestedTargetId`      | Werewolf (group phase)    | The plurality vote target (undefined if tie)                                                   |
| `allAgreed`              | Werewolf (group phase)    | `true` when all alive members have voted for the same target                                   |
| `investigationResult`    | Seer                      | `{ targetPlayerId, isWerewolfTeam }` — only after Narrator calls `reveal-investigation-result` |
| `witchAbilityUsed`       | Witch                     | `false` when ability is available; `true` once used                                            |
| `nightStatus`            | Witch (ability available) | `{ targetPlayerId, effect: "attacked" }[]` — players currently under attack this night         |

### Player Fields — Daytime (day start)

| Field               | Description                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `nightStatus`       | `{ targetPlayerId, effect: "killed" \| "silenced" }[]` — outcome of the previous night                        |
| `myLastNightAction` | `{ targetPlayerId, category }` — the player's own action from the previous night; confirms input was recorded |

## Game Phase State Machine

```mermaid
stateDiagram-v2
    [*] --> Daytime : game created
    Daytime --> Nighttime : start-night (Narrator)
    Nighttime --> Daytime : start-day (Narrator)

    state Nighttime {
        [*] --> Phase
        Phase --> Phase : set-night-phase (advance)
        Phase --> [*] : all phases complete
    }
```

## Data Flow Per Phase

### Lobby → Game Start

1. Narrator calls the lobby API to start the game.
2. `GameInitializationService` creates the game record and assigns roles.
3. Firebase writes initial `PlayerGameState` for each session.
4. Clients receive real-time updates via Firebase `onValue`.

### Night Phase

```mermaid
sequenceDiagram
    participant N as Narrator
    participant API as Next.js API
    participant DB as Firebase RTDB
    participant P as Player

    N->>API: advance (set-night-phase)
    API->>DB: write PlayerGameState per session
    DB-->>P: onValue push (myNightTarget, teamVotes…)

    P->>API: action (set-night-target)
    API->>DB: write updated PlayerGameState
    DB-->>N: onValue push (nightActions updated)

    P->>API: action (confirm-night-target)
    API->>DB: write confirmed state
    DB-->>N: onValue push

    N->>API: advance (start-day)
    API->>DB: write resolved PlayerGameState
    DB-->>P: onValue push (nightStatus, myLastNightAction)
```

```
Narrator advances phase (set-night-phase)
  → nightPhaseOrder[currentPhaseIndex] becomes the active phase key
  → Players with that role/wakesWith receive myNightTarget, teamVotes, etc.

Player sets target (set-night-target)
  → nightActions[phaseKey] updated in Firebase
  → All players in that phase receive updated teamVotes/suggestedTargetId

Player confirms (confirm-night-target)
  → nightActions[phaseKey].confirmed = true
  → myNightTargetConfirmed becomes true for the player

Narrator reveals investigation (reveal-investigation-result)
  → nightActions[phaseKey].resultRevealed = true
  → Seer's PlayerGameState gains investigationResult

Narrator starts day (start-day)
  → resolveNightActions() runs
  → Killed players added to deadPlayerIds
  → nightResolution stored in daytime phase
  → PlayerGameState rebuilt: nightStatus and myLastNightAction populated
```

### Day Phase

```
Players discuss and vote (outside the app)
Narrator marks players dead (mark-player-dead / mark-player-alive)
  → deadPlayerIds updated
  → Dead player's role revealed in visibleRoleAssignments for all

Narrator starts next night (start-night)
  → New turn begins; nightPhaseOrder rebuilt
  → Night fields (myNightTarget, teamVotes, etc.) cleared for all players
```

## Role Visibility Details

`visibleRoleAssignments` is built per-player from:

1. **Own teammates** — players whose role matches a `canSeeTeam` entry.
   - Werewolves see all Team Bad players.
   - Masons see all other Masons.
2. **Dead players** — roles of all dead players are revealed to everyone.
3. **Narrator** — sees all role assignments always.

Players never see their own role in `visibleRoleAssignments` (their role is in `myRole`).

## Night Actions Key Format

Night actions are stored in a `Record<phaseKey, AnyNightAction>`:

| Role type                           | Phase key                               | Action type       |
| ----------------------------------- | --------------------------------------- | ----------------- |
| Solo (Seer, Bodyguard, Witch, etc.) | Role ID — e.g., `"werewolf-seer"`       | `NightAction`     |
| Group (Werewolves)                  | Primary role ID — `"werewolf-werewolf"` | `TeamNightAction` |

Secondary roles with `wakesWith` (e.g., Wolf Cub) participate in the primary role's `TeamNightAction` but do not have their own key.

## Witch Special Case

The Witch sees `nightStatus` with `effect: "attacked"` entries **only** when her ability has not yet been used (`witchAbilityUsed: false`). This shows the current night's attacks from all other roles (Werewolves, Chupacabra), computed from `nightActions` before the Witch acts. Once the Witch uses her ability or if `witchAbilityUsed: true`, `nightStatus` is omitted from her state.

## Wolf Cub Special Case

When the Wolf Cub is killed (via `start-day` resolution or `mark-player-dead`), `wolfCubDied: true` is set on `WerewolfTurnState`. The next time `start-night` is called, an extra Werewolf group phase is appended to `nightPhaseOrder`, giving Werewolves two attack phases that night.
