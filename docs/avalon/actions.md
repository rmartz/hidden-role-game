# Avalon — Actions

## Quest Loop Actions

| Action                | Who can call       | When valid                                     |
| --------------------- | ------------------ | ---------------------------------------------- |
| `proposeTeam`         | Quest Leader       | During `TeamProposal` phase                    |
| `castTeamVote`        | Any player         | During `TeamVote` phase (before tally)         |
| `resolveTeamVote`     | Any player         | During `TeamVote` phase (after all votes cast) |
| `advanceFromTeamVote` | Any player         | After `TeamVote` is tallied                    |
| `playQuestCard`       | Quest team members | During `Quest` phase (before tally)            |
| `resolveQuest`        | Any player         | During `Quest` phase (after all cards played)  |
| `advanceFromQuest`    | Any player         | After quest is tallied                         |

## Assassination Phase Actions

After Good wins 3 quests, the game enters the `Assassination` phase if the Assassin role is in play. If no Assassin (or no Merlin) is in the game, Good wins immediately.

| Action                      | Who can call    | When valid                                           |
| --------------------------- | --------------- | ---------------------------------------------------- |
| `selectAssassinationTarget` | Assassin player | During `Assassination` phase (before resolve)        |
| `resolveAssassination`      | Any player      | During `Assassination` phase (after target selected) |

### `selectAssassinationTarget`

Payload: `{ targetPlayerId: string }` — must be a valid player ID in the game.

The Assassin may change their selection before `resolveAssassination` is called.

### `resolveAssassination`

No payload required. Determines the outcome:

- **Target is Merlin** → `correct: true` on the phase, game ends with Evil winning (`winner: "Bad"`, `victoryConditionKey: "assassination"`).
- **Target is not Merlin** → `correct: false` on the phase, game ends with Good winning (`winner: "Good"`, `victoryConditionKey: "assassination-failed"`).
