# Secret Villain — Data Flow

## Overview

Secret Villain is a fully app-mediated game with no narrator. All gameplay flows through game actions — election, policy, and special action phases are driven by players interacting with the UI.

Game state lives in Firebase Realtime Database. `getPlayerGameState` (`src/lib/game-state.ts`) pre-computes per-player `PlayerGameState` on each action, and Firebase pushes updates to clients in real time via `onValue`.

## PlayerGameState Fields

### Always Present (base)

| Field                    | Players                                            |
| ------------------------ | -------------------------------------------------- |
| `status`                 | ✓                                                  |
| `gameMode`               | ✓                                                  |
| `players`                | ✓                                                  |
| `myPlayerId`             | ✓                                                  |
| `myRole`                 | ✓ own role                                         |
| `visibleRoleAssignments` | Bad teammates only (Good and Special Bad see none) |
| `rolesInPlay`            | ✓                                                  |
| `timerConfig`            | ✓                                                  |
| `amDead`                 | ✓ (if eliminated)                                  |
| `deadPlayerIds`          | ✓ (if any eliminated)                              |

### Secret Villain–Specific Fields

| Field                               | Phase              | Visibility      | Description                                        |
| ----------------------------------- | ------------------ | --------------- | -------------------------------------------------- |
| `svPhase`                           | All                | All players     | Current phase type, presidentId, chancellorId, etc |
| `svBoard`                           | All                | All players     | Good/Bad cards played, failed election count       |
| `vetoUnlocked`                      | All (4+ bad cards) | All players     | Whether veto power is available                    |
| `eligibleChancellorIds`             | Nomination         | President only  | Player IDs eligible for chancellor selection       |
| `myElectionVote`                    | Election vote      | Own vote only   | The player's cast vote (aye/no)                    |
| `electionVotes`                     | After tally        | All players     | All votes (after all have voted)                   |
| `electionPassed`                    | After tally        | All players     | Whether the election passed                        |
| `policyCards.drawnCards`            | Policy president   | President only  | The 3 drawn cards                                  |
| `policyCards.remainingCards`        | Policy chancellor  | Chancellor only | The 2 cards passed from president                  |
| `policyCards.peekedCards`           | Policy peek        | President only  | Top 3 deck cards (after peek action)               |
| `vetoProposal`                      | Policy chancellor  | President only  | Veto proposed/response state                       |
| `svInvestigationResult`             | Investigate        | President only  | Target's team (after consent)                      |
| `svInvestigationWaitingForPlayerId` | Investigate        | President only  | Target selected, awaiting consent                  |
| `svInvestigationConsent`            | Investigate        | Target only     | Prompt to reveal loyalty                           |

## Game Phase Flow

```
Starting (15s countdown)
  → advance-to-playing (any player, auto on timer)

Election Nomination
  → nominate-chancellor (president selects)

Election Vote
  → cast-election-vote (all players, simultaneous)
  → [auto-tally when all voted]
  → advance-from-election (any player, after seeing results)

  If passed:
    Policy President
      → president-discard (president discards 1 of 3)

    Policy Chancellor
      → chancellor-play (chancellor plays 1 of 2)
      → [optional] propose-veto → respond-veto (accept/reject)

    If bad card triggers special action:
      Special Action (varies by type)
        → select-investigation-target / consent-investigation / resolve-investigation
        → call-special-election
        → shoot-player
        → policy-peek / resolve-policy-peek

  If failed:
    → increment failedElectionCount
    → if 3 consecutive failures: auto-play top deck card
    → advance to next president
```

## Election Tally vs Advance

When the last vote is cast, `tallyElection()` is called to set `passed` on the vote phase — but the phase does NOT transition. This gives all players a window to see the vote breakdown (who voted aye/no) before any player triggers `advanceFromElection` to proceed.

## Board Power Configuration

The board preset determines which presidential power is triggered when each Bad card is played. Three standard presets exist (Small, Medium, Large) keyed to player count. A **Custom** preset allows the lobby owner to configure powers for Bad cards #1–#3; cards #4 and #5 are always locked to Shoot.

**Config flow:** `SecretVillainModeConfig.boardPreset` + optional `customPowerTable` → passed via `buildInitialTurnState` options → resolved into a full 5-slot `powerTable` stored on `SecretVillainTurnState` → read at runtime by `getSpecialAction(badCardsPlayed, ts.powerTable)`.

## Special Action Flow

Special actions are triggered when a Bad policy card is played and the board position maps to a presidential power (per the board preset or custom power table).

| Action Type      | President Flow                                       | Target/Other Flow                        |
| ---------------- | ---------------------------------------------------- | ---------------------------------------- |
| Investigate Team | Select target → wait for consent → see result → Done | Target: consent button. Others: waiting. |
| Special Election | Select player → Appoint                              | Waiting for president.                   |
| Shoot            | Select player → Execute                              | Waiting for president.                   |
| Policy Peek      | Press "Peek" → see 3 cards → Done                    | Waiting for president.                   |

## Role Visibility

`visibleRoleAssignments` is built from each role's `awareOf` configuration:

- **Bad players** see all other Bad team members with exact roles revealed (`awareOf: { teams: [Bad], revealRole: true }`). They know who is Bad and who is Special Bad.
- **Special Bad player** sees nobody — must identify teammates through gameplay.
- **Good players** see nobody.

## Win Conditions

- **Good wins**: 5 Good policy cards played, or Special Bad eliminated via Shoot.
- **Bad wins**: 6 Bad policy cards played, or Special Bad elected Chancellor after 3+ Bad cards played.
- **Chaos (auto-play)**: 3 consecutive failed elections → top deck card played automatically, previous administration cleared.
